import { Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuthUser } from '../../hooks/useAuthUser';

/**
 * Guard de autenticación - redirige a /login si no hay sesión
 * 
 * MODO DESARROLLO: Comentado para permitir acceso sin autenticación
 * En producción, descomentar la validación de usuario
 */
export function RequireAuth() {
  const { loading } = useAuthUser();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // MODO DESARROLLO: Permitir acceso sin autenticación
  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }

  return <Outlet />;
}
