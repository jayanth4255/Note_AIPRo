import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { notesApi, versionsApi, aiApi } from '../services/api';
import { ArrowLeft, Edit, Trash2, Download, Star, Clock, Sparkles, CheckSquare, Brain, List, Loader2 } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import AIModal from '../components/AIModal';
import FileViewerModal from '../components/FileViewerModal';

export default function NoteDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState(null);
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiContext, setAiContext] = useState(null);
    const [viewerFileId, setViewerFileId] = useState(null);
    const [showViewer, setShowViewer] = useState(false);

    // New AI features state
    const [aiLoading, setAiLoading] = useState(false);
    const [tasks, setTasks] = useState(null);
    const [relatedNotes, setRelatedNotes] = useState(null);
    const [flashcards, setFlashcards] = useState(null);

    useEffect(() => {
        fetchNoteAndVersions();
    }, [id]);

    const fetchNoteAndVersions = async () => {
        try {
            const [noteRes, versionsRes] = await Promise.all([
                notesApi.getById(id),
                versionsApi.getHistory(id)
            ]);
            setNote(noteRes.data);
            setVersions(versionsRes.data);
        } catch (error) {
            console.error('Failed to fetch note:', error);
            alert('Failed to load note');
            navigate('/notes');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            await notesApi.delete(id);
            navigate('/notes');
        } catch (error) {
            console.error('Failed to delete note:', error);
            alert('Failed to delete note');
        }
    };

    const handleExportPdf = async () => {
        try {
            const response = await notesApi.exportPdf(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${note.title}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Failed to export PDF');
        }
    };

    const handleExtractTasks = async () => {
        setAiLoading(true);
        try {
            const response = await aiApi.getNoteTasks(id);
            setTasks(response.data.tasks);
        } catch (error) {
            console.error('Failed to extract tasks:', error);
            alert('AI task extraction failed.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleGenerateFlashcards = async () => {
        setAiLoading(true);
        try {
            const response = await aiApi.flashcards(id);
            setFlashcards(response.data.flashcards);
        } catch (error) {
            console.error('Failed to generate flashcards:', error);
            alert('AI flashcard generation failed.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleFindRelated = async () => {
        setAiLoading(true);
        try {
            const response = await aiApi.getRelatedNotes(id);
            setRelatedNotes(response.data.related_notes);
        } catch (error) {
            console.error('Failed to find related notes:', error);
            alert('AI related notes search failed.');
        } finally {
            setAiLoading(false);
        }
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
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link
                        to="/notes"
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Notes
                    </Link>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportPdf}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition"
                        >
                            <Download className="w-4 h-4" />
                            Export PDF
                        </button>
                        <button
                            onClick={() => setShowAIModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg transition"
                        >
                            <Sparkles className="w-4 h-4" />
                            Ask AI
                        </button>
                        <button
                            onClick={handleExtractTasks}
                            disabled={aiLoading}
                            className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-300 transition"
                        >
                            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                            Tasks
                        </button>
                        <button
                            onClick={handleGenerateFlashcards}
                            disabled={aiLoading}
                            className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg border border-orange-300 transition"
                        >
                            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                            Flashcards
                        </button>
                        <button
                            onClick={handleFindRelated}
                            disabled={aiLoading}
                            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-300 transition"
                        >
                            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <List className="w-4 h-4" />}
                            Related
                        </button>
                        <Link
                            to={`/notes/${id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-300 transition"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Note Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-8 space-y-6">
                        {/* Title & Meta */}
                        <div>
                            <div className="flex items-start justify-between mb-2">
                                <h1 className="text-4xl font-bold text-gray-900">{note.title}</h1>
                                {note.is_favorite && <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Updated {new Date(note.updated_at).toLocaleString()}
                                </span>
                                {note.meta_data?.category && (
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                                        {note.meta_data.category}
                                    </span>
                                )}
                                <span>Version {note.version}</span>
                            </div>
                        </div>

                        {/* Tags */}
                        {note.tags && note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {note.tags.map((tag, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Content */}
                        <div
                            className="prose prose-blue max-w-none"
                            dangerouslySetInnerHTML={{ __html: note.content || 'No content' }}
                        />

                        {/* Files */}
                        {note.files && note.files.length > 0 && (
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
                                <div className="space-y-2">
                                    {note.files.map((file) => (
                                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition">
                                            <div
                                                className="cursor-pointer flex-1"
                                                onClick={() => {
                                                    setViewerFileId(file.id);
                                                    setShowViewer(true);
                                                }}
                                            >
                                                <p className="font-medium text-blue-600 hover:underline">{file.original_filename}</p>
                                                <p className="text-sm text-gray-500">
                                                    {(file.file_size / 1024).toFixed(2)} KB
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleExportPdf()} // Existing download logic
                                                    className="text-gray-400 hover:text-blue-600 p-2"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Insights Board */}
                {(tasks || flashcards || relatedNotes) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                        {tasks && tasks.length > 0 && (
                            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 shadow-sm">
                                <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                                    <CheckSquare className="w-5 h-5" />
                                    Extracted Tasks
                                </h3>
                                <ul className="space-y-3">
                                    {tasks.map((t, idx) => (
                                        <li key={idx} className="flex items-start gap-3 p-2 bg-white/50 rounded-lg">
                                            <div className="mt-1 w-5 h-5 rounded border border-emerald-300 flex-shrink-0"></div>
                                            <div>
                                                <p className="font-medium text-emerald-900">{t.task}</p>
                                                {t.deadline && <p className="text-xs text-emerald-600 font-medium">Due: {t.deadline}</p>}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {flashcards && flashcards.length > 0 && (
                            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 shadow-sm">
                                <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                                    <Brain className="w-5 h-5" />
                                    Flashcards
                                </h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                    {flashcards.map((f, idx) => (
                                        <div key={idx} className="p-4 bg-white/60 rounded-xl border border-orange-100">
                                            <p className="font-bold text-orange-900 text-sm">Q: {f.question}</p>
                                            <p className="text-orange-800 text-sm mt-2 pt-2 border-t border-orange-100 italic">A: {f.answer}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {relatedNotes && relatedNotes.length > 0 && (
                            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 shadow-sm md:col-span-2">
                                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    <List className="w-5 h-5" />
                                    Related Notes
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {relatedNotes.map(rn => (
                                        <Link
                                            key={rn.id}
                                            to={`/notes/${rn.id}`}
                                            className="p-4 bg-white/50 rounded-xl hover:bg-white transition-all border border-blue-100 hover:shadow-md flex items-center gap-2 text-blue-800 font-medium"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                            {rn.title}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Version History */}
                {versions.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Version History</h3>
                        <div className="space-y-3">
                            {versions.map((version) => (
                                <div key={version.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                                        v{version.version_number}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{version.title}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(version.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <AIModal
                isOpen={showAIModal}
                onClose={() => {
                    setShowAIModal(false);
                    setAiContext(null);
                }}
                onAddToNote={() => fetchNoteAndVersions()} // Refresh if AI adds something (though in detail view we might just show it)
                context={aiContext || note?.content}
            />
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
