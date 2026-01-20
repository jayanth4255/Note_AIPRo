import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { notesApi, aiApi, filesApi } from '../services/api';
import { Save, ArrowLeft, Sparkles, Loader2, Upload, X, Download, Star, Layout } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import AIModal from '../components/AIModal';
import AIFloatingButton from '../components/AIFloatingButton';
import FileViewerModal from '../components/FileViewerModal';

export default function NoteEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [form, setForm] = useState({
        title: '',
        content: '',
        tags: [],
        is_favorite: false
    });
    const [tagInput, setTagInput] = useState('');
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiContext, setAiContext] = useState(null);
    const [viewerFileId, setViewerFileId] = useState(null);
    const [showViewer, setShowViewer] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            fetchNote();
        }
    }, [id]);

    const fetchNote = async () => {
        try {
            const response = await notesApi.getById(id);
            setForm(response.data);
            // Load uploaded files if any
            if (response.data.files) {
                const normalizedFiles = response.data.files.map(f => ({
                    name: f.original_filename,
                    type: f.file_type,
                    size: f.file_size,
                    url: `/api/files/${f.id}`,
                    isImage: f.file_type.startsWith('image/'),
                    id: f.id
                }));
                setUploadedFiles(normalizedFiles);
            }
        } catch (error) {
            console.error('Failed to fetch note:', error);
            alert('Failed to load note');
            navigate('/notes');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            alert('Please enter a title');
            return;
        }

        setSaving(true);
        try {
            const noteData = {
                ...form,
                files: uploadedFiles
            };

            if (isEditMode) {
                await notesApi.update(id, noteData);
                alert('Note saved successfully!');
            } else {
                const response = await notesApi.create(noteData);
                navigate(`/notes/${response.data.id}`);
                return;
            }
        } catch (error) {
            console.error('Failed to save note:', error);
            alert('Failed to save note');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // If not in edit mode (new note), we must save first
        let noteId = id;
        if (!isEditMode) {
            if (!form.title.trim()) {
                alert('Please enter a title before uploading files.');
                return;
            }

            if (!confirm('Note must be saved before uploading files. Save now?')) {
                return;
            }

            try {
                setSaving(true);
                const response = await notesApi.create(form);
                noteId = response.data.id;
                // Navigate to the edit view to ensure state consistency
                navigate(`/notes/${noteId}`, { replace: true });
            } catch (error) {
                console.error('Failed to save note:', error);
                alert('Failed to save note. Cannot upload files.');
                setSaving(false);
                return;
            } finally {
                setSaving(false);
            }
        }

        setUploading(true);
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);

                // Upload file using the correct API endpoint with noteId
                const response = await notesApi.uploadFile(noteId, formData);

                const fileData = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    url: `/api/files/${response.data.file_id}`, // Construct URL from ID
                    isImage: file.type.startsWith('image/'),
                    id: response.data.file_id // Store ID
                };

                setUploadedFiles(prev => [...prev, fileData]);
            }
        } catch (error) {
            console.error('File upload failed:', error);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveFile = async (index) => {
        const file = uploadedFiles[index];
        if (file.id) {
            if (!confirm('Are you sure you want to delete this file?')) return;
            try {
                await filesApi.delete(file.id);
            } catch (error) {
                console.error('Failed to delete file:', error);
                alert('Failed to delete file');
                return;
            }
        }
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
            setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setForm({ ...form, tags: form.tags.filter(tag => tag !== tagToRemove) });
    };

    const handleAISummarize = async () => {
        if (!form.content) {
            alert('Please write some content first');
            return;
        }

        setAiLoading(true);
        try {
            const response = await aiApi.summarize(form.content);
            setForm({
                ...form,
                content: form.content + '\n\n---\n\n**AI Summary:**\n' + response.data.result
            });
        } catch (error) {
            console.error('AI summarize failed:', error);
            alert('AI feature failed. Please check your API key configuration.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleAIFormat = async () => {
        if (!form.content) {
            alert('Please write some content first');
            return;
        }

        setAiLoading(true);
        try {
            const response = await aiApi.format(form.content);
            setForm({
                ...form,
                content: response.data.formatted_text
            });
        } catch (error) {
            console.error('AI format failed:', error);
            alert('AI formatting failed.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleAIModalAddToNote = (content, type) => {
        let formattedContent = '';

        if (type === 'image') {
            formattedContent = `\n\n![AI Generated Image](${content})\n\n`;
        } else if (type === 'flowchart') {
            formattedContent = `\n\n\`\`\`mermaid\n${content}\n\`\`\`\n\n`;
        } else {
            formattedContent = `\n\n${content}\n\n`;
        }

        setForm({
            ...form,
            content: form.content + formattedContent
        });
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            ['clean']
        ],
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto space-y-6 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <button
                        onClick={() => navigate('/notes')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Notes
                    </button>
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={handleAISummarize}
                            disabled={aiLoading}
                            className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg border border-purple-300 transition disabled:opacity-50"
                        >
                            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            AI Summarize
                        </button>
                        <button
                            onClick={handleAIFormat}
                            disabled={aiLoading}
                            className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-300 transition disabled:opacity-50"
                        >
                            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layout className="w-4 h-4" />}
                            Auto-Format
                        </button>
                        <button
                            onClick={() => setShowAIModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition shadow-md shadow-purple-100"
                        >
                            <Sparkles className="w-4 h-4" />
                            Ask AI
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {saving ? 'Saving...' : 'Save Note'}
                        </button>
                    </div>
                </div>

                {/* Editor Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-8 space-y-6">
                        {/* Title */}
                        <input
                            type="text"
                            placeholder="Note title..."
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full text-4xl font-bold border-none focus:outline-none focus:ring-0 placeholder-gray-300"
                        />

                        {/* Meta Information Row */}
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Favorite Toggle */}
                            <label className="flex items-center gap-2 cursor-pointer px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                <input
                                    type="checkbox"
                                    checked={form.is_favorite}
                                    onChange={(e) => setForm({ ...form, is_favorite: e.target.checked })}
                                    className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                                />
                                <Star className={`w-4 h-4 ${form.is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                                <span className="text-sm font-medium text-gray-700">Favorite</span>
                            </label>

                            {/* File Upload */}
                            <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                                <Upload className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">
                                    {uploading ? 'Uploading...' : 'Upload File'}
                                </span>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        {/* Uploaded Files */}
                        {uploadedFiles.length > 0 && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">Attached Files</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {uploadedFiles.map((file, index) => (
                                        <div key={index} className="relative group">
                                            {file.isImage ? (
                                                <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-50">
                                                    <img
                                                        src={file.url}
                                                        alt={file.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        onClick={() => handleRemoveFile(index)}
                                                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg group hover:bg-gray-50 transition">
                                                    <div
                                                        className="flex-1 min-w-0 cursor-pointer"
                                                        onClick={() => {
                                                            setViewerFileId(file.id);
                                                            setShowViewer(true);
                                                        }}
                                                    >
                                                        <p className="text-sm font-bold text-blue-600 truncate hover:underline">{file.name}</p>
                                                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={file.url}
                                                            download={file.name}
                                                            className="p-2 text-gray-400 hover:text-blue-600 transition"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                        <button
                                                            onClick={() => handleRemoveFile(index)}
                                                            className="p-2 text-gray-400 hover:text-red-600 transition"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Tags</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add tag..."
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleAddTag}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                                >
                                    Add
                                </button>
                            </div>
                            {form.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {form.tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                                        >
                                            {tag}
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                className="hover:text-blue-900 transition"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Rich Text Editor */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Content</label>
                            <div className="border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition">
                                <ReactQuill
                                    theme="snow"
                                    value={form.content}
                                    onChange={(content) => setForm({ ...form, content })}
                                    modules={modules}
                                    placeholder="Start writing your note..."
                                    className="h-96"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Floating Button */}
            <AIFloatingButton onClick={() => setShowAIModal(true)} />

            {/* AI Modal */}
            <AIModal
                isOpen={showAIModal}
                onClose={() => {
                    setShowAIModal(false);
                    setAiContext(null);
                }}
                onAddToNote={handleAIModalAddToNote}
                context={aiContext || form.content}
            />

            {/* File Viewer Modal */}
            <FileViewerModal
                isOpen={showViewer}
                onClose={() => setShowViewer(false)}
                fileId={viewerFileId}
                onAskAI={(text) => {
                    setAiContext(text);
                    setShowAIModal(true);
                }}
            />
        </AppLayout>
    );
}
