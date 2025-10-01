import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import type { ReactNode } from 'react';

export const designTokens = {
  colors: {
    highlight: '#ec4899',
    headerBackground: '#0f172a',
    background: '#f8fafc',
    surface: '#ffffff',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
  },
};

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
