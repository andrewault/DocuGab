# Plan: Multiple Demo Chatbots

## Goal
Enable the system to support multiple public demo projects simultaneously, accessible via a public list page (`/demos`) and individual detail pages (`/demos/{slug}`).

## Current State
- **Database:** `Project` model has `is_demo` and `is_active_demo` flags.
- **Backend:** `admin_routes/demo_projects.py` enforces a strict "single active demo" rule. `public.py` allows access to any active/enabled project by slug.
- **Frontend Route:** `/chats/:slug` serves the standalone public chat (`PublicChat.tsx`).
- **Frontend Admin:** `DemoProjects.tsx` manages the demo list.

## Proposed Changes

### 1. Database & Backend Logic
- **Lift Restriction:** Modify `activate_demo_project` logic in `backend/app/api/routes/admin_routes/demo_projects.py` to **allow multiple** projects to have `is_active_demo=True`.
- **Repurpose Flag:**
    - Use `is_active_demo` as a **"Featured"** flag to highlight specific demos at the top of the list.
    - Use `is_demo=True` AND `is_enabled=True` to determine visibility in the public `/demos` list.
- **New Endpoint:** `GET /api/v1/public/demos`
    - Returns a list of all projects where `is_demo=True` AND `is_enabled=True`.
    - Returns simplified data (uuid, name, slug, title, subtitle, logo, avatar, color_primary, is_active_demo).

### 2. Frontend Routes & Pages
- **New Page:** `pages/public/DemoList.tsx` (URL: `/demos`)
    - **Layout:** Main Application Layout (Navbar + Footer, No Sidebar).
    - **Header:** "Demo Chatbots"
    - **Content:** Grid/List of available demo projects.
    - **Interaction:** Cards linking to `/demos/{slug}`.
- **Update Page:** `pages/PublicChat.tsx` (URL: `/demos/{slug}`)
    - Currently used at `/chats/{slug}`.
    - We will route `/demos/{slug}` to this same component.
    - It should remain a standalone layout (no Navbar/Footer) to focus on the chat experience.
- **Home Page Update:**
    - Add "View Demo Chatbots" button under the "Transform your documents..." section.

### 3. URL Structure
| URL | Component | Layout |
| :--- | :--- | :--- |
| `/demos` | `DemoList.tsx` | Main (Navbar/Footer) |
| `/demos/{slug}` | `PublicChat.tsx` | Standalone (Fullscreen) |
| `/chats/{slug}` | `PublicChat.tsx` | *Keep for backward compatibility?* |

## Implementation Steps

### Backend
1.  **Modify** `backend/app/api/routes/admin_routes/demo_projects.py`:
    -   Remove logic that deactivates other demos when one is activated.
    -   (Optional) Rename endpoint or variable names to reflect "Featured".
2.  **Create** `GET /api/v1/public/demos` in `backend/app/api/routes/public.py`:
    -   Logic: `SELECT * FROM projects WHERE is_demo=True AND is_enabled=True ORDER BY is_active_demo DESC, created_at DESC`.

### Frontend
1.  **Create** `frontend/src/pages/public/DemoList.tsx`.
2.  **Update** `frontend/src/App.tsx`:
    -   Add `if (location.pathname.startsWith('/demos/'))` block to render `PublicChat` standalone (similar to `/chats/`).
    -   Add `<Route path="/demos" element={<DemoList />} />` to the main `Routes`.
3.  **Update** `frontend/src/pages/Home.tsx`:
    -   Add navigation button.

## Recommendations
- **Caching:** Implement caching for the `/api/v1/public/demos` response.
- **Rate Limiting:** Ensure strict rate limiting on public chat endpoints.
- **SEO:** Dynamically update `<title>` and `<meta>` tags for `/demos/{slug}` based on the project title/description.

## Open Questions
1.  **Legacy URL:** Should we redirect `/chats/{slug}` to `/demos/{slug}` or keep it supporting both?
2.  **Featured Ordering:** Is sorting by "Featured" (`is_active_demo`) then "Date" sufficient?
