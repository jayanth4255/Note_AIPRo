import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Image as ImageIcon, Loader2, Plus, XCircle, Send, MessageSquare, History } from 'lucide-react';
import { aiApi } from '../services/api';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

export default function AIModal({ isOpen, onClose, onAddToNote, context = null }) {
    const [mode, setMode] = useState('chat'); // 'chat' or 'generate'
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [resultType, setResultType] = useState(null); // 'text', 'image', 'flowchart'
    const [chatId, setChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (resultType === 'flowchart' && result) {
            mermaid.initialize({ startOnLoad: true, theme: 'default' });
            mermaid.contentLoaded();
        }
    }, [result, resultType]);

    useEffect(() => {
        if (isOpen && context && messages.length === 0) {
            // If opened with context, maybe show a welcome message or auto-initiate
            setMessages([{
                role: 'system',
                content: 'I am ready to help you with this note. What would you like to know or do with it?'
            }]);
        }
    }, [isOpen, context]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleGenerate = async () => {
        if (!input.trim()) return;

        setLoading(true);
        if (mode === 'generate') {
            setResult(null);
            setResultType(null);
        }

        try {
            if (mode === 'chat') {
                const userMsg = { role: 'user', content: input };
                setMessages(prev => [...prev, userMsg]);
                setInput('');

                const response = await aiApi.chat(input, chatId, context);
                const assistantMsg = { role: 'assistant', content: response.data.result };

                if (response.data.chat_id) {
                    setChatId(response.data.chat_id);
                }

                setMessages(prev => [...prev, assistantMsg]);
            } else {
                // Detect what user wants based on input
                const lowerInput = input.toLowerCase();

                if (lowerInput.includes('image') || lowerInput.includes('picture') || lowerInput.includes('draw') || lowerInput.includes('generate an image')) {
                    const response = await aiApi.generateImage({ prompt: input });
                    setResult(response.data.image_url);
                    setResultType('image');
                } else if (lowerInput.includes('flowchart') || lowerInput.includes('diagram') || lowerInput.includes('mermaid')) {
                    const response = await aiApi.generateFlowchart({ prompt: input });
                    setResult(response.data.mermaid_code);
                    setResultType('flowchart');
                } else {
                    let prompt = input;
                    if (!lowerInput.includes('lines') && !lowerInput.includes('words')) {
                        prompt += " (Write about 10 to 15 lines)";
                    }
                    const response = await aiApi.generateText({ prompt: prompt });
                    setResult(response.data.text);
                    setResultType('text');
                }
            }
        } catch (error) {
            console.error('AI operation failed:', error);
            if (mode === 'chat') {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please check your connection.' }]);
            } else {
                setResult('Failed to generate content. Please check your API configuration.');
                setResultType('text');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddToNotepad = (contentToAdd) => {
        const content = contentToAdd || result;
        const type = contentToAdd ? 'text' : resultType;
        if (content) {
            onAddToNote(content, type);
        }
    };

    const handleDiscard = () => {
        setInput('');
        setResult(null);
        setResultType(null);
        setMessages([]);
        setChatId(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">AI Studio</h2>
                            <p className="text-purple-100/80 text-sm font-medium">
                                {context ? 'Context-aware mode active 🎯' : 'Ready for your creativity ✨'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/10 flex">
                            <button
                                onClick={() => setMode('chat')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'chat' ? 'bg-white text-purple-600 shadow-lg' : 'text-white hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Chat
                                </div>
                            </button>
                            <button
                                onClick={() => setMode('generate')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'generate' ? 'bg-white text-purple-600 shadow-lg' : 'text-white hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    Generate
                                </div>
                            </button>
                        </div>
                        <button
                            onClick={handleDiscard}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Main Body */}
                <div className="flex-1 flex overflow-hidden bg-gray-50/50">
                    {/* Left Side: Interaction Arena */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {mode === 'chat' ? (
                            /* Chat History Interface */
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                            <MessageSquare className="w-10 h-10 text-purple-600" />
                                        </div>
                                        <p className="text-gray-500 font-medium italic">Start a conversation about this note...</p>
                                    </div>
                                )}
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideUp`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.role === 'user'
                                                ? 'bg-purple-600 text-white rounded-tr-none'
                                                : msg.role === 'system'
                                                    ? 'bg-gray-200 text-gray-600 text-xs uppercase tracking-widest font-bold mx-auto text-center border-none'
                                                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                            }`}>
                                            <div className="prose prose-sm max-w-none prose-invert">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                            {msg.role === 'assistant' && (
                                                <button
                                                    onClick={() => handleAddToNotepad(msg.content)}
                                                    className="mt-3 flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 transition"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Add to note
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        ) : (
                            /* Classic Generation Interface */
                            <div className="flex-1 overflow-y-auto p-8">
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">What should I create for you?</label>
                                        <textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Write a poem about space...&#10;Generate a futuristic city image...&#10;Create a flowchart for a login system..."
                                            className="w-full px-4 py-3 border-none focus:ring-0 text-lg placeholder-gray-300 resize-none h-32 bg-gray-50/50 rounded-xl"
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            {['💬 Text', '🖼️ Image', '📊 Flowchart'].map((tag, i) => (
                                                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">{tag}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {result && (
                                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg animate-fadeIn">
                                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                                                <span className="text-sm font-bold text-gray-400">RESULT PREVIEW</span>
                                                <button
                                                    onClick={() => handleAddToNotepad()}
                                                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-lg shadow-purple-200"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add to Notepad
                                                </button>
                                            </div>

                                            <div className="overflow-hidden rounded-xl bg-gray-50">
                                                {resultType === 'image' ? (
                                                    <img src={result} alt="Generated" className="w-full block" />
                                                ) : resultType === 'flowchart' ? (
                                                    <div className="mermaid bg-white p-8">
                                                        {result}
                                                    </div>
                                                ) : (
                                                    <div className="p-4 prose prose-indigo max-w-none">
                                                        <ReactMarkdown>{result}</ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Input Area (Pinned to bottom) */}
                        <div className="p-6 bg-white border-t border-gray-100">
                            <div className="relative flex items-end gap-2 bg-gray-100 rounded-2xl p-2 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-500/20 active:scale-[0.99]">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleGenerate();
                                        }
                                    }}
                                    placeholder={mode === 'chat' ? 'Ask anything about this note...' : 'Describe what you want to generate...'}
                                    className="flex-1 max-h-32 px-4 py-3 bg-transparent border-none focus:ring-0 resize-none text-gray-700 font-medium"
                                    rows={1}
                                    style={{ height: 'auto', minHeight: '48px' }}
                                    disabled={loading}
                                />
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading || !input.trim()}
                                    className={`p-3 rounded-xl transition-all ${loading || !input.trim()
                                            ? 'bg-gray-200 text-gray-400'
                                            : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95'
                                        }`}
                                >
                                    {loading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <Send className="w-6 h-6 translate-x-0.5 -translate-y-0.5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Quick Suggestions/Info (Desktop only) */}
                    <div className="hidden lg:flex w-64 bg-white border-l border-gray-100 flex-col p-6 overflow-y-auto">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" />
                                    Mode Info
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {mode === 'chat'
                                        ? "I have analyzed your note's content. Ask me to summarize, find key points, or rewrite sections."
                                        : "Use this to create entirely new content, dynamic flowcharts, or high-fidelity images."
                                    }
                                </p>
                            </div>

                            {context && (
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <h4 className="text-xs font-bold text-blue-700 mb-2">Note Context</h4>
                                    <div className="text-[10px] text-blue-600 line-clamp-4">
                                        {context.replace(/<[^>]*>/g, '')}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <History className="w-3 h-3" />
                                    Quick Tips
                                </h3>
                                <div className="space-y-2">
                                    {[
                                        "Summarize this",
                                        "Extract contacts",
                                        "Improve style",
                                        "Find tasks"
                                    ].map((tip, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(tip)}
                                            className="w-full text-left px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-purple-600 rounded-lg transition"
                                        >
                                            • {tip}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
