import { Menu, Search, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ toggleSidebar }) {
    const { user } = useAuth();

    return (
        <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 lg:px-6 py-4">
                {/* Left: Mobile Menu + Search */}
                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden text-white hover:text-purple-200"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Search Bar */}
                    <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                            <input
                                type="text"
                                placeholder="Search notes..."
                                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Notifications */}
                <div className="flex items-center gap-4">
                    <button className="relative text-white hover:text-purple-200">
                        <Bell className="w-6 h-6" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                            3
                        </span>
                    </button>

                    {/* User Avatar (Mobile) */}
                    <div className="lg:hidden w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
