/**
 * Calculate time remaining until a future date.
 * Returns { label, msLeft } or null if time has passed.
 * Note: kickoffUtc is already in Colombia time (UTC-5) from backend.
 */
export function getTimeUntilMatch(kickoffUtc: string): { label: string; msLeft: number } | null {
  const kickoff = new Date(kickoffUtc);
  const now = new Date();
  const diff = kickoff.getTime() - now.getTime();

  if (diff <= 0) return null;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const label = hours > 0 ? `Faltan ${hours}H ${minutes}MIN` : `Faltan ${minutes}MIN`;

  return { label, msLeft: diff };
}

/**
 * Returns semaphore color based on time remaining:
 * > 4h  → green
 * 1–4h  → orange
 * < 1h  → red
 */
export function getCountdownColor(msLeft: number): 'success' | 'warning' | 'error' {
  const hours = msLeft / (1000 * 60 * 60);
  if (hours < 1) return 'error';
  if (hours < 4) return 'warning';
  return 'success';
}
