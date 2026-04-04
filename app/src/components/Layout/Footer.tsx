import { Box, Container, Link, Typography, useTheme, Divider, Stack } from '@mui/material';
import { SportsSoccer } from '@mui/icons-material';

export function Footer() {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        borderTop: `1px solid ${theme.palette.primary.main}20`,
        backgroundColor: theme.palette.background.default,
        py: 4,
        px: 2,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={3}
        >
          {/* Logo + Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 0.75,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.background.paper,
                opacity: 0.8,
              }}
            >
              <SportsSoccer sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  color: theme.palette.text.primary,
                  display: 'block',
                }}
              >
                Francachela MX
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: theme.palette.text.secondary,
                  display: 'block',
                }}
              >
                Subachoque · Colombia
              </Typography>
            </Box>
          </Box>

          {/* Links */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              fontSize: '0.85rem',
              fontWeight: 500,
              color: theme.palette.text.secondary,
            }}
          >
            <Link
              href="#"
              sx={{
                color: theme.palette.text.secondary,
                textDecoration: 'none',
                transition: 'color 0.2s ease',
                '&:hover': {
                  color: theme.palette.text.primary,
                },
              }}
            >
              Privacidad
            </Link>
            <Link
              href="#"
              sx={{
                color: theme.palette.text.secondary,
                textDecoration: 'none',
                transition: 'color 0.2s ease',
                '&:hover': {
                  color: theme.palette.text.primary,
                },
              }}
            >
              Términos
            </Link>
            <Link
              href="#"
              sx={{
                color: theme.palette.text.secondary,
                textDecoration: 'none',
                transition: 'color 0.2s ease',
                '&:hover': {
                  color: theme.palette.text.primary,
                },
              }}
            >
              Contacto
            </Link>
          </Box>

          {/* Copyright */}
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: theme.palette.text.secondary,
            }}
          >
            © {currentYear} Francachela · ⚽🌮
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
