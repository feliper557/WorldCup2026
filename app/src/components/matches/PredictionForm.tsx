import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import type { Match, Prediction } from '../../types';

interface PredictionFormProps {
  open: boolean;
  match: Match | null;
  prediction?: Prediction;
  loading?: boolean;
  onSave: (homeScore: number, awayScore: number) => void;
  onClose: () => void;
}

export function PredictionForm({
  open,
  match,
  prediction,
  loading = false,
  onSave,
  onClose,
}: PredictionFormProps) {
  const [homeScore, setHomeScore] = useState(prediction?.homeScorePred ?? 0);
  const [awayScore, setAwayScore] = useState(prediction?.awayScorePred ?? 0);

  const handleSave = () => {
    onSave(homeScore, awayScore);
  };

  const handleClose = () => {
    setHomeScore(prediction?.homeScorePred ?? 0);
    setAwayScore(prediction?.awayScorePred ?? 0);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {match ? (
          <Box>
            <Typography variant="h6">{match.homeTeam}</Typography>
            <Typography variant="caption" color="textSecondary">
              vs
            </Typography>
            <Typography variant="h6">{match.awayTeam}</Typography>
          </Box>
        ) : (
          'Realizar predicción'
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: '20px !important', overflow: 'visible' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label={match?.homeTeam}
            InputLabelProps={{ shrink: true }}
            type="number"
            value={homeScore}
            onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
            inputProps={{ min: 0 }}
            fullWidth
            disabled={loading}
          />

          <Typography variant="h6" sx={{ pt: 2 }}>
            -
          </Typography>

          <TextField
            label={match?.awayTeam}
            InputLabelProps={{ shrink: true }}
            type="number"
            value={awayScore}
            onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
            inputProps={{ min: 0 }}
            fullWidth
            disabled={loading}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, display: 'flex', gap: 1 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          {loading && <CircularProgress size={20} />}
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
