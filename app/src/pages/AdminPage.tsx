import { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import { useAdmin } from '../hooks/useAdmin';
import { InvitationForm } from '../components/admin/InvitationForm';
import { UserTable } from '../components/admin/UserTable';
import { RaffleManager } from '../components/admin/RaffleManager';
import { MatchSyncPanel } from '../components/admin/MatchSyncPanel';
import { useRaffles } from '../hooks/useRaffles';

export function AdminPage() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const { users, invitations, loading, error, sendInvitation, resetPassword, toggleActive } = useAdmin();
  const { raffles, loading: rafflesLoading, createRaffle, drawRaffle } = useRaffles();

  const handleTabChange = (_: unknown, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading || rafflesLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1,
          }}
        >
          <Box
            sx={{
              fontSize: '2rem',
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.warning.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ⚙️ Panel de Administración
          </Box>
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error cargando datos: {error.message}
        </Alert>
      )}

      {/* Tabs */}
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
          <Tab label="📧 Invitaciones" />
          <Tab label="👥 Usuarios" />
          <Tab label="🎁 Rifas" />
          <Tab label="⚽ Partidos" />
        </Tabs>
      </Box>

      {/* Tab 0: Invitaciones */}
      {tabValue === 0 && (
        <InvitationForm
          onSubmit={sendInvitation}
          invitations={invitations}
          loading={loading}
        />
      )}

      {/* Tab 1: Usuarios */}
      {tabValue === 1 && (
        <UserTable
          users={users}
          onResetPassword={resetPassword}
          onToggleActive={toggleActive}
          loading={loading}
        />
      )}

      {/* Tab 2: Rifas */}
      {tabValue === 2 && (
        <RaffleManager
          raffles={raffles}
          onCreateRaffle={createRaffle}
          onDrawRaffle={drawRaffle}
          loading={rafflesLoading}
        />
      )}

      {/* Tab 3: Partidos */}
      {tabValue === 3 && <MatchSyncPanel />}
    </Container>
  );
}
