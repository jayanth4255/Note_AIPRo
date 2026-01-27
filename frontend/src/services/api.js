import api from '../api';

// Notes API
export const notesApi = {
    getAll: (params) => api.get('/api/notes', { params }),
    getById: (id) => api.get(`/api/notes/${id}`),
    create: (data) => api.post('/api/notes', data),
    update: (id, data) => api.put(`/api/notes/${id}`, data),
    delete: (id) => api.delete(`/api/notes/${id}`),
    search: (searchParams) => api.post('/api/notes/search', searchParams),
    exportPdf: (id) => api.get(`/api/notes/${id}/export/pdf`, { responseType: 'blob' }),
    uploadFile: (noteId, formData) => api.post(`/api/notes/${noteId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    archive: (id) => api.post(`/api/notes/${id}/archive`),
    unarchive: (id) => api.post(`/api/notes/${id}/unarchive`),

    // Trash operations
    moveToTrash: (id) => api.post(`/api/notes/${id}/trash`),
    restore: (id) => api.post(`/api/notes/${id}/restore`),
    getTrash: (params) => api.get('/api/trash', { params }),
    permanentDelete: (id) => api.delete(`/api/trash/${id}`),
    emptyTrash: () => api.delete('/api/trash'),
};

// File API
export const filesApi = {
    upload: (noteId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/api/notes/${noteId}/files`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    download: (fileId) => api.get(`/api/files/${fileId}`, { responseType: 'blob' }),
    getThumbnail: (fileId) => api.get(`/api/files/${fileId}/thumbnail`, { responseType: 'blob' }),
    delete: (fileId) => api.delete(`/api/files/${fileId}`),
    getContent: (fileId) => api.get(`/api/files/${fileId}/content`),
};

// AI API
export const aiApi = {
    summarize: (text, mode = 'short', context) => api.post('/api/ai/summarize', { text, context, action: 'summarize', mode }),
    rewrite: (text, action = 'improve') => api.post('/api/ai/rewrite', { text, action }),
    generate: (topic, length = 'medium') => {
        const formData = new FormData();
        formData.append('topic', topic);
        formData.append('length', length);
        return api.post('/api/ai/generate', formData);
    },
    generateText: ({ prompt }) => {
        const formData = new FormData();
        formData.append('prompt', prompt);
        return api.post('/api/ai/generate-text', formData);
    },
    generateImage: ({ prompt }) => {
        const formData = new FormData();
        formData.append('prompt', prompt);
        return api.post('/api/ai/generate-image', formData);
    },
    generateFlowchart: ({ prompt }) => {
        const formData = new FormData();
        formData.append('prompt', prompt);
        return api.post('/api/ai/generate-flowchart', formData);
    },
    textToSpeech: (text, voice = 'alloy') =>
        api.post('/api/ai/tts', { text, voice }, { responseType: 'blob' }),
    getSuggestions: (currentText, cursorPosition) =>
        api.post('/api/ai/suggestions', { current_text: currentText, cursor_position: cursorPosition }),
    chat: (text, chat_id, context) => api.post('/api/ai/chat', { text, chat_id, context, action: 'chat' }),
    createSession: () => api.post('/api/ai/chat/sessions'),
    getSessions: (params) => api.get('/api/ai/chat/sessions', { params }),
    getSessionHistory: (chatId) => api.get(`/api/ai/chat/sessions/${chatId}/messages`),

    // NEW AI INTELLIGENCE FEATURES
    format: (text) => {
        const formData = new FormData();
        formData.append('text', text);
        return api.post('/api/ai/format', formData);
    },
    detectCategory: (text) => {
        const formData = new FormData();
        formData.append('text', text);
        return api.post('/api/ai/detect-category', formData);
    },
    extractTasks: (text) => {
        const formData = new FormData();
        formData.append('text', text);
        return api.post('/api/ai/extract-tasks', formData);
    },
    askNotes: (question) => {
        const formData = new FormData();
        formData.append('question', question);
        return api.post('/api/ai/ask-notes', formData);
    },
    flashcards: (noteId, count = 5) => {
        const formData = new FormData();
        formData.append('note_id', noteId);
        formData.append('count', count);
        return api.post('/api/ai/flashcards', formData);
    },
    dailyBrief: () => api.get('/api/ai/daily-brief'),
    semanticSearch: (query) => {
        const formData = new FormData();
        formData.append('query', query);
        return api.post('/api/ai/semantic-search', formData);
    },
    getRelatedNotes: (noteId) => api.get(`/api/notes/${noteId}/related`),
    getNoteTasks: (noteId) => api.get(`/api/notes/${noteId}/tasks`),
};


// Analytics API 
export const analyticsApi = {
    getDashboard: () => api.get('/api/analytics'),
};

// Version API
export const versionsApi = {
    getHistory: (noteId) => api.get(`/api/notes/${noteId}/versions`),
};

// Privacy API
export const privacyApi = {
    lockNote: (noteId, pin) => api.post(`/api/notes/${noteId}/lock`, { pin }),
    unlockNote: (noteId, pin) => api.post(`/api/notes/${noteId}/unlock`, { pin }),
    toggleHide: (noteId) => api.post(`/api/notes/${noteId}/toggle-hide`),
};

// Sharing API
export const sharingApi = {
    createLink: (noteId, config) => api.post(`/api/notes/${noteId}/share`, config),
    getLinks: (noteId) => api.get(`/api/notes/${noteId}/shares`),
    deactivateLink: (linkId) => api.delete(`/api/shares/${linkId}`),
    accessShared: (token, password) => api.post(`/api/shared/${token}`, { password }),
};

export default {
    notes: notesApi,
    files: filesApi,
    ai: aiApi,
    analytics: analyticsApi,
    versions: versionsApi,
    sharing: sharingApi,
    privacy: privacyApi,
};
