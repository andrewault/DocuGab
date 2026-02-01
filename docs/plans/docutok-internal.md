# DocuTok Internal & Demo Configuration

## Overview
This plan outlines the implementation of two critical system-level flags:
1.  **Demo Project (`is_demo`)**: Designates the single project tailored for the public `/chat` demo.
2.  **Internal Customer (`is_docutok_customer`)**: Designates the single organization representing DocuTok itself (for administrative/internal use).

Both flags enforce a **Mutual Exclusivity** constraint: only one record in the corresponding table can have the flag set to `True` at any time. Setting the flag on a new record automatically unsets it on the previous holder.

---

## 1. Project Model: `is_demo`

### Database Changes
- Add column `is_demo` (Boolean, default `False`) to the `projects` table.
- **Constraint Enforcement**: Handled via application logic (in service layer) during create/update.
  - When a project sets `is_demo=True`, update all other projects to `is_demo=False`.

### API & Logic
- **Admin Endpoints**:
  - `GET /admin/projects/:uuid`: Return `is_demo` status.
  - `PATCH /admin/projects/:uuid`: Allow setting `is_demo=True`. Trigger the exclusivity logic.
- **Public Chat Endpoint**:
  - `GET /api/chat/config` (or similar): Update logic availability to dynamically load the project where `is_demo=True` instead of a hardcoded ID/UUID.

### UI Changes
- **Project Detail** (`/admin/projects/:uuid`):
  - Display a "Public Demo" badge if active.
- **Project Edit** (`/admin/projects/:uuid/edit`):
  - Add a toggle switch: "Set as Public Demo Project".
  - Include a warning: *"Enabling this will disable the demo flag for any other project."*

---

## 2. Customer Model: `is_docutok_customer`

### Database Changes
- Add column `is_docutok_customer` (Boolean, default `False`) to the `customers` table.
- **Constraint Enforcement**: Handled via application logic (service layer).

### API & Logic
- **Admin Endpoints**:
  - `GET /admin/customers/:uuid`: Return `is_docutok_customer` status.
  - `PATCH /admin/customers/:uuid`: Allow setting `is_docutok_customer=True`. Trigger exclusivity logic.
- **Internal Logic**:
  - This flag allows the system to identify "Internal" users vs "client" users reliably without hardcoding IDs or string matching on names.

### UI Changes
- **Customer Detail** (`/admin/customers/:uuid`):
  - Display "Internal Organization" badge/status.
- **Customer Edit** (`/admin/customers/:uuid/edit`):
  - Add a toggle switch: "Internal DocuTok Customer".
  - Include a warning: *"This designates the organization as the platform owner. Only one customer can hold this status."*

---

## 3. Recommendations & Future Considerations

### A. Automated Demo Reset
To maintain a pristine experience for public visitors, implement a nightly job (Cron/Celery) that resets the **Demo Project**:
- Clears user conversations older than 24 hours.
- Reverts any modifications to the project settings (documents, prompts) to a "Golden State".

### B. Internal Feature Flagging
Use the `is_docutok_customer` flag to gate internal-only features:
- **Admin Tools**: Users belonging to the DocuTok Customer could automatically get elevated non-admin privileges (e.g., "Support Agent" view).
- **Beta Testing**: Deploy new features to the Internal Customer first before general release.

### C. Onboarding Templating
Use the projects belonging to the `is_docutok_customer` as **Templates**:
- When a new customer signs up, offer to clone a "Starter Project" from the Internal Customer's library.

### D. Analytics Segmentation
Update all analytics events (Mixpanel/PostHog) to include properties:
- `project_is_demo`: allows filtering out public demo noise from real usage metrics.
- `customer_is_internal`: allows separating dogfooding/testing usage from paid customer usage.
