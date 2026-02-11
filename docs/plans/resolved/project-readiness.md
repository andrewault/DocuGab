# Project Readiness Checklist

## Goal
Display a "Needed to be Ready" checklist on the Admin Project Detail page when a project is not marked as `is_ready`. This will help admins understand what configuration steps are missing (e.g., documents, avatar, voice).

## Current State
- `ProjectDetail.tsx` displays project information and tabs.
- The `Project` model and schema have an `is_ready` field, but the specific *reasons* for not being ready are not exposed by the API or calculated on the frontend.
- Currently, `is_ready` essentially means "has documents" in some contexts, but we should formalize this.

## Proposed Changes

### 1. Frontend Logic (ProjectDetail.tsx)
-   **Calculate Readiness:** define a set of criteria for a project to be "Ready":
    1.  **Has Documents:** `project.documents_count > 0`
    2.  **Has Avatar:** `project.avatar_id` is present.
    3.  **Has Voice:** `project.voice` is set.
    4.  **Enabled:** `project.is_enabled` is true.
-   **UI Component:**
    -   If `!project.is_ready` (or if our calculated readiness is false), display a formatted `Alert` or `Card` below the tabs.
    -   Title: "Needed, be Ready:"
    -   List:
        -   [ ] Upload at least one document
        -   [ ] Select an Avatar (if missing)
        -   [ ] Select a Voice (if missing)
        -   [ ] Enable Project

### 2. Backend (Optional but Recommended)
-   Ideally, the backend should return `readiness_reasons` or similar, but for now, we can infer most of this from the `ProjectResponse` object which contains `documents_count`, `avatar`, `voice`, etc.
-   **Decision:** Implement logic in Frontend first using existing data.

## Implementation Steps
1.  **Modify** `frontend/src/pages/admin/ProjectDetail.tsx`:
    -   Add `readinessMissing` array calculation.
    -   Insert UI block under the tab content area (or above it, below header).
    -   *Design:* Use an `Alert` with severity `warning` or `info`, containing a `<ul>` list.

## Verification Plan
1.  Open a Project with 0 documents.
2.  Verify "Needed: Upload documents" appears.
3.  Upload a document.
4.  Verify the item disappears from the list.
