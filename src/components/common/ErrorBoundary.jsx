// src/components/common/ErrorBoundary.jsx
import React from 'react';
import { Box, Typography, Button, Alert, Card, CardContent } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <Box sx={{ p: 3 }}>
          <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
                <Typography variant="h5" fontWeight={700}>
                  عذراً، حدث خطأ غير متوقع
                </Typography>
              </Box>

              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  {this.state.error && this.state.error.toString()}
                </Typography>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      mt: 2,
                      p: 1,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: '0.75rem'
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Alert>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                  sx={{ fontWeight: 600 }}
                >
                  حاول مرة أخرى
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.location.reload()}
                  sx={{ fontWeight: 600 }}
                >
                  إعادة تحميل الصفحة
                </Button>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
                إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني
              </Typography>
            </CardContent>
          </Card>
        </Box>
      );
    }

    // Return children if no error
    return this.props.children;
  }
}

export default ErrorBoundary;