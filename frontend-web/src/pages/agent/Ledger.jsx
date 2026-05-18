import React, { useState, useEffect, useMemo } from 'react';
import { walletService } from '../../services/api';
import { 
    IoSearchOutline, 
    IoCalendarOutline, 
    IoFilterOutline,
    IoDownloadOutline,
    IoPrintOutline,
    IoArrowBack,
    IoChevronDown
} from "react-icons/io5";
import { FaCalendarAlt } from 'react-icons/fa';

const THEME = {
    deepBlue: '#1D4171',
    brightOrange: '#F07E21',
    skyBlue: '#BAE1FF', 
    border: '#E2E8F0',
    zeroRed: '#FF4D4D'
};

const AgencyStatement = () => {
    // =============================================
    // STATE
    // =============================================
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Filters
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        type: 'All'
    });

    // =============================================
    // DATA FETCHING
    // =============================================
    useEffect(() => {
        handleSearch();
    }, []);

    const handleSearch = async () => {
        setLoading(true);
        setCurrentPage(1);
        try {
            const res = await walletService.getHistory(1, 1000); 
            if (res.success) setTransactions(res.data);
        } catch (err) {
            console.error('Failed to fetch ledger', err);
        } finally {
            setLoading(false);
        }
    };

    // =============================================
    // FILTERING & PAGINATION LOGIC
    // =============================================
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const typeValue = filters.type;
            let matchesType = typeValue === 'All';
            
            // Map UI Labels to DB Purpose codes
            if (!matchesType) {
                if (typeValue === 'WALLET_RECHARGE') matchesType = (t.purpose === 'WALLET_RECHARGE' || t.purpose === 'CREDIT');
                else if (typeValue === 'FLIGHT_BOOKING') matchesType = (t.purpose === 'FLIGHT_BOOKING' || t.purpose === 'TICKET_BOOKING');
                else if (typeValue === 'CANCEL_REFUND') matchesType = (t.purpose === 'CANCEL_REFUND' || t.purpose === 'REFUND');
                else matchesType = (t.purpose === typeValue);
            }

            const date = new Date(t.createdAt);
            date.setHours(0, 0, 0, 0); // Normalize to start of day for comparison

            const from = filters.fromDate ? new Date(filters.fromDate) : null;
            if (from) from.setHours(0, 0, 0, 0);

            const to = filters.toDate ? new Date(filters.toDate) : null;
            if (to) to.setHours(0, 0, 0, 0);

            const matchesFrom = !from || date >= from;
            const matchesTo = !to || date <= to;
            
            return matchesType && matchesFrom && matchesTo;
        });
    }, [transactions, filters]);

    const paginatedTransactions = useMemo(() => {
        const start = (currentPage - 1) * entriesPerPage;
        return filteredTransactions.slice(start, start + entriesPerPage);
    }, [filteredTransactions, currentPage, entriesPerPage]);

    const totalPages = Math.ceil(filteredTransactions.length / entriesPerPage);

    const formatType = (type, purpose) => {
        if (purpose === 'WALLET_RECHARGE') return 'Recharge';
        if (purpose === 'FLIGHT_BOOKING' || purpose === 'TICKET_BOOKING') return 'FLIGHT BOOKING';
        if (purpose === 'CANCEL_REFUND' || purpose === 'REFUND') return 'Flight Refund';
        return purpose || type;
    };

    const renderAmount = (val) => {
        const num = Number(val || 0);
        if (num === 0) return <span className="text-rose-500 font-bold">0</span>;
        return <span className="font-bold">{num.toLocaleString()}</span>;
    };

    return (
        <div className="min-h-screen bg-white pb-24 font-sans text-slate-800">
            {/* 1. Header with Image Overlay */}
            <div className="bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2072')] bg-cover bg-center h-[200px] w-full relative">
                <div className="absolute inset-0 bg-[#000000]/30 backdrop-blur-[1px]"></div>
                <div className="max-w-[1700px] mx-auto px-6 pt-12 relative z-10">
                    <h1 className="text-white text-3xl font-black tracking-tight">Agency Statement</h1>
                </div>
            </div>

            <div className="max-w-[1700px] mx-auto px-6 -mt-10 relative z-20">
                {/* 2. Floating Filter Board */}
                <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4 border border-slate-100">
                    <div className="flex flex-col md:flex-row items-end gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-400 font-bold ml-1">From Date</label>
                                <div className="relative">
                                    <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-[#48A0D4] pointer-events-none" />
                                    <input 
                                        type="date" 
                                        value={filters.fromDate}
                                        onChange={e => setFilters({...filters, fromDate: e.target.value})}
                                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                        className="w-full bg-white border border-slate-100 rounded-xl pl-11 pr-3 py-3 text-[12px] font-bold outline-none shadow-sm cursor-pointer" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-400 font-bold ml-1">To Date</label>
                                <div className="relative">
                                    <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-[#48A0D4] pointer-events-none" />
                                    <input 
                                        type="date" 
                                        value={filters.toDate}
                                        onChange={e => setFilters({...filters, toDate: e.target.value})}
                                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                        className="w-full bg-white border border-slate-100 rounded-xl pl-11 pr-3 py-3 text-[12px] font-bold outline-none shadow-sm cursor-pointer" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-400 font-bold ml-1">Type of Transaction</label>
                                <div className="relative">
                                    <select 
                                        value={filters.type}
                                        onChange={e => setFilters({...filters, type: e.target.value})}
                                        className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-[12px] font-bold outline-none shadow-sm appearance-none cursor-pointer"
                                    >
                                        <option value="All">All</option>
                                        <option value="Online Transfer">Online Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Credit Request">Credit Request</option>
                                        <option value="WALLET_RECHARGE">Recharge</option>
                                        <option value="BUS_BOOKING">Bus Booking</option>
                                        <option value="FLIGHT_BOOKING">Flight Booking</option>
                                        <option value="BUS_REFUND">Bus Refund</option>
                                        <option value="CANCEL_REFUND">Flight Refund</option>
                                        <option value="Offline Charge">Offline Charge</option>
                                        <option value="Offline Refund">Offline Refund</option>
                                    </select>
                                    <IoChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={handleSearch}
                            className="w-full md:w-auto bg-[#F07E21] text-white px-10 py-5 rounded-2xl text-[14px] font-black uppercase shadow-2xl shadow-orange-200 transition-all hover:scale-105 active:scale-95 h-[62px] min-w-[200px] touch-target"
                        >
                            Search
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <p className="text-[11px] font-bold text-slate-500">
                        Charged = Gross(Including Insurance) - Commission + Txn Fees + TDS
                    </p>
                </div>

                {/* 3. Controls Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <select 
                            value={entriesPerPage}
                            onChange={e => setEntriesPerPage(Number(e.target.value))}
                            className="border border-slate-200 rounded px-2 py-1 text-[12px] font-bold outline-none touch-target"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                        </select>
                        <button className="px-4 py-1.5 border border-slate-200 rounded bg-white text-[11px] font-bold text-slate-600 shadow-sm hover:bg-slate-50 uppercase tracking-widest touch-target">Excel</button>
                    </div>
                    
                    <div className="relative w-full sm:w-auto">
                        <input type="text" placeholder="Search" className="border border-slate-200 rounded-xl px-12 py-3 w-full sm:w-[350px] text-[13px] outline-none shadow-sm" />
                        <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    </div>
                </div>

                {/* 4. Table UI */}
                <div className="border border-sky-100 rounded-lg overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1600px]">
                            <thead>
                                <tr className="bg-[#D9EAF7] text-[10px] font-black text-slate-600 uppercase border-b border-sky-200">
                                    <th className="px-4 py-4 text-center border-r border-sky-100 w-[60px]">S No</th>
                                    <th className="px-5 py-4 border-r border-sky-100">Date</th>
                                    <th className="px-5 py-4 border-r border-sky-100">Type</th>
                                    <th className="px-5 py-4 border-r border-sky-100">Reference ID</th>
                                    <th className="px-5 py-4 text-right border-r border-sky-100">Debit</th>
                                    <th className="px-5 py-4 text-right border-r border-sky-100">Credit</th>
                                    <th className="px-5 py-4 text-right border-r border-sky-100">Gross</th>
                                    <th className="px-5 py-4 text-right border-r border-sky-100">Comm</th>
                                    <th className="px-5 py-4 text-right border-r border-sky-100">Txn Fees</th>
                                    <th className="px-5 py-4 text-right border-r border-sky-100">TDS</th>
                                    <th className="px-5 py-4 text-right border-r border-sky-100">PG Fees</th>
                                    <th className="px-5 py-4 text-right border-r border-sky-100 font-black">Balance</th>
                                    <th className="px-5 py-4 text-right border-r border-sky-100">Markup</th>
                                    <th className="px-5 py-4 text-right border-r border-sky-100">Ins</th>
                                    <th className="px-5 py-4">Remark</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="15" className="py-24 text-center font-bold text-slate-300 uppercase tracking-widest animate-pulse">Retrieving historical data...</td></tr>
                                ) : paginatedTransactions.map((t, idx) => (
                                    <tr key={t._id} className="hover:bg-slate-50 transition-all text-[11px] text-slate-700">
                                        <td className="px-4 py-4 text-center font-bold text-slate-400">{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                                        <td className="px-5 py-4 whitespace-nowrap">{new Date(t.createdAt).toLocaleString()}</td>
                                        <td className="px-5 py-4 font-bold uppercase whitespace-nowrap">{formatType(t.transactionType, t.purpose)}</td>
                                        <td className="px-5 py-4 text-slate-500 font-mono tracking-tight select-all">{t.referenceId || t._id.substring(18)}</td>
                                        
                                        <td className="px-5 py-4 text-right font-bold">
                                            {t.transactionType === 'DEBIT' ? <span className="text-rose-500">{Number(t.amount).toLocaleString()}</span> : renderAmount(0)}
                                        </td>
                                        <td className="px-5 py-4 text-right font-bold">
                                            {t.transactionType === 'CREDIT' ? <span className="text-emerald-500 font-black">{Number(t.amount).toLocaleString()}</span> : renderAmount(0)}
                                        </td>

                                        <td className="px-5 py-4 text-right font-bold">{Number(t.gross || 0).toLocaleString()}</td>
                                        <td className="px-5 py-4 text-right">{renderAmount(t.comm)}</td>
                                        <td className="px-5 py-4 text-right font-bold">{Number(t.txnFees || 0).toLocaleString()}</td>
                                        <td className="px-5 py-4 text-right">{renderAmount(t.tds)}</td>
                                        <td className="px-5 py-4 text-right">{renderAmount(t.pgFees)}</td>
                                        
                                        <td className="px-5 py-4 text-right font-black bg-blue-50/20">
                                            {Number(t.balanceAfterTransaction || 0).toLocaleString()}
                                        </td>

                                        <td className="px-5 py-4 text-right">{renderAmount(0)}</td>
                                        <td className="px-5 py-4 text-right">{renderAmount(0)}</td>
                                        <td className="px-5 py-4 text-slate-400 font-bold truncate max-w-[250px]" title={t.remark || t.description}>
                                            {t.remark || t.description || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="py-8 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <p>Showing {filteredTransactions.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} to {Math.min(currentPage * entriesPerPage, filteredTransactions.length)} of {filteredTransactions.length} entries</p>
                    <div className="flex items-center gap-1.5">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="bg-white border border-slate-200 rounded px-4 py-2 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                        >Prev</button>
                        
                        {[...Array(totalPages)].map((_, idx) => (
                            <button
                                key={idx + 1}
                                onClick={() => setCurrentPage(idx + 1)}
                                className={`w-8 h-8 rounded flex items-center justify-center border ${currentPage === idx + 1 ? 'bg-[#F07E21] border-[#F07E21] text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                        
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="bg-white border border-slate-200 rounded px-4 py-2 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                        >Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgencyStatement;
