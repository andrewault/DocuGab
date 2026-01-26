import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DocumentViewer from './DocumentViewer';
import { AuthContext } from '../context/AuthContext';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockDocument = {
    id: 1,
    uuid: '123-uuid',
    filename: 'test.md',
    status: 'ready',
    file_size: 1024,
    content_type: 'text/markdown',
    created_at: '2023-01-01',
};

const renderWithProviders = () => {
    const theme = createTheme();
    return render(
        <AuthContext.Provider value={{
            user: { id: 1, email: 'test@example.com', full_name: 'Test', role: 'user', is_active: true, is_verified: true },
            isAuthenticated: true,
            isLoading: false,
            isAdmin: false,
            login: vi.fn(),
            register: vi.fn(),
            logout: vi.fn(),
            refreshAuth: vi.fn(),
        }}>
            <ThemeProvider theme={theme}>
                <MemoryRouter initialEntries={['/documents/123-uuid']}>
                    <Routes>
                        <Route path="/documents/:uuid" element={<DocumentViewer />} />
                    </Routes>
                </MemoryRouter>
            </ThemeProvider>
        </AuthContext.Provider>
    );
};

describe('DocumentViewer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        mockFetch.mockImplementation(() => new Promise(() => { })); // Never resolves
        renderWithProviders();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders document content successfully', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockDocument,
            } as Response) // Metadata
            .mockResolvedValueOnce({
                ok: true,
                text: async () => '# Hello World',
            } as Response); // Content

        renderWithProviders();

        await waitFor(() => {
            expect(screen.getByText('test.md')).toBeInTheDocument();
            expect(screen.getByText('Hello World')).toBeInTheDocument();
        });
    });

    it('renders error when document not found', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
        } as Response);

        renderWithProviders();

        await waitFor(() => {
            expect(screen.getByText(/Document not found/i)).toBeInTheDocument();
        });
    });
});
