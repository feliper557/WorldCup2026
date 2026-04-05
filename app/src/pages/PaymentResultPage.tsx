import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Alert,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

export function PaymentResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const transactionId = searchParams.get('id');
  const reference = searchParams.get('reference');

  useEffect(() => {
    // Simular verificación del pago (en realidad lo verifica Wompi vía webhook)
    const timer = setTimeout(() => {
      if (transactionId) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [transactionId]);

  if (status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography>Procesando pago...</Typography>
      </Box>
    );
  }

  if (status === 'success') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          px: 2,
        }}
      >
        <CheckCircleIcon
          sx={{
            fontSize: 80,
            color: theme.palette.success.main,
            mb: 2,
          }}
        />

        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          ¡Pago Recibido!
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            mb: 1,
            maxWidth: 500,
          }}
        >
          Tu pago fue procesado exitosamente. Tu cuenta será activada en unos
          minutos y recibirás un correo de bienvenida con el link para iniciar
          sesión.
        </Typography>

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 2,
            color: theme.palette.text.disabled,
          }}
        >
          Referencia: {reference || transactionId}
        </Typography>

        <Alert severity="info" sx={{ mt: 3, maxWidth: 500 }}>
          Si no recibiste el correo en 5 minutos, revisa tu carpeta de spam o
          intenta iniciar sesión directamente.
        </Alert>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{ minWidth: 160 }}
          >
            Ir a Login
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{ minWidth: 160 }}
          >
            Volver al Inicio
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        px: 2,
      }}
    >
      <ErrorIcon
        sx={{
          fontSize: 80,
          color: theme.palette.error.main,
          mb: 2,
        }}
      />

      <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
        Error en el Pago
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: theme.palette.text.secondary,
          mb: 3,
          maxWidth: 500,
        }}
      >
        No pudimos procesar tu pago. Por favor intenta de nuevo.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={() => navigate('/login')}
          sx={{ minWidth: 160 }}
        >
          Reintentar
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
          sx={{ minWidth: 160 }}
        >
          Cancelar
        </Button>
      </Box>
    </Box>
  );
}
