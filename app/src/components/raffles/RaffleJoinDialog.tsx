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
} from '@mui/material';
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Participar en Sorteo</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {raffle.title}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {raffle.description}
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            🎁 <strong>Premio:</strong> {raffle.prize}
          </Alert>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            ¿Cuántas boletas deseas?
          </Typography>
          <TextField
            type="number"
            inputProps={{ min: 1, max: 100 }}
            value={tickets}
            onChange={(e) => {
              const value = Math.max(1, parseInt(e.target.value) || 1);
              setTickets(value);
            }}
            fullWidth
            variant="outlined"
            size="small"
          />

          <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" color="textSecondary">
              Probabilidad aproximada
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {(
                (tickets / Math.max(raffle.participantCount + tickets, 1)) *
                100
              ).toFixed(1)}
              % de ganar
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading}
          sx={{ backgroundColor: '#1a237e' }}
        >
          {loading ? 'Participando...' : 'Confirmar Participación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
