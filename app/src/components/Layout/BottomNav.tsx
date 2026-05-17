import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
} from '@mui/material';
import { Home, Leaderboard, EmojiEvents } from '@mui/icons-material';
import { useAuthUser } from '../../hooks/useAuthUser';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const { user } = useAuthUser();

  if (!user) return null;

  const currentTab = parseInt(searchParams.get('tab') || '0', 10);
  const isMatches = location.pathname === '/matches';
  const isChampion = isMatches && currentTab === 3;
  const isHome = isMatches && !isChampion;
  const isRanking = location.pathname === '/ranking';

  const value = isHome ? 0 : isRanking ? 1 : isChampion ? 2 : false;

  const handleChange = (_: unknown, newValue: number) => {
    if (newValue === 0) navigate('/matches');
    else if (newValue === 1) navigate('/ranking');
    else if (newValue === 2) navigate('/matches?tab=3');
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        display: { xs: 'block', md: 'none' },
        backgroundColor: theme.palette.background.default,
        borderTop: `1px solid ${theme.palette.primary.main}30`,
        borderRadius: 0,
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
        sx={{
          backgroundColor: 'transparent',
          height: 62,
          '& .MuiBottomNavigationAction-root': {
            color: theme.palette.text.secondary,
            minWidth: 0,
            padding: '6px 8px',
            '&.Mui-selected': {
              color: theme.palette.secondary.main,
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            '&.Mui-selected': {
              fontSize: '0.7rem',
            },
          },
        }}
      >
        <BottomNavigationAction label="Casa" icon={<Home />} />
        <BottomNavigationAction label="Ranking" icon={<Leaderboard />} />
        <BottomNavigationAction label="Mi Campeón" icon={<EmojiEvents />} />
      </BottomNavigation>
    </Paper>
  );
}
