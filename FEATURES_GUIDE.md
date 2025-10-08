# New Features Usage Guide

## 🎯 Reusable Components

### 1. TableWithPagination

Replace your existing table + pagination code with this single component:

```jsx
import TableWithPagination from '../components/common/TableWithPagination';

function MyComponent() {
  const data = [...]; // your data array

  const columns = [
    { field: 'id', header: 'ID', align: 'center' },
    { field: 'name', header: 'الاسم' },
    {
      field: 'price',
      header: 'السعر',
      render: (row) => `$${row.price.toFixed(2)}`  // Custom rendering
    },
  ];

  return (
    <TableWithPagination
      data={data}
      columns={columns}
      initialRowsPerPage={25}
      onRowClick={(row) => console.log('Clicked:', row)}
      emptyState={<EmptyState title="لا توجد بيانات" />}
    />
  );
}
```

### 2. SearchBar (with auto-debounce)

```jsx
import SearchBar from '../components/common/SearchBar';

function MyComponent() {
  const [filteredData, setFilteredData] = useState([]);

  const handleSearch = (searchTerm) => {
    // This only runs 300ms after user stops typing
    const filtered = data.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  };

  return (
    <SearchBar
      onSearch={handleSearch}
      placeholder="بحث..."
      debounceMs={300}
    />
  );
}
```

### 3. ConfirmDialog

Replace `window.confirm()` with a styled dialog:

```jsx
import ConfirmDialog from '../components/common/ConfirmDialog';

function MyComponent() {
  const [openConfirm, setOpenConfirm] = useState(false);

  const handleDelete = () => {
    setOpenConfirm(true);
  };

  const handleConfirm = () => {
    // Do the delete
    deleteItem();
  };

  return (
    <>
      <Button onClick={handleDelete}>حذف</Button>

      <ConfirmDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={handleConfirm}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا العنصر؟"
        confirmColor="error"
      />
    </>
  );
}
```

### 4. EmptyState

```jsx
import EmptyState from '../components/common/EmptyState';
import InventoryIcon from '@mui/icons-material/Inventory';

function MyComponent() {
  const hasData = data.length > 0;

  return (
    <>
      {!hasData && (
        <EmptyState
          icon={InventoryIcon}
          title="لا توجد صفائح في المخزون"
          description="ابدأ بإضافة صفيحة جديدة"
          actionLabel="إضافة صفيحة"
          onAction={() => setOpenDialog(true)}
        />
      )}
    </>
  );
}
```

## 🪝 Custom Hooks

### 1. useDebounce

```jsx
import { useDebounce } from '../utils/hooks';

function MyComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    // This only runs 500ms after searchTerm stops changing
    console.log('Searching for:', debouncedSearch);
  }, [debouncedSearch]);

  return <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />;
}
```

### 2. usePagination

```jsx
import { usePagination } from '../utils/hooks';

function MyComponent() {
  const data = [...]; // your data

  const {
    page,
    rowsPerPage,
    paginatedData,
    handleChangePage,
    handleChangeRowsPerPage,
    totalRows
  } = usePagination(data, 25);

  return (
    <>
      {paginatedData.map(item => <div key={item.id}>{item.name}</div>)}

      <TablePagination
        count={totalRows}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
}
```

### 3. useKeyboardShortcut

```jsx
import { useKeyboardShortcut } from '../utils/hooks';

function MyComponent() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Ctrl+N to open dialog
  useKeyboardShortcut('n', () => setDialogOpen(true), { ctrl: true });

  // Escape to close
  useKeyboardShortcut('Escape', () => setDialogOpen(false));

  return <Dialog open={dialogOpen}>...</Dialog>;
}
```

### 4. useAutoSave (Form Draft)

```jsx
import { useAutoSave } from '../utils/hooks';
import DraftAlert from '../components/common/DraftAlert';

function SaleForm() {
  const {
    formData,
    updateFormData,
    clearDraft,
    hasDraft
  } = useAutoSave('sale-form', { customer: '', total: 0 }, 30000); // auto-save every 30s

  const handleRestore = () => {
    // formData already contains the saved draft
    console.log('Restored:', formData);
  };

  const handleSubmit = () => {
    // Save to database
    saveSale(formData);
    // Clear the draft
    clearDraft();
  };

  return (
    <>
      <DraftAlert
        show={hasDraft}
        onRestore={handleRestore}
        onDiscard={clearDraft}
      />

      <TextField
        value={formData.customer}
        onChange={e => updateFormData({ customer: e.target.value })}
      />

      <Button onClick={handleSubmit}>حفظ</Button>
    </>
  );
}
```

### 5. useLocalStorage

