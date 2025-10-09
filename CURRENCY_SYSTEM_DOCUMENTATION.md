# 📊 نظام العملات - شرح تفصيلي كامل
# Currency System - Complete Technical Documentation

## 🎯 نظرة عامة / Overview

نظام العملات في البرنامج مصمم لدعم العمل بعملات متعددة مع التحويل التلقائي والحفاظ على الدقة المحاسبية.

The currency system is designed to support multi-currency operations with automatic conversion and accounting precision.

---

## 🏗️ البنية الأساسية / Core Architecture

### 1. جدول العملات / Currencies Table

```sql
CREATE TABLE currencies (
    id                INTEGER PRIMARY KEY,
    code              TEXT NOT NULL UNIQUE,     -- USD, EUR, SAR, etc.
    name_ar           TEXT NOT NULL,            -- اسم العملة بالعربي
    name_en           TEXT NOT NULL,            -- Currency name in English
    symbol            TEXT NOT NULL,            -- $, €, ر.س, etc.
    exchange_rate     REAL DEFAULT 1.0,         -- سعر الصرف مقابل العملة الأساسية
    is_active         INTEGER DEFAULT 1,        -- حالة النشاط
    created_at        DATETIME,
    updated_at        DATETIME
)
```

### 2. العملة الأساسية / Base Currency

- يتم تحديدها في `company_profile.base_currency`
- العملة الافتراضية: USD
- جميع المبالغ تُحفظ في قاعدة البيانات بالعملة الأساسية
- التحويل يتم عند الإدخال والعرض

---

## 🔄 منطق التحويل / Conversion Logic

### دوال التحويل الأساسية / Core Conversion Functions

```javascript
// تحويل من أي عملة إلى العملة الأساسية
function toBase(amount, fromCurrency, baseCurrency, exchangeRates) {
    if (fromCurrency === baseCurrency) return amount;
    const rate = exchangeRates[fromCurrency];
    return amount * rate;
}

// تحويل من العملة الأساسية إلى أي عملة
function fromBase(amount, toCurrency, baseCurrency, exchangeRates) {
    if (toCurrency === baseCurrency) return amount;
    const rate = exchangeRates[toCurrency];
    return amount / rate;
}
```

### مثال عملي / Practical Example

```
العملة الأساسية: USD
أسعار الصرف:
- EUR: 1.1 (1 EUR = 1.1 USD)
- SAR: 0.27 (1 SAR = 0.27 USD)

مثال 1: تحويل 100 EUR إلى USD
100 EUR × 1.1 = 110 USD

مثال 2: تحويل 100 USD إلى SAR
100 USD ÷ 0.27 = 370.37 SAR
```

---

## 💰 التطبيق في المبيعات / Sales Implementation

### 1. عملية البيع / Sales Process

```javascript
// عند إنشاء فاتورة بيع
processSale(saleData) {
    // 1. تحديد العملات
    baseCurrency = getBaseCurrency();        // USD
    saleCurrency = saleData.currency_code;   // EUR مثلاً

    // 2. جلب أسعار الصرف
    exchangeRates = getAllExchangeRates();

    // 3. حساب المبالغ بعملة البيع
    subtotalSaleCurrency = calculateSubtotal();  // 1000 EUR

    // 4. التحويل للعملة الأساسية للحفظ
    subtotalBase = toBase(subtotalSaleCurrency, saleCurrency, baseCurrency);
    // 1000 EUR × 1.1 = 1100 USD

    // 5. حفظ في قاعدة البيانات
    INSERT INTO sales (
        currency_code,    // EUR
        fx_rate,         // 1.1
        subtotal,        // 1100 USD (بالعملة الأساسية)
        ...
    )
}
```

### 2. عرض الفاتورة / Invoice Display

```javascript
// عند عرض الفاتورة
displayInvoice(sale) {
    if (displayCurrency === baseCurrency) {
        // عرض المبلغ المحفوظ مباشرة
        amount = sale.subtotal;  // 1100 USD
    } else {
        // تحويل من العملة الأساسية للعرض
        amount = fromBase(sale.subtotal, displayCurrency, baseCurrency);
        // 1100 USD ÷ 1.1 = 1000 EUR
    }
}
```

