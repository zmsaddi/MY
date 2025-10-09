# نظام إدارة ورشة المعادن
## Metal Sheets Management System

نظام متكامل لإدارة ورشة المعادن يشمل المخزون والمبيعات والعملاء والموردين والحسابات.

A comprehensive metal workshop management system including inventory, sales, customers, suppliers, and accounting.

---

## 🚀 المميزات الرئيسية / Key Features

### 📦 إدارة المخزون / Inventory Management
- تتبع الصفائح المعدنية والبواقي / Track metal sheets and remnants
- نظام دفعات متقدم مع FIFO / Advanced batch system with FIFO
- حساب الأوزان والأسعار التلقائي / Automatic weight and price calculations
- فصل العرض بين الصفائح الكاملة والبواقي / Separate display for full sheets and remnants

### 💰 المبيعات / Sales
- ثلاثة أنواع بيع: صفيحة كاملة، بقايا، قص من صفيحة / Three sale types: full sheet, remnants, cutting from sheet
- نظام تلوين الأسعار (أحمر للخسارة، أخضر للربح) / Price coloring system (red for loss, green for profit)
- إنشاء البواقي تلقائياً بعد القص / Automatic remnant creation after cutting
- تتبع المدفوعات الجزئية / Partial payment tracking

### 👥 إدارة العلاقات / Relationship Management
- نظام العملاء مع تتبع الأرصدة / Customer system with balance tracking
- نظام الموردين مع كشوف الحساب / Supplier system with account statements
- تتبع المدفوعات والمستحقات / Payment and receivables tracking

### 📊 النظام المحاسبي / Accounting System
- قائمة الدخل / Income statement
- الميزانية العمومية / Balance sheet
- تقارير المصروفات / Expense reports
- كشوف حسابات مفصلة / Detailed account statements
- دعم العملات المتعددة / Multi-currency support

### 🔐 الأمان / Security
- نظام تسجيل دخول آمن / Secure login system
- تشفير كلمات المرور (bcrypt) / Password encryption (bcrypt)
- نسخ احتياطي تلقائي / Automatic backups
- معالجة أخطاء عالمية مع إشعارات / Global error handling with notifications

---

## 🛠️ التقنيات المستخدمة / Technologies

- **Frontend**: React 18.2, Material-UI v5
- **Database**: SQL.js (SQLite WebAssembly)
- **Build Tool**: Vite 5.0
- **Desktop**: Electron 28.3
- **Language**: JavaScript (ES6+)
- **Styling**: RTL Support, Responsive Design

---

## 📥 التثبيت / Installation

```bash
# تثبيت المكتبات / Install dependencies
npm install

# تشغيل التطبيق (ويب) / Run web application
npm run dev

# بناء التطبيق للإنتاج / Build for production
npm run build

# تشغيل نسخة الإنتاج / Preview production build
npm run preview

# بناء تطبيق سطح المكتب / Build desktop application
npm run electron:build
```

---

## 🔧 الإعدادات الأولية / Initial Setup

### تسجيل الدخول الأول / First Login:
- عند تشغيل التطبيق لأول مرة، يمكنك تسجيل الدخول بدون كلمة مرور
- **اسم المستخدم / Username**: `admin`
- **كلمة المرور / Password**: اتركها فارغة
- ⚠️ **مهم**: سيُطلب منك تعيين كلمة مرور جديدة عند أول تسجيل دخول

When running the application for the first time:
- **Username**: `admin`
- **Password**: Leave blank
- ⚠️ **Important**: You will be required to set a new password on first login

### إعداد الشركة / Company Setup:
1. الذهاب إلى تبويب الإعدادات / Go to Settings tab
2. تعبئة بيانات الشركة / Fill in company information
3. إضافة العملات وطرق الدفع / Add currencies and payment methods
4. إعداد أنواع المعادن / Configure metal types

---

## 📱 الاستخدام / Usage

### إضافة صفيحة جديدة / Add New Sheet:
1. اذهب إلى تبويب المخزون / Go to Inventory tab
2. اضغط "إضافة صفيحة جديدة" / Click "Add New Sheet"
3. أدخل المعلومات (الأبعاد، النوع، الوزن) / Enter details (dimensions, type, weight)
4. حدد طريقة إدخال الوزن / Select weight input method
5. حدد التسعير / Select pricing method

