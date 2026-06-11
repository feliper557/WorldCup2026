import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';

export function EmailReminderNotice() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('showEmailReminderNotice') === 'true') {
      sessionStorage.removeItem('showEmailReminderNotice');
      setOpen(true);
    }
  }, []);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          borderTop: `4px solid ${theme.palette.secondary.main}`,
        },
      }}
    >
      <DialogContent sx={{ pt: 4, pb: 2, textAlign: 'center' }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: `${theme.palette.secondary.main}20`,
            mb: 2,
          }}
        >
          <MailOutlineIcon sx={{ fontSize: 28, color: theme.palette.secondary.main }} />
        </Box>

        <Typography variant="h6" fontWeight={700} gutterBottom>
          Revisa tu correo 📩
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
          Te enviamos un recordatorio con los partidos que te faltan por predecir.
        </Typography>

        <Box
          sx={{
            bgcolor: 'action.hover',
            borderRadius: 2,
            px: 2,
            py: 1.5,
            textAlign: 'left',
          }}
        >
          <Typography variant="body2" fontWeight={600} gutterBottom>
            ¿No lo ves en tu bandeja de entrada?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            Revisa la carpeta de <strong>spam o correo no deseado</strong> y márcalo como{' '}
            <strong>"No es spam"</strong> para que los próximos correos lleguen directo y no te pierdas ningún recordatorio.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={() => setOpen(false)}
          sx={{ fontWeight: 700, textTransform: 'none', px: 4, borderRadius: 2 }}
        >
          ¡Entendido!
        </Button>
      </DialogActions>
    </Dialog>
  );
}
