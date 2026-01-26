import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Chat from './Chat';
import { AuthContext } from '../context/AuthContext';

// Mock scrollTo
window.scrollTo = vi.fn();
Element.prototype.scrollTo = vi.fn();

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Auth Context
const mockUser = {
    id: 1,
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'user',
    is_active: true,
    is_verified: true,
};

const renderWithProviders = (component: React.ReactNode) => {
    const theme = createTheme();
    return render(
        <AuthContext.Provider value={{
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
            isAdmin: false,
            login: vi.fn(),
            register: vi.fn(),
            logout: vi.fn(),
            refreshAuth: vi.fn(),
        }}>
            <ThemeProvider theme={theme}>
                <MemoryRouter>
                    {component}
                </MemoryRouter>
            </ThemeProvider>
        </AuthContext.Provider>
    );
};

describe('Chat Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ([]),
            body: {
                getReader: () => ({
                    read: () => Promise.resolve({ done: true, value: undefined }),
                }),
            },
        } as unknown as Response);
    });

    it('renders chat input', () => {
        renderWithProviders(<Chat />);
        expect(screen.getByPlaceholderText(/Ask a question about your documents/i)).toBeInTheDocument();
    });

    it('allows typing in input', () => {
        renderWithProviders(<Chat />);
        const input = screen.getByPlaceholderText(/Ask a question about your documents/i);
        fireEvent.change(input, { target: { value: 'Hello AI' } });
        expect(input).toHaveValue('Hello AI');
    });

    it('sends message when form is submitted', async () => {
        renderWithProviders(<Chat />);
        const input = screen.getByPlaceholderText(/Ask a question about your documents/i);
        const button = screen.getByLabelText(/Send message/i);

        fireEvent.change(input, { target: { value: 'Test question' } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/chat/'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('Test question'),
                })
            );
        });
    });
});
