// src/components/Login.jsx
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Paper,
  Avatar
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock
} from '@mui/icons-material';
import BusinessIcon from '@mui/icons-material/Business';
import { getCompanyProfile } from '../utils/database';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);

  useEffect(() => {
    try {
      const profile = getCompanyProfile();
      setCompanyProfile(profile);
    } catch (e) {
      console.error('Failed to load company profile:', e);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('يرجى إدخال اسم المستخدم');
      return;
    }

    // Allow empty password for admin initial setup
    if (!password && username.trim().toLowerCase() !== 'admin') {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    setLoading(true);

    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Card
        sx={{
          maxWidth: 450,
          width: '100%',
          borderRadius: 4,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            {/* Company Logo */}
            {companyProfile?.logo_base64 ? (
              <Avatar
                src={companyProfile.logo_base64}
                sx={{
                  width: 120,
                  height: 120,
                  margin: '0 auto',
                  mb: 3,
                  border: '4px solid',
                  borderColor: 'primary.main',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                }}
                variant="rounded"
              />
            ) : (
              <Paper
                elevation={0}
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                }}
              >
                <BusinessIcon sx={{ fontSize: 60, color: 'white' }} />
              </Paper>
            )}

            {/* Company Name */}
            <Typography variant="h4" fontWeight={800} gutterBottom sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {companyProfile?.company_name || 'نظام إدارة الصفائح'}
            </Typography>
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              {companyProfile?.company_name_en || 'Metal Sheets Management System'}
            </Typography>

            {/* Login Title */}
            <Box sx={{ mt: 3, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Lock sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={700} color="primary">
                تسجيل الدخول
              </Typography>
            </Box>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
              autoFocus
            />

            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="كلمة المرور"
              placeholder={username.toLowerCase() === 'admin' ? 'اتركها فارغة للإعداد الأولي' : ''}
              helperText={username.toLowerCase() === 'admin' && !password ? 'للإعداد الأولي، اترك كلمة المرور فارغة' : ''}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              sx={{ mb: 4 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSubmit(e);
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                }
              }}
            >
              {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </Button>
          </form>

          {/* Footer */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              الإصدار 1.0.0
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              © 2025 جميع الحقوق محفوظة
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

Login.propTypes = {
  onLogin: PropTypes.func.isRequired,
};

export default Login;
