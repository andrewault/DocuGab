import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../test/test-utils';
import Home from './Home';

// Mock fetch
vi.stubGlobal('fetch', vi.fn());

describe('Home', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the app title', () => {
        render(<Home />);
        expect(screen.getByText(/DocuGab/i)).toBeInTheDocument();
    });

    it('renders a heading', () => {
        render(<Home />);
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('renders the home page container', () => {
        render(<Home />);
        // Just verify the page renders without error
        expect(document.body.textContent).toContain('DocuGab');
    });
});
