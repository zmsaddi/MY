# 🎨 Metal Sheets Management - Design System Guide

## Overview

This design system provides a comprehensive set of tokens, components, and patterns for building consistent, accessible, and professional interfaces across the Metal Sheets Management System.

---

## 📐 Design Tokens

### Colors

```javascript
Primary: #1565c0 (Blue - trust, professionalism)
Secondary: #c62828 (Red - important actions, alerts)
Success: #2e7d32 (Green - positive outcomes)
Warning: #f57c00 (Orange - cautions)
Error: #c62828 (Red - errors, destructive actions)
Info: #0277bd (Light Blue - informational)

Text:
- Primary: rgba(0, 0, 0, 0.90)
- Secondary: rgba(0, 0, 0, 0.70)
- Disabled: rgba(0, 0, 0, 0.45)

Background:
- Default: #f5f5f5
- Paper: #ffffff
```

### Spacing Scale

```
xs: 4px   (0.5 units)
sm: 8px   (1 unit)
md: 16px  (2 units)
lg: 24px  (3 units)
xl: 32px  (4 units)
xxl: 48px (6 units)
```

### Border Radius

```
sm: 4px
md: 8px   (standard for buttons, inputs)
lg: 12px  (cards, dialogs)
xl: 16px
full: 9999px (pills, badges)
```

### Typography

```
Font Family: Cairo, Roboto, system fonts
Base Size: 14px (mobile), 16px (desktop)

Sizes:
- xs: 0.75rem (12px)
- sm: 0.875rem (14px)
- base: 1rem (16px)
- md: 1.125rem (18px)
- lg: 1.25rem (20px)
- xl: 1.5rem (24px)
- xxl: 2rem (32px)

Weights:
- light: 300
- regular: 400
- medium: 500
- semibold: 600
- bold: 700
```

### Shadows

```
xs: 0 1px 2px rgba(0,0,0,0.05)
sm: 0 2px 4px rgba(0,0,0,0.08)
md: 0 4px 8px rgba(0,0,0,0.10)
lg: 0 8px 16px rgba(0,0,0,0.12)
xl: 0 16px 32px rgba(0,0,0,0.14)
```

---

## 🧩 Components

### Buttons

**Variants:**
- `contained` - Primary actions (default)
- `outlined` - Secondary actions
- `text` - Tertiary actions

**Sizes:**
- `small` - 32px height
- `medium` - 40px height (default)
- `large` - 48px height

**Usage:**
```jsx
import { Button } from '@mui/material';

<Button variant="contained" color="primary">حفظ</Button>
<Button variant="outlined" color="secondary">إلغاء</Button>
<Button variant="text">المزيد</Button>
```

**Best Practices:**
- ✅ Use `contained` for primary actions
- ✅ Use `outlined` for secondary actions
- ✅ Use `text` for tertiary or less important actions
- ✅ Always provide clear, action-oriented labels
- ✅ Disable during async operations
- ❌ Don't use more than one primary button per section

### Form Fields

**Pattern: Label Above Field**

```jsx
import { FormField } from '../components/ui/FormField';

<FormField
  label="اسم الزبون"
  name="customer_name"
  value={formData.customer_name}
  onChange={handleChange}
  error={errors.customer_name}
  required
  helperText="أدخل الاسم الكامل"
/>
```

**Structure:**
1. **Label** (above field)
   - Font size: 0.875rem
   - Font weight: 500
   - Required asterisk (*) in red if field is required

2. **Input Field**
   - Min height: 44px (touch-friendly)
   - Border radius: 8px
   - Focus: 2px blue outline with offset

3. **Helper Text / Error Message** (below field)
   - Font size: 0.75rem
   - Color: text.secondary (gray) or error.main (red)

**Best Practices:**
- ✅ Always use labels (not placeholders as primary labels)
- ✅ Mark required fields with asterisk
- ✅ Provide clear error messages
- ✅ Use helper text for format examples
- ❌ Don't rely solely on placeholders
- ❌ Don't use labels as placeholders

### Dialogs / Modals

**Unified Dialog System:**

