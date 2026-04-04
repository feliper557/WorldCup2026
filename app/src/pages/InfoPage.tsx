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
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { HeroInfo } from '../components/sections';

export function InfoPage() {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  const handleTabChange = (_: unknown, newValue: number) => {
    setTabValue(newValue);
  };

  const rules = [
    {
      title: 'Cómo hacer una predicción',
      content: 'Ingresa al tab "Disponibles" en Partidos y selecciona "Predecir". Completa el marcador esperado (Ej: 2-1) y guarda.',
    },
    {
      title: 'Cuándo cierra una predicción',
      content: 'La predicción se cierra automáticamente con el inicio del partido. No podrás hacer cambios después de ese momento.',
    },
    {
      title: 'Sistema de puntos',
      content: 'Obtén 3 puntos por un marcador exacto, 1 punto si adivinas el ganador/empate, y 0 por incorrecto.',
    },
    {
      title: 'Cómo se calcula el ranking',
      content: 'El ranking se ordena por la suma total de puntos obtenidos en todas las predicciones.',
    },
    {
      title: 'Desempate',
      content: 'En caso de empate en puntos: 1. Mayor cantidad de marcadores exactos. 2. Mayor cantidad de ganadores correctos.',
    },
    {
      title: 'Predicciones pendientes',
      content: 'Las predicciones no enviadas no suman puntos. Asegúrate de guardar antes del inicio del partido.',
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
                defaultExpanded={idx === 0}
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
                  <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>{rule.title}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 2, borderTop: `1px solid ${theme.palette.primary.main}15` }}>
                  <Typography sx={{ color: theme.palette.text.primary, lineHeight: 1.7, fontSize: '0.95rem' }}>
                    {rule.content}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}

            <Card
              sx={{
                mt: 4,
                backgroundColor: `${theme.palette.warning.main}08`,
                borderLeft: `4px solid ${theme.palette.warning.main}`,
                borderRadius: 1.5,
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.warning.main }}>
                  🎯 Sistema de Puntos
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: `${theme.palette.warning.main}15` }}>
                        <TableCell sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                          Resultado predicho
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                          Puntos
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow sx={{ '&:hover': { backgroundColor: `${theme.palette.primary.main}05` } }}>
                        <TableCell sx={{ fontWeight: 500 }}>Marcador exacto ✓✓</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                          3 pts
                        </TableCell>
                      </TableRow>
                      <TableRow sx={{ '&:hover': { backgroundColor: `${theme.palette.primary.main}05` } }}>
                        <TableCell sx={{ fontWeight: 500 }}>Ganador / empate ✓</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                          1 pt
                        </TableCell>
                      </TableRow>
                      <TableRow sx={{ '&:hover': { backgroundColor: `${theme.palette.primary.main}05` } }}>
                        <TableCell sx={{ fontWeight: 500 }}>Incorrecto</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>
                          0 pts
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
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
          </Box>
        )}
      </Container>
    </Box>
  );
}
