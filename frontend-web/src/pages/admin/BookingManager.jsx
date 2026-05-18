import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';

const BookingManager = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All Bookings');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

    const getFlightNumber = (b) => {
        try {
            if (b.serviceType !== 'FLIGHT' && b.serviceType !== 'Flight') return b._id.slice(-6).toUpperCase();
            
            const segments = b.flightDetails;
            let flattened = [];
            if (Array.isArray(segments)) flattened = segments;
            else if (segments?.Onward) Object.keys(segments.Onward).filter(k => !isNaN(k)).sort().forEach(k => flattened.push(segments.Onward[k]));
            
            if (flattened.length > 0) {
                return `${flattened[0].airCode || ''} - ${flattened[0].flightNo || ''}`;
            }
        } catch (e) {}
        return b._id.slice(-6).toUpperCase();
    };
    
    useEffect(() => {
        fetchBookings(1);
    }, [statusFilter, activeTab]);

    const fetchBookings = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const typeMap = { 'Flights': 'FLIGHT', 'Hotels': 'HOTEL', 'Buses': 'BUS', 'Trains': 'TRAIN' };
            const serviceType = activeTab === 'All Bookings' ? '' : typeMap[activeTab];
            
            const res = await adminService.getBookings(pageNumber, 50, statusFilter, '', serviceType);
            if (res.success) {
                if (pageNumber === 1) {
                    setBookings(res.data);
                } else {
                    setBookings(prev => [...prev, ...res.data]);
                }
                setPagination(res.pagination);
            }
        } catch (err) {
            console.error('Failed to fetch bookings', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (pagination.page < pagination.pages) {
            fetchBookings(pagination.page + 1);
        }
    };

    const filteredBookings = bookings.filter(b => {
        // Search Filter Only (as Tab and Status are now backend-side)
        const matchesSearch = 
            b.providerReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.agentId?.agencyName?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    return (
        <div className="w-full space-y-10 animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1">Master Bookings</h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Global transaction ledger</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button className="w-full sm:w-auto px-6 py-3 sm:py-4 bg-white border border-gray-200 text-gray-600 font-black rounded-lg sm:rounded-2xl shadow-sm hover:bg-gray-50 transition-all text-xs">EXPORT CSV</button>
                </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 sm:p-8 md:p-10 border-b border-gray-50 flex flex-col md:flex-row gap-4 sm:gap-6 justify-between items-stretch md:items-center bg-gray-50/30">
                    <div className="relative flex-1 w-full max-w-full md:max-w-md">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search by PNR or Agent..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm shadow-sm" 
                        />
                    </div>
                    <div className="flex gap-2 sm:gap-4 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
                        {['All Bookings', 'Flights', 'Hotels', 'Buses', 'Trains'].map((tab) => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 sm:px-8 py-3 rounded-xl font-black text-xs tracking-widest whitespace-nowrap transition-all touch-target ${activeTab === tab ? 'bg-primary-500 text-white shadow-lg' : 'bg-white text-gray-400 hover:text-gray-900 shadow-sm border border-gray-100'}`}
                            >
                                {tab.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full md:w-auto px-6 py-4 bg-white rounded-2xl border-0 font-bold text-sm text-gray-500 shadow-sm focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PENDING">Pending</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                {loading ? (
                    <div className="p-20 text-center font-black text-gray-300 italic">Accessing Central Ledger...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[900px]">
                            <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                                <tr>
                                    <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">FLIGHT NO. & SERVICE</th>
                                    <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">AGENT PARTNER</th>
                                    <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">PNR / DATE</th>
                                    <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">BOOKING ID</th>
                                    <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 text-right">AMOUNT</th>
                                    <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 text-center">STATUS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredBookings.map(b => (
                                    <tr key={b._id} className="hover:bg-primary-50/30 transition-colors group">
                                        <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
                                            <div>
                                                <p className="font-black text-gray-900 text-sm md:text-base">{getFlightNumber(b)}</p>
                                                <p className="text-[9px] md:text-[10px] font-bold text-primary-500 uppercase tracking-widest">{b.serviceType}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 font-bold text-gray-600 text-sm md:text-base">{b.agentId?.agencyName || 'Unknown Agent'}</td>
                                        <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
                                            <p className="font-black text-gray-900 text-sm md:text-base">{b.providerReference}</p>
                                            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(b.travelDate).toLocaleDateString('en-IN')}</p>
                                        </td>
                                        <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
                                            <p className="text-[10px] font-black text-gray-400 break-all max-w-[150px]">{b.ftdBookingRef || 'N/A'}</p>
                                        </td>
                                        <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 text-right font-black text-primary-600 text-sm md:text-base">₹{b.totalCost?.toLocaleString()}</td>
                                        <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 text-center">
                                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                                b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                                                b.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {b.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredBookings.length === 0 && (
                            <div className="p-20 text-center text-gray-400 font-bold italic">No bookings found for this category.</div>
                        )}
                        
                        {pagination.page < pagination.pages && (
                            <div className="p-10 flex justify-center border-t border-gray-50">
                                <button 
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    className="px-10 py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-xs tracking-widest disabled:opacity-50"
                                >
                                    {loading ? 'LOADING...' : 'LOAD MORE BOOKINGS'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingManager;
