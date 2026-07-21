import { Box, Container, Typography, useTheme, Stack, Paper, Avatar } from '@mui/material';
import { FrancachelaWatermark } from '../components/FrancachelaLogo';
import { FINAL_RANKING } from '../data/finalRanking';
import type { Score } from '../types';

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

function PodiumSpot({ score, rank, height }: { score: Score; rank: number; height: number }) {
  const theme = useTheme();
  const colors = getAvatarColors(rank);
  const initials = (score.displayName || 'AN').substring(0, 2).toUpperCase();

  return (
    <Stack alignItems="center" spacing={1} sx={{ flex: 1, maxWidth: 200 }}>
      <Typography sx={{ fontSize: rank === 1 ? '2.2rem' : '1.8rem', lineHeight: 1 }}>{MEDALS[rank]}</Typography>
      <Avatar
        sx={{
          width: rank === 1 ? 72 : 56,
          height: rank === 1 ? 72 : 56,
          backgroundColor: colors.bg,
          color: colors.text,
          fontWeight: 700,
          fontSize: rank === 1 ? '1.3rem' : '1rem',
          border: `3px solid ${colors.bg}`,
          boxShadow: `0 4px 20px ${colors.bg}55`,
        }}
      >
        {initials}
      </Avatar>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: { xs: '0.85rem', sm: '0.95rem' },
          color: theme.palette.text.primary,
          textAlign: 'center',
          wordBreak: 'break-word',
        }}
      >
        {score.displayName}
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: theme.palette.secondary.main }}>
        {score.totalPoints} pts
      </Typography>
      <Box
        sx={{
          width: '100%',
          height,
          mt: 1,
          borderRadius: '8px 8px 0 0',
          background: `linear-gradient(180deg, ${colors.bg}55 0%, ${colors.bg}22 100%)`,
          border: `1px solid ${colors.bg}55`,
          borderBottom: 'none',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          pt: 1.5,
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: colors.bg }}>#{rank}</Typography>
      </Box>
    </Stack>
  );
}

export function ClosingPage() {
  const theme = useTheme();

  const podium = FINAL_RANKING.slice(0, 3);
  const rest = FINAL_RANKING.slice(3, 10);

  return (
    <Box>
      {/* Hero de agradecimiento */}
      <Box
        component="section"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          pt: 10,
          pb: 6,
          textAlign: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(135deg, ${theme.palette.background.default}dd 0%, ${theme.palette.background.paper}99 100%)`,
            zIndex: 0,
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '20%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.12,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <FrancachelaWatermark position="center" />
        </Box>

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography sx={{ fontSize: '2.5rem', mb: 2 }}>🏆🎉</Typography>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '1.8rem', sm: '2.4rem', md: '2.8rem' },
              fontWeight: 700,
              lineHeight: 1.2,
              mb: 2,
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.warning.main} 60%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ¡Gracias por vivir la Polla Mundial 2026 con nosotros!
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              color: theme.palette.text.secondary,
              maxWidth: 560,
              mx: 'auto',
              lineHeight: 1.7,
            }}
          >
            El Mundial terminó y la Francachela MX Subachoque quiere agradecerte por cada
            predicción, cada partido y cada emoción compartida. Aquí está el podio final y
            el top 10 de esta edición. ¡Nos vemos en la próxima! 🌮⚽
          </Typography>
        </Container>
      </Box>

      {/* Podio */}
      <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
        <Stack
          direction="row"
          alignItems="flex-end"
          justifyContent="center"
          spacing={{ xs: 1, sm: 3 }}
          sx={{ mb: 6 }}
        >
          {podium[1] && <PodiumSpot score={podium[1]} rank={2} height={70} />}
          {podium[0] && <PodiumSpot score={podium[0]} rank={1} height={100} />}
          {podium[2] && <PodiumSpot score={podium[2]} rank={3} height={50} />}
        </Stack>

        {/* Top 10 (posiciones 4 a 10) */}
        {rest.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              backgroundColor: '#1A1A1A',
              border: `1px solid ${theme.palette.primary.main}15`,
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
            }}
          >
            {rest.map((score, idx) => {
              const rank = idx + 4;
              const colors = getAvatarColors(rank);
              return (
                <Stack
                  key={score.userId}
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{
                    px: { xs: 1.5, sm: 2.5 },
                    py: 1.5,
                    borderBottom: idx < rest.length - 1 ? `1px solid ${theme.palette.primary.main}10` : 'none',
                  }}
                >
                  <Typography sx={{ minWidth: 28, textAlign: 'center', fontWeight: 700, color: theme.palette.text.secondary, fontSize: '0.9rem' }}>
                    {rank}
                  </Typography>
                  <Avatar sx={{ width: 34, height: 34, backgroundColor: colors.bg, color: colors.text, fontWeight: 700, fontSize: '0.75rem' }}>
                    {(score.displayName || 'AN').substring(0, 2).toUpperCase()}
                  </Avatar>
                  <Typography sx={{ flex: 1, fontWeight: 500, fontSize: { xs: '0.85rem', sm: '0.9rem' }, color: theme.palette.text.primary, wordBreak: 'break-word' }}>
                    {score.displayName}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, color: theme.palette.secondary.main, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    {score.totalPoints} pts
                  </Typography>
                </Stack>
              );
            })}
          </Paper>
        )}
      </Container>
    </Box>
  );
}
