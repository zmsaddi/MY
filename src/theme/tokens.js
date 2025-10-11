export const designTokens = {
  colors: {
    primary: {
      main: '#1565c0',
      light: '#1976d2',
      dark: '#0d47a1',
      contrast: '#ffffff',
    },
    secondary: {
      main: '#c62828',
      light: '#d32f2f',
      dark: '#b71c1c',
      contrast: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#388e3c',
      dark: '#1b5e20',
      contrast: '#ffffff',
    },
    warning: {
      main: '#f57c00',
      light: '#ff9800',
      dark: '#e65100',
      contrast: '#000000',
    },
    error: {
      main: '#c62828',
      light: '#d32f2f',
      dark: '#b71c1c',
      contrast: '#ffffff',
    },
    info: {
      main: '#0277bd',
      light: '#0288d1',
      dark: '#01579b',
      contrast: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.90)',
      secondary: 'rgba(0, 0, 0, 0.70)',
      disabled: 'rgba(0, 0, 0, 0.45)',
      hint: 'rgba(0, 0, 0, 0.45)',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(0, 0, 0, 0.08)',
    },
    divider: 'rgba(0, 0, 0, 0.15)',
  },

  spacing: {
    unit: 8,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  shadows: {
    none: 'none',
    xs: '0 1px 2px rgba(0,0,0,0.05)',
    sm: '0 2px 4px rgba(0,0,0,0.08)',
    md: '0 4px 8px rgba(0,0,0,0.10)',
    lg: '0 8px 16px rgba(0,0,0,0.12)',
    xl: '0 16px 32px rgba(0,0,0,0.14)',
  },

  typography: {
    fontFamily: {
      primary: 'Cairo, Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      md: '1.125rem',
      lg: '1.25rem',
      xl: '1.5rem',
      xxl: '2rem',
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  transitions: {
    duration: {
      fastest: '100ms',
      faster: '150ms',
      fast: '200ms',
      normal: '300ms',
      slow: '400ms',
      slower: '500ms',
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  breakpoints: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },

  zIndex: {
    mobileStepper: 1000,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
};

export default designTokens;
