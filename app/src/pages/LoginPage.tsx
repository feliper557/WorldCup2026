import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, Divider, ToggleButton, ToggleButtonGroup, useTheme } from '@mui/material';
import { GitHub, AppRegistration } from '@mui/icons-material';
import { useAuthUser } from '../hooks/useAuthUser';
import { getLoginUrl } from '../services/auth';
import { FrancachelaWatermark, FrancachelaLogo } from '../components/FrancachelaLogo';

export function LoginPage() {
  const { user, loading } = useAuthUser();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const theme = useTheme();

  // Si ya está autenticado, redirigir a matches
  if (!loading && user) {
    return <Navigate to="/matches" replace />;
  }

  if (loading) {
    return null;
  }

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
      {/* Watermark decorativo */}
      <FrancachelaWatermark position="bottom-right" />
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

        {/* Toggle entre Login y Registro */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
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
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          {mode === 'login' ? (
            <>
              <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                Accede con tu cuenta GitHub
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<GitHub />}
                href={getLoginUrl('github')}
                color="primary"
                sx={{
                  width: '100%',
                  py: 1.5,
                  fontSize: '1rem',
                }}
              >
                Continuar con GitHub
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                Crea tu cuenta para participar
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AppRegistration />}
                href={getLoginUrl('github')}
                color="success"
                sx={{
                  width: '100%',
                  py: 1.5,
                  fontSize: '1rem',
                }}
              >
                Registrarse con GitHub
              </Button>
              <Typography variant="caption" sx={{ display: 'block', mt: 3, color: theme.palette.warning.main }}>
                ⚠️ Nota: El registro es por invitación únicamente. <br />
                Solicita acceso al administrador.
              </Typography>
            </>
          )}

          <Typography variant="caption" sx={{ display: 'block', mt: 3, color: theme.palette.text.secondary }}>
            🌎 Solo participantes autorizados
          </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
