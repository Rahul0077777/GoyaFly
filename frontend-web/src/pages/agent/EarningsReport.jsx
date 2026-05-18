import React, { useState, useEffect } from 'react';
import { agentService } from '../../services/api';
import { 
    IoTrendingUpOutline, 
    IoPieChartOutline, 
    IoCalendarOutline, 
    IoAirplaneOutline, 
    IoBusinessOutline,
    IoChevronForwardOutline,
    IoArrowUpCircleOutline
} from "react-icons/io5";

const EarningsReport = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await agentService.getEarningsReport();
            if (res.success) {
                setStats(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch report', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center font-black text-slate-400 uppercase tracking-widest animate-pulse">
                    Generating Financial Analysis...
                </div>
            </div>
        );
    }

    const totalProfit = stats?.serviceBreakdown?.reduce((sum, s) => sum + s.totalCommission, 0) || 0;
    const totalBookings = stats?.serviceBreakdown?.reduce((sum, s) => sum + s.count, 0) || 0;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 md:space-y-12 animate-fade-in p-4 lg:p-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">Earnings Report</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Deep dive into your revenue streams</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 smooth-transition"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Total Net Profit</p>
                        <h4 className="text-4xl font-black text-slate-900 dark:text-white">₹{totalProfit.toLocaleString('en-IN')}</h4>
                        <div className="flex items-center gap-2 mt-4 text-emerald-500 font-black text-xs">
                            <IoArrowUpCircleOutline size={18} />
                            <span>LIFETIME EARNINGS</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 smooth-transition"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Total Conversions</p>
                        <h4 className="text-4xl font-black text-slate-900 dark:text-white">{totalBookings}</h4>
                        <p className="text-slate-400 font-bold text-xs mt-4">CONFIRMED BOOKINGS</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 smooth-transition"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Avg Profit / Sale</p>
                        <h4 className="text-4xl font-black text-slate-900 dark:text-white">
                            ₹{totalBookings > 0 ? Math.round(totalProfit / totalBookings).toLocaleString('en-IN') : 0}
                        </h4>
                        <p className="text-slate-400 font-bold text-xs mt-4">EFFICIENCY RATE</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                {/* Service Breakdown */}
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                        <h3 className="text-xl font-black flex items-center gap-4 dark:text-white">
                            <span className="p-3 bg-primary-100 dark:bg-primary-900/40 text-primary-600 rounded-2xl shadow-inner"><IoPieChartOutline size={22} /></span>
                            Revenue by Service
                        </h3>
                    </div>
                    <div className="p-8 flex-1 space-y-6">
                        {stats?.serviceBreakdown?.map(s => (
                            <div key={s._id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-primary-500 group-hover:text-white smooth-transition shadow-sm">
                                        {s._id === 'FLIGHT' ? '✈️' : s._id === 'HOTEL' ? '🏨' : '🎟️'}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white text-lg leading-tight uppercase tracking-tight">{s._id}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.count} Bookings</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-900 dark:text-white text-xl">₹{s.totalCommission.toLocaleString('en-IN')}</p>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase mt-1 tracking-widest">
                                        {Math.round((s.totalCommission / totalProfit) * 100)}% Share
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Airline Performance */}
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                        <h3 className="text-xl font-black flex items-center gap-4 dark:text-white">
                            <span className="p-3 bg-secondary-100 dark:bg-secondary-900/40 text-secondary-600 rounded-2xl shadow-inner"><IoAirplaneOutline size={22} /></span>
                            Top Airline Partners
                        </h3>
                    </div>
                    <div className="p-8 flex-1 space-y-6">
                        {stats?.airlinePerformance?.length === 0 ? (
                            <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">No airline data available</div>
                        ) : (
                            stats?.airlinePerformance?.map((a, idx) => (
                                <div key={a._id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:bg-secondary-500 group-hover:text-white smooth-transition shadow-inner">
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 dark:text-white text-lg leading-tight uppercase tracking-tight">{a._id}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{a.bookings} Bookings</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900 dark:text-white text-xl">₹{a.profit.toLocaleString('en-IN')}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">PROFIT</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Monthly History Section */}
            <div className="bg-slate-900 p-10 md:p-12 lg:p-16 rounded-[3.5rem] shadow-2xl relative overflow-hidden group border border-white/5">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:scale-125 smooth-transition"></div>
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                        <div>
                            <h3 className="text-white text-3xl md:text-4xl font-black">Monthly Growth</h3>
                            <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] mt-2 flex items-center gap-2">
                                <IoCalendarOutline /> Historical Performance Tracking
                            </p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-md">
                            <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-1">Estimated Growth Index</p>
                            <p className="text-primary-400 font-black text-2xl">₹{Math.round(totalProfit / 6.5).toLocaleString('en-IN')}/mo</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                        {stats?.monthlyHistory?.map(m => (
                            <div key={m._id} className="bg-white/5 border border-white/5 p-6 sm:p-8 rounded-[2rem] hover:bg-white/10 transition-all group/card text-center flex flex-col justify-center h-full">
                                <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-4">{m._id}</p>
                                <h5 className="text-white font-black text-xl mb-1">₹{m.profit.toLocaleString()}</h5>
                                <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">{m.bookings} Sales</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EarningsReport;
