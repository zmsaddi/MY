import { useState, useEffect } from 'react';
import { getBaseCurrencyInfo } from '../utils/database/currencies';

export function useCurrency() {
  const [baseCurrencyInfo, setBaseCurrencyInfo] = useState({
    code: 'USD',
    symbol: '$'
  });

  useEffect(() => {
    loadCurrencyInfo();
  }, []);

  const loadCurrencyInfo = () => {
    const currInfo = getBaseCurrencyInfo();
    if (currInfo) {
      setBaseCurrencyInfo(currInfo);
    }
  };

  return {
    baseCurrencyInfo,
    currencyCode: baseCurrencyInfo.code,
    currencySymbol: baseCurrencyInfo.symbol,
    refreshCurrency: loadCurrencyInfo
  };
}

export default useCurrency;
