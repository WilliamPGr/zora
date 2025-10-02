import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import type { ReactNode } from 'react';

export const designTokens = {
  colors: {
    highlight: '#2563eb',
    headerBackground: '#0f172a',
    subheaderBackground: '#0b1120',
    logoBlue: '#2563eb',
    productTitle: '#1f2937',
    background: '#f8fafc',
    surface: '#ffffff',
    textPrimary: '#1457f4ff',
    textSecondary: '#334155',
    subheaderTabHover: 'rgba(180, 142, 173, 0.12)',
    subheaderTabActive: 'rgba(180, 142, 173, 0.24)',
    createUserButton: '#2563eb',
    createUserButtonHover: '#1d4ed8',
    priceTagBackground: '#2563eb',
    priceTagText: '#ffffff',
    viewDetailsButton: '#2563eb',
    viewDetailsButtonHover: '#1d4ed8',
    viewDetailsButtonText: '#ffffff',
    categoryChipBackground: '#2563eb',
    categoryChipText: '#ffffffff',
  },
  sizes: {
    priceTag: {
      fontSize: '1rem',
      paddingX: '0.9rem',
      paddingY: '0.35rem',
      borderRadius: '999px',
    },
    viewDetailsButton: {
      fontSize: '1rem',
      paddingX: '1.5rem',
      paddingY: '0.75rem',
      borderRadius: '999px',
    },
  },
};

export const LOGO_COLOR_VARIABLE = '--zora-logo-color';
export const LOGO_COLOR = `var(${LOGO_COLOR_VARIABLE})`;
export const PRODUCT_NAME_COLOR_VARIABLE = '--zora-product-name-color';
export const PRODUCT_NAME_COLOR = `var(${PRODUCT_NAME_COLOR_VARIABLE})`;

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
  typography: {
    fontFamily: '"Old North", "Times New Roman", serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          [LOGO_COLOR_VARIABLE]: designTokens.colors.logoBlue,
          [PRODUCT_NAME_COLOR_VARIABLE]: designTokens.colors.productTitle,
        },
      },
    },
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
