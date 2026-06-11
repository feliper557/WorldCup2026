import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  useTheme,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { applyChampion, type ApplyChampionResponse } from '../../services/apiClient';

export function ChampionAwardPanel() {
  const theme = useTheme();
  const [champion, setChampion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApplyChampionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!champion.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const raw: any = await applyChampion(champion.trim());
      const normalized: ApplyChampionResponse = {
        champion: raw.Champion ?? raw.champion ?? '',
        totalPredictions: raw.TotalPredictions ?? raw.totalPredictions ?? 0,
        winners: raw.Winners ?? raw.winners ?? 0,
        message: raw.Message ?? raw.message ?? '',
        details: (raw.Details ?? raw.details ?? []).map((d: any) => ({
          userId: d.UserId ?? d.userId ?? '',
          email: d.Email ?? d.email ?? '',
          displayName: d.DisplayName ?? d.displayName ?? '',
          predictedTeam: d.PredictedTeam ?? d.predictedTeam ?? '',
          isCorrect: d.IsCorrect ?? d.isCorrect ?? false,
          pointsAwarded: d.PointsAwarded ?? d.pointsAwarded ?? 0,
        })),
      };
      setResult(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error aplicando campeón');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{ p: 3, mb: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <EmojiEventsIcon sx={{ color: theme.palette.warning.main }} />
          <Typography variant="h6" fontWeight={700}>
            Aplicar campeón del Mundial
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Ingresa el campeón oficial. El sistema otorgará <strong>20 puntos</strong> a cada
          usuario que lo haya predicho correctamente. Esta operación es idempotente — puedes
          ejecutarla varias veces si necesitas corregir el campeón.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <TextField
            label="Campeón del Mundial"
            placeholder="Ej: Argentina"
            value={champion}
            onChange={(e) => { setChampion(e.target.value); setResult(null); }}
            size="small"
            sx={{ minWidth: 240 }}
          />
          <Button
            variant="contained"
            size="large"
            onClick={handleApply}
            disabled={loading || !champion.trim()}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <EmojiEventsIcon />}
            sx={{ fontWeight: 700, textTransform: 'none', px: 4 }}
          >
            {loading ? 'Aplicando...' : 'Otorgar 20 puntos'}
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {result && (
        <Box>
          <Alert severity={result.winners > 0 ? 'success' : 'info'} sx={{ mb: 3 }}>
            {result.message}
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <StatCard label="Total predicciones" value={result.totalPredictions} color={theme.palette.info.main} />
            <StatCard label="Ganadores (+20 pts)" value={result.winners} color={theme.palette.warning.main} />
            <StatCard label="No acertaron" value={result.totalPredictions - result.winners} color={theme.palette.text.disabled} />
          </Box>

          {result.details.length > 0 && (
            <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Usuario</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Predijo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Resultado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Puntos</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.details
                    .sort((a, b) => (b.isCorrect ? 1 : 0) - (a.isCorrect ? 1 : 0))
                    .map((d) => (
                      <TableRow key={d.userId} sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell>{d.displayName || d.userId}</TableCell>
                        <TableCell>{d.predictedTeam}</TableCell>
                        <TableCell align="center">
                          {d.isCorrect ? (
                            <Chip label="¡Acertó!" size="small" color="success" />
                          ) : (
                            <Chip label="No acertó" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {d.isCorrect ? (
                            <Typography fontWeight={800} color={theme.palette.warning.main}>
                              +{d.pointsAwarded}
                            </Typography>
                          ) : (
                            <Typography color="text.disabled">—</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Paper
      elevation={0}
      sx={{ px: 3, py: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 160, textAlign: 'center' }}
    >
      <Typography variant="h4" fontWeight={800} sx={{ color }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Paper>
  );
}
