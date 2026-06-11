import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button,
  Alert, CircularProgress, useTheme,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import { resetPasswordWithToken } from '../services/apiClient';
import { FrancachelaLogo } from '../components/FrancachelaLogo';

export function ResetPasswordPage() {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
        <Alert severity="error">Enlace inválido. Pide al administrador que genere uno nuevo.</Alert>
      </Box>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPasswordWithToken(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar la contraseña';
      if (msg.includes('usado') || msg.includes('expirado') || msg.includes('inválido')) {
        setError('Este enlace ya fue usado o ha expirado. Pide al administrador que genere uno nuevo.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        p: 2,
      }}
    >
      <Paper
        elevation={12}
        sx={{
          p: 4,
          maxWidth: 420,
          width: '100%',
          borderRadius: 3,
          borderTop: `5px solid ${theme.palette.secondary.main}`,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <FrancachelaLogo variant="decorative" size={200} opacity={1} />
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 }}>
            <LockResetIcon sx={{ fontSize: 36, color: theme.palette.secondary.main }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            Nueva contraseña
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Elige una contraseña segura de al menos 8 caracteres.
          </Typography>
        </Box>

        {success ? (
          <Alert severity="success">
            ¡Contraseña actualizada! Redirigiendo al login...
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TextField
              fullWidth
              label="Nueva contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              inputProps={{ minLength: 8 }}
            />
            <TextField
              fullWidth
              label="Confirmar contraseña"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 2, fontWeight: 700, textTransform: 'none' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Cambiar contraseña'}
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
}
