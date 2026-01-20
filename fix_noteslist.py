import os

# Read the original file
with open(r"c:\DjangoProjects\NotesAIPro\frontend\src\pages\NotesList.jsx", 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the start of corruption (around line 370-374 based on errors)
# We'll rebuild from line 339 (where Link opens) to line 420 (where the structure should close)

# Keep lines 1-338 intact
new_content = ''.join(lines[:338])

# Add the corrected section for note cards
corrected_section = '''                                <Link to={`/notes/${note.id}`} className="block p-6">
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
'''

new_content += corrected_section

# Find where to continue from the original file 
# We need to find the summary panel section which should be around line 420+
# Look for "Summary Side Panel" comment
for i, line in enumerate(lines):
    if '/* Summary Side Panel */' in line or 'Summary Side Panel' in line:
        # Add everything from this line onwards
        new_content += ''.join(lines[i:])
        break

# Write the corrected file
with open(r"c:\DjangoProjects\NotesAIPro\frontend\src\pages\NotesList.jsx", 'w', encoding='utf-8') as f:
    f.write(new_content)

print("File corrected successfully")
