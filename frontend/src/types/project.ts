// Shared types for Project-related components

export interface Project {
    id: number;
    customer_id: number;
    customer_name: string;
    customer_uuid: string | null;
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
    is_demo: boolean;
    is_enabled: boolean;
    is_ready: boolean;
    created_at: string;
    updated_at: string;
    documents_count: number;
}

export interface Document {
    id: number;
    uuid: string;
    project_id: number;
    filename: string;
    original_filename: string;
    file_size: number;
    content_type: string;
    status: string;
    chunks_count: number;
    created_at: string;
}
