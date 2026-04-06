import { useState } from 'react';
import { getApiBase } from '../services/apiClient';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
  useTheme,
} from '@mui/material';
import { Lock, Email, Person } from '@mui/icons-material';

interface PaymentRegistrationFormProps {
  onSuccess?: () => void;
}

export function PaymentRegistrationForm({ onSuccess }: PaymentRegistrationFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  // Validaciones
  const isFormValid =
    name.trim().length >= 2 &&
    email.includes('@') &&
    password.length >= 8 &&
    password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Validar datos localmente
      if (!isFormValid) {
        setError('Por favor completa todos los campos correctamente');
        return;
      }

      // 2. Llamar a POST /api/auth/pre-register
      const apiUrl = getApiBase();
      const response = await fetch(`${apiUrl}/auth/pre-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al crear la cuenta');
        return;
      }

      // 3. Guardar userId temporalmente (para referencia)
      sessionStorage.setItem('preRegisterUserId', data.userId);
      sessionStorage.setItem('preRegisterEmail', email);

      // 4. Redirigir a checkout de Wompi
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error de conexión. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Nombre Completo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        margin="normal"
        disabled={loading}
        required
        inputProps={{ minLength: 2 }}
        slotProps={{
          input: {
            startAdornment: <Person sx={{ mr: 1, color: theme.palette.primary.main }} />,
          },
        }}
        placeholder="Juan Pérez"
      />

      <TextField
        fullWidth
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        margin="normal"
        disabled={loading}
        required
        slotProps={{
          input: {
            startAdornment: <Email sx={{ mr: 1, color: theme.palette.primary.main }} />,
          },
        }}
        placeholder="juan@example.com"
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
        inputProps={{ minLength: 8 }}
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
        error={confirmPassword.length > 0 && password !== confirmPassword}
        helperText={
          confirmPassword.length > 0 && password !== confirmPassword
            ? 'Las contraseñas no coinciden'
            : ''
        }
        slotProps={{
          input: {
            startAdornment: <Lock sx={{ mr: 1, color: theme.palette.primary.main }} />,
          },
        }}
      />

      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: theme.palette.text.secondary }}>
        💳 Se redirigirá a Wompi para completar el pago ($50.000 COP)
      </Typography>

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={!isFormValid || loading}
        sx={{ mt: 2, py: 1.5, fontSize: '1rem' }}
      >
        {loading ? <CircularProgress size={24} /> : 'Continuar al Pago'}
      </Button>

      <Typography
        variant="caption"
        sx={{ display: 'block', mt: 2, color: theme.palette.warning.main }}
      >
        ⚠️ Se cobrará $50.000 COP al completar tu registro
      </Typography>
    </Box>
  );
}
