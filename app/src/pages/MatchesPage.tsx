import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Container,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import type { Match, Prediction } from '../types';
import { useMatches, usePredictions } from '../hooks';
import { HeroMatches } from '../components/sections';
import { MatchCard } from '../components/matches/MatchCard';
import { ResultCard } from '../components/matches/ResultCard';
import { PredictionForm } from '../components/matches/PredictionForm';
import { ChampionPicker } from '../components/matches/ChampionPicker';

export function MatchesPage() {
  const { matches, loading: matchesLoading, error: matchesError } = useMatches();
  const { predictions, upsertPrediction, loading: predictLoading } = usePredictions();
  const [tabValue, setTabValue] = useState(0);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showPredictionForm, setShowPredictionForm] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);

  const handleTabChange = (_: unknown, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePredictClick = (match: Match) => {
    setSelectedMatch(match);
    setShowPredictionForm(true);
  };

  const handlePredictionSave = async (homeScore: number, awayScore: number) => {
    if (!selectedMatch) return;

    try {
      await upsertPrediction({
        matchId: selectedMatch.id,
        home: homeScore,
        away: awayScore,
      });
      setShowPredictionForm(false);
      setSelectedMatch(null);
    } catch (err) {
      console.error('Error saving prediction:', err);
    }
  };

  const getPredictionByMatchId = (matchId: string): Prediction | undefined => {
    return predictions.find((p) => p.matchId === matchId);
  };

  const filterMatchesByStatus = (status: 'SCHEDULED' | 'LIVE' | 'FINISHED') => {
    return matches.filter((m) => m.status === status);
  };

  const filterByStage = (matchList: Match[]) => {
    if (selectedStages.length === 0) return matchList;
    return matchList.filter((m) => selectedStages.includes(m.stage));
  };

  const availableStages = Array.from(new Set(matches.map((m) => m.stage)));

  if (matchesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (matchesError) {
    return <Alert severity="error">Error cargando partidos: {matchesError.message}</Alert>;
  }

  const scheduledMatches = filterByStage(filterMatchesByStatus('SCHEDULED'));
  const liveMatches = filterByStage(filterMatchesByStatus('LIVE'));
  const finishedMatches = filterByStage(filterMatchesByStatus('FINISHED')).reverse();

  return (
    <Box>
      {/* Hero Section */}
      <HeroMatches />

      <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 4 }, px: { xs: 1, sm: 2 } }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, overflow: 'hidden' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 500,
                minWidth: { xs: 'auto', sm: 'inherit' },
                px: { xs: 1.5, sm: 2 },
              },
            }}
          >
            <Tab label={`Disponibles (${scheduledMatches.length})`} />
            <Tab label={`En Vivo (${liveMatches.length})`} />
            <Tab label={`Resultados (${finishedMatches.length})`} />
            <Tab label="🏆 Campeón" />
          </Tabs>
        </Box>

      {/* Pestaña 0 - Disponibles */}
      {tabValue === 0 && (
        <Box>
          {scheduledMatches.length === 0 ? (
            <Alert severity="info">No hay partidos disponibles para predecir</Alert>
          ) : (
            scheduledMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={getPredictionByMatchId(match.id)}
                onPredictClick={handlePredictClick}
              />
            ))
          )}
        </Box>
      )}

      {/* Pestaña 1 - En Vivo */}
      {tabValue === 1 && (
        <Box>
          {liveMatches.length === 0 ? (
            <Alert severity="info">No hay partidos en curso</Alert>
          ) : (
            liveMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={getPredictionByMatchId(match.id)}
                onPredictClick={handlePredictClick}
              />
            ))
          )}
        </Box>
      )}

      {/* Pestaña 2 - Resultados */}
      {tabValue === 2 && (
        <Box>
          {availableStages.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <ToggleButtonGroup
                value={selectedStages}
                onChange={(_, newStages) => setSelectedStages(newStages)}
                size="small"
                fullWidth
              >
                {availableStages.map((stage) => (
                  <ToggleButton key={stage} value={stage}>
                    {stage}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}

          {finishedMatches.length === 0 ? (
            <Alert severity="info">No hay resultados disponibles</Alert>
          ) : (
            finishedMatches.map((match) => (
              <ResultCard
                key={match.id}
                match={match}
                prediction={getPredictionByMatchId(match.id)}
              />
            ))
          )}
        </Box>
      )}

      {/* Pestaña 3 - Mi Campeón */}
      {tabValue === 3 && (
        <ChampionPicker />
      )}

        <PredictionForm
          open={showPredictionForm}
          match={selectedMatch}
          prediction={selectedMatch ? getPredictionByMatchId(selectedMatch.id) : undefined}
          loading={predictLoading}
          onSave={handlePredictionSave}
          onClose={() => setShowPredictionForm(false)}
        />
      </Container>
    </Box>
  );
}
