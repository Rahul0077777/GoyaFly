import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';

const RefundManager = ({ isEmbedded }) => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [globalSettings, setGlobalSettings] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [airlineRefundAmount, setAirlineRefundAmount] = useState('');
    const [adminDeduction, setAdminDeduction] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchRefunds(1);
        fetchGlobalSettings();
    }, [statusFilter]);

    const fetchGlobalSettings = async () => {
        try {
            const res = await adminService.getGlobalSettings();
            if (res.success) setGlobalSettings(res.data);
        } catch (err) {
            console.error('Failed to fetch global settings', err);
        }
    };

    const fetchRefunds = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const res = await adminService.getRefunds(pageNumber, 50, statusFilter);
            if (res.success) {
                if (pageNumber === 1) {
                    setRefunds(res.data);
                } else {
                    setRefunds(prev => [...prev, ...res.data]);
                }
                setPagination(res.pagination);
            }
        } catch (err) {
            console.error('Failed to fetch refunds', err);
            toast.error('Failed to fetch refunds');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (pagination.page < pagination.pages) {
            fetchRefunds(pagination.page + 1);
        }
    };

    const openProcessModal = (booking) => {
        setSelectedBooking(booking);
        setAirlineRefundAmount(booking.totalCost.toString()); // Default to total cost for convenience
        setAdminDeduction(globalSettings?.defaultRefundMarkup?.toString() || '0'); // Prefill Global Refund Markup
        setIsModalOpen(true);
    };

    const handleProcessRefund = async (e, actionType = 'PROCESS') => {
        if (e) e.preventDefault();
        
        const airlineAmt = Number(airlineRefundAmount);
        const adminDed = Number(adminDeduction);
        
        if (actionType === 'PROCESS') {
            if (isNaN(airlineAmt) || isNaN(adminDed)) {
                return toast.error("Please enter valid numeric amounts.");
            }
            if (airlineAmt - adminDed < 0) {
                return toast.error("Final refund amount cannot be negative.");
            }
        }

        try {
            setIsProcessing(true);
            const res = await adminService.processRefund(selectedBooking._id, airlineAmt, adminDed, actionType);
            if (res.success) {
                toast.success(actionType === 'REJECT' ? 'Refund Rejected' : 'Refund processed successfully!');
                setIsModalOpen(false);
                fetchRefunds(1); // Refresh list
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to process refund');
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredRefunds = refunds.filter(b => {
        const term = searchTerm.toLowerCase();
        return (
            b.providerReference?.toLowerCase().includes(term) ||
            b.agentId?.agencyName?.toLowerCase().includes(term) ||
            b.pnr?.toLowerCase().includes(term)
        );
    });

    const getStatusStyle = (status) => {
        if (status === 'PROCESSED') return 'bg-green-100 text-green-700 border-green-200';
        if (status === 'PENDING_AIRLINE') return 'bg-orange-100 text-orange-700 border-orange-200';
        if (status === 'REJECTED') return 'bg-red-100 text-red-700 border-red-200';
        if (status === 'FAILED') return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <div className={`w-full space-y-10 animate-fade-in ${!isEmbedded ? 'pb-20 p-4 md:p-10' : ''}`}>
             {!isEmbedded && (
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1">Refund Requests</h2>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest pl-1">Process agent cancellations & manual refunds</p>
                    </div>
                </div>
             )}

            <div className="bg-white rounded-xl sm:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row gap-6 justify-between items-center bg-gray-50/30">
                    <div className="relative flex-1 w-full max-w-md">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search by PNR or Agent..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm shadow-sm" 
                        />
                    </div>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-6 py-4 bg-white rounded-2xl border-0 font-bold text-sm text-gray-500 shadow-sm focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING_AIRLINE">Pending Airline</option>
                        <option value="PROCESSED">Processed</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="FAILED">Failed</option>
                        <option value="NA">NA / Non-Refundable</option>
                    </select>
                </div>

                {loading ? (
                    <div className="p-20 text-center font-black text-gray-300 italic">Fetching Refunds...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">PNR / AIRLINE</th>
                                    <th className="px-6 py-4">AGENT</th>
                                    <th className="px-6 py-4">REFUND TYPE</th>
                                    <th className="px-6 py-4 text-right">TOTAL COST</th>
                                    <th className="px-6 py-4 text-center">STATUS</th>
                                    <th className="px-6 py-4 text-right">AGENT REFUND</th>
                                    <th className="px-6 py-4 text-center">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredRefunds.map(b => (
                                    <tr key={b._id} className="hover:bg-primary-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="font-black text-gray-900 text-sm md:text-base">{b.pnr || b.providerReference}</p>
                                            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">{b.airline}</p>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-600 text-sm md:text-base">{b.agentId?.agencyName || 'Unknown Agent'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-slate-100 rounded border border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                                                {b.refundType || 'Non-Refundable'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900 text-sm md:text-base">₹{b.totalCost?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-wider ${getStatusStyle(b.refundStatus)}`}>
                                                {b.refundStatus?.replace('_', ' ') || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-green-600 text-sm md:text-base">
                                            {b.refundStatus === 'PROCESSED' ? `₹${b.refundAmount?.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {b.refundStatus !== 'PROCESSED' && b.refundStatus !== 'REJECTED' && (
                                                <button 
                                                    onClick={() => openProcessModal(b)}
                                                    className="px-4 py-2 bg-primary-500 text-white text-[10px] font-black rounded-lg hover:bg-primary-600 transition-colors shadow shadow-primary-200 uppercase tracking-wide"
                                                >
                                                    Process
                                                </button>
                                            )}
                                            {b.refundStatus === 'REJECTED' && (
                                                <span className="text-[10px] font-bold text-red-400 italic">No Refund</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredRefunds.length === 0 && (
                            <div className="p-20 text-center text-gray-400 font-bold italic">No refunds found.</div>
                        )}
                        
                        {pagination.page < pagination.pages && (
                            <div className="p-10 flex justify-center border-t border-gray-50">
                                <button 
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    className="px-10 py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-xs tracking-widest disabled:opacity-50"
                                >
                                    {loading ? 'LOADING...' : 'LOAD MORE'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* PROCESS REFUND MODAL */}
            {isModalOpen && selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-xl font-black text-gray-900">Process Airline Refund</h3>
                            <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">PNR: <span className="text-primary-500">{selectedBooking.pnr}</span></p>
                        </div>
                        
                        <form onSubmit={handleProcessRefund} className="p-8 space-y-6">
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Ticket Cost</p>
                                    <p className="text-lg font-black text-blue-900">₹{selectedBooking.totalCost?.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Refund Type</p>
                                    <p className="text-sm font-bold text-blue-900 mt-1">{selectedBooking.refundType}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest mb-2">Airline Refund Amount (₹)</label>
                                    <input 
                                        type="number"
                                        required
                                        min="0"
                                        value={airlineRefundAmount}
                                        onChange={e => setAirlineRefundAmount(e.target.value)}
                                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl font-black text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="Amount returned by airline"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest mb-2">Admin Deduction / Cancellation Fee (₹)</label>
                                    <input 
                                        type="number"
                                        required
                                        min="0"
                                        value={adminDeduction}
                                        onChange={e => setAdminDeduction(e.target.value)}
                                        className="w-full px-5 py-4 bg-white border border-red-200 focus:border-red-500 rounded-xl font-black text-red-600 focus:ring-2 focus:ring-red-500 outline-none"
                                        placeholder="Markup to deduct"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                                <div>
                                    <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Net Wallet Credit</p>
                                    <p className="text-xs font-bold text-gray-400 leading-tight mt-1">To Agent: {selectedBooking.agentId?.agencyName}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-2xl font-black ${(Number(airlineRefundAmount) - Number(adminDeduction)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ₹{Math.max(0, Number(airlineRefundAmount) - Number(adminDeduction)).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={(e) => handleProcessRefund(e, 'REJECT')}
                                    disabled={isProcessing}
                                    className="flex-1 py-4 px-6 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors uppercase text-xs tracking-wider"
                                >
                                    {isProcessing ? 'Wait...' : 'Reject Refund'}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 px-6 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors uppercase text-xs tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isProcessing || (Number(airlineRefundAmount) - Number(adminDeduction)) < 0}
                                    className="flex-[2] py-4 px-6 rounded-xl font-black text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase text-xs tracking-wider shadow-lg shadow-green-200"
                                >
                                    {isProcessing ? 'Processing...' : 'Confirm Credit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RefundManager;
