import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  useTheme,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { Send, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import type { InvitationRequest, Invitation } from '../../types/admin';

interface InvitationFormProps {
  onSubmit: (data: InvitationRequest) => Promise<void>;
  invitations: Invitation[];
  loading?: boolean;
}

interface EmailResult {
  email: string;
  status: 'success' | 'error';
  message: string;
}

export function InvitationForm({ onSubmit, invitations, loading = false }: InvitationFormProps) {
  const theme = useTheme();
  const [emailsText, setEmailsText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<EmailResult[]>([]);

  const isValidEmail = (value: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const sanitizeEmail = (value: string): string =>
    value.trim().toLowerCase().replace(/[<>"']/g, '');

  // Parsea el textarea: acepta coma, punto y coma, o nueva línea como separador
  const parseEmails = (): string[] => {
    return emailsText
      .split(/[\n,;]+/)
      .map(sanitizeEmail)
      .filter((e) => e.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = parseEmails();

    if (emails.length === 0) return;

    const invalid = emails.filter((e) => !isValidEmail(e));
    if (invalid.length > 0) {
      setResults([{ email: invalid[0], status: 'error', message: `Email inválido: ${invalid[0]}` }]);
      return;
    }

    setSubmitting(true);
    setResults([]);
    setProgress(0);

    const newResults: EmailResult[] = [];

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      try {
        await onSubmit({ displayName: email.split('@')[0], email });
        newResults.push({ email, status: 'success', message: 'Invitación enviada' });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al enviar';
        newResults.push({ email, status: 'error', message: msg });
      }
      setProgress(Math.round(((i + 1) / emails.length) * 100));
      setResults([...newResults]);
    }

    setSubmitting(false);

    const allOk = newResults.every((r) => r.status === 'success');
    if (allOk) {
      setEmailsText('');
      setTimeout(() => setResults([]), 8000);
    }
  };

  const getStatusColor = (status: Invitation['status']) => {
    switch (status) {
      case 'pending': return theme.palette.warning.main;
      case 'used': return theme.palette.success.main;
      case 'expired': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };

  const getStatusLabel = (status: Invitation['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'used': return 'Usada';
      case 'expired': return 'Expirada';
      default: return 'Desconocido';
    }
  };

  const getExpirationInfo = (expiresAt: string) => {
    const hoursLeft = Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60));
    return hoursLeft > 0 ? `${hoursLeft}h` : 'Expirada';
  };

  const emails = parseEmails();
  const successCount = results.filter((r) => r.status === 'success').length;
  const errorCount = results.filter((r) => r.status === 'error').length;

  return (
    <Stack spacing={3}>
      {/* Formulario */}
      <Card sx={{ borderTop: `4px solid ${theme.palette.primary.main}`, backgroundColor: theme.palette.background.paper, boxShadow: 1 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            📧 Enviar Invitaciones
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Correos Electrónicos"
              multiline
              rows={4}
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
              fullWidth
              placeholder={`usuario1@ejemplo.com\nusuario2@ejemplo.com\nusuario3@ejemplo.com`}
              helperText={
                emails.length > 0
                  ? `${emails.length} correo${emails.length > 1 ? 's' : ''} detectado${emails.length > 1 ? 's' : ''} — uno por línea, o separados por coma`
                  : 'Un correo por línea, o separados por coma o punto y coma'
              }
              disabled={submitting}
              size="small"
            />

            {/* Barra de progreso durante envío */}
            {submitting && (
              <Box>
                <LinearProgress variant="determinate" value={progress} sx={{ mb: 0.5 }} />
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  Enviando {Math.round(progress * emails.length / 100)} de {emails.length}...
                </Typography>
              </Box>
            )}

            {/* Resultados */}
            {results.length > 0 && (
              <Box>
                {successCount > 0 && (
                  <Alert severity="success" sx={{ mb: 1, py: 0.5 }}>
                    ✅ {successCount} invitación{successCount > 1 ? 'es' : ''} enviada{successCount > 1 ? 's' : ''} correctamente
                  </Alert>
                )}
                {errorCount > 0 && (
                  <Alert severity="error" sx={{ mb: 1, py: 0.5 }}>
                    ⚠️ {errorCount} error{errorCount > 1 ? 'es' : ''}:
                    {results.filter((r) => r.status === 'error').map((r) => (
                      <Box key={r.email} sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                        <strong>{r.email}</strong>: {r.message}
                      </Box>
                    ))}
                  </Alert>
                )}
                {/* Lista individual */}
                {results.length > 1 && (
                  <Stack spacing={0.5}>
                    {results.map((r) => (
                      <Box key={r.email} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.8rem' }}>
                        {r.status === 'success'
                          ? <CheckCircle sx={{ fontSize: 14, color: theme.palette.success.main }} />
                          : <ErrorIcon sx={{ fontSize: 14, color: theme.palette.error.main }} />
                        }
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{r.email}</Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Send />}
              disabled={submitting || loading || emails.length === 0}
              type="submit"
              sx={{ fontWeight: 600 }}
            >
              {submitting
                ? `Enviando ${progress}%...`
                : emails.length > 1
                  ? `Enviar ${emails.length} Invitaciones`
                  : 'Crear Invitación'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Lista de invitaciones */}
      {invitations.length > 0 && (
        <Card sx={{ borderLeft: `4px solid ${theme.palette.secondary.main}`, backgroundColor: theme.palette.background.paper, boxShadow: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              📋 Invitaciones Enviadas
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: `${theme.palette.primary.main}15` }}>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Expira</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id} sx={{ '&:hover': { backgroundColor: `${theme.palette.primary.main}08` } }}>
                      <TableCell sx={{ color: theme.palette.text.primary, fontSize: '0.85rem' }}>{invitation.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(invitation.status)}
                          size="small"
                          sx={{ borderColor: getStatusColor(invitation.status), color: getStatusColor(invitation.status) }}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem' }}>
                        {new Date(invitation.createdAtUtc).toLocaleDateString('es-CO')}
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem' }}>
                        {getExpirationInfo(invitation.expiresAtUtc)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
