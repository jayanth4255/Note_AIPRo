// src/services/notes.js
/**
 * Notes service for CRUD operations
 */
import api from './api';

export const notesService = {
    /**
     * Get all notes
     */
    getNotes: async (skip = 0, limit = 100) => {
        const response = await api.get('/api/notes', { params: { skip, limit } });
        return response.data;
    },

    /**
     * Get a single note
     */
    getNote: async (noteId) => {
        const response = await api.get(`/api/notes/${noteId}`);
        return response.data;
    },

    /**
     * Create a new note
     */
    createNote: async (noteData) => {
        const response = await api.post('/api/notes', noteData);
        return response.data;
    },

    /**
     * Update a note
     */
    updateNote: async (noteId, noteData) => {
        const response = await api.put(`/api/notes/${noteId}`, noteData);
        return response.data;
    },

    /**
     * Delete a note
     */
    deleteNote: async (noteId, permanent = false) => {
        await api.delete(`/api/notes/${noteId}`, { params: { permanent } });
    },

    /**
     * Move a note to trash
     */
    moveToTrash: async (noteId) => {
        const response = await api.post(`/api/notes/${noteId}/trash`);
        return response.data;
    },

    /**
     * Restore a note from trash
     */
    restoreFromTrash: async (noteId) => {
        const response = await api.post(`/api/notes/${noteId}/restore`);
        return response.data;
    },

    /**
     * Get all trashed notes
     */
    getTrashedNotes: async (skip = 0, limit = 100) => {
        const response = await api.get('/api/notes/trash/all', { params: { skip, limit } });
        return response.data;
    },

    /**
     * Search notes
     */
    searchNotes: async (searchParams) => {
        const response = await api.post('/api/notes/search', searchParams);
        return response.data;
    },

    /**
     * Get note versions
     */
    getNoteVersions: async (noteId) => {
        const response = await api.get(`/api/notes/${noteId}/versions`);
        return response.data;
    },

    /**
     * Export note as PDF
     */
    exportNotePDF: async (noteId) => {
        const response = await api.get(`/api/notes/${noteId}/export/pdf`, {
            responseType: 'blob',
        });
        return response.data;
    },

    /**
     * Create share link
     */
    createShareLink: async (noteId, config = {}) => {
        const response = await api.post(`/api/notes/${noteId}/share`, config);
        return response.data;
    },

    /**
     * Get share links for a note
     */
    getShareLinks: async (noteId) => {
        const response = await api.get(`/api/notes/${noteId}/shares`);
        return response.data;
    },

    /**
     * Deactivate share link
     */
    deactivateShareLink: async (linkId) => {
        await api.delete(`/api/shares/${linkId}`);
    },

    /**
     * Access shared note (no auth)
     */
    getSharedNote: async (token, password = null) => {
        const response = await api.post(`/api/shared/${token}`, { password });
        return response.data;
    },
};

export default notesService;
