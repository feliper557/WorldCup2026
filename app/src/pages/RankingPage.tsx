import { Box } from '@mui/material';
import { HeroLeaderboard, LeaderboardTable } from '../components/sections';

export function RankingPage() {
  return (
    <Box>
      {/* Hero Section */}
      <HeroLeaderboard />

      {/* Leaderboard Table with Mock Data */}
      <LeaderboardTable />
    </Box>
  );
}
