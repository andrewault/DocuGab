import { getAuthHeader } from '../utils/authUtils';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export interface ProjectMedia {
    id: number;
    project_id: number;
    type: 'photo' | 'youtube';
    url: string;
    description?: string;
    keywords: string[];
}

export interface ProjectLink {
    id: number;
    project_id: number;
    name: string;
    url: string;
    keywords: string[];
}

export const ancillaryApi = {
    // Media
    getMedia: async (projectUuid: string): Promise<ProjectMedia[]> => {
        const response = await fetch(`${API_BASE}/api/v1/admin/projects/${projectUuid}/media`, {
            headers: getAuthHeader(),
        });
        if (!response.ok) throw new Error('Failed to fetch media');
        return response.json();
    },

    createMedia: async (projectUuid: string, data: Omit<ProjectMedia, 'id' | 'project_id'>): Promise<ProjectMedia> => {
        const response = await fetch(`${API_BASE}/api/v1/admin/projects/${projectUuid}/media`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create media');
        return response.json();
    },

    deleteMedia: async (projectUuid: string, mediaId: number): Promise<void> => {
        const response = await fetch(`${API_BASE}/api/v1/admin/projects/${projectUuid}/media/${mediaId}`, {
            method: 'DELETE',
            headers: getAuthHeader(),
        });
        if (!response.ok) throw new Error('Failed to delete media');
    },

    // Links
    getLinks: async (projectUuid: string): Promise<ProjectLink[]> => {
        const response = await fetch(`${API_BASE}/api/v1/admin/projects/${projectUuid}/links`, {
            headers: getAuthHeader(),
        });
        if (!response.ok) throw new Error('Failed to fetch links');
        return response.json();
    },

    createLink: async (projectUuid: string, data: Omit<ProjectLink, 'id' | 'project_id'>): Promise<ProjectLink> => {
        const response = await fetch(`${API_BASE}/api/v1/admin/projects/${projectUuid}/links`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create link');
        return response.json();
        return response.json();
    },

    updateLink: async (projectUuid: string, linkId: number, data: Omit<ProjectLink, 'id' | 'project_id'>): Promise<ProjectLink> => {
        const response = await fetch(`${API_BASE}/api/v1/admin/projects/${projectUuid}/links/${linkId}`, {
            method: 'PUT',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update link');
        return response.json();
    },

    deleteLink: async (projectUuid: string, linkId: number): Promise<void> => {
        const response = await fetch(`${API_BASE}/api/v1/admin/projects/${projectUuid}/links/${linkId}`, {
            method: 'DELETE',
            headers: getAuthHeader(),
        });
        if (!response.ok) throw new Error('Failed to delete link');
    }
};
