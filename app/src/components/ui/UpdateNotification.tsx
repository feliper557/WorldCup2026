/// <reference types="vite-plugin-pwa/react" />
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Snackbar, Button, Box, Typography } from '@mui/material';
import { SystemUpdateAlt } from '@mui/icons-material';

export function UpdateNotification() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();

  return (
    <Snackbar
      open={needRefresh}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ mb: { xs: 2, sm: 3 } }}
      message={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SystemUpdateAlt sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Nueva versión disponible
          </Typography>
        </Box>
      }
      action={
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={() => updateServiceWorker(true)}
          sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.5, px: 1.5 }}
        >
          Actualizar
        </Button>
      }
    />
  );
}
