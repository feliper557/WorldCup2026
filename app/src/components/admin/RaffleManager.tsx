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
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemButton,
  Checkbox,
  Divider,
  Collapse,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Gavel,
  PersonRemove,
  PersonAdd,
  ExpandMore,
  ExpandLess,
  Search,
} from '@mui/icons-material';
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

  // Create raffle dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [drawingRaffleId, setDrawingRaffleId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [drawing, setDrawing] = useState(false);

  // Expand / collapse participants panel per raffle
  const [expandedRaffle, setExpandedRaffle] = useState<string | null>(null);

  // Add participants modal
  const [addModalRaffleId, setAddModalRaffleId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Remove participant
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [participantError, setParticipantError] = useState<Record<string, string>>({});

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prize, setPrize] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [drawDate, setDrawDate] = useState('');
  const [drawTime, setDrawTime] = useState('');

  // ── Create raffle ──────────────────────────────────────────────────────────
  const handleCreateClick = () => {
    setTitle(''); setDescription(''); setPrize('');
    setMaxParticipants(''); setDrawDate(''); setDrawTime('');
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

  // ── Draw raffle ────────────────────────────────────────────────────────────
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

  // ── Add participants modal ─────────────────────────────────────────────────
  const openAddModal = (raffleId: string) => {
    setAddModalRaffleId(raffleId);
    setSelectedUserIds(new Set());
    setSearchQuery('');
    setAddError('');
  };

  const closeAddModal = () => {
    setAddModalRaffleId(null);
    setSelectedUserIds(new Set());
    setSearchQuery('');
    setAddError('');
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const handleAddSelected = async () => {
    if (!addModalRaffleId || selectedUserIds.size === 0) return;
    setAdding(true);
    setAddError('');
    try {
      for (const userId of selectedUserIds) {
        await onAddParticipant(addModalRaffleId, userId);
      }
      closeAddModal();
    } catch (err: any) {
      setAddError(err.message?.replace('API Error: 400 - ', '') || 'Error al agregar participantes');
    } finally {
      setAdding(false);
    }
  };

  // ── Remove participant ─────────────────────────────────────────────────────
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

  // ── Helpers ────────────────────────────────────────────────────────────────
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

  // Users not already enrolled in the given raffle
  const getAvailableUsers = (raffle: Raffle) => {
    const enrolled = new Set(raffle.participants.map((p) => p.userId));
    return users.filter((u) => !enrolled.has(u.userId));
  };

  // Active add modal raffle
  const addModalRaffle = raffles.find((r) => r.id === addModalRaffleId);
  const availableForModal = addModalRaffle ? getAvailableUsers(addModalRaffle) : [];
  const filteredAvailable = availableForModal.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>🎁 Gestión de Rifas</Typography>
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

      {/* Pending draw */}
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
                    p: 2, borderRadius: 1,
                    border: `1px solid ${theme.palette.warning.main}30`,
                    backgroundColor: theme.palette.background.paper,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
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

      {/* All raffles */}
      <Card sx={{ borderTop: `4px solid ${theme.palette.primary.main}`, backgroundColor: theme.palette.background.paper, boxShadow: 1 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            📊 Todas las Rifas ({raffles.length})
          </Typography>

          <Stack spacing={2}>
            {raffles.map((raffle) => {
              const isExpanded = expandedRaffle === raffle.id;
              const errMsg = participantError[raffle.id] || '';

              return (
                <Box
                  key={raffle.id}
                  sx={{ borderRadius: 1, border: `1px solid ${theme.palette.primary.main}20`, backgroundColor: theme.palette.background.default, overflow: 'hidden' }}
                >
                  {/* Header row */}
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          👥 Participantes ({raffle.participants.length})
                        </Typography>
                        {raffle.status !== 'COMPLETED' && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PersonAdd />}
                            onClick={() => openAddModal(raffle.id)}
                            sx={{ fontWeight: 600 }}
                          >
                            Agregar participantes
                          </Button>
                        )}
                      </Box>

                      {errMsg && <Alert severity="error" sx={{ mb: 1.5, py: 0.5 }}>{errMsg}</Alert>}

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
                                  secondary={`Inscrito: ${new Date(p.joinedAtUtc).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}${p.tickets > 1 ? ` · ${p.tickets} tickets` : ''}`}
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

      {/* ── Add participants modal ──────────────────────────────────────── */}
      <Dialog
        open={!!addModalRaffleId}
        onClose={closeAddModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { maxHeight: '80vh' } }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Agregar participantes
            </Typography>
            {addModalRaffle && (
              <Typography variant="caption" color="text.secondary">
                {addModalRaffle.title} · {availableForModal.length} usuarios disponibles
              </Typography>
            )}
          </Box>
        </DialogTitle>

        <Box sx={{ px: 3, pb: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {addError && (
          <Box sx={{ px: 3, pb: 1 }}>
            <Alert severity="error" sx={{ py: 0.5 }}>{addError}</Alert>
          </Box>
        )}

        <DialogContent sx={{ pt: 0, px: 1 }}>
          {filteredAvailable.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {availableForModal.length === 0
                  ? 'Todos los usuarios ya están inscritos'
                  : 'No hay usuarios que coincidan con la búsqueda'}
              </Typography>
            </Box>
          ) : (
            <List dense>
              {filteredAvailable.map((user) => {
                const checked = selectedUserIds.has(user.userId);
                return (
                  <ListItemButton
                    key={user.userId}
                    onClick={() => toggleUser(user.userId)}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <Checkbox
                      edge="start"
                      checked={checked}
                      tabIndex={-1}
                      disableRipple
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <ListItemText
                      primary={user.displayName}
                      secondary={
                        <Box component="span" sx={{ display: 'flex', gap: 1.5 }}>
                          <span>{user.email}</span>
                          <span>·</span>
                          <span>
                            Inscrito:{' '}
                            {new Date(user.joinedAtUtc).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </Box>
                      }
                      primaryTypographyProps={{ variant: 'body2', fontWeight: checked ? 700 : 400 }}
                      secondaryTypographyProps={{ variant: 'caption', component: 'div' }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5, justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            {selectedUserIds.size > 0
              ? `${selectedUserIds.size} seleccionado${selectedUserIds.size > 1 ? 's' : ''}`
              : 'Selecciona uno o más usuarios'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={closeAddModal} size="small" disabled={adding}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleAddSelected}
              disabled={selectedUserIds.size === 0 || adding}
              startIcon={adding ? <CircularProgress size={14} /> : <PersonAdd />}
              sx={{ fontWeight: 600 }}
            >
              {adding ? 'Agregando...' : `Agregar (${selectedUserIds.size})`}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* ── Create raffle dialog ───────────────────────────────────────── */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>🎲 Crear Nueva Rifa</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth placeholder="Ej: Camiseta del Mundial" disabled={creating} autoFocus />
            <TextField label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} placeholder="Detalles del premio" disabled={creating} />
            <TextField label="Premio" value={prize} onChange={(e) => setPrize(e.target.value)} fullWidth placeholder="Descripción del premio" disabled={creating} required />
            <TextField label="Máximo de Participantes (opcional)" type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} fullWidth inputProps={{ min: '1' }} disabled={creating} />
            <TextField label="Fecha del Sorteo" type="date" value={drawDate} onChange={(e) => setDrawDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} disabled={creating} required />
            <TextField label="Hora del Sorteo" type="time" value={drawTime} onChange={(e) => setDrawTime(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} disabled={creating} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={creating}>Cancelar</Button>
          <Button onClick={handleCreateSubmit} variant="contained" disabled={!title.trim() || !prize.trim() || !drawDate || creating}>
            {creating ? 'Creando...' : 'Crear Rifa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
