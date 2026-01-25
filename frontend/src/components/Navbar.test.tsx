import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/test-utils';
import Navbar from './Navbar';

// Mock useNavigate
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn(),
    };
});

describe('Navbar', () => {
    it('renders app title', () => {
        render(<Navbar />);
        expect(screen.getByText('DocuTok')).toBeInTheDocument();
    });

    it('renders the navbar component', () => {
        render(<Navbar />);
        // Check navbar renders (header element)
        expect(screen.getByRole('banner')).toBeInTheDocument();
    });
});
