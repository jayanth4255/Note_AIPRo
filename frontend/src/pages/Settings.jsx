import { useState } from 'react';
import { Settings as SettingsIcon, Moon, Sun, User, Lock, Key, Bell, BellOff, Sparkles, Check } from 'lucide-react';
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
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        <SettingsIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage your account preferences</p>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-6 py-4 rounded-xl flex items-center gap-3">
                        <Check className="w-5 h-5" />
                        {success}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-xl">
                        {error}
                    </div>
                )}

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col md:flex-row">
                    {/* Sidebar Tabs */}
                    <div className="md:w-64 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-800 p-4 space-y-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-left ${activeTab === tab.id
                                        ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm border border-gray-100 dark:border-gray-700'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-8">
                        {/* Appearance Tab */}
                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Appearance</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">Customize how NoteAI Pro looks</p>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-yellow-100 text-yellow-600'}`}>
                                            {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">Dark Mode</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark theme</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={toggleTheme}
                                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${isDark ? 'bg-primary-600' : 'bg-gray-300'
                                            }`}
                                    >
                                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isDark ? 'translate-x-7' : 'translate-x-0'
                                            }`}></div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Profile</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">Your account information</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 cursor-not-allowed"
                                            readOnly
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 cursor-not-allowed"
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Security</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">Manage your account security</p>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                                            <Key className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">Password</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Change your account password</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowPasswordModal(true)}
                                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Notifications</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">Manage your notification preferences</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-4">
                                            {emailNotifs ? <Bell className="w-6 h-6 text-blue-500" /> : <BellOff className="w-6 h-6 text-gray-400" />}
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">Email Notifications</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates via email</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={toggleEmailNotifs}
                                            className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${emailNotifs ? 'bg-primary-600' : 'bg-gray-300'
                                                }`}
                                        >
                                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${emailNotifs ? 'translate-x-7' : 'translate-x-0'
                                                }`}></div>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-4">
                                            <Sparkles className={`w-6 h-6 ${aiSuggestions ? 'text-purple-500' : 'text-gray-400'}`} />
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">AI Suggestions</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Get AI-powered suggestions while writing</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={toggleAiSuggestions}
                                            className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${aiSuggestions ? 'bg-primary-600' : 'bg-gray-300'
                                                }`}
                                        >
                                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${aiSuggestions ? 'translate-x-7' : 'translate-x-0'
                                                }`}></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Password Change Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full border border-gray-200 dark:border-gray-800 shadow-xl">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Change Password</h3>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordModal(false)}
                                        className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition disabled:opacity-50"
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
