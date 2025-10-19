// src/components/common/LanguageSwitcher.jsx
import PropTypes from 'prop-types';
import { Button, ButtonGroup, Box, Tooltip } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * Language Switcher Component
 * Allows users to switch between Arabic and English
 *
 * @param {string} variant - Display variant: 'buttons' (default) or 'compact'
 * @param {string} size - Button size: 'small', 'medium', or 'large'
 * @param {boolean} showIcon - Whether to show language icon (default: true)
 * @param {boolean} reloadOnChange - Whether to reload page on language change (default: false)
 */
function LanguageSwitcher({
  variant = 'buttons',
  size = 'small',
  showIcon = true,
  reloadOnChange = false
}) {
  const { language, setLanguage } = useTranslation();

  const handleLanguageChange = (lang) => {
    setLanguage(lang);

    if (reloadOnChange) {
      // Reload to apply all changes immediately
      window.location.reload();
    }
  };

  if (variant === 'compact') {
    const nextLanguage = language === 'ar' ? 'en' : 'ar';
    const tooltipText = language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية';

    return (
      <Tooltip title={tooltipText} arrow>
        <Button
          size={size}
          variant="outlined"
          startIcon={showIcon ? <LanguageIcon /> : null}
          onClick={() => handleLanguageChange(nextLanguage)}
          aria-label={tooltipText}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          {language === 'ar' ? 'English' : 'عربي'}
        </Button>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {showIcon && <LanguageIcon fontSize={size} color="action" />}
      <ButtonGroup size={size} variant="outlined" aria-label="Language selector">
        <Tooltip title="اللغة العربية" arrow>
          <Button
            onClick={() => handleLanguageChange('ar')}
            variant={language === 'ar' ? 'contained' : 'outlined'}
            aria-pressed={language === 'ar'}
            aria-label="Arabic language"
            sx={{
              minWidth: 60,
              fontWeight: language === 'ar' ? 700 : 500,
              fontFamily: 'Cairo, Arial, sans-serif',
            }}
          >
            عربي
          </Button>
        </Tooltip>
        <Tooltip title="English Language" arrow>
          <Button
            onClick={() => handleLanguageChange('en')}
            variant={language === 'en' ? 'contained' : 'outlined'}
            aria-pressed={language === 'en'}
            aria-label="English language"
            sx={{
              minWidth: 60,
              fontWeight: language === 'en' ? 700 : 500,
            }}
          >
            EN
          </Button>
        </Tooltip>
      </ButtonGroup>
    </Box>
  );
}

LanguageSwitcher.propTypes = {
  variant: PropTypes.oneOf(['buttons', 'compact']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  showIcon: PropTypes.bool,
  reloadOnChange: PropTypes.bool,
};

export default LanguageSwitcher;
