const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Fase de Grupos',
  ROUND_OF_16: 'Octavos de Final',
  QUARTER_FINALS: 'Cuartos de Final',
  QUARTER_FINAL: 'Cuartos de Final',
  SEMI_FINALS: 'Semifinal',
  SEMI_FINAL: 'Semifinal',
  FINAL: 'Final',
  THIRD_PLACE: 'Tercer Puesto',
  THIRD_PLACE_PLAYOFF: 'Tercer Puesto',
  REGULAR_SEASON: 'Liga Regular',
};

export function getStageLabel(stage?: string | null): string {
  if (!stage) return '';
  const normalized = stage.toUpperCase().replace(/\s+/g, '_');
  return STAGE_LABELS[normalized] ?? stage;
}
