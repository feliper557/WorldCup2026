import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  useTheme,
  Chip,
  Autocomplete,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Collapse,
} from '@mui/material';
import { Add, Gavel, PersonRemove, PersonAdd, ExpandMore, ExpandLess } from '@mui/icons-material';
import type { Raffle, RaffleCreateRequest } from '../../types';
import type { AdminUser } from '../../types/admin';

interface RaffleManagerProps {
  raffles: Raffle[];
  users: AdminUser[];
  onCreateRaffle: (data: RaffleCreateRequest) => Promise<void>;
  onDrawRaffle: (raffleId: string) => Promise<void>;
  onAddParticipant: (raffleId: string, userId: string) => Promise<void>;
  onRemoveParticipant: (raffleId: string, userId: string) => Promise<void>;
  loading?: boolean;
}

export function RaffleManager({
  raffles,
  users,
  onCreateRaffle,
  onDrawRaffle,
  onAddParticipant,
  onRemoveParticipant,
  loading = false,
}: RaffleManagerProps) {
  const theme = useTheme();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [drawingRaffleId, setDrawingRaffleId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [drawing, setDrawing] = useState(false);

  // Participant management state per raffle
  const [expandedRaffle, setExpandedRaffle] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Record<string, AdminUser | null>>({});
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null); // `${raffleId}-${userId}`
  const [participantError, setParticipantError] = useState<Record<string, string>>({});

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prize, setPrize] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [drawDate, setDrawDate] = useState('');
  const [drawTime, setDrawTime] = useState('');

  const handleCreateClick = () => {
    setTitle('');
    setDescription('');
    setPrize('');
    setMaxParticipants('');
    setDrawDate('');
    setDrawTime('');
    setCreateDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!title.trim() || !prize.trim() || !drawDate) return;
    try {
      setCreating(true);
      const time = drawTime || '00:00';
      const [hours, minutes] = time.split(':');
      const drawAtUtc = new Date(`${drawDate}T${hours}:${minutes}:00Z`).toISOString();
      await onCreateRaffle({
        title: title.trim(),
        description: description.trim(),
        prize: prize.trim(),
        maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : undefined,
        drawAtUtc,
      });
      setCreateDialogOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const handleDrawRaffle = async (raffleId: string) => {
    try {
      setDrawingRaffleId(raffleId);
      setDrawing(true);
      await onDrawRaffle(raffleId);
    } finally {
      setDrawing(false);
      setDrawingRaffleId(null);
    }
  };

  const handleAddParticipant = async (raffleId: string) => {
    const user = selectedUsers[raffleId];
    if (!user) return;
    setAddingTo(raffleId);
    setParticipantError((prev) => ({ ...prev, [raffleId]: '' }));
    try {
      await onAddParticipant(raffleId, user.userId);
      setSelectedUsers((prev) => ({ ...prev, [raffleId]: null }));
    } catch (err: any) {
      setParticipantError((prev) => ({
        ...prev,
        [raffleId]: err.message?.replace('API Error: 400 - ', '') || 'Error al agregar',
      }));
    } finally {
      setAddingTo(null);
    }
  };

  const handleRemoveParticipant = async (raffleId: string, userId: string) => {
    const key = `${raffleId}-${userId}`;
    setRemovingKey(key);
    try {
      await onRemoveParticipant(raffleId, userId);
    } catch (err: any) {
      setParticipantError((prev) => ({
        ...prev,
        [raffleId]: err.message?.replace('API Error: 400 - ', '') || 'Error al eliminar',
      }));
    } finally {
      setRemovingKey(null);
    }
  };

  const getStatusColor = (status: Raffle['status']) => {
    switch (status) {
      case 'OPEN': return theme.palette.primary.main;
      case 'DRAWING': return theme.palette.warning.main;
      case 'COMPLETED': return theme.palette.secondary.main;
      default: return theme.palette.text.secondary;
    }
  };

  const getStatusLabel = (status: Raffle['status']) => {
    switch (status) {
      case 'OPEN': return 'Abierta';
      case 'DRAWING': return 'Sorteando';
      case 'COMPLETED': return 'Completada';
    }
  };

  const openRaffles = raffles.filter((r) => r.status === 'OPEN' || r.status === 'DRAWING');

  // Users not already in a given raffle
  const getAvailableUsers = (raffle: Raffle) => {
    const participantIds = new Set(raffle.participants.map((p) => p.userId));
    return users.filter((u) => !participantIds.has(u.userId));
  };

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          🎁 Gestión de Rifas
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleCreateClick}
          disabled={loading}
          sx={{ fontWeight: 600 }}
        >
          Crear Rifa
        </Button>
      </Box>

      {/* Rifas abiertas para sortear */}
      {openRaffles.length > 0 && (
        <Card sx={{ borderLeft: `4px solid ${theme.palette.warning.main}`, backgroundColor: `${theme.palette.warning.main}08`, boxShadow: 1 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: theme.palette.warning.main }}>
              ⚠️ Rifas Pendientes de Sorteo
            </Typography>
            <Stack spacing={2}>
              {openRaffles.map((raffle) => (
                <Box
                  key={raffle.id}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.warning.main}30`,
                    backgroundColor: theme.palette.background.paper,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>{raffle.title}</Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>{raffle.description}</Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Chip label={`${raffle.participantCount} participantes`} size="small" variant="outlined" />
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Sorteo: {new Date(raffle.drawAtUtc).toLocaleString('es-ES')}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={drawing && drawingRaffleId === raffle.id ? <CircularProgress size={20} /> : <Gavel />}
                    onClick={() => handleDrawRaffle(raffle.id)}
                    disabled={drawing || loading}
                    sx={{ ml: 2, fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    {drawing && drawingRaffleId === raffle.id ? 'Sorteando...' : 'Ejecutar Sorteo'}
                  </Button>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Lista de todas las rifas */}
      <Card sx={{ borderTop: `4px solid ${theme.palette.primary.main}`, backgroundColor: theme.palette.background.paper, boxShadow: 1 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            📊 Todas las Rifas ({raffles.length})
          </Typography>

          <Stack spacing={2}>
            {raffles.map((raffle) => {
              const isExpanded = expandedRaffle === raffle.id;
              const availableUsers = getAvailableUsers(raffle);
              const errMsg = participantError[raffle.id] || '';

              return (
                <Box
                  key={raffle.id}
                  sx={{
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.primary.main}20`,
                    backgroundColor: theme.palette.background.default,
                    overflow: 'hidden',
                  }}
                >
                  {/* Raffle header row */}
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{raffle.title}</Typography>
                        <Chip
                          label={getStatusLabel(raffle.status)}
                          size="small"
                          sx={{ borderColor: getStatusColor(raffle.status), color: getStatusColor(raffle.status) }}
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>{raffle.description}</Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="caption"><strong>Premio:</strong> {raffle.prize}</Typography>
                        <Typography variant="caption">
                          <strong>Participantes:</strong> {raffle.participantCount}{raffle.maxParticipants && ` / ${raffle.maxParticipants}`}
                        </Typography>
                        <Typography variant="caption"><strong>Sorteo:</strong> {new Date(raffle.drawAtUtc).toLocaleString('es-ES')}</Typography>
                      </Box>
                      {raffle.status === 'COMPLETED' && raffle.winnerName && (
                        <Alert severity="success" sx={{ py: 0.5, px: 1, mt: 1 }}>
                          <Typography variant="caption"><strong>✨ Ganador:</strong> {raffle.winnerName}</Typography>
                        </Alert>
                      )}
                    </Box>

                    {/* Toggle participants panel */}
                    <IconButton
                      size="small"
                      onClick={() => setExpandedRaffle(isExpanded ? null : raffle.id)}
                      sx={{ ml: 1 }}
                      title="Gestionar participantes"
                    >
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>

                  {/* Participants panel */}
                  <Collapse in={isExpanded}>
                    <Divider />
                    <Box sx={{ p: 2, backgroundColor: `${theme.palette.primary.main}05` }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                        👥 Participantes ({raffle.participants.length})
                      </Typography>

                      {errMsg && (
                        <Alert severity="error" sx={{ mb: 1.5, py: 0.5 }}>{errMsg}</Alert>
                      )}

                      {/* Add participant */}
                      {raffle.status !== 'COMPLETED' && (
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                          <Autocomplete
                            size="small"
                            options={availableUsers}
                            getOptionLabel={(u) => `${u.displayName} (${u.email})`}
                            value={selectedUsers[raffle.id] ?? null}
                            onChange={(_, val) => setSelectedUsers((prev) => ({ ...prev, [raffle.id]: val }))}
                            renderInput={(params) => (
                              <TextField {...params} label="Agregar participante" placeholder="Buscar usuario..." />
                            )}
                            sx={{ flex: 1 }}
                            noOptionsText="No hay usuarios disponibles"
                          />
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={addingTo === raffle.id ? <CircularProgress size={14} /> : <PersonAdd />}
                            onClick={() => handleAddParticipant(raffle.id)}
                            disabled={!selectedUsers[raffle.id] || addingTo === raffle.id}
                            sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}
                          >
                            Agregar
                          </Button>
                        </Box>
                      )}

                      {/* Participants list */}
                      {raffle.participants.length === 0 ? (
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textAlign: 'center', py: 1 }}>
                          No hay participantes aún
                        </Typography>
                      ) : (
                        <List dense disablePadding>
                          {raffle.participants.map((p, idx) => (
                            <Box key={p.userId}>
                              {idx > 0 && <Divider component="li" />}
                              <ListItem disableGutters sx={{ py: 0.5 }}>
                                <ListItemText
                                  primary={p.displayName}
                                  secondary={`Inscrito: ${new Date(p.joinedAtUtc).toLocaleDateString('es-ES')}${p.tickets > 1 ? ` · ${p.tickets} tickets` : ''}`}
                                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                  secondaryTypographyProps={{ variant: 'caption' }}
                                />
                                {raffle.status !== 'COMPLETED' && (
                                  <ListItemSecondaryAction>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleRemoveParticipant(raffle.id, p.userId)}
                                      disabled={removingKey === `${raffle.id}-${p.userId}`}
                                      title="Eliminar participante"
                                    >
                                      {removingKey === `${raffle.id}-${p.userId}`
                                        ? <CircularProgress size={16} />
                                        : <PersonRemove fontSize="small" />}
                                    </IconButton>
                                  </ListItemSecondaryAction>
                                )}
                              </ListItem>
                            </Box>
                          ))}
                        </List>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Stack>

          {raffles.length === 0 && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ color: theme.palette.text.secondary }}>
                No hay rifas creadas. Crea una nueva para comenzar.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog crear rifa */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>🎲 Crear Nueva Rifa</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              placeholder="Ej: Camiseta oficial del Mundial"
              disabled={creating}
              autoFocus
            />
            <TextField
              label="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Detalles del premio"
              disabled={creating}
            />
            <TextField
              label="Premio"
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
              fullWidth
              placeholder="Descripción del premio"
              disabled={creating}
              required
            />
            <TextField
              label="Máximo de Participantes (opcional)"
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              fullWidth
              inputProps={{ min: '1' }}
              disabled={creating}
            />
            <TextField
              label="Fecha del Sorteo"
              type="date"
              value={drawDate}
              onChange={(e) => setDrawDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={creating}
              required
            />
            <TextField
              label="Hora del Sorteo"
              type="time"
              value={drawTime}
              onChange={(e) => setDrawTime(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={creating}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={creating}>Cancelar</Button>
          <Button
            onClick={handleCreateSubmit}
            variant="contained"
            disabled={!title.trim() || !prize.trim() || !drawDate || creating}
          >
            {creating ? 'Creando...' : 'Crear Rifa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
