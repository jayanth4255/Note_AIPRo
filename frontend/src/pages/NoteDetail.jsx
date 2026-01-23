import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Edit2, Trash2, ArrowLeft, Calendar, Lock,
    Archive as ArchiveIcon, RefreshCw,
    Paperclip, FileText
} from 'lucide-react';
import { notesApi } from '../services/api';
import toast from 'react-hot-toast';
import mermaid from 'mermaid';
import AppLayout from '../components/AppLayout';
import FileViewerModal from '../components/FileViewerModal';
import LockModal from '../components/LockModal';

export default function NoteDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showFileModal, setShowFileModal] = useState(false);
    const [selectedFileId, setSelectedFileId] = useState(null);

    // Privacy
    const [isLocked, setIsLocked] = useState(false);
    const [showLockModal, setShowLockModal] = useState(false);
    const [lockType, setLockType] = useState('unlock'); // 'lock' or 'unlock'

    useEffect(() => {
        if (id) fetchNote();
    }, [id]);

    useEffect(() => {
        // Initialize mermaid for flowcharts
        if (note && note.content) {
            mermaid.initialize({ startOnLoad: true, theme: 'default' });
            setTimeout(() => {
                mermaid.contentLoaded();
            }, 500);
        }
    }, [note]);

    const fetchNote = async () => {
        setLoading(true);
        try {
            const response = await notesApi.getById(id);
            setNote(response.data);
            setIsLocked(response.data.is_locked && !response.data.content); // If locked and no content returned
        } catch (error) {
            console.error('Failed to fetch note:', error);
            toast.error('Failed to load note');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await notesApi.delete(id);
                toast.success('Note deleted');
                navigate('/notes');
            } catch (error) {
                toast.error('Failed to delete note');
            }
        }
    };

    const handleArchive = async () => {
        try {
            if (note.is_archived) {
                await notesApi.unarchive(id);
                toast.success('Note restored');
            } else {
                await notesApi.archive(id);
                toast.success('Note archived');
            }
            fetchNote();
        } catch (error) {
            toast.error('Failed to update archive status');
        }
    };

    const renderContent = () => {
        if (!note?.content) return <p className="text-gray-400 italic">No content</p>;

        const customStyle = {
            backgroundColor: note.meta_data?.bgColor || 'transparent',
            color: note.meta_data?.textColor || 'inherit',
            padding: '2rem',
            borderRadius: '1rem',
        };

        // If simple text (legacy), render as markdown/text. 
        // With Quill, content is HTML.
        const isHtml = /<\/?[a-z][\s\S]*>/i.test(note.content);

        if (isHtml) {
            // Need to process mermaid blocks inside HTML
            // This is a naive implementation; for robust parsing, use a parser
            return (
                <div
                    className="prose prose-lg dark:prose-invert max-w-none ql-editor"
                    style={customStyle}
                    dangerouslySetInnerHTML={{ __html: note.content }}
                />
            );
        } else {
            // Fallback for old notes
            return (
                <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap" style={customStyle}>
                    {note.content}
                </div>
            );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!note) return null;

    if (isLocked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Lock className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">This note is locked</h2>
                <button
                    onClick={() => { setLockType('unlock'); setShowLockModal(true); }}
                    className="px-6 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition"
                >
                    Unlock Note
                </button>
                <LockModal
                    isLocking={false}
                    onUnlock={async (pin) => {
                        await notesApi.privacy.unlockNote(id, pin);
                        fetchNote(); // Reload content
                    }}
                    onClose={() => setShowLockModal(false)}
                />
            </div>
        );
    }

    return (
        <AppLayout>
            <div className="min-h-full bg-white dark:bg-gray-950 pb-20 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                    <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                            >
                                <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                    {note.title}
                                </h1>
                                <div className="flex items-center gap-3 text-xs font-medium text-gray-400 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(note.updated_at).toLocaleDateString()}
                                    </span>
                                    {note.tags.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleArchive}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 hover:text-amber-600 transition"
                                title={note.is_archived ? "Unarchive" : "Archive"}
                            >
                                {note.is_archived ? <RefreshCw className="w-5 h-5" /> : <ArchiveIcon className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => navigate(`/notes/${id}/edit`)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 hover:text-primary-600 transition"
                                title="Edit"
                            >
                                <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-gray-500 hover:text-red-600 transition"
                                title="Delete"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <div className="max-w-5xl mx-auto px-6 py-10">
                    <div className="min-h-[50vh] transition-all bg-white dark:bg-gray-900 rounded-3xl p-1 shadow-sm border border-gray-100 dark:border-gray-800">
                        {renderContent()}
                    </div>

                    {/* Attachments Section */}
                    {note.files && note.files.length > 0 && (
                        <div className="mt-12">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                <Paperclip className="w-5 h-5" />
                                Attachments ({note.files.length})
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {note.files.map(file => (
                                    <div
                                        key={file.id}
                                        className="group relative aspect-square bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer hover:shadow-lg transition"
                                        onClick={() => { setSelectedFileId(file.id); setShowFileModal(true); }}
                                    >
                                        {file.file_type.startsWith('image/') ? (
                                            <img src={`/api/files/${file.id}/thumbnail`} alt={file.filename} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                                <FileText className="w-10 h-10 mb-2" />
                                                <span className="text-xs font-bold uppercase">{file.file_type.split('/')[1]}</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white p-4 text-center">
                                            <p className="text-sm font-bold truncate w-full">{file.original_filename}</p>
                                            <p className="text-xs opacity-75">{(file.file_size / 1024).toFixed(0)} KB</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modals */}
                <FileViewerModal
                    isOpen={showFileModal}
                    onClose={() => setShowFileModal(false)}
                    fileId={selectedFileId}
                />
            </div>
        </AppLayout>
    );
}
