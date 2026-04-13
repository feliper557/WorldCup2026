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
  IconButton,
  Tooltip,
  OutlinedInput,
} from '@mui/material';
import { Send, ContentCopy, Check, WhatsApp, Refresh } from '@mui/icons-material';
import type { InvitationRequest, Invitation, CreateInvitationResponse } from '../../types/admin';

interface InvitationFormProps {
  onSubmit: (data: InvitationRequest) => Promise<CreateInvitationResponse>;
  onResend: (invitationId: string) => Promise<{ link: string }>;
  invitations: Invitation[];
  loading?: boolean;
}

export function InvitationForm({ onSubmit, onResend, invitations, loading = false }: InvitationFormProps) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<CreateInvitationResponse | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  // Validar email
  const isValidEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  // Sanitizar email
  const sanitizeEmail = (value: string): string => {
    return value.trim().toLowerCase().replace(/[<>"']/g, '');
  };

  // Validar formulario
  const validateForm = (): boolean => {
    setSubmitError('');
    setEmailError('');

    // 1. Email requerido
    if (!email || email.trim() === '') {
      setEmailError('El email es requerido');
      return false;
    }

    // 2. Email válido
    if (!isValidEmail(email)) {
      setEmailError('Email inválido. Por favor, ingrese un email válido');
      return false;
    }

    // 3. Email máximo 254 caracteres
    if (email.length > 254) {
      setEmailError('El email es demasiado largo');
      return false;
    }

    return true;
  };

  // Compartir por WhatsApp
  const shareWhatsApp = (link: string) => {
    const msg = encodeURIComponent(
      `¡Hola! Te invito a la polla mundialista de Francachela 🏆⚽\n\nRegístrate aquí:\n${link}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  // Copiar al portapapeles
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback para navegadores viejos
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleResend = async (invitationId: string) => {
    setResendingId(invitationId);
    setResendError(null);
    try {
      const result = await onResend(invitationId);
      if (result.link) shareWhatsApp(result.link);
    } catch (err: any) {
      setResendError(err.message?.replace('API Error: 400 - ', '') || 'Error al reenviar');
    } finally {
      setResendingId(null);
    }
  };

  // Calcular tiempo de expiración
  const getExpirationInfo = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const hoursLeft = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60));
    return hoursLeft > 0 ? `${hoursLeft} horas` : 'Expirada';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const sanitizedEmail = sanitizeEmail(email);

      const result = await onSubmit({ displayName: sanitizedEmail.split('@')[0], email: sanitizedEmail });
      setSuccessData(result);
      setEmail('');
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Error enviando invitación'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: Invitation['status']) => {
    switch (status) {
      case 'pending':
        return theme.palette.warning.main;
      case 'used':
        return theme.palette.success.main;
      case 'expired':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getStatusLabel = (status: Invitation['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'used':
        return 'Usada';
      case 'expired':
        return 'Expirada';
      default:
        return 'Desconocido';
    }
  };

  return (
    <Stack spacing={3}>
      {/* Formulario */}
      <Card
        sx={{
          borderTop: `4px solid ${theme.palette.primary.main}`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: 1,
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            📧 Enviar Nueva Invitación
          </Typography>

          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              ⚠️ {submitError}
            </Alert>
          )}

          {successData && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Stack spacing={1.5}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ✅ Invitación creada correctamente
                </Typography>
                {successData.invitationCode && (
                  <Typography variant="body2">
                    <strong>Código:</strong> {successData.invitationCode}
                  </Typography>
                )}
                {successData.link && (
                  <>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <OutlinedInput
                        value={successData.link}
                        readOnly
                        size="small"
                        sx={{ flex: 1, fontSize: '0.75rem' }}
                      />
                      <Tooltip title={copiedLink ? '¡Copiado!' : 'Copiar enlace'}>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(successData.link)}
                          color={copiedLink ? 'success' : 'default'}
                        >
                          {copiedLink ? <Check /> : <ContentCopy />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<WhatsApp />}
                      onClick={() => shareWhatsApp(successData.link)}
                      sx={{
                        backgroundColor: '#25D366',
                        color: '#fff',
                        fontWeight: 600,
                        textTransform: 'none',
                        alignSelf: 'flex-start',
                        '&:hover': { backgroundColor: '#1ebe5d' },
                      }}
                    >
                      Enviar por WhatsApp
                    </Button>
                  </>
                )}
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  ⏰ Expira en: {getExpirationInfo(successData.expiresAt)}
                </Typography>
              </Stack>
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Correo Electrónico *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                if (email && !isValidEmail(email)) {
                  setEmailError('Email inválido');
                }
              }}
              error={Boolean(emailError)}
              helperText={emailError || 'usuario@ejemplo.com'}
              fullWidth
              placeholder="usuario@ejemplo.com"
              size="small"
              disabled={submitting}
            />

            <Button
              variant="contained"
              color="primary"
              startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
              disabled={submitting || loading || !email}
              type="submit"
              sx={{ fontWeight: 600 }}
            >
              {submitting ? 'Creando invitación...' : 'Crear Invitación'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Lista de invitaciones */}
      <Card
        sx={{
          borderLeft: `4px solid ${theme.palette.secondary.main}`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: 1,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📋 Invitaciones Enviadas
            </Typography>
            <Chip label={`${invitations.length} total`} size="small" variant="outlined" />
          </Box>

          {resendError && <Alert severity="error" sx={{ mb: 1.5, py: 0.5 }}>{resendError}</Alert>}

          {invitations.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                No hay invitaciones enviadas aún
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: `${theme.palette.primary.main}15` }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Fecha envío</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Expira</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invitations
                    .slice()
                    .sort((a, b) => new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime())
                    .map((invitation) => (
                    <TableRow key={invitation.id} sx={{ '&:hover': { backgroundColor: `${theme.palette.primary.main}08` } }}>
                      <TableCell sx={{ color: theme.palette.text.primary, fontSize: '0.82rem' }}>
                        {invitation.email}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(invitation.status)}
                          size="small"
                          sx={{
                            borderColor: getStatusColor(invitation.status),
                            color: getStatusColor(invitation.status),
                            fontWeight: 600,
                            fontSize: '0.72rem',
                          }}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary, fontSize: '0.82rem' }}>
                        {new Date(invitation.createdAtUtc).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: invitation.status === 'expired' ? theme.palette.error.main : theme.palette.text.secondary }}>
                        {getExpirationInfo(invitation.expiresAtUtc)}
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 0.5 }}>
                        <Tooltip title="Reenviar invitación">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleResend(invitation.id)}
                              disabled={resendingId === invitation.id}
                              color="primary"
                            >
                              {resendingId === invitation.id
                                ? <CircularProgress size={16} />
                                : <Refresh fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
