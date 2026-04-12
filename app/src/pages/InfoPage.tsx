import { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  useTheme,
  Button,
} from '@mui/material';
import { ExpandMore, WhatsApp } from '@mui/icons-material';
import { HeroInfo } from '../components/sections';

export function InfoPage() {
  const [tabValue, setTabValue] = useState<number | false>(false);
  const theme = useTheme();

  const handleTabChange = (_: unknown, newValue: number) => {
    setTabValue(prev => prev === newValue ? false : newValue);
  };

  const rules = [
    {
      title: 'Cómo hacer una predicción',
      content: 'Ingresa al tab "Disponibles" en Partidos y selecciona "Predecir". Completa el marcador esperado (Ej: 2-1) y guarda.',
      isSystemPoints: false,
    },
    {
      title: 'Cuándo cierra una predicción',
      content: 'La predicción se cierra automáticamente con el inicio del partido. No podrás hacer cambios después de ese momento.',
      isSystemPoints: false,
    },
    {
      title: 'Sistema de puntos',
      content: 'Obtén 3 puntos por un marcador exacto, 1 punto si adivinas el ganador/empate, y 0 por incorrecto.',
      isSystemPoints: true,
    },
    {
      title: 'Cómo se calcula el ranking',
      content: 'El ranking se ordena por la suma total de puntos obtenidos en todas las predicciones.',
      isSystemPoints: false,
    },
    {
      title: 'Desempate',
      content: 'En caso de empate en puntos: 1. Mayor cantidad de marcadores exactos. 2. Mayor cantidad de ganadores correctos.',
      isSystemPoints: false,
    },
    {
      title: 'Predicciones pendientes',
      content: 'Las predicciones no enviadas no suman puntos. Asegúrate de guardar antes del inicio del partido.',
      isSystemPoints: false,
    },
  ];

  const announcements = [
    {
      id: '1',
      title: 'Bienvenida a Polla Mundialista',
      body: 'Hola! Estás en la polla mundialista oficial de Francachela MX. Haz tus predicciones y compite por el primer lugar.',
      severity: 'info' as const,
      publishedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Fase de grupos abierta',
      body: 'Se ha abierto la predicción para todos los partidos de la fase de grupos. ¡Bienvenido!',
      severity: 'success' as const,
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <HeroInfo />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: theme.palette.primary.main, mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
              },
            }}
          >
            <Tab label="Reglas del Juego" />
            <Tab label="Eventos / Novedades" />
          </Tabs>
        </Box>

        {/* Pestaña 0 - Reglas */}
        {tabValue === 0 && (
          <Box>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              📋 Reglas de Predicción
            </Typography>

            {rules.map((rule, idx) => (
              <Accordion
                key={idx}
                defaultExpanded={false}
                sx={{
                  backgroundColor: rule.isSystemPoints ? `${theme.palette.warning.main}08` : `${theme.palette.background.paper}`,
                  mb: 1.5,
                  borderLeft: rule.isSystemPoints ? `4px solid ${theme.palette.warning.main}` : 'none',
                  '&:before': {
                    display: 'none',
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}08`,
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    {rule.isSystemPoints ? '🎯 Sistema de Puntos' : rule.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 2, borderTop: `1px solid ${theme.palette.primary.main}15` }}>
                  {rule.isSystemPoints ? (
                    <Stack spacing={2}>
                      <Typography sx={{ color: theme.palette.text.primary, lineHeight: 1.7, fontSize: '0.95rem' }}>
                        El sistema de puntos de la polla funciona de la siguiente manera: Obtienes <strong>3 puntos por un marcador exacto</strong>, <strong>1 punto si aciertas el ganador o un empate</strong>, y <strong>0 puntos si tu predicción es incorrecta</strong>. Además, tenemos dos bonos especiales: si aciertas el marcador exacto en un partido de <strong>Colombia, recibes 5 puntos</strong> en lugar de 3, y si aciertas al <strong>campeón del torneo, obtienes 20 puntos</strong> adicionales. A continuación se muestran algunos ejemplos:
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: `${theme.palette.warning.main}15` }}>
                              <TableCell sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                                Resultado Real
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                                Tu Predicción
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                                Resultado
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                                Puntos
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow sx={{ '&:hover': { backgroundColor: `${theme.palette.primary.main}05` } }}>
                              <TableCell sx={{ fontWeight: 500 }}>Argentina 3 - 1 Francia</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>Argentina 3 - 1 Francia</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.success.main }}>✓ Exacto</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                                <Box sx={{ backgroundColor: `${theme.palette.warning.main}20`, px: 2, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                                  3 pts
                                </Box>
                              </TableCell>
                            </TableRow>
                            <TableRow sx={{ backgroundColor: `${theme.palette.success.main}08`, '&:hover': { backgroundColor: `${theme.palette.success.main}15` } }}>
                              <TableCell sx={{ fontWeight: 500 }}>🇨🇴 Colombia 2 - 1 Perú</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>🇨🇴 Colombia 2 - 1 Perú</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.success.main }}>✓ Exacto (Bonus)</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                                <Box sx={{ backgroundColor: `${theme.palette.success.main}30`, px: 2, py: 0.5, borderRadius: 1, display: 'inline-block', border: `2px solid ${theme.palette.success.main}` }}>
                                  5 pts ⭐
                                </Box>
                              </TableCell>
                            </TableRow>
                            <TableRow sx={{ '&:hover': { backgroundColor: `${theme.palette.primary.main}05` } }}>
                              <TableCell sx={{ fontWeight: 500 }}>Brasil 2 - 0 Alemania</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>Brasil 1 - 0 Alemania</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.info.main }}>✓ Ganador</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                                <Box sx={{ backgroundColor: `${theme.palette.secondary.main}20`, px: 2, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                                  1 pt
                                </Box>
                              </TableCell>
                            </TableRow>
                            <TableRow sx={{ '&:hover': { backgroundColor: `${theme.palette.primary.main}05` } }}>
                              <TableCell sx={{ fontWeight: 500 }}>España 2 - 2 Italia</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>España 1 - 1 Italia</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.info.main }}>✓ Empate</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                                <Box sx={{ backgroundColor: `${theme.palette.secondary.main}20`, px: 2, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                                  1 pt
                                </Box>
                              </TableCell>
                            </TableRow>
                            <TableRow sx={{ '&:hover': { backgroundColor: `${theme.palette.primary.main}05` } }}>
                              <TableCell sx={{ fontWeight: 500 }}>Holanda 1 - 2 Portugal</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>Holanda 2 - 1 Portugal</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.error.main }}>✗ Incorrecto</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>
                                <Box sx={{ backgroundColor: `${theme.palette.text.secondary}20`, px: 2, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                                  0 pts
                                </Box>
                              </TableCell>
                            </TableRow>
                            <TableRow sx={{ backgroundColor: `${theme.palette.info.main}08`, '&:hover': { backgroundColor: `${theme.palette.info.main}15` } }}>
                              <TableCell sx={{ fontWeight: 500 }}>🏆 Campeón: Colombia</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>🏆 Campeón: Colombia</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.info.main }}>✓ Exacto (Bonus)</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                                <Box sx={{ backgroundColor: `${theme.palette.info.main}30`, px: 2, py: 0.5, borderRadius: 1, display: 'inline-block', border: `2px solid ${theme.palette.info.main}` }}>
                                  20 pts ⭐
                                </Box>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Box sx={{ p: 2, backgroundColor: `${theme.palette.success.main}10`, borderRadius: 1, borderLeft: `4px solid ${theme.palette.success.main}` }}>
                        <Typography sx={{ fontWeight: 600, color: theme.palette.success.main, mb: 1 }}>
                          ⭐ BONUS ESPECIAL - COLOMBIA
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', color: theme.palette.text.primary }}>
                          Los marcadores exactos en partidos de <strong>Colombia</strong> valen <strong>5 puntos</strong> en lugar de 3.
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, backgroundColor: `${theme.palette.info.main}10`, borderRadius: 1, borderLeft: `4px solid ${theme.palette.info.main}` }}>
                        <Typography sx={{ fontWeight: 600, color: theme.palette.info.main, mb: 1 }}>
                          ⭐ BONUS ESPECIAL - CAMPEÓN
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', color: theme.palette.text.primary }}>
                          Acertar al <strong>campeón del torneo</strong> te otorga <strong>20 puntos</strong> adicionales.
                        </Typography>
                      </Box>
                    </Stack>
                  ) : (
                    <Typography sx={{ color: theme.palette.text.primary, lineHeight: 1.7, fontSize: '0.95rem' }}>
                      {rule.content}
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}


            {/* Premiación Accordion */}
            <Accordion
              defaultExpanded={false}
              sx={{
                backgroundColor: `${theme.palette.background.paper}`,
                mb: 1.5,
                '&:before': {
                  display: 'none',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}08`,
                  },
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>🏆 Premiación</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 2, borderTop: `1px solid ${theme.palette.primary.main}15` }}>
                <Stack spacing={3}>
                  {/* Descripción de rifas y sorteos */}
                  <Box sx={{ p: 2, backgroundColor: `${theme.palette.primary.main}08`, borderRadius: 1, borderLeft: `4px solid ${theme.palette.primary.main}` }}>
                    <Typography sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1 }}>
                      🎁 Rifas y Sorteos
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: theme.palette.text.primary, lineHeight: 1.6 }}>
                      Además de los premios al ranking principal, habrá <strong>rifas y sorteos especiales</strong> durante el torneo. Los participantes podrán ganar premios adicionales a través de sorteos realizados al final de cada fase (Grupos, Eliminatorias, Semis y Final). ¡Cada predicción te da más oportunidades de ganar!
                    </Typography>
                  </Box>

                  {/* Premios al ranking */}
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', mb: 2, color: theme.palette.text.primary }}>
                      Premios Principales (Ranking Final):
                    </Typography>
                    <Stack spacing={1.5}>
                      {/* 1er Lugar */}
                      <Card
                        sx={{
                          borderTop: `3px solid ${theme.palette.warning.main}`,
                          backgroundColor: `${theme.palette.warning.main}08`,
                        }}
                      >
                        <CardContent sx={{ py: 1.5 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ fontSize: '2rem' }}>🥇</Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: theme.palette.text.primary }}>
                                Primer Lugar
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '1.3rem', color: theme.palette.warning.main }}>
                                $1.000.000
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>

                      {/* 2do Lugar */}
                      <Card
                        sx={{
                          borderTop: `3px solid ${theme.palette.secondary.main}`,
                          backgroundColor: `${theme.palette.secondary.main}08`,
                        }}
                      >
                        <CardContent sx={{ py: 1.5 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ fontSize: '2rem' }}>🥈</Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: theme.palette.text.primary }}>
                                Segundo Lugar
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '1.3rem', color: theme.palette.secondary.main }}>
                                $400.000
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>

                      {/* 3er Lugar */}
                      <Card
                        sx={{
                          borderTop: `3px solid #CD7F32`,
                          backgroundColor: `#CD7F3208`,
                        }}
                      >
                        <CardContent sx={{ py: 1.5 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ fontSize: '2rem' }}>🥉</Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: theme.palette.text.primary }}>
                                Tercer Lugar
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '1.3rem', color: '#CD7F32' }}>
                                $200.000
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Register Button */}
            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<WhatsApp />}
                onClick={() => {
                  const message = encodeURIComponent(
                    'Hola, me gustaría registrarme en Francachela Polla Mundial 2026 🎉'
                  );
                  const whatsappUrl = `https://wa.me/573133195197?text=${message}`;
                  window.open(whatsappUrl, '_blank');
                }}
                sx={{
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  fontSize: '0.95rem',
                }}
              >
                Registrarme
              </Button>
            </Box>
          </Box>
        )}

        {/* Pestaña 1 - Eventos */}
        {tabValue === 1 && (
          <Box>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              🌍 Datos del Torneo
            </Typography>

            <Card
              sx={{
                mb: 4,
                borderTop: `4px solid ${theme.palette.primary.main}`,
                backgroundColor: theme.palette.background.paper,
                boxShadow: 2,
              }}
            >
              <CardContent>
                <Typography sx={{ fontWeight: 700, mb: 3, color: theme.palette.secondary.main, fontSize: '1.2rem' }}>
                  ⚽ Copa Mundial FIFA 2026
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, borderBottom: `1px solid ${theme.palette.primary.main}15` }}>
                    <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>Sede:</Typography>
                    <Typography sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '1rem' }}>
                      Canadá, México y EE.UU.
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, borderBottom: `1px solid ${theme.palette.primary.main}15` }}>
                    <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>Fechas:</Typography>
                    <Typography sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '1rem' }}>
                      11 jun - 19 jul 2026
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, borderBottom: `1px solid ${theme.palette.primary.main}15` }}>
                    <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>Equipos:</Typography>
                    <Typography sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '1rem' }}>
                      48 selecciones
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>Partidos:</Typography>
                    <Typography sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '1rem' }}>
                      104
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              📢 Avisos y Novedades
            </Typography>

            <Stack spacing={2}>
              {announcements.map((announcement) => (
                <Card
                  key={announcement.id}
                  sx={{
                    borderLeft: `4px solid ${announcement.severity === 'success' ? theme.palette.primary.main : theme.palette.secondary.main}`,
                    backgroundColor: announcement.severity === 'success'
                      ? `${theme.palette.primary.main}08`
                      : `${theme.palette.secondary.main}08`,
                    boxShadow: 1,
                  }}
                >
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary, fontSize: '1rem' }}>
                        {announcement.title}
                      </Typography>
                      <Typography sx={{ color: theme.palette.text.primary, fontSize: '0.95rem', lineHeight: 1.6 }}>
                        {announcement.body}
                      </Typography>
                    </Box>
                    <Chip
                      label={new Date(announcement.publishedAt).toLocaleDateString('es-ES')}
                      size="small"
                      variant="outlined"
                      sx={{ flexShrink: 0 }}
                    />
                  </CardContent>
                </Card>
              ))}
            </Stack>

            {/* Register Button */}
            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<WhatsApp />}
                onClick={() => {
                  const message = encodeURIComponent(
                    'Hola, me gustaría registrarme en Francachela Polla Mundial 2026 🎉'
                  );
                  const whatsappUrl = `https://wa.me/573133195197?text=${message}`;
                  window.open(whatsappUrl, '_blank');
                }}
                sx={{
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  fontSize: '0.95rem',
                }}
              >
                Registrarme
              </Button>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}
