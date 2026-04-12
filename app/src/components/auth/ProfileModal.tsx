import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Box,
  Button,
  TextField,
  Typography,
  Tabs,
  Tab,
  Stack,
  Alert,
  Divider,
  CircularProgress,
  useTheme,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Person,
  Lock,
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { updateProfile, changePassword } from '../../services/apiClient';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
  onProfileUpdated?: (updated: any) => void;
}

export function ProfileModal({ open, onClose, user, onProfileUpdated }: ProfileModalProps) {
  const theme = useTheme();
  const [tab, setTab] = useState(0);

  // Datos personales
  const [firstName, setFirstName] = useState(user?.firstName || user?.FirstName || '');
  const [lastName, setLastName] = useState(user?.lastName || user?.LastName || '');
  const [displayName, setDisplayName] = useState(user?.displayName || user?.DisplayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || user?.PhoneNumber || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const email = user?.email || user?.Email || '';
  const initial = (displayName || email || '?').charAt(0).toUpperCase();

  const handleProfileSave = async () => {
    if (!displayName.trim()) {
      setProfileError('El nombre es requerido');
      return;
    }
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const updated = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      setProfileSuccess('Perfil actualizado correctamente');
      onProfileUpdated?.(updated);
    } catch (e: any) {
      setProfileError(e.message?.replace('API Error: 400 - ', '') || 'Error actualizando perfil');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Todos los campos son requeridos');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Contraseña cambiada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      const raw = e.message || '';
      const match = raw.match(/\d{3} - (.+)/);
      try {
        const parsed = JSON.parse(match?.[1] || raw);
        setPasswordError(parsed.error || 'Error cambiando contraseña');
      } catch {
        setPasswordError('Error cambiando contraseña');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleClose = () => {
    setProfileSuccess('');
    setProfileError('');
    setPasswordSuccess('');
    setPasswordError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 52,
              height: 52,
              fontSize: '1.4rem',
              fontWeight: 700,
            }}
          >
            {initial}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
              {displayName || 'Mi Perfil'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {email}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider />
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            px: 2,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', minHeight: 44 },
          }}
        >
          <Tab icon={<Person sx={{ fontSize: 16 }} />} iconPosition="start" label="Mis datos" />
          <Tab icon={<Lock sx={{ fontSize: 16 }} />} iconPosition="start" label="Contraseña" />
        </Tabs>
        <Divider />
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 2.5 }}>
        {/* TAB 0 — Datos personales */}
        {tab === 0 && (
          <Stack spacing={2}>
            {profileError && <Alert severity="error" sx={{ py: 0.5 }}>{profileError}</Alert>}
            {profileSuccess && <Alert severity="success" sx={{ py: 0.5 }}>{profileSuccess}</Alert>}

            <TextField
              label="Correo electrónico"
              value={email}
              disabled
              fullWidth
              size="small"
              helperText="El email no se puede cambiar"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label="Nombres"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Apellidos"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                fullWidth
                size="small"
              />
            </Box>

            <TextField
              label="Nombre para mostrar"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              fullWidth
              size="small"
              helperText="Así apareces en el ranking"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Teléfono / WhatsApp"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              fullWidth
              size="small"
              placeholder="+57 300 000 0000"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        )}

        {/* TAB 1 — Cambiar contraseña */}
        {tab === 1 && (
          <Stack spacing={2}>
            {passwordError && <Alert severity="error" sx={{ py: 0.5 }}>{passwordError}</Alert>}
            {passwordSuccess && <Alert severity="success" sx={{ py: 0.5 }}>{passwordSuccess}</Alert>}

            <TextField
              label="Contraseña actual"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowCurrent(v => !v)}>
                      {showCurrent ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Nueva contraseña"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              size="small"
              helperText="Mínimo 8 caracteres"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowNew(v => !v)}>
                      {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Confirmar nueva contraseña"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              size="small"
              error={!!confirmPassword && confirmPassword !== newPassword}
              helperText={!!confirmPassword && confirmPassword !== newPassword ? 'Las contraseñas no coinciden' : ''}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowConfirm(v => !v)}>
                      {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button onClick={handleClose} size="small" color="inherit">
          Cerrar
        </Button>
        {tab === 0 && (
          <Button
            variant="contained"
            size="small"
            onClick={handleProfileSave}
            disabled={profileLoading}
            startIcon={profileLoading ? <CircularProgress size={14} /> : undefined}
          >
            {profileLoading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        )}
        {tab === 1 && (
          <Button
            variant="contained"
            size="small"
            onClick={handlePasswordChange}
            disabled={passwordLoading}
            startIcon={passwordLoading ? <CircularProgress size={14} /> : undefined}
          >
            {passwordLoading ? 'Cambiando...' : 'Cambiar contraseña'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
