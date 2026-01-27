import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Search, RefreshCw, AlertCircle, ArrowLeft, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { notesApi } from '../services/api';
import AppLayout from '../components/AppLayout';

export default function Trash() {
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
    const [emptyingTrash, setEmptyingTrash] = useState(false);

    useEffect(() => {
        fetchTrashNotes();
    }, []);

    const fetchTrashNotes = async () => {
        setLoading(true);
        try {
            const response = await notesApi.getTrash({ skip: 0, limit: 100 });
            setNotes(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch trash:', err);
            setError('Failed to load trash. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (noteId, e) => {
        e.stopPropagation();
        try {
            await notesApi.restore(noteId);
            // Remove from list locally
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (err) {
            console.error('Failed to restore note:', err);
            alert('Failed to restore note. Please try again.');
        }
    };

    const handlePermanentDelete = async (noteId, noteTitle, e) => {
        e.stopPropagation();
        if (!confirm(`Permanently delete "${noteTitle}"? This cannot be undone!`)) {
            return;
        }

        try {
            await notesApi.permanentDelete(noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (err) {
            console.error('Failed to permanently delete note:', err);
            alert('Failed to delete note. Please try again.');
        }
    };

    const handleEmptyTrash = async () => {
        setEmptyingTrash(true);
        try {
            await notesApi.emptyTrash();
            setNotes([]);
            setShowEmptyConfirm(false);
        } catch (err) {
            console.error('Failed to empty trash:', err);
            alert('Failed to empty trash. Please try again.');
        } finally {
            setEmptyingTrash(false);
        }
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <AppLayout>
            <div className="space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button
                            onClick={() => navigate('/notes')}
                            className="bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg p-2 mb-2 transition flex items-center gap-2 text-sm text-gray-400 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Notes
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            Trash
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Deleted notes are stored here. Restore or permanently delete them.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search trash..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none w-full md:w-64"
                            />
                        </div>
                        <button
                            onClick={fetchTrashNotes}
                            className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            <RefreshCw className={`w-5 h-5 text-gray-500 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        {notes.length > 0 && (
                            <button
                                onClick={() => setShowEmptyConfirm(true)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Empty Trash
                            </button>
                        )}
                    </div>
                </div>

                {/* Empty Trash Confirmation Modal */}
                {showEmptyConfirm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-800 shadow-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Empty Trash?</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                This will permanently delete all {notes.length} note{notes.length !== 1 ? 's' : ''} in trash. This action cannot be undone!
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowEmptyConfirm(false)}
                                    disabled={emptyingTrash}
                                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEmptyTrash}
                                    disabled={emptyingTrash}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {emptyingTrash ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Empty Trash
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-red-100 dark:border-red-900/30">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                        <p className="text-red-900 dark:text-red-200 font-medium">{error}</p>
                        <button
                            onClick={fetchTrashNotes}
                            className="mt-4 px-6 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
                            <Trash2 className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Trash is empty</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-2">
                            {searchQuery ? 'No matches found for your search.' : 'Deleted notes will appear here.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNotes.map(note => (
                            <div
                                key={note.id}
                                className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                            >
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">
                                    {note.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4 h-12 leading-relaxed">
                                    {note.content?.replace(/<[^>]*>/g, '') || 'No content...'}
                                </p>

                                <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-gray-50 dark:border-gray-800">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-400">
                                            Deleted {new Date(note.deleted_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => handleRestore(note.id, e)}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Restore
                                        </button>
                                        <button
                                            onClick={(e) => handlePermanentDelete(note.id, note.title, e)}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            Delete Forever
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
