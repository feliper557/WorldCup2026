import { Card, CardContent, Box, Typography, Avatar, Chip, Stack, useTheme } from '@mui/material';
import type { Match, Prediction } from '../../types';

interface ResultCardProps {
  match: Match;
  prediction?: Prediction;
}

export function ResultCard({ match, prediction }: ResultCardProps) {
  const theme = useTheme();
  const finishDate = new Date(match.kickoffAtUtc);
  const formattedDate = finishDate.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    timeZone: 'America/Bogota',
  });

  // Detectar si es La Liga (DEMO)
  const isDemo = match.stage?.toUpperCase().includes('REGULAR') || !match.tournamentId?.includes('2026');

  const determinePointsColor = (points: number | null) => {
    if (points === 3) return 'success';
    if (points === 1) return 'warning';
    return 'default';
  };

  const getAvatarColor = (initial: string) => {
    const colors = [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.warning.main];
    return colors[initial.charCodeAt(0) % colors.length];
  };

  const determineWinner = () => {
    if (match.homeScoreFinal === null || match.awayScoreFinal === null) return null;
    if (match.homeScoreFinal > match.awayScoreFinal) return 'home';
    if (match.homeScoreFinal < match.awayScoreFinal) return 'away';
    return 'draw';
  };

  const winner = determineWinner();

  return (
    <Card sx={{ mb: 2, backgroundColor: theme.palette.background.paper }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={match.stage} size="small" color="primary" />
            {isDemo && <Chip label="🎯 DEMO" size="small" color="warning" sx={{ fontWeight: 600 }} />}
          </Box>
          <Chip label={formattedDate} size="small" color="primary" />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: winner === 'home' ? 700 : 500,
                  color: winner === 'home' ? theme.palette.secondary.main : theme.palette.text.primary,
                }}
              >
                {match.homeTeam}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'center', px: 2 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: theme.palette.secondary.main,
              }}
            >
              {match.homeScoreFinal ?? '-'} - {match.awayScoreFinal ?? '-'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: winner === 'away' ? 700 : 500,
                  color: winner === 'away' ? theme.palette.secondary.main : theme.palette.text.primary,
                }}
              >
                {match.awayTeam}
              </Typography>
            </Box>
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

        {prediction ? (
          <Stack direction="row" spacing={2} sx={{ backgroundColor: `${theme.palette.primary.main}20`, p: 1.5, borderRadius: 1, borderLeft: `4px solid ${theme.palette.primary.main}` }}>
            <Box>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                📊 Predicción:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {prediction.homeScorePred} - {prediction.awayScorePred}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                🎯 Puntos:
              </Typography>
              <Chip
                label={`+${prediction.pointsAwarded ?? 0} pts`}
                size="small"
                color={determinePointsColor(prediction.pointsAwarded) as any}
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Stack>
        ) : (
          <Chip label="⚠️ Sin predicción" size="small" variant="outlined" />
        )}
      </CardContent>
    </Card>
  );
}
