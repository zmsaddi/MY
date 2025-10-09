import { describe, it, expect } from 'vitest';
import { safeText, safeNotes, safeDescription, safeAddress, safeCompanyName } from '../../utils/displayHelpers';

describe('XSS Protection - displayHelpers', () => {
  describe('safeText', () => {
    it('should escape HTML tags', () => {
      const dangerous = '<script>alert("XSS")</script>';
      const safe = safeText(dangerous);

      expect(safe).not.toContain('<script>');
      expect(safe).toContain('&lt;');
      expect(safe).toContain('&gt;');
    });

    it('should escape quotes', () => {
      const text = 'Company "ABC" and \'XYZ\'';
      const safe = safeText(text);

      expect(safe).toContain('&quot;');
      expect(safe).toContain('&#39;');
    });

    it('should handle normal text', () => {
      const text = 'Normal company name';
      const safe = safeText(text);

      expect(safe).toBe(text);
    });

    it('should handle null and undefined', () => {
      expect(safeText(null)).toBe(null);
      expect(safeText(undefined)).toBe(undefined);
      expect(safeText('')).toBe('');
    });

    it('should escape event handlers', () => {
      const dangerous = '<img src=x onerror="alert(1)">';
      const safe = safeText(dangerous);

      expect(safe).not.toContain('onerror');
      expect(safe).toContain('&lt;');
      expect(safe).toContain('&gt;');
    });
  });

  describe('safeNotes', () => {
    it('should escape malicious notes', () => {
      const notes = 'Customer note <script>steal()</script>';
      const safe = safeNotes(notes);

      expect(safe).not.toContain('<script>');
    });

    it('should preserve Arabic text', () => {
      const notes = 'عميل جيد الدفع';
      const safe = safeNotes(notes);

      expect(safe).toBe(notes);
    });
  });

  describe('safeDescription', () => {
    it('should escape HTML in descriptions', () => {
      const desc = 'Item <b>important</b> description';
      const safe = safeDescription(desc);

      expect(safe).not.toContain('<b>');
      expect(safe).toContain('&lt;b&gt;');
    });
  });

  describe('safeAddress', () => {
    it('should escape addresses safely', () => {
      const address = 'Street <script>alert()</script>, City';
      const safe = safeAddress(address);

      expect(safe).not.toContain('<script>');
    });
  });

  describe('safeCompanyName', () => {
    it('should escape company names', () => {
      const company = 'ABC <img src=x onerror=alert(1)> Corp';
      const safe = safeCompanyName(company);

      expect(safe).not.toContain('<img');
      expect(safe).not.toContain('onerror');
    });

    it('should handle special characters in names', () => {
      const company = 'A&B Company';
      const safe = safeCompanyName(company);

      expect(safe).toContain('&amp;');
    });
  });

  describe('XSS Attack Vectors', () => {
    const attackVectors = [
      '<script>alert(document.cookie)</script>',
      '<img src=x onerror="alert(1)">',
      '<svg/onload=alert(1)>',
      'javascript:alert(1)',
      '<iframe src="javascript:alert(1)">',
      '<body onload=alert(1)>',
      '<input onfocus=alert(1) autofocus>',
      '<select onfocus=alert(1) autofocus>',
      '<textarea onfocus=alert(1) autofocus>',
      '<marquee onstart=alert(1)>',
      '<div style="background:url(javascript:alert(1))">',
    ];

    attackVectors.forEach((attack) => {
      it(`should block: ${attack.substring(0, 30)}...`, () => {
        const safe = safeText(attack);

        expect(safe).not.toContain('alert');
        expect(safe).not.toContain('javascript:');
        expect(safe).not.toContain('onerror');
        expect(safe).not.toContain('onload');
        expect(safe).not.toContain('onfocus');
      });
    });
  });
});
