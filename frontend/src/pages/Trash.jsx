import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Search, RefreshCw, AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import { notesApi } from '../services/api';

export default function Trash() {
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTrashedNotes();
    }, []);

    const fetchTrashedNotes = async () => {
        setLoading(true);
        try {
            const response = await notesApi.getTrashed({ skip: 0, limit: 100 });
            setNotes(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch trashed notes:', err);
            setError('Failed to load trashed notes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (noteId, e) => {
        e.stopPropagation();
        try {
            await notesApi.restore(noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (err) {
            console.error('Failed to restore note:', err);
        }
    };

    const handleDeletePermanently = async (noteId, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to permanently delete this note? This action cannot be undone.')) {
            try {
                await notesApi.delete(noteId); //Backend handles permanent if already trashed or via param
                setNotes(prev => prev.filter(n => n.id !== noteId));
            } catch (err) {
                console.error('Failed to delete note permanently:', err);
            }
        }
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-6 lg:p-10">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button
                            onClick={() => navigate('/notes')}
                            className="bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg p-2 mb-2 transition flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium"
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
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Notes here are deleted but can be restored.
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
                            onClick={fetchTrashedNotes}
                            className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            <RefreshCw className={`w-5 h-5 text-gray-500 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

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
                            onClick={fetchTrashedNotes}
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
                            {searchQuery ? 'No matches found for your search.' : 'Notes you delete will appear here for a while.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNotes.map(note => (
                            <div
                                key={note.id}
                                className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                            >
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                    {note.title}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 mb-4 h-12 leading-relaxed">
                                    {note.content?.replace(/<[^>]*>/g, '') || 'No content...'}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-800">
                                    <span className="text-xs font-medium text-gray-400">
                                        {new Date(note.updated_at).toLocaleDateString()}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => handleRestore(note.id, e)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition"
                                            title="Restore"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            Restore
                                        </button>
                                        <button
                                            onClick={(e) => handleDeletePermanently(note.id, e)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                                            title="Delete Permanently"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
