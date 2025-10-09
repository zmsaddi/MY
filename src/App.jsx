// src/App.jsx
import { useState, useEffect, lazy, Suspense } from 'react';
import { ThemeProvider, CssBaseline, Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Container, Button, CircularProgress } from '@mui/material';
import { cacheRtl, theme } from './utils/theme';
import { CacheProvider } from '@emotion/react';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory2';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import PaymentIcon from '@mui/icons-material/Payment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';

// Eager load critical components
import ErrorBoundary from './components/ErrorBoundary';
import TabErrorBoundary from './components/common/ErrorBoundary';
import Login from './components/Login';
import DashboardTab from './components/Dashboard';

// Lazy load tab components for better performance
const SalesTab = lazy(() => import('./components/tabs/SalesTab'));
const CustomersTab = lazy(() => import('./components/tabs/CustomersTab'));
const SuppliersTab = lazy(() => import('./components/tabs/SuppliersTab'));
const InventoryTab = lazy(() => import('./components/tabs/InventoryTab'));
const RemnantsTab = lazy(() => import('./components/tabs/RemnantsTab'));
const ExpensesTab = lazy(() => import('./components/tabs/ExpensesTab'));
const PaymentsTab = lazy(() => import('./components/tabs/PaymentsTab'));
const ReportsTab = lazy(() => import('./components/tabs/ReportsTab'));
const SettingsTab = lazy(() => import('./components/tabs/SettingsTab'));

import { initDatabase, setCurrentUser, authenticateUser } from './utils/database';
import { saveSession, getSession, clearSession, getCurrentUserDisplay, updateLastActivity, isSessionExpired } from './utils/auth';
import { useKeyboardShortcut } from './utils/hooks';

const DRAWER_WIDTH = 280;

const menuItems = [
  { label: 'لوحة التحكم', icon: <DashboardIcon /> },
  { label: 'المبيعات', icon: <ShoppingCartIcon /> },
  { label: 'الزبائن', icon: <PeopleIcon /> },
  { label: 'الموردين', icon: <LocalShippingIcon /> },
  { label: 'المخزون', icon: <InventoryIcon /> },
  { label: 'البقايا', icon: <ContentCutIcon /> },
  { label: 'المصروفات', icon: <MoneyOffIcon /> },
  { label: 'الدفعات', icon: <PaymentIcon /> },
  { label: 'التقارير', icon: <AssessmentIcon /> },
  { label: 'الإعدادات', icon: <SettingsIcon /> },
];