---

## 📦 التطبيق في المخزون / Inventory Implementation

### 1. شراء المخزون / Purchasing Inventory

```javascript
// عند شراء دفعة من المورد
addBatch({
    supplier_currency: 'EUR',
    price_per_kg: 50,        // 50 EUR/kg
    quantity: 100
}) {
    // التحويل للعملة الأساسية
    priceBase = toBase(50, 'EUR', 'USD', rates);  // 55 USD/kg
    totalCostBase = priceBase * quantity;         // 5500 USD

    // حفظ بالعملة الأساسية
    INSERT INTO batches (
        price_per_kg,    // 55 USD
        total_cost       // 5500 USD
    )
}
```

### 2. حساب FIFO / FIFO Calculation

```javascript
// البيع يستخدم الأسعار المحفوظة بالعملة الأساسية
processSaleItemFIFO(item) {
    batches = getBatchesBySheetId();  // الأسعار بـ USD

    for (batch of batches) {
        costPerUnit = batch.price_per_kg * weight;  // USD
        // لا حاجة للتحويل - كله بالعملة الأساسية
    }
}
```

---

## 📊 المصروفات والمحاسبة / Expenses & Accounting

### 1. تسجيل المصروف / Recording Expense

```javascript
addExpense({
    amount: 500,
    currency_code: 'SAR'
}) {
    // التحويل للعملة الأساسية
    amountBase = toBase(500, 'SAR', 'USD', rates);
    // 500 SAR × 0.27 = 135 USD

    INSERT INTO expenses_enhanced (
        amount,          // 500 (المبلغ الأصلي)
        currency_code,   // SAR
        exchange_rate,   // 0.27
        amount_base      // 135 USD
    )
}
```

### 2. القيود المحاسبية / Accounting Entries

```javascript
// القيود تُسجل بالعملة الأساسية
createAccountingEntry({
    debit: amountBase,   // 135 USD
    credit: amountBase   // 135 USD
})
```

---

## 📈 التقارير / Reports

### 1. تقرير متعدد العملات / Multi-Currency Report

```javascript
generateReport(currency) {
    // جلب البيانات (كلها بالعملة الأساسية)
    sales = getAllSales();        // USD
    expenses = getAllExpenses();  // USD

    if (currency !== baseCurrency) {
        // تحويل للعملة المطلوبة
        sales = sales.map(s => ({
            ...s,
            amount: fromBase(s.amount, currency, baseCurrency)
        }));
    }
}
```

### 2. تقرير الربح والخسارة / P&L Report

```javascript
calculateProfitLoss() {
    // كل الحسابات بالعملة الأساسية
    revenue = getTotalSales();      // USD
    cogs = getTotalCOGS();          // USD
    expenses = getTotalExpenses();  // USD

    profit = revenue - cogs - expenses;  // USD
}
```

---

## 🔧 الإعدادات / Configuration

### 1. إضافة عملة جديدة / Adding New Currency

```javascript
addCurrency({
    code: 'GBP',
    name_ar: 'جنيه إسترليني',
    name_en: 'British Pound',
    symbol: '£',
    exchange_rate: 1.3  // 1 GBP = 1.3 USD
})
```

### 2. تحديث سعر الصرف / Updating Exchange Rate

```javascript
updateCurrency(currencyId, {
    exchange_rate: 1.35  // السعر الجديد
})

// ⚠️ تنبيه: هذا يؤثر على المعاملات الجديدة فقط
// المعاملات السابقة تحتفظ بسعر الصرف وقت إنشائها
```

---

## 🎯 الممارسات الأفضل / Best Practices

### 1. الدقة / Precision
- استخدم `round2()` دائماً للمبالغ النقدية
- احفظ الأسعار بدقة 2 خانة عشرية

### 2. الأداء / Performance
- احفظ دائماً بالعملة الأساسية
- التحويل فقط عند العرض
- كاش أسعار الصرف في الذاكرة

### 3. التدقيق / Auditing
- احفظ سعر الصرف مع كل معاملة
- لا تعتمد على السعر الحالي للمعاملات القديمة

### 4. الأمان / Security
- تحقق من صحة أسعار الصرف (> 0)
- امنع تغيير عملة المعاملات المكتملة

