import React from 'react';
import { Box, Container, Typography, useTheme, Button } from '@mui/material';
import { WhatsApp } from '@mui/icons-material';
import { FrancachelaWatermark } from '../FrancachelaLogo';

export function HeroInfo() {
  const theme = useTheme();

  React.useEffect(() => {
    const el = document.querySelector('[data-hero-info]');
    if (!el) return;

    el.querySelectorAll<HTMLElement>('.fade-up').forEach((node, idx) => {
      node.style.opacity = '0';
      node.style.animation = `fadeUp 0.6s ease-out ${idx * 0.1}s forwards`;
    });
  }, []);

  return (
    <Box
      data-hero-info
      component="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '300px',
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
        <Box>
          {/* Main Heading */}
          <Box className="fade-up" sx={{ mb: 2 }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                fontWeight: 700,
                lineHeight: 1.1,
                mb: 0.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 60%, ${theme.palette.warning.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Información
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
              maxWidth: '500px',
              color: theme.palette.text.secondary,
              mb: 3,
            }}
          >
            Conoce las reglas del juego, datos del torneo y mantente al día con los últimos avisos
          </Typography>

          {/* Register Button */}
          <Button
            className="fade-up"
            variant="contained"
            color="success"
            startIcon={<WhatsApp />}
            onClick={() => {
              const message = encodeURIComponent(
                'Hola, me gustaría registrarme en Francachela Polla Mundial 2026 🎉'
              );
              const whatsappUrl = `https://wa.me/573133195197?text=${message}`;
              window.open(whatsappUrl, '_blank');
            }}
            sx={{
              fontWeight: 600,
              px: 3,
              py: 1.5,
              fontSize: '0.95rem',
            }}
          >
            Registrarme
          </Button>
        </Box>

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
