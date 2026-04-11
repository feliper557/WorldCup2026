import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  useTheme,
} from '@mui/material';
import { Person, Lock, Phone } from '@mui/icons-material';
import { getApiBase } from '../services/apiClient';
import { FrancachelaLogo } from '../components/FrancachelaLogo';

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const code = searchParams.get('code');
  const navigate = useNavigate();
  const theme = useTheme();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)` }}>
        <Paper sx={{ p: 4, maxWidth: 450, width: '100%', mx: 2, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2, color: theme.palette.error.main }}>
            Enlace inválido
          </Typography>
          <Typography sx={{ mb: 3 }}>
            Este enlace de registro no es válido. Solicita una nueva invitación.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/login')}>
            Ir al Login
          </Button>
        </Paper>
      </Box>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (firstName.trim().length < 2) {
      setError('Los nombres deben tener al menos 2 caracteres');
      return;
    }
    if (lastName.trim().length < 2) {
      setError('Los apellidos deben tener al menos 2 caracteres');
      return;
    }
    if (phoneNumber.trim().length < 7) {
      setError('Ingresa un número de celular válido');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = getApiBase();
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, code, firstName, lastName, phoneNumber, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Error al registrar');
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)` }}>
        <Paper sx={{ p: 4, maxWidth: 450, width: '100%', mx: 2, textAlign: 'center', borderTop: `5px solid ${theme.palette.secondary.main}` }}>
          <Typography variant="h5" sx={{ mb: 2, color: theme.palette.success.main, fontWeight: 600 }}>
            Registro exitoso
          </Typography>
          <Typography sx={{ mb: 3 }}>
            Tu cuenta ha sido creada. Ya puedes iniciar sesión.
          </Typography>
          <Button variant="contained" size="large" fullWidth onClick={() => navigate('/login')} sx={{ py: 1.5 }}>
            Iniciar Sesión
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`,
      }}
    >
      <Paper
        elevation={12}
        sx={{
          p: 4,
          maxWidth: 450,
          width: '100%',
          mx: 2,
          borderTop: `5px solid ${theme.palette.secondary.main}`,
          borderBottom: `5px solid ${theme.palette.warning.main}`,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <FrancachelaLogo variant="decorative" size={200} opacity={1} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
            Completa tu Registro
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
            Polla Mundialista — Francachela MX
          </Typography>
        </Box>

        <Divider sx={{ my: 2, borderColor: theme.palette.primary.main, opacity: 0.5 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nombres"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            margin="normal"
            disabled={loading}
            required
            slotProps={{
              input: {
                startAdornment: <Person sx={{ mr: 1, color: theme.palette.primary.main }} />,
              },
            }}
          />
          <TextField
            fullWidth
            label="Apellidos"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            margin="normal"
            disabled={loading}
            required
            slotProps={{
              input: {
                startAdornment: <Person sx={{ mr: 1, color: theme.palette.primary.main }} />,
              },
            }}
          />
          <TextField
            fullWidth
            label="Número de Celular"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            margin="normal"
            disabled={loading}
            required
            type="tel"
            slotProps={{
              input: {
                startAdornment: <Phone sx={{ mr: 1, color: theme.palette.primary.main }} />,
              },
            }}
          />
          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            disabled={loading}
            required
            helperText="Mínimo 8 caracteres"
            slotProps={{
              input: {
                startAdornment: <Lock sx={{ mr: 1, color: theme.palette.primary.main }} />,
              },
            }}
          />
          <TextField
            fullWidth
            label="Confirmar Contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            disabled={loading}
            required
            slotProps={{
              input: {
                startAdornment: <Lock sx={{ mr: 1, color: theme.palette.primary.main }} />,
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            sx={{ py: 1.5, fontSize: '1rem', mt: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Registrarme'}
          </Button>
        </form>

        <Typography variant="caption" sx={{ display: 'block', mt: 3, textAlign: 'center', color: theme.palette.text.secondary }}>
          Al registrarte aceptas participar en la Polla Mundialista Francachela 2026
        </Typography>
      </Paper>
    </Box>
  );
}
