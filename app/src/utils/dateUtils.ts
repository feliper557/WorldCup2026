/**
 * Calculate time remaining until a future date
 * Returns formatted string like "2H 45MIN" or null if time has passed
 * Note: kickoffUtc is already in Colombia time (UTC-5) from backend
 */
export function getTimeUntilMatch(kickoffUtc: string): string | null {
  const kickoff = new Date(kickoffUtc);
  // Backend already stores times in Colombia time, no conversion needed
  const now = new Date();
  const diff = kickoff.getTime() - now.getTime();

  if (diff <= 0) return null; // Match has started or passed

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `Faltan ${hours}H ${minutes}MIN`;
  }
  return `Faltan ${minutes}MIN`;
}
