# Customer Account Page

## Overview

Add a dedicated Account page to the customer portal that displays customer information and lists all users associated with that customer account.

## Goals

- Provide customers with visibility into their account details
- Display all users associated with the customer account
- Add intuitive navigation to access account information
- Enable customers to understand their account structure and user roster

## Proposed Changes

### Frontend Components

#### New Page: `CustomerAccount.tsx`

**Location:** `frontend/src/pages/customer/CustomerAccount.tsx`

**Sections:**

1. **Account Information Card**
   - Company/Customer name
   - Account status (Active/Inactive)
   - Account type (if applicable - e.g., Demo, Internal, Standard)
   - Created date
   - Contact email (if available)
   - Storage usage (if tracked)

2. **Users Table**
   - Displays all users associated with the customer
   - Columns:
     - Full Name
     - Email
     - Role (if customer users have roles)
     - Status (Active/Inactive, Verified/Unverified)
     - Last Login (if tracked)
     - Created date
   - Sorting capabilities (alphabetical by name/email, date)
   - Empty state message if no users

**UI Design:**
- Consistent with existing customer pages (gradient backgrounds, card-based layout)
- Breadcrumbs: Account
- Header with Account icon and title
- Use same DetailRow pattern for account metadata
- Table with MUI components matching CustomerProjects style

### Navigation Updates

#### `CustomerSidebar.tsx`

Add new menu item:
```typescript
{ label: 'Account', icon: <AccountCircle />, path: '/customer/account' }
```

**Menu Order:**
1. Dashboard
2. Chatbot Projects
3. **Account** (new)
4. Settings
5. Profile

### Routing

#### `App.tsx`

Add new route:
```typescript
<Route path="/customer/account" element={
  <ProtectedRoute requireCustomer>
    <CustomerAccount />
  </ProtectedRoute>
} />
```

### Backend - API Endpoint

**New Endpoint (or utilize existing):**

`GET /api/customer/account`

**Response:**
```json
{
  "customer": {
    "id": 1,
    "uuid": "...",
    "name": "Acme Corp",
    "email": "contact@acme.com",
    "is_active": true,
    "is_docutok_customer": false,
    "is_demo": false,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-02-01T09:00:00Z"
  },
  "users": [
    {
      "id": 1,
      "uuid": "...",
      "email": "john@acme.com",
      "full_name": "John Doe",
      "is_active": true,
      "is_verified": true,
      "created_at": "2024-01-15T10:30:00Z",
      "last_login": "2024-02-01T08:45:00Z"
    }
  ]
}
```

**Note:** If customer data is already available via existing endpoints (e.g., user context), the API can be simplified to just fetch the users list.

### Implementation Steps

1. **Backend (if needed)**
   - Create or verify `/api/customer/account` endpoint
   - Ensure proper customer association and authorization
   - Add last_login tracking to User model (if not already present)

2. **Frontend - Component**
   - Create `CustomerAccount.tsx` component
   - Implement account info card with DetailRow components
   - Build users table with sorting
   - Add loading and error states

3. **Frontend - Navigation**
   - Add AccountCircle icon import to CustomerSidebar
   - Add Account menu item
   - Update route in App.tsx

4. **Testing**
   - Verify account information displays correctly
   - Test users table with various user counts (0, 1, many)
   - Confirm authorization (only customer users can access)
   - Test responsive layout on mobile/tablet

## Recommendations

### User Management Features

Consider adding these features in future iterations:

1. **Invite New Users**
   - Add "Invite User" button on Account page
   - Modal or page to send email invitations
   - Customers can add colleagues to their account
   - Requires email verification flow

2. **User Permissions**
   - If customer accounts have multiple users, consider role-based permissions
   - Roles: Account Owner, Admin, Member (read-only)
   - Account Owner can manage other users
   - Restrict certain actions (delete projects, modify account) to Account Owner

3. **Deactivate Users**
   - Account Owners can deactivate users
   - Soft delete to preserve audit trail
   - Confirmation modal for user removal

4. **Activity Log**
   - Show recent account activity
   - User logins, project changes, document uploads
   - Helps with account security and awareness

5. **Billing Integration**
   - If DocuGab has tiered pricing or seat-based billing
   - Display current plan, user count, billing status
   - Link to upgrade/manage subscription

### Account Settings

Consider moving some settings from the generic Settings page to Account:

- **Account-level settings** (affects all users):
  - Company name
  - Default language
  - Timezone
  - Notification preferences for all users

- **User-level settings** (remains in Settings page):
  - Personal avatar
  - Individual timezone override
  - Theme preference

### Security & Privacy

1. **Audit Trail**
   - Track who viewed the Account page
   - Log user management actions

2. **Data Export**
   - "Download User List" button (CSV export)
   - Account data export for GDPR compliance

3. **Two-Factor Authentication**
   - Enable 2FA at account level
   - Require all users to set up 2FA

### UI/UX Enhancements

1. **User Avatars**
   - Display user profile pictures in the table
   - Fallback to initials if no avatar

2. **User Status Indicators**
   - Visual badges for verified/unverified
   - "Last seen" timestamp or online status

3. **Search/Filter**
   - Search users by name/email
   - Filter by status (Active/Inactive)

4. **Pagination**
   - If customer accounts can have many users (>20)
   - Implement table pagination or virtual scrolling

## Open Questions

1. **User Roles:** Do customer users have different roles (e.g., Admin vs Member)?
2. **Last Login Tracking:** Is `last_login` currently tracked in the User model?
3. **Account Owner:** Is there a concept of an "account owner" or primary contact?
4. **Self-Service User Management:** Should customers be able to invite/remove users themselves, or is this admin-only?
5. **Multi-Tenancy:** How are customer users currently associated with customers in the database?

## Success Metrics

- Customers can easily view their account information
- Users table displays accurately with proper sorting
- Page loads quickly with minimal API calls
- Responsive design works on all screen sizes
- Clear next steps for user management (if implemented)