```jsx
import { UnifiedDialog } from '../components/common/dialogs/UnifiedDialog';

<UnifiedDialog
  open={open}
  onClose={handleClose}
  title="تأكيد الحذف"
  content="هل أنت متأكد من حذف هذا السجل؟"
  variant="destructive"
  primaryLabel="حذف"
  secondaryLabel="إلغاء"
  onPrimaryClick={handleDelete}
  requireAcknowledgement
  acknowledgementLabel="أؤكد تنفيذ الحذف"
/>
```

**Variants:**
- `confirm` - Standard confirmation (blue)
- `destructive` - Dangerous actions (red)
- `info` - Informational (light blue)

**Best Practices:**
- ✅ Use `destructive` variant for delete/remove actions
- ✅ Require acknowledgement checkbox for irreversible actions
- ✅ Disable backdrop/escape close for critical dialogs
- ✅ Provide clear, descriptive titles
- ✅ Keep content concise
- ❌ Don't nest dialogs
- ❌ Don't use for simple confirmations that could be inline

### Tables

**Responsive Tables:**

```jsx
import { ResponsiveTable } from '../components/common/ResponsiveTable';

<ResponsiveTable
  headers={[
    { key: 'name', label: t('common.name') },
    { key: 'phone', label: t('common.phone') },
    { key: 'balance', label: t('common.balance'), align: 'right' }
  ]}
  data={customers}
  onRowClick={handleRowClick}
  emptyMessage={t('customers.noCustomers')}
/>
```

**Best Practices:**
- ✅ Use sticky headers on mobile
- ✅ Provide horizontal scroll for wide tables
- ✅ Right-align numerical columns
- ✅ Use consistent formatting (formatters.js)
- ✅ Provide empty states
- ❌ Don't overwhelm with too many columns
- ❌ Don't forget mobile optimization

---

## 🌍 Internationalization (i18n)

### Translation Keys

```jsx
import { useTranslation } from '../contexts/TranslationContext';

const { t } = useTranslation();

<Typography>{t('common.save')}</Typography>
<Button>{t('customers.addCustomer')}</Button>
```

### Number Formatting

**Always use Latin numerals (123) for all languages:**

```jsx
import { fmt } from '../utils/formatters';

<Typography>{fmt(12345.67)}</Typography> // 12,345.67
```

**Best Practices:**
- ✅ Use translation keys for all text
- ✅ Use Latin numerals (123) always
- ✅ Use formatters for numbers, currency, dates
- ❌ Never hardcode text strings
- ❌ Never use Eastern Arabic numerals (١٢٣) in UI

---

## ♿ Accessibility (WCAG 2.1 AA)

### Color Contrast

All text must meet WCAG AA standards:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

### Keyboard Navigation

- ✅ All interactive elements must be keyboard accessible
- ✅ Focus indicators must be visible (2px outline with offset)
- ✅ Tab order must be logical
- ✅ Escape key closes dialogs
- ✅ Enter key submits forms

### ARIA Labels

```jsx
<Button aria-label={t('common.save')}>
  <SaveIcon />
</Button>

<TextField
  aria-label={t('customers.name')}
  aria-required="true"
  aria-invalid={Boolean(error)}
  aria-describedby="name-helper-text"
/>
```

### Touch Targets

- Minimum size: 44px × 44px
- Applies to: buttons, links, form fields, checkboxes, radio buttons

### Screen Readers

- ✅ Provide meaningful labels
- ✅ Use semantic HTML
- ✅ Announce dynamic content changes
- ✅ Indicate required fields
- ✅ Provide error messages

---

## 📱 Responsive Design

### Breakpoints

```
xs: 0px     (mobile portrait)
sm: 600px   (mobile landscape, small tablet)
md: 960px   (tablet)
lg: 1280px  (desktop)
xl: 1920px  (large desktop)
```

### Grid System

Use Material-UI Grid with 12-column layout:

```jsx
<Grid container spacing={2}>
  <Grid item xs={12} sm={6} md={4}>
    <Card>Content</Card>
  </Grid>
</Grid>
```

### Mobile-First Approach

- Design for mobile first
- Progressively enhance for larger screens
- Test on actual devices
- Touch-friendly targets (44px minimum)
- Avoid hover-dependent interactions

---

## 🎭 RTL/LTR Support

### Automatic Direction

The app automatically detects language and applies correct direction:
- Arabic → RTL (right-to-left)
- English → LTR (left-to-right)

### Layout Considerations