function App() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUserState] = useState(null);

  useEffect(() => {
    initDatabase()
      .then(() => {
        setDbInitialized(true);
        // Check for existing session
        const session = getSession();
        if (session) {
          setCurrentUserState(session);
          setCurrentUser(session.username);
          setIsAuthenticated(true);
        }
      })
      .catch((error) => setDbError(error.message));
  }, []);

  // Auto-logout on inactivity - check every minute
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkInactivity = () => {
      if (isSessionExpired()) {
        alert('تم تسجيل الخروج تلقائياً بسبب عدم النشاط لمدة 10 دقائق');
        clearSession();
        setCurrentUser('System');
        setIsAuthenticated(false);
        setCurrentUserState(null);
        setSelectedTab(0);
      }
    };

    const interval = setInterval(checkInactivity, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Track user activity (mouse movement, clicks, keyboard)
  useEffect(() => {
    if (!isAuthenticated) return;

    const trackActivity = () => {
      updateLastActivity();
    };

    // Listen to user interactions
    window.addEventListener('mousemove', trackActivity);
    window.addEventListener('mousedown', trackActivity);
    window.addEventListener('keydown', trackActivity);
    window.addEventListener('scroll', trackActivity);
    window.addEventListener('touchstart', trackActivity);

    return () => {
      window.removeEventListener('mousemove', trackActivity);
      window.removeEventListener('mousedown', trackActivity);
      window.removeEventListener('keydown', trackActivity);
      window.removeEventListener('scroll', trackActivity);
      window.removeEventListener('touchstart', trackActivity);
    };
  }, [isAuthenticated]);

  const handleLogin = async (username, password) => {
    const result = authenticateUser(username, password);
    if (result.success) {
      saveSession(result.user);
      setCurrentUserState(result.user);
      setCurrentUser(result.user.username);
      setIsAuthenticated(true);
    } else {
      throw new Error(result.error);
    }
  };

  const handleLogout = () => {
    if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      clearSession();
      setCurrentUser('System');
      setIsAuthenticated(false);
      setCurrentUserState(null);
      setSelectedTab(0);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTabChange = (index) => {
    setSelectedTab(index);
    setMobileOpen(false);
  };

  // Keyboard shortcuts (only when authenticated)
  useKeyboardShortcut('1', () => isAuthenticated && setSelectedTab(0), { ctrl: true }); // Ctrl+1: Dashboard
  useKeyboardShortcut('2', () => isAuthenticated && setSelectedTab(1), { ctrl: true }); // Ctrl+2: Sales
  useKeyboardShortcut('3', () => isAuthenticated && setSelectedTab(2), { ctrl: true }); // Ctrl+3: Customers
  useKeyboardShortcut('4', () => isAuthenticated && setSelectedTab(3), { ctrl: true }); // Ctrl+4: Suppliers
  useKeyboardShortcut('5', () => isAuthenticated && setSelectedTab(4), { ctrl: true }); // Ctrl+5: Inventory
  useKeyboardShortcut('m', () => isAuthenticated && setMobileOpen(!mobileOpen), { ctrl: true }); // Ctrl+M: Toggle menu

  const renderTabContent = () => {
    const LoadingFallback = (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );

    return (
      <Suspense fallback={LoadingFallback}>
        <TabErrorBoundary>
          {selectedTab === 0 && <DashboardTab />}
          {selectedTab === 1 && <SalesTab />}
          {selectedTab === 2 && <CustomersTab />}
          {selectedTab === 3 && <SuppliersTab />}
          {selectedTab === 4 && <InventoryTab />}
          {selectedTab === 5 && <RemnantsTab />}
          {selectedTab === 6 && <ExpensesTab />}
          {selectedTab === 7 && <PaymentsTab />}
          {selectedTab === 8 && <ReportsTab />}
          {selectedTab === 9 && <SettingsTab />}
        </TabErrorBoundary>
      </Suspense>
    );
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ 
        p: { xs: 2, sm: 3 }, 
        borderBottom: 1, 
        borderColor: 'divider' 
      }}>
        <Typography variant="h5" fontWeight={800} sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: { xs: '1.25rem', sm: '1.5rem' }
        }}>
          نظام إدارة الصفائح
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{
          fontSize: { xs: '0.75rem', sm: '0.875rem' }
        }}>
          Metal Sheets Management
        </Typography>
      </Box>

      <List sx={{ flex: 1, py: 2 }}>
        {menuItems.map((item, index) => (
          <ListItem
            button
            key={index}
            selected={selectedTab === index}
            onClick={() => handleTabChange(index)}
            sx={{
              mx: { xs: 1, sm: 1.5 },
              mb: 0.5,
              borderRadius: 2,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ 
              color: selectedTab === index ? 'white' : 'text.secondary', 
              minWidth: { xs: 40, sm: 48 }
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{ 
                fontWeight: selectedTab === index ? 700 : 500,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }} 
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{
        p: { xs: 1.5, sm: 2 },
        borderTop: 1,
        borderColor: 'divider'
      }}>
        {currentUser && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={600} color="primary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              {getCurrentUserDisplay()}
            </Typography>
            <Button
              fullWidth
              size="small"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ mt: 1 }}
              variant="outlined"
              color="error"
            >
              تسجيل الخروج
            </Button>
          </Box>
        )}
        <Typography variant="caption" color="text.secondary" display="block" sx={{
          fontSize: { xs: '0.7rem', sm: '0.8125rem' }
        }}>
          الإصدار 1.0.0
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{
          fontSize: { xs: '0.7rem', sm: '0.8125rem' }
        }}>
          © 2025 جميع الحقوق محفوظة
        </Typography>
      </Box>
    </Box>
  );

  // Show login screen if not authenticated
  if (dbInitialized && !isAuthenticated) {
    return (
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Login onLogin={handleLogin} />
        </ThemeProvider>
      </CacheProvider>
    );
  }

  if (!dbInitialized) {
    return (
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh', 
            flexDirection: 'column', 
            gap: 2,
            p: 2
          }}>
            {dbError ? (
              <>
                <Typography variant="h5" color="error" fontWeight={700} sx={{
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  textAlign: 'center'
                }}>
                  فشل في تحميل قاعدة البيانات
                </Typography>
                <Typography color="text.secondary" sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  textAlign: 'center'
                }}>
                  {dbError}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h5" fontWeight={700} sx={{
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  textAlign: 'center'
                }}>
                  جاري تحميل النظام...
                </Typography>
                <Typography color="text.secondary" sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  textAlign: 'center'
                }}>
                  يرجى الانتظار
                </Typography>
              </>
            )}
          </Box>
        </ThemeProvider>
      </CacheProvider>
    );
  }

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <Box sx={{ display: 'flex', height: '100vh' }}>
            <AppBar
              position="fixed"
              sx={{
                display: { xs: 'block', md: 'none' },
                zIndex: (theme) => theme.zIndex.drawer + 1,
              }}
            >
              <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ ml: 2 }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div" fontWeight={700} sx={{
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}>
                  {menuItems[selectedTab].label}
                </Typography>
              </Toolbar>
            </AppBar>

            <Box
              component="nav"
              sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
            >
              <Drawer
                variant="temporary"
                anchor="right"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                  display: { xs: 'block', md: 'none' },
                  '& .MuiDrawer-paper': { 
                    boxSizing: 'border-box', 
                    width: DRAWER_WIDTH 
                  },
                }}
              >
                {drawer}
              </Drawer>

              <Drawer
                variant="permanent"
                sx={{
                  display: { xs: 'none', md: 'block' },
                  '& .MuiDrawer-paper': { 
                    boxSizing: 'border-box', 
                    width: DRAWER_WIDTH,
                    borderRight: 1,
                    borderColor: 'divider'
                  },
                }}
                open
              >
                {drawer}
              </Drawer>
            </Box>

            <Box
              component="main"
              sx={{
                flexGrow: 1,
                width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                height: '100vh',
                overflow: 'auto',
                bgcolor: 'background.default',
              }}
            >
              <Toolbar sx={{ display: { xs: 'block', md: 'none' }, minHeight: { xs: 56, sm: 64 } }} />
              
              <Container 
                maxWidth={false} 
                sx={{ 
                  py: { xs: 2, sm: 3, md: 4 },
                  px: { xs: 2, sm: 3, md: 4 }
                }}
              >
                {renderTabContent()}
              </Container>
            </Box>
          </Box>
        </ErrorBoundary>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;