import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import Documents from './Documents';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Documents', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ documents: [] }),
        });
    });

    it('renders documents header', async () => {
        render(<Documents />);
        expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    it('renders upload button', async () => {
        render(<Documents />);
        expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
    });

    it('renders refresh button', async () => {
        render(<Documents />);
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    it('shows empty state when no documents', async () => {
        render(<Documents />);

        await waitFor(() => {
            expect(screen.getByText(/no documents uploaded yet/i)).toBeInTheDocument();
        });
    });

    it('fetches documents on mount', async () => {
        render(<Documents />);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/documents/')
            );
        });
    });
});
