import { useEffect, useState } from 'react';
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
import { getTeamDisplayName } from '../../utils/teamAssets';

interface PredictionFormProps {
  open: boolean;
  match: Match | null;
  prediction?: Prediction;
  loading?: boolean;
  onSave: (homeScore: number, awayScore: number) => void;
  onClose: () => void;
}

const toFieldValue = (n: number | null | undefined): string =>
  n === null || n === undefined ? '' : String(n);

const sanitizeScore = (raw: string): string => {
  // Permitir vacío + solo dígitos (máx 2). Strip ceros a la izquierda: "02" → "2".
  const digits = raw.replace(/\D/g, '').slice(0, 2);
  if (digits === '') return '';
  return String(parseInt(digits, 10));
};

export function PredictionForm({
  open,
  match,
  prediction,
  loading = false,
  onSave,
  onClose,
}: PredictionFormProps) {
  const [homeScore, setHomeScore] = useState(toFieldValue(prediction?.homeScorePred));
  const [awayScore, setAwayScore] = useState(toFieldValue(prediction?.awayScorePred));

  // Sync state when dialog opens or prediction changes
  useEffect(() => {
    if (open) {
      setHomeScore(toFieldValue(prediction?.homeScorePred));
      setAwayScore(toFieldValue(prediction?.awayScorePred));
    }
  }, [open, prediction]);

  const handleSave = () => {
    onSave(parseInt(homeScore || '0', 10), parseInt(awayScore || '0', 10));
  };

  const handleClose = () => {
    setHomeScore(toFieldValue(prediction?.homeScorePred));
    setAwayScore(toFieldValue(prediction?.awayScorePred));
    onClose();
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Seleccionar todo al enfocar → si el usuario teclea, reemplaza el valor existente
    e.target.select();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {match ? (
          <Box>
            <Typography variant="h6">{getTeamDisplayName(match.homeTeam)}</Typography>
            <Typography variant="caption" color="textSecondary">
              vs
            </Typography>
            <Typography variant="h6">{getTeamDisplayName(match.awayTeam)}</Typography>
          </Box>
        ) : (
          'Realizar predicción'
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: '20px !important', overflow: 'visible' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label={match ? getTeamDisplayName(match.homeTeam) : ''}
            InputLabelProps={{ shrink: true }}
            type="text"
            value={homeScore}
            onChange={(e) => setHomeScore(sanitizeScore(e.target.value))}
            onFocus={handleFocus}
            placeholder="0"
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
              maxLength: 2,
              style: { textAlign: 'center' },
            }}
            fullWidth
            disabled={loading}
          />

          <Typography variant="h6" sx={{ pt: 2 }}>
            -
          </Typography>

          <TextField
            label={match ? getTeamDisplayName(match.awayTeam) : ''}
            InputLabelProps={{ shrink: true }}
            type="text"
            value={awayScore}
            onChange={(e) => setAwayScore(sanitizeScore(e.target.value))}
            onFocus={handleFocus}
            placeholder="0"
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
              maxLength: 2,
              style: { textAlign: 'center' },
            }}
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
