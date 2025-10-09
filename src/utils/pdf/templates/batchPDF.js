// src/utils/pdf/templates/batchPDF.js
import {
  forceLatinNumbers,
  formatDateLatin,
  formatNumberLatin,
  generateHeader
} from '../pdfService';

/**
 * Generate batch details PDF document definition
 * @param {object} batch - Batch data
 * @param {object} sheet - Sheet data
 * @param {object} options - PDF generation options
 * @returns {object} PDF document definition
 */
export function generateBatchPDF(batch, sheet, options = {}) {
  const {
    orientation = 'portrait',
    includeLogo = true,
    margins = 'normal'
  } = options;

  const marginMap = {
    narrow: [20, 40, 20, 40],
    normal: [40, 60, 40, 60],
    wide: [60, 80, 60, 80]
  };

  const pageMargins = marginMap[margins] || marginMap.normal;

  // Sheet information section
  const sheetInfo = [
    {
      text: 'معلومات الصفيحة',
      style: 'subheader',
      margin: [0, 10, 0, 10]
    },
    {
      columns: [
        {
          width: '50%',
          stack: [
            { text: 'الكود', style: 'label' },
            { text: forceLatinNumbers(sheet.code || ''), style: 'value', margin: [0, 0, 0, 10] }
          ]
        },
        {
          width: '50%',
          stack: [
            { text: 'الأبعاد (مم)', style: 'label' },
            {
              text: forceLatinNumbers(`${sheet.length_mm}×${sheet.width_mm}×${sheet.thickness_mm}`),
              style: 'value',
              margin: [0, 0, 0, 10]
            }
          ]
        }
      ]
    },
    {
      columns: [
        {
          width: '50%',
          stack: [
            { text: 'نوع المعدن', style: 'label' },
            { text: forceLatinNumbers(sheet.metal_type_name || ''), style: 'value', margin: [0, 0, 0, 10] }
          ]
        },
        {
          width: '50%',
          stack: [
            { text: 'الدرجة', style: 'label' },
            { text: forceLatinNumbers(sheet.grade_name || ''), style: 'value', margin: [0, 0, 0, 10] }
          ]
        }
      ]
    },
    {
      columns: [
        {
          width: '50%',
          stack: [
            { text: 'السطح', style: 'label' },
            { text: forceLatinNumbers(sheet.finish_name || ''), style: 'value', margin: [0, 0, 0, 10] }
          ]
        },
        {
          width: '50%',
          stack: [
            { text: 'وزن القطعة (كغ)', style: 'label' },
            { text: formatNumberLatin(sheet.weight_per_sheet_kg || 0, 3), style: 'value', margin: [0, 0, 0, 10] }
          ]
        }
      ],
      margin: [0, 0, 0, 20]
    }
  ];

  // Batch information section
  const batchInfo = [
    {
      text: 'معلومات الدفعة',
      style: 'subheader',
      margin: [0, 10, 0, 10]
    },
    {
      columns: [
        {
          width: '50%',
          stack: [
            { text: 'المورد', style: 'label' },
            { text: forceLatinNumbers(batch.supplier_name || 'بدون مورد'), style: 'value', margin: [0, 0, 0, 10] }
          ]
        },
        {
          width: '50%',
          stack: [
            { text: 'تاريخ الاستلام', style: 'label' },
            { text: formatDateLatin(batch.received_date || ''), style: 'value', margin: [0, 0, 0, 10] }
          ]
        }
      ]
    },
    {
      columns: [
        {
          width: '50%',
          stack: [
            { text: 'الكمية الأصلية', style: 'label' },
            { text: formatNumberLatin(batch.quantity_original || 0, 0), style: 'value', margin: [0, 0, 0, 10] }
          ]
        },
        {
          width: '50%',
          stack: [
            { text: 'الكمية المتبقية', style: 'label' },
            {
              text: formatNumberLatin(batch.quantity_remaining || 0, 0),
              style: 'value',
              color: batch.quantity_remaining > 0 ? '#4caf50' : '#f44336',
              margin: [0, 0, 0, 10]
            }
          ]
        }
      ]
    },
    {
      columns: [
        {
          width: '50%',
          stack: [
            { text: 'السعر لكل كيلو', style: 'label' },
            {
              text: batch.price_per_kg ? formatNumberLatin(batch.price_per_kg) : '---',
              style: 'value',
              margin: [0, 0, 0, 10]
            }
          ]
        },
        {
          width: '50%',
          stack: [
            { text: 'التكلفة الإجمالية', style: 'label' },
            {
              text: batch.total_cost ? formatNumberLatin(batch.total_cost) : '---',
              style: 'value',
              margin: [0, 0, 0, 10]
            }
          ]
        }
      ]
    },
    {
      columns: [
        {
          width: '50%',
          stack: [
            { text: 'موقع التخزين', style: 'label' },
            { text: forceLatinNumbers(batch.storage_location || '---'), style: 'value', margin: [0, 0, 0, 10] }
          ]
        },
        {
          width: '50%',
          stack: [
            { text: 'الوزن الإجمالي (كغ)', style: 'label' },
            {
              text: formatNumberLatin((batch.quantity_original || 0) * (sheet.weight_per_sheet_kg || 0), 3),
              style: 'value',
              margin: [0, 0, 0, 10]
            }
          ]
        }
      ],
      margin: [0, 0, 0, 20]
    }
  ];

  // Notes section
  const notesSection = batch.notes ? [
    {
      text: 'ملاحظات:',
      style: 'label',
      margin: [0, 10, 0, 5]
    },
    {
      text: forceLatinNumbers(batch.notes),
      fontSize: 10,
      margin: [0, 0, 0, 20]
    }
  ] : [];

  // Audit trail
  const auditSection = [];
  if (batch.created_by) {
    auditSection.push({
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 0.5,
          lineColor: '#ddd'
        }
      ],
      margin: [0, 10, 0, 10]
    });

    auditSection.push({
      columns: [
        {
          width: '50%',
          text: `أضيفت بواسطة: ${forceLatinNumbers(batch.created_by)}`,
          fontSize: 9,
          color: '#666'
        },
        {
          width: '50%',
          text: batch.updated_by ? `آخر تعديل: ${forceLatinNumbers(batch.updated_by)}` : '',
          fontSize: 9,
          color: '#666'
        }
      ]
    });
  }

  // Build document definition
  const docDefinition = {
    pageOrientation: orientation,
    pageMargins,
    content: [
      generateHeader('تفاصيل الدفعة'),
      ...sheetInfo,
      ...batchInfo,
      ...notesSection,
      ...auditSection
    ]
  };

  return docDefinition;
}

export default generateBatchPDF;
