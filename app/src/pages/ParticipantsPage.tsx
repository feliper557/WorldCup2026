import { useState, useMemo } from 'react';
import {
  Box,
  Container,
  CircularProgress,
  Alert,
  TextField,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { HeroParticipants } from '../components/sections';
import { useRanking } from '../hooks/useRanking';
import { useAuthUser } from '../hooks/useAuthUser';

type SortBy = 'points' | 'predictions' | 'exactos' | 'alfabetico';

export function ParticipantsPage() {
  const { ranking, loading, error } = useRanking();
  const { user } = useAuthUser();
  const theme = useTheme();
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('points');

  const filteredAndSorted = useMemo(() => {
    // Filtrar participantes válidos (con displayName)
    let filtered = ranking.filter((p) => p && p.displayName);

    // Filtrar por búsqueda
    filtered = filtered.filter((p) =>
      (p.displayName || '').toLowerCase().includes(searchText.toLowerCase())
    );

    switch (sortBy) {
      case 'points':
        return filtered.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
      case 'predictions':
        return filtered.sort((a, b) => (b.totalPredictions || 0) - (a.totalPredictions || 0));
      case 'exactos':
        return filtered.sort((a, b) => (b.exactScores || 0) - (a.exactScores || 0));
      case 'alfabetico':
        return filtered.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      default:
        return filtered;
    }
  }, [ranking, searchText, sortBy]);

  const isCurrentUser = (userId: string) => {
    if (!user) return false;
    // Para JWT users (UserProfile)
    if ('id' in user) {
      return user.id === userId;
    }
    // Para GitHub users (ClientPrincipal)
    if ('clientPrincipalId' in user) {
      return user.clientPrincipalId === userId;
    }
    return false;
  };

  const getAvatarLabel = (name: string | undefined) => {
    if (!name) return 'AN';
    return name.split(' ').map((n) => n.charAt(0)).join('').toUpperCase().substring(0, 2);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Error cargando participantes: {error.message}</Alert>;
  }

  return (
    <Box>
      {/* Hero Section */}
      <HeroParticipants
        participantCount={ranking.length}
        leaderPoints={ranking.length > 0 ? ranking[0].totalPoints : undefined}
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Tabla de Participantes
          </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Buscar participante"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            fullWidth
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: theme.palette.text.primary,
                '& fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: theme.palette.text.primary }}>Ordenar por</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              label="Ordenar por"
              sx={{
                color: theme.palette.text.primary,
              }}
            >
              <MenuItem value="points">Puntos</MenuItem>
              <MenuItem value="predictions">Predicciones</MenuItem>
              <MenuItem value="exactos">Exactos</MenuItem>
              <MenuItem value="alfabetico">Alfabético</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {filteredAndSorted.length === 0 ? (
        <Alert severity="info">No se encontraron participantes</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ backgroundColor: theme.palette.primary.main }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 50, color: theme.palette.background.paper }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600, color: theme.palette.background.paper }}>Participante</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.background.paper }}>
                  Predicciones
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.background.paper }}>
                  Exactos
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.background.paper }}>
                  Ganadores
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.background.paper }}>
                  Puntos
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSorted.map((participant) => {
                if (!participant) return null;
                return (
                <TableRow
                  key={participant.userId}
                  sx={{
                    backgroundColor: isCurrentUser(participant.userId) ? `${theme.palette.secondary.main}20` : 'inherit',
                    borderLeft: isCurrentUser(participant.userId) ? `4px solid ${theme.palette.secondary.main}` : '4px solid transparent',
                    '&:hover': {
                      backgroundColor: isCurrentUser(participant.userId) ? `${theme.palette.secondary.main}30` : `${theme.palette.primary.main}15`,
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                    {participant.rank === 1 && '🥇'}
                    {participant.rank === 2 && '🥈'}
                    {participant.rank === 3 && '🥉'}
                    {participant.rank > 3 && participant.rank}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: theme.palette.secondary.main,
                          color: theme.palette.background.paper,
                          fontWeight: 600,
                        }}
                      >
                        {getAvatarLabel(participant.displayName)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {participant.displayName || 'Unknown'}
                        </Typography>
                        {isCurrentUser(participant.userId) && <Chip label="Eres tú" size="small" color="secondary" />}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{participant.totalPredictions || 0}</TableCell>
                  <TableCell align="right">
                    <Chip label={participant.exactScores || 0} size="small" color="success" />
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={participant.correctWinners || 0} size="small" color="warning" />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem', color: theme.palette.secondary.main }}>
                    {participant.totalPoints || 0}
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      </Container>
    </Box>
  );
}
