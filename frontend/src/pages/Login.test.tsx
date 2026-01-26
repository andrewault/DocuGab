import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../test/test-utils';
import Login from './Login';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock fetch
vi.stubGlobal('fetch', vi.fn());

describe('Login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login form elements', () => {
        render(<Login />);
        // Check for email and password inputs by placeholder or label text
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders sign in button', () => {
        render(<Login />);
        const button = screen.getByRole('button', { name: /sign in/i });
        expect(button).toBeInTheDocument();
    });

    it('renders link to register', () => {
        render(<Login />);
        // The link text or register link should exist
        expect(screen.getByRole('link')).toBeInTheDocument();
    });
});
