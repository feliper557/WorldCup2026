import { useState } from 'react';
import { Box, Container, Typography, Tabs, Tab, Alert, CircularProgress } from '@mui/material';
import { HeroRaffles } from '../components/sections';
import { useRaffles } from '../hooks/useRaffles';
import { RaffleCard } from '../components/raffles/RaffleCard';
import { RaffleJoinDialog } from '../components/raffles/RaffleJoinDialog';
import type { Raffle } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`raffle-tabpanel-${index}`}
      aria-labelledby={`raffle-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export function RafflesPage() {
  const { raffles, loading, error, join, joining } = useRaffles();
  const [tabValue, setTabValue] = useState(0);
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleJoinClick = (raffle: Raffle) => {
    setSelectedRaffle(raffle);
    setDialogOpen(true);
  };

  const handleJoinConfirm = async (tickets: number) => {
    if (selectedRaffle) {
      await join(selectedRaffle.id, tickets);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedRaffle(null);
  };

  // Filtrar rifas por estado
  const openRaffles = raffles.filter((r) => r.status === 'OPEN');
  const drawingRaffles = raffles.filter((r) => r.status === 'DRAWING');
  const completedRaffles = raffles.filter((r) => r.status === 'COMPLETED');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Hero Section */}
      <HeroRaffles />

      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 }, px: { xs: 1, sm: 2 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Error cargando rifas. Por favor intenta de nuevo.
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, overflow: 'hidden' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="raffle tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: { xs: '0.8rem', sm: '0.95rem' },
                fontWeight: 500,
                minWidth: { xs: 'auto', sm: 'inherit' },
                px: { xs: 1.5, sm: 2 },
              },
            }}
          >
            <Tab label={`Abiertas (${openRaffles.length})`} id="raffle-tab-0" aria-controls="raffle-tabpanel-0" />
            <Tab
              label={`Sorteando (${drawingRaffles.length})`}
              id="raffle-tab-1"
              aria-controls="raffle-tabpanel-1"
            />
            <Tab
              label={`Completadas (${completedRaffles.length})`}
              id="raffle-tab-2"
              aria-controls="raffle-tabpanel-2"
            />
          </Tabs>
        </Box>

        {/* Pestaña: Rifas Abiertas */}
        <TabPanel value={tabValue} index={0}>
          {openRaffles.length === 0 ? (
            <Alert severity="info">No hay rifas abiertas en este momento. ¡Vuelve pronto!</Alert>
          ) : (
            <Box>
              {openRaffles.map((raffle) => (
                <RaffleCard
                  key={raffle.id}
                  raffle={raffle}
                  onJoinClick={handleJoinClick}
                  isJoining={joining}
                />
              ))}
            </Box>
          )}
        </TabPanel>

        {/* Pestaña: Rifas Sorteando */}
        <TabPanel value={tabValue} index={1}>
          {drawingRaffles.length === 0 ? (
            <Alert severity="info">No hay rifas en proceso de sorteo. ¡Vuelve pronto!</Alert>
          ) : (
            <Box>
              {drawingRaffles.map((raffle) => (
                <RaffleCard
                  key={raffle.id}
                  raffle={raffle}
                  onJoinClick={handleJoinClick}
                  isJoining={joining}
                />
              ))}
            </Box>
          )}
        </TabPanel>

        {/* Pestaña: Rifas Completadas */}
        <TabPanel value={tabValue} index={2}>
          {completedRaffles.length === 0 ? (
            <Alert severity="info">Aún no hay rifas completadas.</Alert>
          ) : (
            <Box>
              {completedRaffles.map((raffle) => (
                <RaffleCard
                  key={raffle.id}
                  raffle={raffle}
                  onJoinClick={handleJoinClick}
                  isJoining={joining}
                />
              ))}
            </Box>
          )}
        </TabPanel>

        {/* Dialog: Participar en Rifa */}
        <RaffleJoinDialog
          open={dialogOpen}
          raffle={selectedRaffle}
          onClose={handleDialogClose}
          onConfirm={handleJoinConfirm}
          loading={joining}
        />
      </Container>
    </Box>
  );
}
