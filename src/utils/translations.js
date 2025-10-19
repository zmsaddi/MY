// src/utils/translations.js
/**
 * Centralized translations for the Metal Sheets Management System
 * This file contains all Arabic (ar) and English (en) translations
 */

export const translations = {
  // Common terms
  common: {
    // Basic actions
    save: { ar: 'حفظ', en: 'Save' },
    cancel: { ar: 'إلغاء', en: 'Cancel' },
    delete: { ar: 'حذف', en: 'Delete' },
    edit: { ar: 'تعديل', en: 'Edit' },
    add: { ar: 'إضافة', en: 'Add' },
    search: { ar: 'بحث', en: 'Search' },
    filter: { ar: 'تصفية', en: 'Filter' },
    export: { ar: 'تصدير', en: 'Export' },
    import: { ar: 'استيراد', en: 'Import' },
    print: { ar: 'طباعة', en: 'Print' },
    close: { ar: 'إغلاق', en: 'Close' },
    confirm: { ar: 'تأكيد', en: 'Confirm' },
    yes: { ar: 'نعم', en: 'Yes' },
    no: { ar: 'لا', en: 'No' },
    ok: { ar: 'حسناً', en: 'OK' },

    // Status messages
    loading: { ar: 'جاري التحميل...', en: 'Loading...' },
    processing: { ar: 'جاري المعالجة...', en: 'Processing...' },
    noData: { ar: 'لا توجد بيانات', en: 'No data available' },
    error: { ar: 'خطأ', en: 'Error' },
    success: { ar: 'نجح', en: 'Success' },
    warning: { ar: 'تحذير', en: 'Warning' },
    info: { ar: 'معلومات', en: 'Info' },

    // Common labels
    required: { ar: 'مطلوب', en: 'Required' },
    optional: { ar: 'اختياري', en: 'Optional' },
    active: { ar: 'مفعّل', en: 'Active' },
    inactive: { ar: 'موقوف', en: 'Inactive' },
    all: { ar: 'الكل', en: 'All' },
    total: { ar: 'الإجمالي', en: 'Total' },
    subtotal: { ar: 'المجموع الجزئي', en: 'Subtotal' },
    actions: { ar: 'الإجراءات', en: 'Actions' },
    details: { ar: 'التفاصيل', en: 'Details' },
    notes: { ar: 'ملاحظات', en: 'Notes' },
    date: { ar: 'التاريخ', en: 'Date' },
    time: { ar: 'الوقت', en: 'Time' },
    name: { ar: 'الاسم', en: 'Name' },
    nameAr: { ar: 'الاسم بالعربية', en: 'Name (Arabic)' },
    nameEn: { ar: 'الاسم بالإنجليزية', en: 'Name (English)' },
    description: { ar: 'الوصف', en: 'Description' },
    price: { ar: 'السعر', en: 'Price' },
    quantity: { ar: 'الكمية', en: 'Quantity' },
    amount: { ar: 'المبلغ', en: 'Amount' },
    status: { ar: 'الحالة', en: 'Status' },
    type: { ar: 'النوع', en: 'Type' },
    category: { ar: 'الفئة', en: 'Category' },
    company: { ar: 'الشركة', en: 'Company' },
    companySupplierName: { ar: 'الشركة', en: 'Company' },

    // Print/PDF related
    exportPDF: { ar: 'تصدير PDF', en: 'Export PDF' },
    preview: { ar: 'معاينة', en: 'Preview' },
    printConfirmTitle: { ar: 'تأكيد إعداد الطباعة', en: 'Confirm Print Setup' },
    printConfirmMessage: { ar: 'سيتم تجهيز المستند', en: 'Document will be prepared' },
    document: { ar: 'مستند', en: 'Document' },
    documentName: { ar: 'اسم المستند', en: 'Document Name' },
    documentType: { ar: 'نوع المستند', en: 'Document Type' },
    estimatedPages: { ar: 'عدد الصفحات التقريبي', en: 'Estimated Pages' },
    outputDestination: { ar: 'وجهة الإخراج', en: 'Output Destination' },
    directPrint: { ar: 'طباعة مباشرة', en: 'Direct Print' },
    exportToPDF: { ar: 'تصدير إلى PDF', en: 'Export to PDF' },
    printPreview: { ar: 'معاينة قبل الطباعة', en: 'Print Preview' },
    pageOrientation: { ar: 'اتجاه الصفحات', en: 'Page Orientation' },
    portrait: { ar: 'طولي', en: 'Portrait' },
    landscape: { ar: 'عرضي', en: 'Landscape' },
    margins: { ar: 'الهوامش', en: 'Margins' },
    narrow: { ar: 'ضيقة', en: 'Narrow' },
    normal: { ar: 'متوسطة', en: 'Normal' },
    wide: { ar: 'عريضة', en: 'Wide' },
    showCompanyLogo: { ar: 'إظهار شعار الشركة', en: 'Show Company Logo' },

    // Dialog actions
    confirmAction: { ar: 'أؤكد تنفيذ الإجراء', en: 'I confirm this action' },

    // Table/List related
    hide: { ar: 'إخفاء', en: 'Hide' },
    more: { ar: 'المزيد', en: 'More' },

    // Date filter
    fromDate: { ar: 'من تاريخ', en: 'From Date' },
    toDate: { ar: 'إلى تاريخ', en: 'To Date' },
    today: { ar: 'اليوم', en: 'Today' },
    thisMonth: { ar: 'هذا الشهر', en: 'This Month' },
    thisYear: { ar: 'هذا العام', en: 'This Year' },
    lastMonth: { ar: 'الشهر الماضي', en: 'Last Month' },

    // Error boundary
    recovering: { ar: 'جاري استعادة التطبيق...', en: 'Recovering application...' },
    unexpectedError: { ar: 'عذراً، حدث خطأ غير متوقع', en: 'Sorry, an unexpected error occurred' },
    errorApology: { ar: 'نعتذر عن الإزعاج. حدث خطأ أثناء عرض هذه الصفحة.', en: 'We apologize for the inconvenience. An error occurred while displaying this page.' },
    errorOccurredTimes: { ar: 'حدث هذا الخطأ {count} مرات', en: 'This error occurred {count} times' },
    errorMessage: { ar: 'رسالة الخطأ', en: 'Error Message' },
    unknownError: { ar: 'خطأ غير معروف', en: 'Unknown error' },
    tryAgain: { ar: 'حاول مرة أخرى', en: 'Try Again' },
    reloadPage: { ar: 'إعادة تحميل الصفحة', en: 'Reload Page' },
    homePage: { ar: 'الصفحة الرئيسية', en: 'Home Page' },
    technicalDetails: { ar: 'تفاصيل تقنية', en: 'Technical Details' },
    contactSupport: { ar: 'إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني', en: 'If the problem persists, please contact technical support' },
    operationError: { ar: 'خطأ في العملية', en: 'Operation Error' },
    processingRequestError: { ar: 'حدث خطأ أثناء معالجة الطلب', en: 'An error occurred while processing the request' },
    errorCode: { ar: 'كود الخطأ', en: 'Error Code' },
    technicalInfo: { ar: 'التفاصيل التقنية', en: 'Technical Details' },
    copyErrorInfo: { ar: 'نسخ معلومات الخطأ', en: 'Copy Error Information' },
    copied: { ar: 'تم النسخ!', en: 'Copied!' },
    copy: { ar: 'نسخ', en: 'Copy' },
  },

  // Menu items
  menu: {
    dashboard: { ar: 'لوحة التحكم', en: 'Dashboard' },
    sales: { ar: 'المبيعات', en: 'Sales' },
    customers: { ar: 'الزبائن', en: 'Customers' },
    suppliers: { ar: 'الموردين', en: 'Suppliers' },
    inventory: { ar: 'المخزون', en: 'Inventory' },
    expenses: { ar: 'المصروفات', en: 'Expenses' },
    payments: { ar: 'الدفعات', en: 'Payments' },
    reports: { ar: 'التقارير', en: 'Reports' },
    settings: { ar: 'الإعدادات', en: 'Settings' },
  },

  // Dashboard
  dashboard: {
    title: { ar: 'لوحة التحكم', en: 'Dashboard' },
    overviewSubtitle: { ar: 'نظرة عامة على نشاط الأعمال', en: 'Business Activity Overview' },
    totalSales: { ar: 'إجمالي المبيعات', en: 'Total Sales' },
    netProfit: { ar: 'صافي الربح', en: 'Net Profit' },
    customersCount: { ar: 'عدد الزبائن', en: 'Customers Count' },
    stockCount: { ar: 'المخزون', en: 'Stock' },
    pieces: { ar: 'قطعة', en: 'pieces' },
    lastSales: { ar: 'آخر المبيعات', en: 'Latest Sales' },
    noSales: { ar: 'لا توجد مبيعات', en: 'No sales' },
    unspecifiedCustomer: { ar: 'زبون غير محدد', en: 'Unspecified customer' },
    profitSummary: { ar: 'ملخص الربحية', en: 'Profitability Summary' },
    materialsRevenue: { ar: 'إيرادات المواد', en: 'Materials Revenue' },
    servicesRevenue: { ar: 'إيرادات الخدمات', en: 'Services Revenue' },
    expenses: { ar: 'المصروفات', en: 'Expenses' },
    netProfitLabel: { ar: 'صافي الربح', en: 'Net Profit' },
    todaySales: { ar: 'مبيعات اليوم', en: "Today's Sales" },
    totalRevenue: { ar: 'إجمالي الإيرادات', en: 'Total Revenue' },
    totalCustomers: { ar: 'إجمالي الزبائن', en: 'Total Customers' },
    totalSuppliers: { ar: 'إجمالي الموردين', en: 'Total Suppliers' },
    inventoryValue: { ar: 'قيمة المخزون', en: 'Inventory Value' },
    recentSales: { ar: 'المبيعات الأخيرة', en: 'Recent Sales' },
    recentPayments: { ar: 'الدفعات الأخيرة', en: 'Recent Payments' },
    topCustomers: { ar: 'أفضل الزبائن', en: 'Top Customers' },
    topProducts: { ar: 'أفضل المنتجات', en: 'Top Products' },
    lowStock: { ar: 'مخزون منخفض', en: 'Low Stock' },
  },

  // Sales
  sales: {
    title: { ar: 'إدارة المبيعات', en: 'Sales Management' },
    subtitle: { ar: 'إنشاء الفواتير وإدارة المبيعات (معادن + خدمات)', en: 'Create invoices and manage sales (materials + services)' },
    newSale: { ar: 'إنشاء فاتورة جديدة', en: 'Create New Invoice' },
    invoiceNumber: { ar: 'رقم الفاتورة', en: 'Invoice Number' },
    invoiceDate: { ar: 'تاريخ الفاتورة', en: 'Invoice Date' },
    saleDate: { ar: 'تاريخ البيع', en: 'Sale Date' },
    customer: { ar: 'الزبون', en: 'Customer' },
    selectCustomer: { ar: 'اختر الزبون', en: 'Select Customer' },
    items: { ar: 'الأصناف', en: 'Items' },
    addItem: { ar: 'إضافة', en: 'Add' },
    product: { ar: 'المنتج', en: 'Product' },
    service: { ar: 'الخدمة', en: 'Service' },
    weight: { ar: 'الوزن', en: 'Weight' },
    weightKg: { ar: 'الوزن (كغ)', en: 'Weight (kg)' },
    pricePerKg: { ar: 'السعر/كغ', en: 'Price/kg' },
    pricePerPiece: { ar: 'السعر/قطعة', en: 'Price/piece' },
    totalPrice: { ar: 'السعر الإجمالي', en: 'Total Price' },
    discount: { ar: 'الخصم', en: 'Discount' },
    vat: { ar: 'ضريبة القيمة المضافة', en: 'VAT' },
    tax: { ar: 'الضريبة', en: 'Tax' },
    grandTotal: { ar: 'الإجمالي النهائي', en: 'Grand Total' },
    paymentMethod: { ar: 'طريقة الدفع', en: 'Payment Method' },
    cash: { ar: 'نقداً', en: 'Cash' },
    card: { ar: 'بطاقة', en: 'Card' },
    bank: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
    paid: { ar: 'مدفوعة', en: 'Paid' },
    unpaid: { ar: 'غير مدفوعة', en: 'Unpaid' },
    partial: { ar: 'جزئية', en: 'Partial' },

    // Stepper steps
    stepInvoiceInfo: { ar: 'معلومات الفاتورة', en: 'Invoice Information' },
    stepItems: { ar: 'الأصناف', en: 'Items' },
    stepTotalsPayment: { ar: 'الإجماليات والدفع', en: 'Totals & Payment' },

    // Form labels
    autoGenerated: { ar: 'يتم توليده تلقائياً', en: 'Auto-generated' },
    invoiceCurrency: { ar: 'عملة الفاتورة', en: 'Invoice Currency' },
    notes: { ar: 'ملاحظات', en: 'Notes' },

    // Item types
    itemType: { ar: 'نوع الصنف', en: 'Item Type' },
    materialFromStock: { ar: 'معدن من المخزون', en: 'Material from Stock' },
    serviceType: { ar: 'خدمة', en: 'Service' },

    // Sale types
    saleType: { ar: 'نوع البيع', en: 'Sale Type' },
    fullSheet: { ar: 'صفيحة كاملة', en: 'Full Sheet' },
    remnantFromStock: { ar: 'قطعة من المخزون (بواقي)', en: 'Piece from Stock (Remnants)' },
    cutFromSheet: { ar: 'قص من صفيحة', en: 'Cut from Sheet' },

    // Selection labels
    selectSheet: { ar: 'اختر الصفيحة', en: 'Select Sheet' },
    selectRemnant: { ar: 'اختر البقية', en: 'Select Remnant' },
    selectMotherSheet: { ar: 'اختر الصفيحة الأم', en: 'Select Mother Sheet' },
    selectService: { ar: 'اختر الخدمة', en: 'Select Service' },
    selectSheetRequired: { ar: 'اختر الصفيحة *', en: 'Select Sheet *' },
    selectRemnantRequired: { ar: 'اختر البقية *', en: 'Select Remnant *' },
    selectMotherSheetRequired: { ar: 'اختر الصفيحة الأم *', en: 'Select Mother Sheet *' },
    selectServiceRequired: { ar: 'اختر الخدمة *', en: 'Select Service *' },

    // Dimensions
    lengthMm: { ar: 'الطول (مم)', en: 'Length (mm)' },
    widthMm: { ar: 'العرض (مم)', en: 'Width (mm)' },
    thicknessMm: { ar: 'السماكة (مم)', en: 'Thickness (mm)' },
    lengthRequired: { ar: 'الطول (مم) *', en: 'Length (mm) *' },
    widthRequired: { ar: 'العرض (مم) *', en: 'Width (mm) *' },
    thicknessOptional: { ar: 'السماكة (مم)', en: 'Thickness (mm)' },
    fromMotherSheet: { ar: 'من الصفيحة الأم', en: 'From mother sheet' },
    sheetThickness: { ar: 'سماكة الصفيحة', en: 'Sheet thickness' },
    mm: { ar: 'مم', en: 'mm' },

    // Helper text
    available: { ar: 'المتاح', en: 'Available' },
    availableColon: { ar: 'المتاح:', en: 'Available:' },
    availableOnly: { ar: 'المتاحة فقط', en: 'Available only' },
    optionalAutoCalc: { ar: 'اختياري - حساب تلقائي', en: 'Optional - auto calculated' },
    materialDescription: { ar: 'وصف المادة (نوع، أبعاد، كمية)', en: 'Material description (type, dimensions, quantity)' },
    materialDescExample: { ar: 'اختياري - مثال: ستانلس 1000×2000×1.5', en: 'Optional - example: Stainless 1000×2000×1.5' },
    serviceNotes: { ar: 'ملاحظات الخدمة', en: 'Service notes' },
    servicePrice: { ar: 'سعر الخدمة', en: 'Service Price' },
    defaultOne: { ar: 'افتراضي: 1', en: 'Default: 1' },
    sheetThicknessColon: { ar: 'سماكة الصفيحة:', en: 'Sheet thickness:' },

    // Form field labels
    quantityRequired: { ar: 'الكمية *', en: 'Quantity *' },
    pricePerPieceRequired: { ar: 'السعر/قطعة *', en: 'Price/Piece *' },
    priceRequired: { ar: 'السعر *', en: 'Price *' },
    weightKgOptional: { ar: 'الوزن (كغ) - اختياري', en: 'Weight (kg) - Optional' },
    pricePerKgRequired: { ar: 'السعر/كيلو *', en: 'Price/kg *' },
    perKg: { ar: 'كغ', en: 'kg' },
    itemType: { ar: 'نوع العنصر', en: 'Item Type' },
    addNewItem: { ar: 'إضافة عنصر جديد', en: 'Add New Item' },
    dimensions: { ar: 'الأبعاد', en: 'Dimensions' },
    unitPrice: { ar: 'سعر الوحدة', en: 'Unit Price' },

    // Table headers
    type: { ar: 'النوع', en: 'Type' },
    description: { ar: 'الوصف', en: 'Description' },
    quantity: { ar: 'الكمية', en: 'Quantity' },
    price: { ar: 'السعر', en: 'Price' },
    total: { ar: 'الإجمالي', en: 'Total' },
    delete: { ar: 'حذف', en: 'Delete' },

    // Chip labels
    material: { ar: 'معدن', en: 'Material' },

    // Item descriptions
    remnant: { ar: 'بقية', en: 'remnant' },
    remnantLabel: { ar: '(بقية)', en: '(remnant)' },
    pieceFrom: { ar: 'قطعة من', en: 'Piece from' },

    // Totals section
    subtotal: { ar: 'المجموع الجزئي', en: 'Subtotal' },
    taxRate: { ar: 'الضريبة', en: 'Tax' },
    finalTotal: { ar: 'الإجمالي النهائي', en: 'Final Total' },
    amountPaid: { ar: 'المبلغ المدفوع', en: 'Amount Paid' },
    paymentMethodLabel: { ar: 'طريقة الدفع', en: 'Payment Method' },
    remaining: { ar: 'المتبقي', en: 'Remaining' },
    unspecified: { ar: 'غير محدد', en: 'Unspecified' },
    zeroCredit: { ar: 'صفر = آجل', en: 'Zero = credit' },

    // Confirmation message
    confirmSaveMessage: { ar: 'تأكّد من صحة جميع البيانات قبل الحفظ. سيتم خصم الكميات من المخزون تلقائياً.', en: 'Verify all data before saving. Quantities will be deducted from inventory automatically.' },

    // Buttons
    cancel: { ar: 'إلغاء', en: 'Cancel' },
    previous: { ar: 'السابق', en: 'Previous' },
    next: { ar: 'التالي', en: 'Next' },
    saveInvoice: { ar: 'حفظ الفاتورة', en: 'Save Invoice' },
    close: { ar: 'إغلاق', en: 'Close' },

    // Remnant dialog
    addRemnantsTitle: { ar: 'إضافة البواقي من القطع', en: 'Add Remnants from Cutting' },
    addRemnantsFromCutting: { ar: 'إضافة البواقي من القطع', en: 'Add Remnants from Cutting' },
    sheetCutAddRemnants: { ar: 'تم قص الصفيحة. هل تريد إضافة القطع المتبقية كبواقي؟', en: 'Sheet has been cut. Do you want to add the remaining pieces as remnants?' },
    remnantDialogMessage: { ar: 'تم قص الصفيحة. هل تريد إضافة القطع المتبقية كبواقي؟', en: 'Sheet has been cut. Do you want to add the remaining pieces as remnants?' },
    motherSheet: { ar: 'الصفيحة الأم', en: 'Mother Sheet' },
    motherSheetColon: { ar: 'الصفيحة الأم:', en: 'Mother Sheet:' },
    soldPiece: { ar: 'القطعة المباعة', en: 'Sold Piece' },
    soldPieceColon: { ar: 'القطعة المباعة:', en: 'Sold Piece:' },
    metalType: { ar: 'نوع المعدن', en: 'Metal Type' },
    metalTypeColon: { ar: 'نوع المعدن:', en: 'Metal Type:' },
    remnantPiece: { ar: 'قطعة بقية', en: 'Remnant Piece' },
    remnantPieceNumber: { ar: 'قطعة بقية #', en: 'Remnant Piece #' },
    lengthMmRequired: { ar: 'الطول (مم) *', en: 'Length (mm) *' },
    widthMmRequired: { ar: 'العرض (مم) *', en: 'Width (mm) *' },
    thicknessMmLabel: { ar: 'السماكة (مم)', en: 'Thickness (mm)' },
    quantityLabel: { ar: 'الكمية', en: 'Quantity' },
    inheritedFromMotherSheet: { ar: 'موروثة من الصفيحة الأم', en: 'Inherited from mother sheet' },
    addAnotherPiece: { ar: 'إضافة قطعة أخرى', en: 'Add Another Piece' },
    noteLabel: { ar: 'ملاحظة:', en: 'Note:' },
    remnantsSavedNote: { ar: 'سيتم حفظ البواقي كمخزون للشركة بنفس سعر الصفيحة الأم', en: 'Remnants will be saved as company inventory at the same price as the mother sheet' },
    skip: { ar: 'تخطي', en: 'Skip' },
    saveRemnants: { ar: 'حفظ البواقي', en: 'Save Remnants' },
    savingRemnants: { ar: 'جاري الحفظ...', en: 'Saving...' },
    deletePiece: { ar: 'حذف هذه القطعة', en: 'Delete this piece' },
    noValidPiecesToSave: { ar: 'لا توجد قطع صالحة للحفظ', en: 'No valid pieces to save' },
    failedSaveRemnants: { ar: 'فشل حفظ البواقي', en: 'Failed to save remnants' },
    errorSavingRemnantsColon: { ar: 'حدث خطأ أثناء حفظ البواقي: ', en: 'Error while saving remnants: ' },
    remnantFromCutting: { ar: 'بقية من قص ', en: 'Remnant from cutting ' },

    // View dialog
    invoiceDetails: { ar: 'تفاصيل الفاتورة', en: 'Invoice Details' },
    customerLabel: { ar: 'الزبون:', en: 'Customer:' },
    dateLabel: { ar: 'التاريخ:', en: 'Date:' },
    itemsLabel: { ar: 'الأصناف:', en: 'Items:' },
    subtotalLabel: { ar: 'المجموع الجزئي:', en: 'Subtotal:' },
    discountLabel: { ar: 'الخصم:', en: 'Discount:' },
    taxLabel: { ar: 'الضريبة:', en: 'Tax:' },
    totalLabel: { ar: 'الإجمالي:', en: 'Total:' },
    paidLabel: { ar: 'المدفوع:', en: 'Paid:' },
    remainingLabel: { ar: 'المتبقي:', en: 'Remaining:' },
    notesLabel: { ar: 'ملاحظات:', en: 'Notes:' },
    addedBy: { ar: 'أضيفت بواسطة:', en: 'Added by:' },
    lastEditedBy: { ar: 'آخر تعديل بواسطة:', en: 'Last edited by:' },

    // Validation errors
    errorCustomerRequired: { ar: 'يجب اختيار زبون', en: 'Customer is required' },
    errorSaleDateRequired: { ar: 'تاريخ البيع مطلوب', en: 'Sale date is required' },
    errorItemsRequired: { ar: 'يجب إضافة صنف واحد على الأقل', en: 'At least one item is required' },
    errorSelectSheet: { ar: 'يجب اختيار الصفيحة', en: 'Sheet must be selected' },
    errorSheetRequired: { ar: 'يجب اختيار صفيحة', en: 'Sheet is required' },
    errorSelectRemnant: { ar: 'يجب اختيار البقية', en: 'Remnant must be selected' },
    errorRemnantRequired: { ar: 'يجب اختيار البقية', en: 'Remnant is required' },
    errorSelectMotherSheet: { ar: 'يجب اختيار الصفيحة الأم', en: 'Mother sheet must be selected' },
    errorMotherSheetRequired: { ar: 'يجب اختيار الصفيحة الأم', en: 'Mother sheet is required' },
    errorSelectService: { ar: 'يجب اختيار الخدمة', en: 'Service must be selected' },
    errorServiceRequired: { ar: 'يجب اختيار خدمة', en: 'Service is required' },
    errorInvalidQuantity: { ar: 'الكمية غير صحيحة', en: 'Invalid quantity' },
    errorQuantityPositive: { ar: 'الكمية يجب أن تكون أكبر من صفر', en: 'Quantity must be greater than zero' },
    errorQuantityExceedsAvailable: { ar: 'الكمية المطلوبة أكبر من المتاح', en: 'Requested quantity exceeds available' },
    errorQuantityExceeds: { ar: 'الكمية المتاحة فقط', en: 'Available quantity only' },
    errorInvalidPrice: { ar: 'السعر غير صحيح', en: 'Invalid price' },
    errorPricePositive: { ar: 'السعر يجب أن يكون أكبر من صفر', en: 'Price must be greater than zero' },
    errorInvalidPricePerKg: { ar: 'السعر لكل كيلو غير صحيح', en: 'Invalid price per kg' },
    errorServicePricePositive: { ar: 'سعر الخدمة يجب أن يكون أكبر من صفر', en: 'Service price must be greater than zero' },
    errorSoldDimensionsRequired: { ar: 'يجب إدخال أبعاد القطعة المباعة', en: 'Sold piece dimensions are required' },
    errorAllDimensionsRequired: { ar: 'يجب إدخال جميع الأبعاد', en: 'All dimensions are required' },
    errorPriceOrPricePerKg: { ar: 'يجب إدخال السعر (إما سعر القطعة أو سعر الكيلو)', en: 'Price is required (either piece price or price per kg)' },
    errorRemnantData: { ar: 'يجب إدخال بيانات صحيحة للبواقي', en: 'Valid remnant data is required' },
    errorMotherSheetNotFound: { ar: 'لم يتم العثور على الصفيحة الأم', en: 'Mother sheet not found' },

    // Success messages
    successInvoiceCreated: { ar: 'تم إنشاء الفاتورة', en: 'Invoice created' },
    successInvoiceCreatedFull: { ar: 'بنجاح', en: 'successfully' },
    successInvoiceDeleted: { ar: 'تم حذف الفاتورة بنجاح', en: 'Invoice deleted successfully' },
    successRemnantsSaved: { ar: 'تم حفظ', en: 'Saved' },
    successRemnantPieces: { ar: 'قطعة بواقي بنجاح', en: 'remnant pieces successfully' },

    // Error messages
    errorSaveFailed: { ar: 'فشل الحفظ:', en: 'Save failed:' },
    errorDeleteFailed: { ar: 'فشل الحذف:', en: 'Delete failed:' },
    errorOccurred: { ar: 'حدث خطأ:', en: 'Error occurred:' },
    errorSavingRemnants: { ar: 'خطأ في حفظ البواقي:', en: 'Error saving remnants:' },
    errorSavingPieces: { ar: 'فشل حفظ', en: 'Failed to save' },
    errorPiecesCount: { ar: 'قطعة', en: 'pieces' },

    // Print
    printInvoiceConfirm: { ar: 'تأكيد طباعة الفاتورة', en: 'Confirm Print Invoice' },
    invoiceLabel: { ar: 'فاتورة', en: 'Invoice' },
    saleInvoice: { ar: 'فاتورة بيع', en: 'Sale Invoice' },

    // Storage location
    remnantStorage: { ar: 'بواقي', en: 'Remnants' },
    remnantFrom: { ar: 'بقية من', en: 'Remnant from' },
  },

  // Customers
  customers: {
    title: { ar: 'إدارة الزبائن', en: 'Customer Management' },
    subtitle: { ar: 'إدارة بيانات الزبائن والحسابات الجارية', en: 'Manage customer data and current accounts' },
    newCustomer: { ar: 'إضافة زبون جديد', en: 'Add New Customer' },
    customerName: { ar: 'اسم الزبون', en: 'Customer Name' },
    companyName: { ar: 'اسم الشركة', en: 'Company Name' },
    phone: { ar: 'الهاتف', en: 'Phone' },
    phone1: { ar: 'رقم الهاتف الأول', en: 'Phone Number 1' },
    phone2: { ar: 'رقم الهاتف الثاني', en: 'Phone Number 2' },
    email: { ar: 'البريد الإلكتروني', en: 'Email' },
    address: { ar: 'العنوان', en: 'Address' },
    taxNumber: { ar: 'الرقم الضريبي', en: 'Tax Number' },
    balance: { ar: 'الرصيد', en: 'Balance' },
    currentBalance: { ar: 'الرصيد الحالي:', en: 'Current Balance:' },
    totalPurchases: { ar: 'إجمالي المشتريات', en: 'Total Purchases' },
    lastPurchase: { ar: 'آخر عملية شراء', en: 'Last Purchase' },
    customersList: { ar: 'قائمة الزبائن', en: 'Customers List' },
    accountsSummary: { ar: 'ملخص الحسابات', en: 'Accounts Summary' },
    searchPlaceholder: { ar: 'بحث بالاسم، الشركة، أو الهاتف...', en: 'Search by name, company, or phone...' },
    noCustomers: { ar: 'لا يوجد زبائن', en: 'No customers' },
    company: { ar: 'الشركة', en: 'Company' },
    createdBy: { ar: 'أضيف بواسطة', en: 'Created By' },

    // Form labels
    editCustomer: { ar: 'تعديل بيانات الزبون', en: 'Edit Customer Data' },
    enterRequiredData: { ar: 'أدخل البيانات المطلوبة أدناه', en: 'Enter required data below' },
    update: { ar: 'تحديث', en: 'Update' },
    optionalCompany: { ar: 'اختياري - للشركات فقط', en: 'Optional - for companies only' },
    optionalPhone: { ar: 'اختياري', en: 'Optional' },
    optionalTaxNumber: { ar: 'اختياري - للشركات المسجلة', en: 'Optional - for registered companies' },

    // Actions
    statement: { ar: 'كشف حساب', en: 'Statement' },
    settle: { ar: 'تسديد', en: 'Settle' },
    settlePayment: { ar: 'تسديد دفعة', en: 'Settle Payment' },

    // Payment dialog
    newPayment: { ar: 'تسجيل دفعة جديدة', en: 'Register New Payment' },
    forCustomer: { ar: 'للزبون:', en: 'For Customer:' },
    registerPayment: { ar: 'تسجيل الدفعة', en: 'Register Payment' },
    amountPaid: { ar: 'المبلغ المدفوع', en: 'Amount Paid' },
    paymentDate: { ar: 'تاريخ الدفع', en: 'Payment Date' },
    paymentMethod: { ar: 'طريقة الدفع', en: 'Payment Method' },

    // Statement dialog
    statementTitle: { ar: 'كشف حساب -', en: 'Statement -' },
    fromDate: { ar: 'من تاريخ', en: 'From Date' },
    toDate: { ar: 'إلى تاريخ', en: 'To Date' },
    applyFilter: { ar: 'تطبيق الفلتر', en: 'Apply Filter' },
    transactionType: { ar: 'النوع', en: 'Type' },
    transaction: { ar: 'المعاملة', en: 'Transaction' },
    noTransactions: { ar: 'لا توجد حركات', en: 'No transactions' },
    sale: { ar: 'مبيعات', en: 'Sale' },
    payment: { ar: 'دفعة', en: 'Payment' },
    invoice: { ar: 'فاتورة', en: 'Invoice' },
    balanceAfter: { ar: 'الرصيد', en: 'Balance' },
    viewInvoiceDetails: { ar: 'عرض تفاصيل الفاتورة', en: 'View Invoice Details' },

    // Invoice dialog
    invoiceDetails: { ar: 'تفاصيل الفاتورة', en: 'Invoice Details' },
    paid: { ar: 'مدفوعة', en: 'Paid' },
    partial: { ar: 'جزئية', en: 'Partial' },
    unpaid: { ar: 'غير مدفوعة', en: 'Unpaid' },
    customer: { ar: 'الزبون:', en: 'Customer:' },
    unspecified: { ar: 'غير محدد', en: 'Unspecified' },
    items: { ar: 'الأصناف:', en: 'Items:' },
    itemType: { ar: 'النوع', en: 'Type' },
    description: { ar: 'الوصف', en: 'Description' },
    quantitySold: { ar: 'الكمية', en: 'Quantity' },
    unitPrice: { ar: 'السعر', en: 'Price' },
    totalPrice: { ar: 'الإجمالي', en: 'Total' },
    material: { ar: 'معدن', en: 'Material' },
    service: { ar: 'خدمة', en: 'Service' },
    subtotal: { ar: 'المجموع الفرعي:', en: 'Subtotal:' },
    discount: { ar: 'الخصم:', en: 'Discount:' },
    tax: { ar: 'الضريبة:', en: 'Tax:' },
    grandTotal: { ar: 'الإجمالي:', en: 'Total:' },
    totalPaid: { ar: 'المدفوع:', en: 'Paid:' },
    remaining: { ar: 'المتبقي:', en: 'Remaining:' },
    notesLabel: { ar: 'ملاحظات:', en: 'Notes:' },

    // Validation messages
    nameRequired: { ar: 'اسم الزبون مطلوب', en: 'Customer name is required' },
    phone1Required: { ar: 'رقم الهاتف الأول مطلوب', en: 'First phone number is required' },
    invalidEmail: { ar: 'البريد الإلكتروني غير صحيح', en: 'Invalid email address' },
    amountGreaterThanZero: { ar: 'المبلغ يجب أن يكون أكبر من صفر', en: 'Amount must be greater than zero' },
    paymentDateRequired: { ar: 'تاريخ الدفع مطلوب', en: 'Payment date is required' },

    // Success messages
    customerSaved: { ar: '✓ تم حفظ الزبون بنجاح', en: '✓ Customer saved successfully' },
    customerUpdated: { ar: '✓ تم تحديث بيانات الزبون', en: '✓ Customer data updated' },
    paymentRegistered: { ar: '✓ تم تسجيل الدفعة بنجاح. الرصيد الجديد:', en: '✓ Payment registered successfully. New balance:' },

    // Error messages
    saveFailed: { ar: 'فشل الحفظ:', en: 'Save failed:' },
    errorOccurred: { ar: 'حدث خطأ:', en: 'An error occurred:' },
    paymentFailed: { ar: 'فشل تسجيل الدفعة:', en: 'Payment registration failed:' },
    invoiceNotFound: { ar: 'لم يتم العثور على الفاتورة', en: 'Invoice not found' },

    // Payment confirmation
    paymentConfirmation: { ar: 'سيتم تسجيل دفعة بمبلغ', en: 'A payment of amount' },
  },

  // Suppliers
  suppliers: {
    title: { ar: 'الموردين', en: 'Suppliers' },
    management: { ar: 'إدارة الموردين', en: 'Suppliers Management' },
    subtitle: { ar: 'إدارة بيانات الموردين والحسابات الجارية', en: 'Manage supplier information and current accounts' },
    newSupplier: { ar: 'مورد جديد', en: 'New Supplier' },
    supplierName: { ar: 'اسم المورد', en: 'Supplier Name' },
    companyName: { ar: 'اسم الشركة', en: 'Company Name' },
    companyNameHelper: { ar: 'اختياري - للشركات فقط', en: 'Optional - for companies only' },
    contactPerson: { ar: 'الشخص المسؤول', en: 'Contact Person' },
    phone: { ar: 'الهاتف', en: 'Phone' },
    phone1: { ar: 'رقم الهاتف الأول', en: 'Phone Number 1' },
    phone2: { ar: 'رقم الهاتف الثاني', en: 'Phone Number 2' },
    phone2Helper: { ar: 'اختياري', en: 'Optional' },
    email: { ar: 'البريد الإلكتروني', en: 'Email' },
    address: { ar: 'العنوان', en: 'Address' },
    taxNumber: { ar: 'الرقم الضريبي', en: 'Tax Number' },
    taxNumberHelper: { ar: 'اختياري - للشركات المسجلة', en: 'Optional - for registered companies' },
    balance: { ar: 'الرصيد', en: 'Balance' },
    currentBalance: { ar: 'الرصيد الحالي', en: 'Current Balance' },
    totalPurchases: { ar: 'إجمالي المشتريات', en: 'Total Purchases' },
    lastPurchase: { ar: 'آخر عملية شراء', en: 'Last Purchase' },
    company: { ar: 'الشركة', en: 'Company' },
    addedBy: { ar: 'أضيف بواسطة', en: 'Added By' },

    // Tabs
    suppliersList: { ar: 'قائمة الموردين', en: 'Suppliers List' },
    accountsSummary: { ar: 'ملخص الحسابات', en: 'Accounts Summary' },

    // Search
    searchPlaceholder: { ar: 'ابحث بالاسم، الهاتف، الشركة...', en: 'Search by name, phone, company...' },

    // Actions
    viewStatement: { ar: 'كشف حساب', en: 'View Statement' },
    makePayment: { ar: 'تسديد دفعة', en: 'Make Payment' },
    settle: { ar: 'تسديد', en: 'Settle' },

    // Dialog titles
    addSupplier: { ar: 'إضافة مورد جديد', en: 'Add New Supplier' },
    editSupplier: { ar: 'تعديل بيانات المورد', en: 'Edit Supplier Information' },
    enterDetails: { ar: 'أدخل البيانات المطلوبة أدناه', en: 'Enter required details below' },
    update: { ar: 'تحديث', en: 'Update' },

    // Payment Dialog
    newPaymentTitle: { ar: 'تسجيل دفعة جديدة', en: 'Record New Payment' },
    forSupplier: { ar: 'للمورد', en: 'For Supplier' },
    recordPayment: { ar: 'تسجيل الدفعة', en: 'Record Payment' },
    paidAmount: { ar: 'المبلغ المدفوع', en: 'Paid Amount' },
    paymentDate: { ar: 'تاريخ الدفع', en: 'Payment Date' },
    paymentMethod: { ar: 'طريقة الدفع', en: 'Payment Method' },
    currentBalanceHelper: { ar: 'الرصيد الحالي', en: 'Current balance' },

    // Statement Dialog
    statementTitle: { ar: 'كشف حساب', en: 'Account Statement' },
    fromDate: { ar: 'من تاريخ', en: 'From Date' },
    toDate: { ar: 'إلى تاريخ', en: 'To Date' },
    applyFilter: { ar: 'تطبيق الفلتر', en: 'Apply Filter' },
    transactionDate: { ar: 'التاريخ', en: 'Date' },
    transactionType: { ar: 'النوع', en: 'Type' },
    transactionNotes: { ar: 'الملاحظات', en: 'Notes' },
    transactionAmount: { ar: 'المبلغ', en: 'Amount' },
    balanceAfter: { ar: 'الرصيد', en: 'Balance' },
    noTransactions: { ar: 'لا توجد حركات', en: 'No transactions' },
    purchase: { ar: 'مشتريات', en: 'Purchase' },
    payment: { ar: 'دفعة', en: 'Payment' },
    viewBatchDetails: { ar: 'عرض تفاصيل الدفعة', en: 'View Batch Details' },

    // Batch Dialog
    batchDetails: { ar: 'تفاصيل الدفعة', en: 'Batch Details' },
    sheet: { ar: 'الصفيحة', en: 'Sheet' },
    notSpecified: { ar: 'غير محدد', en: 'Not Specified' },
    receivedDate: { ar: 'التاريخ', en: 'Date' },
    originalQuantity: { ar: 'الكمية الأصلية', en: 'Original Quantity' },
    remaining: { ar: 'المتبقي', en: 'Remaining' },
    pricePerKg: { ar: 'السعر/كغ', en: 'Price/kg' },
    totalCost: { ar: 'التكلفة الكلية', en: 'Total Cost' },
    storageLocation: { ar: 'موقع التخزين', en: 'Storage Location' },

    // Messages
    loadFailed: { ar: 'فشل تحميل الموردين', en: 'Failed to load suppliers' },
    addedSuccess: { ar: '✓ تم إضافة المورد بنجاح', en: '✓ Supplier added successfully' },
    updatedSuccess: { ar: '✓ تم تحديث المورد بنجاح', en: '✓ Supplier updated successfully' },
    saveFailed: { ar: 'فشل الحفظ', en: 'Save failed' },
    errorOccurred: { ar: 'حدث خطأ', en: 'Error occurred' },
    paymentRecordedSuccess: { ar: '✓ تم تسجيل الدفعة بنجاح. الرصيد الجديد', en: '✓ Payment recorded successfully. New balance' },
    paymentFailed: { ar: 'فشل تسجيل الدفعة', en: 'Failed to record payment' },
    batchNotFound: { ar: 'لم يتم العثور على الدفعة', en: 'Batch not found' },
    paymentWillBeRecorded: { ar: 'سيتم تسجيل دفعة بمبلغ', en: 'A payment will be recorded for amount' },

    // Validation
    nameRequired: { ar: 'اسم المورد مطلوب', en: 'Supplier name is required' },
    phone1Required: { ar: 'رقم الهاتف الأول مطلوب', en: 'First phone number is required' },
    invalidEmail: { ar: 'البريد الإلكتروني غير صحيح', en: 'Invalid email address' },
    amountMustBePositive: { ar: 'المبلغ يجب أن يكون أكبر من صفر', en: 'Amount must be greater than zero' },
    paymentDateRequired: { ar: 'تاريخ الدفع مطلوب', en: 'Payment date is required' },
  },

  // Inventory
  inventory: {
    title: { ar: 'المخزون', en: 'Inventory' },
    management: { ar: 'إدارة المخزون', en: 'Inventory Management' },
    subtitle: { ar: 'إدارة الصفائح المعدنية والدفعات', en: 'Manage metal sheets and batches' },
    newItem: { ar: 'صنف جديد', en: 'New Item' },
    metalType: { ar: 'نوع المعدن', en: 'Metal Type' },
    grade: { ar: 'الدرجة', en: 'Grade' },
    finish: { ar: 'التشطيب', en: 'Finish' },
    thickness: { ar: 'السماكة', en: 'Thickness' },
    width: { ar: 'العرض', en: 'Width' },
    length: { ar: 'الطول', en: 'Length' },
    weight: { ar: 'الوزن', en: 'Weight' },
    quantity: { ar: 'الكمية', en: 'Quantity' },
    unitPrice: { ar: 'سعر الوحدة', en: 'Unit Price' },
    totalValue: { ar: 'القيمة الإجمالية', en: 'Total Value' },
    location: { ar: 'الموقع', en: 'Location' },
    batch: { ar: 'الدفعة', en: 'Batch' },
    batchNumber: { ar: 'رقم الدفعة', en: 'Batch Number' },
    supplier: { ar: 'المورد', en: 'Supplier' },
    purchaseDate: { ar: 'تاريخ الشراء', en: 'Purchase Date' },
    expiryDate: { ar: 'تاريخ الانتهاء', en: 'Expiry Date' },
    minStock: { ar: 'الحد الأدنى للمخزون', en: 'Minimum Stock' },
    maxStock: { ar: 'الحد الأقصى للمخزون', en: 'Maximum Stock' },
    reorderLevel: { ar: 'مستوى إعادة الطلب', en: 'Reorder Level' },
    inStock: { ar: 'متوفر', en: 'In Stock' },
    outOfStock: { ar: 'غير متوفر', en: 'Out of Stock' },
    lowStock: { ar: 'مخزون منخفض', en: 'Low Stock' },
    sheets: { ar: 'الصفائح', en: 'Sheets' },
    remnants: { ar: 'البقايا', en: 'Remnants' },
    isRemnant: { ar: 'بقايا', en: 'Remnant' },
    parentSheet: { ar: 'الصفيحة الأصلية', en: 'Parent Sheet' },

    // Tab labels
    fullSheets: { ar: 'الصفائح الكاملة', en: 'Full Sheets' },
    remnantsTab: { ar: 'البواقي', en: 'Remnants' },

    // Search & Filter
    searchPlaceholder: { ar: 'بحث بالكود أو نوع المعدن...', en: 'Search by code or metal type...' },
    advancedFilters: { ar: 'فلاتر متقدمة', en: 'Advanced Filters' },
    resetFilters: { ar: 'إعادة ضبط', en: 'Reset' },
    all: { ar: 'الكل', en: 'All' },

    // Filter labels
    minThickness: { ar: 'أدنى سماكة (مم)', en: 'Min Thickness (mm)' },
    maxThickness: { ar: 'أقصى سماكة (مم)', en: 'Max Thickness (mm)' },
    minQuantity: { ar: 'أدنى كمية', en: 'Min Quantity' },
    maxQuantity: { ar: 'أقصى كمية', en: 'Max Quantity' },
    parentSheetFilter: { ar: 'الصفيحة الأم', en: 'Parent Sheet' },

    // Buttons
    addNewSheet: { ar: 'إضافة صفيحة جديدة', en: 'Add New Sheet' },
    addNewRemnant: { ar: 'إضافة بقية جديدة', en: 'Add New Remnant' },

    // Table headers
    code: { ar: 'الكود', en: 'Code' },
    type: { ar: 'النوع', en: 'Type' },
    dimensions: { ar: 'الأبعاد (مم)', en: 'Dimensions (mm)' },
    thicknessMm: { ar: 'السماكة', en: 'Thickness' },
    weightPerSheet: { ar: 'الوزن/ورقة', en: 'Weight/Sheet' },
    pricePerKg: { ar: 'السعر/كغ', en: 'Price/kg' },
    actions: { ar: 'الإجراءات', en: 'Actions' },

    // Messages
    noFullSheets: { ar: 'لا توجد صفائح كاملة', en: 'No full sheets' },
    noRemnants: { ar: 'لا توجد بواقي', en: 'No remnants' },
    viewBatches: { ar: 'عرض الدفعات / إضافة دفعة', en: 'View Batches / Add Batch' },
    mm: { ar: 'مم', en: 'mm' },
    kg: { ar: 'كغ', en: 'kg' },

    // Dialog titles
    addSheet: { ar: 'إضافة صفيحة جديدة', en: 'Add New Sheet' },
    addRemnant: { ar: 'إضافة بقية جديدة', en: 'Add New Remnant' },
    batchesFor: { ar: 'دفعات', en: 'Batches for' },
    addBatch: { ar: 'إضافة دفعة', en: 'Add Batch' },
    batchDetails: { ar: 'تفاصيل الدفعة', en: 'Batch Details' },
    editBatch: { ar: 'تعديل الدفعة', en: 'Edit Batch' },

    // Form labels - Sheet info
    sheetCode: { ar: 'كود الصفيحة', en: 'Sheet Code' },
    autoGenerate: { ar: 'توليد تلقائي', en: 'Auto Generate' },
    manualEntry: { ar: 'إدخال يدوي', en: 'Manual Entry' },
    lengthMm: { ar: 'الطول (مم)', en: 'Length (mm)' },
    widthMm: { ar: 'العرض (مم)', en: 'Width (mm)' },
    thicknessRequired: { ar: 'السماكة (مم)', en: 'Thickness (mm)' },
    weightPerSheetKg: { ar: 'الوزن لكل ورقة (كغ)', en: 'Weight per Sheet (kg)' },
    optional: { ar: 'اختياري', en: 'Optional' },

    // Form labels - Batch info
    batchInfo: { ar: 'معلومات الدفعة', en: 'Batch Information' },
    selectSupplier: { ar: '-- اختر المورد --', en: '-- Select Supplier --' },
    quantitySheets: { ar: 'الكمية (صفائح)', en: 'Quantity (sheets)' },
    quantityPieces: { ar: 'الكمية (قطع)', en: 'Quantity (pieces)' },

    // Pricing section
    pricingInfo: { ar: 'معلومات التسعير', en: 'Pricing Information' },
    pricingMode: { ar: 'طريقة التسعير', en: 'Pricing Mode' },
    perKg: { ar: 'حسب الكيلو', en: 'Per Kilogram' },
    perBatch: { ar: 'حسب الدفعة', en: 'Per Batch' },
    pricePerKgLabel: { ar: 'السعر لكل كيلو', en: 'Price per Kilogram' },
    totalCost: { ar: 'التكلفة الإجمالية', en: 'Total Cost' },

    // Weight section
    weightInfo: { ar: 'معلومات الوزن', en: 'Weight Information' },
    weightInputMode: { ar: 'طريقة إدخال الوزن', en: 'Weight Input Mode' },
    weightPerSheetInput: { ar: 'وزن الورقة', en: 'Weight per Sheet' },
    totalWeightInput: { ar: 'الوزن الإجمالي', en: 'Total Weight' },
    weightPerSheetKgLabel: { ar: 'وزن الورقة الواحدة (كغ)', en: 'Weight per Sheet (kg)' },
    totalWeightKg: { ar: 'الوزن الإجمالي (كغ)', en: 'Total Weight (kg)' },
    batchWeightKg: { ar: 'وزن الدفعة (كغ)', en: 'Batch Weight (kg)' },
    calculatedAutomatically: { ar: 'يحسب تلقائياً', en: 'Calculated automatically' },

    // Storage & dates
    storageLocation: { ar: 'موقع التخزين', en: 'Storage Location' },
    receivedDate: { ar: 'تاريخ الاستلام', en: 'Received Date' },
    notes: { ar: 'ملاحظات', en: 'Notes' },

    // Payment section
    paymentInfo: { ar: 'معلومات الدفع', en: 'Payment Information' },
    paymentType: { ar: 'نوع الدفع', en: 'Payment Type' },
    payLater: { ar: 'دفع آجل', en: 'Pay Later' },
    fullPayment: { ar: 'دفع كامل', en: 'Full Payment' },
    partialPayment: { ar: 'دفع جزئي', en: 'Partial Payment' },
    paymentAmount: { ar: 'مبلغ الدفعة', en: 'Payment Amount' },
    paymentMethod: { ar: 'طريقة الدفع', en: 'Payment Method' },
    paymentNotes: { ar: 'ملاحظات الدفع', en: 'Payment Notes' },

    // Remnant specific
    pieceSource: { ar: 'مصدر القطعة', en: 'Piece Source' },
    companyStock: { ar: 'مخزون الشركة', en: 'Company Stock' },
    fromSheetCutting: { ar: 'من قص صفيحة', en: 'From Sheet Cutting' },
    selectParentSheet: { ar: '-- اختر الصفيحة الأم --', en: '-- Select Parent Sheet --' },

    // Summary section
    costSummary: { ar: 'ملخص التكلفة', en: 'Cost Summary' },
    calculatedWeight: { ar: 'الوزن المحسوب', en: 'Calculated Weight' },
    calculatedCost: { ar: 'التكلفة المحسوبة', en: 'Calculated Cost' },
    calculatedPricePerKg: { ar: 'السعر المحسوب للكيلو', en: 'Calculated Price/kg' },

    // Batch table headers
    batchId: { ar: 'رقم', en: '#' },
    originalQuantity: { ar: 'الكمية الأصلية', en: 'Original Quantity' },
    remaining: { ar: 'المتبقي', en: 'Remaining' },
    cost: { ar: 'التكلفة', en: 'Cost' },
    storage: { ar: 'التخزين', en: 'Storage' },
    date: { ar: 'التاريخ', en: 'Date' },

    // Batch details
    supplierLabel: { ar: 'المورد:', en: 'Supplier:' },
    notSpecified: { ar: 'غير محدد', en: 'Not Specified' },
    receivedDateLabel: { ar: 'تاريخ الاستلام:', en: 'Received Date:' },
    originalQuantityLabel: { ar: 'الكمية الأصلية:', en: 'Original Quantity:' },
    remainingLabel: { ar: 'المتبقي:', en: 'Remaining:' },
    pricePerKgLabel2: { ar: 'السعر/كغ:', en: 'Price/kg:' },
    totalCostLabel: { ar: 'التكلفة الكلية:', en: 'Total Cost:' },
    storageLocationLabel: { ar: 'موقع التخزين:', en: 'Storage Location:' },
    notesLabel: { ar: 'ملاحظات:', en: 'Notes:' },
    noNotes: { ar: 'لا توجد ملاحظات', en: 'No notes' },
    addedBy: { ar: 'أضيفت بواسطة:', en: 'Added by:' },
    lastEditedBy: { ar: 'آخر تعديل بواسطة:', en: 'Last edited by:' },

    // Validation messages
    codeRequired: { ar: 'الكود مطلوب', en: 'Code is required' },
    metalTypeRequired: { ar: 'نوع المعدن مطلوب', en: 'Metal type is required' },
    lengthRequired: { ar: 'الطول مطلوب ويجب أن يكون أكبر من صفر', en: 'Length is required and must be greater than zero' },
    widthRequired: { ar: 'العرض مطلوب ويجب أن يكون أكبر من صفر', en: 'Width is required and must be greater than zero' },
    thicknessRequiredMsg: { ar: 'السماكة مطلوبة ويجب أن تكون أكبر من صفر', en: 'Thickness is required and must be greater than zero' },
    supplierRequired: { ar: 'المورد مطلوب', en: 'Supplier is required' },
    quantityRequired: { ar: 'الكمية مطلوبة ويجب أن تكون أكبر من صفر', en: 'Quantity is required and must be greater than zero' },
    weightRequired: { ar: 'يجب إدخال الوزن (لكل قطعة أو الإجمالي)', en: 'Weight is required (per piece or total)' },
    parentSheetRequired: { ar: 'يجب اختيار الصفيحة الأم عند اختيار "من قص صفيحة"', en: 'Parent sheet must be selected when choosing "From Sheet Cutting"' },
    quantityOriginalRequired: { ar: 'الكمية الأصلية مطلوبة ويجب أن تكون أكبر من صفر', en: 'Original quantity is required and must be greater than zero' },
    batchWeightRequired: { ar: 'الوزن لكل قطعة مطلوب ويجب أن يكون أكبر من صفر', en: 'Weight per piece is required and must be greater than zero' },

    // Success messages
    sheetAdded: { ar: 'تم إضافة الصفيحة والدفعة بنجاح', en: 'Sheet and batch added successfully' },
    batchLinked: { ar: 'تم إضافة الدفعة للصفيحة الموجودة', en: 'Batch added to existing sheet' },
    remnantAdded: { ar: 'تم إضافة البقية والدفعة بنجاح', en: 'Remnant and batch added successfully' },
    remnantLinked: { ar: 'تم إضافة الدفعة للبقية الموجودة', en: 'Batch added to existing remnant' },
    batchAddedSuccess: { ar: 'تمت إضافة الدفعة بنجاح', en: 'Batch added successfully' },
    batchUpdated: { ar: 'تم تحديث الدفعة بنجاح', en: 'Batch updated successfully' },
    batchDeleted: { ar: 'تم حذف الدفعة بنجاح', en: 'Batch deleted successfully' },
    fullPaymentNote: { ar: 'دفعة كاملة للدفعة', en: 'Full payment for batch' },
    partialPaymentNote: { ar: 'دفعة جزئية', en: 'Partial payment' },

    // Error messages
    saveFailed: { ar: 'فشل الحفظ:', en: 'Save failed:' },
    errorOccurred: { ar: 'حدث خطأ:', en: 'Error occurred:' },
    addBatchFailed: { ar: 'فشل إضافة الدفعة:', en: 'Failed to add batch:' },
    updateBatchFailed: { ar: 'فشل تحديث الدفعة:', en: 'Failed to update batch:' },
    deleteBatchFailed: { ar: 'فشل حذف الدفعة:', en: 'Failed to delete batch:' },
    deleteSheetFailed: { ar: 'فشل حذف الصفيحة:', en: 'Failed to delete sheet:' },
    sheetDeletedSuccess: { ar: 'تم حذف الصفيحة بنجاح', en: 'Sheet deleted successfully' },

    // Print
    printBatch: { ar: 'طباعة الدفعة', en: 'Print Batch' },
    exportPDF: { ar: 'تصدير PDF', en: 'Export PDF' },
    batchLabel: { ar: 'دفعة', en: 'Batch' },
    batchDetailsLabel: { ar: 'تفاصيل دفعة', en: 'Batch Details' },

    // Validation errors
    lengthMustBePositive: { ar: 'الطول يجب أن يكون أكبر من صفر', en: 'Length must be greater than zero' },
    widthMustBePositive: { ar: 'العرض يجب أن يكون أكبر من صفر', en: 'Width must be greater than zero' },
    thicknessMustBePositive: { ar: 'السماكة يجب أن تكون أكبر من صفر', en: 'Thickness must be greater than zero' },

    // Helper texts
    selectMetalTypeFirst: { ar: 'اختر نوع المعدن أولاً', en: 'Select metal type first' },
    noGradesAvailable: { ar: 'لا توجد درجات متاحة - اختياري', en: 'No grades available - optional' },
    noFinishesAvailable: { ar: 'لا توجد تشطيبات متاحة - اختياري', en: 'No finishes available - optional' },

    // System fallbacks
    systemOldData: { ar: 'النظام (بيانات قديمة)', en: 'System (old data)' },
    notEditedYet: { ar: 'لم يتم التعديل بعد', en: 'Not edited yet' },

    // Additional UI text
    title: { ar: 'إدارة المخزون', en: 'Inventory Management' },
    mmUnit: { ar: 'مم', en: 'mm' },
    kgUnit: { ar: 'كغ', en: 'kg' },
    dimensionsMm: { ar: 'الأبعاد (مم)', en: 'Dimensions (mm)' },
    minThicknessMm: { ar: 'أدنى سماكة (مم)', en: 'Min Thickness (mm)' },
    maxThicknessMm: { ar: 'أقصى سماكة (مم)', en: 'Max Thickness (mm)' },
    searchByParentCode: { ar: 'ابحث بكود الصفيحة الأم...', en: 'Search by parent code...' },
    autoGenerateCode: { ar: 'توليد الكود تلقائياً', en: 'Auto Generate Code' },
    autoCodeHelper: { ar: 'سيتم توليد الكود تلقائياً بناءً على المواصفات', en: 'Code will be auto-generated based on specifications' },
    autoCodeHelperRemnant: { ar: 'سيتم توليد الكود تلقائياً (R...)', en: 'Code will be auto-generated (R...)' },
    selectType: { ar: '-- اختر النوع --', en: '-- Select Type --' },
    noGrade: { ar: '-- بدون درجة (xx) --', en: '-- No Grade (xx) --' },
    noGradeSimple: { ar: '-- بدون درجة --', en: '-- No Grade --' },
    noFinish: { ar: '-- بدون تشطيب (xx) --', en: '-- No Finish (xx) --' },
    noFinishSimple: { ar: '-- بدون تشطيب --', en: '-- No Finish --' },
    sheetInformation: { ar: 'معلومات الصفيحة', en: 'Sheet Information' },
    batchInformation: { ar: 'معلومات الدفعة', en: 'Batch Information' },
    remnantInformation: { ar: 'معلومات البقية', en: 'Remnant Information' },
    enterSheetAndBatchInfo: { ar: 'أدخل معلومات الصفيحة والدفعة الأولى', en: 'Enter sheet and first batch information' },
    enterRemnantAndBatchInfo: { ar: 'أدخل معلومات البقية والدفعة الأولى', en: 'Enter remnant and first batch information' },
    pricing: { ar: 'التسعير', en: 'Pricing' },
    pricePerPiece: { ar: 'السعر لكل قطعة:', en: 'Price per Piece:' },
    pricePerKgCalc: { ar: 'السعر لكل كيلو:', en: 'Price per Kilogram:' },
    totalCostCalc: { ar: 'التكلفة الإجمالية:', en: 'Total Cost:' },
    paymentToSupplier: { ar: 'الدفع للمورد', en: 'Payment to Supplier' },
    payLaterOption: { ar: 'الدفع لاحقاً', en: 'Pay Later' },
    amountPaid: { ar: 'المبلغ المدفوع', en: 'Amount Paid' },
    pieceSourceTitle: { ar: 'مصدر القطعة *', en: 'Piece Source *' },
    companyName: { ar: 'الشركة', en: 'Company' },
    selectSheetCut: { ar: 'اختر الصفيحة التي تم قصها', en: 'Select the sheet that was cut' },
    noSupplier: { ar: 'بدون مورد', en: 'No Supplier' },
    batchesTitle: { ar: 'الدفعات -', en: 'Batches -' },
    close: { ar: 'إغلاق', en: 'Close' },
    addBatchToSheet: { ar: 'إضافة دفعة للصفيحة', en: 'Add Batch to Sheet' },
    perKgPricing: { ar: 'بالكيلو (price/kg)', en: 'Per Kg (price/kg)' },
    perBatchPricing: { ar: 'بالدفعة (total cost)', en: 'Per Batch (total cost)' },
    weightPerPieceKg: { ar: 'الوزن لكل قطعة (كغ)', en: 'Weight per Piece (kg)' },
    weightPerPieceHelper: { ar: 'الوزن لكل قطعة واحدة', en: 'Weight per single piece' },
    totalWeightKgLabel: { ar: 'الوزن الإجمالي (كغ)', en: 'Total Weight (kg)' },
    totalWeightHelper: { ar: 'يُحسب تلقائياً: الكمية × الوزن لكل قطعة', en: 'Calculated automatically: quantity × weight per piece' },
    payLaterMenuItem: { ar: 'الدفع لاحقاً', en: 'Pay Later' },
    weightUsedCalc: { ar: 'الوزن المُستخدم للحساب:', en: 'Weight used for calculation:' },
    notSpecifiedWeight: { ar: 'غير مُحدد', en: 'Not specified' },
    expectedCost: { ar: 'التكلفة المتوقعة:', en: 'Expected cost:' },
    expectedPricePerKg: { ar: 'السعر/كغ المتوقع:', en: 'Expected price/kg:' },
    addBatch: { ar: 'إضافة الدفعة', en: 'Add Batch' },
    availableBatches: { ar: 'الدفعات المتاحة', en: 'Available Batches' },
    deleteSheet: { ar: 'حذف الصفيحة', en: 'Delete Sheet' },
    noBatchesAvailable: { ar: 'لا توجد دفعات متاحة', en: 'No batches available' },
    supplierHeader: { ar: 'المورد', en: 'Supplier' },
    viewDetails: { ar: 'عرض التفاصيل', en: 'View Details' },
    saveChanges: { ar: 'حفظ التعديلات', en: 'Save Changes' },
    remainingQuantity: { ar: 'الكمية المتبقية', en: 'Remaining Quantity' },
    edit: { ar: 'تعديل', en: 'Edit' },
    deleteAction: { ar: 'حذف', en: 'Delete' },
    originalQuantityNote: { ar: 'تحديث الكمية الأصلية لن يؤثر على الكمية المتبقية. الكمية المتبقية تتغير فقط من خلال المبيعات.', en: 'Updating original quantity will not affect remaining quantity. Remaining quantity changes only through sales.' },
    printBatchConfirmTitle: { ar: 'تأكيد طباعة تفاصيل الدفعة', en: 'Confirm Print Batch Details' },
    batchDocument: { ar: 'الدفعة', en: 'Batch' },
    batchForCode: { ar: 'دفعة', en: 'Batch for' },
    remnantAddedToExisting: { ar: 'الدفعة للبقية الموجودة', en: 'batch added to existing remnant' },
    remnantAndBatchAdded: { ar: 'البقية والدفعة', en: 'remnant and batch' },
    sheetAddedToExisting: { ar: 'إضافة الدفعة للصفيحة الموجودة', en: 'Batch added to existing sheet' },
    sheetAndBatchAdded: { ar: 'إضافة الصفيحة والدفعة', en: 'Sheet and batch added' },
    successPrefix: { ar: 'تم', en: 'Successfully' },
    successSuffix: { ar: 'بنجاح', en: 'completed' },
    addedSuccessfully: { ar: '✓ تم إضافة', en: '✓ Successfully added' },
  },

  // Expenses
  expenses: {
    title: { ar: 'المصروفات', en: 'Expenses' },
    management: { ar: 'إدارة المصروفات', en: 'Expenses Management' },
    subtitle: { ar: 'تسجيل وإدارة مصروفات الشركة', en: 'Record and manage company expenses' },
    newExpense: { ar: 'مصروف جديد', en: 'New Expense' },
    addExpense: { ar: 'إضافة مصروف', en: 'Add Expense' },
    editExpense: { ar: 'تعديل مصروف', en: 'Edit Expense' },
    addNewExpense: { ar: 'إضافة مصروف جديد', en: 'Add New Expense' },
    expenseType: { ar: 'نوع المصروف', en: 'Expense Type' },
    amount: { ar: 'المبلغ', en: 'Amount' },
    date: { ar: 'التاريخ', en: 'Date' },
    category: { ar: 'الفئة', en: 'Category' },
    categories: { ar: 'الفئات', en: 'Categories' },
    description: { ar: 'الوصف', en: 'Description' },
    paymentMethod: { ar: 'طريقة الدفع', en: 'Payment Method' },
    reference: { ar: 'المرجع', en: 'Reference' },
    receipt: { ar: 'الإيصال', en: 'Receipt' },
    supplier: { ar: 'المورد', en: 'Supplier' },
    expenseDate: { ar: 'تاريخ المصروف', en: 'Expense Date' },
    notes: { ar: 'ملاحظات', en: 'Notes' },
    totalExpenses: { ar: 'إجمالي المصروفات', en: 'Total Expenses' },
    noExpenses: { ar: 'لا توجد مصروفات', en: 'No expenses' },
    addedBy: { ar: 'أضيفت بواسطة', en: 'Added By' },

    // Category management
    addCategory: { ar: 'إضافة فئة جديدة', en: 'Add New Category' },
    editCategory: { ar: 'تعديل فئة', en: 'Edit Category' },
    categoryNameAr: { ar: 'اسم الفئة (عربي)', en: 'Category Name (Arabic)' },
    categoryNameEn: { ar: 'اسم الفئة (إنجليزي)', en: 'Category Name (English)' },
    selectCategory: { ar: '-- اختر الفئة --', en: '-- Select Category --' },

    // Validation messages
    categoryRequired: { ar: 'الفئة مطلوبة', en: 'Category is required' },
    amountGreaterThanZero: { ar: 'المبلغ يجب أن يكون أكبر من صفر', en: 'Amount must be greater than zero' },
    descriptionRequired: { ar: 'الوصف مطلوب', en: 'Description is required' },
    expenseDateRequired: { ar: 'تاريخ المصروف مطلوب', en: 'Expense date is required' },
    categoryNameArRequired: { ar: 'اسم الفئة بالعربي مطلوب', en: 'Category name in Arabic is required' },

    // Success messages
    expenseAdded: { ar: 'تم إضافة المصروف بنجاح', en: 'Expense added successfully' },
    expenseUpdated: { ar: 'تم تحديث المصروف بنجاح', en: 'Expense updated successfully' },
    expenseDeleted: { ar: 'تم حذف المصروف بنجاح', en: 'Expense deleted successfully' },
    categoryAdded: { ar: 'تم إضافة الفئة بنجاح', en: 'Category added successfully' },
    categoryUpdated: { ar: 'تم تحديث الفئة بنجاح', en: 'Category updated successfully' },

    // Error messages
    saveFailed: { ar: 'فشل الحفظ: ', en: 'Save failed: ' },
    deleteFailed: { ar: 'فشل الحذف: ', en: 'Delete failed: ' },
    errorOccurred: { ar: 'حدث خطأ: ', en: 'Error occurred: ' },

    // Filter
    fromDate: { ar: 'من تاريخ', en: 'From Date' },
    toDate: { ar: 'إلى تاريخ', en: 'To Date' },
    applyFilter: { ar: 'تطبيق الفلتر', en: 'Apply Filter' },
    from: { ar: 'من', en: 'from' },
    to: { ar: 'إلى', en: 'to' },

    // Dialog
    enterRequiredData: { ar: 'أدخل البيانات المطلوبة أدناه', en: 'Enter required data below' },
    state: { ar: 'الحالة:', en: 'State:' },
  },

  // Payments
  payments: {
    title: { ar: 'إدارة الدفعات', en: 'Payments Management' },
    subtitle: { ar: 'تسجيل ومتابعة دفعات الزبائن والموردين', en: 'Record and track customer and supplier payments' },
    newPayment: { ar: 'دفعة جديدة', en: 'New Payment' },
    registerPayment: { ar: 'تسجيل دفعة', en: 'Register Payment' },
    paymentType: { ar: 'نوع الدفعة', en: 'Payment Type' },
    incoming: { ar: 'وارد', en: 'Incoming' },
    outgoing: { ar: 'صادر', en: 'Outgoing' },
    amount: { ar: 'المبلغ', en: 'Amount' },
    paidAmount: { ar: 'المبلغ المدفوع', en: 'Amount Paid' },
    date: { ar: 'التاريخ', en: 'Date' },
    paymentDate: { ar: 'تاريخ الدفع', en: 'Payment Date' },
    paymentMethod: { ar: 'طريقة الدفع', en: 'Payment Method' },
    reference: { ar: 'المرجع', en: 'Reference' },
    customer: { ar: 'الزبون', en: 'Customer' },
    supplier: { ar: 'المورد', en: 'Supplier' },
    invoice: { ar: 'الفاتورة', en: 'Invoice' },
    status: { ar: 'الحالة', en: 'Status' },
    completed: { ar: 'مكتمل', en: 'Completed' },
    pending: { ar: 'قيد الانتظار', en: 'Pending' },
    cancelled: { ar: 'ملغي', en: 'Cancelled' },

    // Stats
    totalPayments: { ar: 'إجمالي الدفعات', en: 'Total Payments' },
    paymentsCount: { ar: 'عدد الدفعات', en: 'Payments Count' },
    todayPayments: { ar: 'دفعات اليوم', en: "Today's Payments" },
    todayPaymentsCount: { ar: 'عدد دفعات اليوم', en: "Today's Payments Count" },

    // Tabs
    customerPayments: { ar: 'دفعات الزبائن', en: 'Customer Payments' },
    supplierPayments: { ar: 'دفعات الموردين', en: 'Supplier Payments' },

    // Filters
    all: { ar: 'الكل', en: 'All' },
    fromDate: { ar: 'من تاريخ', en: 'From Date' },
    toDate: { ar: 'إلى تاريخ', en: 'To Date' },
    clearFilters: { ar: 'مسح الفلاتر', en: 'Clear Filters' },

    // Table headers
    person: { ar: 'الشخص', en: 'Person' },
    notes: { ar: 'الملاحظات', en: 'Notes' },
    balanceAfter: { ar: 'الرصيد بعد الدفعة', en: 'Balance After Payment' },

    // Form dialog
    registerCustomerPayment: { ar: 'تسجيل دفعة زبون', en: 'Register Customer Payment' },
    registerSupplierPayment: { ar: 'تسجيل دفعة مورد', en: 'Register Supplier Payment' },
    enterPaymentData: { ar: 'أدخل بيانات الدفعة', en: 'Enter payment data' },
    submitPayment: { ar: 'تسجيل الدفعة', en: 'Submit Payment' },

    // Currency
    syrianPound: { ar: 'ليرة سورية', en: 'Syrian Pound' },
    usDollar: { ar: 'دولار أمريكي', en: 'US Dollar' },
    currency: { ar: 'العملة', en: 'Currency' },

    // Messages
    noPayments: { ar: 'لا توجد دفعات', en: 'No payments' },
    paymentRegisteredSuccess: { ar: '✓ تم تسجيل الدفعة بنجاح', en: '✓ Payment registered successfully' },
    registrationFailed: { ar: 'فشل التسجيل:', en: 'Registration failed:' },
    errorOccurred: { ar: 'حدث خطأ:', en: 'Error occurred:' },

    // Validation
    selectCustomer: { ar: 'يجب اختيار زبون', en: 'Customer must be selected' },
    selectSupplier: { ar: 'يجب اختيار مورد', en: 'Supplier must be selected' },
    amountRequired: { ar: 'المبلغ يجب أن يكون أكبر من صفر', en: 'Amount must be greater than zero' },
    paymentDateRequired: { ar: 'تاريخ الدفع مطلوب', en: 'Payment date is required' },
    paymentMethodRequired: { ar: 'يجب اختيار طريقة الدفع', en: 'Payment method must be selected' },

    // Confirmation
    confirmPaymentMessage: { ar: 'سيتم تسجيل دفعة بمبلغ', en: 'A payment will be registered for amount' },
  },

  // Reports
  reports: {
    title: { ar: 'التقارير', en: 'Reports' },
    titleFull: { ar: 'التقارير والتحليلات', en: 'Reports & Analytics' },
    subtitle: { ar: 'تقارير شاملة عن المخزون، المبيعات، المشتريات، الخدمات، والأرباح الدقيقة', en: 'Comprehensive reports on inventory, sales, purchases, services, and accurate profits' },

    // Date filters
    fromDate: { ar: 'من تاريخ', en: 'From Date' },
    toDate: { ar: 'إلى تاريخ', en: 'To Date' },
    today: { ar: 'اليوم', en: 'Today' },
    currentMonth: { ar: 'الشهر الحالي', en: 'Current Month' },
    currentYear: { ar: 'السنة الحالية', en: 'Current Year' },
    period: { ar: 'الفترة:', en: 'Period:' },

    // Tab names
    inventoryReport: { ar: 'تقرير المخزون', en: 'Inventory Report' },
    salesReport: { ar: 'تقرير المبيعات', en: 'Sales Report' },
    purchaseReport: { ar: 'تقرير المشتريات', en: 'Purchase Report' },
    servicesAndMaterials: { ar: 'الخدمات والمواد', en: 'Services & Materials' },
    profitReport: { ar: 'تقرير الأرباح', en: 'Profit Report' },
    accountsReport: { ar: 'تقرير الحسابات', en: 'Accounts Report' },
    activitySummary: { ar: 'ملخص النشاط', en: 'Activity Summary' },

    // Inventory Report
    totalItems: { ar: 'إجمالي الأصناف', en: 'Total Items' },
    totalPieces: { ar: 'إجمالي القطع', en: 'Total Pieces' },
    inventoryValue: { ar: 'قيمة المخزون', en: 'Inventory Value' },
    lowStock: { ar: 'مخزون منخفض', en: 'Low Stock' },
    outOfStockItems: { ar: 'يوجد {count} صنف نفذ من المخزون', en: '{count} item(s) out of stock' },
    lowStockItems: { ar: 'يوجد {count} صنف بكمية أقل من 10 قطع', en: '{count} item(s) with quantity less than 10 pieces' },
    topStockedItems: { ar: 'أكثر 10 أصناف مخزوناً', en: 'Top 10 Stocked Items' },
    code: { ar: 'الكود', en: 'Code' },
    type: { ar: 'النوع', en: 'Type' },
    dimensions: { ar: 'الأبعاد (مم)', en: 'Dimensions (mm)' },
    quantity: { ar: 'الكمية', en: 'Quantity' },
    pricePerKgMin: { ar: 'سعر/كغ (أدنى)', en: 'Price/kg (min)' },

    // Sales Report
    totalSales: { ar: 'إجمالي المبيعات', en: 'Total Sales' },
    totalPaid: { ar: 'المدفوع', en: 'Paid' },
    totalRemaining: { ar: 'المتبقي', en: 'Remaining' },
    invoicesCount: { ar: 'عدد الفواتير', en: 'Invoices Count' },
    topCustomers: { ar: 'أفضل 10 زبائن', en: 'Top 10 Customers' },
    customer: { ar: 'الزبون', en: 'Customer' },
    noSales: { ar: 'لا توجد مبيعات', en: 'No sales' },

    // Purchase Report
    totalPurchases: { ar: 'إجمالي المشتريات', en: 'Total Purchases' },
    batchesCount: { ar: 'عدد الدفعات', en: 'Batches Count' },
    totalQuantity: { ar: 'إجمالي الكمية', en: 'Total Quantity' },
    suppliersCount: { ar: 'عدد الموردين', en: 'Suppliers Count' },
    pieces: { ar: 'قطعة', en: 'pieces' },
    filterBySupplier: { ar: 'تصفية حسب المورد', en: 'Filter by Supplier' },
    allSuppliers: { ar: 'جميع الموردين', en: 'All Suppliers' },
    purchasesBySupplier: { ar: 'المشتريات حسب المورد', en: 'Purchases by Supplier' },
    purchasesByMaterial: { ar: 'المشتريات حسب المادة', en: 'Purchases by Material' },
    purchaseDetails: { ar: 'تفاصيل المشتريات', en: 'Purchase Details' },
    supplier: { ar: 'المورد', en: 'Supplier' },
    batches: { ar: 'الدفعات', en: 'Batches' },
    material: { ar: 'المادة', en: 'Material' },
    cost: { ar: 'التكلفة', en: 'Cost' },
    noPurchases: { ar: 'لا توجد مشتريات', en: 'No purchases' },
    date: { ar: 'التاريخ', en: 'Date' },
    remaining: { ar: 'المتبقي', en: 'Remaining' },
    pricePerKg: { ar: 'السعر/كغ', en: 'Price/kg' },

    // Best Selling Report
    topMaterials: { ar: 'أفضل 10 مواد مبيعاً', en: 'Top 10 Selling Materials' },
    topServices: { ar: 'أفضل 10 خدمات مبيعاً', en: 'Top 10 Selling Services' },
    revenue: { ar: 'الإيراد', en: 'Revenue' },
    cogs: { ar: 'التكلفة', en: 'Cost' },
    profit: { ar: 'الربح', en: 'Profit' },
    service: { ar: 'الخدمة', en: 'Service' },
    noData: { ar: 'لا توجد بيانات', en: 'No data' },
    servicesCostNote: { ar: 'ملاحظة: تكلفة الخدمات تُقرأ من تكلفة السطر أو <b>التكلفة الافتراضية</b> في إعدادات نوع الخدمة.', en: 'Note: Service costs are read from the line cost or <b>default cost</b> in service type settings.' },

    // Profit Report
    profitCalculationNote: { ar: 'تم احتساب الأرباح بدقة باستخدام FIFO للمواد وتكلفة فعلية للخدمات.', en: 'Profits calculated accurately using FIFO for materials and actual cost for services.' },
    materialsRevenue: { ar: 'إيراد المواد', en: 'Materials Revenue' },
    materialsCogs: { ar: 'تكلفة المواد (COGS)', en: 'Materials Cost (COGS)' },
    materialsProfit: { ar: 'ربح المواد', en: 'Materials Profit' },
    servicesRevenue: { ar: 'إيراد الخدمات', en: 'Services Revenue' },
    servicesCost: { ar: 'تكلفة الخدمات', en: 'Services Cost' },
    servicesProfit: { ar: 'ربح الخدمات', en: 'Services Profit' },
    totalRevenue: { ar: 'إجمالي الإيرادات', en: 'Total Revenue' },
    totalCost: { ar: 'إجمالي التكلفة', en: 'Total Cost' },
    totalProfit: { ar: 'إجمالي الربح', en: 'Total Profit' },

    // Accounts Report
    customerReceivables: { ar: 'ذمم الزبائن', en: 'Customer Receivables' },
    supplierPayables: { ar: 'ذمم الموردين', en: 'Supplier Payables' },
    netFinancialPosition: { ar: 'صافي المركز المالي', en: 'Net Financial Position' },
    topDebtors: { ar: 'أكبر الزبائن المدينين', en: 'Top Debtors' },
    topCreditors: { ar: 'أكبر الموردين الدائنين', en: 'Top Creditors' },
    balance: { ar: 'الرصيد', en: 'Balance' },
    noDebts: { ar: 'لا توجد ديون', en: 'No debts' },

    // Activity Report
    totalInvoices: { ar: 'عدد الفواتير', en: 'Total Invoices' },
    avgInvoiceValue: { ar: 'متوسط قيمة الفاتورة', en: 'Average Invoice Value' },
    totalInventory: { ar: 'إجمالي المخزون', en: 'Total Inventory' },
    collectionRate: { ar: 'معدل التحصيل', en: 'Collection Rate' },

    // Legacy/Common
    customerReport: { ar: 'تقرير الزبائن', en: 'Customer Report' },
    supplierReport: { ar: 'تقرير الموردين', en: 'Supplier Report' },
    profitLoss: { ar: 'الأرباح والخسائر', en: 'Profit & Loss' },
    cashFlow: { ar: 'التدفق النقدي', en: 'Cash Flow' },
    dateRange: { ar: 'الفترة الزمنية', en: 'Date Range' },
    from: { ar: 'من', en: 'From' },
    to: { ar: 'إلى', en: 'To' },
    generateReport: { ar: 'إنشاء التقرير', en: 'Generate Report' },
  },

  // Settings
  settings: {
    title: { ar: 'الإعدادات', en: 'Settings' },
    subtitle: { ar: 'إدارة معلومات الشركة والإعدادات العامة', en: 'Manage company information and general settings' },
    companySettings: { ar: 'إعدادات الشركة', en: 'Company Settings' },
    companyInfo: { ar: 'معلومات الشركة', en: 'Company Information' },
    companyName: { ar: 'اسم الشركة', en: 'Company Name' },
    companyNameAr: { ar: 'اسم الشركة (بالعربية)', en: 'Company Name (Arabic)' },
    companyNameEn: { ar: 'Company Name (English)', en: 'Company Name (English)' },
    address: { ar: 'العنوان', en: 'Address' },
    phone1: { ar: 'الهاتف 1', en: 'Phone 1' },
    phone2: { ar: 'الهاتف 2', en: 'Phone 2' },
    email: { ar: 'البريد الإلكتروني', en: 'Email' },
    taxNumber: { ar: 'الرقم الضريبي', en: 'Tax Number' },
    logo: { ar: 'الشعار', en: 'Logo' },
    companyLogo: { ar: 'شعار الشركة', en: 'Company Logo' },
    currency: { ar: 'العملة', en: 'Currency' },
    baseCurrency: { ar: 'العملة الأساسية', en: 'Base Currency' },
    baseCurrencyHelper: { ar: 'جميع المبالغ ستُحفظ بهذه العملة', en: 'All amounts will be saved in this currency' },
    exchangeRate: { ar: 'سعر الصرف', en: 'Exchange Rate' },
    exchangeRateHelper: { ar: 'نسبة إلى العملة الأساسية', en: 'Ratio to base currency' },
    vatRate: { ar: 'نسبة الضريبة', en: 'VAT Rate' },
    vatRateError: { ar: 'نسبة الضريبة يجب أن تكون بين 0 و 100', en: 'VAT rate must be between 0 and 100' },
    vatEnabled: { ar: 'تفعيل الضريبة (VAT)', en: 'Enable VAT' },
    defaultPaymentMethod: { ar: 'طريقة الدفع الافتراضية', en: 'Default Payment Method' },
    financialSettings: { ar: 'الإعدادات المالية', en: 'Financial Settings' },
    taxSettings: { ar: 'إعدادات الضريبة', en: 'Tax Settings' },

    // Tabs
    services: { ar: 'الخدمات', en: 'Services' },
    materials: { ar: 'المواد', en: 'Materials' },
    metalTypes: { ar: 'أنواع المعادن', en: 'Metal Types' },
    grades: { ar: 'الدرجات', en: 'Grades' },
    finishes: { ar: 'التشطيبات', en: 'Finishes' },
    currencies: { ar: 'العملات', en: 'Currencies' },
    paymentMethods: { ar: 'طرق الدفع', en: 'Payment Methods' },
    users: { ar: 'المستخدمين', en: 'Users' },
    databaseManagement: { ar: 'إدارة قاعدة البيانات', en: 'Database Management' },

    // Service section
    addService: { ar: 'إضافة خدمة', en: 'Add Service' },
    addNewService: { ar: 'إضافة خدمة جديدة', en: 'Add New Service' },
    enterServiceData: { ar: 'أدخل بيانات الخدمة', en: 'Enter service data' },
    noServices: { ar: 'لا توجد خدمات', en: 'No services' },
    serviceNameAr: { ar: 'الاسم بالعربي', en: 'Name (Arabic)' },
    serviceNameEn: { ar: 'الاسم بالإنجليزي', en: 'Name (English)' },

    // Material section
    addMaterial: { ar: 'إضافة مادة', en: 'Add Material' },
    addNewMaterial: { ar: 'إضافة مادة جديدة', en: 'Add New Material' },
    enterMaterialData: { ar: 'أدخل بيانات المادة', en: 'Enter material data' },
    noMaterials: { ar: 'لا توجد مواد', en: 'No materials' },
    materialName: { ar: 'الاسم', en: 'Name' },
    abbreviation: { ar: 'الاختصار', en: 'Abbreviation' },
    abbreviation3Chars: { ar: 'الاختصار (3 أحرف)', en: 'Abbreviation (3 chars)' },
    density: { ar: 'الكثافة', en: 'Density' },
    densityOptional: { ar: 'اختياري - بوحدة g/cm³', en: 'Optional - in g/cm³' },

    // Currency section
    addCurrency: { ar: 'إضافة عملة', en: 'Add Currency' },
    addNewCurrency: { ar: 'إضافة عملة جديدة', en: 'Add New Currency' },
    enterCurrencyData: { ar: 'أدخل بيانات العملة', en: 'Enter currency data' },
    currencyCode: { ar: 'الكود', en: 'Code' },
    currencyCode3Chars: { ar: 'الكود (3 أحرف)', en: 'Code (3 chars)' },
    currencyCodeHelper: { ar: 'مثل: USD, EUR', en: 'e.g.: USD, EUR' },
    currencyName: { ar: 'الاسم', en: 'Name' },
    currencySymbol: { ar: 'الرمز', en: 'Symbol' },
    currencySymbolHelper: { ar: 'مثل: $, €', en: 'e.g.: $, €' },

    // Payment method section
    addPaymentMethod: { ar: 'إضافة طريقة دفع', en: 'Add Payment Method' },
    addNewPaymentMethod: { ar: 'إضافة طريقة دفع جديدة', en: 'Add New Payment Method' },
    enterPaymentMethodData: { ar: 'أدخل بيانات طريقة الدفع', en: 'Enter payment method data' },

    // User section
    addUser: { ar: 'إضافة مستخدم', en: 'Add User' },
    addNewUser: { ar: 'إضافة مستخدم جديد', en: 'Add New User' },
    userManagement: { ar: 'إدارة المستخدمين', en: 'User Management' },
    newUser: { ar: 'مستخدم جديد', en: 'New User' },
    username: { ar: 'اسم المستخدم', en: 'Username' },
    password: { ar: 'كلمة المرور', en: 'Password' },
    displayName: { ar: 'الاسم المعروض', en: 'Display Name' },
    fullName: { ar: 'الاسم الكامل', en: 'Full Name' },
    role: { ar: 'الدور', en: 'Role' },
    admin: { ar: 'مدير', en: 'Admin' },
    user: { ar: 'مستخدم', en: 'User' },
    activeStatus: { ar: 'نشط', en: 'Active' },
    inactiveStatus: { ar: 'معطل', en: 'Inactive' },
    createdDate: { ar: 'تاريخ الإنشاء', en: 'Creation Date' },
    changePassword: { ar: 'تغيير كلمة المرور', en: 'Change Password' },
    changePasswordFor: { ar: 'تغيير كلمة المرور -', en: 'Change Password -' },
    newPassword: { ar: 'كلمة المرور الجديدة', en: 'New Password' },
    confirmPassword: { ar: 'تأكيد كلمة المرور', en: 'Confirm Password' },
    cannotDeleteMainUser: { ar: 'لا يمكن حذف المستخدم الرئيسي', en: 'Cannot delete main user' },

    // Table headers
    arabicName: { ar: 'الاسم بالعربي', en: 'Arabic Name' },
    englishName: { ar: 'الاسم بالإنجليزي', en: 'English Name' },
    state: { ar: 'الحالة', en: 'State' },
    actions: { ar: 'إجراءات', en: 'Actions' },

    // Status
    active: { ar: 'مفعّل', en: 'Active' },
    inactive: { ar: 'موقوف', en: 'Inactive' },

    // Logo section
    uploadLogo: { ar: 'رفع الشعار', en: 'Upload Logo' },
    changeLogo: { ar: 'تغيير الشعار', en: 'Change Logo' },
    deleteLogo: { ar: 'حذف الشعار', en: 'Delete Logo' },
    logoMaxSize: { ar: 'الحد الأقصى: 2MB', en: 'Max size: 2MB' },
    logoFormats: { ar: 'PNG, JPG, SVG', en: 'PNG, JPG, SVG' },

    // Actions
    saveSettings: { ar: 'حفظ الإعدادات', en: 'Save Settings' },
    saving: { ar: 'جاري الحفظ...', en: 'Saving...' },

    // Tooltips
    saveTooltip: { ar: 'حفظ', en: 'Save' },
    cancelTooltip: { ar: 'إلغاء', en: 'Cancel' },
    editTooltip: { ar: 'تعديل', en: 'Edit' },
    deleteTooltip: { ar: 'حذف', en: 'Delete' },

    // Validation messages
    companyNameRequired: { ar: 'اسم الشركة مطلوب', en: 'Company name is required' },
    serviceNameRequired: { ar: 'الاسم بالعربي مطلوب', en: 'Arabic name is required' },
    materialNameRequired: { ar: 'الاسم بالعربي مطلوب', en: 'Arabic name is required' },
    abbreviationRequired: { ar: 'الاختصار مطلوب', en: 'Abbreviation is required' },
    densityMustBeNumber: { ar: 'الكثافة يجب أن تكون رقماً', en: 'Density must be a number' },
    currencyCodeRequired: { ar: 'الكود مطلوب', en: 'Code is required' },
    currencyNameRequired: { ar: 'الاسم بالعربي مطلوب', en: 'Arabic name is required' },
    currencySymbolRequired: { ar: 'الرمز مطلوب', en: 'Symbol is required' },
    exchangeRateMustBePositive: { ar: 'سعر الصرف يجب أن يكون أكبر من صفر', en: 'Exchange rate must be greater than zero' },
    paymentMethodNameRequired: { ar: 'الاسم بالعربي مطلوب', en: 'Arabic name is required' },
    usernameRequired: { ar: 'اسم المستخدم مطلوب', en: 'Username is required' },
    passwordRequired: { ar: 'كلمة المرور مطلوبة', en: 'Password is required' },
    newPasswordRequired: { ar: 'كلمة المرور الجديدة مطلوبة', en: 'New password is required' },
    roleRequired: { ar: 'الدور مطلوب', en: 'Role is required' },

    // Success messages
    settingsSaved: { ar: '✓ تم حفظ الإعدادات بنجاح', en: '✓ Settings saved successfully' },
    serviceAdded: { ar: '✓ تمت إضافة الخدمة', en: '✓ Service added' },
    materialAdded: { ar: '✓ تمت إضافة المادة', en: '✓ Material added' },
    currencyAdded: { ar: '✓ تمت إضافة العملة', en: '✓ Currency added' },
    paymentMethodAdded: { ar: '✓ تمت إضافة طريقة الدفع', en: '✓ Payment method added' },
    userAdded: { ar: '✓ تمت إضافة المستخدم بنجاح', en: '✓ User added successfully' },
    passwordChanged: { ar: '✓ تم تغيير كلمة المرور بنجاح', en: '✓ Password changed successfully' },
    userDeleted: { ar: '✓ تم حذف المستخدم بنجاح', en: '✓ User deleted successfully' },
    logoUploaded: { ar: 'تم رفع الشعار. احفظ التغييرات لتطبيقها.', en: 'Logo uploaded. Save changes to apply.' },
    logoDeleted: { ar: 'سيتم حذف الشعار عند الحفظ', en: 'Logo will be deleted when saving' },

    // Error messages
    saveFailed: { ar: 'فشل الحفظ', en: 'Save failed' },
    addFailed: { ar: 'فشل الإضافة', en: 'Add failed' },
    errorOccurred: { ar: 'حدث خطأ:', en: 'An error occurred:' },
    loadUsersFailed: { ar: 'تعذّر تحميل المستخدمين', en: 'Failed to load users' },
    loadServicesFailed: { ar: 'تعذّر تحميل الخدمات', en: 'Failed to load services' },
    loadMaterialsFailed: { ar: 'تعذّر تحميل المواد', en: 'Failed to load materials' },
    loadCurrenciesFailed: { ar: 'تعذّر تحميل العملات', en: 'Failed to load currencies' },
    loadPaymentMethodsFailed: { ar: 'تعذّر تحميل طرق الدفع', en: 'Failed to load payment methods' },
    addUserFailed: { ar: 'فشل إضافة المستخدم', en: 'Failed to add user' },
    changePasswordFailed: { ar: 'فشل تغيير كلمة المرور', en: 'Failed to change password' },
    deleteUserFailed: { ar: 'فشل حذف المستخدم', en: 'Failed to delete user' },
    imageOnly: { ar: 'يرجى اختيار صورة فقط', en: 'Please select an image only' },
    imageTooLarge: { ar: 'حجم الصورة كبير جداً (الحد الأقصى 2MB)', en: 'Image size too large (max 2MB)' },
    imageLoadFailed: { ar: 'فشل تحميل الصورة', en: 'Failed to load image' },

    // Database
    backup: { ar: 'النسخ الاحتياطي', en: 'Backup' },
    restore: { ar: 'الاستعادة', en: 'Restore' },
    database: { ar: 'قاعدة البيانات', en: 'Database' },
    exportData: { ar: 'تصدير البيانات', en: 'Export Data' },
    importData: { ar: 'استيراد البيانات', en: 'Import Data' },
    resetDatabase: { ar: 'إعادة تعيين قاعدة البيانات', en: 'Reset Database' },
    backupDatabase: { ar: 'نسخ احتياطي لقاعدة البيانات', en: 'Backup Database' },
    restoreDatabase: { ar: 'استعادة قاعدة البيانات', en: 'Restore Database' },

    // Helper text
    optional: { ar: 'اختياري', en: 'Optional' },
  },

  // Authentication
  auth: {
    login: { ar: 'تسجيل الدخول', en: 'Login' },
    logout: { ar: 'تسجيل الخروج', en: 'Logout' },
    username: { ar: 'اسم المستخدم', en: 'Username' },
    password: { ar: 'كلمة المرور', en: 'Password' },
    rememberMe: { ar: 'تذكرني', en: 'Remember Me' },
    forgotPassword: { ar: 'نسيت كلمة المرور؟', en: 'Forgot Password?' },
    invalidCredentials: { ar: 'اسم المستخدم أو كلمة المرور غير صحيحة', en: 'Invalid username or password' },
    sessionExpired: { ar: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى', en: 'Session expired. Please login again' },
    welcomeBack: { ar: 'مرحباً بك مرة أخرى', en: 'Welcome back' },
    usernameRequired: { ar: 'يرجى إدخال اسم المستخدم', en: 'Please enter username' },
    passwordRequired: { ar: 'يرجى إدخال كلمة المرور', en: 'Please enter password' },
    loginFailed: { ar: 'فشل تسجيل الدخول', en: 'Login failed' },
    systemTitle: { ar: 'نظام إدارة الصفائح', en: 'Metal Sheets Management System' },
    verifying: { ar: 'جاري التحقق...', en: 'Verifying...' },
    initialSetupPlaceholder: { ar: 'اتركها فارغة للإعداد الأولي', en: 'Leave empty for initial setup' },
    initialSetupHelper: { ar: 'للإعداد الأولي، اترك كلمة المرور فارغة', en: 'For initial setup, leave password empty' },
    version: { ar: 'الإصدار', en: 'Version' },
  },

  // Messages
  messages: {
    saveSuccess: { ar: 'تم الحفظ بنجاح', en: 'Saved successfully' },
    deleteSuccess: { ar: 'تم الحذف بنجاح', en: 'Deleted successfully' },
    updateSuccess: { ar: 'تم التحديث بنجاح', en: 'Updated successfully' },
    addSuccess: { ar: 'تمت الإضافة بنجاح', en: 'Added successfully' },
    saveFailed: { ar: 'فشل الحفظ', en: 'Save failed' },
    deleteFailed: { ar: 'فشل الحذف', en: 'Delete failed' },
    updateFailed: { ar: 'فشل التحديث', en: 'Update failed' },
    addFailed: { ar: 'فشلت الإضافة', en: 'Add failed' },
    databaseInitError: { ar: 'خطأ في تهيئة قاعدة البيانات', en: 'Database initialization error' },
    databaseLoadFailed: { ar: 'فشل في تحميل قاعدة البيانات', en: 'Failed to load database' },
    systemLoading: { ar: 'جاري تحميل النظام...', en: 'Loading system...' },
    pleaseWait: { ar: 'يرجى الانتظار', en: 'Please wait' },
    sessionExpiredAuto: { ar: 'تم تسجيل الخروج تلقائياً بسبب عدم النشاط لمدة 10 دقائق', en: 'Automatically logged out due to 10 minutes of inactivity' },
    confirmLogout: { ar: 'تأكيد تسجيل الخروج', en: 'Confirm Logout' },
    confirmLogoutDesc: { ar: 'سيتم إنهاء الجلسة الحالية. هل ترغب بالاستمرار؟', en: 'The current session will be ended. Do you want to continue?' },
    allRightsReserved: { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
    version: { ar: 'الإصدار', en: 'Version' },
    metalSheetsManagement: { ar: 'نظام إدارة الصفائح', en: 'Metal Sheets Management' },
    confirmDelete: { ar: 'هل أنت متأكد من الحذف؟', en: 'Are you sure you want to delete?' },
    confirmAction: { ar: 'هل أنت متأكد من هذا الإجراء؟', en: 'Are you sure you want to proceed?' },
    noChanges: { ar: 'لا توجد تغييرات', en: 'No changes made' },
    requiredFields: { ar: 'يرجى ملء جميع الحقول المطلوبة', en: 'Please fill in all required fields' },
    invalidData: { ar: 'البيانات غير صحيحة', en: 'Invalid data' },
    duplicateEntry: { ar: 'البيانات موجودة مسبقاً', en: 'Duplicate entry' },
    operationCancelled: { ar: 'تم إلغاء العملية', en: 'Operation cancelled' },
    loadingData: { ar: 'جاري تحميل البيانات...', en: 'Loading data...' },
    savingData: { ar: 'جاري الحفظ...', en: 'Saving...' },
    processingRequest: { ar: 'جاري معالجة الطلب...', en: 'Processing request...' },
  },

  // Validation
  validation: {
    required: { ar: 'هذا الحقل مطلوب', en: 'This field is required' },
    invalidEmail: { ar: 'البريد الإلكتروني غير صحيح', en: 'Invalid email address' },
    invalidPhone: { ar: 'رقم الهاتف غير صحيح', en: 'Invalid phone number' },
    invalidNumber: { ar: 'الرقم غير صحيح', en: 'Invalid number' },
    minLength: { ar: 'الحد الأدنى للأحرف', en: 'Minimum length' },
    maxLength: { ar: 'الحد الأقصى للأحرف', en: 'Maximum length' },
    minValue: { ar: 'القيمة الدنيا', en: 'Minimum value' },
    maxValue: { ar: 'القيمة القصوى', en: 'Maximum value' },
    passwordMismatch: { ar: 'كلمات المرور غير متطابقة', en: 'Passwords do not match' },
    weakPassword: { ar: 'كلمة المرور ضعيفة', en: 'Weak password' },
  },

  // Database errors and operations
  database: {
    // Operation contexts
    addCustomer: { ar: 'إضافة عميل', en: 'Add Customer' },
    updateCustomer: { ar: 'تحديث بيانات العميل', en: 'Update Customer Data' },
    deleteCustomer: { ar: 'حذف العميل', en: 'Delete Customer' },
    addSupplier: { ar: 'إضافة مورد', en: 'Add Supplier' },
    updateSupplier: { ar: 'تحديث بيانات المورد', en: 'Update Supplier Data' },
    deleteSupplier: { ar: 'حذف المورد', en: 'Delete Supplier' },
    addSupplierPayment: { ar: 'إضافة دفعة للمورد', en: 'Add Supplier Payment' },
    saveSale: { ar: 'حفظ عملية البيع', en: 'Save Sale' },
    saveSheetAndBatch: { ar: 'حفظ الصفيحة والدفعة', en: 'Save Sheet and Batch' },
    addExpense: { ar: 'إضافة مصروف', en: 'Add Expense' },
    updateExpense: { ar: 'تحديث المصروف', en: 'Update Expense' },
    deleteExpense: { ar: 'حذف المصروف', en: 'Delete Expense' },
    updateCompanyProfile: { ar: 'تحديث بيانات الشركة', en: 'Update Company Profile' },

    // Transaction notes
    purchaseBatch: { ar: 'شراء دفعة', en: 'Purchase Batch' },
    supplierPayment: { ar: 'دفعة للمورد', en: 'Payment to Supplier' },
    saleInvoice: { ar: 'فاتورة', en: 'Invoice' },
    immediatePayment: { ar: 'دفعة فورية - فاتورة', en: 'Immediate Payment - Invoice' },
    customerPayment: { ar: 'دفعة', en: 'Payment' },
    addBatchExistingSheet: { ar: 'إضافة دفعة لصفيحة موجودة', en: 'Add Batch to Existing Sheet' },
    addNewSheetWithBatch: { ar: 'إضافة صفيحة جديدة مع دفعة', en: 'Add New Sheet with Batch' },
    addBatch: { ar: 'إضافة دفعة', en: 'Add Batch' },
    saleFromInvoice: { ar: 'بيع - فاتورة', en: 'Sale - Invoice' },

    // Error messages
    invalidPaymentData: { ar: 'بيانات الدفع غير صحيحة', en: 'Invalid payment data' },
    invalidQuantity: { ar: 'كمية غير صحيحة', en: 'Invalid quantity' },
    quantityExceedsStock: { ar: 'الكمية المطلوبة (%d) تتجاوز المخزون المتاح', en: 'Requested quantity (%d) exceeds available stock' },
    databaseUnavailable: { ar: 'قاعدة البيانات غير متاحة', en: 'Database unavailable' },
    noUpdates: { ar: 'لا توجد تحديثات', en: 'No updates' },

    // Validation field names (for validators)
    categoryField: { ar: 'فئة المصروف', en: 'Expense Category' },
    amountField: { ar: 'المبلغ', en: 'Amount' },
    descriptionField: { ar: 'الوصف', en: 'Description' },
    expenseDateField: { ar: 'تاريخ المصروف', en: 'Expense Date' },
    paymentAmountField: { ar: 'مبلغ الدفعة', en: 'Payment Amount' },
    categoryNameField: { ar: 'اسم الفئة', en: 'Category Name' },
    companyNameField: { ar: 'اسم الشركة', en: 'Company Name' },
    serviceNameField: { ar: 'اسم الخدمة', en: 'Service Name' },
    currencyCodeField: { ar: 'كود العملة', en: 'Currency Code' },
    currencyNameArField: { ar: 'اسم العملة بالعربي', en: 'Currency Name (Arabic)' },
    exchangeRateField: { ar: 'سعر الصرف', en: 'Exchange Rate' },
    metalNameField: { ar: 'اسم المعدن', en: 'Metal Name' },
    metalAbbreviationField: { ar: 'اختصار المعدن', en: 'Metal Abbreviation' },
    densityField: { ar: 'الكثافة', en: 'Density' },
    metalTypeField: { ar: 'نوع المعدن', en: 'Metal Type' },
    gradeNameField: { ar: 'اسم الدرجة', en: 'Grade Name' },
    finishNameField: { ar: 'اسم التشطيب', en: 'Finish Name' },
    paymentMethodNameField: { ar: 'اسم طريقة الدفع', en: 'Payment Method Name' },
  },

  // Print
  print: {
    invoice: { ar: 'فاتورة', en: 'Invoice' },
    receipt: { ar: 'إيصال', en: 'Receipt' },
    quotation: { ar: 'عرض سعر', en: 'Quotation' },
    deliveryNote: { ar: 'إشعار تسليم', en: 'Delivery Note' },
    printInvoice: { ar: 'طباعة الفاتورة', en: 'Print Invoice' },
    printReceipt: { ar: 'طباعة الإيصال', en: 'Print Receipt' },
    printReport: { ar: 'طباعة التقرير', en: 'Print Report' },
    pageOf: { ar: 'صفحة %s من %s', en: 'Page %s of %s' },
    invoiceNo: { ar: 'رقم الفاتورة', en: 'Invoice No.' },
    date: { ar: 'التاريخ', en: 'Date' },
    dueDate: { ar: 'تاريخ الاستحقاق', en: 'Due Date' },
    billTo: { ar: 'إلى', en: 'Bill To' },
    item: { ar: 'الصنف', en: 'Item' },
    qty: { ar: 'الكمية', en: 'Qty' },
    rate: { ar: 'السعر', en: 'Rate' },
    total: { ar: 'الإجمالي', en: 'Total' },
    subtotal: { ar: 'المجموع الجزئي', en: 'Subtotal' },
    tax: { ar: 'الضريبة', en: 'Tax' },
    discount: { ar: 'الخصم', en: 'Discount' },
    grandTotal: { ar: 'الإجمالي الكلي', en: 'Grand Total' },
    thankyou: { ar: 'شكراً لتعاملكم معنا', en: 'Thank you for your business' },
    signature: { ar: 'التوقيع', en: 'Signature' },
    terms: { ar: 'الشروط والأحكام', en: 'Terms & Conditions' },
  },

  // PDF Templates
  pdf: {
    // Common PDF terms
    printDate: { ar: 'تاريخ الطباعة', en: 'Print Date' },
    page: { ar: 'صفحة', en: 'Page' },
    of: { ar: 'من', en: 'of' },
    from: { ar: 'من', en: 'from' },
    to: { ar: 'إلى', en: 'to' },

    // Invoice PDF
    saleInvoiceNo: { ar: 'فاتورة بيع رقم', en: 'Sale Invoice No.' },
    invoiceNumber: { ar: 'رقم الفاتورة', en: 'Invoice Number' },
    invoiceDate: { ar: 'التاريخ', en: 'Date' },
    customer: { ar: 'العميل', en: 'Customer' },
    phone: { ar: 'الهاتف', en: 'Phone' },
    unspecified: { ar: 'غير محدد', en: 'Unspecified' },
    items: { ar: 'الأصناف', en: 'Items' },
    description: { ar: 'الوصف', en: 'Description' },
    type: { ar: 'النوع', en: 'Type' },
    quantity: { ar: 'الكمية', en: 'Quantity' },
    price: { ar: 'السعر', en: 'Price' },
    totalAmount: { ar: 'الإجمالي', en: 'Total' },
    material: { ar: 'معدن', en: 'Material' },
    service: { ar: 'خدمة', en: 'Service' },
    subtotal: { ar: 'المجموع الفرعي', en: 'Subtotal' },
    discount: { ar: 'الخصم', en: 'Discount' },
    tax: { ar: 'الضريبة', en: 'Tax' },
    total: { ar: 'الإجمالي', en: 'Total' },
    paid: { ar: 'المدفوع', en: 'Paid' },
    remaining: { ar: 'المتبقي', en: 'Remaining' },
    notes: { ar: 'ملاحظات', en: 'Notes' },
    addedBy: { ar: 'أضيفت بواسطة', en: 'Added by' },
    lastModified: { ar: 'آخر تعديل', en: 'Last modified' },

    // Batch PDF
    batchDetails: { ar: 'تفاصيل الدفعة', en: 'Batch Details' },
    sheetInformation: { ar: 'معلومات الصفيحة', en: 'Sheet Information' },
    code: { ar: 'الكود', en: 'Code' },
    dimensionsMm: { ar: 'الأبعاد (مم)', en: 'Dimensions (mm)' },
    metalType: { ar: 'نوع المعدن', en: 'Metal Type' },
    grade: { ar: 'الدرجة', en: 'Grade' },
    finish: { ar: 'السطح', en: 'Finish' },
    weightPerPieceKg: { ar: 'وزن القطعة (كغ)', en: 'Weight per piece (kg)' },
    batchInformation: { ar: 'معلومات الدفعة', en: 'Batch Information' },
    supplier: { ar: 'المورد', en: 'Supplier' },
    noSupplier: { ar: 'بدون مورد', en: 'No supplier' },
    receivedDate: { ar: 'تاريخ الاستلام', en: 'Received Date' },
    originalQuantity: { ar: 'الكمية الأصلية', en: 'Original Quantity' },
    remainingQuantity: { ar: 'الكمية المتبقية', en: 'Remaining Quantity' },
    pricePerKg: { ar: 'السعر لكل كيلو', en: 'Price per kg' },
    totalCost: { ar: 'التكلفة الإجمالية', en: 'Total Cost' },
    storageLocation: { ar: 'موقع التخزين', en: 'Storage Location' },
    totalWeightKg: { ar: 'الوزن الإجمالي (كغ)', en: 'Total Weight (kg)' },

    // Statement PDF
    accountStatement: { ar: 'كشف حساب', en: 'Account Statement' },
    customerType: { ar: 'العميل', en: 'Customer' },
    supplierType: { ar: 'المورد', en: 'Supplier' },
    name: { ar: 'الاسم', en: 'Name' },
    company: { ar: 'الشركة', en: 'Company' },
    address: { ar: 'العنوان', en: 'Address' },
    period: { ar: 'الفترة', en: 'Period' },
    beginning: { ar: 'البداية', en: 'Beginning' },
    now: { ar: 'الآن', en: 'Now' },
    transactionsHistory: { ar: 'سجل المعاملات', en: 'Transactions History' },
    balanceAfter: { ar: 'الرصيد بعد', en: 'Balance After' },
    amount: { ar: 'المبلغ', en: 'Amount' },
    transactionType: { ar: 'النوع', en: 'Type' },
    remarks: { ar: 'الملاحظات', en: 'Notes' },
    sale: { ar: 'بيع', en: 'Sale' },
    payment: { ar: 'دفعة', en: 'Payment' },
    purchase: { ar: 'شراء', en: 'Purchase' },
    invoice: { ar: 'فاتورة', en: 'Invoice' },
    noTransactions: { ar: 'لا توجد معاملات في هذه الفترة', en: 'No transactions in this period' },
    finalBalance: { ar: 'الرصيد النهائي', en: 'Final Balance' },
    owedByCustomer: { ar: 'مطلوب منه', en: 'Owed' },
    hasCredit: { ar: 'له رصيد', en: 'Has credit' },
    balanced: { ar: 'متوازن', en: 'Balanced' },
    dueToSupplier: { ar: 'مستحق له', en: 'Due to supplier' },
    overpaid: { ar: 'مدفوع زيادة', en: 'Overpaid' },
    operationsCount: { ar: 'عدد العمليات', en: 'Operations Count' },
  },
};

// Default language
let currentLanguage = 'ar';

/**
 * Set the current language
 * @param {string} lang - Language code ('ar' or 'en')
 */
export const setLanguage = (lang) => {
  if (lang === 'ar' || lang === 'en') {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
  }
};

/**
 * Get the current language
 * @returns {string} Current language code
 */
export const getLanguage = () => {
  if (!currentLanguage) {
    currentLanguage = localStorage.getItem('language') || 'ar';
  }
  return currentLanguage;
};

/**
 * Get translation for a given key
 * @param {string} key - Translation key (e.g., 'common.save', 'sales.title')
 * @param {string} lang - Optional language override
 * @returns {string} Translated text
 */
export const t = (key, lang = null) => {
  const language = lang || getLanguage();
  const keys = key.split('.');
  let value = translations;

  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }

  if (value && typeof value === 'object' && value[language]) {
    return value[language];
  }

  return key; // Return key if translation not found
};

/**
 * Get translation object with both languages
 * @param {string} key - Translation key
 * @returns {object} Object with ar and en properties
 */
export const tObj = (key) => {
  const keys = key.split('.');
  let value = translations;

  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return { ar: key, en: key };
    }
  }

  if (value && typeof value === 'object' && value.ar && value.en) {
    return value;
  }

  return { ar: key, en: key };
};

export default {
  t,
  tObj,
  setLanguage,
  getLanguage,
  translations,
};
