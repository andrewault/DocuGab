import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface ProjectConfig {
    id: number;
    customer_id: number;
    name: string;
    slug: string;
    description: string | null;
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


interface ProjectProviderProps {
    children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
    const [project] = useState<ProjectConfig | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Context logic simplified as subdomain lookup is removed.
    // Future implementation: Fetch project based on domain or other criteria if needed.

    const fetchProject = useCallback(async () => {
        // Placeholder for future project fetching logic without subdomain
        // For now, it will just set loading to false and return.
        // You might want to fetch a default project or based on a different identifier here.
        setLoading(false);
        setError('Project fetching logic needs to be implemented without subdomain.');
        return;

        // try {
        //     setLoading(true);
        //     setError(null);

        //     // Example: Fetch a default project or by a hardcoded ID
        //     const response = await fetch(
        //         `${API_BASE}/api/public/projects/default` // Or by ID: /api/public/projects/1
        //     );

        //     if (!response.ok) {
        //         throw new Error('Failed to load project configuration');
        //     }

        //     const data = await response.json();
        //     setProject(data);
        // } catch (err) {
        //     setError(err instanceof Error ? err.message : 'Unknown error');
        //     setProject(null);
        // } finally {
        //     setLoading(false);
        // }
    }, []); // No dependencies as subdomain is removed

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

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

// eslint-disable-next-line react-refresh/only-export-components
export function useProject() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
}
