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
    let filtered = ranking.filter((p) =>
      p.displayName.toLowerCase().includes(searchText.toLowerCase())
    );

    switch (sortBy) {
      case 'points':
        return filtered.sort((a, b) => b.totalPoints - a.totalPoints);
      case 'predictions':
        return filtered.sort((a, b) => b.totalPredictions - a.totalPredictions);
      case 'exactos':
        return filtered.sort((a, b) => b.exactScores - a.exactScores);
      case 'alfabetico':
        return filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));
      default:
        return filtered;
    }
  }, [ranking, searchText, sortBy]);

  const isCurrentUser = (userId: string) => {
    return user?.userId === userId;
  };

  const getAvatarLabel = (name: string) => {
    return name.split(' ').map((n) => n.charAt(0)).join('').toUpperCase();
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
      <HeroParticipants />

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
              {filteredAndSorted.map((participant) => (
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
                          {participant.displayName}
                        </Typography>
                        {isCurrentUser(participant.userId) && <Chip label="Eres tú" size="small" color="secondary" />}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{participant.totalPredictions}</TableCell>
                  <TableCell align="right">
                    <Chip label={participant.exactScores} size="small" color="success" />
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={participant.correctWinners} size="small" color="warning" />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem', color: theme.palette.secondary.main }}>
                    {participant.totalPoints}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      </Container>
    </Box>
  );
}
