# Technical Debt Reduction Plan

**Status:** Draft  
**Created:** 2026-01-31  
**Owner:** Engineering Team

---

## Executive Summary

This document outlines a phased approach to reducing technical debt in the DocuGab platform, focusing on component size reduction, code duplication elimination, and architectural improvements.

**Key Metrics:**
- Largest frontend file: 888 lines (target: <400)
- Largest backend file: 557 lines (target: <300)
- Files >500 lines: 7 frontend, 0 backend
- Duplication severity: Medium-High

---

## Phase 1: Backend Response Builders (Week 1)

### Goals
- Eliminate duplicated response dictionary building
- Improve maintainability of API routes
- Reduce risk of missing fields in responses

### Tasks

#### 1.1 Customer Response Builder
**File:** `backend/app/api/routes/customers.py`  
**Effort:** 2 hours

Create helper function:
```python
def _build_customer_response(
    customer: Customer, 
    projects_count: int = 0
) -> dict:
    """Build standardized customer response dictionary."""
    return {
        "id": customer.id,
        "uuid": customer.uuid,
        "name": customer.name,
        "contact_name": customer.contact_name,
        "contact_phone": customer.contact_phone,
        "email": customer.email,
        "is_docutok_customer": customer.is_docutok_customer,
        "is_active": customer.is_active,
        "created_at": customer.created_at,
        "updated_at": customer.updated_at,
        "projects_count": projects_count,
    }
```

Replace 4 occurrences in:
- `list_customers()` (line 67)
- `get_customer()` (line 112)
- `create_customer()` (line 154)
- `update_customer()` (line 223)

#### 1.2 Verify Project Response Builder
**File:** `backend/app/api/routes/projects.py`  
**Effort:** 1 hour

- Ensure `_build_project_response()` is used consistently
- Add `is_demo` field (already done)
- Document the pattern for future routes

#### 1.3 User Response Builder
**File:** `backend/app/api/routes/users.py`  
**Effort:** 1 hour

Similar pattern to customers.

**Acceptance Criteria:**
- [ ] No duplicated response dictionaries
- [ ] All helpers private (prefixed with `_`)
- [ ] Type hints on all helpers

---

## Phase 2: Backend Route Splitting (Week 2)

### Goals
- Reduce file sizes
- Separate admin and customer concerns
- Improve code navigation

### Tasks

#### 2.1 Split Projects Routes
**Effort:** 4 hours

Create:
- `backend/app/api/routes/admin/projects.py` (admin routes)
- `backend/app/api/routes/customer/projects.py` (customer routes)
- `backend/app/api/routes/projects_shared.py` (shared helpers)

Update `main.py` to register both routers.

#### 2.2 Extract Avatar Business Logic
**File:** `backend/app/api/routes/avatars.py` (399 lines)  
**Effort:** 3 hours

Create `backend/app/services/avatar_service.py`:
- Move avatar generation logic
- Move file handling utilities
- Keep routes thin (API layer only)

**Acceptance Criteria:**
- [ ] No route file exceeds 300 lines
- [ ] Business logic in service layer
- [ ] Routes only handle HTTP concerns

---

## Phase 3: Frontend Component Extraction (Weeks 3-4)

### Goals
- Extract reusable components
- Reduce component sizes
- Improve testability

### 3.1 Shared Components

#### DetailHeader Component
**Effort:** 4 hours

```tsx
interface DetailHeaderProps {
  icon: React.ReactNode;
  title: string;
  onBack?: () => void;
  onEdit?: () => void;
  actions?: React.ReactNode;
}

export function DetailHeader({ 
  icon, 
  title, 
  onBack, 
  onEdit,
  actions 
}: DetailHeaderProps) {
  // Gradient title, back button, edit button
}
```

**Used in:**
- `ProjectDetail.tsx`
- `CustomerDetail.tsx`
- `UserDetail.tsx`

#### StatusBadges Component
**Effort:** 2 hours

```tsx
interface StatusBadgesProps {
  isActive: boolean;
  isDemo?: boolean;
  isDocuTokCustomer?: boolean;
}

export function StatusBadges({
  isActive,
  isDemo,
  isDocuTokCustomer
}: StatusBadgesProps) {
  // Render status, demo, internal chips
}
```

#### EditDialog Component
**Effort:** 6 hours

Generic dialog wrapper for inline editing:
```tsx
interface EditDialogProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FieldConfig<T>[];
  initialValues: T;
  onSave: (values: T) => Promise<void>;
}
```

**Replaces inline dialogs in:**
- `CustomerDetail.tsx`
- `UserDetail.tsx`

### 3.2 Custom Hooks

#### useEntityDetail Hook
**Effort:** 3 hours

```tsx
function useEntityDetail<T>(
  endpoint: string,
  uuid: string
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch, refresh, update logic
  
  return { data, loading, error, refresh };
}
```

**Replaces fetch logic in:**
- All detail pages
- All edit pages

**Acceptance Criteria:**
- [ ] `ProjectDetail.tsx` < 500 lines
- [ ] `CustomerDetail.tsx` < 400 lines
- [ ] `Chat.tsx` < 500 lines (Phase 4)
- [ ] All shared components documented

---

## Phase 4: Chat Component Refactoring (Week 5)

### Goals
- Break down `Chat.tsx` (826 lines)
- Separate concerns (UI, state, business logic)
- Improve testability

