# Frontend Testing

## Stack

- **Vitest** — Fast test runner (Vite-native)
- **React Testing Library** — Component testing
- **jsdom** — Browser environment simulation
- **@testing-library/user-event** — User interaction simulation

## Run Tests

```bash
# From project root
./scripts/testing/frontend/run-tests.sh

# Or manually
cd frontend
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
```

## Test Structure

```
frontend/src/
├── test/
│   ├── setup.ts            # Global mocks
│   └── test-utils.tsx      # Render helpers
├── pages/
│   ├── Home.test.tsx
│   ├── Login.test.tsx
│   └── Documents.test.tsx
└── components/
    └── Navbar.test.tsx
```

## Test Utilities

The custom `render` function wraps components with all providers:

```tsx
import { render, screen } from '../test/test-utils';

it('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

Includes: BrowserRouter, ThemeProvider, AuthProvider

## Mocks

Configured in `src/test/setup.ts`:
- `localStorage` — Returns null, tracks calls
- `matchMedia` — Returns false for all queries
- `scrollTo` — No-op function

## Adding Tests

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/test-utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```
