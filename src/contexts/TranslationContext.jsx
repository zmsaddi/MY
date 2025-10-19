// src/contexts/TranslationContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { t, tObj, getLanguage, setLanguage as setLangStorage } from '../utils/translations';

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getLanguage());
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // Update document direction based on language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang) => {
    setLangStorage(lang);
    setLanguageState(lang);
    // Force re-render of all consumers
    forceUpdate({});
  };

  const translate = (key, lang = null) => {
    return t(key, lang);
  };

  const translateObj = (key) => {
    return tObj(key);
  };

  const value = {
    t: translate,
    tObj: translateObj,
    language,
    setLanguage,
    isRTL: language === 'ar',
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

TranslationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export default TranslationContext;
