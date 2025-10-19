import {
  forceLatinNumbers,
  formatDateLatin,
  formatNumberLatin,
  generateHeader,
  createRTLTable
} from '../pdfService';

const MARGIN_MAP = {
  narrow: [20, 40, 20, 40],
  normal: [40, 60, 40, 60],
  wide: [60, 80, 60, 80]
};

export function generateInvoicePDF(sale, options = {}) {
  const {
    orientation = 'portrait',
    includeLogo = true,
    margins = 'normal'
  } = options;

  const pageMargins = MARGIN_MAP[margins] || MARGIN_MAP.normal;
  const invoiceInfo = [
    {
      columns: [
        {
          width: '50%',
          stack: [
            { text: 'رقم الفاتورة', style: 'label' },
            { text: forceLatinNumbers(sale.invoice_number || ''), style: 'value', margin: [0, 0, 0, 10] }
          ]
        },
        {
          width: '50%',
          stack: [
            { text: 'التاريخ', style: 'label' },
            { text: formatDateLatin(sale.sale_date || ''), style: 'value', margin: [0, 0, 0, 10] }
          ],
          alignment: 'left'
        }
      ]
    },
    {
      columns: [
        {
          width: '50%',
          stack: [
            { text: 'العميل', style: 'label' },
            { text: forceLatinNumbers(sale.customer_name || 'غير محدد'), style: 'value' }
          ]
        },
        {
          width: '50%',
          stack: [
            { text: 'الهاتف', style: 'label' },
            { text: forceLatinNumbers(sale.customer_phone || '---'), style: 'value' }
          ],
          alignment: 'left'
        }
      ],
      margin: [0, 0, 0, 20]
    }
  ];

  const tableHeaders = ['الإجمالي', 'السعر', 'الكمية', 'الوصف', 'النوع'];
  const tableData = (sale.items || []).map(item => {
    const description = item.item_type === 'material'
      ? `${item.code || ''} - ${item.length_mm}×${item.width_mm}×${item.thickness_mm} مم`
      : `${item.service_name_ar || ''} ${item.material_description ? `- ${item.material_description}` : ''}`;

    return [
      formatNumberLatin(item.total_price || 0),
      formatNumberLatin(item.item_type === 'material' ? item.unit_price : item.service_price),
      formatNumberLatin(item.quantity_sold || 0),
      forceLatinNumbers(description),
      item.item_type === 'material' ? 'معدن' : 'خدمة'
    ];
  });

  const itemsTable = createRTLTable(
    tableHeaders,
    tableData,
    ['20%', '20%', '15%', '30%', '15%']
  );

  const summary = [
    {
      columns: [
        {
          width: '70%',
          text: 'المجموع الفرعي:',
          alignment: 'right',
          fontSize: 11
        },
        {
          width: '30%',
          text: `${formatNumberLatin(sale.subtotal || 0)} ${sale.currency_symbol || ''}`,
          alignment: 'left',
          fontSize: 11,
          bold: true
        }
      ],
      margin: [0, 10, 0, 5]
    }
  ];

  if (sale.discount && sale.discount > 0) {
    summary.push({
      columns: [
        {
          width: '70%',
          text: 'الخصم:',
          alignment: 'right',
          fontSize: 11
        },
        {
          width: '30%',
          text: `-${formatNumberLatin(sale.discount || 0)} ${sale.currency_symbol || ''}`,
          alignment: 'left',
          fontSize: 11,
          color: '#f44336'
        }
      ],
      margin: [0, 0, 0, 5]
    });
  }

  if (sale.tax && sale.tax > 0) {
    summary.push({
      columns: [
        {
          width: '70%',
          text: 'الضريبة:',
          alignment: 'right',
          fontSize: 11
        },
        {
          width: '30%',
          text: `${formatNumberLatin(sale.tax || 0)} ${sale.currency_symbol || ''}`,
          alignment: 'left',
          fontSize: 11
        }
      ],
      margin: [0, 0, 0, 5]
    });
  }

  summary.push({
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 5,
        x2: 515,
        y2: 5,
        lineWidth: 1
      }
    ]
  });

  summary.push({
    columns: [
      {
        width: '70%',
        text: 'الإجمالي:',
        alignment: 'right',
        fontSize: 13,
        bold: true
      },
      {
        width: '30%',
        text: `${formatNumberLatin(sale.total_amount || 0)} ${sale.currency_symbol || ''}`,
        alignment: 'left',
        fontSize: 13,
        bold: true,
        color: '#2196F3'
      }
    ],
    margin: [0, 10, 0, 5]
  });

  summary.push({
    columns: [
      {
        width: '70%',
        text: 'المدفوع:',
        alignment: 'right',
        fontSize: 11
      },
      {
        width: '30%',
        text: `${formatNumberLatin(sale.total_paid || 0)} ${sale.currency_symbol || ''}`,
        alignment: 'left',
        fontSize: 11,
        color: '#4caf50'
      }
    ],
    margin: [0, 5, 0, 5]
  });

  if (sale.remaining && sale.remaining > 0) {
    summary.push({
      columns: [
        {
          width: '70%',
          text: 'المتبقي:',
          alignment: 'right',
          fontSize: 11
        },
        {
          width: '30%',
          text: `${formatNumberLatin(sale.remaining || 0)} ${sale.currency_symbol || ''}`,
          alignment: 'left',
          fontSize: 11,
          bold: true,
          color: '#f44336'
        }
      ],
      margin: [0, 0, 0, 10]
    });
  }

  const notesSection = sale.notes ? [
    {
      text: 'ملاحظات:',
      style: 'label',
      margin: [0, 20, 0, 5]
    },
    {
      text: forceLatinNumbers(sale.notes),
      fontSize: 10,
      margin: [0, 0, 0, 10]
    }
  ] : [];

  const auditSection = [];
  if (sale.created_by) {
    auditSection.push({
      columns: [
        {
          width: '50%',
          text: `أضيفت بواسطة: ${forceLatinNumbers(sale.created_by)}`,
          fontSize: 8,
          color: '#666'
        },
        {
          width: '50%',
          text: sale.updated_by ? `آخر تعديل: ${forceLatinNumbers(sale.updated_by)}` : '',
          fontSize: 8,
          color: '#666',
          alignment: 'left'
        }
      ],
      margin: [0, 10, 0, 0]
    });
  }

  const docDefinition = {
    pageOrientation: orientation,
    pageMargins,
    content: [
      generateHeader(`فاتورة بيع رقم ${forceLatinNumbers(sale.invoice_number || '')}`),
      ...invoiceInfo,
      {
        text: 'الأصناف',
        style: 'subheader',
        margin: [0, 10, 0, 10]
      },
      itemsTable,
      ...summary,
      ...notesSection,
      ...auditSection
    ]
  };

  return docDefinition;
}

export default generateInvoicePDF;
