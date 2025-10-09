// src/components/common/ErrorBoundary.jsx
import React, { Component } from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Box,
  Typography,
  Collapse,
  Paper,
  Stack,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
  BugReport as BugIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Home as HomeIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';

/**
 * Main Error Boundary Component
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      showDetails: false,
      errorHistory: [],
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = `error_${Date.now()}`;
    const errorEntry = {
      id: errorId,
      message: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    // Update state
    this.setState(prevState => ({
      error: error,
      errorInfo: errorInfo,
      errorCount: prevState.errorCount + 1,
      errorHistory: [...prevState.errorHistory, errorEntry].slice(-5) // Keep last 5 errors
    }));

    // Log to external service (if configured)
    this.logErrorToService(errorEntry);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorEntry);
    }
  }

  logErrorToService = (errorEntry) => {
    // Store in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      errors.push(errorEntry);
      // Keep only last 10 errors
      const recentErrors = errors.slice(-10);
      localStorage.setItem('app_errors', JSON.stringify(recentErrors));
    } catch (e) {
      // Silent fail
    }
  };

  handleReset = async () => {
    this.setState({ isRecovering: true });

    // Small delay to show recovery state
    await new Promise(resolve => setTimeout(resolve, 500));

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      isRecovering: false
    });

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  copyErrorDetails = () => {
    const { error, errorInfo } = this.state;
    const details = `
Error: ${error?.toString()}

Stack Trace:
${error?.stack}

Component Stack:
${errorInfo?.componentStack}

URL: ${window.location.href}
Time: ${new Date().toISOString()}
    `.trim();

    navigator.clipboard.writeText(details);
  };

  render() {
    if (this.state.isRecovering) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <Stack spacing={2} alignItems="center">
            <LinearProgress sx={{ width: 200 }} />
            <Typography>جاري استعادة التطبيق...</Typography>
          </Stack>
        </Box>
      );
    }

    if (this.state.hasError) {
      const { fallback, showDetails: allowDetails = true } = this.props;
      const { error, errorInfo, showDetails, errorCount } = this.state;

      // Custom fallback UI if provided
      if (fallback) {
        return fallback(error, errorInfo, this.handleReset);
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            p: 3
          }}
        >
          <Card sx={{ maxWidth: 700, width: '100%' }}>
            <CardContent>
              <Stack spacing={3}>
                {/* Error Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <ErrorIcon color="error" sx={{ fontSize: 48, mt: 0.5 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" gutterBottom fontWeight={700}>
                      عذراً، حدث خطأ غير متوقع
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      نعتذر عن الإزعاج. حدث خطأ أثناء عرض هذه الصفحة.
                    </Typography>
                    {errorCount > 1 && (
                      <Chip
                        label={`حدث هذا الخطأ ${errorCount} مرات`}
                        color="warning"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Error Message */}
                <Alert
                  severity="error"
                  action={
                    allowDetails && (
                      <IconButton
                        color="inherit"
                        size="small"
                        onClick={this.copyErrorDetails}
                        title="نسخ تفاصيل الخطأ"
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    )
                  }
                >
                  <AlertTitle>رسالة الخطأ</AlertTitle>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {error?.message || 'خطأ غير معروف'}
                  </Typography>
                </Alert>

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={this.handleReset}
                    disabled={this.state.isRecovering}
                  >
                    حاول مرة أخرى
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={this.handleReload}
                  >
                    إعادة تحميل الصفحة
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<HomeIcon />}
                    onClick={this.handleHome}
                  >
                    الصفحة الرئيسية
                  </Button>
                  {allowDetails && (
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<BugIcon />}
                      endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      onClick={this.toggleDetails}
                    >
                      تفاصيل تقنية
                    </Button>
                  )}
                </Stack>

                {/* Technical Details */}
                {allowDetails && (
                  <Collapse in={showDetails}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        maxHeight: 300,
                        overflow: 'auto'
                      }}
                    >
                      <Stack spacing={2}>
                        {process.env.NODE_ENV === 'development' && (
                          <>
                            <Box>
                              <Typography variant="caption" fontWeight={600}>
                                Stack Trace:
                              </Typography>
                              <Typography
                                variant="caption"
                                component="pre"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.7rem',
                                  overflow: 'auto'
                                }}
                              >
                                {error?.stack}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" fontWeight={600}>
                                Component Stack:
                              </Typography>
                              <Typography
                                variant="caption"
                                component="pre"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.7rem',
                                  overflow: 'auto'
                                }}
                              >
                                {errorInfo?.componentStack}
                              </Typography>
                            </Box>
                          </>
                        )}
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Error ID: {this.state.errorHistory[this.state.errorHistory.length - 1]?.id}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Collapse>
                )}

                {/* Support Message */}
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Async Error Boundary for handling async errors
 */
export class AsyncErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Async error caught:', error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          severity="error"
          onClose={this.resetErrorBoundary}
          sx={{ m: 2 }}
        >
          <AlertTitle>خطأ في العملية</AlertTitle>
          {this.state.error?.message || 'حدث خطأ أثناء معالجة الطلب'}
        </Alert>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap components with error boundary
 */
export function withErrorBoundary(Component, errorBoundaryProps = {}) {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

/**
 * Hook to handle errors in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error) => {
    setError(error);
  }, []);

  return { captureError, resetError };
}

// Export default ErrorBoundary
export default ErrorBoundary;