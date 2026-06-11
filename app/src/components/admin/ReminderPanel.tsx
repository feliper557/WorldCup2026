import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  useTheme,
} from '@mui/material';
import { sendReminders, type SendRemindersResponse } from '../../services/apiClient';

function todayColombiaISO(): string {
  const now = new Date();
  // Colombia = UTC-5
  const col = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return col.toISOString().slice(0, 10);
}

export function ReminderPanel() {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>(todayColombiaISO());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendRemindersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const raw: any = await sendReminders(selectedDate);
      // Normalizar PascalCase del backend
      const normalized: SendRemindersResponse = {
        matchesToday: raw.MatchesToday ?? raw.matchesToday ?? 0,
        activeUsers: raw.ActiveUsers ?? raw.activeUsers ?? 0,
        usersNotified: raw.UsersNotified ?? raw.usersNotified ?? 0,
        usersAlreadyComplete: raw.UsersAlreadyComplete ?? raw.usersAlreadyComplete ?? 0,
        message: raw.Message ?? raw.message ?? '',
        details: (raw.Details ?? raw.details ?? []).map((d: any) => ({
          userId: d.UserId ?? d.userId ?? '',
          email: d.Email ?? d.email ?? '',
          displayName: d.DisplayName ?? d.displayName ?? '',
          missingCount: d.MissingCount ?? d.missingCount ?? 0,
          notified: d.Notified ?? d.notified ?? false,
        })),
      };
      setResult(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error enviando recordatorios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Descripción */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Enviar recordatorios
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Selecciona una fecha y envía un recordatorio a todos los usuarios activos que aún no han
          predicho uno o más partidos de ese día. A cada uno se le enviará un correo con los partidos pendientes.
        </Typography>
        <TextField
          label="Fecha"
          type="date"
          value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); setResult(null); }}
          size="small"
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2, mr: 2, minWidth: 180 }}
        />
        <Button
          variant="contained"
          size="large"
          onClick={handleSend}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
          sx={{ fontWeight: 700, textTransform: 'none', px: 4 }}
        >
          {loading ? 'Enviando...' : 'Enviar recordatorios ahora'}
        </Button>
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Resultado */}
      {result && (
        <Box>
          <Alert
            severity={result.usersNotified > 0 ? 'success' : 'info'}
            sx={{ mb: 3 }}
          >
            {result.message}
          </Alert>

          {/* Stats */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <StatCard label="Partidos hoy" value={result.matchesToday} color={theme.palette.warning.main} />
            <StatCard label="Usuarios activos" value={result.activeUsers} color={theme.palette.info.main} />
            <StatCard label="Recordatorios enviados" value={result.usersNotified} color={theme.palette.error.main} />
            <StatCard label="Ya al día" value={result.usersAlreadyComplete} color={theme.palette.success.main} />
          </Box>

          {/* Tabla de detalle */}
          {result.details.length > 0 && (
            <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Usuario</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Correo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Partidos pendientes</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.details.map((d) => (
                    <TableRow key={d.userId} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>{d.displayName}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{d.email}</TableCell>
                      <TableCell align="center">
                        {d.missingCount > 0 ? (
                          <Chip
                            label={d.missingCount}
                            size="small"
                            color="warning"
                            sx={{ fontWeight: 700, minWidth: 32 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {d.notified ? (
                          <Chip label="Notificado" size="small" color="success" />
                        ) : (
                          <Chip label="Al día" size="small" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Paper
      elevation={0}
      sx={{
        px: 3,
        py: 2,
        border: `1px solid`,
        borderColor: 'divider',
        borderRadius: 2,
        minWidth: 140,
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" fontWeight={800} sx={{ color }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}
