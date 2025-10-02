import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import type { ReactNode } from 'react';

export const designTokens = {
  colors: {
    highlight: '#b48ead',
    headerBackground: '#0f172a',
    subheaderBackground: '#0b1120',
    logoBlue: '#1D4ED8',
    background: '#f8fafc',
    surface: '#ffffff',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    subheaderTabHover: 'rgba(180, 142, 173, 0.12)',
    subheaderTabActive: 'rgba(180, 142, 173, 0.24)',
    createUserButton: '#2563eb',
    createUserButtonHover: '#1d4ed8',
  },
};

export const LOGO_BLUE = designTokens.colors.logoBlue;

export const theme = createTheme({
  palette: {
    primary: {
      main: designTokens.colors.highlight,
    },
    background: {
      default: designTokens.colors.background,
      paper: designTokens.colors.surface,
    },
    text: {
      primary: designTokens.colors.textPrimary,
      secondary: designTokens.colors.textSecondary,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: designTokens.colors.headerBackground,
          color: designTokens.colors.surface,
        },
      },
    },
    MuiListSubheader: {
      styleOverrides: {
        root: {
          backgroundColor: designTokens.colors.subheaderBackground,
          color: designTokens.colors.surface,
        },
      },
    },
  },
});

type DesignSystemProviderProps = {
  children: ReactNode;
};

export function DesignSystemProvider({ children }: DesignSystemProviderProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
