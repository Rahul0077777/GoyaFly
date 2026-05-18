import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api, { bookingService } from '../../services/api';
import {
    IoAirplaneOutline,
    IoBusOutline,
    IoCarOutline,
    IoBedOutline,
    IoShieldCheckmarkOutline,
    IoDocumentTextOutline,
    IoEyeOutline,
    IoCloseCircleOutline,
    IoRefreshOutline,
    IoChevronBack,
    IoChevronForward
} from "react-icons/io5";

const THEME = {
    deepBlue: '#1D4171',
    brightOrange: '#F07E21',
    skyBlue: '#48A0D4',
    black: '#000000',
    bg: '#F8F9FA'
};

const BookingHistory = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    // =============================================
    // STATE
    // =============================================
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('FLIGHT');
    const [showModal, setShowModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [quoteModal, setQuoteModal] = useState({ isOpen: false, data: null });
    const [isAccepting, setIsAccepting] = useState(false);

    // Pick up success message from checkout redirect
    useEffect(() => {
        const state = window.history.state?.usr;
        if (state?.success && state?.message) {
            setSuccessMsg(state.message);
            // Clear state so it doesn't persist on refresh
            window.history.replaceState({}, '');
        }
    }, []);

    // Pagination & Metadata
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);

    // Filters
    const [filters, setFilters] = useState({
        pnr: '',
        bookingId: '',
        fromDate: '',
        toDate: '',
        travelDate: '',
        status: '',
        airline: '',
        paxName: ''
    });

    // =============================================
    // DATA FETCHING
    // =============================================
    useEffect(() => {
        handleSearch();
    }, [activeTab, currentPage, entriesPerPage]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: entriesPerPage,
                serviceType: activeTab,
                status: filters.status,
                fromDate: filters.fromDate,
                toDate: filters.toDate,
                bookingId: filters.pnr || filters.bookingId // Controller handles both as ID/Ref
            };

            const res = await bookingService.getAgentHistory(params);
            if (res.success) {
                setBookings(res.data);
                if (res.pagination) {
                    setTotalPages(res.pagination.pages);
                    setTotalEntries(res.pagination.total);
                }
            }
        } catch (error) {
            console.error("Fetch history error:", error);
        } finally {
            setLoading(false);
        }
    };

    // =============================================
    // HELPERS
    // =============================================
    const getPaxName = (b) => {
        const details = b.passengerDetails;
        if (!details) return 'N/A';
        if (Array.isArray(details) && details[0]) {
            const p = details[0];
            if (p.fName || p.lName) return `${p.title || ''} ${p.fName || ''} ${p.lName || ''}`.trim();
            return p.passengerName || p.name || 'N/A';
        }
        if (typeof details === 'object') return details.name || details.passengerName || 'N/A';
        return 'N/A';
    };

    const handleDownload = async (booking, type) => {
        try {
            const res = type === 'INVOICE'
                ? await bookingService.ftdDownloadInvoice(booking.providerReference || booking.pnr)
                : await bookingService.ftdDownloadTicket(booking.providerReference || booking.pnr);
            if (res.success && res.url) {
                const baseUrl = api.defaults?.baseURL?.replace('/api', '') || 'http://localhost:5000';
                window.open(`${baseUrl}${res.url}`, '_blank');
            }
        } catch (error) { console.error(error); }
    };

    const tabs = [
        { name: 'Flight', key: 'FLIGHT', icon: <IoAirplaneOutline size={18} /> },
        { name: 'Bus', key: 'BUS', icon: <IoBusOutline size={18} /> },
        { name: 'Cab', key: 'CAB', icon: <IoCarOutline size={18} /> },
        { name: 'Hotel', key: 'HOTEL', icon: <IoBedOutline size={18} /> },
        { name: 'Insurance', key: 'INSURANCE', icon: <IoShieldCheckmarkOutline size={18} /> },
        { name: 'Visa', key: 'VISA', icon: <IoDocumentTextOutline size={18} /> }
    ];

    const getStatusStyle = (status) => {
        const s = status?.toUpperCase();
        if (s === 'CONFIRMED' || s === 'SUCCESS') return 'bg-[#ecfdf5] text-[#059669] border-[#d1fae5]';
        if (s === 'REJECTED' || s === 'CANCELLED' || s === 'FAILED') return 'bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]';
        return 'bg-[#fffbeb] text-[#d97706] border-[#fef3c7]';
    };

    // =============================================
    // ACTION HANDLERS
    // =============================================
    const openCancelPage = (b) => {
        const id = b.ftdBookingRef || b.providerReference || b._id;
        navigate(`/book/flights/flight_cancellation/${id}`);
    };

    const openReschedulePage = (b) => {
        const id = b.ftdBookingRef || b.providerReference || b._id;
        navigate(`/book/flights/flight_reschedule/${id}`);
    };

    const handleOpenQuote = (reschedule) => {
        setQuoteModal({ isOpen: true, data: reschedule });
    };

    const handleAcceptQuote = async () => {
        if (!quoteModal.data) return;
        
        setIsAccepting(true);
        try {
            const res = await bookingService.acceptRescheduleQuote(quoteModal.data._id);
            if (res.success) {
                // Using alert or toast if available, assuming toast is used elsewhere
                alert('Quote accepted! Your reissue is being processed.');
                setQuoteModal({ isOpen: false, data: null });
                handleSearch(); // Refresh data
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to accept quote. Check your wallet balance.');
        } finally {
            setIsAccepting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] pb-24 font-sans">
            {/* 1. Header with Image Background */}
            <div className="bg-[url('https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&q=80&w=2069')] bg-cover bg-center h-[280px] w-full relative">
                <div className="absolute inset-0 bg-[#1D4171]/40"></div>
                <div className="max-w-[1400px] mx-auto px-10 pt-10 relative z-10 flex flex-col h-full">
                    <h1 className="text-white text-3xl font-bold mb-10 tracking-tight">My Bookings</h1>

                    {/* Tabs Bar */}
                    <div className="flex gap-1 mt-auto overflow-x-auto no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-10 py-3.5 rounded-t-xl text-[13px] font-bold uppercase transition-all duration-300 min-w-[120px] ${activeTab === tab.key
                                        ? 'bg-white text-slate-800'
                                        : 'bg-slate-700/60 text-white hover:bg-slate-700/80'
                                    }`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-10 -mt-10">
                {/* 2. Floating Filter Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-10 border border-slate-100 relative z-20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">PNR</label>
                            <input
                                value={filters.pnr} onChange={e => setFilters({ ...filters, pnr: e.target.value })}
                                type="text" placeholder="Eg: ABC1XY" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#F07E21]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Booking ID</label>
                            <input
                                value={filters.bookingId} onChange={e => setFilters({ ...filters, bookingId: e.target.value })}
                                type="text" placeholder="Eg: SZ231224XXXXXX" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#F07E21]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">From Date</label>
                            <input
                                value={filters.fromDate} onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
                                type="date" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">To Date</label>
                            <input
                                value={filters.toDate} onChange={e => setFilters({ ...filters, toDate: e.target.value })}
                                type="date" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Travel Date</label>
                            <input
                                value={filters.travelDate} onChange={e => setFilters({ ...filters, travelDate: e.target.value })}
                                type="date" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Flight Status</label>
                            <select
                                value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none appearance-none"
                            >
                                <option value="">Select Status</option>
                                <option value="CONFIRMED">Success</option>
                                <option value="PENDING">Pending</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Airline Name</label>
                            <select
                                value={filters.airline} onChange={e => setFilters({ ...filters, airline: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none appearance-none"
                            >
                                <option value="">Select Airline</option>
                                <option value="Indigo">Indigo</option>
                                <option value="Air India">Air India</option>
                                <option value="Spicejet">Spicejet</option>
                                <option value="Akasa">Akasa</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">PAX Name</label>
                            <input
                                value={filters.paxName} onChange={e => setFilters({ ...filters, paxName: e.target.value })}
                                type="text" placeholder="First Name" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#F07E21]"
                            />
                        </div>
                    </div>
                    {/* Orange Submit Button */}
                    <div className="flex justify-end mt-8 sm:mt-10">
                        <button
                            onClick={handleSearch}
                            className="w-full sm:w-auto bg-[#F07E21] text-white px-12 sm:px-20 py-4 rounded-2xl text-[14px] font-bold uppercase shadow-2xl shadow-orange-200 transition-all active:scale-95 touch-target"
                        >
                            Submit
                        </button>
                    </div>
                </div>

                {/* 3. Table UI */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Table Filters Top Row */}
                    <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[13px] font-semibold text-slate-500">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span>Show</span>
                            <select
                                value={entriesPerPage} onChange={e => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="border border-slate-200 rounded-md px-2 py-1 outline-none"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span>entries</span>
                            <button className="ml-2 sm:ml-4 px-4 py-1.5 border border-slate-200 rounded shadow-sm text-slate-600 font-bold hover:bg-slate-50 transition-all touch-target">Excel</button>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative w-full sm:w-auto">
                                <input type="text" placeholder="Search..." className="border border-slate-200 rounded px-4 py-1.5 w-full sm:w-[250px]" />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <IoRefreshOutline size={14} className="text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border-slate-100 min-w-[900px]">
                            <thead>
                                <tr className="bg-white border-b border-slate-100 uppercase text-[11px] font-bold text-slate-500 tracking-wider">
                                    <th style={{ backgroundColor: THEME.deepBlue }} className="text-white px-8 py-4 w-[240px]">Bookings</th>
                                    <th className="px-8 py-4 border-r border-slate-100">Travel Information</th>
                                    <th className="px-6 py-4 text-center border-r border-slate-100">Status</th>
                                    <th className="px-6 py-4 text-center border-r border-slate-100">Action</th>
                                    <th className="px-8 py-4 text-left">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="5" className="py-20 text-center text-slate-300 font-bold uppercase tracking-[0.2em] animate-pulse">Synchronizing Data...</td></tr>
                                ) : bookings.length === 0 ? (
                                    <tr><td colSpan="5" className="py-20 text-center text-slate-400 font-bold uppercase">No Bookings Found</td></tr>
                                ) : bookings.map(b => (
                                    <tr key={b._id} className="hover:bg-slate-50/50 transition-all">
                                        {/* FIRST COLUMN: DEEP BLUE */}
                                        <td style={{ backgroundColor: THEME.deepBlue }} className="px-8 py-6">
                                            <div className="flex flex-col gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-white font-bold text-[13px]">{b.fromCity || 'Flight'}</span>
                                                        <IoAirplaneOutline className="text-white/60" size={12} />
                                                        <span className="text-white font-bold text-[13px]">{b.toCity || 'Booking'}</span>
                                                    </div>
                                                    <p className="text-white/40 text-[10px] font-medium tracking-wide">{new Date(b.createdAt).toLocaleString()}</p>
                                                </div>
                                                <button
                                                    onClick={() => { setSelectedBooking(b); setShowModal(true); }}
                                                    className="border border-white/20 rounded px-4 py-1.5 text-white text-[10px] font-bold uppercase hover:bg-white/10 transition-all w-[100px] flex items-center justify-center gap-2 touch-target"
                                                >
                                                    <IoEyeOutline size={12} /> View
                                                </button>
                                            </div>
                                        </td>

                                        {/* TRAVEL INFORMATION */}
                                        <td className="px-8 py-6">
                                            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1.5fr] gap-x-12 gap-y-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-300 uppercase mb-1">Name</span>
                                                    <span className="text-[11px] font-bold text-slate-700 uppercase">{getPaxName(b)}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-300 uppercase mb-1">Airline</span>
                                                    <span className="text-[11px] font-bold text-slate-600 leading-tight">
                                                        {b.airline || 'Carrier'}<br />
                                                        <span className="text-[10px] text-sky-400">Instant Offers,</span>
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-300 uppercase mb-1">Travel Date</span>
                                                    <span className="text-[11px] font-bold text-slate-700">{new Date(b.travelDate || b.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex flex-col col-span-3 mt-1">
                                                    <div className="flex items-center gap-8">
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">PNR</span>
                                                            <span className="text-[11px] font-bold text-emerald-500 uppercase font-mono tracking-tighter">{b.providerReference || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* STATUS */}
                                        <td className="px-6 py-6 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`px-5 py-1 rounded-sm text-[10px] font-bold uppercase w-[80px] border ${getStatusStyle(b.status)}`}>
                                                    {b.status === 'CONFIRMED' ? 'Success' : b.status}
                                                </div>
                                                {b.status === 'CANCELLED' && (
                                                    <div className="flex flex-col items-center mt-1">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                                            b.refundStatus === 'PROCESSED' ? 'bg-green-100 text-green-700' :
                                                            b.refundStatus === 'PENDING_AIRLINE' ? 'bg-orange-100 text-orange-700 animate-pulse' :
                                                            'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {b.refundStatus?.replace('_', ' ') || 'Pending'}
                                                        </span>
                                                        {b.refundStatus === 'PROCESSED' && (
                                                            <span className="text-[10px] font-bold text-green-600 mt-0.5">
                                                                +₹{b.refundAmount?.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {b.status !== 'CANCELLED' && (
                                                    <button
                                                        onClick={() => handleDownload(b, 'INVOICE')}
                                                        className="flex items-center justify-center gap-2 border border-slate-300 rounded px-3 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase touch-target"
                                                    >
                                                        <IoDocumentTextOutline size={12} /> Invoice
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        {/* ACTION */}
                                        <td className="px-6 py-6 text-center">
                                            {b.status !== 'CANCELLED' && (
                                                <div className="flex flex-col gap-2 items-center">
                                                    {b.rescheduleRequest ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                                                                b.rescheduleRequest.status === 'PROCESSED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                b.rescheduleRequest.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' :
                                                                b.rescheduleRequest.status === 'QUOTE_PROVIDED' ? 'bg-purple-50 text-purple-600 border-purple-100 animate-bounce' :
                                                                'bg-orange-50 text-orange-600 border-orange-100'
                                                            }`}>
                                                                {b.rescheduleRequest.status.replace('_', ' ')}
                                                            </span>
                                                            {b.rescheduleRequest.status === 'QUOTE_PROVIDED' && (
                                                                <button
                                                                    onClick={() => handleOpenQuote(b.rescheduleRequest)}
                                                                    className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 active:scale-95 touch-target"
                                                                >
                                                                    Pay Quote
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => openCancelPage(b)}
                                                                className="flex items-center justify-center gap-2 border border-rose-300 rounded px-5 py-1.5 text-rose-500 text-[10px] font-bold uppercase hover:bg-rose-50 transition-all w-[100px] touch-target"
                                                            >
                                                                <IoCloseCircleOutline size={12} /> Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => openReschedulePage(b)}
                                                                className="flex items-center justify-center gap-2 border border-[#48A0D4] rounded px-5 py-1.5 text-[#48A0D4] text-[10px] font-bold uppercase hover:bg-sky-50 transition-all w-[100px] touch-target"
                                                            >
                                                                <IoRefreshOutline size={12} /> Reissue
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                            {b.status === 'CANCELLED' && (
                                                <span className="text-[10px] font-bold text-slate-400 italic">No Actions</span>
                                            )}
                                        </td>

                                        {/* AMOUNT */}
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1 text-[11px]">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-slate-400 font-medium">Total</span>
                                                    <span className="text-slate-800 font-bold">₹{(b.totalCost || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-3 font-bold">
                                                    <span className="text-slate-400">Net</span>
                                                    <span className="text-slate-800 tracking-tighter">₹{(b.totalCost - (b.commissionEarned || 0)).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION FOOTER */}
                    <div className="p-8 border-t border-slate-100 flex justify-between items-center text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                        <p>Showing {totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} to {Math.min(currentPage * entriesPerPage, totalEntries)} of {totalEntries} entries</p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-slate-200 rounded text-slate-500 disabled:opacity-30"
                            >
                                Prev
                            </button>

                            {[...Array(totalPages)].map((_, idx) => (
                                <button
                                    key={idx + 1}
                                    onClick={() => setCurrentPage(idx + 1)}
                                    className={`w-9 h-9 rounded flex items-center justify-center border transition-all ${currentPage === idx + 1
                                            ? 'bg-[#F07E21] border-[#F07E21] text-white'
                                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 border border-slate-200 rounded text-slate-500 disabled:opacity-30"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legacy Cancel Modal removed - navigation to dedicated page implemented above */}

            {/* SUCCESS NOTIFICATION */}
            {successMsg && (
                <div className="fixed bottom-10 right-10 z-[200] animate-in fade-in slide-in-from-right duration-500">
                    <div className="bg-emerald-500 text-white px-8 py-5 rounded-[2rem] shadow-2xl shadow-emerald-200 flex items-center gap-4">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <IoAirplaneOutline className="rotate-90" />
                        </div>
                        <p className="font-bold text-sm tracking-tight">{successMsg}</p>
                        <button onClick={() => setSuccessMsg('')} className="ml-4 opacity-60 hover:opacity-100 font-bold">×</button>
                    </div>
                </div>
            )}

            {/* MODAL: Detailed View - Retain Premium Aesthetic */}
            {showModal && selectedBooking && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
                        <div style={{ backgroundColor: THEME.deepBlue }} className="p-8 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold uppercase tracking-tight">Application Detail View</h2>
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">{selectedBooking.providerReference}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20">
                                <IoCloseCircleOutline size={28} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-10">
                            {/* Route */}
                            <div className="flex flex-col sm:flex-row items-center justify-between text-center px-4 sm:px-10 gap-4">
                                <div className="text-center sm:text-left">
                                    <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase">{selectedBooking.fromCity || 'Source'}</h3>
                                    <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">Origin Station</p>
                                </div>
                                <div className="w-full sm:flex-1 px-4 sm:px-10 relative py-4 sm:py-0">
                                    <div className="h-[2px] w-full bg-slate-100 hidden sm:block"></div>
                                    <IoAirplaneOutline className="text-[#F07E21] absolute left-1/2 top-1/2 sm:-top-4 -translate-x-1/2 -translate-y-1/2 sm:translate-y-0 rotate-90 sm:rotate-0" size={32} />
                                </div>
                                <div className="text-center sm:text-right">
                                    <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase">{selectedBooking.toCity || 'Dest.'}</h3>
                                    <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">Arrival Region</p>
                                </div>
                            </div>

                            {/* Data Sections */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 pt-10 border-t border-slate-100">
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest underline underline-offset-8 decoration-sky-300">Passenger Info</h4>
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <p className="text-slate-900 font-extrabold text-[15px] uppercase">{getPaxName(selectedBooking)}</p>
                                        <p className="text-[#1D4171] font-bold text-[11px] mt-1">Ticket Status: {selectedBooking.status}</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest underline underline-offset-8 decoration-orange-300">Financial Summary</h4>
                                    <div className="bg-slate-900 p-6 rounded-2xl text-white space-y-3 shadow-lg shadow-slate-200">
                                        <div className="flex justify-between items-center opacity-40 text-[11px] font-bold uppercase">
                                            <span>Market Gross Amount</span>
                                            <span>₹{(selectedBooking.totalCost || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="h-px bg-white/10"></div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-bold text-white/40 uppercase">Agency Yield</span>
                                            <span className="text-emerald-400 font-bold ml-2">+₹{(selectedBooking.commissionEarned || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-end pt-2">
                                            <span className="text-[11px] font-black uppercase text-sky-400">Net Deduction</span>
                                            <span className="text-2xl font-black tracking-tighter">₹{(selectedBooking.totalCost - (selectedBooking.commissionEarned || 0)).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => handleDownload(selectedBooking, 'TICKET')}
                                className="w-full sm:flex-1 py-4 bg-[#1D4171] text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest shadow-xl shadow-slate-200"
                            >
                                Generate Global Ticket
                            </button>
                            <button
                                onClick={() => handleDownload(selectedBooking, 'INVOICE')}
                                className="w-full sm:flex-1 py-4 bg-white border border-slate-200 text-slate-800 rounded-2xl font-bold text-[13px] uppercase tracking-widest shadow-sm"
                            >
                                View Financial Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* RESCHEDULE QUOTE MODAL */}
            {quoteModal.isOpen && quoteModal.data && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 scale-in-center">
                        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-8 text-white relative">
                            <h3 className="text-xl font-black tracking-tight mb-1">Reissue Quotation</h3>
                            <p className="text-[10px] font-bold text-purple-200 uppercase tracking-[0.2em] opacity-80">Action Required: Review & Accept</p>
                            <button onClick={() => setQuoteModal({ isOpen: false, data: null })} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                                <IoCloseCircleOutline size={28} />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[13px]">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Airline Penalty</span>
                                    <span className="text-slate-800 font-black">₹{quoteModal.data.quoteDetails.airlinePenalty?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-[13px]">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Fare Difference</span>
                                    <span className="text-slate-800 font-black">₹{quoteModal.data.quoteDetails.fareDifference?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-[13px]">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Service Fee</span>
                                    <span className="text-slate-800 font-black">₹{quoteModal.data.quoteDetails.adminMarkup?.toLocaleString()}</span>
                                </div>
                                <div className="h-px bg-slate-100 my-2"></div>
                                <div className="flex justify-between items-end">
                                    <span className="text-purple-600 font-black uppercase tracking-[0.2em] text-[11px]">Total Payable</span>
                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{quoteModal.data.quoteDetails.totalAmount?.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex gap-3 items-start">
                                <IoShieldCheckmarkOutline className="text-purple-600 text-xl flex-shrink-0 mt-0.5" />
                                <p className="text-[11px] font-bold text-purple-800 leading-relaxed">
                                    Funds will be instantly deducted from your Goyafly Wallet. Your new ticket will be issued by our team within 30-60 minutes.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setQuoteModal({ isOpen: false, data: null })}
                                    className="flex-1 py-4 rounded-2xl font-black text-slate-400 text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={handleAcceptQuote}
                                    disabled={isAccepting}
                                    className="flex-[2] py-4 rounded-2xl font-black text-white text-[11px] uppercase tracking-widest bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-xl hover:shadow-purple-500/30 transition-all disabled:opacity-50"
                                >
                                    {isAccepting ? 'Processing...' : 'Accept & Pay Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingHistory;
