import React, { useEffect, useRef, useState } from 'react';
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
} from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';

interface Participant {
  rank: number;
  name: string;
  avatar: string;
  predictions: number;
  exactos: number;
  ganadores: number;
  points: number;
}

const PARTICIPANTS: Participant[] = [
  { rank: 1, name: 'Daniela Rodríguez', avatar: 'DR', predictions: 48, exactos: 9, ganadores: 21, points: 187 },
  { rank: 2, name: 'Camilo Herrera', avatar: 'CH', predictions: 48, exactos: 7, ganadores: 24, points: 171 },
  { rank: 3, name: 'Valentina Ospina', avatar: 'VO', predictions: 48, exactos: 8, ganadores: 19, points: 163 },
  { rank: 4, name: 'Sebastián Torres', avatar: 'ST', predictions: 46, exactos: 6, ganadores: 22, points: 154 },
  { rank: 5, name: 'Mariana Gómez', avatar: 'MG', predictions: 47, exactos: 5, ganadores: 23, points: 148 },
  { rank: 6, name: 'Andrés Morales', avatar: 'AM', predictions: 45, exactos: 6, ganadores: 20, points: 142 },
  { rank: 7, name: 'Laura Castillo', avatar: 'LC', predictions: 48, exactos: 4, ganadores: 22, points: 136 },
  { rank: 8, name: 'Felipe Vargas', avatar: 'FV', predictions: 44, exactos: 5, ganadores: 18, points: 129 },
  { rank: 9, name: 'Natalia Jiménez', avatar: 'NJ', predictions: 46, exactos: 3, ganadores: 21, points: 121 },
  { rank: 10, name: 'Mateo Sánchez', avatar: 'MS', predictions: 43, exactos: 4, ganadores: 17, points: 115 },
  { rank: 11, name: 'Isabella Peña', avatar: 'IP', predictions: 45, exactos: 3, ganadores: 19, points: 109 },
  { rank: 12, name: 'Juan Ramírez', avatar: 'JR', predictions: 42, exactos: 2, ganadores: 20, points: 102 },
  { rank: 13, name: 'Sofía Mendoza', avatar: 'SM', predictions: 40, exactos: 3, ganadores: 16, points: 95 },
  { rank: 14, name: 'Tomás Guerrero', avatar: 'TG', predictions: 38, exactos: 2, ganadores: 15, points: 87 },
  { rank: 15, name: 'Alejandra Cruz', avatar: 'AC', predictions: 36, exactos: 1, ganadores: 14, points: 79 },
  { rank: 16, name: 'Nicolás Flores', avatar: 'NF', predictions: 35, exactos: 1, ganadores: 13, points: 71 },
  { rank: 17, name: 'Gabriela Ríos', avatar: 'GR', predictions: 30, exactos: 0, ganadores: 11, points: 55 },
  { rank: 18, name: 'Diego Medina', avatar: 'DM', predictions: 28, exactos: 0, ganadores: 9, points: 45 },
];

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
  return { bg: palettes[(rank - 1) % palettes.length].bg, text: palettes[(rank - 1) % palettes.length].text };
}

