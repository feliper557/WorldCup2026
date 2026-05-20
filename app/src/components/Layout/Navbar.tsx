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
  Typography,
  Divider,
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
  GetApp as GetAppIcon,
  EmojiEvents,
  KeyboardArrowDown,
  Facebook,
  Instagram,
} from '@mui/icons-material';
import { FACEBOOK_URL, INSTAGRAM_URL } from '../../config/social';
import { useState, useEffect } from 'react';
import { useAuthUser } from '../../hooks/useAuthUser';
import { getLogoutUrl, logout, getStoredToken } from '../../services/auth';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { lazy, Suspense } from 'react';
const ProfileModal = lazy(() =>
  import('../auth/ProfileModal').then(m => ({ default: m.ProfileModal }))
);

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const { canInstall, triggerInstall } = usePWAInstall();

  const baseTabs = [
    { label: 'Partidos', icon: <SportsSoccer sx={{ fontSize: 16 }} />, path: '/matches' },
    { label: 'Posiciones', icon: <Leaderboard sx={{ fontSize: 16 }} />, path: '/ranking' },
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
    handleMenuClose();
    if (getStoredToken()) {
      logout();
      navigate('/');
    } else {
      window.location.href = getLogoutUrl();
    }
  };

  const getUserInitial = () => {
    if (!user) return '?';
    if ('displayName' in user) return user.displayName?.charAt(0).toUpperCase() || '?';
    return (user as any)?.userDetails?.charAt(0).toUpperCase() || '?';
  };

  const getUserLabel = () => {
    if (!user) return 'Usuario';
    if ('displayName' in user) return user.displayName || 'Usuario';
    return (user as any)?.userDetails || 'Usuario';
  };

  const getUserPoints = () => {
    if (!user) return 0;
    return (user as any).totalPoints ?? (user as any).TotalPoints ?? 0;
  };

  const getUserEmail = () => {
    if (!user) return '';
    return (user as any).email ?? (user as any).Email ?? '';
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          backgroundColor: theme.palette.background.default,
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
          {/* Logo + Brand + Redes sociales */}
          <Stack direction="row" alignItems="center" spacing={{ xs: 0.25, sm: 0.75 }}>
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
                component="img"
                src="/Francachelaicon.webp"
                alt="Francachela"
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `2px solid ${theme.palette.primary.main}`,
                  boxShadow: `0 0 0 3px ${theme.palette.primary.main}22`,
                  transition: 'transform 200ms ease, box-shadow 200ms ease',
                  '&:hover': {
                    transform: 'scale(1.04)',
                    boxShadow: `0 0 0 4px ${theme.palette.primary.main}33`,
                  },
                }}
              />
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

            {/* Iconos redes sociales — visibles en todas las vistas */}
            <Stack direction="row" spacing={0}>
              <IconButton
                component="a"
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook de Francachela"
                size="small"
                sx={{
                  p: 0.5,
                  color: theme.palette.text.secondary,
                  transition: 'color 0.2s ease',
                  '&:hover': { color: theme.palette.primary.main },
                }}
              >
                <Facebook sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                component="a"
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Francachela"
                size="small"
                sx={{
                  p: 0.5,
                  color: theme.palette.text.secondary,
                  transition: 'color 0.2s ease',
                  '&:hover': { color: theme.palette.primary.main },
                }}
              >
                <Instagram sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Stack>

          {/* Center: Tabs (Desktop) */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {tabs.map((tab) => {
                const active = tab.path === location.pathname;
                return (
                  <Box
                    key={tab.path}
                    onClick={() => handleTabClick(tab.path)}
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.75,
                      py: 1,
                      borderRadius: 2,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      transition: 'color 200ms ease, background-color 200ms ease',
                      color: active
                        ? theme.palette.secondary.main
                        : theme.palette.text.secondary,
                      backgroundColor: active
                        ? `${theme.palette.secondary.main}14`
                        : 'transparent',
                      '&:hover': {
                        color: active
                          ? theme.palette.secondary.main
                          : theme.palette.primary.main,
                        backgroundColor: active
                          ? `${theme.palette.secondary.main}1A`
                          : `${theme.palette.primary.main}0A`,
                      },
                      '&::after': active
                        ? {
                            content: '""',
                            position: 'absolute',
                            left: '18%',
                            right: '18%',
                            bottom: -10,
                            height: 3,
                            borderRadius: '2px 2px 0 0',
                            backgroundColor: theme.palette.secondary.main,
                          }
                        : {},
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Right: World Cup badge + Avatar or Login Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Botón instalar PWA - Desktop */}
            {canInstall && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<GetAppIcon sx={{ fontSize: 16 }} />}
                onClick={triggerInstall}
                sx={{
                  display: { xs: 'none', sm: 'flex' },
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  py: 0.5,
                  px: 1.5,
                  borderColor: `${theme.palette.primary.main}60`,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: `${theme.palette.primary.main}10`,
                  },
                }}
              >
                Instalar
              </Button>
            )}

            {user ? (
              <>
                {/* World Cup Badge - Desktop (only for authenticated users) */}
                <Chip
                  icon={<SportsSoccer sx={{ fontSize: 14 }} />}
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

                {/* Chip usuario desktop: avatar + nombre + puntos */}
                <Box
                  onClick={handleMenuOpen}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1,
                    py: 0.4,
                    borderRadius: 10,
                    cursor: 'pointer',
                    border: `1.5px solid ${theme.palette.primary.main}50`,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}18 0%, ${theme.palette.secondary.main}10 100%)`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      border: `1.5px solid ${theme.palette.primary.main}`,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}28 0%, ${theme.palette.secondary.main}18 100%)`,
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.background.paper,
                      fontWeight: 700,
                      width: 26,
                      height: 26,
                      fontSize: '0.75rem',
                    }}
                  >
                    {getUserInitial()}
                  </Avatar>
                  <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', lineHeight: 1 }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1.2, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getUserLabel()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <EmojiEvents sx={{ fontSize: 10, color: theme.palette.warning.main }} />
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: theme.palette.warning.main }}>
                        {getUserPoints()} pts
                      </Typography>
                    </Box>
                  </Box>
                  <KeyboardArrowDown sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                </Box>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => { handleMenuClose(); setProfileOpen(true); }}>
                    Mi Perfil
                  </MenuItem>
                  <MenuItem onClick={() => { handleMenuClose(); navigate('/matches?tab=3'); }}>
                    🏆 Mi Campeón
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
                </Menu>

                {/* Profile Modal - lazy: solo se carga al abrir */}
                {profileOpen && (
                  <Suspense fallback={null}>
                    <ProfileModal
                      open={profileOpen}
                      onClose={() => setProfileOpen(false)}
                      user={user}
                    />
                  </Suspense>
                )}
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
                aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={mobileOpen}
                aria-controls="mobile-drawer"
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
        id="mobile-drawer"
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
            {/* Card de perfil móvil */}
            {user && (
              <>
                <Box
                  onClick={() => { setMobileOpen(false); setProfileOpen(true); }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    mb: 0.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}18 0%, ${theme.palette.secondary.main}10 100%)`,
                    border: `1px solid ${theme.palette.primary.main}30`,
                    '&:hover': { border: `1px solid ${theme.palette.primary.main}60` },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.background.paper,
                      fontWeight: 700,
                      width: 44,
                      height: 44,
                      fontSize: '1.1rem',
                      border: `2px solid ${theme.palette.primary.main}`,
                      boxShadow: `0 0 0 3px ${theme.palette.primary.main}25`,
                    }}
                  >
                    {getUserInitial()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: theme.palette.text.primary }} noWrap>
                      {getUserLabel()}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: theme.palette.text.secondary }} noWrap>
                      {getUserEmail()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.3 }}>
                      <EmojiEvents sx={{ fontSize: 12, color: theme.palette.warning.main }} />
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: theme.palette.warning.main }}>
                        {getUserPoints()} puntos
                      </Typography>
                    </Box>
                  </Box>
                  <KeyboardArrowDown sx={{ fontSize: 18, color: theme.palette.text.secondary, transform: 'rotate(-90deg)' }} />
                </Box>
                <Divider sx={{ borderColor: `${theme.palette.primary.main}20` }} />
              </>
            )}

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

            {/* Botón instalar PWA - Mobile */}
            {canInstall && (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GetAppIcon />}
                onClick={() => { triggerInstall(); setMobileOpen(false); }}
                sx={{
                  mt: 1,
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  borderColor: `${theme.palette.primary.main}60`,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: `${theme.palette.primary.main}10`,
                  },
                }}
              >
                Instalar app
              </Button>
            )}
          </Stack>
        </Box>
      </Drawer>

      {/* Spacer for fixed AppBar */}
      <Box sx={{ height: '64px' }} />
    </>
  );
}
