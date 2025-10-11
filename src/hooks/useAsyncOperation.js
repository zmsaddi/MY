import { useState } from 'react';
import { useTranslation } from '../contexts/TranslationContext';

export function useAsyncOperation() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const execute = async (
    operation,
    options = {}
  ) => {
    const {
      successMessage,
      errorMessage,
      onSuccess,
      onError,
      onFinally,
      clearAfter = 3000
    } = options;

    setLoading(true);
    clearMessages();

    try {
      const result = await operation();

      if (result && result.success === false) {
        const errMsg = errorMessage || t('common.error');
        const fullError = result.error ? `${errMsg}: ${result.error}` : errMsg;
        setError(fullError);
        if (onError) onError(result);
        return { success: false, error: fullError };
      }

      if (successMessage) {
        setSuccess(successMessage);
        if (clearAfter > 0) {
          setTimeout(() => setSuccess(''), clearAfter);
        }
      }

      if (onSuccess) onSuccess(result);
      return { success: true, data: result };

    } catch (err) {
      const errMsg = errorMessage || t('common.operationError');
      const fullError = `${errMsg}: ${err.message}`;
      setError(fullError);
      if (onError) onError(err);
      return { success: false, error: fullError };

    } finally {
      setLoading(false);
      if (onFinally) onFinally();
    }
  };

  return {
    loading,
    error,
    success,
    setError,
    setSuccess,
    clearMessages,
    execute
  };
}

export default useAsyncOperation;
