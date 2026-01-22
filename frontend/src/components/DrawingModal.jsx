import { useRef, useState, useEffect } from 'react';
import { X, Save, Undo, Trash2, Eraser, PenTool } from 'lucide-react';
import { filesApi } from '../services/api';

export default function DrawingModal({ isOpen, onClose, noteId, onSave }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(3);
    const [tool, setTool] = useState('pen'); // 'pen' or 'eraser'
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Set canvas size
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;

            // White background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, [isOpen]);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineWidth = brushSize;
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const handleSave = async () => {
        if (!canvasRef.current) return;
        setSaving(true);

        try {
            const canvas = canvasRef.current;

            // Convert to blob
            canvas.toBlob(async (blob) => {
                if (!blob) return;

                // Upload file
                const file = new File([blob], `drawing_${Date.now()}.png`, { type: 'image/png' });

                try {
                    const response = await filesApi.upload(noteId, file);
                    const imageUrl = `/api/files/${response.data.file_id}`;
                    onSave(imageUrl);
                    onClose();
                } catch (error) {
                    console.error('Failed to upload drawing:', error);
                } finally {
                    setSaving(false);
                }
            }, 'image/png');

        } catch (error) {
            console.error('Failed to save drawing:', error);
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <PenTool className="w-5 h-5 text-primary-600" />
                        Drawing Canvas
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center gap-6 overflow-x-auto">
                    {/* Tools */}
                    <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setTool('pen')}
                            className={`p-2 rounded-md transition ${tool === 'pen' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            title="Pen"
                        >
                            <PenTool className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setTool('eraser')}
                            className={`p-2 rounded-md transition ${tool === 'eraser' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            title="Eraser"
                        >
                            <Eraser className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Colors */}
                    <div className="flex items-center gap-2 px-3 border-r border-l border-gray-200 dark:border-gray-700">
                        {['#000000', '#FF3B30', '#007AFF', '#34C759', '#FF9500'].map(c => (
                            <button
                                key={c}
                                onClick={() => { setColor(c); setTool('pen'); }}
                                className={`w-8 h-8 rounded-full border-2 transition ${color === c && tool === 'pen' ? 'border-gray-400 scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => { setColor(e.target.value); setTool('pen'); }}
                            className="w-8 h-8 rounded-full cursor-pointer border-0 p-0 overflow-hidden"
                        />
                    </div>

                    {/* Size */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 uppercase">Size</span>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={brushSize}
                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                            className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="flex-1" />

                    {/* Actions */}
                    <button
                        onClick={clearCanvas}
                        className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-500"
                        title="Clear Canvas"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-4 overflow-hidden relative cursor-crosshair">
                    <div className="w-full h-full bg-white shadow-lg rounded-xl overflow-hidden touch-none">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={(e) => {
                                const touch = e.touches[0];
                                const mouseEvent = new MouseEvent("mousedown", {
                                    clientX: touch.clientX,
                                    clientY: touch.clientY
                                });
                                startDrawing(mouseEvent);
                            }}
                            onTouchMove={(e) => {
                                const touch = e.touches[0];
                                const mouseEvent = new MouseEvent("mousemove", {
                                    clientX: touch.clientX,
                                    clientY: touch.clientY
                                });
                                draw(mouseEvent);
                            }}
                            onTouchEnd={() => {
                                const mouseEvent = new MouseEvent("mouseup", {});
                                stopDrawing(mouseEvent);
                            }}
                            className="w-full h-full block"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 transition shadow-lg shadow-primary-200 dark:shadow-none disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save to Note
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
