export const designSystem = {
  spacing: {
    xs: 0.5,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4
  },

  form: {
    fieldMarginBottom: 2,
    labelMarginBottom: 0.5,
    helperTextMarginTop: 0.5,
    fieldGap: 2
  },

  dialog: {
    borderRadius: 2,
    padding: {
      title: 2,
      content: 3,
      actions: 2
    },
    maxWidth: {
      small: 'xs',
      medium: 'sm',
      large: 'md',
      xlarge: 'lg'
    }
  },

  button: {
    borderRadius: 1.5,
    height: {
      small: 32,
      medium: 40,
      large: 48
    }
  },

  card: {
    borderRadius: 2,
    padding: 2,
    elevation: 1
  },

  colors: {
    required: 'error.main',
    success: 'success.main',
    warning: 'warning.main',
    error: 'error.main',
    info: 'info.main'
  },

  typography: {
    label: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: 'text.primary'
    },
    helperText: {
      fontSize: '0.75rem',
      color: 'text.secondary'
    },
    title: {
      fontSize: '1.25rem',
      fontWeight: 600
    },
    subtitle: {
      fontSize: '1rem',
      fontWeight: 500
    }
  },

  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195
    }
  }
};

export const formFieldDefaults = {
  size: 'small',
  fullWidth: true,
  variant: 'outlined',
  margin: 'none'
};

export const dialogDefaults = {
  maxWidth: 'sm',
  fullWidth: true,
  PaperProps: {
    sx: {
      borderRadius: designSystem.dialog.borderRadius,
      p: 1
    }
  }
};

export const buttonDefaults = {
  variant: 'contained',
  size: 'medium',
  sx: {
    borderRadius: designSystem.button.borderRadius
  }
};

export const cardDefaults = {
  sx: {
    borderRadius: designSystem.card.borderRadius,
    p: designSystem.card.padding,
    elevation: designSystem.card.elevation
  }
};

export const confirmationMessages = {
  save: {
    title: 'تأكيد الحفظ',
    message: 'هل أنت متأكد من حفظ هذه البيانات؟',
    confirmText: 'حفظ',
    type: 'info'
  },
  update: {
    title: 'تأكيد التحديث',
    message: 'هل أنت متأكد من تحديث هذه البيانات؟',
    confirmText: 'تحديث',
    type: 'info'
  },
  delete: {
    title: 'تأكيد الحذف',
    message: 'هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.',
    confirmText: 'حذف',
    confirmColor: 'error',
    type: 'warning'
  },
  deleteSale: {
    title: 'تأكيد حذف الفاتورة',
    message: 'سيتم إرجاع الكميات إلى المخزون. هل أنت متأكد؟',
    confirmText: 'حذف الفاتورة',
    confirmColor: 'error',
    type: 'warning'
  },
  payment: {
    title: 'تأكيد الدفع',
    message: 'هل أنت متأكد من تسجيل هذه الدفعة؟',
    confirmText: 'تسجيل الدفعة',
    type: 'info'
  },
  export: {
    title: 'تأكيد التصدير',
    message: 'هل تريد تصدير البيانات؟',
    confirmText: 'تصدير',
    type: 'info'
  },
  reset: {
    title: 'تأكيد إعادة التعيين',
    message: 'سيتم حذف جميع البيانات! هذا الإجراء لا يمكن التراجع عنه.',
    confirmText: 'إعادة تعيين',
    confirmColor: 'error',
    type: 'error'
  }
};

export default designSystem;
