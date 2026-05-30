import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import {
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Typography,
  useTheme,
  Stack,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useAuthUser } from '../../hooks/useAuthUser';
import type { Score } from '../../types';

const UserPredictionsModal = lazy(() =>
  import('./UserPredictionsModal').then(m => ({ default: m.UserPredictionsModal }))
);

type SortBy = 'points' | 'predictions' | 'exactos' | 'alfabetico';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function getAvatarColors(rank: number): { bg: string; text: string } {
  const palettes = [
    { bg: '#F04C93', text: '#fff' },
    { bg: '#4CBFA6', text: '#fff' },
    { bg: '#F2A93B', text: '#1E1E1E' },
    { bg: '#6ED3B1', text: '#fff' },
    { bg: '#FF7AB8', text: '#fff' },
    { bg: '#F28C28', text: '#1E1E1E' },
    { bg: '#FFD166', text: '#1E1E1E' },
    { bg: '#2F8F7B', text: '#fff' },
  ];
  return palettes[(rank - 1) % palettes.length];
}

interface LeaderboardTableProps {
  ranking: Score[];
  loading: boolean;
  error: Error | null;
}

export function LeaderboardTable({ ranking, loading, error }: LeaderboardTableProps) {
  const theme = useTheme();
  const [visibleRows, setVisibleRows] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('points');
  const [selectedUser, setSelectedUser] = useState<{ userId: string; name: string } | null>(null);
  const { user } = useAuthUser();

  const currentUserId = user
    ? ('id' in user ? user.id : ('clientPrincipalId' in user ? user.clientPrincipalId : null))
    : null;

  const filteredAndSorted = useMemo(() => {
    let list = ranking.filter((p) => p && p.displayName);

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter((p) => (p.displayName || '').toLowerCase().includes(q));
    }

    switch (sortBy) {
      case 'predictions':
        return [...list].sort((a, b) => (b.totalPredictions || 0) - (a.totalPredictions || 0));
      case 'exactos':
        return [...list].sort((a, b) => (b.exactScores || 0) - (a.exactScores || 0));
      case 'alfabetico':
        return [...list].sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      default: // points
        return [...list].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    }
  }, [ranking, searchText, sortBy]);

  // Memoizado para evitar .map() en cada render
  const participants = useMemo(() => filteredAndSorted.map((score, idx) => ({
    rank: sortBy === 'points' ? (score.rank || idx + 1) : idx + 1,
    userId: score.userId,
    name: score.displayName || 'Unknown',
    avatar: ((score.displayName) || 'AN').substring(0, 2).toUpperCase(),
    predictions: score.totalPredictions || 0,
    exactos: score.exactScores || 0,
    ganadores: score.correctWinners || 0,
    points: score.totalPoints || 0,
  })), [filteredAndSorted, sortBy]);

  // Agregados memoizados — solo recalculan cuando cambia ranking
  const { totalExactos, totalGanadores, maxPts } = useMemo(() => ({
    totalExactos: ranking.reduce((s, p) => s + (p.exactScores || 0), 0),
    totalGanadores: ranking.reduce((s, p) => s + (p.correctWinners || 0), 0),
    maxPts: ranking.length > 0 ? Math.max(...ranking.map(p => p.totalPoints || 0)) : 0,
  }), [ranking]);

  // Posición del usuario actual — siempre por puntos, independiente del filtro/orden
  const myScore = useMemo(() => {
    if (!currentUserId) return null;
    return ranking.find((s) => s.userId === currentUserId) || null;
  }, [ranking, currentUserId]);

  const myRank = useMemo(() => {
    if (!myScore) return null;
    if (typeof myScore.rank === 'number' && myScore.rank > 0) return myScore.rank;
    const sorted = [...ranking].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    const idx = sorted.findIndex((s) => s.userId === currentUserId);
    return idx >= 0 ? idx + 1 : null;
  }, [ranking, myScore, currentUserId]);

  // Mostrar filas cuando los datos cargan o el filtro cambia
  useEffect(() => {
    setVisibleRows(participants.length);
  }, [participants.length]);

  if (error) {
    return (
      <Box component="section" sx={{ py: { xs: 4, sm: 6 }, px: { xs: 1, sm: 2 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 2 } }}>
          <Alert severity="error">Error al cargar el ranking: {error.message}</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box component="section" sx={{ py: { xs: 4, sm: 6 }, px: { xs: 1, sm: 2 } }}>
      <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 2 } }}>

        {/* Tu posición — pinned para no tener que hacer scroll */}
        {!loading && !error && myScore && myRank !== null && (
          <Paper
            elevation={0}
            onClick={() => setSelectedUser({ userId: myScore.userId, name: myScore.displayName || 'Tú' })}
            sx={{
              mb: 3,
              p: { xs: 1.75, sm: 2.5 },
              cursor: 'pointer',
              backgroundColor: `${theme.palette.secondary.main}12`,
              border: `1px solid ${theme.palette.secondary.main}40`,
              borderLeft: `4px solid ${theme.palette.secondary.main}`,
              borderRadius: 2,
              boxShadow: `0 4px 24px ${theme.palette.secondary.main}20`,
              transition: 'background-color 120ms ease, transform 120ms ease',
              '&:hover': {
                backgroundColor: `${theme.palette.secondary.main}1C`,
                transform: 'translateY(-1px)',
              },
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={{ xs: 1.25, sm: 2 }}
            >
              <Box sx={{ minWidth: { xs: 44, sm: 56 }, textAlign: 'center', flexShrink: 0 }}>
                {MEDALS[myRank] ? (
                  <Typography sx={{ fontSize: { xs: '1.6rem', sm: '2rem' }, lineHeight: 1 }}>
                    {MEDALS[myRank]}
                  </Typography>
                ) : (
                  <Typography sx={{ fontWeight: 800, color: theme.palette.secondary.main, fontSize: { xs: '1.4rem', sm: '1.9rem' }, lineHeight: 1 }}>
                    #{myRank}
                  </Typography>
                )}
              </Box>

              <Avatar
                sx={{
                  width: { xs: 38, sm: 44 },
                  height: { xs: 38, sm: 44 },
                  backgroundColor: theme.palette.secondary.main,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: { xs: '0.8rem', sm: '0.95rem' },
                  border: `2px solid ${theme.palette.secondary.main}`,
                  flexShrink: 0,
                }}
              >
                {(myScore.displayName || 'AN').substring(0, 2).toUpperCase()}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.secondary.main,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    fontSize: { xs: '0.6rem', sm: '0.65rem' },
                  }}
                >
                  Tu posición · de {ranking.length}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    mt: 0.25,
                    wordBreak: 'break-word',
                    lineHeight: 1.2,
                  }}
                >
                  {myScore.displayName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    color: theme.palette.text.secondary,
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    mt: 0.5,
                  }}
                >
                  {myScore.totalPredictions || 0} pred. · {myScore.exactScores || 0} exactos · {myScore.correctWinners || 0} ganadores
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.secondary.main,
                    fontSize: { xs: '1.3rem', sm: '1.8rem' },
                    lineHeight: 1,
                  }}
                >
                  {myScore.totalPoints || 0}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: { xs: '0.6rem', sm: '0.65rem' },
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Puntos
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 2.5, sm: 3 }} sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ width: 40, height: 40, borderRadius: 1, backgroundColor: `${theme.palette.primary.main}20`, color: theme.palette.primary.main, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
              🏆
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Ranking Competitivo
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                {ranking.length} participantes · Fase de grupos
              </Typography>
            </Box>
          </Stack>

          {ranking.length > 0 && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 3 }} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Chip label={String(totalExactos)} size="small" color="warning" sx={{ height: 24, fontSize: '0.7rem' }} />
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Exactos</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Chip label={String(totalGanadores)} size="small" color="warning" sx={{ height: 24, fontSize: '0.7rem' }} />
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Ganadores</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Typography variant="caption" sx={{ color: theme.palette.secondary.main, fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>{maxPts}</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Pts</Typography>
              </Stack>
            </Stack>
          )}
        </Stack>

        {/* Search + Sort */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ position: 'relative', flex: 1 }}>
            <Search sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'text.secondary', pointerEvents: 'none' }} />
            <Box
              component="input"
              type="search"
              placeholder="Buscar participante..."
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              sx={{
                width: '100%',
                height: 40,
                pl: 5,
                pr: 1.5,
                fontSize: '0.9rem',
                color: theme.palette.text.primary,
                backgroundColor: 'transparent',
                border: `1px solid ${theme.palette.primary.main}30`,
                borderRadius: 1,
                outline: 'none',
                fontFamily: 'inherit',
                '&:hover': { borderColor: `${theme.palette.primary.main}60` },
                '&:focus': { borderColor: theme.palette.primary.main, boxShadow: `0 0 0 2px ${theme.palette.primary.main}25` },
                '&::placeholder': { color: theme.palette.text.secondary, opacity: 0.7 },
              }}
            />
          </Box>
          <Box
            component="select"
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as SortBy)}
            aria-label="Ordenar por"
            sx={{
              minWidth: 190,
              height: 40,
              px: 1.5,
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              color: theme.palette.text.primary,
              backgroundColor: 'transparent',
              border: `1px solid ${theme.palette.primary.main}30`,
              borderRadius: 1,
              outline: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              '&:hover': { borderColor: `${theme.palette.primary.main}60` },
              '&:focus': { borderColor: theme.palette.primary.main, boxShadow: `0 0 0 2px ${theme.palette.primary.main}25` },
              '& option': { color: theme.palette.text.primary, backgroundColor: theme.palette.background.paper },
            }}
          >
            <option value="points">Ordenar por: Puntos</option>
            <option value="predictions">Ordenar por: Predicciones</option>
            <option value="exactos">Ordenar por: Exactos</option>
            <option value="alfabetico">Ordenar por: Alfabético</option>
          </Box>
        </Stack>

        {/* Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : participants.length === 0 ? (
          <Alert severity="info">No se encontraron participantes</Alert>
        ) : (
          <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <TableContainer
              component={Paper}
              sx={{
                backgroundColor: '#1A1A1A',
                border: `1px solid ${theme.palette.primary.main}15`,
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                minWidth: { xs: '100%', sm: 'auto' },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 40%, ${theme.palette.warning.main} 70%, ${theme.palette.primary.light} 100%)`,
                },
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(0,0,0,0.3)', borderBottom: `1px solid ${theme.palette.primary.main}15` }}>
                    <TableCell sx={{ width: 50, py: { xs: 1.5, sm: 2 }, px: { xs: 0.75, sm: 1 } }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.text.secondary, fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>#</Typography>
                    </TableCell>
                    <TableCell sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 0.75, sm: 1 } }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.text.secondary, fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>Participante</Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, py: 2, px: 1, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.text.secondary, fontSize: '0.7rem' }}>Pred.</Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, py: 2, px: 1, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.text.secondary, fontSize: '0.7rem' }}>Exactos</Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, py: 2, px: 1, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.text.secondary, fontSize: '0.7rem' }}>Ganadores</Typography>
                    </TableCell>
                    <TableCell sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 0.75, sm: 1 }, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.text.secondary, fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>Puntos</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {participants.map((p, idx) => {
                    const isVisible = idx < visibleRows;
                    const medal = sortBy === 'points' ? MEDALS[p.rank] : undefined;
                    const avatarColors = getAvatarColors(p.rank);
                    const isMe = !!(currentUserId && p.userId === currentUserId);

                    return (
                      <TableRow
                        key={p.userId}
                        onClick={() => setSelectedUser({ userId: p.userId, name: p.name })}
                        sx={{
                          cursor: 'pointer',
                          borderBottom: `1px solid ${theme.palette.primary.main}08`,
                          borderLeft: isMe ? `3px solid ${theme.palette.secondary.main}` : '3px solid transparent',
                          animation: isVisible ? `slideUp 0.5s ease-out ${idx * 55}ms forwards` : 'none',
                          opacity: isVisible ? 1 : 0,
                          backgroundColor: isMe
                            ? `${theme.palette.secondary.main}12`
                            : p.rank <= 3
                            ? p.rank === 1 ? `${theme.palette.secondary.main}10` : `${theme.palette.primary.main}08`
                            : 'transparent',
                          '&:hover': { backgroundColor: isMe ? `${theme.palette.secondary.main}1C` : `${theme.palette.primary.main}12` },
                          '@keyframes slideUp': {
                            from: { opacity: 0, transform: 'translateY(20px)' },
                            to: { opacity: 1, transform: 'translateY(0)' },
                          },
                        }}
                      >
                        <TableCell sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 0.75, sm: 1 }, textAlign: 'center' }}>
                          {medal
                            ? <Typography sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>{medal}</Typography>
                            : <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{p.rank}</Typography>
                          }
                        </TableCell>

                        <TableCell sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 0.75, sm: 1 } }}>
                          <Stack direction="row" alignItems="flex-start" spacing={{ xs: 0.75, sm: 1 }}>
                            <Avatar sx={{ width: 36, height: 36, backgroundColor: isMe ? theme.palette.secondary.main : avatarColors.bg, color: isMe ? '#fff' : avatarColors.text, fontWeight: 700, fontSize: '0.75rem', border: isMe ? `2px solid ${theme.palette.secondary.main}` : p.rank <= 3 ? `2px solid ${avatarColors.bg}` : 'none', flexShrink: 0 }}>
                              {p.avatar}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                                <Typography variant="body2" sx={{ fontWeight: isMe || p.rank <= 3 ? 700 : 500, color: isMe ? theme.palette.secondary.main : theme.palette.text.primary, fontSize: { xs: '0.85rem', sm: '0.875rem' }, wordBreak: 'break-word' }}>
                                  {p.name}
                                </Typography>
                                {isMe && <Chip label="Eres tú" size="small" color="secondary" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />}
                              </Box>
                              {/* Mobile stats */}
                              <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'flex', sm: 'none' }, mt: 0.75, flexWrap: 'wrap' }}>
                                <Chip label={`${p.exactos}E`} size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />
                                <Chip label={`${p.ganadores}G`} size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.65rem', alignSelf: 'center' }}>{p.predictions}p</Typography>
                              </Stack>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, py: 2, px: 1, textAlign: 'center', color: theme.palette.text.secondary, fontSize: '0.85rem' }}>
                          {p.predictions}
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, py: 2, px: 1, textAlign: 'center' }}>
                          <Chip label={p.exactos} size="small" color="warning" sx={{ height: 22, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, py: 2, px: 1, textAlign: 'center' }}>
                          <Chip label={p.ganadores} size="small" color="warning" sx={{ height: 22, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 0.75, sm: 1 }, textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: isMe ? theme.palette.secondary.main : theme.palette.secondary.main, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                            {p.points}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Container>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {!!selectedUser && (
        <Suspense fallback={null}>
          <UserPredictionsModal
            open={!!selectedUser}
            userId={selectedUser?.userId ?? null}
            displayName={selectedUser?.name ?? ''}
            onClose={() => setSelectedUser(null)}
          />
        </Suspense>
      )}
    </Box>
  );
}
