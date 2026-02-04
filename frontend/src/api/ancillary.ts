import { getAuthHeader } from '../utils/authUtils';
import { API_BASE } from '@/config/api';

export interface ImageMetadata {
    filename?: string;
    content_type?: string;
    size_bytes?: number;
}

export interface ProjectMedia {
    id: number;
    uuid: string;
    project_id: number;
    type: 'photo' | 'youtube';
    url: string;
    description?: string;
    keywords: string[];
    image_metadata?: ImageMetadata;
}

export interface ProjectLink {
    id: number;
    uuid: string;
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

    createMedia: async (projectUuid: string, data: Omit<ProjectMedia, 'id' | 'uuid' | 'project_id'>): Promise<ProjectMedia> => {
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

    getMediaItem: async (projectUuid: string, mediaUuid: string): Promise<ProjectMedia> => {
        const response = await fetch(`${API_BASE}/api/v1/admin/projects/${projectUuid}/media/${mediaUuid}`, {
            headers: getAuthHeader(),
        });
        if (!response.ok) throw new Error('Failed to fetch media item');
        return response.json();
    },

    updateMedia: async (projectUuid: string, mediaUuid: string, data: Omit<ProjectMedia, 'id' | 'uuid' | 'project_id'>): Promise<ProjectMedia> => {
        const response = await fetch(`${API_BASE}/api/v1/admin/projects/${projectUuid}/media/${mediaUuid}`, {
            method: 'PUT',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update media');
        return response.json();
    },

    deleteMedia: async (projectUuid: string, mediaUuid: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/api/v1/admin/projects/${projectUuid}/media/${mediaUuid}`, {
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

    createLink: async (projectUuid: string, data: Omit<ProjectLink, 'id' | 'uuid' | 'project_id'>): Promise<ProjectLink> => {
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
    },

    updateLink: async (projectUuid: string, linkId: number, data: Omit<ProjectLink, 'id' | 'uuid' | 'project_id'>): Promise<ProjectLink> => {
        // TODO: Update backend to support UUID for links too, but focusing on Media for now per request
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
    },

    // Images
    uploadImage: async (file: File): Promise<{ uuid: string; url: string; original_filename: string }> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/api/v1/images/upload`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                // 'Content-Type': 'multipart/form-data', // Do NOT set Content-Type manually for FormData, browser does it with boundary
            },
            body: formData,
        });

        if (!response.ok) throw new Error('Failed to upload image');
        return response.json();
    }
};
