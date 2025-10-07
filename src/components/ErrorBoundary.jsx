// src/components/ErrorBoundary.jsx
import React from 'react';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // تسجيل الخطأ (اختياري)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f5f5f5',
            p: 3,
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <ErrorOutlineIcon 
                sx={{ fontSize: 80, color: 'error.main', mb: 2 }} 
              />
              
              <Typography variant="h5" fontWeight={700} gutterBottom>
                عذراً، حدث خطأ غير متوقع
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                واجه التطبيق مشكلة. يمكنك المحاولة مرة أخرى أو الاتصال بالدعم الفني.
              </Typography>

              <Alert severity="error" sx={{ mb: 3, textAlign: 'right' }}>
                <Typography variant="body2" fontWeight={600}>
                  رسالة الخطأ:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 1 }}>
                  {this.state.error && this.state.error.toString()}
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                  size="large"
                >
                  إعادة تحميل التطبيق
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => {
                    localStorage.removeItem('metalsheets_database');
                    window.location.reload();
                  }}
                  size="large"
                  color="error"
                >
                  إعادة تعيين البيانات
                </Button>
              </Box>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
                  <Typography variant="caption" component="pre" sx={{ 
                    overflow: 'auto', 
                    maxHeight: 200,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem'
                  }}>
                    {this.state.errorInfo.componentStack}
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;