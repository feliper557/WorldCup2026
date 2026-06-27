import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Typography,
  Stack,
  TextField,
  MenuItem,
} from '@mui/material';
import { EditNote } from '@mui/icons-material';
import { getMatches, setMatchScore, type SetMatchScoreResponse } from '../../services/apiClient';
import type { Match } from '../../types';

export function CorrectScorePanel() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SetMatchScoreResponse | null>(null);

  useEffect(() => {
    getMatches()
      .then((data) => {
        const sorted = [...data].sort((a, b) => (a.kickoffAtUtc || '').localeCompare(b.kickoffAtUtc || ''));
        setMatches(sorted);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error cargando partidos'))
      .finally(() => setLoadingMatches(false));
  }, []);

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setResult(null);
    setError(null);
    const match = matches.find((m) => m.id === matchId);
    setHomeScore(match?.homeScoreFinal != null ? String(match.homeScoreFinal) : '');
    setAwayScore(match?.awayScoreFinal != null ? String(match.awayScoreFinal) : '');
  };

  const canSubmit = selectedMatchId !== '' && homeScore !== '' && awayScore !== '';

  const handleSubmit = async () => {
    if (!selectedMatch) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const data = await setMatchScore(selectedMatch.id, Number(homeScore), Number(awayScore));
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error corrigiendo el marcador');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 700 }}>
      <Card>
        <CardHeader
          avatar={<EditNote sx={{ fontSize: '2rem' }} />}
          title="Corregir Marcador"
          subheader="Corrige manualmente el resultado de un partido y recalcula los puntos de las predicciones"
        />
        <CardContent>
          {loadingMatches ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={3}>
              <TextField
                select
                label="Partido"
                value={selectedMatchId}
                onChange={(e) => handleSelectMatch(e.target.value)}
                fullWidth
                size="small"
              >
                {matches.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.homeTeam} {m.homeScoreFinal ?? '-'} vs {m.awayScoreFinal ?? '-'} {m.awayTeam} ({m.status})
                  </MenuItem>
                ))}
              </TextField>

              {selectedMatch && (
                <Stack direction="row" spacing={2}>
                  <TextField
                    label={selectedMatch.homeTeam}
                    type="number"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    fullWidth
                    size="small"
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    label={selectedMatch.awayTeam}
                    type="number"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    fullWidth
                    size="small"
                    inputProps={{ min: 0 }}
                  />
                </Stack>
              )}

              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : <EditNote />}
                fullWidth
                size="large"
              >
                {submitting ? 'Corrigiendo...' : 'Corregir Marcador'}
              </Button>

              {error && <Alert severity="error">{error}</Alert>}

              {result && (
                <Alert severity="success">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {result.message}
                  </Typography>
                  {result.homeTeam} {result.previousScore} → {result.newScore} {result.awayTeam}
                  <br />
                  {result.predictionsUpdated} predicciones recalculadas
                </Alert>
              )}

              <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic', display: 'block' }}>
                ℹ️ Esto marca el partido como FINALIZADO y recalcula los puntos de todos los usuarios que predijeron este partido.
              </Typography>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
