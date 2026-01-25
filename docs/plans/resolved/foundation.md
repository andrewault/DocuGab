# Foundation: React + MUI Frontend Setup

## Overview

This plan establishes the foundation for the DocuTalk webapp frontend. It covers project initialization, dependency installation, and creation of the initial Home page using React and Material UI (MUI).

---

## Progress Tracking

| Phase | Task | Status |
|-------|------|--------|
| 1 | Initialize React project with Vite | ✅ Complete |
| 2 | Install MUI dependencies | ✅ Complete |
| 3 | Configure theme and global styles | ✅ Complete |
| 4 | Create Home page component | ✅ Complete |
| 5 | Set up routing | ✅ Complete |
| 6 | Verify build and dev server | ✅ Complete |

**Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Complete | ❌ Blocked

---

## Phase 1: Initialize React Project

Create a new React project using Vite for fast build times and modern tooling.

```bash
cd /Users/andrewault/dev/ault/DocuTok
npx -y create-vite@latest frontend --template react-ts
cd frontend
npm install
```

**Expected structure:**
```
frontend/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Phase 2: Install MUI Dependencies

Install Material UI core packages and supporting libraries.

```bash
cd frontend
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install @fontsource/roboto
npm install react-router-dom
npm install @tanstack/react-query
```

**Package purposes:**
- `@mui/material` — Core MUI components
- `@emotion/react`, `@emotion/styled` — Styling engine for MUI
- `@mui/icons-material` — Material Design icons
- `@fontsource/roboto` — Self-hosted Roboto font
- `react-router-dom` — Client-side routing
- `@tanstack/react-query` — Async state management (per tech stack spec)

---

## Phase 3: Configure Theme and Global Styles

### 3.1 Create Theme Configuration

**File:** `src/theme.ts`

```typescript
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // Indigo
    },
    secondary: {
      main: '#10b981', // Emerald
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 12,
  },
});
```

### 3.2 Update main.tsx

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import App from './App';
import { theme } from './theme';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
```

---

## Phase 4: Create Home Page Component

### 4.1 Home Page

**File:** `src/pages/Home.tsx`

```typescript
import { Box, Container, Typography, Button, Stack, Paper } from '@mui/material';
import { Upload, Chat, Search } from '@mui/icons-material';

export default function Home() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      }}
    >
      <Container maxWidth="lg" sx={{ flex: 1, py: 8 }}>
        {/* Hero Section */}
        <Box textAlign="center" mb={8}>
          <Typography
            variant="h1"
            sx={{
              background: 'linear-gradient(90deg, #6366f1, #10b981)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            DocuTalk
          </Typography>
          <Typography variant="h5" color="text.secondary" mb={4}>
            Transform your documents into intelligent conversations
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<Upload />}
            sx={{ px: 4, py: 1.5 }}
          >
            Upload Document
          </Button>
        </Box>

        {/* Feature Cards */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="center">
          <FeatureCard
            icon={<Upload sx={{ fontSize: 40 }} />}
            title="Multi-Format Upload"
            description="PDF, DOCX, TXT, and Markdown files supported"
          />
          <FeatureCard
            icon={<Chat sx={{ fontSize: 40 }} />}
            title="Natural Conversations"
            description="Ask questions in plain English, get cited answers"
          />
          <FeatureCard
            icon={<Search sx={{ fontSize: 40 }} />}
            title="Source Citations"
            description="Every answer links back to the exact source"
          />
        </Stack>
      </Container>
    </Box>
  );
}

function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        flex: 1,
        maxWidth: 300,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(99, 102, 241, 0.2)',
        },
      }}
    >
      <Box color="primary.main" mb={2}>{icon}</Box>
      <Typography variant="h6" mb={1}>{title}</Typography>
      <Typography variant="body2" color="text.secondary">{description}</Typography>
    </Paper>
  );
}
```

---

## Phase 5: Set Up Routing

**File:** `src/App.tsx`

```typescript
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
```

---

## Phase 6: Verify Build and Dev Server

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 and verify:
- [ ] Page loads without errors
- [ ] Dark theme is applied
- [ ] Gradient hero text renders correctly
- [ ] Feature cards have hover animations
- [ ] Button displays with icon

---

## Recommendations

### Immediate Next Steps
1. **Add Layout Shell** — Create a persistent header/navbar component for navigation across future pages
2. **Configure Path Aliases** — Set up `@/` alias in `vite.config.ts` for cleaner imports
3. **Add Error Boundaries** — Implement React error boundaries for graceful failure handling

### Architecture Considerations
1. **Component Structure** — Consider organizing into `components/`, `pages/`, `hooks/`, and `utils/` directories
2. **API Layer** — Create an `api/` directory with typed fetch wrappers before backend integration
3. **Environment Variables** — Set up `.env` files for API base URL configuration

### Performance
1. **Code Splitting** — Use `React.lazy()` for route-based code splitting as pages are added
2. **Font Optimization** — Consider preloading critical font weights

### Developer Experience
1. **ESLint + Prettier** — Add linting and formatting configuration
2. **Husky** — Set up pre-commit hooks for code quality enforcement
