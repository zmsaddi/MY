// Import polyfills first to set up crypto
import './polyfills';

// Initialize bcrypt with WebCrypto fallback (must be imported before any password hashing)
import './utils/security/initSecurity.js';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import { theme, cacheRtl } from './utils/theme';
import App from './App';
import './index.css';

// MUI v6 لا يحتاج إلى StylesProvider أو jss
// يتم التعامل مع RTL من خلال CacheProvider و theme direction

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </CacheProvider>
  </React.StrictMode>
);