---

## 📝 أمثلة الكود / Code Examples

### مثال 1: فاتورة بيع متعددة العملات

```javascript
// العميل يدفع بـ EUR
// المورد يتعامل بـ SAR
// الشركة تعمل بـ USD

const sale = {
    customer_currency: 'EUR',
    items: [
        { price: 100, quantity: 5 }  // 100 EUR × 5 = 500 EUR
    ]
};

// التحويل
const subtotalEUR = 500;
const subtotalUSD = toBase(500, 'EUR', 'USD', rates);  // 550 USD

// حفظ
saveSale({
    currency_code: 'EUR',
    fx_rate: 1.1,
    subtotal: 550  // USD
});
```

### مثال 2: تقرير مجمع

```javascript
function getConsolidatedReport(targetCurrency) {
    const baseCurrency = 'USD';

    // جمع البيانات
    const salesUSD = 10000;
    const expensesUSD = 6000;
    const profitUSD = 4000;

    // تحويل للعملة المطلوبة
    if (targetCurrency !== baseCurrency) {
        const rate = getExchangeRate(targetCurrency);
        return {
            sales: fromBase(salesUSD, targetCurrency, baseCurrency),
            expenses: fromBase(expensesUSD, targetCurrency, baseCurrency),
            profit: fromBase(profitUSD, targetCurrency, baseCurrency)
        };
    }

    return { sales: salesUSD, expenses: expensesUSD, profit: profitUSD };
}
```

---

## 🚨 المشاكل الشائعة وحلولها / Common Issues & Solutions

### 1. عدم تطابق المبالغ
**المشكلة**: المبلغ المعروض لا يساوي المبلغ المدخل
**السبب**: أخطاء التقريب في التحويل
**الحل**: استخدم `round2()` في كل خطوة

### 2. تغير أسعار الصرف
**المشكلة**: التقارير القديمة تظهر مبالغ خاطئة
**السبب**: استخدام السعر الحالي للمعاملات القديمة
**الحل**: احفظ `fx_rate` مع كل معاملة

### 3. الأداء البطيء
**المشكلة**: التقارير تستغرق وقت طويل
**السبب**: تحويل العملات في كل استعلام
**الحل**: احفظ بالعملة الأساسية، حول عند العرض فقط

---

## 📚 الجداول المتأثرة / Affected Tables

1. **sales**: `currency_code`, `fx_rate`, مبالغ بـ USD
2. **expenses_enhanced**: `currency_code`, `exchange_rate`, `amount_base`
3. **batches**: `price_per_kg`, `total_cost` بـ USD
4. **supplier_payments**: مبالغ بـ USD
5. **customer_transactions**: مبالغ بـ USD
6. **general_ledger**: كل القيود بـ USD

---

## 🔍 استعلامات مفيدة / Useful Queries

### 1. إجمالي المبيعات بعملة معينة
```sql
SELECT
    SUM(subtotal / fx_rate) as total_in_original_currency
FROM sales
WHERE currency_code = 'EUR'
```

### 2. تحليل العملات المستخدمة
```sql
SELECT
    currency_code,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_usd
FROM sales
GROUP BY currency_code
```

### 3. أثر تغيير سعر الصرف
```sql
SELECT
    currency_code,
    AVG(fx_rate) as avg_rate,
    MIN(fx_rate) as min_rate,
    MAX(fx_rate) as max_rate
FROM sales
GROUP BY currency_code
```

---

## ✅ الخلاصة / Summary

نظام العملات يعمل على مبدأ:
1. **حفظ بالعملة الأساسية**: كل المبالغ في قاعدة البيانات بـ USD
2. **تحويل عند الإدخال**: من عملة المعاملة إلى USD
3. **تحويل عند العرض**: من USD إلى عملة العرض
4. **حفظ السعر التاريخي**: كل معاملة تحفظ سعر الصرف وقت إنشائها
5. **دقة محاسبية**: استخدام `round2()` لضمان الدقة

هذا يضمن:
- ✅ دقة المحاسبة
- ✅ سرعة الأداء
- ✅ سهولة التقارير
- ✅ المرونة في العرض
- ✅ التدقيق الكامل