```jsx
import { useLocalStorage } from '../utils/hooks';

function MyComponent() {
  const [settings, setSettings, clearSettings] = useLocalStorage('user-settings', {
    theme: 'light',
    language: 'ar'
  }, 1000); // auto-save after 1 second of inactivity

  return (
    <>
      <Select value={settings.theme} onChange={e => setSettings({ ...settings, theme: e.target.value })}>
        <MenuItem value="light">فاتح</MenuItem>
        <MenuItem value="dark">داكن</MenuItem>
      </Select>

      <Button onClick={clearSettings}>إعادة تعيين</Button>
    </>
  );
}
```

### 6. useMediaQuery

```jsx
import { useMediaQuery } from '../utils/hooks';

function MyComponent() {
  const isMobile = useMediaQuery('(max-width: 600px)');
  const isTablet = useMediaQuery('(min-width: 601px) and (max-width: 959px)');
  const isDesktop = useMediaQuery('(min-width: 960px)');

  return (
    <>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </>
  );
}
```

### 7. useOnlineStatus

```jsx
import { useOnlineStatus } from '../utils/hooks';

function MyComponent() {
  const isOnline = useOnlineStatus();

  return (
    <>
      {!isOnline && (
        <Alert severity="warning">
          أنت غير متصل بالإنترنت
        </Alert>
      )}
    </>
  );
}
```

### 8. useClickOutside

```jsx
import { useClickOutside } from '../utils/hooks';

function Dropdown() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  return (
    <div ref={ref}>
      <Button onClick={() => setOpen(!open)}>القائمة</Button>
      {open && <Menu>...</Menu>}
    </div>
  );
}
```

### 9. usePrevious

```jsx
import { usePrevious } from '../utils/hooks';

function MyComponent({ value }) {
  const previousValue = usePrevious(value);

  useEffect(() => {
    console.log(`Changed from ${previousValue} to ${value}`);
  }, [value, previousValue]);

  return <div>Current: {value}, Previous: {previousValue}</div>;
}
```

## ⌨️ Keyboard Shortcuts

Available shortcuts in the main app:

| Shortcut | Action |
|----------|--------|
| `Ctrl + 1` | Go to Dashboard |
| `Ctrl + 2` | Go to Sales |
| `Ctrl + 3` | Go to Customers |
| `Ctrl + 4` | Go to Suppliers |
| `Ctrl + 5` | Go to Inventory |
| `Ctrl + M` | Toggle mobile menu |

## 📦 Inventory Sub-Components

### SheetFilters

```jsx
import SheetFilters from '../components/inventory/SheetFilters';

function InventoryTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetalType, setFilterMetalType] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  // ... other filter states

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterMetalType('');
    setFilterThkMin('');
    setFilterThkMax('');
    // ... reset all
  };

  return (
    <SheetFilters
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      filterMetalType={filterMetalType}
      onMetalTypeChange={setFilterMetalType}
      metalTypes={metalTypes}
      showAdvanced={showAdvanced}
      onToggleAdvanced={setShowAdvanced}
      onResetFilters={handleResetFilters}
      // ... other props
    />
  );
}
```

### InventoryStats

```jsx
import InventoryStats from '../components/inventory/InventoryStats';

function InventoryTab() {
  const sheets = [...]; // your sheets data
  const baseCurrencySymbol = '$';

  return (
    <InventoryStats
      sheets={sheets}
      baseCurrencySymbol={baseCurrencySymbol}
    />
  );
}
```

## 🎨 Best Practices

### 1. Always use PropTypes

```jsx
import PropTypes from 'prop-types';

function MyComponent({ name, age, onSave }) {
  return <div>{name}</div>;
}

MyComponent.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number,
  onSave: PropTypes.func.isRequired,
};
```

### 2. Use React.memo for performance

```jsx
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  // This only re-renders when 'data' changes
  return <div>{/* expensive rendering */}</div>;
});
```

### 3. Use useCallback for event handlers

```jsx
import { useCallback } from 'react';

function MyComponent() {
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []); // Only created once

  return <Button onClick={handleClick}>Click</Button>;
}
```

### 4. Debounce search inputs

```jsx
// ✅ Good - uses debounce
import SearchBar from '../components/common/SearchBar';

// ❌ Bad - re-renders on every keystroke
<TextField onChange={e => filterData(e.target.value)} />
```

## 🚀 Migration Tips

### Converting existing tables:

**Before:**
```jsx
<TableContainer>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Name</TableCell>
        <TableCell>Price</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {data.map(row => (
        <TableRow key={row.id}>
          <TableCell>{row.name}</TableCell>
          <TableCell>{row.price}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
<TablePagination ... />
```

**After:**
```jsx
<TableWithPagination
  data={data}
  columns={[
    { field: 'name', header: 'Name' },
    { field: 'price', header: 'Price' }
  ]}
/>
```

---

**Need help?** Check the component source code - all components have detailed JSDoc comments!
