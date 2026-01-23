import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive as ArchiveIcon, Search, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { notesApi } from '../services/api';

export default function Archive() {
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchArchivedNotes();
    }, []);

    const fetchArchivedNotes = async () => {
        setLoading(true);
        try {
            // Fetch notes with archived=true
            const response = await notesApi.getAll({ skip: 0, limit: 100, archived: true });
            setNotes(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch archived notes:', err);
            setError('Failed to load archived notes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUnarchive = async (noteId, e) => {
        e.stopPropagation();
        try {
            await notesApi.unarchive(noteId);
            // Remove from list locally
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (err) {
            console.error('Failed to unarchive note:', err);
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
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                                <ArchiveIcon className="w-8 h-8" />
                            </div>
                            Archive
                        </h1>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            View and restore your archived notes.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search archive..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none w-full md:w-64"
                            />
                        </div>
                        <button
                            onClick={fetchArchivedNotes}
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
                            onClick={fetchArchivedNotes}
                            className="mt-4 px-6 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
                            <ArchiveIcon className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">No archived notes</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-2">
                            {searchQuery ? 'No matches found for your search.' : 'Notes you archive will appear here safely stored away.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNotes.map(note => (
                            <div
                                key={note.id}
                                onClick={() => navigate(`/notes/${note.id}`)}
                                className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                            >
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                    {note.title}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 mb-4 h-12 leading-relaxed">
                                    {note.content?.replace(/<[^>]*>/g, '') || 'No content...'}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-800">
                                    <span className="text-xs font-medium text-gray-400">
                                        {new Date(note.updated_at).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={(e) => handleUnarchive(note.id, e)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        Restore
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
