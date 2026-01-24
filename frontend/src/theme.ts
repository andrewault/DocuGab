import { createTheme, type Theme } from '@mui/material/styles';

const baseTheme = {
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 12,
  },
};

export const darkTheme: Theme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // Indigo
    },
    secondary: {
      main: '#10b981', // Emerald
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
  },
});

export const lightTheme: Theme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#4f46e5', // Indigo
    },
    secondary: {
      main: '#059669', // Emerald
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
});

// Default export for backwards compatibility
export const theme = darkTheme;
