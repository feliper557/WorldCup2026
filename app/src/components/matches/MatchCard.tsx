import { useState, useEffect } from 'react';
import { Card, CardContent, Box, Typography, Avatar, Chip, Button, Badge, Alert, useTheme, Snackbar } from '@mui/material';
import type { Match, Prediction } from '../../types';
import { getTimeUntilMatch } from '../../utils/dateUtils';
import { getMatches } from '../../services/apiClient';

interface MatchCardProps {
  match: Match;
  prediction?: Prediction;
  onPredictClick: (match: Match) => void;
}

export function MatchCard({ match, prediction, onPredictClick }: MatchCardProps) {
  const theme = useTheme();
  const [countdown, setCountdown] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const kickoffDate = new Date(match.kickoffAtUtc);

  // Convertir manualmente a hora colombiana (UTC-5)
  const colombiaDate = new Date(kickoffDate.getTime() - 5 * 60 * 60 * 1000);
  const formattedDate = colombiaDate.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Actualizar countdown cada segundo
  useEffect(() => {
    setCountdown(getTimeUntilMatch(match.kickoffAtUtc));
    const interval = setInterval(() => {
      setCountdown(getTimeUntilMatch(match.kickoffAtUtc));
    }, 1000);
    return () => clearInterval(interval);
  }, [match.kickoffAtUtc]);

  // Verificar si la predicción está disponible (solo en estado SCHEDULED y si faltan más de 1 minuto)
  const now = new Date();
  const cutoffTime = new Date(match.kickoffAtUtc);
  cutoffTime.setMinutes(cutoffTime.getMinutes() - 1);
  const isPredictionAvailable = match.status === 'SCHEDULED' && now < cutoffTime;

  // Detectar si es La Liga (DEMO)
  const isDemo = match.stage?.toUpperCase().includes('REGULAR') || !match.tournamentId?.includes('2026');

  const getAvatarColor = (initial: string) => {
    const colors = [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.warning.main];
    return colors[initial.charCodeAt(0) % colors.length];
  };

  // Validar estado del partido antes de permitir predicción
  const handlePredictClick = async () => {
    try {
      // Obtener estado actual del partido desde el servidor
      const allMatches = await getMatches();
      const currentMatch = allMatches.find(m => m.id === match.id);

      if (!currentMatch) {
        setErrorMessage('⚠️ Partido no encontrado');
        return;
      }

      // Verificar que siga en estado SCHEDULED
      if (currentMatch.status !== 'SCHEDULED') {
        setErrorMessage(`⚠️ Partido en estado ${currentMatch.status} - predicción no disponible`);
        return;
      }

      // Verificar que no haya pasado su hora de inicio
      const now = new Date();
      const kickoff = new Date(currentMatch.kickoffAtUtc);
      if (kickoff <= now) {
        setErrorMessage('⏳ Partido ya inició - predicción cerrada');
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
    <Card sx={{ mb: 2, backgroundColor: theme.palette.background.paper }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={match.stage} size="small" color="primary" />
            {isDemo && <Chip label="🎯 DEMO" size="small" color="warning" sx={{ fontWeight: 600 }} />}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={formattedDate} size="small" color="primary" />
            {countdown && match.status === 'SCHEDULED' && (
              <Chip
                label={countdown}
                size="small"
                color="success"
                sx={{ fontWeight: 600, animation: 'pulse 1s infinite' }}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                backgroundColor: getAvatarColor(match.homeTeam),
                fontWeight: 600,
              }}
            >
              {match.homeTeam.charAt(0)}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {match.homeTeam}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center', px: 2 }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
              vs
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {match.awayTeam}
            </Typography>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                backgroundColor: getAvatarColor(match.awayTeam),
                fontWeight: 600,
              }}
            >
              {match.awayTeam.charAt(0)}
            </Avatar>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            {prediction && (
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                badgeContent={
                  <Chip
                    label={`${prediction.homeScorePred}-${prediction.awayScorePred}`}
                    size="small"
                    color="success"
                    sx={{ fontWeight: 600 }}
                  />
                }
              >
                <Box />
              </Badge>
            )}
          </Box>

          {isPredictionAvailable && (
            <Button
              variant={prediction ? 'outlined' : 'contained'}
              size="small"
              color={prediction ? 'primary' : 'secondary'}
              onClick={handlePredictClick}
              sx={{ fontWeight: 600 }}
            >
              {prediction ? '✏️ Editar' : '⚽ Predecir'}
            </Button>
          )}

          {match.status === 'LIVE' && <Chip label="● EN VIVO" size="small" color="error" sx={{ animation: 'pulse 1s infinite' }} />}
        </Box>

        {!isPredictionAvailable && match.status === 'SCHEDULED' && (
          <Alert severity="warning" sx={{ mt: 1, backgroundColor: `${theme.palette.warning.main}20`, borderLeft: `4px solid ${theme.palette.warning.main}` }}>
            ⏳ Predicción cerrada - Solo disponible hasta 1 minuto antes del inicio
          </Alert>
        )}
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
}
