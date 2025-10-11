// src/hooks/useTranslation.js
// Re-export from context for backward compatibility
import { useTranslation as useTranslationHook } from '../contexts/TranslationContext';

export { useTranslation } from '../contexts/TranslationContext';
export default useTranslationHook;
