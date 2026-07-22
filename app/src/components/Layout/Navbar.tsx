import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Box, useMediaQuery, useTheme, IconButton, Stack } from '@mui/material';
import { Facebook, Instagram } from '@mui/icons-material';
import { FACEBOOK_URL, INSTAGRAM_URL } from '../../config/social';
import { useState, useEffect } from 'react';

export function Navbar() {
  const navigate = useNavigate();
  const theme = useTheme();
  useMediaQuery(theme.breakpoints.down('sm'));

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
              onClick={() => navigate('/')}
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
        </Toolbar>
      </AppBar>

      {/* Spacer for fixed AppBar */}
      <Box sx={{ height: '64px' }} />
    </>
  );
}
