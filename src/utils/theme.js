// src/utils/theme.js
import { createTheme } from '@mui/material/styles';
import { arSA } from '@mui/material/locale';
import rtlPlugin from 'stylis-plugin-rtl';
import createCache from '@emotion/cache';

// Create RTL cache
export const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin],
});

// Enhanced color palette with better contrast
const colors = {
  primary: {
    main: '#1565c0',
    light: '#1976d2',
    dark: '#0d47a1',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#c62828',
    light: '#d32f2f',
    dark: '#b71c1c',
    contrastText: '#ffffff',
  },
  success: {
    main: '#2e7d32',
    light: '#388e3c',
    dark: '#1b5e20',
  },
  warning: {
    main: '#f57c00',
    light: '#ff9800',
    dark: '#e65100',
  },
  error: {
    main: '#c62828',
    light: '#d32f2f',
    dark: '#b71c1c',
  },
  info: {
    main: '#0277bd',
    light: '#0288d1',
    dark: '#01579b',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.90)',
    secondary: 'rgba(0, 0, 0, 0.70)',
    disabled: 'rgba(0, 0, 0, 0.45)',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  divider: 'rgba(0, 0, 0, 0.15)',
};

// Responsive typography
const typography = {
  fontFamily: [
    'Cairo',
    'Roboto',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Arial',
    'sans-serif',
  ].join(','),
  
  fontSize: 14, // Base size for mobile
  
  h1: {
    fontSize: '1.75rem',
    '@media (min-width:600px)': { fontSize: '2.25rem' },
    '@media (min-width:960px)': { fontSize: '2.75rem' },
    fontWeight: 600,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '1.5rem',
    '@media (min-width:600px)': { fontSize: '1.875rem' },
    '@media (min-width:960px)': { fontSize: '2.25rem' },
    fontWeight: 600,
    lineHeight: 1.25,
  },
  h3: {
    fontSize: '1.3rem',
    '@media (min-width:600px)': { fontSize: '1.625rem' },
    '@media (min-width:960px)': { fontSize: '1.875rem' },
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h4: {
    fontSize: '1.15rem',
    '@media (min-width:600px)': { fontSize: '1.375rem' },
    '@media (min-width:960px)': { fontSize: '1.625rem' },
    fontWeight: 600,
    lineHeight: 1.35,
  },
  h5: {
    fontSize: '1rem',
    '@media (min-width:600px)': { fontSize: '1.25rem' },
    '@media (min-width:960px)': { fontSize: '1.375rem' },
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h6: {
    fontSize: '0.95rem',
    '@media (min-width:600px)': { fontSize: '1.125rem' },
    '@media (min-width:960px)': { fontSize: '1.125rem' },
    fontWeight: 600,
    lineHeight: 1.45,
  },
  
  body1: {
    fontSize: '0.875rem',
    '@media (min-width:600px)': { fontSize: '0.9375rem' },
    '@media (min-width:960px)': { fontSize: '1.0625rem' },
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.8125rem',
    '@media (min-width:600px)': { fontSize: '0.875rem' },
    '@media (min-width:960px)': { fontSize: '0.9375rem' },
    lineHeight: 1.55,
  },
  
  button: {
    fontSize: '0.8125rem',
    '@media (min-width:600px)': { fontSize: '0.875rem' },
    '@media (min-width:960px)': { fontSize: '0.9375rem' },
    fontWeight: 600,
    textTransform: 'none',
  },
  
  caption: {
    fontSize: '0.75rem',
    '@media (min-width:600px)': { fontSize: '0.8125rem' },
    lineHeight: 1.5,
  },
};

// Component overrides
const components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        fontFamily: typography.fontFamily,
        fontSize: typography.fontSize,
      },
    },
  },
  
  MuiButton: {
    styleOverrides: {
      root: {
        fontSize: '0.8125rem',
        padding: '6px 16px',
        borderRadius: 8,
        fontWeight: 600,
        boxShadow: 'none',
        '@media (min-width:600px)': {
          fontSize: '0.875rem',
          padding: '8px 20px',
        },
        '@media (min-width:960px)': {
          fontSize: '0.9375rem',
          padding: '10px 24px',
        },
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        },
      },
      sizeLarge: {
        fontSize: '0.875rem',
        padding: '8px 20px',
        '@media (min-width:600px)': {
          fontSize: '0.9375rem',
          padding: '10px 24px',
        },
        '@media (min-width:960px)': {
          fontSize: '1.0625rem',
          padding: '12px 28px',
        },
      },
      sizeSmall: {
        fontSize: '0.75rem',
        padding: '4px 12px',
        '@media (min-width:600px)': {
          fontSize: '0.8125rem',
          padding: '6px 14px',
        },
        '@media (min-width:960px)': {
          fontSize: '0.875rem',
          padding: '6px 16px',
        },
      },
    },
  },
  
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      size: 'small',
    },
    styleOverrides: {
      root: {
        '& .MuiInputBase-root': {
          fontSize: '0.875rem',
          '@media (min-width:600px)': {
            fontSize: '0.9375rem',
          },
          '@media (min-width:960px)': {
            fontSize: '1.0625rem',
          },
        },
        '& .MuiInputLabel-root': {
          fontSize: '0.875rem',
          '@media (min-width:600px)': {
            fontSize: '0.9375rem',
          },
          '@media (min-width:960px)': {
            fontSize: '1.0625rem',
          },
        },
      },
    },
  },
  
  MuiInputBase: {
    styleOverrides: {
      root: {
        fontSize: '0.875rem',
        '@media (min-width:960px)': {
          fontSize: '1.0625rem',
        },
        '& input': {
          padding: '10px 12px',
          '@media (min-width:960px)': {
            padding: '14px 16px',
          },
        },
      },
    },
  },
  
  MuiInputLabel: {
    styleOverrides: {
      root: {
        fontSize: '0.875rem',
        '@media (min-width:960px)': {
          fontSize: '1.0625rem',
        },
        color: colors.text.secondary,
        fontWeight: 500,
      },
    },
  },
  
  MuiTableCell: {
    styleOverrides: {
      root: {
        fontSize: '0.8125rem',
        padding: '10px 12px',
        '@media (min-width:600px)': {
          fontSize: '0.875rem',
          padding: '12px 14px',
        },
        '@media (min-width:960px)': {
          fontSize: '0.9375rem',
          padding: '14px 16px',
        },
        borderBottom: `1px solid ${colors.divider}`,
      },
      head: {
        fontSize: '0.875rem',
        '@media (min-width:600px)': {
          fontSize: '0.9375rem',
        },
        '@media (min-width:960px)': {
          fontSize: '1rem',
        },
        fontWeight: 700,
        color: colors.text.primary,
        backgroundColor: '#fafafa',
      },
    },
  },
  
  MuiChip: {
    styleOverrides: {
      root: {
        fontSize: '0.75rem',
        height: 26,
        '@media (min-width:600px)': {
          fontSize: '0.8125rem',
          height: 28,
        },
        '@media (min-width:960px)': {
          fontSize: '0.875rem',
          height: 32,
        },
        fontWeight: 600,
      },
      label: {
        padding: '0 10px',
        '@media (min-width:960px)': {
          padding: '0 14px',
        },
      },
    },
  },
  
  MuiCard: {
    styleOverrides: {
      root: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.08)',
      },
    },
  },
  
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: '12px',
        '@media (min-width:600px)': {
          padding: '14px',
        },
        '@media (min-width:960px)': {
          padding: '16px',
        },
        '&:last-child': {
          paddingBottom: '12px',
          '@media (min-width:600px)': {
            paddingBottom: '14px',
          },
          '@media (min-width:960px)': {
            paddingBottom: '16px',
          },
        },
      },
    },
  },
  
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
      elevation1: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
      },
      elevation2: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
      },
      elevation3: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      },
    },
  },
  
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 12,
        margin: '16px',
        '@media (min-width:600px)': {
          margin: '24px',
        },
        '@media (min-width:960px)': {
          margin: '32px',
        },
      },
    },
  },
  
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontSize: '1.15rem',
        padding: '14px 16px',
        '@media (min-width:600px)': {
          fontSize: '1.3rem',
          padding: '16px 20px',
        },
        '@media (min-width:960px)': {
          fontSize: '1.5rem',
          padding: '20px 24px',
        },
        fontWeight: 600,
      },
    },
  },
  
  MuiDialogContent: {
    styleOverrides: {
      root: {
        fontSize: '0.875rem',
        padding: '14px 16px',
        '@media (min-width:600px)': {
          fontSize: '0.9375rem',
          padding: '16px 20px',
        },
        '@media (min-width:960px)': {
          fontSize: '1.0625rem',
          padding: '20px 24px',
        },
      },
    },
  },
  
  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: '12px 16px',
        '@media (min-width:600px)': {
          padding: '14px 20px',
        },
        '@media (min-width:960px)': {
          padding: '16px 24px',
        },
      },
    },
  },
  
  MuiAlert: {
    styleOverrides: {
      root: {
        fontSize: '0.8125rem',
        padding: '10px 14px',
        '@media (min-width:600px)': {
          fontSize: '0.875rem',
          padding: '11px 15px',
        },
        '@media (min-width:960px)': {
          fontSize: '0.9375rem',
          padding: '12px 16px',
        },
      },
      message: {
        padding: '6px 0',
        '@media (min-width:960px)': {
          padding: '8px 0',
        },
      },
    },
  },
  
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        fontSize: '0.75rem',
        padding: '6px 10px',
        '@media (min-width:960px)': {
          fontSize: '0.875rem',
          padding: '8px 12px',
        },
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
      },
    },
  },
  
  MuiMenuItem: {
    styleOverrides: {
      root: {
        fontSize: '0.8125rem',
        padding: '8px 14px',
        minHeight: 40,
        '@media (min-width:600px)': {
          fontSize: '0.875rem',
          padding: '9px 15px',
          minHeight: 42,
        },
        '@media (min-width:960px)': {
          fontSize: '0.9375rem',
          padding: '10px 16px',
          minHeight: 44,
        },
      },
    },
  },
  
  MuiListItemText: {
    styleOverrides: {
      primary: {
        fontSize: '0.875rem',
        '@media (min-width:960px)': {
          fontSize: '0.9375rem',
        },
        fontWeight: 500,
      },
      secondary: {
        fontSize: '0.8125rem',
        '@media (min-width:960px)': {
          fontSize: '0.875rem',
        },
      },
    },
  },
  
  MuiTab: {
    styleOverrides: {
      root: {
        fontSize: '0.8125rem',
        minHeight: 44,
        padding: '8px 14px',
        '@media (min-width:600px)': {
          fontSize: '0.875rem',
          minHeight: 48,
          padding: '10px 18px',
        },
        '@media (min-width:960px)': {
          fontSize: '0.9375rem',
          minHeight: 52,
          padding: '12px 20px',
        },
        fontWeight: 600,
        textTransform: 'none',
      },
    },
  },
  
  MuiAccordionSummary: {
    styleOverrides: {
      content: {
        fontSize: '0.9375rem',
        '@media (min-width:960px)': {
          fontSize: '1rem',
        },
        fontWeight: 600,
        margin: '12px 0',
        '@media (min-width:960px)': {
          margin: '16px 0',
        },
      },
    },
  },
};

