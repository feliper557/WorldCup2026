import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Chip,
  IconButton,
  Drawer,
  Stack,
  Button,
} from '@mui/material';
import {
  SportsSoccer,
  Leaderboard,
  Group,
  InfoOutlined,
  CardGiftcard,
  AdminPanelSettings,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useAuthUser } from '../../hooks/useAuthUser';
import { getLogoutUrl, logout, getStoredToken } from '../../services/auth';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const baseTabs = [
    { label: 'Partidos', icon: <SportsSoccer sx={{ fontSize: 16 }} />, path: '/matches' },
    { label: 'Posiciones', icon: <Leaderboard sx={{ fontSize: 16 }} />, path: '/ranking' },
    { label: 'Participantes', icon: <Group sx={{ fontSize: 16 }} />, path: '/participants' },
    { label: 'Rifas', icon: <CardGiftcard sx={{ fontSize: 16 }} />, path: '/raffles' },
    { label: 'Info', icon: <InfoOutlined sx={{ fontSize: 16 }} />, path: '/info' },
  ];

  // Agregar Admin tab si el usuario es admin
  const isAdmin = user && ('role' in user ? user.role === 'admin' : 'Role' in user && (user as any).Role === 'admin');
  const tabs = isAdmin
    ? [
        ...baseTabs,
        { label: 'Admin', icon: <AdminPanelSettings sx={{ fontSize: 16 }} />, path: '/admin' },
      ]
    : baseTabs;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentTabIndex = tabs.findIndex((tab) => tab.path === location.pathname);
  const activeTabIndex = currentTabIndex >= 0 ? currentTabIndex : 0;

  const handleTabClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Si es JWT login (localStorage), usar logout local
    if (getStoredToken()) {
      logout();
      navigate('/');
    } else {
      // Si es GitHub login, usar Azure logout
      window.location.href = getLogoutUrl();
    }
  };

  const getUserInitial = () => {
    if (!user) return '?';
    // Para JWT users, obtener de displayName
    if ('displayName' in user) {
      return user.displayName?.charAt(0).toUpperCase() || '?';
    }
    // Para GitHub users, obtener de userDetails
    return user?.userDetails?.charAt(0).toUpperCase() || '?';
  };

  const getUserLabel = () => {
    if (!user) return 'Usuario';
    // Para JWT users, mostrar displayName
    if ('displayName' in user) {
      return user.displayName || 'Usuario';
    }
    // Para GitHub users, mostrar userDetails
    return user?.userDetails || 'Usuario';
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          transition: 'all 0.3s ease',
          backgroundColor: scrolled
            ? `${theme.palette.background.default}F2`
            : `${theme.palette.background.default}CC`,
          backdropFilter: scrolled ? 'blur(12px)' : 'blur(8px)',
          borderBottom: `1px solid ${theme.palette.primary.main}${scrolled ? '30' : '15'}`,
          boxShadow: scrolled ? `0 4px 24px rgba(0,0,0,0.3)` : 'none',
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            py: 0,
            pt: 0,
            minHeight: '64px',
          }}
        >
          {/* Logo + Brand */}
          <Box
            onClick={() => navigate('/matches')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 1,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.background.paper,
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              ⚽
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, marginTop: '0px' }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  lineHeight: 1.1,
                }}
              >
                Francachela
              </div>
              <div
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 500,
                  color: theme.palette.primary.main,
                  letterSpacing: '0.08em',
                }}
              >
                POLLA
              </div>
            </Box>
          </Box>

          {/* Center: Tabs (Desktop) */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {tabs.map((tab) => (
                <Box
                  key={tab.path}
                  onClick={() => handleTabClick(tab.path)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    borderRadius: 1,
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    transition: 'all 0.2s ease',
                    color:
                      tab.path === location.pathname
                        ? theme.palette.secondary.main
                        : theme.palette.text.secondary,
                    backgroundColor:
                      tab.path === location.pathname
                        ? `${theme.palette.secondary.main}15`
                        : 'transparent',
                    '&:hover': {
                      color: theme.palette.primary.main,
                      backgroundColor: `${theme.palette.primary.main}08`,
                    },
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </Box>
              ))}
            </Box>
          )}

          {/* Right: World Cup badge + Avatar or Login Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {user ? (
              <>
                {/* World Cup Badge - Desktop (only for authenticated users) */}
                <Chip
                  icon={<span>⚽</span>}
                  label="Mundial 2026"
                  size="small"
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    borderColor: `${theme.palette.warning.main}40`,
                    backgroundColor: `${theme.palette.warning.main}15`,
                    color: theme.palette.warning.main,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                  }}
                  variant="outlined"
                />

                {/* Avatar + Menu */}
                <Avatar
                  onClick={handleMenuOpen}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.background.paper,
                    fontWeight: 600,
                    width: 32,
                    height: 32,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  {getUserInitial()}
                </Avatar>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem disabled>{getUserLabel()}</MenuItem>
                  <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
                </Menu>
              </>
            ) : (
              /* Login Button - for non-authenticated users */
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/login')}
                sx={{
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  py: 0.75,
                  px: 2,
                }}
              >
                Iniciar Sesión
              </Button>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                onClick={() => setMobileOpen(!mobileOpen)}
                sx={{
                  color: theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}15`,
                  },
                }}
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer Menu */}
      <Drawer
        anchor="top"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            backgroundColor: theme.palette.background.default,
            borderBottom: `1px solid ${theme.palette.primary.main}20`,
            marginTop: '64px',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack spacing={1}>
            {/* World Cup Badge Mobile */}
            <Chip
              icon={<span>⚽</span>}
              label="Mundial 2026"
              size="small"
              sx={{
                borderColor: `${theme.palette.warning.main}40`,
                backgroundColor: `${theme.palette.warning.main}15`,
                color: theme.palette.warning.main,
                fontWeight: 600,
                alignSelf: 'flex-start',
              }}
              variant="outlined"
            />

            {/* Navigation Items */}
            {tabs.map((tab) => (
              <Box
                key={tab.path}
                onClick={() => handleTabClick(tab.path)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  borderRadius: 1,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color:
                    tab.path === location.pathname
                      ? theme.palette.secondary.main
                      : theme.palette.text.primary,
                  backgroundColor:
                    tab.path === location.pathname
                      ? `${theme.palette.secondary.main}15`
                      : 'transparent',
                  borderBottom:
                    tab.path === location.pathname
                      ? `2px solid ${theme.palette.secondary.main}`
                      : 'none',
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}08`,
                  },
                }}
              >
                {tab.icon}
                {tab.label}
              </Box>
            ))}
          </Stack>
        </Box>
      </Drawer>

      {/* Spacer for fixed AppBar */}
      <Box sx={{ height: '64px' }} />
    </>
  );
}
