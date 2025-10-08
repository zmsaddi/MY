// src/App.jsx
import { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Container } from '@mui/material';
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

// Components
import DashboardTab from './components/Dashboard';
import SalesTab from './components/tabs/SalesTab';
import CustomersTab from './components/tabs/CustomersTab';
import SuppliersTab from './components/tabs/SuppliersTab';
import InventoryTab from './components/tabs/InventoryTab';
import RemnantsTab from './components/tabs/RemnantsTab';
import ExpensesTab from './components/tabs/ExpensesTab';
import PaymentsTab from './components/tabs/PaymentsTab';
import ReportsTab from './components/tabs/ReportsTab';
import SettingsTab from './components/tabs/SettingsTab';
import ErrorBoundary from './components/ErrorBoundary';

import { initDatabase } from './utils/database';

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

  useEffect(() => {
    initDatabase()
      .then(() => setDbInitialized(true))
      .catch((error) => setDbError(error.message));
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTabChange = (index) => {
    setSelectedTab(index);
    setMobileOpen(false);
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 0: return <DashboardTab />;
      case 1: return <SalesTab />;
      case 2: return <CustomersTab />;
      case 3: return <SuppliersTab />;
      case 4: return <InventoryTab />;
      case 5: return <RemnantsTab />;
      case 6: return <ExpensesTab />;
      case 7: return <PaymentsTab />;
      case 8: return <ReportsTab />;
      case 9: return <SettingsTab />;
      default: return <DashboardTab />;
    }
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