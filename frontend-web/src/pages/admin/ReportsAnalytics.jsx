import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';

const ReportsAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('month'); // today, week, month, custom
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    const fetchAnalytics = async (params = {}) => {
        try {
            setLoading(true);
            const res = await adminService.getAnalytics(params);
            if (res.success) setData(res.data);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let params = {};
        const today = new Date();
        
        if (filter === 'today') {
            const dateStr = today.toISOString().split('T')[0];
            params = { startDate: dateStr, endDate: dateStr };
        } else if (filter === 'week') {
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 7);
            params = { startDate: lastWeek.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
        } else if (filter === 'month') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            params = { startDate: startOfMonth.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
        } else if (filter === 'custom' && customRange.start && customRange.end) {
            params = { startDate: customRange.start, endDate: customRange.end };
        } else if (filter === 'custom') {
            return; // Don't fetch until dates are set
        }

        fetchAnalytics(params);
    }, [filter, customRange]);

    const kpiCards = [
        { label: 'Growth vs Prev', value: data?.kpis?.monthlyGrowth || '0%', color: 'text-green-500' },
        { label: 'Avg Ticket Value', value: data?.kpis?.avgTicketValue || '₹0', color: 'text-primary-500' },
        { label: 'New Agents', value: data?.kpis?.newAgents || '0', color: 'text-orange-500' },
        { label: 'Conversion Rate', value: data?.kpis?.conversionRate || '0%', color: 'text-purple-500' }
    ];

    const maxRevenue = data?.revenueVelocity?.length ? Math.max(...data.revenueVelocity.map(v => v.dailyRevenue)) : 100;

    return (
        <div className="w-full space-y-10 animate-fade-in pb-20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 text-main">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Performance Analytics</h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Data-driven business intelligence</p>
                </div>

                <div className="w-full lg:w-auto bg-white p-3 rounded-[2rem] shadow-xl border border-gray-50 flex flex-wrap items-center gap-2">
                    {['today', 'week', 'month', 'custom'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filter === f ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            {f === 'week' ? 'Last 7 Days' : f}
                        </button>
                    ))}
                    
                    {filter === 'custom' && (
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 sm:ml-4 animate-slide-right">
                            <input 
                                type="date" 
                                value={customRange.start}
                                onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                                className="w-full sm:w-auto px-4 py-2 bg-gray-50 rounded-lg text-xs font-black border-0 focus:ring-0" 
                            />
                            <span className="text-[10px] font-black text-gray-300 uppercase">to</span>
                            <input 
                                type="date" 
                                value={customRange.end}
                                onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                                className="w-full sm:w-auto px-4 py-2 bg-gray-50 rounded-lg text-xs font-black border-0 focus:ring-0" 
                            />
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="p-40 text-center">
                    <div className="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="font-black text-gray-300 italic text-xl uppercase tracking-widest">Re-calculating platform velocity...</p>
                </div>
            ) : (
                <>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {kpiCards.map(s => (
                    <div key={s.label} className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-50 flex flex-col items-center text-center card-hover">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{s.label}</p>
                        <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 min-h-[400px] flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50"></div>
                <div className="relative z-10 w-full">
                    <div className="flex gap-1 md:gap-3 items-end justify-center mb-8 h-48 px-4 overflow-x-auto no-scrollbar">
                        {data?.revenueVelocity?.map((v, i) => (
                            <div 
                                key={i} 
                                title={`${v._id}: ₹${v.dailyRevenue.toLocaleString()}`}
                                className="w-4 md:w-8 bg-primary-500 rounded-t-lg transition-all hover:bg-secondary-500 shadow-lg shadow-primary-500/10 shrink-0" 
                                style={{ height: `${(v.dailyRevenue / maxRevenue) * 100}%`, minHeight: '4px' }}
                            ></div>
                        ))}
                        {(!data?.revenueVelocity || data?.revenueVelocity.length === 0) && (
                            <p className="text-gray-300 font-bold italic">No revenue data for the selected period</p>
                        )}
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Revenue Velocity</h3>
                    <p className="text-gray-400 font-bold text-sm tracking-tight leading-relaxed">Daily revenue trajectory for the last 30 business days.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 card-hover">
                    <h4 className="text-lg font-black mb-6">Top Performing Agents</h4>
                    <div className="space-y-4">
                        {data?.topAgents?.map((agent, i) => (
                            <div key={agent._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl hover:bg-primary-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-gray-300 italic text-xl">#{i + 1}</span>
                                    <div>
                                        <p className="font-black text-gray-900 text-sm leading-none">{agent.agencyName}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{agent.bookingCount} Bookings</p>
                                    </div>
                                </div>
                                <span className="font-black text-primary-500">₹{agent.totalSpent.toLocaleString()}</span>
                            </div>
                        ))}
                        {(!data?.topAgents || data?.topAgents.length === 0) && (
                             <p className="text-center text-gray-400 py-10 font-bold italic">Gathering recruitment data...</p>
                        )}
                    </div>
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 card-hover">
                    <h4 className="text-lg font-black mb-6">Service Distribution</h4>
                    <div className="space-y-6">
                        {data?.serviceDistribution?.map(s => {
                            const total = data.serviceDistribution.reduce((acc, curr) => acc + curr.count, 0);
                            const percent = ((s.count / total) * 100).toFixed(0);
                            return (
                                <div key={s._id} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-gray-400">{s._id}</span>
                                        <span className="text-gray-900">{percent}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-secondary-500 h-full transition-all duration-1000" 
                                            style={{ width: `${percent}%` }} 
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {(!data?.serviceDistribution || data?.serviceDistribution.length === 0) && (
                             <p className="text-center text-gray-400 py-10 font-bold italic">Awaiting service utilization...</p>
                        )}
                    </div>
                </div>
            </div>
        </>
            )}
        </div>
    );
};

export default ReportsAnalytics;
