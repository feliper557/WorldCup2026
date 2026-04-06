import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Typography,
  Stack,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
} from '@mui/material';
import { Cloud, CloudDone, CloudOff } from '@mui/icons-material';
import { useMatchSync } from '../../hooks/useMatchSync';
import type { SyncOptions } from '../../services/apiClient';

export function MatchSyncPanel() {
  const { loading, error, result, sync } = useMatchSync();
  const [showResult, setShowResult] = useState(false);
  const [competition, setCompetition] = useState<'laliga' | 'worldcup'>('laliga');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleSync = async () => {
    setShowResult(false);
    const options: SyncOptions = { competition };
    if (dateFrom) options.dateFrom = dateFrom;
    if (dateTo) options.dateTo = dateTo;
    await sync(options);
    setShowResult(true);
  };

  const competitionLabel = competition === 'worldcup' ? 'Mundial 2026' : 'La Liga';

  return (
    <Box sx={{ maxWidth: 700 }}>
      <Card>
        <CardHeader
          avatar={<Cloud sx={{ fontSize: '2rem' }} />}
          title="Sincronizar Partidos"
          subheader="Carga/actualiza los partidos desde Football-Data API"
        />
        <CardContent>
          <Stack spacing={3}>
            <Typography variant="body2" color="textSecondary">
              Selecciona la competición y el rango de fechas (opcional) para sincronizar los partidos.
            </Typography>

            {/* Competición selector */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Competición
              </Typography>
              <ToggleButtonGroup
                value={competition}
                exclusive
                onChange={(_, value) => {
                  if (value) setCompetition(value);
                }}
                fullWidth
              >
                <ToggleButton value="laliga" sx={{ textTransform: 'none' }}>
                  ⚽ La Liga
                </ToggleButton>
                <ToggleButton value="worldcup" sx={{ textTransform: 'none' }}>
                  🏆 Mundial 2026
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Date range selector */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Rango de fechas (opcional)
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Desde"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Hasta"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  fullWidth
                />
              </Stack>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Deja en blanco para sincronizar todos los partidos de la competición
              </Typography>
            </Box>

            {/* Sync button */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleSync}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Cloud />}
              fullWidth
              size="large"
            >
              {loading ? 'Sincronizando...' : `Sincronizar ${competitionLabel}`}
            </Button>

            {/* Error alert */}
            {error && (
              <Alert severity="error">
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Error en la sincronización
                </Typography>
                {error.message}
              </Alert>
            )}

            {/* Result alert */}
            {showResult && result && (
              <Alert
                severity={result.success ? 'success' : 'warning'}
                icon={result.success ? <CloudDone /> : <CloudOff />}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  {result.message}
                </Typography>
                {result.matchesCount > 0 && (
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={`${result.matchesCount} partidos cargados`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Stack>
                )}
              </Alert>
            )}

            <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic', display: 'block' }}>
              ℹ️ La sincronización puede tomar unos segundos. Los partidos se crearán o actualizarán automáticamente en la base de datos.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
