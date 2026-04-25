import React, { useEffect, useRef } from 'react';
import { Box, Container, Typography, useTheme, Stack, Chip } from '@mui/material';
import { EmojiEvents, SportsFootball, LocalFireDepartment } from '@mui/icons-material';
import { FrancachelaWatermark } from '../FrancachelaLogo';
import { useMatches } from '../../hooks/useMatches';
import type { Score } from '../../types';

interface HeroLeaderboardProps {
  ranking: Score[];
  loading: boolean;
}

export function HeroLeaderboard({ ranking, loading: rankingLoading }: HeroLeaderboardProps) {
  const theme = useTheme();
  const heroRef = useRef<HTMLDivElement>(null);
  const { matches, loading: matchesLoading } = useMatches();

  const leader = ranking.length > 0 ? ranking[0] : null;
  const leaderName = leader?.displayName ?? '...';
  const jugadores = rankingLoading ? '...' : String(ranking.length);

  const stageLabel = (stage: string): string => {
    const map: Record<string, string> = {
      GROUP_STAGE: 'Grupos',
      GROUPS: 'Grupos',
      REGULAR_SEASON: 'Grupos',
      ROUND_OF_16: 'Octavos',
      LAST_16: 'Octavos',
      QUARTER_FINALS: 'Cuartos',
      SEMI_FINALS: 'Semis',
      THIRD_PLACE: '3er Lugar',
      FINAL: 'Final',
    };
    return map[stage?.toUpperCase()] ?? stage ?? 'Grupos';
  };

  const currentRound = (() => {
    if (matchesLoading) return '...';
    const live = matches.find((m) => m.status?.toLowerCase() === 'live');
    if (live) return stageLabel(live.stage);
    const scheduled = matches.find((m) => m.status?.toLowerCase() === 'scheduled');
    if (scheduled) return stageLabel(scheduled.stage);
    return 'Grupos';
  })();

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    // Fade-up animation trigger
    el.querySelectorAll<HTMLElement>('.fade-up').forEach((node, idx) => {
      node.style.opacity = '0';
      node.style.animation = `fadeUp 0.6s ease-out ${idx * 0.1}s forwards`;
    });
  }, []);

  const StatPill = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
  }) => (
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
        whiteSpace: 'nowrap',
      }}
    >
      <Box sx={{ fontSize: '1.3rem' }}>{icon}</Box>
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
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: color,
            fontSize: '0.9rem',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );

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
        '@keyframes fadeUp': {
          from: {
            opacity: 0,
            transform: 'translateY(20px)',
          },
          to: {
            opacity: 0.35,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      {/* Decorative SVG Elements */}
      <FolkArtDecorations theme={theme} />

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

      {/* Content */}
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
                label="En vivo · Mundial 2026"
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
                Tabla de
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
                Posiciones
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
              La polla mundialista oficial de Francachela MX Subachoque.
              Acumula puntos, demuestra tu ojo futbolero 🌮⚽
            </Typography>
          </Box>

          {/* Right: Stat Pills */}
          <Stack
            className="fade-up"
            direction={{ xs: 'row', sm: 'row' }}
            spacing={1.5}
            sx={{ flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}
          >
            <StatPill
              icon={<span>🥇</span>}
              label="Líder"
              value={leaderName}
              color={theme.palette.warning.main}
            />
            <StatPill
              icon={<span>⚽</span>}
              label="Ronda"
              value={currentRound}
              color={theme.palette.primary.main}
            />
            <StatPill
              icon={<span>🔥</span>}
              label="Jugadores"
              value={jugadores}
              color={theme.palette.secondary.main}
            />
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

/* Folk Art Decorations */
function FolkArtDecorations({ theme }: { theme: any }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {/* Top-right: Diamond pattern */}
      <svg
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          opacity: 0.1,
          animation: 'rotate 20s linear infinite',
          willChange: 'transform',
        }}
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
      >
        <polygon points="100,10 190,100 100,190 10,100" stroke={theme.palette.primary.main} strokeWidth="1.5" />
        <polygon points="100,30 170,100 100,170 30,100" stroke={theme.palette.secondary.main} strokeWidth="1" />
        <polygon points="100,50 150,100 100,150 50,100" stroke={theme.palette.warning.main} strokeWidth="1" />
        <circle cx="100" cy="100" r="8" fill={theme.palette.primary.main} fillOpacity="0.3" />
      </svg>

      {/* Bottom-left: Marigold flower */}
      <svg
        style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-60px',
          opacity: 0.08,
        }}
        width="220"
        height="220"
        viewBox="0 0 220 220"
        fill="none"
      >
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
          <ellipse
            key={angle}
            cx="110"
            cy="110"
            rx="18"
            ry="50"
            fill={theme.palette.warning.main}
            transform={`rotate(${angle} 110 110)`}
          />
        ))}
        <circle cx="110" cy="110" r="22" fill={theme.palette.warning.main} />
      </svg>

      {/* Decorative dots */}
      {[
        { x: '15%', y: '30%', c: theme.palette.secondary.main },
        { x: '25%', y: '70%', c: theme.palette.primary.main },
        { x: '75%', y: '25%', c: theme.palette.warning.main },
        { x: '85%', y: '65%', c: theme.palette.secondary.main },
      ].map((dot, i) => (
        <svg
          key={i}
          style={{
            position: 'absolute',
            left: dot.x,
            top: dot.y,
            opacity: 0.15,
          }}
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <circle cx="6" cy="6" r="5" fill={dot.c} />
          <circle cx="6" cy="6" r="2" fill={theme.palette.background.default} />
        </svg>
      ))}

      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}
