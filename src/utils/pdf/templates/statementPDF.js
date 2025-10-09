// src/utils/pdf/templates/statementPDF.js
import {
  forceLatinNumbers,
  formatDateLatin,
  formatNumberLatin,
  generateHeader,
  createRTLTable
} from '../pdfService';

/**
 * Generate customer/supplier statement PDF
 * @param {object} entity - Customer or supplier data
 * @param {array} transactions - Transaction history
 * @param {string} type - 'customer' or 'supplier'
 * @param {object} options - PDF generation options
 * @returns {object} PDF document definition
 */
export function generateStatementPDF(entity, transactions, type = 'customer', options = {}) {
  const {
    orientation = 'portrait',
    includeLogo = true,
    margins = 'normal',
    fromDate = null,
    toDate = null,
    currencySymbol = ''
  } = options;

  const marginMap = {
    narrow: [20, 40, 20, 40],
    normal: [40, 60, 40, 60],
    wide: [60, 80, 60, 80]
  };

  const pageMargins = marginMap[margins] || marginMap.normal;

  const entityType = type === 'customer' ? 'العميل' : 'المورد';
  const title = `كشف حساب ${entityType}`;

  // Entity information
  const entityInfo = [
    {
      columns: [
        {
          width: '50%',
          stack: [
            { text: 'الاسم', style: 'label' },
            { text: forceLatinNumbers(entity.name || ''), style: 'value', margin: [0, 0, 0, 10] }
          ]
        },
        {
          width: '50%',
          stack: [
            { text: 'الشركة', style: 'label' },
            { text: forceLatinNumbers(entity.company_name || '---'), style: 'value', margin: [0, 0, 0, 10] }
          ]
        }
      ]
    },
    {
      columns: [
        {
          width: '50%',
          stack: [
            { text: 'الهاتف', style: 'label' },
            { text: forceLatinNumbers(entity.phone1 || '---'), style: 'value', margin: [0, 0, 0, 10] }
          ]
        },
        {
          width: '50%',
          stack: [
            { text: 'العنوان', style: 'label' },
            { text: forceLatinNumbers(entity.address || '---'), style: 'value', margin: [0, 0, 0, 10] }
          ]
        }
      ],
      margin: [0, 0, 0, 10]
    }
  ];

  // Date range if specified
  const dateRange = (fromDate || toDate) ? [
    {
      text: `الفترة: من ${formatDateLatin(fromDate || 'البداية')} إلى ${formatDateLatin(toDate || 'الآن')}`,
      style: 'info',
      alignment: 'center',
      margin: [0, 0, 0, 15]
    }
  ] : [];

  // Prepare transactions table
  const tableHeaders = ['الرصيد بعد', 'المبلغ', 'النوع', 'الملاحظات', 'التاريخ'];
  const tableData = transactions.map(tx => {
    let txType = '';
    if (type === 'customer') {
      txType = tx.transaction_type === 'sale' ? 'بيع' : 'دفعة';
    } else {
      txType = tx.transaction_type === 'purchase' ? 'شراء' : 'دفعة';
    }

    const amount = tx.amount || 0;
    const formattedAmount = amount >= 0
      ? formatNumberLatin(amount)
      : `-${formatNumberLatin(Math.abs(amount))}`;

    return [
      formatNumberLatin(tx.balance_after || 0),
      formattedAmount,
      forceLatinNumbers(txType),
      forceLatinNumbers(tx.notes || (tx.invoice_number ? `فاتورة ${tx.invoice_number}` : '---')),
      formatDateLatin(tx.transaction_date || '')
    ];
  });

  const transactionsTable = createRTLTable(
    tableHeaders,
    tableData,
    ['20%', '20%', '15%', '30%', '15%']
  );

  // Summary section
  const finalBalance = transactions.length > 0
    ? transactions[transactions.length - 1].balance_after || 0
    : 0;

  const balanceColor = finalBalance > 0 ? '#f44336' : finalBalance < 0 ? '#4caf50' : '#666';
  const balanceLabel = type === 'customer'
    ? (finalBalance > 0 ? 'مطلوب منه' : finalBalance < 0 ? 'له رصيد' : 'متوازن')
    : (finalBalance > 0 ? 'مستحق له' : finalBalance < 0 ? 'مدفوع زيادة' : 'متوازن');

  const summary = [
    {
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 10,
          x2: 515,
          y2: 10,
          lineWidth: 1
        }
      ],
      margin: [0, 15, 0, 15]
    },
    {
      columns: [
        {
          width: '70%',
          text: `الرصيد النهائي (${balanceLabel}):`,
          alignment: 'right',
          fontSize: 13,
          bold: true
        },
        {
          width: '30%',
          text: `${formatNumberLatin(Math.abs(finalBalance))} ${currencySymbol}`,
          alignment: 'left',
          fontSize: 13,
          bold: true,
          color: balanceColor
        }
      ]
    },
    {
      text: `عدد العمليات: ${forceLatinNumbers(transactions.length)}`,
      alignment: 'center',
      fontSize: 9,
      color: '#666',
      margin: [0, 10, 0, 0]
    }
  ];

  // Build document definition
  const docDefinition = {
    pageOrientation: orientation,
    pageMargins,
    content: [
      generateHeader(title),
      ...entityInfo,
      ...dateRange,
      {
        text: 'سجل المعاملات',
        style: 'subheader',
        margin: [0, 10, 0, 10]
      },
      transactions.length > 0
        ? transactionsTable
        : {
            text: 'لا توجد معاملات في هذه الفترة',
            alignment: 'center',
            fontSize: 11,
            color: '#999',
            margin: [0, 20, 0, 20]
          },
      ...(transactions.length > 0 ? summary : [])
    ]
  };

  return docDefinition;
}

export default generateStatementPDF;
