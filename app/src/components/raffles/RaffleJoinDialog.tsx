import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { CardGiftcard } from '@mui/icons-material';
import type { Raffle } from '../../types';

interface RaffleJoinDialogProps {
  open: boolean;
  raffle: Raffle | null;
  onClose: () => void;
  onConfirm: (tickets: number) => Promise<void>;
  loading?: boolean;
}

export function RaffleJoinDialog({
  open,
  raffle,
  onClose,
  onConfirm,
  loading = false,
}: RaffleJoinDialogProps) {
  const theme = useTheme();
  const [tickets, setTickets] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!tickets || tickets < 1) {
      setError('Debes participar con al menos 1 boleta');
      return;
    }
    try {
      setError(null);
      await onConfirm(tickets);
      setTickets(1);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al participar');
    }
  };

  const handleClose = () => {
    setTickets(1);
    setError(null);
    onClose();
  };

  if (!raffle) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Participar en Sorteo</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            {raffle.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {raffle.description}
          </Typography>

          <Alert
            icon={<CardGiftcard fontSize="small" />}
            severity="success"
            sx={{ mb: 2.5, fontWeight: 600 }}
          >
            <strong>Premio:</strong> {raffle.prize}
          </Alert>

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            ¿Cuántas boletas deseas?
          </Typography>
          <TextField
            type="number"
            inputProps={{ min: 1, max: 100 }}
            value={tickets}
            onChange={(e) => setTickets(Math.max(1, parseInt(e.target.value) || 1))}
            fullWidth
            variant="outlined"
            size="small"
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit" size="small">
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          size="small"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} /> : <CardGiftcard sx={{ fontSize: 16 }} />}
          sx={{
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
            },
          }}
        >
          {loading ? 'Participando...' : 'Confirmar Participación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
