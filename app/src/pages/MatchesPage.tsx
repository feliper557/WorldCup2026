import { useState, useEffect, useMemo, useCallback, startTransition, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { syncResults } from '../services/apiClient';
import { HeroMatches } from '../components/sections';
import { MatchCard } from '../components/matches/MatchCard';
import { ResultCard } from '../components/matches/ResultCard';

const PredictionForm = lazy(() =>
  import('../components/matches/PredictionForm').then(m => ({ default: m.PredictionForm }))
);
const ChampionPicker = lazy(() =>
  import('../components/matches/ChampionPicker').then(m => ({ default: m.ChampionPicker }))
);

export function MatchesPage() {
  const [searchParams] = useSearchParams();
  const { matches, loading: matchesLoading, error: matchesError, refetch } = useMatches();
  const { predictions, upsertPrediction, loading: predictLoading } = usePredictions();
  const [tabValue, setTabValue] = useState(() => {
    const tab = parseInt(searchParams.get('tab') || '0', 10);
    return isNaN(tab) ? 0 : tab;
  });

  // Sincronizar tab cuando cambia la URL (ej: desde navbar "Mi Campeón")
  useEffect(() => {
    const tab = parseInt(searchParams.get('tab') || '0', 10);
    startTransition(() => setTabValue(isNaN(tab) ? 0 : tab));
  }, [searchParams]);

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showPredictionForm, setShowPredictionForm] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);

  // Renderizado progresivo: primeros 5 cards inmediatos, resto cuando el browser está idle
  const INITIAL_VISIBLE = 5;
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
    const expand = () => setVisibleCount(Infinity);
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(expand);
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(expand, 300);
    return () => clearTimeout(id);
  }, [tabValue]);

  // Sync en background — no bloquea el render inicial ni crea tareas largas
  useEffect(() => {
    let isMounted = true;
    syncResults()
      .then(() => { if (isMounted) refetch(); })
      .catch((err) => console.error('Error syncing results:', err));
    return () => { isMounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Map de predicciones para búsqueda O(1) en lugar de O(n) por cada partido
  const predictionsMap = useMemo(
    () => new Map<string, Prediction>(predictions.map((p) => [p.matchId, p])),
    [predictions]
  );

  const handleTabChange = useCallback((_: unknown, newValue: number) => {
    startTransition(() => setTabValue(newValue));
  }, []);

  const handlePredictClick = useCallback((match: Match) => {
    setSelectedMatch(match);
    setShowPredictionForm(true);
  }, []);

  const handlePredictionSave = useCallback(async (homeScore: number, awayScore: number) => {
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
  }, [selectedMatch, upsertPrediction]);

  const handleClosePredictionForm = useCallback(() => setShowPredictionForm(false), []);

  const handleStageChange = useCallback((_: unknown, newStages: string[]) => {
    setSelectedStages(newStages);
  }, []);

  // Listas filtradas memoizadas — solo recalculan cuando cambian matches o stages
  const availableStages = useMemo(
    () => Array.from(new Set(matches.map((m) => m.stage))),
    [matches]
  );

  const scheduledMatches = useMemo(() => {
    const now = new Date();
    const filtered = matches.filter(
      (m) => m.status === 'SCHEDULED' && new Date(m.kickoffAtUtc) > now
    );
    return selectedStages.length === 0
      ? filtered
      : filtered.filter((m) => selectedStages.includes(m.stage));
  }, [matches, selectedStages]);

  const liveMatches = useMemo(() => {
    const filtered = matches.filter((m) => m.status === 'LIVE');
    return selectedStages.length === 0
      ? filtered
      : filtered.filter((m) => selectedStages.includes(m.stage));
  }, [matches, selectedStages]);

  const finishedMatches = useMemo(() => {
    const filtered = matches.filter((m) => m.status === 'FINISHED').reverse();
    return selectedStages.length === 0
      ? filtered
      : filtered.filter((m) => selectedStages.includes(m.stage));
  }, [matches, selectedStages]);

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
            <Alert severity="info" sx={{ mb: 2, fontSize: '0.8rem' }}>
              <strong>Partidos DEMO</strong> — Los partidos marcados con la etiqueta <strong>DEMO</strong> son de práctica (La Liga española) y <strong>no suman puntos</strong> al ranking. Su único propósito es que te familiarices con la app antes del Mundial. Los datos DEMO se eliminarán el <strong>1 de junio de 2026</strong>.
            </Alert>
            {scheduledMatches.length === 0 ? (
              <Alert severity="info">No hay partidos disponibles para predecir</Alert>
            ) : (
              scheduledMatches.slice(0, visibleCount).map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictionsMap.get(match.id)}
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
              liveMatches.slice(0, visibleCount).map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictionsMap.get(match.id)}
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
                  onChange={handleStageChange}
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
              finishedMatches.slice(0, visibleCount).map((match) => (
                <ResultCard
                  key={match.id}
                  match={match}
                  prediction={predictionsMap.get(match.id)}
                />
              ))
            )}
          </Box>
        )}

        {/* Pestaña 3 - Mi Campeón */}
        {tabValue === 3 && (
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
            <ChampionPicker />
          </Suspense>
        )}

        {showPredictionForm && (
          <Suspense fallback={null}>
            <PredictionForm
              open={showPredictionForm}
              match={selectedMatch}
              prediction={selectedMatch ? predictionsMap.get(selectedMatch.id) : undefined}
              loading={predictLoading}
              onSave={handlePredictionSave}
              onClose={handleClosePredictionForm}
            />
          </Suspense>
        )}
      </Container>
    </Box>
  );
}
