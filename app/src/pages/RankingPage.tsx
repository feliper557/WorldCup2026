import { Box } from '@mui/material';
import { HeroLeaderboard, LeaderboardTable, PointsSystemSection } from '../components/sections';
import { useRanking } from '../hooks/useRanking';

export function RankingPage() {
  const { ranking, loading, error } = useRanking();

  return (
    <Box>
      <HeroLeaderboard ranking={ranking} loading={loading} />
      <LeaderboardTable ranking={ranking} loading={loading} error={error} />
      <PointsSystemSection />
    </Box>
  );
}
