# نظام إدارة الصفائح المعدنية - دليل النشر / Metal Sheets Management - Deployment Guide

## نشر على Vercel / Deploy to Vercel

### الخطوات / Steps:

#### 1. إنشاء حساب Vercel / Create Vercel Account
- اذهب إلى [vercel.com](https://vercel.com)
- سجّل الدخول باستخدام حساب GitHub الخاص بك

#### 2. ربط المشروع بـ Vercel / Link Project to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link
```

#### 3. الحصول على معرّفات المشروع / Get Project IDs
بعد ربط المشروع، ستجد ملف `.vercel/project.json` يحتوي على:
```json
{
  "projectId": "prj_xxxxxxxxxxxxx",
  "orgId": "team_xxxxxxxxxxxxx"
}
```

#### 4. إضافة أسرار GitHub / Add GitHub Secrets
في صفحة المشروع على GitHub:
1. اذهب إلى `Settings` > `Secrets and variables` > `Actions`
2. أضف الأسرار التالية / Add these secrets:
   - `VERCEL_TOKEN`: احصل عليه من [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID`: من ملف `.vercel/project.json`
   - `VERCEL_PROJECT_ID`: من ملف `.vercel/project.json`

#### 5. النشر / Deploy
```bash
# Manual deploy
vercel --prod

# Or push to main branch for automatic deployment
git push origin main
```

### ملاحظات مهمة / Important Notes

⚠️ **SQL.js و WebAssembly**
هذا المشروع يستخدم SQL.js الذي يتطلب WebAssembly. للعمل على Vercel:

1. **CORS Headers**: تم إضافتها في `vercel.json`
   ```json
   {
     "Cross-Origin-Embedder-Policy": "require-corp",
     "Cross-Origin-Opener-Policy": "same-origin"
   }
   ```

2. **ملفات WASM**: تأكد من نسخ `sql-wasm.wasm` إلى مجلد `public/`

3. **localStorage**: قاعدة البيانات تُحفظ في localStorage المتصفح

### البناء المحلي / Local Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### استكشاف الأخطاء / Troubleshooting

#### خطأ: "Cannot find sql-wasm.wasm"
**الحل / Solution:**
```bash
cp node_modules/sql.js/dist/sql-wasm.wasm public/
```

#### خطأ: "SharedArrayBuffer is not defined"
**الحل / Solution:**
تأكد من وجود CORS headers في `vercel.json`

#### خطأ في البناء / Build Error
**الحل / Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### إصدار سطح المكتب / Desktop Version

لبناء نسخة Electron:
```bash
# Build Electron app
npm run electron:build
```

سيتم إنشاء الملف التنفيذي في مجلد `release/`

---

## الدعم / Support

للمساعدة أو الإبلاغ عن مشاكل / For help or issues:
- افتح issue في GitHub
- راجع [Vercel Documentation](https://vercel.com/docs)