- Use `margin-inline-start` instead of `margin-left`
- Use `padding-inline-end` instead of `padding-right`
- Icons and layout flip automatically
- Numbers always display as Latin (123)

### Implementation

```jsx
import { useTranslation } from '../contexts/TranslationContext';

const { isRTL } = useTranslation();

<Box sx={{
  marginInlineStart: 2,  // Correct
  marginLeft: 2,         // Wrong - doesn't flip for RTL
}}>
```

---

## 🚀 Performance

### Code Splitting

```jsx
import { lazy, Suspense } from 'react';

const CustomersTab = lazy(() => import('./tabs/CustomersTab'));

<Suspense fallback={<CircularProgress />}>
  <CustomersTab />
</Suspense>
```

### Image Optimization

- Use appropriate formats (WebP, AVIF)
- Provide multiple sizes (srcset)
- Lazy load below-the-fold images
- Compress images

### Animations

- Respect `prefers-reduced-motion`
- Keep animations under 300ms
- Use CSS transforms for performance
- Avoid animating expensive properties (width, height)

---

## 📋 Best Practices Checklist

### Before Committing Code

- [ ] All text uses translation keys (no hardcoded strings)
- [ ] Numbers display as Latin (123) not Arabic (١٢٣)
- [ ] Touch targets are 44px minimum
- [ ] Focus indicators are visible
- [ ] ARIA labels provided for icons/images
- [ ] Forms have labels above fields
- [ ] Required fields marked with asterisk
- [ ] Error messages are clear and helpful
- [ ] Tested in both RTL and LTR
- [ ] Tested on mobile viewport
- [ ] No console errors or warnings
- [ ] Follows existing patterns

---

## 📚 Component Reference

### Available Components

**Layout:**
- `Container` - Max-width centered container
- `Grid` - Responsive grid system
- `Stack` - Vertical/horizontal stack
- `Box` - Generic container

**Navigation:**
- `Tabs` - Tab navigation
- `Breadcrumbs` - Breadcrumb trail
- `Menu` - Dropdown menu
- `Drawer` - Side drawer/sheet

**Data Display:**
- `Table` - Data table
- `Card` - Content card
- `Chip` - Tag/badge
- `List` - List of items
- `Typography` - Text element

**Inputs:**
- `TextField` - Text input
- `Select` - Dropdown select
- `Checkbox` - Checkbox input
- `Radio` - Radio button
- `Switch` - Toggle switch
- `DatePicker` - Date input

**Feedback:**
- `Alert` - Alert message
- `Snackbar` - Toast notification
- `Progress` - Progress indicator
- `Skeleton` - Loading placeholder
- `Dialog` - Modal dialog

**Forms:**
- `UnifiedFormDialog` - Form in dialog
- `UnifiedFormField` - Labeled form field
- `FormControl` - Form field wrapper
- `FormLabel` - Field label

---

## 🆘 Common Issues & Solutions

### Issue: Text not translating

**Solution:** Use translation keys
```jsx
// ❌ Wrong
<Typography>إضافة زبون</Typography>

// ✅ Correct
<Typography>{t('customers.addCustomer')}</Typography>
```

### Issue: Numbers showing as Arabic numerals

**Solution:** Use formatters
```jsx
// ❌ Wrong
<Typography>{amount.toLocaleString('ar-SY')}</Typography>

// ✅ Correct
<Typography>{fmt(amount)}</Typography>
```

### Issue: Layout broken in RTL

**Solution:** Use logical properties
```jsx
// ❌ Wrong
<Box sx={{ marginLeft: 2 }}>

// ✅ Correct
<Box sx={{ marginInlineStart: 2 }}>
```

### Issue: Touch targets too small

**Solution:** Ensure minimum 44px
```jsx
// ❌ Wrong
<IconButton sx={{ width: 32, height: 32 }}>

// ✅ Correct
<IconButton sx={{ width: 44, height: 44 }}>
```

---

## 📞 Support & Resources

- **Design System:** `src/theme/designSystem.js`
- **Tokens:** `src/theme/tokens.js`
- **Theme:** `src/utils/theme.js`
- **Translations:** `src/utils/translations.js`
- **Formatters:** `src/utils/formatters.js`
- **Components:** `src/components/common/`

---

**Last Updated:** 2025-10-11
**Version:** 1.0.0
**Status:** ✅ Production Ready