export function LeaderboardTable() {
  const theme = useTheme();
  const [visibleRows, setVisibleRows] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            let count = 0;
            const interval = setInterval(() => {
              count++;
              setVisibleRows(count);
              if (count >= PARTICIPANTS.length) clearInterval(interval);
            }, 55);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    if (tableRef.current) observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box component="section" sx={{ py: { xs: 4, sm: 6 }, px: { xs: 1, sm: 2 } }}>
      <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 2 } }}>
        {/* Section Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 2.5, sm: 3 }} sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                backgroundColor: `${theme.palette.primary.main}20`,
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
              }}
            >
              🏆
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Ranking Competitivo
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                {PARTICIPANTS.length} participantes · Fase de grupos
              </Typography>
            </Box>
          </Stack>

          {/* Legend */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 3 }} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Chip label="12" size="small" color="warning" sx={{ height: 24, fontSize: '0.7rem' }} />
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                Exactos
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Chip label="20" size="small" color="warning" sx={{ height: 24, fontSize: '0.7rem' }} />
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                Ganadores
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Typography variant="caption" sx={{ color: theme.palette.secondary.main, fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
                150
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                Pts
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        {/* Table Container */}
        <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <TableContainer
            component={Paper}
            ref={tableRef}
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
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 40%, ${theme.palette.warning.main} 70%, ${theme.palette.primary.light} 100%)`,
              },
            }}
          >
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderBottom: `1px solid ${theme.palette.primary.main}15`,
                }}
              >
                <TableCell sx={{ width: 50, py: { xs: 1.5, sm: 2 }, px: { xs: 0.75, sm: 1 } }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.text.secondary, fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                    #
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 0.75, sm: 1 } }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.text.secondary, fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                    Participante
                  </Typography>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, py: 2, px: 1, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
                    Pred.
                  </Typography>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, py: 2, px: 1, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
                    Exactos
                  </Typography>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, py: 2, px: 1, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
                    Ganadores
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 0.75, sm: 1 }, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.text.secondary, fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                    Puntos
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {PARTICIPANTS.map((p, idx) => {
                const isVisible = idx < visibleRows;
                const medal = MEDALS[p.rank];
                const avatarColors = getAvatarColors(p.rank);

                return (
                  <TableRow
                    key={p.rank}
                    sx={{
                      borderBottom: `1px solid ${theme.palette.primary.main}08`,
                      animation: isVisible ? `slideUp 0.5s ease-out ${idx * 55}ms forwards` : 'none',
                      opacity: isVisible ? 1 : 0,
                      backgroundColor:
                        p.rank <= 3
                          ? p.rank === 1
                            ? `${theme.palette.secondary.main}10`
                            : `${theme.palette.primary.main}08`
                          : 'transparent',
                      '&:hover': {
                        backgroundColor: `${theme.palette.primary.main}12`,
                      },
                      '@keyframes slideUp': {
                        from: { opacity: 0, transform: 'translateY(20px)' },
                        to: { opacity: 1, transform: 'translateY(0)' },
                      },
                    }}
                  >
                    <TableCell sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 0.75, sm: 1 }, textAlign: 'center' }}>
                      {medal ? (
                        <Typography sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>{medal}</Typography>
                      ) : (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {p.rank}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 0.75, sm: 1 } }}>
                      <Stack direction="row" alignItems="flex-start" spacing={{ xs: 0.75, sm: 1 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: avatarColors.bg,
                            color: avatarColors.text,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            border: p.rank <= 3 ? `2px solid ${avatarColors.bg}` : 'none',
                            flexShrink: 0,
                          }}
                        >
                          {p.avatar}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: p.rank <= 3 ? 600 : 500,
                              color: theme.palette.text.primary,
                              fontSize: { xs: '0.85rem', sm: '0.875rem' },
                              wordBreak: 'break-word',
                            }}
                          >
                            {p.name}
                          </Typography>
                          <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'flex', sm: 'none' }, mt: 0.75, flexWrap: 'wrap' }}>
                            <Chip
                              label={`${p.exactos}E`}
                              size="small"
                              color="warning"
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                            <Chip
                              label={`${p.ganadores}G`}
                              size="small"
                              color="warning"
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                color: theme.palette.text.secondary,
                                fontSize: '0.65rem',
                                alignSelf: 'center',
                              }}
                            >
                              {p.predictions}p
                            </Typography>
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
                      <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.secondary.main, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
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

        {/* Points System */}
        <PointsSystem />
      </Container>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
}

function PointsSystem() {
  const theme = useTheme();

  const items = [
    { label: 'Resultado exacto', pts: '+15 pts', icon: '🎯', color: theme.palette.warning.main },
    { label: 'Ganador correcto', pts: '+7 pts', icon: '✅', color: theme.palette.primary.main },
    { label: 'Campeón mundial', pts: '+25 pts', icon: '🏆', color: theme.palette.warning.main },
    { label: 'Goleador top', pts: '+10 pts', icon: '⚽', color: theme.palette.secondary.main },
  ];

  return (
    <Paper
      sx={{
        mt: 4,
        p: { xs: 2, sm: 3 },
        backgroundColor: `rgba(30,30,30,0.6)`,
        border: `1px solid ${theme.palette.primary.main}15`,
        backdropFilter: 'blur(8px)',
        borderRadius: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>🌮</Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.primary.main, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
          Sistema de Puntos
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {items.map((item) => (
          <Paper
            key={item.label}
            sx={{
              p: { xs: 1.5, sm: 2 },
              backgroundColor: 'rgba(37,37,37,0.6)',
              border: `1px solid ${theme.palette.primary.main}10`,
              display: 'flex',
              gap: 1,
              borderRadius: 1.5,
            }}
          >
            <Typography sx={{ fontSize: { xs: '1rem', sm: '1.2rem' }, flexShrink: 0 }}>{item.icon}</Typography>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  color: item.color,
                  fontWeight: 700,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  display: 'block',
                }}
              >
                {item.pts}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  display: 'block',
                  mt: 0.25,
                  lineHeight: 1.2,
                  fontSize: { xs: '0.6rem', sm: '0.7rem' },
                  wordBreak: 'break-word',
                }}
              >
                {item.label}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </Paper>
  );
}
