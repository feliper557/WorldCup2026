import { createTheme, alpha } from '@mui/material/styles';

// ==========================================================================
// Francachela World Cup 2026 — Design System
// Basado en la paleta de marca existente + principios UI/UX Pro Max
// ("Liquid Glass" adaptado a los colores de Francachela).
// ==========================================================================

const COLORS = {
  // Base corporativa (70%)
  darkBg: '#1E1E1E',          // Fondo principal
  darkBgAlt: '#252525',       // Superficies secundarias (Paper)
  darkBgLight: '#2B2B2B',     // Superficies terciarias (Card)
  darkBgHover: '#303030',     // Hover para filas/zonas interactivas

  // Texto
  white: '#F2F2F2',
  textSecondary: '#A0A0A0',
  textMuted: '#6B6B6B',

  // Primario de marca (20%)
  turquoise: '#4CBFA6',       // Turquesa — PRINCIPAL
  mintGreen: '#6ED3B1',       // Verde menta — light
  petroleo: '#2F8F7B',        // Verde oscuro — dark

  // Acento (10%)
  fuchsia: '#F04C93',         // Fucsia — activo / error / destacados
  fuchsiaDark: '#D11F6F',

  // Apoyo puntual (datos clave)
  mostaza: '#F2A93B',         // Mostaza — warning / highlights
  mostazaDark: '#D89A35',
};

// Escala consistente (tokens)
const SHAPE_RADIUS = 12;

