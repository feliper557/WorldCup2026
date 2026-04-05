import { Box } from '@mui/material';
import { HeroLeaderboard, LeaderboardTable, PointsSystemSection } from '../components/sections';

export function RankingPage() {
  return (
    <Box>
      {/* Hero Section */}
      <HeroLeaderboard />

      {/* Leaderboard Table */}
      <LeaderboardTable />

      {/* Points System Section */}
      <PointsSystemSection />
    </Box>
  );
}
