// src/hooks/__tests__/useTranslation.test.js
import { renderHook, act } from '@testing-library/react';
import { useTranslation } from '../useTranslation';

describe('useTranslation Hook Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dir = '';
    document.documentElement.lang = '';
  });

  test('should initialize with Arabic language', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.language).toBe('ar');
    expect(result.current.isRTL).toBe(true);
  });

  test('should set document direction to rtl for Arabic', () => {
    renderHook(() => useTranslation());

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });

  test('should switch to English and update direction', () => {
    const { result } = renderHook(() => useTranslation());

    act(() => {
      result.current.setLanguage('en');
    });

    expect(result.current.language).toBe('en');
    expect(result.current.isRTL).toBe(false);
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  test('should translate text correctly', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.t('common.save')).toBe('حفظ');

    act(() => {
      result.current.setLanguage('en');
    });

    expect(result.current.t('common.save')).toBe('Save');
  });

  test('should return translation object', () => {
    const { result } = renderHook(() => useTranslation());

    const saveText = result.current.tObj('common.save');

    expect(saveText).toEqual({ ar: 'حفظ', en: 'Save' });
  });

  test('should persist language selection', () => {
    const { result } = renderHook(() => useTranslation());

    act(() => {
      result.current.setLanguage('en');
    });

    expect(localStorage.getItem('language')).toBe('en');
  });

  test('should maintain state across re-renders', () => {
    const { result, rerender } = renderHook(() => useTranslation());

    act(() => {
      result.current.setLanguage('en');
    });

    rerender();

    expect(result.current.language).toBe('en');
    expect(result.current.isRTL).toBe(false);
  });
});
