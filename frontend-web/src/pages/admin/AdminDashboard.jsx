import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ revenue: 0, activeAgents: 0, pendingKyc: 0, weeklyBookings: 0, recentAgentsList: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStats = async () => {
        try {
            const res = await adminService.getStats();
            if (res.success) setStats(res.data);
        } catch (err) {
            setError('Failed to fetch dashboard data. Are you logged in as Admin?');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);



    if(loading) return <div className="p-20 text-center"><div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div></div>;

    return (
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-10 flex flex-col gap-8 md:gap-10 lg:gap-12 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">Admin Control <span className="gradient-text from-[#48A0D4] to-[#F07E21]">Center</span></h2>
                    <p className="text-gray-500 font-medium mt-2 text-sm md:text-base">System performance and agent management</p>
                </div>
            </div>

            {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl shadow-md smooth-transition hover:shadow-lg flex items-start gap-3 md:gap-4">
                <span className="text-xl md:text-2xl mt-1">⚠️</span>
                <div>
                    <p className="font-bold text-sm md:text-base">Error</p>
                    <p className="text-xs md:text-sm mt-1">{error}</p>
                </div>
            </div>}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-8">
                <div className="card-hover bg-white p-5 sm:p-6 md:p-7 lg:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-primary-100 rounded-full opacity-0 group-hover:opacity-100 smooth-transition -mr-4 md:-mr-8 -mt-4 md:-mt-8"></div>
                    <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3">Total Revenue</p>
                    <p className="text-lg sm:text-2xl md:text-2xl lg:text-3xl font-extrabold text-gray-900">₹{stats.revenue.toLocaleString()}</p>
                    <div className="mt-3 text-xs text-gray-500 font-semibold">{stats.growth}</div>
                </div>
                <div className="card-hover bg-white p-5 sm:p-6 md:p-7 lg:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full opacity-0 group-hover:opacity-100 smooth-transition -mr-4 md:-mr-8 -mt-4 md:-mt-8"></div>
                    <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3">Active Agents</p>
                    <p className="text-lg sm:text-2xl md:text-2xl lg:text-3xl font-extrabold text-green-600">{stats.activeAgents}</p>
                    <div className="mt-3 text-xs text-gray-500 font-semibold">Growing steadily</div>
                </div>
                <div className="card-hover bg-white p-5 sm:p-6 md:p-7 lg:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-orange-100 rounded-full opacity-0 group-hover:opacity-100 smooth-transition -mr-4 md:-mr-8 -mt-4 md:-mt-8"></div>
                    <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3">Pending KYC</p>
                    <p className="text-lg sm:text-2xl md:text-2xl lg:text-3xl font-extrabold text-orange-500">{stats.pendingKyc}</p>
                    <div className="mt-3 text-xs text-gray-500 font-semibold">Require approval</div>
                </div>
                <div className="card-hover bg-white p-5 sm:p-6 md:p-7 lg:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-blue-100 rounded-full opacity-0 group-hover:opacity-100 smooth-transition -mr-4 md:-mr-8 -mt-4 md:-mt-8"></div>
                    <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3">Bookings (Week)</p>
                    <p className="text-lg sm:text-2xl md:text-2xl lg:text-3xl font-extrabold text-primary-500">{stats.weeklyBookings}</p>
                    <div className="mt-3 text-xs text-gray-500 font-semibold">This week</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                {/* Agent Registrations Table */}
                <div className="lg:col-span-2 card-hover bg-white rounded-2xl md:rounded-3xl border border-gray-100 overflow-hidden">
                    <div className="p-4 sm:p-6 md:p-8 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
                        <div>
                            <h3 className="text-base sm:text-lg md:text-xl font-extrabold">Recent Registrations</h3>
                            <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-1">Latest agent signups awaiting approval</p>
                        </div>
                        <button 
                            onClick={() => navigate('/admin/agents')}
                            className="text-xs sm:text-sm font-bold text-primary-600 hover:bg-primary-50 px-3 md:px-4 py-2 md:py-2 rounded-lg md:rounded-xl smooth-transition whitespace-nowrap"
                        >
                            View All
                        </button>
                    </div>
                    <div className="overflow-x-auto scroll-thin">
                        <table className="w-full text-left border-collapse min-w-max md:min-w-full">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-400 text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                                    <th className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4">Agency Details</th>
                                    <th className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4">Status</th>
                                    <th className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.recentAgentsList.map((agent) => (
                                    <tr key={agent._id} className="hover:bg-gray-50/80 smooth-transition group">
                                        <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-5">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-lg group-hover:scale-110 smooth-transition">
                                                    {agent.agentName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-xs sm:text-sm md:text-base">{agent.agentName}</p>
                                                    <p className="text-[9px] md:text-xs text-gray-500">ID: {agent._id.substring(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-5">
                                            <span className={`inline-flex items-center px-2 sm:px-3 py-1 md:py-1.5 rounded-full text-[8px] sm:text-[9px] md:text-xs font-black uppercase smooth-transition ${
                                                agent.isKycVerified ? 'badge-success' : 'badge-warning'
                                            }`}>
                                                <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full mr-1.5 md:mr-2 bg-current"></span>
                                                {agent.isKycVerified ? 'Approved' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-5 text-center">
                                            {!agent.isKycVerified ? (
                                                <div className="flex gap-2 md:gap-3 justify-center">
                                                    <button 
                                                        onClick={() => navigate('/admin/agents')} 
                                                        className="px-2 sm:px-3 md:px-4 py-1 md:py-2 bg-blue-500 text-white text-[8px] sm:text-xs md:text-sm font-bold rounded-lg md:rounded-xl hover:bg-blue-600 smooth-transition shadow-lg shadow-blue-500/20"
                                                    >
                                                        Review
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center"><span className="text-xs font-bold text-gray-400 italic">Already Approved</span></div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Alerts */}
                <div className="card-hover bg-white rounded-xl sm:rounded-2xl md:rounded-3xl border border-gray-100 p-5 sm:p-6 md:p-8 h-fit">
                    <h3 className="text-base sm:text-lg md:text-xl font-extrabold mb-4 md:mb-6">Critical Alerts</h3>
                    <div className="flex flex-col gap-3 md:gap-4">
                        <div className="p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-100 relative overflow-hidden group smooth-transition">
                            <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 bg-orange-200/20 rounded-full -mr-6 md:-mr-8 -mt-6 md:-mt-8 group-hover:scale-150 smooth-transition"></div>
                            <h4 className="font-black text-orange-800 text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-widest mb-2">⚠️ Attention Required</h4>
                            <p className="text-orange-900 font-semibold text-[11px] sm:text-xs md:text-sm">
                                {stats.pendingKyc} accounts awaiting KYC review.
                            </p>
                        </div>
                        <div className="p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl bg-primary-50 hover:bg-primary-100 border border-primary-100 relative overflow-hidden group smooth-transition">
                            <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 bg-primary-200/20 rounded-full -mr-6 md:-mr-8 -mt-6 md:-mt-8 group-hover:scale-150 smooth-transition"></div>
                            <h4 className="font-black text-primary-800 text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-widest mb-2">✅ System Status</h4>
                            <p className="text-primary-900 font-semibold text-[11px] sm:text-xs md:text-sm">All services operational. Load: {stats.systemLoad}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
