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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  OutlinedInput,
  FormHelperText,
} from '@mui/material';
import { Send, ContentCopy, Check } from '@mui/icons-material';
import type { InvitationRequest, Invitation } from '../../types/admin';

interface InvitationFormProps {
  onSubmit: (data: InvitationRequest) => Promise<void>;
  invitations: Invitation[];
  loading?: boolean;
}

interface SuccessData {
  link: string;
  invitationCode: string;
  expiresAt: string;
}

export function InvitationForm({ onSubmit, invitations, loading = false }: InvitationFormProps) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [notificationChannel, setNotificationChannel] = useState('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');

  // Validar email
  const isValidEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  // Validar teléfono
  const isValidPhoneNumber = (value: string): boolean => {
    const phoneRegex = /^\+\d{7,15}$/;
    return phoneRegex.test(value.replace(/\s/g, ''));
  };

  // Sanitizar email
  const sanitizeEmail = (value: string): string => {
    return value.trim().toLowerCase().replace(/[<>"']/g, '');
  };

  // Validar formulario
  const validateForm = (): boolean => {
    setSubmitError('');
    setEmailError('');
    setPhoneError('');

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

    // 4. Si es WhatsApp, validar teléfono
    if (notificationChannel === 'whatsapp') {
      if (!phoneNumber || phoneNumber.trim() === '') {
        setPhoneError('El teléfono es requerido para enviar por WhatsApp');
        return false;
      }

      if (!isValidPhoneNumber(phoneNumber)) {
        setPhoneError('Formato de teléfono inválido. Use: +573001234567');
        return false;
      }
    }

    return true;
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

      const requestData: any = {
        email: sanitizedEmail,
        notificationChannel,
      };

      if (notificationChannel === 'whatsapp') {
        requestData.phoneNumber = phoneNumber;
      }

      // Para mantener compatibilidad con la API actual
      const legacyData: InvitationRequest = {
        displayName: sanitizedEmail.split('@')[0],
        email: sanitizedEmail,
      };

      await onSubmit(legacyData);

      // Si la API actual devuelve datos de invitación, mostrarlos
      // Por ahora mostramos un mensaje de éxito simple
      setSuccessData({
        link: '',
        invitationCode: '',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      setEmail('');
      setPhoneNumber('');
      setNotificationChannel('email');

      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccessData(null), 5000);
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
              <Stack spacing={1}>
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
                    <Typography variant="body2">
                      <strong>Enlace:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <OutlinedInput
                        value={successData.link}
                        readOnly
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <Tooltip title={copiedLink ? 'Copiado!' : 'Copiar'}>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(successData.link)}
                          color={copiedLink ? 'success' : 'default'}
                        >
                          {copiedLink ? <Check /> : <ContentCopy />}
                        </IconButton>
                      </Tooltip>
                    </Box>
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

            <FormControl fullWidth size="small">
              <InputLabel>Canal de Notificación</InputLabel>
              <Select
                value={notificationChannel}
                onChange={(e) => {
                  setNotificationChannel(e.target.value);
                  setPhoneError('');
                }}
                label="Canal de Notificación"
                disabled={submitting}
              >
                <MenuItem value="email">📧 Email</MenuItem>
                <MenuItem value="whatsapp">💬 WhatsApp</MenuItem>
              </Select>
              <FormHelperText>Cómo se notificará al usuario</FormHelperText>
            </FormControl>

            {notificationChannel === 'whatsapp' && (
              <TextField
                label="Teléfono *"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onBlur={() => {
                  if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
                    setPhoneError('Formato inválido');
                  }
                }}
                error={Boolean(phoneError)}
                helperText={phoneError || 'Formato: +573001234567'}
                fullWidth
                placeholder="+573001234567"
                size="small"
                disabled={submitting}
              />
            )}

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
      {invitations.length > 0 && (
        <Card
          sx={{
            borderLeft: `4px solid ${theme.palette.secondary.main}`,
            backgroundColor: theme.palette.background.paper,
            boxShadow: 1,
          }}
        >
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
                    <TableCell sx={{ fontWeight: 600 }}>Fecha Envío</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Expira</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id} sx={{ '&:hover': { backgroundColor: `${theme.palette.primary.main}08` } }}>
                      <TableCell sx={{ color: theme.palette.text.primary }}>{invitation.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(invitation.status)}
                          size="small"
                          sx={{
                            borderColor: getStatusColor(invitation.status),
                            color: getStatusColor(invitation.status),
                          }}
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
