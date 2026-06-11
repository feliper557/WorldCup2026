import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, Divider, useTheme, TextField, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Email, Lock, WhatsApp, InfoOutlined } from '@mui/icons-material';
import { useAuthUser } from '../hooks/useAuthUser';
import { loginWithCredentials } from '../services/auth';
import { forgotPassword } from '../services/apiClient';
import { FrancachelaWatermark, FrancachelaLogo } from '../components/FrancachelaLogo';

export function LoginPage() {
  const { user, loading } = useAuthUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResult, setForgotResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const theme = useTheme();
  const navigate = useNavigate();

  // Si ya está autenticado, redirigir a matches
  if (!loading && user) {
    return <Navigate to="/matches" replace />;
  }

  if (loading) {
    return null;
  }

  const handleForgotOpen = () => {
    setForgotEmail(email);
    setForgotResult(null);
    setForgotOpen(true);
  };

  const handleForgotSubmit = async () => {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setForgotResult(null);
    try {
      const res = await forgotPassword(forgotEmail.trim());
      setForgotResult({ type: 'success', msg: res.message });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al enviar el correo';
      const clean = msg.replace(/^API Error: \d+ - /, '');
      setForgotResult({ type: 'error', msg: clean });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await loginWithCredentials(email, password);
      if (response.success) {
        navigate('/matches');
      } else {
        setError(response.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle, ${theme.palette.secondary.main}20 0%, transparent 70%)`,
          borderRadius: '50%',
        },
      }}
    >
      <Paper
        elevation={12}
        sx={{
          p: 4,
          maxWidth: 450,
          width: '100%',
          mx: 2,
          position: 'relative',
          backgroundColor: theme.palette.background.paper,
          borderTop: `5px solid ${theme.palette.secondary.main}`,
          borderBottom: `5px solid ${theme.palette.warning.main}`,
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            bottom: -30,
            right: -30,
            opacity: 0.05,
            zIndex: 0,
          },
        }}
      >
        {/* Decoración superior */}
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 80,
            height: 80,
            background: `conic-gradient(${theme.palette.secondary.main}, ${theme.palette.warning.main}, ${theme.palette.primary.main})`,
            borderRadius: '50%',
            opacity: 0.8,
            filter: 'blur(20px)',
          }}
        />


        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 4, mt: 2 }}>
          {/* Logo Francachela */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <FrancachelaLogo variant="decorative" size={280} opacity={1} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1 }}>
            Polla Mundialista
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            Polla Mundialista — Francachela MX
          </Typography>
        </Box>

        <Divider sx={{ my: 3, borderColor: theme.palette.primary.main, opacity: 0.5 }} />

        {/* Toggle entre Login y Registro (Registro temporalmente oculto) */}
        {/* <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode !== null) {
                setMode(newMode);
              }
            }}
            sx={{ width: '100%' }}
          >
            <ToggleButton value="login" sx={{ flex: 1, fontWeight: 600 }}>
              Iniciar Sesión
            </ToggleButton>
            <ToggleButton value="register" sx={{ flex: 1, fontWeight: 600 }}>
              Registrarse
            </ToggleButton>
          </ToggleButtonGroup>
        </Box> */}

        <Box sx={{ textAlign: 'center' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleCredentialLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              variant="outlined"
              disabled={isLoading}
              required
              slotProps={{
                input: {
                  startAdornment: <Email sx={{ mr: 1, color: theme.palette.primary.main }} />,
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
              variant="outlined"
              disabled={isLoading}
              required
              slotProps={{
                input: {
                  startAdornment: <Lock sx={{ mr: 1, color: theme.palette.primary.main }} />,
                },
              }}
            />
            <Box sx={{ textAlign: 'right', mt: 0.5 }}>
              <Button
                size="small"
                onClick={handleForgotOpen}
                sx={{ textTransform: 'none', color: theme.palette.text.secondary, fontSize: '0.8rem' }}
              >
                ¿Olvidaste tu contraseña?
              </Button>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              sx={{
                py: 1.5,
                fontSize: '1rem',
                mt: 1,
              }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
            </Button>
          </form>

          <Button
            variant="contained"
            color="success"
            startIcon={<WhatsApp />}
            fullWidth
            onClick={() => {
              const message = encodeURIComponent(
                'Hola, me gustaría registrarme en Francachela Polla Mundial 2026 🎉'
              );
              const whatsappUrl = `https://wa.me/573133195197?text=${message}`;
              window.open(whatsappUrl, '_blank');
            }}
            sx={{
              py: 1.5,
              fontSize: '1rem',
              mt: 2,
              fontWeight: 600,
            }}
          >
            Registrarme por WhatsApp
          </Button>

          <Button
            variant="outlined"
            startIcon={<InfoOutlined />}
            fullWidth
            onClick={() => navigate('/info')}
            sx={{
              py: 1.5,
              fontSize: '0.95rem',
              mt: 1.5,
              fontWeight: 600,
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                backgroundColor: `${theme.palette.primary.main}08`,
              },
            }}
          >
            Más Información
          </Button>

          <Typography variant="caption" sx={{ display: 'block', mt: 3, color: theme.palette.text.secondary }}>
            🌎 Solo participantes autorizados
          </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Dialog — Olvidé mi contraseña */}
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>🔑 Restablecer contraseña</DialogTitle>
        <DialogContent>
          {forgotResult ? (
            <Alert severity={forgotResult.type} sx={{ mt: 1 }}>
              {forgotResult.msg}
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña (válido 30 minutos).
              </Typography>
              <TextField
                fullWidth
                label="Correo electrónico"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                disabled={forgotLoading}
                autoFocus
                size="small"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForgotOpen(false)}>
            {forgotResult?.type === 'success' ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!forgotResult && (
            <Button
              variant="contained"
              onClick={handleForgotSubmit}
              disabled={forgotLoading || !forgotEmail.trim()}
              startIcon={forgotLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {forgotLoading ? 'Enviando...' : 'Enviar enlace'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
