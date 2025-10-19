# 🚀 دليل النشر - نظام إدارة الصفائح المعدنية

## ✅ قائمة التحقق قبل النشر

- [x] تم تنظيف المشروع من الملفات غير الضرورية
- [x] تم إنشاء ملف `.gitignore` صحيح
- [x] تم إنشاء ملف `vercel.json` للتكوين
- [x] تم اختبار البناء الإنتاجي (`npm run build`)
- [x] تم إنشاء ملف `README.md` كامل
- [x] جميع الملفات جاهزة للرفع

---

## 📤 الخطوة 1: رفع المشروع إلى GitHub

### إنشاء مستودع جديد على GitHub

1. اذهب إلى [GitHub](https://github.com) وسجل الدخول
2. اضغط على الزر الأخضر "New" أو "New repository"
3. املأ المعلومات:
   - **Repository name**: `metal-sheets-management` (أو أي اسم تفضله)
   - **Description**: نظام إدارة الصفائح المعدنية
   - **Public/Private**: اختر حسب تفضيلك
   - **لا تضف** README أو .gitignore أو license (لأن لدينا هذه الملفات بالفعل)
4. اضغط "Create repository"

### ربط المشروع المحلي بـ GitHub

افتح Terminal في مجلد المشروع وقم بتنفيذ الأوامر التالية:

```bash
# التأكد من أنك في مجلد المشروع
cd d:\MY-main\MY-main

# تهيئة Git (إذا لم يكن مهيأ)
git init

# إضافة جميع الملفات
git add .

# إنشاء أول commit
git commit -m "Initial commit: Metal Sheets Management System v2.0"

# ربط المستودع البعيد (استبدل YOUR_USERNAME باسم المستخدم الخاص بك)
git remote add origin https://github.com/YOUR_USERNAME/metal-sheets-management.git

# رفع الملفات إلى GitHub
git branch -M main
git push -u origin main
```

---

## 🌐 الخطوة 2: النشر على Vercel

### الطريقة الأولى: من خلال موقع Vercel (الأسهل)

1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل الدخول باستخدام حساب GitHub
3. اضغط على "Add New..." ثم "Project"
4. اختر المستودع `metal-sheets-management`
5. **إعدادات المشروع**:
   - **Framework Preset**: Vite (سيتم اكتشافه تلقائياً)
   - **Root Directory**: `./` (افتراضي)
   - **Build Command**: `npm run build` (افتراضي)
   - **Output Directory**: `dist` (افتراضي)
6. اضغط "Deploy"
7. انتظر 2-3 دقائق حتى يكتمل النشر
8. ستحصل على رابط مثل: `https://metal-sheets-management.vercel.app`

### الطريقة الثانية: من خلال Vercel CLI

```bash
# تثبيت Vercel CLI عالمياً
npm install -g vercel

# تسجيل الدخول
vercel login

# النشر (تجريبي)
vercel

# النشر للإنتاج
vercel --prod
```

---

## 🔄 التحديثات المستقبلية

### عند إضافة تغييرات جديدة:

```bash
# إضافة التغييرات
git add .

# إنشاء commit
git commit -m "وصف التحديث"

# رفع التغييرات
git push
```

**ملاحظة**: عند الرفع إلى GitHub، سيتم نشر التحديثات تلقائياً على Vercel (إذا كنت قد ربطت المشروع).

---

## ⚙️ الإعدادات المتقدمة على Vercel

### متغيرات البيئة (إذا لزم الأمر)

في لوحة تحكم Vercel:
1. اذهب إلى "Settings"
2. اختر "Environment Variables"
3. أضف المتغيرات المطلوبة (إن وجدت)

### النطاق المخصص (Custom Domain)

1. في لوحة تحكم Vercel، اذهب إلى "Settings" > "Domains"
2. اضغط "Add"
3. أدخل النطاق الخاص بك
4. اتبع التعليمات لتحديث سجلات DNS

---

## 🔍 التحقق من النشر

بعد النشر، تحقق من:

- ✅ الصفحة الرئيسية تعمل بشكل صحيح
- ✅ يمكنك تسجيل الدخول
- ✅ جميع التبويبات تعمل
- ✅ يمكن إضافة بيانات جديدة
- ✅ التقارير يمكن توليدها
- ✅ الطباعة وتصدير PDF يعمل

---

## 🐛 حل المشاكل الشائعة

### المشكلة: "Module not found" أثناء البناء
**الحل**: تأكد من تثبيت جميع التبعيات:
```bash
npm install
npm run build
```

### المشكلة: الصفحة بيضاء بعد النشر
**الحل**: تحقق من:
1. Console في متصفح الويب للأخطاء
2. أن `base: './'` موجود في `vite.config.js`
3. أن جميع المسارات نسبية وليست مطلقة

### المشكلة: IndexedDB لا يعمل
**الحل**: IndexedDB يعمل فقط على HTTPS أو localhost. تأكد من أن الموقع منشور على HTTPS (Vercel يوفر HTTPS تلقائياً).

---

## 📊 مراقبة الأداء

بعد النشر على Vercel، يمكنك:
- عرض الإحصائيات في لوحة التحكم
- مراقبة الأخطاء في "Logs"
- تحليل الأداء في "Analytics"

---

## 🔐 ملاحظات الأمان

- ✅ جميع البيانات مخزنة محلياً في IndexedDB
- ✅ لا يتم إرسال أي بيانات إلى خوادم خارجية
- ✅ كلمات المرور مشفرة باستخدام bcrypt
- ✅ HTTPS مفعل تلقائياً على Vercel

---

## 📞 الدعم

إذا واجهت أي مشاكل:
- راجع [وثائق Vercel](https://vercel.com/docs)
- راجع [وثائق Vite](https://vitejs.dev)
- تحقق من Vercel Logs للأخطاء

---

**تم النشر بنجاح! 🎉**

الآن نظامك متاح على الإنترنت ويمكن الوصول إليه من أي مكان.
