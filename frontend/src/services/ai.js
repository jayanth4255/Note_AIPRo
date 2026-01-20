// src/services/ai.js
/**
 * AI service for OpenAI integration
 */
import api from './api';

export const aiService = {
    /**
     * Summarize text
     */
    summarize: async (text, context = null) => {
        const response = await api.post('/api/ai/summarize', {
            text,
            action: 'summarize',
            context,
        });
        return response.data.result;
    },

    /**
     * Rewrite/improve text
     */
    rewrite: async (text, style = 'improve') => {
        const response = await api.post('/api/ai/rewrite', {
            text,
            action: style,
        });
        return response.data.result;
    },

    /**
     * Generate note from topic
     */
    generateNote: async (topic, length = 'medium') => {
        const formData = new FormData();
        formData.append('topic', topic);
        formData.append('length', length);

        const response = await api.post('/api/ai/generation', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    /**
     * Generate image
     */
    generateImage: async (prompt, size = '1024x1024', quality = 'standard') => {
        const response = await api.post(
            '/api/ai/image',
            { prompt, size, quality },
            { responseType: 'blob' }
        );
        return response.data;
    },

    /**
     * Text to speech
     */
    textToSpeech: async (text, voice = 'alloy') => {
        const response = await api.post(
            '/api/ai/tts',
            { text, voice },
            { responseType: 'blob' }
        );
        return response.data;
    },

    /**
     * Get AI suggestions
     */
    getSuggestions: async (currentText, cursorPosition) => {
        const response = await api.post('/api/ai/suggestions', {
            current_text: currentText,
            cursor_position: cursorPosition,
        });
        return response.data.result;
    },
};

export default aiService;
