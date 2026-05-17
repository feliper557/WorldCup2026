import { useState } from 'react';
import { Box, Container, Stack, useTheme, Button, Chip } from '@mui/material';
import { ExpandMore, WhatsApp, Gavel, Campaign } from '@mui/icons-material';
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
      body: 'Hola! Estás en la polla mundialista de Francachela MX. Haz tus predicciones y compite por el primer lugar.',
      severity: 'info' as const,
      publishedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: '🎁 Primera Rifa — Gorra de la Selección Colombia',
      body: '¡Inscríbete rápido y entra al sorteo! Solo los primeros participantes tienen derecho a ganarse esta gorra de la Selección Colombia. Cupos limitados, sorteo en vivo durante el evento. ¡No te quedes por fuera!',
      severity: 'success' as const,
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  // Estilos del details/summary nativo (reemplazo de Accordion sin runtime CSS-in-JS pesado)
  const detailsStyles = {
    backgroundColor: theme.palette.background.paper,
    mb: 1.5,
    borderRadius: 1,
    overflow: 'hidden',
    '& > summary': {
      listStyle: 'none',
      cursor: 'pointer',
      px: 2,
      py: 1.75,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontWeight: 600,
      fontSize: '1rem',
      color: theme.palette.text.primary,
      transition: 'background-color 200ms ease',
      '&:hover': { backgroundColor: `${theme.palette.primary.main}08` },
      '&::-webkit-details-marker': { display: 'none' },
      '& .expand-icon': {
        transition: 'transform 200ms ease',
        color: theme.palette.text.secondary,
      },
    },
    '&[open] > summary .expand-icon': {
      transform: 'rotate(180deg)',
    },
    '& > .details-body': {
      px: 2,
      pt: 2,
      pb: 2,
      borderTop: `1px solid ${theme.palette.primary.main}15`,
    },
  };

  const systemPointsDetailsStyles = {
    ...detailsStyles,
    backgroundColor: `${theme.palette.warning.main}08`,
    borderLeft: `4px solid ${theme.palette.warning.main}`,
  };

  // Fila de la tabla de puntos via CSS grid (reemplazo de Table/TableRow/TableCell)
  const pointsRow = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr auto',
    gap: { xs: 1, sm: 2 },
    alignItems: 'center',
    p: 1.5,
    borderBottom: `1px solid ${theme.palette.primary.main}10`,
    fontSize: '0.85rem',
    fontWeight: 500,
    transition: 'background-color 160ms ease',
    '&:hover': { backgroundColor: `${theme.palette.primary.main}05` },
  };

  return (
    <Box>
      <HeroInfo />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Botones de sección */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          {[
            { index: 0, label: 'Reglas del Juego', icon: <Gavel sx={{ fontSize: 20 }} />, color: theme.palette.primary.main, delay: '0s' },
            { index: 1, label: 'Eventos / Novedades', icon: <Campaign sx={{ fontSize: 20 }} />, color: theme.palette.secondary.light, delay: '0.05s' },
          ].map(({ index, label, icon, color }) => {
            const active = tabValue === index;
            return (
              <Box
                key={index}
                onClick={() => handleTabChange(null, index)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2.5,
                  py: 1.2,
                  borderRadius: 2,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  letterSpacing: '0.03em',
                  transition: 'all 0.22s ease',
                  color: active ? '#fff' : color,
                  background: active
                    ? `linear-gradient(135deg, ${color}EE 0%, ${color}AA 100%)`
                    : `${color}18`,
                  border: `2px solid ${active ? color : `${color}50`}`,
                  boxShadow: active ? `0 4px 16px ${color}55` : 'none',
                  transform: active ? 'translateY(-1px)' : 'none',
                  '&:hover': {
                    background: active
                      ? `linear-gradient(135deg, ${color}FF 0%, ${color}CC 100%)`
                      : `${color}28`,
                    border: `2px solid ${color}`,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 16px ${color}44`,
                  },
                }}
              >
                {icon}
                {label}
                {active && (
                  <Box
                    sx={{
                      ml: 0.5,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      opacity: 0.8,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>

        {/* Pestaña 0 - Reglas */}
        {tabValue === 0 && (
          <Box>
            <Box component="h2" sx={{ m: 0, mb: 3, fontSize: '1.5rem', fontWeight: 600, color: theme.palette.text.primary }}>
              📋 Reglas de Predicción
            </Box>

            {rules.map((rule, idx) => (
              <Box
                key={idx}
                component="details"
                sx={rule.isSystemPoints ? systemPointsDetailsStyles : detailsStyles}
              >
                <Box component="summary">
                  <span>{rule.isSystemPoints ? '🎯 Sistema de Puntos' : rule.title}</span>
                  <ExpandMore className="expand-icon" />
                </Box>
                <Box className="details-body">
                  {rule.isSystemPoints ? (
                    <Stack spacing={2}>
                      <Box component="p" sx={{ m: 0, color: theme.palette.text.primary, lineHeight: 1.7, fontSize: '0.95rem' }}>
                        El sistema de puntos de la polla funciona de la siguiente manera: Obtienes <strong>3 puntos por un marcador exacto</strong>, <strong>1 punto si aciertas el ganador o un empate</strong>, y <strong>0 puntos si tu predicción es incorrecta</strong>. Además, tenemos dos bonos especiales: si aciertas el marcador exacto en un partido de <strong>Colombia, recibes 5 puntos</strong> en lugar de 3, y si aciertas al <strong>campeón del torneo, obtienes 20 puntos</strong> adicionales. A continuación se muestran algunos ejemplos:
                      </Box>

                      {/* Tabla de puntos via CSS grid (sin MUI Table) */}
                      <Box sx={{ borderRadius: 1, overflow: 'hidden', border: `1px solid ${theme.palette.primary.main}10` }}>
                        {/* Header */}
                        <Box sx={{
                          ...pointsRow,
                          backgroundColor: `${theme.palette.warning.main}15`,
                          fontWeight: 700,
                          color: theme.palette.warning.main,
                          fontSize: '0.8rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          <span>Resultado Real</span>
                          <span>Tu Predicción</span>
                          <span>Resultado</span>
                          <span style={{ textAlign: 'right' }}>Puntos</span>
                        </Box>

                        {/* Fila 1: Exacto 3 pts */}
                        <Box sx={pointsRow}>
                          <span>Argentina 3 - 1 Francia</span>
                          <span>Argentina 3 - 1 Francia</span>
                          <Box component="span" sx={{ fontWeight: 600, color: theme.palette.success.main }}>✓ Exacto</Box>
                          <Box component="span" sx={{ justifySelf: 'end', fontWeight: 700, color: theme.palette.warning.main, backgroundColor: `${theme.palette.warning.main}20`, px: 2, py: 0.5, borderRadius: 1 }}>3 pts</Box>
                        </Box>

                        {/* Fila 2: Colombia bonus 5 pts */}
                        <Box sx={{ ...pointsRow, backgroundColor: `${theme.palette.success.main}08` }}>
                          <span>🇨🇴 Colombia 2 - 1 Perú</span>
                          <span>🇨🇴 Colombia 2 - 1 Perú</span>
                          <Box component="span" sx={{ fontWeight: 600, color: theme.palette.success.main }}>✓ Exacto (Bonus)</Box>
                          <Box component="span" sx={{ justifySelf: 'end', fontWeight: 700, color: theme.palette.success.main, backgroundColor: `${theme.palette.success.main}30`, px: 2, py: 0.5, borderRadius: 1, border: `2px solid ${theme.palette.success.main}` }}>5 pts ⭐</Box>
                        </Box>

                        {/* Fila 3: Ganador 1 pt */}
                        <Box sx={pointsRow}>
                          <span>Brasil 2 - 0 Alemania</span>
                          <span>Brasil 1 - 0 Alemania</span>
                          <Box component="span" sx={{ fontWeight: 600, color: theme.palette.info.main }}>✓ Ganador</Box>
                          <Box component="span" sx={{ justifySelf: 'end', fontWeight: 700, color: theme.palette.secondary.main, backgroundColor: `${theme.palette.secondary.main}20`, px: 2, py: 0.5, borderRadius: 1 }}>1 pt</Box>
                        </Box>

                        {/* Fila 4: Empate 1 pt */}
                        <Box sx={pointsRow}>
                          <span>España 2 - 2 Italia</span>
                          <span>España 1 - 1 Italia</span>
                          <Box component="span" sx={{ fontWeight: 600, color: theme.palette.info.main }}>✓ Empate</Box>
                          <Box component="span" sx={{ justifySelf: 'end', fontWeight: 700, color: theme.palette.secondary.main, backgroundColor: `${theme.palette.secondary.main}20`, px: 2, py: 0.5, borderRadius: 1 }}>1 pt</Box>
                        </Box>

                        {/* Fila 5: Incorrecto 0 pts */}
                        <Box sx={pointsRow}>
                          <span>Holanda 1 - 2 Portugal</span>
                          <span>Holanda 2 - 1 Portugal</span>
                          <Box component="span" sx={{ fontWeight: 600, color: theme.palette.error.main }}>✗ Incorrecto</Box>
                          <Box component="span" sx={{ justifySelf: 'end', fontWeight: 700, color: theme.palette.text.secondary, backgroundColor: `${theme.palette.text.secondary}20`, px: 2, py: 0.5, borderRadius: 1 }}>0 pts</Box>
                        </Box>

                        {/* Fila 6: Campeón bonus 20 pts */}
                        <Box sx={{ ...pointsRow, backgroundColor: `${theme.palette.info.main}08`, borderBottom: 'none' }}>
                          <span>🏆 Campeón: Colombia</span>
                          <span>🏆 Campeón: Colombia</span>
                          <Box component="span" sx={{ fontWeight: 600, color: theme.palette.info.main }}>✓ Exacto (Bonus)</Box>
                          <Box component="span" sx={{ justifySelf: 'end', fontWeight: 700, color: theme.palette.info.main, backgroundColor: `${theme.palette.info.main}30`, px: 2, py: 0.5, borderRadius: 1, border: `2px solid ${theme.palette.info.main}` }}>20 pts ⭐</Box>
                        </Box>
                      </Box>

                      <Box sx={{ p: 2, backgroundColor: `${theme.palette.success.main}10`, borderRadius: 1, borderLeft: `4px solid ${theme.palette.success.main}` }}>
                        <Box component="p" sx={{ m: 0, mb: 1, fontWeight: 600, color: theme.palette.success.main }}>
                          ⭐ BONUS ESPECIAL - COLOMBIA
                        </Box>
                        <Box component="p" sx={{ m: 0, fontSize: '0.9rem', color: theme.palette.text.primary }}>
                          Los marcadores exactos en partidos de <strong>Colombia</strong> valen <strong>5 puntos</strong> en lugar de 3.
                        </Box>
                      </Box>
                      <Box sx={{ p: 2, backgroundColor: `${theme.palette.info.main}10`, borderRadius: 1, borderLeft: `4px solid ${theme.palette.info.main}` }}>
                        <Box component="p" sx={{ m: 0, mb: 1, fontWeight: 600, color: theme.palette.info.main }}>
                          ⭐ BONUS ESPECIAL - CAMPEÓN
                        </Box>
                        <Box component="p" sx={{ m: 0, fontSize: '0.9rem', color: theme.palette.text.primary }}>
                          Acertar al <strong>campeón del torneo</strong> te otorga <strong>20 puntos</strong> adicionales.
                        </Box>
                      </Box>
                    </Stack>
                  ) : (
                    <Box component="p" sx={{ m: 0, color: theme.palette.text.primary, lineHeight: 1.7, fontSize: '0.95rem' }}>
                      {rule.content}
                    </Box>
                  )}
                </Box>
              </Box>
            ))}

            {/* Premiación */}
            <Box component="details" sx={detailsStyles}>
              <Box component="summary">
                <span>🏆 Premiación</span>
                <ExpandMore className="expand-icon" />
              </Box>
              <Box className="details-body">
                <Stack spacing={3}>
                  <Box sx={{ p: 2, backgroundColor: `${theme.palette.primary.main}08`, borderRadius: 1, borderLeft: `4px solid ${theme.palette.primary.main}` }}>
                    <Box component="p" sx={{ m: 0, mb: 1, fontWeight: 600, color: theme.palette.primary.main }}>
                      🎁 Rifas y Sorteos
                    </Box>
                    <Box component="p" sx={{ m: 0, fontSize: '0.9rem', color: theme.palette.text.primary, lineHeight: 1.6 }}>
                      Además de los premios al ranking principal, habrá <strong>rifas y sorteos especiales</strong> durante el torneo. Los participantes podrán ganar premios adicionales a través de sorteos realizados al final de cada fase (Grupos, Eliminatorias, Semis y Final). ¡Cada predicción te da más oportunidades de ganar!
                    </Box>
                  </Box>

                  <Box>
                    <Box component="p" sx={{ m: 0, mb: 2, fontWeight: 600, fontSize: '0.95rem', color: theme.palette.text.primary }}>
                      Premios Principales (Ranking Final):
                    </Box>
                    <Stack spacing={1.5}>
                      {/* 1er Lugar */}
                      <Box sx={{
                        p: 1.5,
                        borderRadius: 1,
                        borderTop: `3px solid ${theme.palette.warning.main}`,
                        backgroundColor: `${theme.palette.warning.main}08`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}>
                        <Box sx={{ fontSize: '2rem' }}>🥇</Box>
                        <Box sx={{ flex: 1, fontWeight: 700, fontSize: '1rem', color: theme.palette.text.primary }}>Primer Lugar</Box>
                        <Box sx={{ fontWeight: 700, fontSize: '1.3rem', color: theme.palette.warning.main }}>$1.000.000</Box>
                      </Box>
                      {/* 2do Lugar */}
                      <Box sx={{
                        p: 1.5,
                        borderRadius: 1,
                        borderTop: `3px solid ${theme.palette.secondary.main}`,
                        backgroundColor: `${theme.palette.secondary.main}08`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}>
                        <Box sx={{ fontSize: '2rem' }}>🥈</Box>
                        <Box sx={{ flex: 1, fontWeight: 700, fontSize: '1rem', color: theme.palette.text.primary }}>Segundo Lugar</Box>
                        <Box sx={{ fontWeight: 700, fontSize: '1.3rem', color: theme.palette.secondary.main }}>$400.000</Box>
                      </Box>
                      {/* 3er Lugar */}
                      <Box sx={{
                        p: 1.5,
                        borderRadius: 1,
                        borderTop: `3px solid #CD7F32`,
                        backgroundColor: `#CD7F3208`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}>
                        <Box sx={{ fontSize: '2rem' }}>🥉</Box>
                        <Box sx={{ flex: 1, fontWeight: 700, fontSize: '1rem', color: theme.palette.text.primary }}>Tercer Lugar</Box>
                        <Box sx={{ fontWeight: 700, fontSize: '1.3rem', color: '#CD7F32' }}>$200.000</Box>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </Box>

            {/* Register Button */}
            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<WhatsApp />}
                onClick={() => {
                  const message = encodeURIComponent('Hola, me gustaría registrarme en Francachela Polla Mundial 2026 🎉');
                  const whatsappUrl = `https://wa.me/573133195197?text=${message}`;
                  window.open(whatsappUrl, '_blank');
                }}
                sx={{ fontWeight: 600, px: 3, py: 1.5, fontSize: '0.95rem' }}
              >
                Registrarme
              </Button>
            </Box>
          </Box>
        )}

        {/* Pestaña 1 - Eventos */}
        {tabValue === 1 && (
          <Box>
            <Box component="h2" sx={{ m: 0, mb: 3, fontSize: '1.5rem', fontWeight: 600, color: theme.palette.text.primary }}>
              🌍 Datos del Torneo
            </Box>

            {/* Card del Mundial */}
            <Box sx={{
              mb: 4,
              borderTop: `4px solid ${theme.palette.primary.main}`,
              backgroundColor: theme.palette.background.paper,
              boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
              borderRadius: 1,
              p: 2,
            }}>
              <Box component="p" sx={{ m: 0, mb: 3, fontWeight: 700, color: theme.palette.secondary.main, fontSize: '1.2rem' }}>
                ⚽ Copa Mundial FIFA 2026
              </Box>
              <Stack spacing={2}>
                {[
                  ['Sede:', 'Canadá, México y EE.UU.'],
                  ['Fechas:', '11 jun - 19 jul 2026'],
                  ['Equipos:', '48 selecciones'],
                  ['Partidos:', '104'],
                ].map(([label, value], i, arr) => (
                  <Box
                    key={label}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pb: i < arr.length - 1 ? 1.5 : 0,
                      borderBottom: i < arr.length - 1 ? `1px solid ${theme.palette.primary.main}15` : 'none',
                    }}
                  >
                    <Box component="span" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>{label}</Box>
                    <Box component="span" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '1rem' }}>{value}</Box>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Box component="h2" sx={{ m: 0, mb: 3, fontSize: '1.5rem', fontWeight: 600, color: theme.palette.text.primary }}>
              📢 Avisos y Novedades
            </Box>

            <Stack spacing={2}>
              {announcements.map((announcement) => (
                <Box
                  key={announcement.id}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    borderLeft: `4px solid ${announcement.severity === 'success' ? theme.palette.primary.main : theme.palette.secondary.main}`,
                    backgroundColor: announcement.severity === 'success'
                      ? `${theme.palette.primary.main}08`
                      : `${theme.palette.secondary.main}08`,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 2,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box component="p" sx={{ m: 0, mb: 1, fontWeight: 600, color: theme.palette.text.primary, fontSize: '1rem' }}>
                      {announcement.title}
                    </Box>
                    <Box component="p" sx={{ m: 0, color: theme.palette.text.primary, fontSize: '0.95rem', lineHeight: 1.6 }}>
                      {announcement.body}
                    </Box>
                  </Box>
                  <Chip
                    label={new Date(announcement.publishedAt).toLocaleDateString('es-ES')}
                    size="small"
                    variant="outlined"
                    sx={{ flexShrink: 0 }}
                  />
                </Box>
              ))}
            </Stack>

            {/* Register Button */}
            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<WhatsApp />}
                onClick={() => {
                  const message = encodeURIComponent('Hola, me gustaría registrarme en Francachela Polla Mundial 2026 🎉');
                  const whatsappUrl = `https://wa.me/573133195197?text=${message}`;
                  window.open(whatsappUrl, '_blank');
                }}
                sx={{ fontWeight: 600, px: 3, py: 1.5, fontSize: '0.95rem' }}
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
