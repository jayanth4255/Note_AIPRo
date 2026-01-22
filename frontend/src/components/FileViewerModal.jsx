import { useState, useEffect } from 'react';
import { X, Copy, Sparkles, Download, Maximize2, Minimize2, Check, FileText, Clock, Info } from 'lucide-react';
import { filesApi } from '../services/api';

export default function FileViewerModal({ isOpen, onClose, fileId, onAskAI }) {
    const [fileData, setFileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && fileId) {
            fetchFileContent();
        }
    }, [isOpen, fileId]);

    const fetchFileContent = async () => {
        setLoading(true);
        try {
            const response = await filesApi.getContent(fileId);
            setFileData(response.data);
        } catch (error) {
            console.error('Failed to fetch file content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (fileData?.extracted_text) {
            navigator.clipboard.writeText(fileData.extracted_text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        window.open(`/api/files/${fileId}`, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[10001] flex items-center justify-center transition-all duration-500 bg-gray-900/40 backdrop-blur-xl animate-fadeIn`}>
            {/* Background pattern */}
            <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>

            <div className={`relative bg-white dark:bg-gray-900 shadow-2xl transition-all duration-500 overflow-hidden flex flex-col ${isFullScreen ? 'w-full h-full' : 'w-[90%] h-[85%] max-w-5xl rounded-[2.5rem] border border-white/50 dark:border-gray-700'}`}>

                {/* Header Toolbar */}
                <div className="flex items-center justify-between px-8 py-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200 dark:shadow-none">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight truncate max-w-xs md:max-w-md">
                                {fileData?.filename || 'Loading file...'}
                            </h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    <Clock className="w-3 h-3" />
                                    {fileData ? new Date(fileData.created_at).toLocaleDateString() : '--'}
                                </span>
                                <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                                <span className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                    {fileData?.file_type?.split('/')[1] || '---'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {fileData?.extracted_text && (
                            <>
                                <button
                                    onClick={handleCopy}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${copied ? 'bg-green-500 text-white shadow-green-100' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'} shadow-sm`}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied' : 'Copy Content'}
                                </button>
                                <button
                                    onClick={() => onAskAI(fileData.extracted_text)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary-200 dark:shadow-none"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Ask AI
                                </button>
                            </>
                        )}
                        <span className="w-px h-8 bg-gray-100 dark:bg-gray-800 mx-2"></span>
                        <button
                            onClick={handleDownload}
                            className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl transition-all shadow-sm"
                            title="Download"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl transition-all shadow-sm"
                            title={isFullScreen ? "Minimize" : "Full Screen"}
                        >
                            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-all shadow-sm"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Viewer */}
                <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-800/10 p-8 sm:p-12 md:p-16 flex justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-50">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4"></div>
                            <p className="font-bold text-primary-900 dark:text-primary-100 tracking-widest uppercase text-xs">Processing Workspace</p>
                        </div>
                    ) : (
                        <div className={`bg-white dark:bg-gray-800 shadow-xl transition-all duration-700 ${isFullScreen ? 'w-full max-w-5xl' : 'w-full'} min-h-full rounded-b-lg border border-gray-100 dark:border-gray-700 p-10 md:p-20 relative animate-slideUp`}>
                            {/* Paper Effect */}
                            <div className="absolute top-0 left-0 w-2 bg-primary-600 h-full opacity-5 dark:opacity-20"></div>

                            {fileData?.file_type?.startsWith('image/') ? (
                                <div className="flex flex-col items-center">
                                    <img
                                        src={`/api/files/${fileId}`}
                                        alt={fileData.filename}
                                        className="max-w-full rounded-xl shadow-2xl ring-8 ring-gray-50 dark:ring-gray-700"
                                    />
                                    <div className="mt-12 w-full max-w-sm p-6 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-center gap-4">
                                        <Info className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                        <div>
                                            <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Image Intelligence</p>
                                            <p className="text-xs text-blue-700/70 dark:text-blue-300/70">Images are currently processed for visual reference. Text extraction coming soon.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : fileData?.extracted_text ? (
                                <div className="prose prose-blue dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:text-primary-900 dark:prose-headings:text-primary-100">
                                    <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-200 leading-relaxed text-lg">
                                        {fileData.extracted_text}
                                    </pre>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                    <FileText className="w-32 h-32 mb-8 text-gray-300 dark:text-gray-600" />
                                    <p className="text-2xl font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter">Unable to preview content</p>
                                    <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">This file type doesn't support direct text preview yet.</p>
                                    <button
                                        onClick={handleDownload}
                                        className="mt-8 px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-black hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                    >
                                        DOWNLOAD ORIGINAL
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="px-8 py-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <div className="flex items-center gap-4">
                        <span>SECURITY: ENCRYPTED BYTEA STORAGE</span>
                        <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                        <span>SIZE: {(fileData?.file_size / 1024).toFixed(2)} KB</span>
                    </div>
                    <div>
                        © {new Date().getFullYear()} NoteAI Pro Professional Suite
                    </div>
                </div>
            </div>
        </div>
    );
}