// Create theme
export const theme = createTheme(
  {
    direction: 'rtl',
    palette: colors,
    typography,
    components,
    shape: {
      borderRadius: 8,
    },
    spacing: 8,
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
      },
    },
    shadows: [
      'none',
      '0 2px 4px rgba(0,0,0,0.08)',
      '0 2px 8px rgba(0,0,0,0.10)',
      '0 4px 12px rgba(0,0,0,0.12)',
      '0 6px 16px rgba(0,0,0,0.14)',
      '0 8px 24px rgba(0,0,0,0.16)',
      '0 12px 32px rgba(0,0,0,0.18)',
      '0 16px 40px rgba(0,0,0,0.20)',
      '0 20px 48px rgba(0,0,0,0.22)',
      '0 24px 56px rgba(0,0,0,0.24)',
      '0 28px 64px rgba(0,0,0,0.26)',
      '0 32px 72px rgba(0,0,0,0.28)',
      '0 36px 80px rgba(0,0,0,0.30)',
      '0 40px 88px rgba(0,0,0,0.32)',
      '0 44px 96px rgba(0,0,0,0.34)',
      '0 48px 104px rgba(0,0,0,0.36)',
      '0 52px 112px rgba(0,0,0,0.38)',
      '0 56px 120px rgba(0,0,0,0.40)',
      '0 60px 128px rgba(0,0,0,0.42)',
      '0 64px 136px rgba(0,0,0,0.44)',
      '0 68px 144px rgba(0,0,0,0.46)',
      '0 72px 152px rgba(0,0,0,0.48)',
      '0 76px 160px rgba(0,0,0,0.50)',
      '0 80px 168px rgba(0,0,0,0.52)',
      '0 84px 176px rgba(0,0,0,0.54)',
    ],
  },
  arSA
);

export default theme;