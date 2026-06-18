import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useNavigate } from 'react-router-dom';
import { getStoredToken } from '../../services/auth';

const DEADLINE = new Date('2026-06-19T04:59:59Z');
const SESSION_KEY = 'championReminderShown';

async function fetchHasChampion(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return true;
  try {
    const res = await fetch('/api/champion-prediction/me', {
      headers: { 'X-Auth-Token': token, 'Content-Type': 'application/json' },
    });
    // Solo 204 significa "sin campeón". Cualquier error HTTP (401, 500…) → no interrumpir
    if (!res.ok) return true;
    return res.status !== 204;
  } catch {
    return true;
  }
}

export function ChampionReminderDialog() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    if (new Date() >= DEADLINE) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Marcar siempre para no volver a llamar la API en esta sesión
    sessionStorage.setItem(SESSION_KEY, '1');

    fetchHasChampion().then((hasChampion) => {
      if (!hasChampion) setOpen(true);
    });
  }, []);

  const handleAccept = () => {
    setOpen(false);
    navigate('/matches?tab=3');
  };

  const handleClose = () => setOpen(false);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon sx={{ fontSize: 48, color: 'warning.main' }} />
          <Typography variant="h6" fontWeight={700}>
            ¡Elige tu campeón!
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" textAlign="center" color="text.secondary">
          Aún no has seleccionado tu campeón del Mundial 2026. El plazo cierra el{' '}
          <strong>18 de junio a las 11:59 PM</strong> hora Colombia.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', gap: 1, pb: 3, px: 3 }}>
        <Button variant="outlined" onClick={handleClose} sx={{ textTransform: 'none' }}>
          Después
        </Button>
        <Button
          variant="contained"
          onClick={handleAccept}
          startIcon={<EmojiEventsIcon />}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Elegir ahora
        </Button>
      </DialogActions>
    </Dialog>
  );
}
