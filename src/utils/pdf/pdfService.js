// src/utils/pdf/pdfService.js
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Register fonts with pdfMake
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// Configure Arabic fonts - Using Roboto as fallback until we add proper Arabic fonts
// Note: For production, you should add proper Arabic fonts like Amiri or Noto Naskh Arabic
pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  },
  // TODO: Add proper Arabic font
  Arabic: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

/**
 * Force all numbers to be Latin (123) instead of Arabic-Indic (١٢٣)
 * @param {string|number} value
 * @returns {string}
 */
export function forceLatinNumbers(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);

  // Map Arabic-Indic numerals to Latin
  const arabicToLatin = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };

  return str.replace(/[٠-٩]/g, (match) => arabicToLatin[match] || match);
}

/**
 * Format date with Latin numbers only
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDateLatin(dateStr) {
  if (!dateStr) return '';
  return forceLatinNumbers(dateStr);
}

/**
 * Format number with thousand separators and Latin digits
 * @param {number} num
 * @param {number} decimals
 * @returns {string}
 */
export function formatNumberLatin(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const formatted = Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true
  });
  return forceLatinNumbers(formatted);
}

/**
 * Get default document styles with RTL support
 * @returns {object}
 */
export function getDefaultStyles() {
  return {
    header: {
      fontSize: 18,
      bold: true,
      alignment: 'center',
      margin: [0, 10, 0, 10]
    },
    subheader: {
      fontSize: 14,
      bold: true,
      margin: [0, 10, 0, 5]
    },
    tableHeader: {
      bold: true,
      fontSize: 11,
      color: 'white',
      fillColor: '#2196F3',
      alignment: 'center'
    },
    tableCell: {
      fontSize: 10,
      alignment: 'center'
    },
    tableCellRight: {
      fontSize: 10,
      alignment: 'right'
    },
    footer: {
      fontSize: 8,
      italics: true,
      alignment: 'center',
      margin: [0, 5, 0, 0]
    },
    info: {
      fontSize: 10,
      margin: [0, 2, 0, 2]
    },
    label: {
      fontSize: 9,
      color: '#666666',
      bold: false
    },
    value: {
      fontSize: 10,
      bold: true
    }
  };
}

/**
 * Generate header for PDF documents
 * @param {string} title
 * @param {object} companyInfo
 * @returns {object}
 */
export function generateHeader(title, companyInfo = {}) {
  return {
    columns: [
      {
        width: '*',
        text: title,
        style: 'header',
        alignment: 'center'
      }
    ],
    margin: [0, 0, 0, 10]
  };
}

/**
 * Generate footer for PDF documents
 * @param {number} currentPage
 * @param {number} pageCount
 * @returns {object}
 */
export function generateFooter(currentPage, pageCount) {
  const printDate = new Date().toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return {
    columns: [
      {
        text: forceLatinNumbers(`تاريخ الطباعة: ${printDate}`),
        alignment: 'left',
        fontSize: 8
      },
      {
        text: forceLatinNumbers(`صفحة ${currentPage} من ${pageCount}`),
        alignment: 'right',
        fontSize: 8
      }
    ],
    margin: [20, 10, 20, 0]
  };
}

/**
 * Create RTL table with proper alignment
 * @param {array} headers
 * @param {array} data
 * @param {array} widths
 * @returns {object}
 */
export function createRTLTable(headers, data, widths = null) {
  const reversedHeaders = [...headers].reverse();
  const reversedData = data.map(row => [...row].reverse());

  return {
    table: {
      headerRows: 1,
      widths: widths ? [...widths].reverse() : Array(headers.length).fill('*'),
      body: [
        reversedHeaders.map(h => ({
          text: forceLatinNumbers(h),
          style: 'tableHeader'
        })),
        ...reversedData.map(row =>
          row.map(cell => ({
            text: forceLatinNumbers(cell),
            style: 'tableCell'
          }))
        )
      ]
    },
    layout: {
      fillColor: function(rowIndex) {
        return rowIndex === 0 ? '#2196F3' : (rowIndex % 2 === 0 ? '#f5f5f5' : null);
      },
      hLineWidth: function() { return 0.5; },
      vLineWidth: function() { return 0.5; },
      hLineColor: function() { return '#ddd'; },
      vLineColor: function() { return '#ddd'; }
    }
  };
}

/**
 * Open PDF in new tab or download
 * @param {object} docDefinition
 * @param {string} filename
 * @param {boolean} download - true to download, false to open in new tab
 */
export function generatePDF(docDefinition, filename = 'document.pdf', download = false) {
  const finalDoc = {
    ...docDefinition,
    defaultStyle: {
      font: 'Roboto', // Using Roboto for now, will be Arabic font in production
      fontSize: 10
    },
    pageSize: 'A4',
    pageOrientation: docDefinition.pageOrientation || 'portrait',
    pageMargins: docDefinition.pageMargins || [40, 60, 40, 60],
    styles: {
      ...getDefaultStyles(),
      ...(docDefinition.styles || {})
    },
    footer: function(currentPage, pageCount) {
      return generateFooter(currentPage, pageCount);
    }
  };

  const pdfDocGenerator = pdfMake.createPdf(finalDoc);

  if (download) {
    pdfDocGenerator.download(filename);
  } else {
    pdfDocGenerator.open();
  }

  return pdfDocGenerator;
}

/**
 * Print PDF directly (opens print dialog)
 * @param {object} docDefinition
 */
export function printPDF(docDefinition) {
  const finalDoc = {
    ...docDefinition,
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10
    },
    pageSize: 'A4',
    pageOrientation: docDefinition.pageOrientation || 'portrait',
    pageMargins: docDefinition.pageMargins || [40, 60, 40, 60],
    styles: {
      ...getDefaultStyles(),
      ...(docDefinition.styles || {})
    },
    footer: function(currentPage, pageCount) {
      return generateFooter(currentPage, pageCount);
    }
  };

  const pdfDocGenerator = pdfMake.createPdf(finalDoc);
  pdfDocGenerator.print();

  return pdfDocGenerator;
}

export default {
  generatePDF,
  printPDF,
  forceLatinNumbers,
  formatDateLatin,
  formatNumberLatin,
  generateHeader,
  generateFooter,
  createRTLTable,
  getDefaultStyles
};
