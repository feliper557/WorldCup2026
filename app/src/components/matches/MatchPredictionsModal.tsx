import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Table, TableHead,
  TableBody, TableRow, TableCell, Typography, Chip, Box, CircularProgress,
  Alert, Stack, useTheme,
} from '@mui/material';
import { Close, EmojiEvents, People } from '@mui/icons-material';
import { getMatchPredictions, type MatchPredictionEntry } from '../../services/apiClient';

interface Props {
  open: boolean;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  onClose: () => void;
}

function pointsColor(pts: number): 'success' | 'warning' | 'default' {
  if (pts >= 3) return 'success';
  if (pts === 1) return 'warning';
  return 'default';
}

export function MatchPredictionsModal({ open, matchId, homeTeam, awayTeam, homeScore, awayScore, onClose }: Props) {
  const theme = useTheme();
  const [entries, setEntries] = useState<MatchPredictionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    getMatchPredictions(matchId)
      .then(setEntries)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error al cargar predicciones'))
      .finally(() => setLoading(false));
  }, [open, matchId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <People sx={{ color: theme.palette.primary.main }} />
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              Predicciones del partido
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {homeTeam} {homeScore} – {awayScore} {awayTeam}
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', top: 12, right: 12 }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pb: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : entries.length === 0 ? (
          <Alert severity="info">Ningún usuario realizó predicción para este partido.</Alert>
        ) : (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
              {entries.length} predicción{entries.length !== 1 ? 'es' : ''} · ordenadas por cercanía al resultado
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                      #
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                      Usuario
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                      Predicción
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                      Pts
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((e, i) => {
                    const isExact = e.predictedHome === homeScore && e.predictedAway === awayScore;
                    return (
                      <TableRow
                        key={i}
                        sx={{
                          backgroundColor: isExact ? `${theme.palette.success.main}15` : 'transparent',
                          '&:hover': { backgroundColor: `${theme.palette.primary.main}10` },
                        }}
                      >
                        <TableCell sx={{ py: 1, color: 'text.secondary', fontSize: '0.75rem', width: 32 }}>
                          {i + 1}
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <Typography variant="body2" fontWeight={isExact ? 700 : 500} fontSize="0.82rem">
                            {e.displayName}
                            {isExact && ' 🎯'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              color: isExact ? theme.palette.success.main : 'text.primary',
                            }}
                          >
                            {e.predictedHome} – {e.predictedAway}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 1 }}>
                          <Chip
                            label={e.pointsEarned > 0 ? `+${e.pointsEarned}` : '0'}
                            color={pointsColor(e.pointsEarned)}
                            size="small"
                            icon={e.pointsEarned >= 5 ? <EmojiEvents sx={{ fontSize: '12px !important' }} /> : undefined}
                            sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
