import React, { useEffect, useRef } from 'react';
import { Box, Container, Typography, useTheme, Stack, Chip } from '@mui/material';
import { FrancachelaWatermark } from '../FrancachelaLogo';

export function HeroMatches() {
  const theme = useTheme();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    el.querySelectorAll<HTMLElement>('.fade-up').forEach((node, idx) => {
      node.style.opacity = '0';
      node.style.animation = `fadeUp 0.6s ease-out ${idx * 0.1}s forwards`;
    });
  }, []);

  return (
    <Box
      ref={heroRef}
      component="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '340px',
        pt: 8,
        pb: 6,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(135deg, ${theme.palette.background.default}dd 0%, ${theme.palette.background.paper}99 100%)`,
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 50%, ${theme.palette.primary.main}08 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, ${theme.palette.secondary.main}08 0%, transparent 50%)`,
          zIndex: 1,
        },
      }}
    >
      {/* Watermark Francachela - Centered Background */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: { xs: '12%', sm: '24%' },
          transform: 'translate(-50%, -50%)',
          opacity: 0.15,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <FrancachelaWatermark position="center" />
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'flex-end' }}
          spacing={4}
        >
          {/* Left: Title Block */}
          <Box sx={{ flex: 1 }}>
            {/* Badge */}
            <Box className="fade-up" sx={{ mb: 2 }}>
              <Chip
                icon={
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.primary.main,
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                      },
                    }}
                  />
                }
                label="Próximos partidos · Mundial 2026"
                size="small"
                sx={{
                  borderColor: `${theme.palette.primary.main}30`,
                  backgroundColor: `${theme.palette.primary.main}10`,
                  color: theme.palette.primary.light,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                }}
                variant="outlined"
              />
            </Box>

            {/* Main Heading */}
            <Box className="fade-up" sx={{ mb: 2 }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  fontWeight: 700,
                  lineHeight: 1.1,
                  mb: 0.5,
                  background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.warning.main} 60%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Próximos
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  fontWeight: 700,
                  lineHeight: 1.1,
                  fontStyle: 'italic',
                  color: theme.palette.text.primary,
                }}
              >
                Partidos
              </Typography>
            </Box>

            {/* Subtitle */}
            <Typography
              className="fade-up"
              variant="body1"
              sx={{
                fontSize: { xs: '0.9rem', sm: '1rem' },
                fontWeight: 300,
                lineHeight: 1.6,
                maxWidth: '420px',
                color: theme.palette.text.secondary,
              }}
            >
              Realiza tus predicciones antes del inicio de cada partido.
              Cada acierto suma puntos para tu ranking ⚽📊
            </Typography>
          </Box>

          {/* Right: Stats */}
          <Stack
            className="fade-up"
            direction={{ xs: 'row', sm: 'row' }}
            spacing={1.5}
            sx={{ flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.5,
                borderRadius: 1.5,
                border: `1px solid ${theme.palette.primary.main}20`,
                backgroundColor: `${theme.palette.background.paper}99`,
                backdropFilter: 'blur(8px)',
              }}
            >
              <Box sx={{ fontSize: '1.3rem' }}>📅</Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: theme.palette.text.secondary,
                    display: 'block',
                    fontWeight: 600,
                  }}
                >
                  Próximo
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    fontSize: '0.9rem',
                  }}
                >
                  6 jun
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.5,
                borderRadius: 1.5,
                border: `1px solid ${theme.palette.primary.main}20`,
                backgroundColor: `${theme.palette.background.paper}99`,
                backdropFilter: 'blur(8px)',
              }}
            >
              <Box sx={{ fontSize: '1.3rem' }}>⚽</Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: theme.palette.text.secondary,
                    display: 'block',
                    fontWeight: 600,
                  }}
                >
                  Partidos
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    fontSize: '0.9rem',
                  }}
                >
                  104
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Stack>

        {/* Decorative Border */}
        <Box
          sx={{
            mt: 4,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}40, transparent)`,
            borderRadius: '50%',
          }}
        />
      </Container>
    </Box>
  );
}