### Tasks

#### 4.1 Extract Sub-Components
**Effort:** 8 hours

Create:
- `ChatHeader.tsx` - Project branding, title
- `ChatMessages.tsx` - Message list rendering
- `ChatInput.tsx` - Input field, voice controls
- `ChatSidebar.tsx` - FAQ panel
- `useChat.tsx` - Chat state management hook
- `useSpeech.tsx` - Speech recognition hook

#### 4.2 Extract Business Logic
**Effort:** 4 hours

Move to utilities:
- Message formatting
- Audio handling
- Session management

**Acceptance Criteria:**
- [ ] No component exceeds 200 lines
- [ ] State management in custom hooks
- [ ] Business logic in utilities

---

## Phase 5: Form Management (Week 6)

### Goals
- Standardize form handling
- Reduce boilerplate
- Improve validation

### Tasks

#### 5.1 Implement React Hook Form
**Files:** `ProjectEdit.tsx`, `CustomerProjectEdit.tsx`  
**Effort:** 8 hours

Benefits:
- Automatic validation
- Reduced state management
- Better performance
- Type-safe forms with Zod

Example:
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const projectSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  // ... other fields
});

function ProjectEditForm() {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(projectSchema)
  });
  
  // Simplified form logic
}
```

**Acceptance Criteria:**
- [ ] Forms use React Hook Form
- [ ] Validation schemas defined with Zod
- [ ] Form components < 400 lines

---

## Recommendations

### Code Organization

1. **Adopt Consistent Patterns**
   - Always use helper functions for response building
   - Keep route handlers thin (delegate to services)
   - Extract shared UI components early

2. **File Size Limits**
   - Backend routes: 300 lines max
   - Frontend components: 400 lines max
   - Service/utility files: 200 lines max
   - When approaching limit, refactor immediately

3. **Component Structure**
   - One component per file
   - Co-locate related components in directories
   - Use index.ts for clean exports

### Architecture

1. **Backend Layering**
   ```
   Routes (HTTP) → Services (Business Logic) → Models (Data)
   ```
   - Routes: Request/response handling only
   - Services: Reusable business logic
   - Models: Database operations

2. **Frontend Composition**
   ```
   Pages → Feature Components → Shared Components → UI Primitives
   ```
   - Pages: Route-level components
   - Features: Domain-specific components
   - Shared: Cross-domain components
   - Primitives: Basic UI elements

3. **State Management**
   - Local state: `useState` for component state
   - Shared state: Context for app-wide state
   - Server state: Custom hooks wrapping fetch
   - Consider Zustand or Jotai for complex state

### Testing Strategy

1. **Unit Tests**
   - Test helpers and utilities first
   - Aim for 80% coverage on business logic
   - Mock external dependencies

2. **Integration Tests**
   - Test API routes with in-memory database
   - Test component integration with React Testing Library

3. **E2E Tests**
   - Critical user flows (chat, document upload)
   - Admin workflows (customer/project management)

### Development Workflow

1. **Pre-commit Checks**
   - Lint and format all files
   - Run type checking
   - Check file sizes (warning at thresholds)

2. **Code Review Guidelines**
   - No file should exceed size limits
   - New components should be composable
   - Shared logic must be extracted

3. **Refactoring Schedule**
   - Dedicate 20% of sprint to tech debt
   - Refactor before adding major features
   - Document architectural decisions

### Tools and Libraries

1. **Recommended Additions**
   - `zod` - Runtime type validation
   - `react-hook-form` - Form management
   - `zustand` - Lightweight state management
   - `vitest` - Fast unit testing

2. **Code Quality**
   - ESLint with strict rules
   - Prettier for formatting
   - TypeScript strict mode
   - Pre-commit hooks (husky + lint-staged)

### Metrics and Monitoring

1. **Track Progress**
   - File size distribution
   - Code duplication percentage
   - Test coverage
   - Build time

2. **Quality Gates**
   - Block PRs with files >500 lines
   - Require tests for new features
   - Enforce type coverage >90%

---

## Timeline Summary

| Phase | Duration | Complexity | Priority |
|-------|----------|------------|----------|
| 1. Backend Helpers | 1 week | Low | High |
| 2. Route Splitting | 1 week | Medium | High |
| 3. Component Extraction | 2 weeks | Medium | High |
| 4. Chat Refactor | 1 week | High | Medium |
| 5. Form Management | 1 week | Medium | Medium |

**Total Estimated Effort:** 6 weeks (1.5 sprints)

---

## Success Criteria

- [ ] No frontend files exceed 500 lines
- [ ] No backend files exceed 300 lines
- [ ] Response builders used in all routes
- [ ] Shared components extracted and documented
- [ ] Chat component broken into <200 line pieces
- [ ] Forms use React Hook Form
- [ ] Test coverage >70%

---

## Appendix: File Size Reference

### Current State (2026-01-31)

**Frontend (>500 lines):**
- ProjectDetail.tsx: 888
- Chat.tsx: 826
- Projects.tsx: 716
- ProjectEdit.tsx: 714
- CustomerDetail.tsx: 703
- CustomerProjectEdit.tsx: 692
- CustomerProjectDetail.tsx: 595

**Backend (>300 lines):**
- projects.py: 557
- avatars.py: 399
- database.py: 318