const SHADOWS = {
  soft: '0 2px 8px rgba(0,0,0,0.25)',
  medium: '0 6px 20px rgba(0,0,0,0.35)',
  glow: `0 8px 28px ${alpha(COLORS.turquoise, 0.18)}`,
  glowFuchsia: `0 8px 28px ${alpha(COLORS.fuchsia, 0.20)}`,
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: COLORS.turquoise,
      light: COLORS.mintGreen,
      dark: COLORS.petroleo,
      contrastText: COLORS.darkBg,
    },
    secondary: {
      main: COLORS.fuchsia,
      light: '#F56BA5',
      dark: COLORS.fuchsiaDark,
      contrastText: COLORS.white,
    },
    success: {
      main: COLORS.mintGreen,
      light: COLORS.mintGreen,
      dark: COLORS.petroleo,
      contrastText: COLORS.darkBg,
    },
    warning: {
      main: COLORS.mostaza,
      light: COLORS.mostaza,
      dark: COLORS.mostazaDark,
      contrastText: COLORS.darkBg,
    },
    error: {
      main: COLORS.fuchsia,
      light: '#F56BA5',
      dark: COLORS.fuchsiaDark,
      contrastText: COLORS.white,
    },
    info: {
      main: COLORS.turquoise,
      light: COLORS.mintGreen,
      dark: COLORS.petroleo,
      contrastText: COLORS.darkBg,
    },
    background: {
      default: COLORS.darkBg,
      paper: COLORS.darkBgAlt,
    },
    text: {
      primary: COLORS.white,
      secondary: COLORS.textSecondary,
      disabled: COLORS.textMuted,
    },
    divider: alpha(COLORS.white, 0.08),
  },

  shape: {
    borderRadius: SHAPE_RADIUS,
  },

  typography: {
    fontFamily:
      '"Inter", "Satoshi", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em', color: COLORS.white, lineHeight: 1.1 },
    h2: { fontWeight: 800, letterSpacing: '-0.02em', color: COLORS.white, lineHeight: 1.15 },
    h3: { fontWeight: 700, letterSpacing: '-0.01em', color: COLORS.white, lineHeight: 1.2 },
    h4: { fontWeight: 700, color: COLORS.white, lineHeight: 1.25 },
    h5: { fontWeight: 700, color: COLORS.white, lineHeight: 1.3 },
    h6: { fontWeight: 600, color: COLORS.white, lineHeight: 1.35 },
    subtitle1: { fontWeight: 600, color: COLORS.white },
    subtitle2: { fontWeight: 600, color: COLORS.textSecondary, letterSpacing: '0.02em' },
    body1: { color: COLORS.white, lineHeight: 1.65 },
    body2: { color: COLORS.textSecondary, lineHeight: 1.6 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.02em' },
    caption: { color: COLORS.textSecondary, letterSpacing: '0.03em' },
    overline: { fontWeight: 700, letterSpacing: '0.12em', color: COLORS.textSecondary },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Focus visible accesible y respeto a prefers-reduced-motion
        '*, *::before, *::after': {
          boxSizing: 'border-box',
        },
        'html, body': {
          backgroundColor: COLORS.darkBg,
          color: COLORS.white,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        ':focus-visible': {
          outline: `2px solid ${COLORS.turquoise}`,
          outlineOffset: '2px',
          borderRadius: '4px',
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.001ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.001ms !important',
            scrollBehavior: 'auto !important',
          },
        },
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.55 },
        },
        '@keyframes fadeUp': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        // Scrollbar sutil
        '::-webkit-scrollbar': { width: 10, height: 10 },
        '::-webkit-scrollbar-track': { background: COLORS.darkBg },
        '::-webkit-scrollbar-thumb': {
          background: alpha(COLORS.turquoise, 0.25),
          borderRadius: 8,
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: alpha(COLORS.turquoise, 0.45),
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: COLORS.darkBg,
          borderBottom: `1px solid ${alpha(COLORS.turquoise, 0.18)}`,
          boxShadow: 'none',
          backgroundImage: 'none',
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: '0.02em',
          transition: 'all 200ms ease',
          paddingLeft: 18,
          paddingRight: 18,
        },
        contained: {
          fontWeight: 600,
        },
        containedPrimary: {
          backgroundColor: COLORS.turquoise,
          color: COLORS.darkBg,
          boxShadow: SHADOWS.glow,
          '&:hover': {
            backgroundColor: COLORS.mintGreen,
            color: COLORS.darkBg,
            boxShadow: `0 10px 32px ${alpha(COLORS.turquoise, 0.28)}`,
          },
        },
        containedSecondary: {
          backgroundColor: COLORS.fuchsia,
          color: COLORS.white,
          boxShadow: SHADOWS.glowFuchsia,
          '&:hover': {
            backgroundColor: COLORS.fuchsiaDark,
            boxShadow: `0 10px 32px ${alpha(COLORS.fuchsia, 0.32)}`,
          },
        },
        outlinedPrimary: {
          borderColor: alpha(COLORS.turquoise, 0.5),
          color: COLORS.turquoise,
          '&:hover': {
            borderColor: COLORS.turquoise,
            backgroundColor: alpha(COLORS.turquoise, 0.08),
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: COLORS.darkBgAlt,
          backgroundImage: 'none',
          borderRadius: SHAPE_RADIUS,
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: COLORS.darkBgLight,
          border: `1px solid ${alpha(COLORS.white, 0.06)}`,
          borderRadius: SHAPE_RADIUS,
          boxShadow: SHADOWS.soft,
          transition: 'border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease',
          '&:hover': {
            borderColor: alpha(COLORS.turquoise, 0.35),
            boxShadow: SHADOWS.glow,
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
          letterSpacing: '0.02em',
        },
        colorPrimary: {
          backgroundColor: alpha(COLORS.turquoise, 0.16),
          color: COLORS.mintGreen,
          border: `1px solid ${alpha(COLORS.turquoise, 0.35)}`,
        },
        colorSecondary: {
          backgroundColor: alpha(COLORS.fuchsia, 0.16),
          color: '#F56BA5',
          border: `1px solid ${alpha(COLORS.fuchsia, 0.35)}`,
        },
        colorSuccess: {
          backgroundColor: alpha(COLORS.mintGreen, 0.18),
          color: COLORS.mintGreen,
          border: `1px solid ${alpha(COLORS.mintGreen, 0.35)}`,
        },
        colorWarning: {
          backgroundColor: alpha(COLORS.mostaza, 0.18),
          color: COLORS.mostaza,
          border: `1px solid ${alpha(COLORS.mostaza, 0.35)}`,
        },
        colorError: {
          backgroundColor: alpha(COLORS.fuchsia, 0.18),
          color: '#F56BA5',
          border: `1px solid ${alpha(COLORS.fuchsia, 0.4)}`,
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${alpha(COLORS.white, 0.08)}`,
          minHeight: 44,
        },
        indicator: {
          backgroundColor: COLORS.fuchsia,
          height: 3,
          borderRadius: '2px 2px 0 0',
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          fontWeight: 600,
          fontSize: '0.95rem',
          color: COLORS.textSecondary,
          transition: 'color 200ms ease, background-color 200ms ease',
          '&:hover': {
            color: COLORS.turquoise,
            backgroundColor: alpha(COLORS.turquoise, 0.06),
          },
          '&.Mui-selected': {
            color: COLORS.fuchsia,
          },
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha(COLORS.white, 0.08),
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(COLORS.white, 0.12),
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(COLORS.turquoise, 0.45),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: COLORS.turquoise,
            borderWidth: 2,
          },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'background-color 180ms ease, color 180ms ease',
          '&:hover': {
            backgroundColor: alpha(COLORS.turquoise, 0.10),
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${alpha(COLORS.white, 0.06)}`,
        },
        head: {
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontSize: '0.72rem',
          color: COLORS.textSecondary,
          backgroundColor: alpha(COLORS.darkBg, 0.6),
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 160ms ease',
          '&:hover': {
            backgroundColor: alpha(COLORS.turquoise, 0.06),
          },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, backgroundColor: alpha(COLORS.white, 0.08) },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: `1px solid ${alpha(COLORS.white, 0.08)}`,
        },
        standardWarning: {
          backgroundColor: alpha(COLORS.mostaza, 0.12),
          color: COLORS.mostaza,
        },
        standardSuccess: {
          backgroundColor: alpha(COLORS.mintGreen, 0.12),
          color: COLORS.mintGreen,
        },
        standardError: {
          backgroundColor: alpha(COLORS.fuchsia, 0.14),
          color: '#F56BA5',
        },
        standardInfo: {
          backgroundColor: alpha(COLORS.turquoise, 0.12),
          color: COLORS.mintGreen,
        },
      },
    },
  },
});
