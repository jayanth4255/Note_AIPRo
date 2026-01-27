import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notesApi, aiApi } from '../services/api';
import { FileText, Plus, Clock, Star, Sparkles, Search, Brain, Loader2, MessageSquare, Calendar, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../components/AppLayout';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [recentNotes, setRecentNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    // New AI Features State
    const [askNotesQuery, setAskNotesQuery] = useState('');
    const [askNotesAnswer, setAskNotesAnswer] = useState(null);
    const [askNotesLoading, setAskNotesLoading] = useState(false);
    const [dailyBrief, setDailyBrief] = useState(null);
    const [briefLoading, setBriefLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const notesRes = await notesApi.getAll({ limit: 6 });
            // Filter out hidden and trashed notes
            const visibleNotes = notesRes.data.filter(note => !note.is_hidden && !note.is_trash);
            setRecentNotes(visibleNotes.slice(0, 6));
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyBrief = async () => {
        setBriefLoading(true);
        try {
            const response = await aiApi.dailyBrief();
            setDailyBrief(response.data);
        } catch (error) {
            console.error('Failed to fetch daily brief:', error);
        } finally {
            setBriefLoading(false);
        }
    };

    const handleAskNotes = async (e) => {
        e.preventDefault();
        if (!askNotesQuery.trim()) return;

        setAskNotesLoading(true);
        setAskNotesAnswer(null);
        try {
            const response = await aiApi.askNotes(askNotesQuery);
            setAskNotesAnswer(response.data);
        } catch (error) {
            console.error('Failed to ask notes:', error);
            setAskNotesAnswer({ answer: 'Sorry, I encountered an error processing your question.' });
        } finally {
            setAskNotesLoading(false);
        }
    };

    const handleCreateNoteFromAI = async () => {
        if (!askNotesAnswer) return;

        try {
            const title = `AI Answer: ${askNotesQuery}`;
            const content = `<h3>Question: ${askNotesQuery}</h3><p>${askNotesAnswer.answer}</p>`;
            const noteData = {
                title,
                content,
                tags: ['AI', 'Q&A'],
                meta_data: { source: 'dashboard_ai' }
            };

            const response = await notesApi.create(noteData);
            toast.success('Note created from answer');
            navigate(`/notes/${response.data.id}/edit`);
        } catch (error) {
            console.error('Failed to create note from AI:', error);
            toast.error('Failed to create note');
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Welcome Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Welcome back, {user?.name?.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Here's what's happening with your notes.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to="/notes/new"
                            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm hover:shadow"
                        >
                            <Plus className="w-4 h-4" />
                            New Note
                        </Link>
                    </div>
                </div>

                {/* Ask My Notes & Daily Brief Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Ask My Notes */}
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                                <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ask My Notes</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">AI search across your knowledge base</p>
                            </div>
                        </div>
                        <form onSubmit={handleAskNotes} className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={askNotesQuery}
                                    onChange={(e) => setAskNotesQuery(e.target.value)}
                                    placeholder="Ask a question about your notes..."
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-gray-900 dark:text-gray-100 placeholder-gray-400"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={askNotesLoading}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm"
                            >
                                {askNotesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
                            </button>
                        </form>
                        {askNotesAnswer && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex items-start gap-3">
                                    <MessageSquare className="w-4 h-4 text-primary-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{askNotesAnswer.answer}</p>
                                        {askNotesAnswer.notes_searched && (
                                            <p className="text-xs text-gray-400 mt-2">Searched {askNotesAnswer.notes_searched} notes</p>
                                        )}
                                        <button
                                            onClick={handleCreateNoteFromAI}
                                            className="mt-3 text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Save as Note
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Daily Brief */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Daily Brief</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">AI summary of your week</p>
                        </div>
                    </div>
                    {briefLoading ? (
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm py-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generating your personalized brief...</span>
                        </div>
                    ) : dailyBrief?.brief ? (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{dailyBrief.brief}</p>
                            <div className="flex gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <span>{dailyBrief.recent_notes_count} recent notes</span>
                                <span>{dailyBrief.pending_tasks_count} pending tasks</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-sm text-gray-500 mb-3">Get a personalized summary of your week using AI.</p>
                            <button
                                onClick={fetchDailyBrief}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition shadow-sm hover:shadow flex items-center justify-center gap-2 mx-auto"
                            >
                                <Sparkles className="w-4 h-4" />
                                Generate Report
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Notes */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        Recent Notes
                    </h2>
                    <Link to="/notes" className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline">
                        View all
                    </Link>
                </div>

                {recentNotes.length === 0 ? (
                    <div className="card p-8 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No notes yet</h3>
                        <p className="text-gray-500 mb-4 text-sm">Create your first note to get started</p>
                        <Link
                            to="/notes/new"
                            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Create Note
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentNotes.map((note) => (
                            <Link
                                key={note.id}
                                to={`/notes/${note.id}`}
                                className="card p-4 hover:shadow-md transition-shadow group border border-gray-200 dark:border-gray-800"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        {note.title}
                                        {note.is_locked && <span className="ml-2 text-xs">🔒</span>}
                                    </h3>
                                    {note.is_favorite && (
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                                    )}
                                    <button
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (confirm('Move this note to trash?')) {
                                                try {
                                                    await notesApi.moveToTrash(note.id);
                                                    setRecentNotes(recentNotes.filter(n => n.id !== note.id));
                                                    toast.success('Moved to trash');
                                                } catch (err) {
                                                    toast.error('Failed to move to trash');
                                                }
                                            }
                                        }}
                                        className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 h-10">
                                    {note.content?.replace(/<[^>]*>/g, '') || 'No content'}
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                                    {note.tags && note.tags.length > 0 && (
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                                            {note.tags[0]}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
