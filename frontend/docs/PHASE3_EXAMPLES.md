# Phase 3: Frontend Architecture - Implementation Examples

## Component Library Usage

### Button Component
```tsx
import { Button } from '@/components/ui/Button';

// Primary action
<Button variant="primary" onClick={handleSave}>
  Save Changes
</Button>

// With loading state
<Button variant="primary" loading={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>

// With icon
<Button variant="contained" startIcon={<Edit />}>
  Edit Customer
</Button>
```

### Card Components
```tsx
import { InfoCard, StatCard } from '@/components/ui/Card';

// Display structured information
<InfoCard 
  title="Customer Details" 
  icon={<Business />}
  action={<Button size="small">Edit</Button>}
>
  <Stack spacing={2}>
    <Typography><strong>Email:</strong> {customer.email}</Typography>
    <Typography><strong>Phone:</strong> {customer.phone}</Typography>
  </Stack>
</InfoCard>

// Dashboard metrics
<StatCard
  label="Active Customers"
  value={stats.customers}
  icon={<Business />}
  color="success"
  trend={{ value: 12.5, isPositive: true }}
/>
```

### DetailPageLayout
```tsx
import { DetailPageLayout } from '@/components/layouts/DetailPageLayout';

<DetailPageLayout
  breadcrumbs={<AdminBreadcrumbs items={breadcrumbs} />}
  title={customer.name}
  titleIcon={<Business sx={{ fontSize: 32, color: '#6366f1' }} />}
  actions={
    <>
      <Button variant="outlined" onClick={handleDelete}>Delete</Button>
      <Button variant="contained" onClick={handleEdit}>Edit</Button>
    </>
  }
>
  {/* Page content */}
</DetailPageLayout>
```

## Zustand State Management

### Auth Store
```tsx
import { useAuthStore } from '@/stores/authStore';

function LoginPage() {
  const { login, user, isAuthenticated } = useAuthStore();
  
  const handleSubmit = async (email: string, password: string) => {
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error.message);
    }
  };
}

// Selective subscription (better performance)
function UserAvatar() {
  const user = useAuthStore((state) => state.user); // Only re-renders on user change
  return <Avatar src={user?.avatar_url} />;
}
```

### UI Store
```tsx
import { useUIStore } from '@/stores/uiStore';

function CustomerForm() {
  const addToast = useUIStore((state) => state.addToast);
  
  const handleSave = async () => {
    try {
      await saveCustomer();
      addToast('Customer saved successfully!', 'success');
    } catch (error) {
      addToast('Failed to save customer', 'error');
    }
  };
}

// Loading states
function CustomerList() {
  const { setLoading } = useUIStore();
  const isLoading = useUIStore((state) => state.loading['customers']);
  
  const fetchCustomers = async () => {
    setLoading('customers', true);
    try {
      const data = await api.get('/api/v1/admin/customers');
      setCustomers(data);
    } finally {
      setLoading('customers', false);
    }
  };
}
```

## Typed API Client

### Setup
```bash
# Generate TypeScript client from OpenAPI schema
npm run generate:api
```

### Usage
```tsx
import { api } from '@/api/client';

// Type-safe GET request
const customers = await api.get<CustomerResponse[]>('/api/v1/admin/customers');

// Type-safe POST with automatic auth
const newCustomer = await api.post<CustomerResponse>('/api/v1/admin/customers', {
  name: 'Acme Corp',
  email: 'contact@acme.com',
});

// Automatic token refresh on 401
// The client handles token expiration automatically
```

### Custom fetch wrapper
```tsx
import { apiFetch } from '@/api/client';

// For non-JSON responses or custom handling
const response = await apiFetch('/api/v1/documents/download/123');
const blob = await response.blob();
```

## Migration from Old Patterns

### Before (Manual fetch)
```tsx
const response = await fetch('/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  },
});
const user = await response.json();
```

### After (Typed client)
```tsx
import { api } from '@/api/client';
const user = await api.get('/api/v1/auth/me'); // Auth automatic!
```

### Before (Context API)
```tsx
import { useAuth } from '../context/AuthContext';
const { user, logout } = useAuth();
```

### After (Zustand - backwards compatible)
```tsx
import { useAuthStore } from '@/stores/authStore';
const { user, logout } = useAuthStore();

// Or selective subscription
const user = useAuthStore((state) => state.user);
```

## Performance Benefits

### Selective Subscriptions
```tsx
// ❌ Bad: Re-renders on ANY auth state change
const { user, isAuthenticated, accessToken } = useAuthStore();

// ✅ Good: Only re-renders when user changes
const user = useAuthStore((state) => state.user);

// ✅ Good: Multiple specific values
const { user, isAuthenticated } = useAuthStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
}));
```

## Best Practices

1. **Use Components** - Always use library components for consistency
2. **Selective State** - Subscribe only to state you need
3. **Type Safety** - Use the typed API client for all requests
4. **Toasts** - Use UIStore for user feedback, not alert()
5. **Loading States** - Manage in UIStore, not local component state
