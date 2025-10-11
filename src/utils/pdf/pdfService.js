import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import ensurePdfFontsLoaded from './fontLoader';

pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs || pdfFonts;
pdfMake.fonts = pdfMake.fonts || {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

const ARABIC_TO_LATIN = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};

const DEFAULT_STYLES = {
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

const TABLE_LAYOUT = {
  fillColor: (rowIndex) => rowIndex === 0 ? '#2196F3' : (rowIndex % 2 === 0 ? '#f5f5f5' : null),
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
  hLineColor: () => '#ddd',
  vLineColor: () => '#ddd'
};

export function forceLatinNumbers(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[٠-٩]/g, (match) => ARABIC_TO_LATIN[match] || match);
}

export function formatDateLatin(dateStr) {
  return dateStr ? forceLatinNumbers(dateStr) : '';
}

export function formatNumberLatin(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const formatted = Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true
  });
  return forceLatinNumbers(formatted);
}

export function getDefaultStyles() {
  return DEFAULT_STYLES;
}

export function generateHeader(title) {
  return {
    columns: [{
      width: '*',
      text: title,
      style: 'header',
      alignment: 'center'
    }],
    margin: [0, 0, 0, 10]
  };
}

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
    layout: TABLE_LAYOUT
  };
}

function buildFinalDocument(docDefinition) {
  const defaultStyle = {
    font: 'Tajawal',
    fontSize: 10,
    alignment: 'right',
    ...(docDefinition.defaultStyle || {})
  };

  return {
    ...docDefinition,
    defaultStyle,
    pageSize: 'A4',
    pageOrientation: docDefinition.pageOrientation || 'portrait',
    pageMargins: docDefinition.pageMargins || [40, 60, 40, 60],
    styles: {
      ...DEFAULT_STYLES,
      ...(docDefinition.styles || {})
    },
    footer: (currentPage, pageCount) => generateFooter(currentPage, pageCount)
  };
}

async function createDocument(docDefinition) {
  await ensurePdfFontsLoaded();
  return pdfMake.createPdf(buildFinalDocument(docDefinition));
}

export async function generatePDF(docDefinition, filename = 'document.pdf', download = false) {
  const pdfDoc = await createDocument(docDefinition);

  if (download) {
    pdfDoc.download(filename);
  } else {
    pdfDoc.open();
  }

  return pdfDoc;
}

export async function printPDF(docDefinition) {
  const pdfDoc = await createDocument(docDefinition);
  pdfDoc.print();
  return pdfDoc;
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
