import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, MoreHorizontal, Sparkles, Image as ImageIcon, Palette, PenTool, LayoutTemplate, Clock, Paperclip } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { notesApi, filesApi } from '../services/api';
import AppLayout from '../components/AppLayout';
import AIModal from '../components/AIModal';
import DrawingModal from '../components/DrawingModal';
import toast from 'react-hot-toast';

export default function NoteEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [showAIModal, setShowAIModal] = useState(false);
    const [showDrawingModal, setShowDrawingModal] = useState(false);

    // Customization state
    const [bgColor, setBgColor] = useState('#ffffff');
    const [textColor, setTextColor] = useState('#000000');
    const [showColorPicker, setShowColorPicker] = useState(false);

    const quillRef = useRef(null);

    useEffect(() => {
        if (id) {
            fetchNote();
        }
    }, [id]);

    const fetchNote = async () => {
        setLoading(true);
        try {
            const response = await notesApi.getById(id);
            const note = response.data;
            setTitle(note.title);
            setContent(note.content || '');
            setTags(note.tags || []);

            // Load customization
            if (note.meta_data?.bgColor) setBgColor(note.meta_data.bgColor);
            if (note.meta_data?.textColor) setTextColor(note.meta_data.textColor);

        } catch (error) {
            console.error('Failed to fetch note:', error);
            toast.error('Failed to load note');
            navigate('/notes');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (autoSave = false) => {
        if (!title.trim()) {
            if (!autoSave) toast.error('Please enter a title');
            return;
        }

        setSaving(true);
        try {
            const noteData = {
                title,
                content,
                tags,
                meta_data: {
                    bgColor,
                    textColor,
                    lastEdited: new Date().toISOString()
                }
            };

            if (id) {
                await notesApi.update(id, noteData);
                if (!autoSave) toast.success('Note updated saved');
            } else {
                const response = await notesApi.create(noteData);
                toast.success('Note created');
                navigate(`/notes/${response.data.id}/edit`, { replace: true });
            }
        } catch (error) {
            console.error('Failed to save note:', error);
            if (!autoSave) toast.error('Failed to save note');
        } finally {
            setSaving(false);
        }
    };

    // Auto-save every 30 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            if (id && title.trim()) {
                handleSave(true);
            }
        }, 30000);
        return () => clearInterval(timer);
    }, [title, content, tags, bgColor, textColor, id]);

    const handleAIResult = (result, type) => {
        if (type === 'image') {
            const range = quillRef.current?.getEditor().getSelection(true);
            quillRef.current?.getEditor().insertEmbed(range.index, 'image', result);
        } else if (type === 'flowchart') {
            // For mermaid, we insert a code block identifying it as mermaid
            const range = quillRef.current?.getEditor().getSelection(true);
            quillRef.current?.getEditor().insertText(range.index, `\`\`\`mermaid\n${result}\n\`\`\``);
        } else {
            // Text
            const range = quillRef.current?.getEditor().getSelection(true);
            quillRef.current?.getEditor().insertText(range.index, result);
        }
        setShowAIModal(false);
    };

    const handleDrawingSave = (imageUrl) => {
        const range = quillRef.current?.getEditor().getSelection(true);
        // Assuming your backend serves the file at /api/files/{id} and it's public/authenticated correctly
        // Or better, insert it as an image tag if Quill supports it
        quillRef.current?.getEditor().insertEmbed(range ? range.index : 0, 'image', imageUrl);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput('');
        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    // Custom toolbar for Quill
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image', 'code-block'],
            ['clean']
        ],
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <AppLayout>
            <div className="flex flex-col h-[calc(100vh-100px)] bg-gray-50 dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                {/* Header */}
                <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/notes')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Untitled Note"
                            className="text-xl font-bold bg-transparent border-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-600 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 mr-2">
                            {saving ? 'Saving...' : 'Saved'}
                        </span>
                        <button
                            onClick={() => setShowAIModal(true)}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-200 dark:shadow-none hover:scale-105 transition"
                        >
                            <Sparkles className="w-4 h-4" />
                            AI Assistant
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-200 dark:shadow-none hover:bg-primary-700 transition"
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </button>
                    </div>
                </div>

                {/* Toolbar / Metadata Bar */}
                <div className="px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center gap-4 sticky top-[73px] z-10">
                    {/* Customization Toggles */}
                    <div className="flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 pr-4">
                        <button
                            onClick={() => setShowDrawingModal(true)}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-800 rounded-lg transition"
                            title="Draw"
                        >
                            <PenTool className="w-5 h-5" />
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-800 rounded-lg transition"
                                title="Customize Colors"
                            >
                                <Palette className="w-5 h-5" />
                            </button>
                            {showColorPicker && (
                                <div className="absolute top-10 left-0 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 min-w-[200px]">
                                    <div className="mb-3">
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">Background</label>
                                        <div className="flex gap-2">
                                            {['#ffffff', '#f8fafc', '#fdf2f8', '#f0f9ff', '#f0fdf4', '#fffbeb'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setBgColor(c)}
                                                    className={`w-6 h-6 rounded-full border border-gray-200 ${bgColor === c ? 'ring-2 ring-primary-500' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">Text Color</label>
                                        <div className="flex gap-2">
                                            {['#000000', '#334155', '#475569', '#1e293b'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setTextColor(c)}
                                                    className={`w-6 h-6 rounded-full border border-gray-200 ${textColor === c ? 'ring-2 ring-primary-500' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags Input */}
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                        {tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md text-xs font-medium flex items-center gap-1 group">
                                #{tag}
                                <button onClick={() => removeTag(tag)} className="hidden group-hover:block hover:text-red-500">
                                    <times className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={tags.length === 0 ? "Add tags..." : ""}
                            className="bg-transparent border-none focus:ring-0 text-sm min-w-[100px] text-gray-600 dark:text-gray-300 placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 overflow-hidden flex flex-col relative" style={{ backgroundColor: bgColor }}>
                    <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={content}
                        onChange={setContent}
                        modules={modules}
                        className="flex-1 overflow-y-auto h-full note-editor-quill"
                        style={{
                            color: textColor,
                            height: '100%',
                            border: 'none',
                        }}
                    />
                </div>

                {/* Modals */}
                <AIModal
                    isOpen={showAIModal}
                    onClose={() => setShowAIModal(false)}
                    onAddToNote={handleAIResult}
                    context={content}
                />

                <DrawingModal
                    isOpen={showDrawingModal}
                    onClose={() => setShowDrawingModal(false)}
                    noteId={id}
                    onSave={handleDrawingSave}
                />

                {/* Global Styles for Quill Overrides */}
                <style>{`
                .ql-container.ql-snow { border: none !important; font-family: inherit !important; font-size: 16px !important; }
                .ql-toolbar.ql-snow { border-top: none !important; border-left: none !important; border-right: none !important; border-bottom: 1px solid #e5e7eb !important; background: white;  }
                .dark .ql-toolbar.ql-snow { background: #111827; border-color: #1f2937 !important; }
                .dark .ql-stroke { stroke: #9ca3af !important; }
                .dark .ql-fill { fill: #9ca3af !important; }
                .dark .ql-picker { color: #9ca3af !important; }
                .note-editor-quill .ql-editor { padding: 2rem; min-height: 100%; }
            `}</style>
            </div>
        </AppLayout>
    );
}
