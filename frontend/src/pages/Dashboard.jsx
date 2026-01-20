import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notesApi, analyticsApi, aiApi } from '../services/api';
import { FileText, Plus, TrendingUp, Clock, Star, Sparkles, Search, Brain, Loader2, MessageSquare, Calendar } from 'lucide-react';
import AppLayout from '../components/AppLayout';

export default function Dashboard() {
    const { user } = useAuth();
    const [recentNotes, setRecentNotes] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [counters, setCounters] = useState({ notes: 0, week: 0, ai: 0 });

    // New AI Features State
    const [askNotesQuery, setAskNotesQuery] = useState('');
    const [askNotesAnswer, setAskNotesAnswer] = useState(null);
    const [askNotesLoading, setAskNotesLoading] = useState(false);
    const [dailyBrief, setDailyBrief] = useState(null);
    const [briefLoading, setBriefLoading] = useState(false);

    useEffect(() => {
        fetchData();
        fetchDailyBrief();
    }, []);

    // Animate counters on load
    useEffect(() => {
        if (analytics) {
            const duration = 1000;
            const steps = 50;
            const notesIncrement = analytics.total_notes / steps;
            const weekIncrement = analytics.notes_this_week / steps;
            const aiIncrement = analytics.ai_operations_count / steps;

            let currentStep = 0;
            const timer = setInterval(() => {
                if (currentStep < steps) {
                    setCounters({
                        notes: Math.floor(notesIncrement * currentStep),
                        week: Math.floor(weekIncrement * currentStep),
                        ai: Math.floor(aiIncrement * currentStep)
                    });
                    currentStep++;
                } else {
                    setCounters({
                        notes: analytics.total_notes,
                        week: analytics.notes_this_week,
                        ai: analytics.ai_operations_count
                    });
                    clearInterval(timer);
                }
            }, duration / steps);

            return () => clearInterval(timer);
        }
    }, [analytics]);

    const fetchData = async () => {
        try {
            const [notesRes, analyticsRes] = await Promise.all([
                notesApi.getAll({ limit: 6 }),
                analyticsApi.getDashboard()
            ]);
            // Filter out hidden notes
            const visibleNotes = notesRes.data.filter(note => !note.is_hidden);
            setRecentNotes(visibleNotes.slice(0, 6));
            setAnalytics(analyticsRes.data);
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

    const stats = [
        {
            label: 'Total Notes',
            value: counters.notes,
            icon: FileText,
            gradient: 'from-blue-500 to-cyan-500',
            glowColor: 'rgba(59, 130, 246, 0.5)'
        },
        {
            label: 'This Week',
            value: counters.week,
            icon: TrendingUp,
            gradient: 'from-green-500 to-emerald-500',
            glowColor: 'rgba(34, 197, 94, 0.5)'
        },
        {
            label: 'AI Operations',
            value: counters.ai,
            icon: Sparkles,
            gradient: 'from-purple-500 to-pink-500',
            glowColor: 'rgba(168, 85, 247, 0.5)'
        },
    ];

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
                        <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-purple-300 opacity-20"></div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="space-y-8 animate-fadeIn">
                {/* Welcome Header with Gradient */}
                <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 animate-gradient">
                    <div className="absolute inset-0 bg-grid opacity-10"></div>
                    <div className="relative z-10">
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Welcome back, {user?.name?.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-purple-100 text-lg">Here's what's happening with your notes today.</p>
                    </div>
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                {/* Ask My Notes - AI Search */}
                <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-lg rounded-3xl border border-white/20 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Ask My Notes</h2>
                            <p className="text-white/60 text-sm">AI will search your notes to answer</p>
                        </div>
                    </div>
                    <form onSubmit={handleAskNotes} className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <input
                                type="text"
                                value={askNotesQuery}
                                onChange={(e) => setAskNotesQuery(e.target.value)}
                                placeholder="What does my note about... say?"
                                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={askNotesLoading}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {askNotesLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            Ask
                        </button>
                    </form>
                    {askNotesAnswer && (
                        <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20">
                            <div className="flex items-start gap-3">
                                <MessageSquare className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-white/90 whitespace-pre-wrap">{askNotesAnswer.answer}</p>
                                    {askNotesAnswer.notes_searched && (
                                        <p className="text-xs text-white/50 mt-2">Searched {askNotesAnswer.notes_searched} notes</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Daily Brief */}
                {(dailyBrief || briefLoading) && (
                    <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 backdrop-blur-lg rounded-3xl border border-white/20 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Daily Brief</h2>
                                <p className="text-white/60 text-sm">AI summary of your week</p>
                            </div>
                        </div>
                        {briefLoading ? (
                            <div className="flex items-center gap-3 text-white/60">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Generating your personalized brief...</span>
                            </div>
                        ) : dailyBrief?.brief ? (
                            <div className="space-y-3">
                                <p className="text-white/90 whitespace-pre-wrap leading-relaxed">{dailyBrief.brief}</p>
                                <div className="flex gap-4 text-xs text-white/50 pt-2 border-t border-white/10">
                                    <span>{dailyBrief.recent_notes_count} recent notes</span>
                                    <span>{dailyBrief.pending_tasks_count} pending tasks</span>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Stats Grid with Glassmorphism */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={stat.label}
                                className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 p-6 hover-lift hover-glow transition-all duration-300"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-white/70 font-medium">{stat.label}</p>
                                        <p className="text-4xl font-bold text-white mt-1 tabular-nums">
                                            {stat.value}
                                        </p>
                                    </div>
                                </div>
                                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`}></div>
                                {/* Floating animation */}
                                <div className="absolute -right-5 -bottom-5 w-20 h-20 bg-gradient-to-br from-white/5 to-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                            </div>
                        );
                    })}
                </div>

                {/* Recent Notes with Modern Design */}
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Star className="w-6 h-6 text-yellow-400" />
                                Recent Notes
                            </h2>
                            <p className="text-white/60 text-sm mt-1">Your latest creative work</p>
                        </div>
                        <Link
                            to="/notes"
                            className="text-sm px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition backdrop-blur-sm border border-white/20"
                        >
                            View all
                        </Link>
                    </div>

                    {recentNotes.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                                <FileText className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No notes yet</h3>
                            <p className="text-white/60 mb-6">Get started by creating your first note</p>
                            <Link
                                to="/notes/new"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-medium transition shadow-lg hover:shadow-2xl"
                            >
                                <Plus className="w-5 h-5" />
                                Create Note
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                            {recentNotes.map((note, index) => (
                                <Link
                                    key={note.id}
                                    to={`/notes/${note.id}`}
                                    className="group block p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-300 hover-lift"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-bold text-white group-hover:text-gradient transition line-clamp-1 flex-1 text-lg">
                                            {note.title}
                                            {note.is_locked && <span className="ml-2">🔒</span>}
                                        </h3>
                                        {note.is_favorite && (
                                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-sm text-white/60 line-clamp-2 mb-3">
                                        {note.content?.replace(/<[^>]*>/g, '') || 'No content'}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-white/50">
                                        <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                                        {note.tags && note.tags.length > 0 && (
                                            <span className="px-2 py-1 bg-white/10 rounded-lg">
                                                {note.tags[0]}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                {analytics?.recent_activities && analytics.recent_activities.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-6">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <Clock className="w-6 h-6 text-blue-400" />
                            Recent Activity
                        </h2>
                        <div className="space-y-3">
                            {analytics.recent_activities.slice(0, 5).map((activity, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition">
                                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white">{activity.description}</p>
                                        <p className="text-xs text-white/50 mt-1">
                                            {new Date(activity.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
