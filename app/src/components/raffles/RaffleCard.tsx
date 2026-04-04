import { Card, CardContent, Box, Typography, Chip, Button, LinearProgress, Avatar, useTheme } from '@mui/material';
import { EmojiEventsOutlined } from '@mui/icons-material';
import type { Raffle } from '../../types';

interface RaffleCardProps {
  raffle: Raffle;
  onJoinClick: (raffle: Raffle) => void;
  isJoining?: boolean;
}

export function RaffleCard({ raffle, onJoinClick, isJoining = false }: RaffleCardProps) {
  const theme = useTheme();
  const drawDate = new Date(raffle.drawAtUtc);
  const formattedDate = drawDate.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const capacityPercent = raffle.maxParticipants
    ? Math.round((raffle.participantCount / raffle.maxParticipants) * 100)
    : 0;

  const getStatusColor = () => {
    switch (raffle.status) {
      case 'OPEN':
        return theme.palette.primary.main;
      case 'DRAWING':
        return theme.palette.warning.main;
      case 'COMPLETED':
        return theme.palette.secondary.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getStatusLabel = () => {
    switch (raffle.status) {
      case 'OPEN':
        return 'Abierta';
      case 'DRAWING':
        return 'Sorteando...';
      case 'COMPLETED':
        return 'Completada';
      default:
        return 'Desconocido';
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        position: 'relative',
        overflow: 'visible',
        backgroundColor: theme.palette.background.paper,
        borderLeft: `4px solid ${theme.palette.primary.main}`,
        boxShadow: 1,
      }}
    >
      <CardContent>
        {/* Header con estado y descripción */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <EmojiEventsOutlined sx={{ color: theme.palette.warning.main, fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                {raffle.title}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: theme.palette.text.primary, mb: 1 }}>
              {raffle.description}
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel()}
            sx={{
              borderColor: getStatusColor(),
              color: getStatusColor(),
              fontWeight: 600,
            }}
            variant="outlined"
            size="small"
          />
        </Box>

        {/* Premio */}
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            backgroundColor: `${theme.palette.warning.main}15`,
            border: `1px solid ${theme.palette.warning.main}30`,
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            🎁 Premio
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary, mt: 0.5 }}>
            {raffle.prize}
          </Typography>
        </Box>

        {/* Ganador (si está completada) */}
        {raffle.status === 'COMPLETED' && raffle.winnerId && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              backgroundColor: `${theme.palette.secondary.main}15`,
              border: `2px solid ${theme.palette.secondary.main}40`,
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              🏆 Ganador
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: theme.palette.secondary.main,
                  color: theme.palette.background.paper,
                  fontWeight: 600,
                }}
              >
                {raffle.winnerName?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                {raffle.winnerName}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Información de participantes */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Participantes
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {raffle.participantCount}
              {raffle.maxParticipants ? ` / ${raffle.maxParticipants}` : '+'}
            </Typography>
          </Box>
          {raffle.maxParticipants && (
            <LinearProgress
              variant="determinate"
              value={capacityPercent}
              sx={{
                height: 6,
                borderRadius: 1,
                backgroundColor: `${theme.palette.primary.main}20`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: theme.palette.primary.main,
                },
              }}
            />
          )}

          {/* Lista de participantes */}
          {raffle.participants.length > 0 && (
            <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {raffle.participants.map((participant) => (
                <Chip
                  key={participant.userId}
                  avatar={
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.background.paper,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {participant.displayName.charAt(0)}
                    </Avatar>
                  }
                  label={`${participant.displayName} (${participant.tickets})`}
                  size="small"
                  sx={{
                    borderColor: `${theme.palette.primary.main}40`,
                    color: theme.palette.text.primary,
                  }}
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Fecha del sorteo */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 2, borderBottom: `1px solid ${theme.palette.primary.main}15` }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            ⏰ Sorteo: {formattedDate}
          </Typography>
        </Box>

        {/* Botón de participar */}
        {raffle.status === 'OPEN' && (
          <Button
            variant="contained"
            fullWidth
            onClick={() => onJoinClick(raffle)}
            disabled={isJoining}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.background.paper,
              fontWeight: 600,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
              '&:disabled': {
                backgroundColor: `${theme.palette.primary.main}50`,
                color: theme.palette.text.secondary,
              },
            }}
          >
            {isJoining ? 'Participando...' : 'Participar en Sorteo'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
