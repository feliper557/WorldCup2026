import { useState } from 'react';
import {
  Box,
  Container,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Stack,
  Grid,
  CircularProgress,
  useTheme,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { EmojiEvents, Edit } from '@mui/icons-material';
import { useChampionPrediction } from '../../hooks/useChampionPrediction';
import { WORLD_CUP_2026_GROUPS, ALL_TEAMS } from '../../data/worldcupGroups';
import type { Team } from '../../data/worldcupGroups';

export function ChampionPicker() {
  const theme = useTheme();
  const { prediction, saving, loading, error, isLocked, save, clear } = useChampionPrediction();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(prediction ? { name: prediction.team, flag: prediction.flag } : null);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
  };

  const handleSave = async () => {
    if (!selectedTeam) return;
    await save(selectedTeam.name, selectedTeam.flag);
  };

  const handleChangeClick = () => {
    if (!isLocked) {
      setChangeDialogOpen(true);
    }
  };

  const handleChangeCancel = () => {
    setSelectedTeam(prediction ? { name: prediction.team, flag: prediction.flag } : null);
    setChangeDialogOpen(false);
  };

  const handleChangeSave = async () => {
    if (!selectedTeam) return;
    await save(selectedTeam.name, selectedTeam.flag);
    setChangeDialogOpen(false);
  };

  // Estado: mostrando selección actual o dialog de cambio
  const isSelectingTeam = changeDialogOpen || (!prediction && !selectedTeam);
  const isEditing = changeDialogOpen && prediction;

  return (
    <Stack spacing={3}>
      {/* Aviso fecha límite */}
      {!isLocked && (
        <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
          🏆 <strong>¿Quién será el campeón?</strong> Elige tu equipo favorito antes del <strong>18 de junio de 2026</strong>, cuando termina la primera ronda de grupos. Después de esa fecha ya no podrás cambiar tu predicción.
        </Alert>
      )}

      {/* Card de predicción actual */}
      {prediction && !isEditing && (
        <Card
          sx={{
            borderTop: `4px solid ${theme.palette.secondary.main}`,
            backgroundColor: `${theme.palette.secondary.main}08`,
            boxShadow: 1,
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmojiEvents sx={{ fontSize: '2rem', color: theme.palette.secondary.main }} />
                <Box>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                    Tu predicción de campeón
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="img"
                      src={`https://flagcdn.com/w40/${ALL_TEAMS.find(t => t.name === prediction.team)?.code ?? 'un'}.png`}
                      alt={prediction.team}
                      sx={{ width: 32, height: 'auto', borderRadius: '2px' }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                      {prediction.team}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {!isLocked && (
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={handleChangeClick}
                  sx={{
                    borderColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.main,
                  }}
                >
                  Cambiar
                </Button>
              )}

              {isLocked && (
                <Chip
                  label="🔒 Plazo cerrado"
                  sx={{
                    borderColor: theme.palette.warning.main,
                    color: theme.palette.warning.main,
                  }}
                  variant="outlined"
                />
              )}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                📅 Fecha límite: <strong>18 de junio de 2026</strong> (fin primera ronda de grupos)
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Alerta si plazo cerrado sin predicción */}
      {isLocked && !prediction && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          ⏰ El plazo para elegir tu campeón ha cerrado (11 de junio). No puedes hacer una nueva predicción.
        </Alert>
      )}

      {/* Grid de equipos por grupo */}
      {(isSelectingTeam || !prediction) && (
        <Card
          sx={{
            borderTop: `4px solid ${theme.palette.primary.main}`,
            backgroundColor: theme.palette.background.paper,
            boxShadow: 1,
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiEvents /> Elige el Campeón del Mundial 2026
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error.message}
              </Alert>
            )}

            {/* Grid de grupos */}
            <Grid container spacing={3}>
              {WORLD_CUP_2026_GROUPS.map((group) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={group.letter}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      border: `2px solid ${theme.palette.primary.main}30`,
                      backgroundColor: theme.palette.background.default,
                    }}
                  >
                    {/* Título del grupo */}
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                        mb: 2,
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                      }}
                    >
                      Grupo {group.letter}
                    </Typography>

                    {/* Equipos del grupo */}
                    <Stack spacing={1}>
                      {group.teams.map((team) => (
                        <Button
                          key={team.name}
                          variant={selectedTeam?.name === team.name ? 'contained' : 'outlined'}
                          onClick={() => handleTeamSelect(team)}
                          disabled={isLocked && !prediction}
                          fullWidth
                          sx={{
                            justifyContent: 'flex-start',
                            textTransform: 'none',
                            fontWeight: 500,
                            borderColor:
                              selectedTeam?.name === team.name
                                ? theme.palette.primary.main
                                : `${theme.palette.primary.main}40`,
                            backgroundColor:
                              selectedTeam?.name === team.name
                                ? theme.palette.primary.main
                                : 'transparent',
                            color:
                              selectedTeam?.name === team.name
                                ? theme.palette.background.paper
                                : theme.palette.text.primary,
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              backgroundColor:
                                selectedTeam?.name === team.name
                                  ? theme.palette.primary.main
                                  : `${theme.palette.primary.main}10`,
                            },
                          }}
                        >
                          <Box
                            component="img"
                            src={`https://flagcdn.com/w40/${team.code}.png`}
                            alt={team.name}
                            sx={{ width: 28, height: 'auto', mr: 1, borderRadius: '2px', flexShrink: 0 }}
                          />
                          <Box sx={{ flex: 1, textAlign: 'left' }}>{team.name}</Box>
                          {selectedTeam?.name === team.name && (
                            <Box sx={{ fontSize: '1.2rem', ml: 1 }}>✓</Box>
                          )}
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Botones de acción */}
            {!prediction && (
              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleSave}
                  disabled={!selectedTeam || saving || isLocked}
                  startIcon={saving ? <CircularProgress size={20} /> : <EmojiEvents />}
                  sx={{ fontWeight: 600, minWidth: 250 }}
                >
                  {saving ? 'Guardando...' : '🏆 Guardar Mi Campeón'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog para cambiar predicción */}
      <Dialog open={changeDialogOpen} onClose={handleChangeCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Cambiar tu predicción de campeón</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 3, color: theme.palette.text.secondary }}>
            Selecciona un nuevo equipo que creas será el campeón
          </Typography>

          {/* Grid de equipos en el dialog */}
          <Grid container spacing={2}>
            {WORLD_CUP_2026_GROUPS.map((group) => (
              <Grid size={12} key={group.letter}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1, display: 'block' }}>
                    Grupo {group.letter}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {group.teams.map((team) => (
                      <Button
                        key={team.name}
                        variant={selectedTeam?.name === team.name ? 'contained' : 'outlined'}
                        onClick={() => setSelectedTeam(team)}
                        size="small"
                        sx={{
                          fontSize: '0.85rem',
                          gap: 0.75,
                          borderColor:
                            selectedTeam?.name === team.name
                              ? theme.palette.primary.main
                              : `${theme.palette.primary.main}40`,
                          backgroundColor:
                            selectedTeam?.name === team.name
                              ? theme.palette.primary.main
                              : 'transparent',
                          color:
                            selectedTeam?.name === team.name
                              ? theme.palette.background.paper
                              : theme.palette.text.primary,
                        }}
                      >
                        <Box
                          component="img"
                          src={`https://flagcdn.com/w40/${team.code}.png`}
                          alt={team.name}
                          sx={{ width: 20, height: 'auto', borderRadius: '2px' }}
                        />
                        {team.name}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleChangeCancel}>Cancelar</Button>
          <Button
            onClick={handleChangeSave}
            variant="contained"
            disabled={!selectedTeam || saving}
            startIcon={saving ? <CircularProgress size={20} /> : undefined}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
