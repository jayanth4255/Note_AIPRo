import { useState, useEffect } from 'react';
import { analyticsApi } from '../services/api';
import { BarChart3, TrendingUp, FileText, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AppLayout from '../components/AppLayout';

export default function Analytics() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await analyticsApi.getDashboard();
            setAnalytics(response.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
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

    const stats = [
        { label: 'Total Notes', value: analytics?.total_notes || 0, icon: FileText, color: 'text-blue-600' },
        { label: 'This Week', value: analytics?.notes_this_week || 0, icon: TrendingUp, color: 'text-green-600' },
        { label: 'AI Operations', value: analytics?.ai_operations_count || 0, icon: Zap, color: 'text-purple-600' },
        { label: 'Shared', value: analytics?.total_shared || 0, icon: BarChart3, color: 'text-orange-600' },
    ];

    return (
        <AppLayout>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">{stat.label}</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                    </div>
                                    <Icon className={`w-8 h-8 ${stat.color}`} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Activity Timeline Chart */}
                {analytics?.activity_timeline && analytics.activity_timeline.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Activity Timeline (Last 7 Days)</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.activity_timeline}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Notes by Tag */}
                {analytics?.notes_by_tag && Object.keys(analytics.notes_by_tag).length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Notes by Tag</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={Object.entries(analytics.notes_by_tag).map(([tag, count]) => ({ tag, count }))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="tag" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8b5cf6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
