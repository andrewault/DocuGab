import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ProjectConfig {
    id: number;
    customer_id: number;
    name: string;
    slug: string;
    description: string | null;
    subdomain: string;
    logo: string | null;
    title: string;
    subtitle: string | null;
    body: string | null;
    color_primary: string;
    color_secondary: string;
    color_background: string;
    avatar: string;
    voice: string;
    return_link: string | null;
    return_link_text: string | null;
    is_active: boolean;
    created_at: string;
    documents_count: number;
    customer_name: string | null;
}

interface ProjectContextType {
    project: ProjectConfig | null;
    loading: boolean;
    error: string | null;
    refreshProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

interface ProjectProviderProps {
    children: ReactNode;
    subdomain?: string;
}

export function ProjectProvider({ children, subdomain }: ProjectProviderProps) {
    const [project, setProject] = useState<ProjectConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProject = async () => {
        // If no subdomain provided, don't fetch
        if (!subdomain) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `${API_BASE}/api/public/projects/by-subdomain/${subdomain}`
            );

            if (!response.ok) {
                throw new Error('Failed to load project configuration');
            }

            const data = await response.json();
            setProject(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setProject(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProject();
    }, [subdomain]);

    const value: ProjectContextType = {
        project,
        loading,
        error,
        refreshProject: fetchProject,
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
}
