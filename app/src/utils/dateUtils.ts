/**
 * Calculate time remaining until a future date
 * Returns formatted string like "2H 45MIN" or null if time has passed
 */
export function getTimeUntilMatch(kickoffUtc: string): string | null {
  const kickoff = new Date(kickoffUtc);
  // Convert to Colombia time (UTC-5)
  const colombiaKickoff = new Date(kickoff.getTime() - 5 * 60 * 60 * 1000);

  const now = new Date();
  const diff = colombiaKickoff.getTime() - now.getTime();

  if (diff <= 0) return null; // Match has started or passed

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `Faltan ${hours}H ${minutes}MIN`;
  }
  return `Faltan ${minutes}MIN`;
}
