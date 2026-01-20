import { useState, useEffect } from 'react';
import { Lock, Unlock, X, Check } from 'lucide-react';

export default function LockModal({ isLocking, onLock, onUnlock, onClose }) {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState(isLocking ? 'enter' : 'unlock');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setPin('');
        setConfirmPin('');
        setError('');
        setStep(isLocking ? 'enter' : 'unlock');
    }, [isLocking]);

    const handleNumberClick = (num) => {
        if (success) return;

        if (step === 'enter') {
            if (pin.length < 6) {
                setPin(pin + num);
            }
        } else if (step === 'confirm') {
            if (confirmPin.length < 6) {
                setConfirmPin(confirmPin + num);
            }
        } else if (step === 'unlock') {
            if (pin.length < 6) {
                setPin(pin + num);
            }
        }
        setError('');
    };

    const handleBackspace = () => {
        if (step === 'enter' || step === 'unlock') {
            setPin(pin.slice(0, -1));
        } else if (step === 'confirm') {
            setConfirmPin(confirmPin.slice(0, -1));
        }
        setError('');
    };

    const handleSubmit = async () => {
        if (step === 'enter') {
            if (pin.length < 4) {
                setError('PIN must be at least 4 digits');
                return;
            }
            setStep('confirm');
            setError('');
        } else if (step === 'confirm') {
            if (confirmPin.length < 4) {
                setError('PIN must be at least 4 digits');
                return;
            }
            if (pin !== confirmPin) {
                setError('PINs do not match');
                setConfirmPin('');
                return;
            }
            setLoading(true);
            try {
                await onLock(pin);
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 1500);
            } catch (err) {
                setError(err.message || 'Failed to lock note');
            } finally {
                setLoading(false);
            }
        } else if (step === 'unlock') {
            if (pin.length < 4) {
                setError('PIN must be at least 4 digits');
                return;
            }
            setLoading(true);
            try {
                await onUnlock(pin);
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 1500);
            } catch (err) {
                setError('Incorrect PIN');
                setPin('');
                // Shake animation
                document.querySelector('.lock-modal-content')?.classList.add('animate-shake');
                setTimeout(() => {
                    document.querySelector('.lock-modal-content')?.classList.remove('animate-shake');
                }, 500);
            } finally {
                setLoading(false);
            }
        }
    };

    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

    const currentPin = step === 'confirm' ? confirmPin : pin;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
            <div className="lock-modal-content relative bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-3xl p-8 max-w-md w-full border-2 border-purple-500/30 shadow-2xl animate-scaleIn">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                >
                    <X className="w-5 h-5 text-white" />
                </button>

                {/* Lock Icon with Animation */}
                <div className="flex justify-center mb-6">
                    <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${success ? 'from-green-500 to-emerald-500' :
                            isLocking ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-cyan-500'
                        } flex items-center justify-center shadow-lg ${!success && 'animate-pulse-glow'}`}>
                        {success ? (
                            <Check className="w-12 h-12 text-white animate-scaleIn" />
                        ) : isLocking ? (
                            <Lock className="w-12 h-12 text-white" />
                        ) : (
                            <Unlock className="w-12 h-12 text-white" />
                        )}
                        {/* Fingerprint scan effect */}
                        <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping"></div>
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">
                        {success ? 'Success!' :
                            step === 'enter' ? 'Set PIN' :
                                step === 'confirm' ? 'Confirm PIN' :
                                    'Enter PIN'}
                    </h3>
                    <p className="text-white/60">
                        {success ? (isLocking ? 'Note locked successfully' : 'Note unlocked successfully') :
                            step === 'enter' ? 'Choose a 4-6 digit PIN' :
                                step === 'confirm' ? 'Enter your PIN again' :
                                    'Enter PIN to unlock this note'}
                    </p>
                </div>

                {/* PIN Display */}
                <div className="flex justify-center gap-3 mb-6">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${i < currentPin.length
                                    ? 'border-purple-500 bg-purple-500/20 scale-110'
                                    : 'border-white/20 bg-white/5'
                                }`}
                        >
                            {i < currentPin.length && (
                                <div className="w-3 h-3 rounded-full bg-purple-400 animate-scaleIn"></div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center animate-shake">
                        {error}
                    </div>
                )}

                {/* Number Pad */}
                {!success && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {numbers.map((num) => (
                            <button
                                key={num}
                                onClick={() => handleNumberClick(num.toString())}
                                disabled={loading}
                                className="h-16 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 text-white text-2xl font-bold transition transform hover:scale-105 active:scale-95 disabled:opacity-50 backdrop-blur-sm"
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                )}

                {/* Action Buttons */}
                {!success && (
                    <div className="flex gap-3">
                        <button
                            onClick={handleBackspace}
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition disabled:opacity-50"
                        >
                            Backspace
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || currentPin.length < 4}
                            className={`flex-1 py-3 rounded-xl font-medium transition disabled:opacity-50 ${loading
                                    ? 'bg-gradient-to-r from-gray-500 to-gray-600'
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-2xl'
                                } text-white`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </div>
                            ) : step === 'unlock' ? (
                                'Unlock'
                            ) : step === 'confirm' ? (
                                'Confirm'
                            ) : (
                                'Continue'
                            )}
                        </button>
                    </div>
                )}

                {/* Neon glow effects */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl opacity-20 blur-xl -z-10"></div>
            </div>
        </div>
    );
}
