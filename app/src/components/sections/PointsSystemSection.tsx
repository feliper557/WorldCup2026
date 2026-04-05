import { useState } from 'react';
import { Box, Container, Paper, Stack, Typography, useTheme, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { ChampionPicker } from '../matches/ChampionPicker';

export function PointsSystemSection() {
  const theme = useTheme();
  const [championDialogOpen, setChampionDialogOpen] = useState(false);

  return (
    <Box component="section" sx={{ py: { xs: 4, sm: 6 }, px: { xs: 1, sm: 2 } }}>
      <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 2 } }}>
        {/* Section Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              backgroundColor: `${theme.palette.primary.main}20`,
              color: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
            }}
          >
            🎯
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Sistema de Puntos
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              Conoce cómo se calculan los puntos en la polla
            </Typography>
          </Box>
        </Stack>

        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            backgroundColor: `rgba(30,30,30,0.6)`,
            border: `1px solid ${theme.palette.primary.main}15`,
            backdropFilter: 'blur(8px)',
            borderRadius: 2,
          }}
        >
          <Stack spacing={2}>
            {/* Tabla de ejemplos */}
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: `${theme.palette.warning.main}15` }}>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700, fontSize: '0.7rem', color: theme.palette.warning.main }}>Resultado Real</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700, fontSize: '0.7rem', color: theme.palette.warning.main }}>Tu Predicción</th>
                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 700, fontSize: '0.7rem', color: theme.palette.warning.main }}>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${theme.palette.primary.main}10` }}>
                    <td style={{ padding: '8px', fontSize: '0.75rem' }}>Argentina 3 - 1 Francia</td>
                    <td style={{ padding: '8px', fontSize: '0.75rem' }}>Argentina 3 - 1 Francia</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: theme.palette.warning.main }}>3 pts</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${theme.palette.primary.main}10`, backgroundColor: `${theme.palette.success.main}08` }}>
                    <td style={{ padding: '8px', fontSize: '0.75rem' }}>🇨🇴 Colombia 2 - 1 Perú</td>
                    <td style={{ padding: '8px', fontSize: '0.75rem' }}>🇨🇴 Colombia 2 - 1 Perú</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: theme.palette.success.main }}>5 pts ⭐</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${theme.palette.primary.main}10` }}>
                    <td style={{ padding: '8px', fontSize: '0.75rem' }}>Brasil 2 - 0 Alemania</td>
                    <td style={{ padding: '8px', fontSize: '0.75rem' }}>Brasil 1 - 0 Alemania</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: theme.palette.secondary.main }}>1 pt</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${theme.palette.primary.main}10` }}>
                    <td style={{ padding: '8px', fontSize: '0.75rem' }}>Holanda 1 - 2 Portugal</td>
                    <td style={{ padding: '8px', fontSize: '0.75rem' }}>Holanda 2 - 1 Portugal</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: theme.palette.text.secondary }}>0 pts</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${theme.palette.primary.main}10`, backgroundColor: `${theme.palette.info.main}08` }}>
                    <td style={{ padding: '8px', fontSize: '0.75rem' }}>🏆 Campeón: Colombia</td>
                    <td style={{ padding: '8px', fontSize: '0.75rem' }}>🏆 Campeón: Colombia</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: theme.palette.info.main }}>20 pts ⭐</td>
                  </tr>
                </tbody>
              </table>
            </Box>

            {/* Información sobre bonus Colombia */}
            <Box sx={{ p: 1.5, backgroundColor: `${theme.palette.success.main}10`, borderRadius: 1, borderLeft: `4px solid ${theme.palette.success.main}` }}>
              <Typography sx={{ fontWeight: 600, color: theme.palette.success.main, mb: 0.5, fontSize: '0.75rem' }}>
                ⭐ BONUS - COLOMBIA
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: theme.palette.text.primary, lineHeight: 1.5 }}>
                Los marcadores exactos en partidos de <strong>Colombia</strong> valen <strong>5 puntos</strong> en lugar de 3.
              </Typography>
            </Box>

            {/* Información sobre bonus Campeón */}
            <Box sx={{ p: 1.5, backgroundColor: `${theme.palette.info.main}10`, borderRadius: 1, borderLeft: `4px solid ${theme.palette.info.main}` }}>
              <Typography sx={{ fontWeight: 600, color: theme.palette.info.main, mb: 0.5, fontSize: '0.75rem' }}>
                ⭐ BONUS - CAMPEÓN
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: theme.palette.text.primary, lineHeight: 1.5 }}>
                Acertar al <strong>campeón del torneo</strong> te otorga <strong>20 puntos</strong> adicionales.
              </Typography>
            </Box>

            {/* Resumen de reglas */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5 }}>
              <Paper
                sx={{
                  p: 1.5,
                  backgroundColor: 'rgba(37,37,37,0.6)',
                  border: `1px solid ${theme.palette.primary.main}10`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  borderRadius: 1,
                }}
              >
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: theme.palette.warning.main }}>3 pts</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary }}>Marcador exacto</Typography>
              </Paper>

              <Paper
                sx={{
                  p: 1.5,
                  backgroundColor: 'rgba(37,37,37,0.6)',
                  border: `1px solid ${theme.palette.primary.main}10`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  borderRadius: 1,
                }}
              >
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: theme.palette.success.main }}>5 pts</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary }}>Colombia exacto ⭐</Typography>
              </Paper>

              <Paper
                sx={{
                  p: 1.5,
                  backgroundColor: 'rgba(37,37,37,0.6)',
                  border: `1px solid ${theme.palette.primary.main}10`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  borderRadius: 1,
                }}
              >
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: theme.palette.secondary.main }}>1 pt</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary }}>Ganador/empate</Typography>
              </Paper>

              <Button
                onClick={() => setChampionDialogOpen(true)}
                sx={{
                  p: 1.5,
                  backgroundColor: 'rgba(37,37,37,0.6)',
                  border: `1px solid ${theme.palette.primary.main}10`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  borderRadius: 1,
                  textTransform: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(37,37,37,0.9)',
                    borderColor: theme.palette.info.main,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: theme.palette.info.main }}>20 pts</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary }}>Campeón ⭐</Typography>
              </Button>
            </Box>
          </Stack>
        </Paper>

        {/* Dialog para elegir campeón */}
        <Dialog
          open={championDialogOpen}
          onClose={() => setChampionDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            🏆 Elige el Campeón del Mundial 2026
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <ChampionPicker />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChampionDialogOpen(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
