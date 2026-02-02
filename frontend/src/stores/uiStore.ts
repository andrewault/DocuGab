import { create } from 'zustand';

interface Toast {
    id: string;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
}

interface Modal {
    id: string;
    isOpen: boolean;
    title?: string;
    content?: React.ReactNode;
}

interface UIState {
    // Toast notifications
    toasts: Toast[];
    addToast: (message: string, severity?: Toast['severity']) => void;
    removeToast: (id: string) => void;
    clearToasts: () => void;

    // Modals
    modals: Record<string, Modal>;
    openModal: (id: string, title?: string, content?: React.ReactNode) => void;
    closeModal: (id: string) => void;

    // Loading states
    loading: Record<string, boolean>;
    setLoading: (key: string, value: boolean) => void;

    // Sidebar (admin/customer portals)
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    // Toasts
    toasts: [],

    addToast: (message, severity = 'info') => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({
            toasts: [...state.toasts, { id, message, severity }],
        }));

        // Auto-remove after 5 seconds
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }));
        }, 5000);
    },

    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),

    clearToasts: () => set({ toasts: [] }),

    // Modals
    modals: {},

    openModal: (id, title, content) =>
        set((state) => ({
            modals: {
                ...state.modals,
                [id]: { id, isOpen: true, title, content },
            },
        })),

    closeModal: (id) =>
        set((state) => ({
            modals: {
                ...state.modals,
                [id]: { ...state.modals[id], isOpen: false },
            },
        })),

    // Loading
    loading: {},

    setLoading: (key, value) =>
        set((state) => ({
            loading: { ...state.loading, [key]: value },
        })),

    // Sidebar
    sidebarOpen: true,

    toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
