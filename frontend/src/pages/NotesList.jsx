import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notesApi, aiApi, privacyApi } from '../services/api';
import { Search, Plus, Grid, List, Star, Trash2, Edit, Filter, Share2, Mail, MessageCircle, Copy, Check, Image as ImageIcon, FileText, X, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import LockModal from '../components/LockModal';

export default function NotesList() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'favorites', 'images', 'text'
    const [copiedId, setCopiedId] = useState(null);
    const [summaryNote, setSummaryNote] = useState(null);
    const [summaryText, setSummaryText] = useState('');
    const [showSummary, setShowSummary] = useState(false);
    const [showHidden, setShowHidden] = useState(false);
    const [lockModalNote, setLockModalNote] = useState(null);
    const [isLocking, setIsLocking] = useState(false);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const response = await notesApi.getAll(0, 100, false);
            setNotes(response.data);
        } catch (error) {
            console.error('Failed to fetch notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.preventDefault();
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            await notesApi.delete(id);
            setNotes(notes.filter(note => note.id !== id));
        } catch (error) {
            console.error('Failed to delete note:', error);
            alert('Failed to delete note');
        }
    };

    const handleToggleFavorite = async (id, currentStatus, e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            await notesApi.update(id, { is_favorite: !currentStatus });
            setNotes(notes.map(note =>
                note.id === id ? { ...note, is_favorite: !currentStatus } : note
            ));
        } catch (error) {
            console.error('Failed to update favorite:', error);
        }
    };

    const handleShare = async (note, method, e) => {
        e.preventDefault();
        e.stopPropagation();

        const shareText = `${note.title}\n\n${note.content?.replace(/<[^>]*>/g, '') || ''}`;
        const shareUrl = window.location.origin + `/notes/${note.id}`;

        switch (method) {
            case 'native':
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: note.title,
                            text: shareText,
                            url: shareUrl
                        });
                    } catch (error) {
                        console.log('Share cancelled');
                    }
                } else {
                    handleShare(note, 'copy', e);
                }
                break;

            case 'whatsapp':
                const whatsappText = encodeURIComponent(shareText + '\n\n' + shareUrl);
                window.open(`https://wa.me/?text=${whatsappText}`, '_blank');
                break;

            case 'email':
                const emailBody = encodeURIComponent(shareText + '\n\n' + shareUrl);
                window.location.href = `mailto:?subject=${encodeURIComponent(note.title)}&body=${emailBody}`;
                break;

            case 'copy':
                try {
                    await navigator.clipboard.writeText(shareText + '\n\n' + shareUrl);
                    setCopiedId(note.id);
                    setTimeout(() => setCopiedId(null), 2000);
                } catch (error) {
                    alert('Failed to copy to clipboard');
                }
                break;
        }
    };

    const hasImages = (note) => {
        return note.files?.some(f => f.isImage) || note.content?.includes('<img') || note.content?.includes('![');
    };

    const filteredNotes = notes.filter(note => {
        // Apply search filter
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content?.toLowerCase().includes(searchQuery.toLowerCase());

        // Apply category filter
        let matchesFilter = true;
        switch (activeFilter) {
            case 'favorites':
                matchesFilter = note.is_favorite;
                break;
            case 'images':
                matchesFilter = hasImages(note);
                break;
            case 'text':
                matchesFilter = !hasImages(note);
                break;
            default:
                matchesFilter = true;
        }

        return matchesSearch && matchesFilter;
    });

    const filterCounts = {
        all: notes.length,
        favorites: notes.filter(n => n.is_favorite).length,
        images: notes.filter(n => hasImages(n)).length,
        text: notes.filter(n => !hasImages(n)).length
    };

    const handleSummarize = async (note, e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            // Show loading state or toast here if needed
            const response = await aiApi.summarize(note.content || '', 'summarize');
            setSummaryNote(note);
            setSummaryText(response.data.result);
            setShowSummary(true);
        } catch (error) {
            console.error('Summarize failed:', error);
            alert('Failed to summarize note');
        }
    };

    const handleLock = async (note, e) => {
        e.preventDefault();
        e.stopPropagation();
        setLockModalNote(note);
        setIsLocking(true);
    };

    const handleUnlock = async (note, e) => {
        e.preventDefault();
        e.stopPropagation();
        setLockModalNote(note);
        setIsLocking(false);
    };

    const handleLockSubmit = async (pin) => {
        try {
            await privacyApi.lockNote(lockModalNote.id, pin);
            setNotes(notes.map(n =>
                n.id === lockModalNote.id ? { ...n, is_locked: true } : n
            ));
        } catch (error) {
            throw new Error(error.response?.data?.detail || 'Failed to lock note');
        }
    };

    const handleUnlockSubmit = async (pin) => {
        try {
            await privacyApi.unlockNote(lockModalNote.id, pin);
            setNotes(notes.map(n =>
                n.id === lockModalNote.id ? { ...n, is_locked: false } : n
            ));
        } catch (error) {
            throw new Error(error.response?.data?.detail || 'Incorrect PIN');
        }
    };

    const handleToggleHide = async (id, currentStatus, e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            await privacyApi.toggleHide(id);
            setNotes(notes.map(note =>
                note.id === id ? { ...note, is_hidden: !currentStatus } : note
            ));
        } catch (error) {
            console.error('Failed to toggle hide:', error);
            alert('Failed to hide/unhide note');
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
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
                        <p className="text-gray-600 mt-1">{filteredNotes.length} of {notes.length} notes</p>
                    </div>
                    <Link
                        to="/notes/new"
                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        New Note
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Filter className="w-4 h-4" />
                        <span>Filter:</span>
                    </div>
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${activeFilter === 'all'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All ({filterCounts.all})
                    </button>
                    <button
                        onClick={() => setActiveFilter('favorites')}
                        className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${activeFilter === 'favorites'
                            ? 'bg-yellow-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <Star className={`w-4 h-4 ${activeFilter === 'favorites' ? 'fill-white' : ''}`} />
                        Favorites ({filterCounts.favorites})
                    </button>
                    <button
                        onClick={() => setActiveFilter('images')}
                        className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${activeFilter === 'images'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <ImageIcon className="w-4 h-4" />
                        Images ({filterCounts.images})
                    </button>
                    <button
                        onClick={() => setActiveFilter('text')}
                        className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${activeFilter === 'text'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        Text ({filterCounts.text})
                    </button>
                </div>

                {/* Search & View Toggle */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setView('grid')}
                            className={`p-3 rounded-xl border transition ${view === 'grid' ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`p-3 rounded-xl border transition ${view === 'list' ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Notes Grid/List */}
                {filteredNotes.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No notes found</h3>
                        <p className="text-gray-600 mb-6">Try adjusting your filters or create a new note</p>
                        <Link
                            to="/notes/new"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition"
                        >
                            <Plus className="w-5 h-5" />
                            Create Note
                        </Link>
                    </div>
                ) : (
                    <div className={view === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'space-y-4'
                    }>
                        {filteredNotes.map((note) => (
                            <div
                                key={note.id}
                                className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl transition-all duration-200 group overflow-hidden"
                            >
                                <Link to={`/notes/${note.id}`} className="block p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition line-clamp-2 flex-1">
                                            {note.title}
                                        </h3>
                                        <button
                                            onClick={(e) => handleToggleFavorite(note.id, note.is_favorite, e)}
                                            className="flex-shrink-0 ml-2 p-1 hover:scale-110 transition"
                                        >
                                            <Star className={`w-5 h-5 ${note.is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                                        </button>
                                    </div>

                                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                                        {note.content?.replace(/<[^>]*>/g, '') || 'No content'}
                                    </p>

                                    {note.tags && note.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {note.tags.slice(0, 3).map((tag, idx) => (
                                                <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg">
                                                    {tag}
                                                </span>
                                            ))}
                                            {note.tags.length > 3 && (
                                                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                                                    +{note.tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Updated {new Date(note.updated_at).toLocaleDateString()}</span>
                                        {hasImages(note) && <ImageIcon className="w-4 h-4 text-green-600" />}
                                    </div>
                                </Link>

                                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1">
                                        <Link
                                            to={`/notes/${note.id}/edit`}
                                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={(e) => handleSummarize(note, e)}
                                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                            title="Summarize"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Share Dropdown */}
                                    <div className="relative group/share">
                                        <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition">
                                            {copiedId === note.id ? (
                                                <Check className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <Share2 className="w-4 h-4" />
                                            )}
                                        </button>

                                        {/* Share menu */}
                                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover/share:block z-10">
                                            <div className="bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[160px]">
                                                {navigator.share && (
                                                    <button
                                                        onClick={(e) => handleShare(note, 'native', e)}
                                                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                                                    >
                                                        <Share2 className="w-4 h-4" />
                                                        Share
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => handleShare(note, 'whatsapp', e)}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                                                >
                                                    <MessageCircle className="w-4 h-4 text-green-600" />
                                                    WhatsApp
                                                </button>
                                                <button
                                                    onClick={(e) => handleShare(note, 'whatsapp', e)}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                                                >
                                                    <Mail className="w-4 h-4 text-blue-600" />
                                                    Email
                                                </button>
                                                <button
                                                    onClick={(e) => handleShare(note, 'copy', e)}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                                                >
                                                    <Copy className="w-4 h-4 text-purple-600" />
                                                    Copy Link
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Summary Side Panel */}
            {
                showSummary && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div className="absolute inset-0 bg-black bg-opacity-25" onClick={() => setShowSummary(false)}></div>
                        <div className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto transform transition-transform duration-300 ease-in-out">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Summary</h2>
                                    <button
                                        onClick={() => setShowSummary(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                <div className="bg-indigo-50 rounded-xl p-4 mb-6">
                                    <h3 className="font-medium text-indigo-900 mb-1">Note: {summaryNote?.title}</h3>
                                    <p className="text-sm text-indigo-700">AI-generated summary</p>
                                </div>

                                <div className="prose prose-indigo max-w-none">
                                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                        {summaryText}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Lock Modal */}
            {
                lockModalNote && (
                    <LockModal
                        isOpen={!!lockModalNote}
                        onClose={() => setLockModalNote(null)}
                        onSubmit={isLocking ? handleLockSubmit : handleUnlockSubmit}
                        mode={isLocking ? 'lock' : 'unlock'}
                        noteTitle={lockModalNote.title}
                    />
                )
            }

        </AppLayout >
    );
}
