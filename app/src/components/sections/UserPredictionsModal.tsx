import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Stack,
  useTheme,
} from '@mui/material';
import { Close, EmojiEvents, SportsSoccer } from '@mui/icons-material';
import { getUserPredictions } from '../../services/apiClient';
import type { UserPredictionResult } from '../../services/apiClient';

interface UserPredictionsModalProps {
  open: boolean;
  userId: string | null;
  displayName: string;
  onClose: () => void;
}

function pointsColor(pts: number): 'success' | 'warning' | 'default' | 'error' {
  if (pts >= 5) return 'success';
  if (pts === 3) return 'success';
  if (pts === 1) return 'warning';
  return 'default';
}

function pointsLabel(pts: number): string {
  if (pts >= 5) return `+${pts} ⭐`;
  if (pts === 3) return `+${pts}`;
  if (pts === 1) return `+${pts}`;
  return '0';
}

export function UserPredictionsModal({ open, userId, displayName, onClose }: UserPredictionsModalProps) {
  const theme = useTheme();
  const [predictions, setPredictions] = useState<UserPredictionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    setError(null);
    getUserPredictions(userId)
      .then(setPredictions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar predicciones'))
      .finally(() => setLoading(false));
  }, [open, userId]);

  const totalPoints = predictions.reduce((s, p) => s + p.pointsEarned, 0);
  const exactos = predictions.filter((p) => p.pointsEarned >= 3).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <EmojiEvents sx={{ color: theme.palette.warning.main }} />
          <span>{displayName}</span>
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
        ) : predictions.length === 0 ? (
          <Alert severity="info">No hay predicciones finalizadas aún.</Alert>
        ) : (
          <>
            {/* Summary chips */}
            <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<EmojiEvents sx={{ fontSize: 14 }} />}
                label={`${totalPoints} puntos`}
                color="secondary"
                size="small"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                icon={<SportsSoccer sx={{ fontSize: 14 }} />}
                label={`${predictions.length} predicciones`}
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${exactos} exactos`}
                color="warning"
                size="small"
              />
            </Stack>

            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                      Partido
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                      Real
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                      Pred.
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                      Pts
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {predictions.map((p) => {
                    const isExact =
                      p.predictedHome === p.homeScore && p.predictedAway === p.awayScore;
                    return (
                      <TableRow
                        key={p.matchId}
                        sx={{
                          backgroundColor: isExact
                            ? `${theme.palette.success.main}10`
                            : 'transparent',
                          '&:hover': { backgroundColor: `${theme.palette.primary.main}10` },
                        }}
                      >
                        <TableCell sx={{ py: 1.25, fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 'inherit' }}>
                            {p.homeTeam} vs {p.awayTeam}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                            {p.stage}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 1.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {p.homeScore}–{p.awayScore}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 1.25 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              color: isExact ? theme.palette.success.main : 'text.secondary',
                            }}
                          >
                            {p.predictedHome}–{p.predictedAway}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 1.25 }}>
                          <Chip
                            label={pointsLabel(p.pointsEarned)}
                            color={pointsColor(p.pointsEarned)}
                            size="small"
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
