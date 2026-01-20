import { useState } from 'react';
import { Settings as SettingsIcon, Moon, Sun, User, Lock, Key, Bell, BellOff, Sparkles, Save, Check } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Settings() {
    const { isDark, toggleTheme } = useTheme();
    const { user, updateUser } = useAuth();

    const [activeTab, setActiveTab] = useState('appearance');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Profile state
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');

    // Password state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Notification preferences (localStorage)
    const [emailNotifs, setEmailNotifs] = useState(
        localStorage.getItem('emailNotifications') !== 'false'
    );
    const [aiSuggestions, setAiSuggestions] = useState(
        localStorage.getItem('aiSuggestions') !== 'false'
    );

    const showSuccess = (message) => {
        setSuccess(message);
        setError('');
        setTimeout(() => setSuccess(''), 3000);
    };

    const showError = (message) => {
        setError(message);
        setSuccess('');
        setTimeout(() => setError(''), 3000);
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateUser({ name, email });
            showSuccess('Profile updated successfully!');
        } catch (err) {
            showError('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('current_password', currentPassword);
            formData.append('new_password', newPassword);

            await api.post('/api/auth/change-password', formData);
            showSuccess('Password changed successfully!');
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            showError(err.response?.data?.detail || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const toggleEmailNotifs = () => {
        const newValue = !emailNotifs;
        setEmailNotifs(newValue);
        localStorage.setItem('emailNotifications', newValue);
        showSuccess(`Email notifications ${newValue ? 'enabled' : 'disabled'}`);
    };

    const toggleAiSuggestions = () => {
        const newValue = !aiSuggestions;
        setAiSuggestions(newValue);
        localStorage.setItem('aiSuggestions', newValue);
        showSuccess(`AI suggestions ${newValue ? 'enabled' : 'disabled'}`);
    };

    const tabs = [
        { id: 'appearance', label: 'Appearance', icon: isDark ? Moon : Sun },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-8 animate-gradient">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center">
                            <SettingsIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Settings</h1>
                            <p className="text-purple-100">Customize your experience</p>
                        </div>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="bg-green-500/20 border border-green-500/50 text-green-100 px-6 py-4 rounded-2xl flex items-center gap-3 animate-slideIn backdrop-blur-lg">
                        <Check className="w-5 h-5" />
                        {success}
                    </div>
                )}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-6 py-4 rounded-2xl animate-shake backdrop-blur-lg">
                        {error}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition backdrop-blur-lg whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-white/20 text-white border border-white/30'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8">
                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-6 animate-scaleIn">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Appearance</h3>
                                <p className="text-white/60">Customize how NoteAI Pro looks</p>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${isDark ? 'from-indigo-500 to-purple-500' : 'from-yellow-400 to-orange-500'} flex items-center justify-center`}>
                                        {isDark ? <Moon className="w-6 h-6 text-white" /> : <Sun className="w-6 h-6 text-white" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">Dark Mode</p>
                                        <p className="text-sm text-white/60">Switch between light and dark theme</p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={`relative w-16 h-8 rounded-full transition ${isDark ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-300'
                                        }`}
                                >
                                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${isDark ? 'translate-x-8' : 'translate-x-0'
                                        }`}></div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleProfileUpdate} className="space-y-6 animate-scaleIn">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Profile</h3>
                                <p className="text-white/60">Your account information (Read-only)</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white font-medium mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white/50 placeholder-white/40 outline-none cursor-not-allowed transition"
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white/50 placeholder-white/40 outline-none cursor-not-allowed transition"
                                        readOnly
                                    />
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="space-y-6 animate-scaleIn">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Security</h3>
                                <p className="text-white/60">Manage your account security</p>
                            </div>

                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                                        <Key className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">Password</p>
                                        <p className="text-sm text-white/60">Change your account password</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="text-purple-300 hoverttext-purple-100 font-medium transition"
                                >
                                    Change Password →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6 animate-scaleIn">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Notifications</h3>
                                <p className="text-white/60">Manage your notification preferences</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-4">
                                        {emailNotifs ? <Bell className="w-6 h-6 text-blue-400" /> : <BellOff className="w-6 h-6 text-gray-400" />}
                                        <div>
                                            <p className="font-semibold text-white">Email Notifications</p>
                                            <p className="text-sm text-white/60">Receive updates via email</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={toggleEmailNotifs}
                                        className={`relative w-16 h-8 rounded-full transition ${emailNotifs ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-600'
                                            }`}
                                    >
                                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${emailNotifs ? 'translate-x-8' : 'translate-x-0'
                                            }`}></div>
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <Sparkles className={`w-6 h-6 ${aiSuggestions ? 'text-purple-400' : 'text-gray-400'}`} />
                                        <div>
                                            <p className="font-semibold text-white">AI Suggestions</p>
                                            <p className="text-sm text-white/60">Get AI-powered suggestions while writing</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={toggleAiSuggestions}
                                        className={`relative w-16 h-8 rounded-full transition ${aiSuggestions ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-600'
                                            }`}
                                    >
                                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${aiSuggestions ? 'translate-x-8' : 'translate-x-0'
                                            }`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Password Change Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 max-w-md w-full border border-white/20 animate-scaleIn">
                            <h3 className="text-2xl font-bold text-white mb-6">Change Password</h3>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="block text-white/80 font-medium mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/20 focus:border-white/40 outline-none transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/80 font-medium mb-2">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/20 focus:border-white/40 outline-none transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/80 font-medium mb-2">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/20 focus:border-white/40 outline-none transition"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordModal(false)}
                                        className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition disabled:opacity-50"
                                    >
                                        {loading ? 'Changing...' : 'Change Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
