import { useState, useMemo } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  Stack,
  Typography,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Search, Lock, ToggleOff, ToggleOn, Refresh } from '@mui/icons-material';
import type { AdminUser, IdentityProvider } from '../../types/admin';
import { recalculatePoints } from '../../services/apiClient';

interface UserTableProps {
  users: AdminUser[];
  onResetPassword: (userId: string, newPassword: string) => Promise<void>;
  onToggleActive: (userId: string, isActive: boolean) => Promise<void>;
  loading?: boolean;
}

export function UserTable({ users, onResetPassword, onToggleActive, loading = false }: UserTableProps) {
  const theme = useTheme();
  const [searchText, setSearchText] = useState('');
  const [filterProvider, setFilterProvider] = useState<IdentityProvider | ''>('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [recalcResult, setRecalcResult] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase());
      const matchesProvider = !filterProvider || user.identityProvider === filterProvider;
      return matchesSearch && matchesProvider;
    });
  }, [users, searchText, filterProvider]);

  const handleResetClick = (userId: string) => {
    setSelectedUserId(userId);
    setNewPassword('');
    setResetDialogOpen(true);
  };

  const handleResetSubmit = async () => {
    if (!selectedUserId || !newPassword.trim()) return;

    try {
      setResetLoading(true);
      await onResetPassword(selectedUserId, newPassword);
      setResetDialogOpen(false);
      setSelectedUserId(null);
      setNewPassword('');
    } finally {
      setResetLoading(false);
    }
  };

  const handleRecalculate = async (userId: string) => {
    try {
      setRecalcLoading(true);
      setRecalcResult(null);
      const result = await recalculatePoints(userId);
      setRecalcResult(`✅ ${result.predictionsUpdated} predicciones actualizadas`);
      setTimeout(() => setRecalcResult(null), 5000);
    } catch (err) {
      setRecalcResult(`❌ Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setRecalcLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      setToggleLoading(userId);
      await onToggleActive(userId, !currentStatus);
    } finally {
      setToggleLoading(null);
    }
  };

  const getProviderIcon = (provider: IdentityProvider) => {
    return provider === 'github' ? '🐙' : '📧';
  };

  return (
    <Stack spacing={2}>
      {/* Filtros */}
      <Card sx={{ backgroundColor: theme.palette.background.paper, boxShadow: 1 }}>
        <CardContent>
          {recalcResult && (
            <Alert severity={recalcResult.startsWith('✅') ? 'success' : 'error'} sx={{ mb: 2 }}>
              {recalcResult}
            </Alert>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Buscar participante"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              fullWidth
              size="small"
            />

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Proveedor</InputLabel>
              <Select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value as IdentityProvider | '')}
                label="Proveedor"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="github">GitHub</MenuItem>
                <MenuItem value="email">Email</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card
        sx={{
          borderTop: `4px solid ${theme.palette.primary.main}`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: 1,
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            👥 Usuarios Registrados ({filteredUsers.length})
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: `${theme.palette.primary.main}15` }}>
                  <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Proveedor</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Puntos
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Predicciones
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Registro</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.userId} sx={{ '&:hover': { backgroundColor: `${theme.palette.primary.main}08` } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.background.paper,
                            fontWeight: 600,
                            fontSize: '0.85rem',
                          }}
                        >
                          {user.displayName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                          {user.displayName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${getProviderIcon(user.identityProvider)} ${
                          user.identityProvider === 'github' ? 'GitHub' : 'Email'
                        }`}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor:
                            user.identityProvider === 'github'
                              ? theme.palette.secondary.main
                              : theme.palette.primary.main,
                          color:
                            user.identityProvider === 'github'
                              ? theme.palette.secondary.main
                              : theme.palette.primary.main,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>
                      {user.totalPoints}
                    </TableCell>
                    <TableCell align="right" sx={{ color: theme.palette.text.primary }}>
                      {user.totalPredictions}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem' }}>
                      {new Date(user.joinedAtUtc).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? '✓ Activo' : '✗ Inactivo'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={recalcLoading ? <CircularProgress size={14} /> : <Refresh />}
                          onClick={() => handleRecalculate(user.userId)}
                          disabled={recalcLoading}
                          sx={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            borderColor: theme.palette.info.main,
                            color: theme.palette.info.main,
                            '&:hover': { backgroundColor: `${theme.palette.info.main}10` },
                          }}
                        >
                          Puntos
                        </Button>
                        {user.identityProvider === 'email' && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Lock />}
                            onClick={() => handleResetClick(user.userId)}
                            disabled={resetLoading || loading}
                            sx={{
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              borderColor: theme.palette.warning.main,
                              color: theme.palette.warning.main,
                              '&:hover': {
                                borderColor: theme.palette.warning.dark,
                                backgroundColor: `${theme.palette.warning.main}10`,
                              },
                            }}
                          >
                            Reset
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={user.isActive ? <ToggleOn /> : <ToggleOff />}
                          onClick={() => handleToggleActive(user.userId, user.isActive)}
                          disabled={toggleLoading === user.userId || loading}
                          sx={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            borderColor: user.isActive
                              ? theme.palette.primary.main
                              : theme.palette.error.main,
                            color: user.isActive
                              ? theme.palette.primary.main
                              : theme.palette.error.main,
                            '&:hover': {
                              backgroundColor: user.isActive
                                ? `${theme.palette.primary.main}10`
                                : `${theme.palette.error.main}10`,
                            },
                          }}
                        >
                          {user.isActive ? 'Desact.' : 'Activ.'}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredUsers.length === 0 && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ color: theme.palette.text.secondary }}>
                No se encontraron usuarios
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Reset Password */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>🔑 Resetear Contraseña</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
            Ingresa una nueva contraseña temporal para este usuario
          </Typography>
          <TextField
            label="Nueva Contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            autoFocus
            disabled={resetLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)} disabled={resetLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleResetSubmit}
            variant="contained"
            disabled={!newPassword.trim() || resetLoading}
          >
            {resetLoading ? 'Reseteando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
