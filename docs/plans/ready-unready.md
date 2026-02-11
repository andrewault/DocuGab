# Plan: Ready/Unready Project Status Badges

**Goal:** Visually indicate whether a Project is "Ready" or "Unready" across the admin interface using specific color-coded badges, ensuring consistent user experience.

## Current State
- **Backend:** The `ProjectResponse` schema already includes an `is_ready` boolean field. This is computed in `project_utils.py` based on:
  - If `show_animation` is True: Requires `avatar_id`, `voice`, and `documents_count > 0`.
  - If `show_animation` is False: Requires `documents_count > 0`.
- **Frontend:**
  - `ProjectEdit.tsx` currently displays "Ready" (Green) / "Not Ready" (Red) chips.
  - `ProjectDetail.tsx` displays a warning alert if not ready, but no specific badge in the header next to Active/Disabled.
  - `Projects.tsx` (List) does not show readiness status.

## Requirements
1.  **Logic:** Utilize the existing `is_ready` field from the API.
2.  **Visuals:**
    - **Ready:** Badge with text "Ready", white text on **Purple** background (e.g., `#9c27b0`).
    - **Unready:** Badge with text "Unready", white text on **Red** background (`#f44336`).
3.  **Locations:**
    - Project List Table (`Projects.tsx`): Add to Status column.
    - Project Detail Page (`ProjectDetail.tsx`): Add to header.
    - Project Edit Page (`ProjectEdit.tsx`): Update existing badges to match new styling/text.

## Proposed Changes

### 1. Frontend: Project List (`src/pages/admin/Projects.tsx`)
-   **Action:** Modify the `Status` column in the table.
-   **Implementation:**
    -   Insert the new badge next to the existing "Active"/"Disabled" and "Demo" chips.
    -   Use a consistent styled `Chip` component or helper function.

### 2. Frontend: Project Detail (`src/pages/admin/ProjectDetail.tsx`)
-   **Action:** Add the badge to the header section.
-   **Implementation:**
    -   Place it alongside the status chip (Active/Disabled).
    -   Ensure consistent styling across views.

### 3. Frontend: Project Edit (`src/pages/admin/ProjectEdit.tsx`)
-   **Action:** Update the existing status chips in the header.
-   **Implementation:**
    -   Change "Not Ready" text to "Unready".
    -   Change "Ready" color from Green (`#4caf50`) to Purple (e.g., `#9c27b0`).
    -   Ensure "Unready" uses Red (`#f44336`).

## Recommendations
-   **Reusable Component:** Create a small helper component `<ReadinessBadge isReady={boolean} />` to ensure identical styling and text across all three pages. This reduces code duplication.
-   **Purple Color:** Use Material UI's `secondary.main` (if purple) or a specific hex like `#9c27b0` (Purple 500) to ensure good contrast with white text.
-   **Filtering:** Consider adding a "Ready/Unready" filter to the Project List page in the future if users need to find incomplete projects quickly.

## Questions
1.  **Purple Color Preference:** Is there a specific hex code for "Purple" you prefer, or is standard Material UI Purple (`#9c27b0`) acceptable?
2.  **Sort Order:** Should the Project List be sortable by "Readiness"? (Currently typically sorted by name or date).
3.  **"Unready" Wording:** Confirming that "Unready" is the desired text versus "Not Ready" or "Incomplete".

## Implementation Steps (Do Not Implement Yet)
1.  Create `ReadinessBadge` component (optional but highly recommended).
2.  Update `Projects.tsx`.
3.  Update `ProjectDetail.tsx`.
4.  Update `ProjectEdit.tsx`.
