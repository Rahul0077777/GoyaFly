import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';

const RescheduleManager = ({ isEmbedded }) => {
    const [reschedules, setReschedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [fareDifference, setFareDifference] = useState('');
    const [airlinePenalty, setAirlinePenalty] = useState('');
    const [adminMarkup, setAdminMarkup] = useState('150'); // default
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchReschedules(1);
    }, [statusFilter]);

    const fetchReschedules = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const res = await adminService.getReschedules(pageNumber, 50, statusFilter);
            if (res.success) {
                if (pageNumber === 1) {
                    setReschedules(res.data);
                } else {
                    setReschedules(prev => [...prev, ...res.data]);
                }
                setPagination(res.pagination);
            }
        } catch (err) {
            console.error('Failed to fetch reschedules', err);
            toast.error('Failed to fetch reschedules');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (pagination.page < pagination.pages) {
            fetchReschedules(pagination.page + 1);
        }
    };

    const openQuoteModal = (request) => {
        setSelectedRequest(request);
        setFareDifference('');
        setAirlinePenalty('');
        setAdminMarkup('150');
        setIsModalOpen(true);
    };

    const handleProvideQuote = async (e) => {
        e.preventDefault();
        
        const fd = Number(fareDifference);
        const ap = Number(airlinePenalty);
        const am = Number(adminMarkup);
        
        if (isNaN(fd) || isNaN(ap) || isNaN(am)) {
            return toast.error("Please enter valid numeric amounts.");
        }

        try {
            setIsProcessing(true);
            const res = await adminService.provideRescheduleQuote(selectedRequest._id, fd, ap, am);
            if (res.success) {
                toast.success('Quotation provided successfully!');
                setIsModalOpen(false);
                fetchReschedules(1);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to provide quote');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleProcessReissue = async (requestId) => {
        if (!window.confirm("Have you manually reissued this ticket in the airline/GDS portal?")) return;
        
        try {
            const res = await adminService.processReschedule(requestId);
            if (res.success) {
                toast.success('Ticket marked as reissued successfully!');
                fetchReschedules(1);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to process reissue');
        }
    };

    const filteredRequests = reschedules.filter(r => {
        const term = searchTerm.toLowerCase();
        return (
            r.bookingId?.providerReference?.toLowerCase().includes(term) ||
            r.bookingId?.pnr?.toLowerCase().includes(term) ||
            r.agentId?.agencyName?.toLowerCase().includes(term)
        );
    });

    const getStatusStyle = (status) => {
        if (status === 'PROCESSED') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (status === 'ACCEPTED') return 'bg-blue-100 text-blue-700 border-blue-200';
        if (status === 'QUOTE_PROVIDED') return 'bg-purple-100 text-purple-700 border-purple-200';
        if (status === 'PENDING_QUOTE') return 'bg-orange-100 text-orange-700 border-orange-200';
        if (status === 'REJECTED') return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <div className={`w-full space-y-10 animate-fade-in ${!isEmbedded ? 'pb-20 p-4 md:p-10' : ''}`}>
             {!isEmbedded && (
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1">Reschedule Quotations</h2>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Manage flight date change requests</p>
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
                        <option value="PENDING_QUOTE">Pending Quote</option>
                        <option value="QUOTE_PROVIDED">Quote Provided</option>
                        <option value="ACCEPTED">Paid & Pending Reissue</option>
                        <option value="PROCESSED">Reissued</option>
                    </select>
                </div>

                {loading ? (
                    <div className="p-20 text-center font-black text-gray-300 italic">Fetching Requests...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">PNR / DATE</th>
                                    <th className="px-6 py-4">AGENT</th>
                                    <th className="px-6 py-4">NEW DATE REQ</th>
                                    <th className="px-6 py-4 text-center">STATUS</th>
                                    <th className="px-6 py-4 text-right">TOTAL QUOTE</th>
                                    <th className="px-6 py-4 text-center">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredRequests.map(r => (
                                    <tr key={r._id} className="hover:bg-primary-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="font-black text-gray-900 text-sm md:text-base">{r.bookingId?.pnr || r.bookingId?.providerReference}</p>
                                            <p className="text-[10px] font-bold text-gray-400">Orig: {new Date(r.bookingId?.travelDate).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-600 text-sm md:text-base">{r.agentId?.agencyName || 'Unknown Agent'}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-black text-[#F07E21]">{r.newTravelDate}</p>
                                            <p className="text-[9px] font-bold text-gray-500 w-32 truncate" title={r.flightDetails}>{r.flightDetails || 'Any Flight'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-wider ${getStatusStyle(r.status)}`}>
                                                {r.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900 text-sm md:text-base">
                                            {r.status !== 'PENDING_QUOTE' ? `₹${r.quoteDetails?.totalAmount?.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {r.status === 'PENDING_QUOTE' && (
                                                <button 
                                                    onClick={() => openQuoteModal(r)}
                                                    className="px-4 py-2 bg-[#1D4171] text-white text-[10px] font-black rounded-lg hover:bg-[#002560] transition-colors shadow uppercase tracking-wide"
                                                >
                                                    Quote
                                                </button>
                                            )}
                                            {r.status === 'ACCEPTED' && (
                                                <button 
                                                    onClick={() => handleProcessReissue(r._id)}
                                                    className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black rounded-lg hover:bg-emerald-600 transition-colors shadow uppercase tracking-wide"
                                                >
                                                    Mark Reissued
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredRequests.length === 0 && (
                            <div className="p-20 text-center text-gray-400 font-bold italic">No reschedule requests found.</div>
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

            {/* QUOTE MODAL */}
            {isModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-gray-100 bg-[#1D4171]">
                            <h3 className="text-xl font-black text-white">Provide Reschedule Quotation</h3>
                            <p className="text-xs font-bold text-blue-200 mt-1 uppercase tracking-wider">PNR: <span className="text-white">{selectedRequest.bookingId?.pnr}</span></p>
                        </div>
                        
                        <form onSubmit={handleProvideQuote} className="p-8 space-y-6">
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Requested Date</p>
                                    <p className="text-sm font-black text-[#F07E21]">{selectedRequest.newTravelDate}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pax Count</p>
                                    <p className="text-sm font-bold text-slate-900 mt-1">{selectedRequest.paxIds?.length || 'All'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest mb-2">Airline Penalty (₹)</label>
                                    <input 
                                        type="number"
                                        required
                                        min="0"
                                        value={airlinePenalty}
                                        onChange={e => setAirlinePenalty(e.target.value)}
                                        className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl font-black text-gray-900 focus:ring-2 focus:ring-[#1D4171] outline-none"
                                        placeholder="Penalty charged by airline"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest mb-2">Fare Difference (₹)</label>
                                    <input 
                                        type="number"
                                        required
                                        min="0"
                                        value={fareDifference}
                                        onChange={e => setFareDifference(e.target.value)}
                                        className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl font-black text-gray-900 focus:ring-2 focus:ring-[#1D4171] outline-none"
                                        placeholder="Difference in ticket price"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase font-black text-[#F07E21] tracking-widest mb-2">Service Markup (₹)</label>
                                    <input 
                                        type="number"
                                        required
                                        min="0"
                                        value={adminMarkup}
                                        onChange={e => setAdminMarkup(e.target.value)}
                                        className="w-full px-5 py-3 bg-orange-50 border border-orange-200 rounded-xl font-black text-orange-700 focus:ring-2 focus:ring-[#F07E21] outline-none"
                                        placeholder="Your admin fee"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                                <div>
                                    <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Total Agent Cost</p>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1">To be deducted if accepted</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-gray-900">
                                        ₹{(Number(airlinePenalty) + Number(fareDifference) + Number(adminMarkup)).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 px-6 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors uppercase text-xs tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isProcessing}
                                    className="flex-[2] py-4 px-6 rounded-xl font-black text-white bg-[#1D4171] hover:bg-[#002560] disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase text-xs tracking-wider shadow-lg"
                                >
                                    {isProcessing ? 'Sending...' : 'Send Quotation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RescheduleManager;
