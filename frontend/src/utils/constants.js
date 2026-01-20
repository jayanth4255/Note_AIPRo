// src/utils/constants.js
/**
 * Application constants
 */

export const FILE_TYPE_ICONS = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    txt: '📃',
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🎞️',
    mp3: '🎵',
    mp4: '🎬',
    wav: '🎵',
    mov: '🎬',
};

export const AI_ACTIONS = {
    SUMMARIZE: 'summarize',
    IMPROVE: 'improve',
    PROFESSIONAL: 'professional',
    CASUAL: 'casual',
    CONCISE: 'concise',
};

export const NOTE_LENGTHS = {
    SHORT: 'short',
    MEDIUM: 'medium',
    LONG: 'long',
};

export const TTS_VOICES = [
    { value: 'alloy', label: 'Alloy' },
    { value: 'echo', label: 'Echo' },
    { value: 'fable', label: 'Fable' },
    { value: 'onyx', label: 'Onyx' },
    { value: 'nova', label: 'Nova' },
    { value: 'shimmer', label: 'Shimmer' },
];

export const IMAGE_SIZES = [
    { value: '1024x1024', label: 'Square (1024x1024)' },
    { value: '1792x1024', label: 'Landscape (1792x1024)' },
    { value: '1024x1792', label: 'Portrait (1024x1792)' },
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/gif',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/quicktime',
];
