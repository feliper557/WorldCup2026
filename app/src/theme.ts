import { createTheme } from '@mui/material/styles';

// Paleta de colores: Premium + Francachela
const COLORS = {
  // Base corporativa (70%)
  darkBg: '#1E1E1E',           // Fondo principal oscuro
  darkBgAlt: '#252525',        // Superficies secundarias
  darkBgLight: '#2B2B2B',      // Superficies terciarias

  // Texto
  white: '#F2F2F2',            // Texto principal
  textSecondary: '#A0A0A0',    // Texto secundario gris suave

  // Color primario de marca (20%)
  turquoise: '#4CBFA6',        // Turquesa suave - PRINCIPAL
  mintGreen: '#6ED3B1',        // Verde menta - SECUNDARIO
  petroleo: '#2F8F7B',         // Verde oscuro - DARK

  // Color acento (10%)
  fuchsia: '#F04C93',          // Fucsia - TABS ACTIVAS, BADGES

  // Color de apoyo puntual (solo para datos clave)
  mostaza: '#F2A93B',          // Mostaza - RESALTES IMPORTANTES
};

export const theme = createTheme({
  palette: {
    primary: {
      main: COLORS.turquoise,
      light: COLORS.mintGreen,
      dark: COLORS.petroleo,
      contrastText: COLORS.white,
    },
    secondary: {
      main: COLORS.fuchsia,
      light: COLORS.fuchsia,
      dark: '#D11F6F',
      contrastText: COLORS.white,
    },
    success: {
      main: COLORS.mintGreen,
      light: COLORS.mintGreen,
      dark: COLORS.petroleo,
    },
    warning: {
      main: COLORS.mostaza,
      light: COLORS.mostaza,
      dark: '#D89A35',
    },
    error: {
      main: COLORS.fuchsia,
      light: COLORS.fuchsia,
      dark: '#D11F6F',
    },
    info: {
      main: COLORS.turquoise,
      light: COLORS.mintGreen,
      dark: COLORS.petroleo,
    },
    background: {
      default: COLORS.darkBg,
      paper: COLORS.darkBgAlt,
    },
    text: {
      primary: COLORS.white,
      secondary: COLORS.textSecondary,
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, color: COLORS.white },
    h2: { fontWeight: 700, color: COLORS.white },
    h3: { fontWeight: 700, color: COLORS.white },
    h4: { fontWeight: 600, color: COLORS.white },
    h5: { fontWeight: 600, color: COLORS.white },
    h6: { fontWeight: 600, color: COLORS.white },
    body1: { color: COLORS.white },
    body2: { color: COLORS.textSecondary },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: COLORS.darkBg,
          borderBottom: `2px solid ${COLORS.turquoise}`,
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: '0.5px',
        },
        containedPrimary: {
          backgroundColor: COLORS.turquoise,
          color: COLORS.darkBg,
          '&:hover': {
            backgroundColor: COLORS.petroleo,
            color: COLORS.white,
          },
        },
        containedSecondary: {
          backgroundColor: COLORS.fuchsia,
          color: COLORS.white,
          '&:hover': {
            backgroundColor: '#D11F6F',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: COLORS.darkBgAlt,
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: COLORS.darkBgLight,
          border: `1px solid ${COLORS.darkBgAlt}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: COLORS.darkBgAlt,
            boxShadow: `0 4px 16px rgba(76, 191, 166, 0.15)`,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
        colorPrimary: {
          backgroundColor: COLORS.turquoise,
          color: COLORS.darkBg,
        },
        colorSecondary: {
          backgroundColor: COLORS.fuchsia,
          color: COLORS.white,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${COLORS.darkBgLight}`,
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
          fontWeight: 600,
          fontSize: '0.95rem',
          color: COLORS.textSecondary,
          transition: 'all 0.2s ease',
          '&:hover': {
            color: COLORS.turquoise,
            backgroundColor: `${COLORS.turquoise}08`,
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
          borderColor: COLORS.darkBgLight,
        },
      },
    },
  },
});
