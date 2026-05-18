import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services/api';
import { 
    IoSearchOutline, 
    IoCalendarOutline, 
    IoFilterOutline,
    IoDownloadOutline,
    IoPrintOutline,
    IoAirplaneOutline,
    IoBusOutline,
    IoCarOutline,
    IoBusinessOutline,
    IoShieldCheckmarkOutline,
    IoCardOutline
} from "react-icons/io5";

const THEME = {
    deepBlue: '#1D4171',
    brightOrange: '#F07E21',
    skyBlue: '#48A0D4',
    border: '#E2E8F0',
    headerBg: '#0f172a'
};

const MyRefunds = () => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('FLIGHT');
    const [entriesPerPage, setEntriesPerPage] = useState(25);
    
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        bookingId: ''
    });

    const categories = [
        { id: 'FLIGHT', label: 'Flight', icon: <IoAirplaneOutline size={20} /> },
        { id: 'BUS', label: 'Bus', icon: <IoBusOutline size={20} /> },
        { id: 'CAB', label: 'Cab', icon: <IoCarOutline size={20} /> },
        { id: 'HOTEL', label: 'Hotel', icon: <IoBusinessOutline size={20} /> },
        { id: 'INSURANCE', label: 'Insurance', icon: <IoShieldCheckmarkOutline size={20} /> },
        { id: 'VISA', label: 'Visa', icon: <IoCardOutline size={20} /> },
    ];

    useEffect(() => {
        handleSearch();
    }, [activeTab]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            // We search for CANCELLED bookings for the active serviceType
            const res = await bookingService.getAgentHistory({
                status: 'CANCELLED',
                serviceType: activeTab,
                ...filters
            });
            if (res.success) {
                setRefunds(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch refunds', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-24 font-sans text-slate-800">
            {/* 1. Header Hero */}
            <div className="bg-[url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center h-[260px] w-full relative">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
                <div className="max-w-[1700px] mx-auto px-8 pt-16 relative z-10">
                    <h1 className="text-white text-4xl font-black tracking-tight drop-shadow-lg">My Refunds</h1>
                </div>
            </div>

            <div className="max-w-[1700px] mx-auto px-8 -mt-16 relative z-20">
                {/* 2. Service Tabs */}
                <div className="flex flex-wrap gap-2 mb-0 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`flex items-center gap-3 px-8 py-4 rounded-t-2xl font-bold text-sm transition-all duration-300 min-w-[140px] justify-center shadow-lg ${
                                activeTab === cat.id 
                                ? 'bg-white text-[#1D4171] transform translate-y-0 opacity-100' 
                                : 'bg-slate-700/80 text-white opacity-90 hover:bg-slate-700 hover:translate-y-[-2px]'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* 3. Filter Board */}
                <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-2xl p-8 mb-6 border border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider ml-1">From Date</label>
                            <input 
                                type="date" 
                                value={filters.fromDate}
                                onChange={e => setFilters({...filters, fromDate: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-[13px] font-bold outline-none focus:border-[#48A0D4] transition-colors" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider ml-1">To Date</label>
                            <input 
                                type="date" 
                                value={filters.toDate}
                                onChange={e => setFilters({...filters, toDate: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-[13px] font-bold outline-none focus:border-[#48A0D4] transition-colors" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider ml-1">Booking Id</label>
                            <input 
                                type="text" 
                                placeholder="Booking Id"
                                value={filters.bookingId}
                                onChange={e => setFilters({...filters, bookingId: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-[13px] font-bold outline-none focus:border-[#48A0D4] transition-colors" 
                            />
                        </div>
                        <button 
                            onClick={handleSearch}
                            className="bg-[#F07E21] hover:bg-[#d96a15] text-white font-black py-4 rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-95 uppercase tracking-widest text-xs"
                        >
                            Submit
                        </button>
                    </div>
                </div>

                {/* 4. Table Unit */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                    <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <select 
                                value={entriesPerPage}
                                onChange={e => setEntriesPerPage(Number(e.target.value))}
                                className="bg-slate-100 border-none rounded-lg px-3 py-2 text-xs font-bold outline-none touch-target"
                            >
                                <option value={10}>Show 10 rows</option>
                                <option value={25}>Show 25 rows</option>
                                <option value={50}>Show 50 rows</option>
                            </select>
                            <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-xs font-bold transition-colors touch-target">
                                <IoDownloadOutline /> Export Excel
                            </button>
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Search..."
                                className="bg-slate-50 border border-slate-100 rounded-lg pl-12 pr-4 py-2.5 text-sm font-medium w-full sm:w-[250px] outline-none focus:border-[#48A0D4]"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-5 bg-[#1D4171] text-white w-[180px]">Booking ID</th>
                                    <th className="px-6 py-5">Passengers</th>
                                    <th className="px-6 py-5 text-center">PNR</th>
                                    <th className="px-6 py-5">Cancelled Date</th>
                                    <th className="px-6 py-5 text-right">Amount</th>
                                    <th className="px-6 py-5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 border-4 border-[#F07E21] border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-slate-400 font-bold animate-pulse">Fetching Refund Records...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : refunds.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                <div className="text-6xl text-slate-200">🗃️</div>
                                                <p className="text-slate-500 font-bold">No refund records found for this category.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    refunds.map((ref, idx) => (
                                        <tr key={ref._id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-[#1D4171] text-[12px]">{ref.providerReference || ref._id}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-[13px] font-black text-slate-700 uppercase">
                                                    {ref.passengerDetails?.name || ref.passengerDetails?.[0]?.FirstName || 'Customer'}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold">
                                                    {ref.pnr || 'N/A'} • {ref.refundType || 'Non-Refundable'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-slate-100 px-3 py-1 rounded text-[11px] font-black text-slate-600 uppercase tracking-tighter shadow-sm">
                                                    {ref.pnr || 'REF-ID'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[12px] font-bold text-slate-500 italic">
                                                {new Date(ref.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-[14px] font-black text-[#1D4171]">₹{(ref.refundAmount || 0).toLocaleString()}</div>
                                                <div className="text-[9px] text-slate-400 font-bold line-through opacity-50">₹{ref.totalCost?.toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {ref.refundStatus === 'PROCESSED' ? (
                                                    <span className="bg-green-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-100">
                                                        Refunded
                                                    </span>
                                                ) : ref.refundStatus === 'PENDING_AIRLINE' ? (
                                                    <span className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-orange-100">
                                                        Pending Airline
                                                    </span>
                                                ) : ref.refundStatus === 'FAILED' ? (
                                                    <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-red-100">
                                                        Failed
                                                    </span>
                                                ) : (
                                                    <span className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-200">
                                                        Non-Refundable
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyRefunds;