### إنشاء فاتورة مبيعات / Create Sales Invoice:
1. اذهب إلى تبويب المبيعات / Go to Sales tab
2. اضغط "إنشاء فاتورة جديدة" / Click "Create New Invoice"
3. اختر العميل والعناصر / Select customer and items
4. حدد نوع البيع / Select sale type
5. أكمل الدفع / Complete payment

### إدارة المدفوعات / Payment Management:
- **للموردين / For Suppliers**: من تبويب الموردين > عرض الدفعات
- **من العملاء / From Customers**: من تبويب المدفوعات

---

## 🗂️ هيكل المشروع / Project Structure

```
src/
├── components/
│   ├── tabs/              # التبويبات الرئيسية / Main tabs
│   ├── sales/             # مكونات المبيعات / Sales components
│   ├── common/            # المكونات المشتركة / Shared components
│   ├── ErrorNotification.jsx  # إشعارات الأخطاء / Error notifications
│   └── Login.jsx          # شاشة تسجيل الدخول / Login screen
├── utils/
│   ├── database/          # وظائف قاعدة البيانات / Database functions
│   │   ├── core.js        # الوظائف الأساسية / Core functions
│   │   ├── schema.js      # بنية قاعدة البيانات / Database schema
│   │   ├── inventory.js   # المخزون / Inventory
│   │   ├── sales.js       # المبيعات / Sales
│   │   ├── customers.js   # العملاء / Customers
│   │   ├── suppliers.js   # الموردين / Suppliers
│   │   ├── expenses.js    # المصروفات / Expenses
│   │   ├── accounting.js  # المحاسبة / Accounting
│   │   └── errorHandler.js # معالج الأخطاء / Error handler
│   ├── hooks/             # React Hooks
│   │   └── useErrorHandler.js  # معالج الأخطاء العام / Global error handler
│   ├── validators.js      # التحقق من البيانات / Data validation
│   └── theme.js           # إعدادات الثيم RTL / RTL theme settings
└── App.jsx                # المكون الرئيسي / Main component
```

---

## 🔄 النسخ الاحتياطي / Backups

- **تلقائي / Automatic**: عند وصول حجم قاعدة البيانات إلى 4MB / When database reaches 4MB
- **يدوي / Manual**: من الإعدادات > إدارة قاعدة البيانات > تصدير / From Settings > Database Management > Export

---

## ⚡ الأداء / Performance

- Lazy Loading للمكونات / Component lazy loading
- Debouncing للبحث (300ms) / Search debouncing (300ms)
- Code Splitting للحزم / Bundle code splitting
- 13 فهرس لتسريع الاستعلامات / 13 database indexes for faster queries
- SQLite optimization with WAL mode

---

## 🐛 معالجة الأخطاء / Error Handling

- Error Boundaries لكل تبويب / Error boundaries for each tab
- إشعارات أخطاء عامة مع زر نسخ / Global error notifications with copy button
- رسائل خطأ واضحة بالعربية / Clear Arabic error messages
- تفاصيل تقنية قابلة للتوسع / Expandable technical details
- تتبع الأخطاء في جميع عمليات قاعدة البيانات / Error tracking in all database operations

---

## 🌐 النشر / Deployment

### Vercel (Recommended):
1. ربط المستودع بـ Vercel / Connect repository to Vercel
2. النشر التلقائي عند كل push / Automatic deployment on every push
3. إعدادات البناء موجودة في `vercel.json` / Build settings in `vercel.json`

### بناء محلي / Local Build:
```bash
npm run build
npm run preview
```

---

## 📊 المميزات الإضافية / Additional Features

✅ دعم RTL كامل / Full RTL support
✅ تصميم متجاوب لجميع الأجهزة / Responsive design for all devices
✅ نظام FIFO للمخزون / FIFO inventory system
✅ حساب تكلفة البضاعة المباعة (COGS) / Cost of Goods Sold (COGS) calculation
✅ تتبع الأرباح والخسائر / Profit and loss tracking
✅ تقارير مفصلة / Detailed reports
✅ دعم العملات المتعددة / Multi-currency support
✅ معالجة أخطاء ذكية / Intelligent error handling

---

## 📄 الرخصة / License

جميع الحقوق محفوظة © 2025

All Rights Reserved © 2025

---

**Built with ❤️ using React & Material-UI**
