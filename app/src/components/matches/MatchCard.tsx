import { useState, useEffect, memo } from 'react';
import { Card, CardContent, Box, Typography, Chip, Button, Badge, Alert, useTheme, Snackbar } from '@mui/material';
import { Edit as EditIcon, SportsSoccer, AccessTime, FiberManualRecord } from '@mui/icons-material';
import type { Match, Prediction } from '../../types';
import { getTimeUntilMatch, getCountdownColor } from '../../utils/dateUtils';
import { getTeamDisplayName } from '../../utils/teamAssets';
import { getStageLabel } from '../../utils/stageLabels';
import { getMatches } from '../../services/apiClient';
import { TeamCrest } from './TeamCrest';

interface MatchCardProps {
  match: Match;
  prediction?: Prediction;
  onPredictClick: (match: Match) => void;
}

export const MatchCard = memo(function MatchCard({ match, prediction, onPredictClick }: MatchCardProps) {
  const theme = useTheme();
  const [countdown, setCountdown] = useState<{ label: string; msLeft: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Backend already stores times in Colombia time (UTC-5)
  // No conversion needed
  const kickoffDate = new Date(match.kickoffAtUtc);
  const formattedDate = kickoffDate.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  });

  // Timer solo para partidos dentro de las próximas 24h — evita N intervalos activos
  useEffect(() => {
    const update = () => setCountdown(getTimeUntilMatch(match.kickoffAtUtc));
    update();
    const msLeft = new Date(match.kickoffAtUtc).getTime() - Date.now();
    if (msLeft > 24 * 60 * 60 * 1000) return;
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [match.kickoffAtUtc]);

  // Verificar si la predicción está disponible (solo en estado SCHEDULED antes de la hora del partido)
  const now = new Date();
  const kickoffTime = new Date(match.kickoffAtUtc);
  const isPredictionAvailable = match.status === 'SCHEDULED' && now < kickoffTime;


  // Validar estado del partido antes de permitir predicción
  const handlePredictClick = async () => {
    try {
      // Obtener estado actual del partido desde el servidor
      const allMatches = await getMatches();
      const currentMatch = allMatches.find(m => m.id === match.id);

      if (!currentMatch) {
        setErrorMessage('Partido no encontrado');
        return;
      }

      // Verificar que siga en estado SCHEDULED
      if (currentMatch.status !== 'SCHEDULED') {
        setErrorMessage(`Partido en estado ${currentMatch.status} — predicción no disponible`);
        return;
      }

      // Verificar que no haya pasado su hora de inicio
      const now = new Date();
      const kickoff = new Date(currentMatch.kickoffAtUtc);
      if (kickoff <= now) {
        setErrorMessage('Partido ya inició — predicción cerrada');
        return;
      }

      // Todo bien, abrir modal
      onPredictClick(currentMatch);
    } catch (err) {
      setErrorMessage('Error verificando disponibilidad del partido');
      console.error('Error validating match:', err);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={getStageLabel(match.stage)} size="small" color="primary" />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              icon={<AccessTime sx={{ fontSize: 14 }} />}
              label={formattedDate}
              size="small"
              color="primary"
              variant="outlined"
            />
            {countdown && match.status === 'SCHEDULED' && countdown.msLeft <= 24 * 60 * 60 * 1000 && (
              <Chip
                label={countdown.label}
                size="small"
                color={getCountdownColor(countdown.msLeft)}
                sx={{ fontWeight: 700, animation: 'pulse 1.6s infinite' }}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
            <TeamCrest name={match.homeTeam} size={42} />
            <Typography variant="h6" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {getTeamDisplayName(match.homeTeam)}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center', px: 2, minWidth: 64 }}>
            {match.status === 'LIVE' && match.homeScoreFinal !== null && match.awayScoreFinal !== null ? (
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: theme.palette.error.main, letterSpacing: 2, lineHeight: 1 }}
              >
                {match.homeScoreFinal} - {match.awayScoreFinal}
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                vs
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, justifyContent: 'flex-end', minWidth: 0, flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {getTeamDisplayName(match.awayTeam)}
            </Typography>
            <TeamCrest name={match.awayTeam} size={42} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
          {prediction && (
            <Chip
              label={`Mi predicción: ${prediction.homeScorePred} - ${prediction.awayScorePred}`}
              size="small"
              color="success"
              sx={{ fontWeight: 700, fontSize: '0.8rem', cursor: isPredictionAvailable ? 'pointer' : 'default' }}
              onClick={isPredictionAvailable ? handlePredictClick : undefined}
              icon={isPredictionAvailable ? <EditIcon sx={{ fontSize: 14 }} /> : undefined}
            />
          )}

          {isPredictionAvailable && !prediction && (
            <Button
              variant="contained"
              size="small"
              color="secondary"
              onClick={handlePredictClick}
              startIcon={<SportsSoccer sx={{ fontSize: 16 }} />}
              sx={{ fontWeight: 600 }}
            >
              Predecir
            </Button>
          )}

          {match.status === 'LIVE' && (
            <Chip
              icon={<FiberManualRecord sx={{ fontSize: 10, animation: 'pulse 1s infinite' }} />}
              label="EN VIVO"
              size="small"
              color="error"
              sx={{ fontWeight: 700, letterSpacing: '0.08em' }}
            />
          )}
        </Box>
      </CardContent>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        message={errorMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Card>
  );
});
