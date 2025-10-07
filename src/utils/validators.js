// src/utils/validators.js

export const validators = {
  required: (value, fieldName) => {
    if (!value || String(value).trim() === '') {
      return `${fieldName} مطلوب`;
    }
    return null;
  },

  positiveNumber: (value, fieldName) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      return `${fieldName} يجب أن يكون رقماً موجباً`;
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'البريد الإلكتروني غير صحيح';
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    const cleaned = String(value).replace(/\D/g, '');
    if (cleaned.length < 7) {
      return 'رقم الهاتف غير صحيح';
    }
    return null;
  },

  dateNotFuture: (value, fieldName) => {
    if (!value) return null;
    const date = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (date > today) {
      return `${fieldName} لا يمكن أن يكون في المستقبل`;
    }
    return null;
  },

  validateCustomerSupplier: (data, isCustomer) => {
    const errors = [];
    
    const nameError = validators.required(data.name, isCustomer ? 'اسم الزبون' : 'اسم المورد');
    if (nameError) errors.push(nameError);
    
    if (data.email) {
      const emailError = validators.email(data.email);
      if (emailError) errors.push(emailError);
    }
    
    if (data.phone1) {
      const phoneError = validators.phone(data.phone1);
      if (phoneError) errors.push(phoneError);
    }
    
    return errors.length > 0 ? errors.join('. ') : null;
  },

  validateSheet: (data) => {
    const errors = [];
    
    if (!data.metal_type_id) errors.push('نوع المعدن مطلوب');
    
    const lengthError = validators.positiveNumber(data.length_mm, 'الطول');
    if (lengthError) errors.push(lengthError);
    
    const widthError = validators.positiveNumber(data.width_mm, 'العرض');
    if (widthError) errors.push(widthError);
    
    const thicknessError = validators.positiveNumber(data.thickness_mm, 'السماكة');
    if (thicknessError) errors.push(thicknessError);
    
    return errors.length > 0 ? errors.join('. ') : null;
  },

  validateBatch: (data) => {
    const errors = [];
    
    const qtyError = validators.positiveNumber(data.quantity, 'الكمية');
    if (qtyError) errors.push(qtyError);
    
    if (!data.received_date) errors.push('تاريخ الاستلام مطلوب');
    
    return errors.length > 0 ? errors.join('. ') : null;
  },

  validateSale: (data) => {
    const errors = [];
    
    if (!data.invoice_number || !data.invoice_number.trim()) {
      errors.push('رقم الفاتورة مطلوب');
    }
    
    if (!data.sale_date) {
      errors.push('تاريخ البيع مطلوب');
    }
    
    if (!data.items || data.items.length === 0) {
      errors.push('يجب إضافة عنصر واحد على الأقل');
    }
    
    return errors.length > 0 ? errors.join('. ') : null;
  }
};

export function parseDbError(error) {
  const msg = error.message || String(error);
  
  if (msg.includes('UNIQUE constraint failed')) {
    if (msg.includes('code')) return 'الكود مستخدم مسبقاً';
    if (msg.includes('name')) return 'الاسم مستخدم مسبقاً';
    if (msg.includes('invoice_number')) return 'رقم الفاتورة مستخدم مسبقاً';
    return 'القيمة مستخدمة مسبقاً';
  }
  
  if (msg.includes('FOREIGN KEY constraint failed')) {
    return 'خطأ في العلاقات - البيانات مرتبطة بسجلات أخرى';
  }
  
  if (msg.includes('NOT NULL constraint failed')) {
    return 'حقل مطلوب مفقود';
  }
  
  return msg;
}