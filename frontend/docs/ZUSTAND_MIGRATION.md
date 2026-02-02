# Zustand Migration Guide

## Overview

Migrating from React Context API to Zustand for state management. This provides better performance, simpler API, and built-in persistence.

## What Changed

### Old Pattern (Context API)
```tsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();
  // ...
}
```

### New Pattern (Zustand)
```tsx
import { useAuthStore } from '../stores/authStore';

function MyComponent() {
  const { user, login, logout } = useAuthStore();
  // ...
}
```

## Migration Steps

### Step 1: Update Imports

**Before:**
```tsx
import { useAuth } from '../context/AuthContext';
```

**After:**
```tsx
import { useAuthStore } from '../stores/authStore';
// or
import { useAuth } from '../context/AuthProvider'; // Backwards compatible
```

### Step 2: Use the Hook

The API is the same! No changes needed to your component logic:

```tsx
function Login() {
  const { login, user, isAuthenticated } = useAuthStore();
  
  const handleSubmit = async (email: string, password: string) => {
    try {
      await login(email, password);
      // user is automatically fetched and set
    } catch (error) {
      console.error(error.message);
    }
  };
  
  // Same as before!
}
```

### Step 3: Selective State Subscription

**Big Advantage:** With Zustand, you can subscribe to only the state you need:

```tsx
// Only re-renders when user changes, not when loading changes
const user = useAuthStore((state) => state.user);

// Only re-renders when isAuthenticated changes
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

// Multiple values
const { user, isAuthenticated } = useAuthStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
}));
```

## Store APIs

### Auth Store

```tsx
import { useAuthStore } from '../stores/authStore';

// State
const user = useAuthStore((state) => state.user);
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

// Actions
const { login, logout, register, refreshUser } = useAuthStore();

// Usage
await login('email@example.com', 'password');
await register('email@example.com', 'password', 'Full Name');
await logout();
await refreshUser();
```

### UI Store

```tsx
import { useUIStore } from '../stores/uiStore';

// Toasts
const addToast = useUIStore((state) => state.addToast);
addToast('Operation successful!', 'success');
addToast('Error occurred', 'error');

// Loading states
const { setLoading } = useUIStore();
setLoading('fetchingCustomers', true);
// ... do work
setLoading('fetchingCustomers', false);

// Check loading
const isLoading = useUIStore((state) => state.loading['fetchingCustomers']);

// Sidebar
const { sidebarOpen, toggleSidebar } = useUIStore();
```

## Backwards Compatibility

For gradual migration, `AuthProvider.tsx` exports a `useAuth` hook that is an alias for `useAuthStore`:

```tsx
// These are equivalent:
import { useAuth } from '../context/AuthProvider';
import { useAuthStore as useAuth } from '../stores/authStore';

// Both work the same way
const { user, login } = useAuth();
```

This means **existing code doesn't break**. You can migrate incrementally.

## Benefits

1. **Performance**: Components only re-render for state they subscribe to
2. **DevTools**: Zustand has Redux DevTools support
3. **Persistence**: Auth state persists to localStorage automatically
4. **Simpler**: No Provider wrapper needed, use anywhere
5. **TypeScript**: Full type safety with better inference

## Files Modified

- ✅ `src/stores/authStore.ts` - New auth store
- ✅ `src/stores/uiStore.ts` - New UI store  
- ✅ `src/context/AuthProvider.tsx` - Updated to use Zustand
- 🔄 Components - Gradually migrate from `useAuth` imports

## Next Steps

1. Update imports in components from `AuthContext` to `authStore`
2. Use selective subscriptions for better performance
3. Remove old `AuthContext.tsx` once migration complete
