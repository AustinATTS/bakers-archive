/**
 * MUI theme configuration for The Baker's Archive.
 */
import { createTheme } from '@mui/material/styles';

export const breadyColours = {
  primary: '#8B5E3C',
  secondary: '#D4A373',
  background: '#FAF3E0',
  paper: '#FFF8EE',
  accent: '#C49A6C',
  textPrimary: '#3D2B1F',
  textSecondary: '#6B4423',
};

export const theme = createTheme({
  palette: {
    primary: {
      main: breadyColours.primary,
      light: '#A8765A',
      dark: '#6B4423',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: breadyColours.secondary,
      light: '#E8C99B',
      dark: '#B07E4A',
      contrastText: '#3D2B1F',
    },
    background: {
      default: breadyColours.background,
      paper: breadyColours.paper,
    },
    text: {
      primary: breadyColours.textPrimary,
      secondary: breadyColours.textSecondary,
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Playfair Display", "Georgia", serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Playfair Display", "Georgia", serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Playfair Display", "Georgia", serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Playfair Display", "Georgia", serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Playfair Display", "Georgia", serif',
      fontWeight: 500,
    },
    h6: {
      fontFamily: '"Playfair Display", "Georgia", serif',
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(61,43,31,0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});