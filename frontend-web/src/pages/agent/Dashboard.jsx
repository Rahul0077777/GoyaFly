import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentService, bookingService } from '../../services/api';
import { agentLinks } from '../../config/navigation';

const Dashboard = () => {
    const [balance, setBalance] = useState(0);
    const [stats, setStats] = useState(null);
    const [recentBookings, setRecentBookings] = useState([]);
    const [recentAlerts, setRecentAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch stats and balance
                const statRes = await agentService.getDashboardStats();
                if (statRes.success) {
                    setBalance(statRes.data.walletBalance);
                    setStats(statRes.data);
                    
                    // Sync KYC Status dynamically
                    const currentInfo = JSON.parse(localStorage.getItem('agentInfo') || '{}');
                    if (statRes.data.kycStatus && currentInfo.kycStatus !== statRes.data.kycStatus) {
                        const updatedInfo = { 
                            ...currentInfo, 
                            kycStatus: statRes.data.kycStatus, 
                            isKycVerified: statRes.data.isKycVerified 
                        };
                        localStorage.setItem('agentInfo', JSON.stringify(updatedInfo));
                        // Trigger a storage event for other components (like Navbar) to update
                        window.dispatchEvent(new Event('storage'));
                    }
                }
                // Fetch recent bookings
                const bookRes = await bookingService.getAgentHistory();
                if (bookRes.success) {
                    setRecentBookings(bookRes.data.slice(0, 8));
                }
                // Fetch recent notifications
                const alertRes = await agentService.getNotifications();
                if (alertRes.success) {
                    setRecentAlerts(alertRes.data.slice(0, 3));
                }
            } catch (err) {
                console.error('Failed to fetch dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const bgColors = [
        'bg-blue-50 text-blue-600',
        'bg-primary-50 text-primary-600',
        'bg-orange-50 text-orange-600',
        'bg-green-50 text-green-600',
        'bg-purple-50 text-purple-600',
        'bg-red-50 text-red-600',
        'bg-teal-50 text-teal-600',
        'bg-pink-50 text-pink-600',
    ];

    const excludedPaths = ['/agent/dashboard', '/agent/notifications', '/agent/profile', '/agent/wallet', '/agent/history', '/agent/my-refunds'];
    
    const services = agentLinks
        .filter(link => !excludedPaths.includes(link.path))
        .map((link, index) => ({
            id: link.path,
            name: link.name,
            icon: link.icon,
            color: bgColors[index % bgColors.length],
            path: link.path
        }));

    const quickActions = [
        { label: 'Add Funds', icon: '💳', path: '/agent/wallet' },
        { label: 'Booking Report', icon: '📊', path: '/agent/history' },
        { label: 'My Refunds', icon: '💸', path: '/agent/my-refunds' },
        { label: 'Support', icon: '🎫', path: '/agent/tickets' },
    ];

    const agentInfo = JSON.parse(localStorage.getItem('agentInfo') || '{}');
    const kycStatus = stats?.kycStatus || agentInfo.kycStatus;
    const isKycVerified = stats?.isKycVerified || agentInfo.isKycVerified;

    return (
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-10 animate-fade-in">
            {/* KYC Alert Banner */}
            {(kycStatus === 'PENDING' || kycStatus === 'REJECTED') && (
                <div 
                    onClick={() => navigate('/agent/kyc-status')}
                    className={`mb-8 p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] ${
                        kycStatus === 'REJECTED' 
                        ? 'bg-red-50 border-red-200 text-red-700' 
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <span className="text-2xl">{kycStatus === 'REJECTED' ? '⚠️' : '⏳'}</span>
                        <div>
                            <p className="font-black uppercase tracking-widest text-[10px] mb-1">
                                KYC Status: {kycStatus}
                            </p>
                            <p className="text-sm font-bold">
                                {kycStatus === 'REJECTED' 
                                    ? `Verification Rejected: ${stats?.kycRejectReason || agentInfo.kycRejectReason || 'Please re-upload valid documents.'}`
                                    : 'Your documents are being reviewed. Some features may be restricted until approval.'}
                            </p>
                        </div>
                    </div>
                    <span className="font-black text-xs uppercase tracking-widest bg-white/50 px-3 py-1 rounded-lg">View Details ➔</span>
                </div>
            )}

            {/* Header / Wallet Section */}
            <div className="relative pt-8 pb-16 px-6 sm:px-10 lg:px-12 bg-gradient-to-br from-[#0A2670] to-[#0B4EE3] rounded-b-[2rem] sm:rounded-b-[3rem] -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 lg:-mt-10 mb-8 sm:mb-10 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                {/* Airplane graphic effect */}
                <div className="absolute right-10 top-10 opacity-30 text-5xl transform rotate-45">✈️</div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12 max-w-6xl mx-auto">
                    <div className="w-full md:w-1/2 text-left">
                        <p className="text-white/90 text-sm md:text-base font-bold mb-1">
                            {(() => {
                                const hour = new Date().getHours();
                                if (hour < 12) return 'Good Morning,';
                                if (hour < 17) return 'Good Afternoon,';
                                return 'Good Evening,';
                            })()}
                        </p>
                        <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4 tracking-tight">
                            {stats?.agentName ? stats.agentName.split(' ')[0] : 'Demo'} <span className="text-[#FF9F43]">{stats?.agentName ? stats.agentName.split(' ').slice(1).join(' ') || 'Agent' : 'Agent'}</span>
                        </h2>
                        <p className="text-white/80 text-sm md:text-base font-medium mb-6 max-w-sm">
                            Manage your global travel desk with ease and confidence.
                        </p>
                        {stats?.agentCode && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white text-xs sm:text-sm font-bold rounded-xl shadow-inner backdrop-blur-sm">
                                <span className="text-gray-300">🪪</span> ID: {stats.agentCode}
                            </div>
                        )}
                    </div>
                    
                    <div className="w-full md:w-auto flex justify-center md:justify-end mt-4 md:mt-0">
                        <div 
                            onClick={() => navigate('/agent/wallet')}
                            className="bg-white/10 backdrop-blur-md border border-white/20 p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] flex flex-col items-center gap-3 md:gap-4 cursor-pointer hover:bg-white/20 transition-all shadow-xl w-full md:max-w-[320px] relative overflow-hidden group"
                        >
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FF9F43]/20 blur-3xl rounded-full pointer-events-none"></div>
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#FF9F43] to-[#FF9100] text-white rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-lg relative z-10 group-hover:scale-110 transition-transform">💼</div>
                            <div className="text-center relative z-10">
                                <p className="text-[9px] md:text-[10px] sm:text-xs font-black text-white/70 uppercase tracking-widest mb-1">Wallet Balance</p>
                                <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                                    {loading ? '...' : `₹${balance.toLocaleString('en-IN')}`}
                                </p>
                            </div>
                            <div className="mt-1 md:mt-2 px-3 md:px-4 py-1.5 rounded-full border border-white/20 text-white/90 text-[10px] md:text-xs font-bold flex items-center gap-2 hover:bg-white/10 relative z-10 transition-colors">
                                View Wallet <span className="text-[10px]">›</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Services */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold flex items-center gap-2 sm:gap-3 md:gap-4 dark:text-white">
                    <span className="w-1 md:w-1.5 h-5 md:h-7 lg:h-8 bg-gradient-to-b from-[#FF9F43] to-orange-400 rounded-full"></span>
                    <span>Book Services</span>
                </h3>
                <button className="px-4 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                    View All <span>›</span>
                </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-5 mb-8 sm:mb-10 md:mb-12 lg:mb-16">
                {services.map((s) => (
                    <button 
                        key={s.id}
                        onClick={() => navigate(s.path)}
                        className="card-hover bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl border border-gray-100 flex flex-col items-center gap-2 sm:gap-3 md:gap-4 group touch-target"
                    >
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 ${s.color} rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center text-base sm:text-lg md:text-2xl lg:text-3xl group-hover:scale-125 group-hover:rotate-12 smooth-transition`}>
                            {s.icon}
                        </div>
                        <span className="font-bold text-gray-700 text-xs sm:text-sm md:text-base text-center leading-tight">{s.name}</span>
                    </button>
                ))}
            </div>

            {/* PRD Stats Overview */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold flex items-center gap-2 sm:gap-3 md:gap-4 dark:text-white">
                    <span className="w-1 md:w-1.5 h-5 md:h-7 lg:h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></span>
                    <span>Performance Overview</span>
                </h3>
                <button className="px-4 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                    This Month <span className="text-[10px]">⌄</span>
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-12">
                <div onClick={() => navigate('/agent/history')} className="card-hover bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 flex items-center justify-between group overflow-hidden relative cursor-pointer">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 smooth-transition pointer-events-none"></div>
                    <div className="relative z-10">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Bookings</p>
                        <p className="text-4xl font-extrabold text-gray-900 group-hover:text-primary-600 transition-colors">{stats ? stats.totalBookings : '...'}</p>
                    </div>
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform relative z-10">🎫</div>
                </div>

                <div onClick={() => navigate('/agent/history')} className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl border border-gray-100 card-hover flex items-center justify-between group overflow-hidden relative cursor-pointer">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-orange-100 transition-colors pointer-events-none"></div>
                    <div className="relative z-10">
                         <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Today's Bookings</p>
                         <p className="text-4xl font-extrabold text-gray-900 group-hover:text-secondary-500 transition-colors">{stats ? stats.todaysBookings : '...'}</p>
                    </div>
                    <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform relative z-10">📅</div>
                </div>

                <div onClick={() => navigate('/agent/my-refunds')} className="bg-gradient-to-br from-green-500 to-green-600 p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl border border-green-400 card-hover flex items-center justify-between text-white group overflow-hidden relative cursor-pointer">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-white/30 transition-colors pointer-events-none"></div>
                    <div className="relative z-10">
                        <p className="text-xs font-black text-green-100 uppercase tracking-widest mb-1">Total Profits</p>
                        <p className="text-4xl font-extrabold mb-1">₹{stats ? stats.totalCommission.toLocaleString('en-IN') : '...'}</p>
                        {stats?.pendingRefunds > 0 && (
                            <p className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full inline-block backdrop-blur-sm animate-pulse border border-white/20">
                                🔄 {stats.pendingRefunds} Refund{stats.pendingRefunds > 1 ? 's' : ''} Pending
                            </p>
                        )}
                    </div>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform relative z-10">🤑</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-4 sm:p-6 md:p-8 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 gap-4">
                        <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 dark:text-slate-800">
                            <span className="p-2 bg-primary-100 text-primary-600 rounded-xl shrink-0">📜</span>
                            Recent Booking History
                        </h3>
                        <button 
                            onClick={() => navigate('/agent/ledger')}
                            className="text-primary-600 font-extrabold text-xs sm:text-sm hover:underline px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors shrink-0 whitespace-nowrap"
                        >
                            View Full Ledger
                        </button>
                    </div>
                    
                    <div className="divide-y divide-gray-50">
                        {recentBookings.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 font-bold">No recent bookings found.</div>
                        ) : (
                            recentBookings.map(b => (
                                <div key={b._id} onClick={() => navigate('/agent/history')} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 hover:bg-gray-50/50 transition-colors group cursor-pointer gap-4">
                                    <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-primary-50 text-primary-500 rounded-2xl flex items-center justify-center text-xl sm:text-2xl group-hover:bg-primary-500 group-hover:text-white transition-colors shadow-sm">
                                            {b.serviceType === 'FLIGHT' ? '✈️' : b.serviceType === 'HOTEL' ? '🏨' : '🎟️'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-extrabold text-gray-900 text-base sm:text-lg leading-tight truncate">
                                                {b.passengerDetails?.[0]?.name || b.fromCity || b.serviceType}
                                            </p>
                                            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 flex flex-wrap items-center gap-1 sm:gap-2">
                                                <span className="truncate max-w-[80px] sm:max-w-none">{b.providerReference || b._id.substring(0,8)}</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0"></span>
                                                <span className="shrink-0">{new Date(b.createdAt).toLocaleDateString()}</span>
                                                {b.airline && (
                                                    <>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0"></span>
                                                        <span className="text-primary-500 truncate max-w-[100px] sm:max-w-none">{b.airline}</span>
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right flex sm:block items-center justify-between sm:justify-end border-t sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0 shrink-0">
                                        <p className="font-black text-gray-900 text-base sm:text-xl">₹{b.totalCost.toLocaleString('en-IN')}</p>
                                        <p className={`text-[9px] sm:text-[10px] font-black px-2 sm:px-3 py-1 rounded-full uppercase mt-0 sm:mt-2 inline-block ${
                                            b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                        }`}>{b.status}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="space-y-6 h-fit">
                    {/* Recent Notifications Widget */}
                    <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl overflow-hidden relative group border border-white/5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 smooth-transition"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Latest Alerts</h3>
                            <button onClick={() => navigate('/agent/notifications')} className="text-primary-400 font-extrabold text-[10px] uppercase tracking-widest hover:underline">View All</button>
                        </div>
                        <div className="space-y-4 relative z-10">
                            {recentAlerts.length === 0 ? (
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest text-center py-4 italic">No new active alerts</p>
                            ) : (
                                recentAlerts.map(alert => (
                                    <div key={alert._id} onClick={() => navigate('/agent/notifications')} className="flex items-start gap-4 group/item cursor-pointer">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                                            alert.type === 'SUCCESS' ? 'bg-green-500/10 text-green-400' :
                                            alert.type === 'ALERT' ? 'bg-secondary-500/10 text-secondary-400' :
                                            'bg-primary-500/10 text-primary-400'
                                        }`}>
                                            {alert.type === 'SUCCESS' ? '✓' : alert.type === 'ALERT' ? '!' : 'ℹ'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-black text-xs truncate group-hover/item:text-primary-400 transition-colors">{alert.title}</p>
                                            <p className="text-white/40 text-[10px] font-bold mt-0.5">{new Date(alert.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {quickActions.map(action => (
                            <button 
                                key={action.label} 
                                onClick={() => navigate(action.path)}
                                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl card-hover group text-center flex flex-col items-center justify-center hover:border-primary-200 aspect-square"
                            >
                                <span className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-300 drop-shadow-md">{action.icon}</span>
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest leading-tight group-hover:text-primary-600 transition-colors">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
