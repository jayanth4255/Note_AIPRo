// src/services/files.js
/**
 * File upload and management service
 */
import api from './api';

export const filesService = {
    /**
     * Upload file to note
     */
    uploadFile: async (noteId, file, onProgress = null) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`/api/notes/${noteId}/files`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percentCompleted);
                }
            },
        });
        return response.data;
    },

    /**
     * Download file
     */
    downloadFile: async (fileId) => {
        const response = await api.get(`/api/files/${fileId}`, {
            responseType: 'blob',
        });
        return response.data;
    },

    /**
     * Get file thumbnail
     */
    getThumbnail: async (fileId) => {
        const response = await api.get(`/api/files/${fileId}/thumbnail`, {
            responseType: 'blob',
        });
        return response.data;
    },

    /**
     * Delete file
     */
    deleteFile: async (fileId) => {
        await api.delete(`/api/files/${fileId}`);
    },

    /**
     * Get analytics
     */
    getAnalytics: async () => {
        const response = await api.get('/api/analytics');
        return response.data;
    },
};

export default filesService;
