import { Card, CardContent, Box, Typography, Chip, Stack, useTheme } from '@mui/material';
import { Assessment, EmojiEvents, WarningAmber } from '@mui/icons-material';
import type { Match, Prediction } from '../../types';
import { TeamCrest } from './TeamCrest';
import { getStageLabel } from '../../utils/stageLabels';

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

  const determinePointsColor = (points: number | null) => {
    if (points !== null && points >= 5) return 'success';
    if (points === 3) return 'success';
    if (points === 1) return 'warning';
    return 'default';
  };

  const determineWinner = () => {
    if (match.homeScoreFinal === null || match.awayScoreFinal === null) return null;
    if (match.homeScoreFinal > match.awayScoreFinal) return 'home';
    if (match.homeScoreFinal < match.awayScoreFinal) return 'away';
    return 'draw';
  };

  const winner = determineWinner();

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={getStageLabel(match.stage)} size="small" color="primary" />
          </Box>
          <Chip label={formattedDate} size="small" color="primary" />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
            <TeamCrest name={match.homeTeam} size={40} />
            <Box sx={{ minWidth: 0 }}>
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, justifyContent: 'flex-end', minWidth: 0, flex: 1 }}>
            <Box sx={{ minWidth: 0, textAlign: 'right' }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: winner === 'away' ? 700 : 500,
                  color: winner === 'away' ? theme.palette.secondary.main : theme.palette.text.primary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {match.awayTeam}
              </Typography>
            </Box>
            <TeamCrest name={match.awayTeam} size={40} />
          </Box>
        </Box>

        {prediction ? (
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{
              backgroundColor: `${theme.palette.primary.main}14`,
              p: 1.5,
              borderRadius: 1.5,
              borderLeft: `4px solid ${theme.palette.primary.main}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Assessment sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
              <Box>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: 'block', lineHeight: 1 }}>
                  Predicción
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {prediction.homeScorePred} - {prediction.awayScorePred}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <EmojiEvents sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
              <Chip
                label={`+${prediction.pointsAwarded ?? 0} pts${(prediction.pointsAwarded ?? 0) >= 5 ? ' ⭐' : ''}`}
                size="small"
                color={determinePointsColor(prediction.pointsAwarded) as any}
                sx={{ fontWeight: 700 }}
              />
            </Box>
          </Stack>
        ) : (
          <Chip
            icon={<WarningAmber sx={{ fontSize: 14 }} />}
            label="Sin predicción"
            size="small"
            variant="outlined"
          />
        )}
      </CardContent>
    </Card>
  );
}
