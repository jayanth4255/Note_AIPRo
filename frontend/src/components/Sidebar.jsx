import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Home, FileText, BarChart3, Settings, User, LogOut, Menu, X, Plus, Archive as ArchiveIcon
} from 'lucide-react';

export default function Sidebar({ isOpen, toggleSidebar }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const navItems = [
        { path: '/dashboard', icon: Home, label: 'Dashboard' },
        { path: '/notes', icon: FileText, label: 'My Notes' },
        { path: '/archive', icon: ArchiveIcon, label: 'Archive' },
        { path: '/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/profile', icon: User, label: 'Profile' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800">
                        <Link to="/dashboard" className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">NoteAI Pro</span>
                        </Link>
                        <button onClick={toggleSidebar} className="lg:hidden text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* New Note Button */}
                    <div className="px-4 py-4">
                        <Link
                            to="/notes/new"
                            className="flex items-center justify-center gap-2 w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
                        >
                            <Plus className="w-5 h-5" />
                            New Note
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 group ${active
                                        ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile & Logout */}
                    <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900/50">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
