import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';

const SupportTicketManager = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [replyStatus, setReplyStatus] = useState('PENDING_AGENT');
    const [submitting, setSubmitting] = useState(false);
    const [filterPriority, setFilterPriority] = useState('ALL');

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await adminService.getTickets();
            if (res.success) {
                setTickets(res.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch admin tickets', err);
            toast.error('Failed to load support tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) return toast.warning('Please enter a reply message');

        setSubmitting(true);
        try {
            const res = await adminService.replyTicket(selectedTicket._id, replyMessage, replyStatus);
            if (res.success) {
                toast.success('Reply sent successfully!');
                setReplyMessage('');
                // Update local state
                setTickets(prev => prev.map(t => t._id === selectedTicket._id ? res.data : t));
                setSelectedTicket(res.data);
            }
        } catch (err) {
            console.error('Reply failed', err);
            toast.error('Failed to send reply');
        } finally {
            setSubmitting(false);
        }
    };

    const getPriorityBadge = (priority) => {
        switch ((priority || '').toUpperCase()) {
            case 'URGENT':
            case 'HIGH':
                return <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">🚨 {priority}</span>;
            case 'MEDIUM':
                return <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-black uppercase tracking-widest">⚠️ {priority}</span>;
            default:
                return <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-black uppercase tracking-widest">ℹ️ {priority || 'LOW'}</span>;
        }
    };

    const getStatusBadge = (status) => {
        switch ((status || '').toUpperCase()) {
            case 'RESOLVED':
                return <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-[10px] font-black uppercase tracking-widest">✅ Resolved</span>;
            case 'PENDING_ADMIN':
                return <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-black uppercase tracking-widest">⏳ Awaiting Admin Reply</span>;
            default:
                return <span className="px-3 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest">💬 Awaiting Agent Reply</span>;
        }
    };

    const filteredTickets = tickets.filter(t => filterPriority === 'ALL' || (t.priority || '').toUpperCase() === filterPriority);

    return (
        <div className="w-full space-y-6">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <h3 className="font-black text-[#1D4171] text-sm sm:text-base uppercase tracking-wider">Filter Priority:</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                        <button
                            key={p}
                            onClick={() => setFilterPriority(p)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                filterPriority === p
                                ? 'bg-[#1D4171] text-white shadow-md shadow-blue-900/20'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Tickets List */}
                <div className={`${selectedTicket ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-4 transition-all duration-300 w-full`}>
                    {loading ? (
                        <div className="bg-white p-12 rounded-3xl text-center font-bold text-slate-400 border border-slate-100 shadow-sm animate-pulse">
                            Loading support tickets...
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl text-center font-bold text-slate-400 border border-slate-100 shadow-sm">
                            No support tickets found matching your criteria.
                        </div>
                    ) : (
                        filteredTickets.map(tx => (
                            <div 
                                key={tx._id}
                                onClick={() => setSelectedTicket(tx)}
                                className={`p-5 rounded-2xl border transition-all cursor-pointer group hover-lift ${
                                    selectedTicket?._id === tx._id 
                                    ? 'bg-gradient-to-br from-[#1D4171] to-[#295896] text-white border-transparent shadow-xl shadow-blue-900/20' 
                                    : 'bg-white text-slate-800 border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-md'
                                }`}
                            >
                                <div className="flex justify-between items-start gap-2 mb-3">
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-xs font-black uppercase tracking-widest truncate ${selectedTicket?._id === tx._id ? 'text-primary-200' : 'text-slate-400'}`}>
                                            {tx.agentId?.agencyName || tx.agentId?.agentName || 'Travel Partner'}
                                        </p>
                                        <h4 className="font-extrabold text-base truncate mt-0.5">{tx.subject}</h4>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        {getPriorityBadge(tx.priority)}
                                        {getStatusBadge(tx.status)}
                                    </div>
                                </div>

                                {/* Urgent Contact Details Highlight */}
                                <div className={`p-3 rounded-xl mb-3 text-xs font-bold space-y-1 border ${
                                    selectedTicket?._id === tx._id 
                                    ? 'bg-white/10 border-white/20 text-white' 
                                    : 'bg-amber-50/80 border-amber-200/60 text-amber-900'
                                }`}>
                                    <div className="flex items-center gap-2 truncate">
                                        <span>📞</span>
                                        <span className="font-black select-all">{tx.agentId?.mobileNumber || 'N/A'}</span>
                                        <a 
                                            href={`tel:${tx.agentId?.mobileNumber}`} 
                                            onClick={(e) => e.stopPropagation()}
                                            className="ml-auto px-2 py-0.5 bg-green-600 text-white rounded text-[9px] font-black uppercase tracking-widest hover:bg-green-700 transition-colors shadow-sm"
                                        >
                                            Call
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2 truncate">
                                        <span>✉️</span>
                                        <span className="font-black select-all truncate">{tx.agentId?.emailAddress || 'N/A'}</span>
                                        <a 
                                            href={`mailto:${tx.agentId?.emailAddress}?subject=RE: ${tx.subject}`} 
                                            onClick={(e) => e.stopPropagation()}
                                            className="ml-auto px-2 py-0.5 bg-blue-600 text-white rounded text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            Email
                                        </a>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-[10px] font-bold opacity-75 pt-2 border-t border-current/10">
                                    <span>Cat: {tx.category}</span>
                                    <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Ticket Details & Reply Thread */}
                {selectedTicket && (
                    <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xl flex flex-col justify-between h-[calc(100vh-180px)] sticky top-28 animate-slide-left">
                        {/* Header */}
                        <div className="border-b border-slate-100 pb-6">
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black text-[#1D4171]">{selectedTicket.subject}</h3>
                                    <p className="text-xs font-bold text-slate-500 mt-1">
                                        Ticket #{selectedTicket._id} • Category: <span className="text-primary-600">{selectedTicket.category}</span>
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setSelectedTicket(null)}
                                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-black transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Contact Box */}
                            <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 rounded-r-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Agent Contact Info</p>
                                    <p className="text-sm font-extrabold text-slate-800">{selectedTicket.agentId?.agencyName || selectedTicket.agentId?.agentName}</p>
                                    <p className="text-xs font-bold text-slate-600">Ph: <span className="font-black text-slate-900 select-all">{selectedTicket.agentId?.mobileNumber}</span> | Email: <span className="font-black text-slate-900 select-all">{selectedTicket.agentId?.emailAddress}</span></p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <a 
                                        href={`tel:${selectedTicket.agentId?.mobileNumber}`}
                                        className="flex-1 sm:flex-initial px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>📞</span> Call Agent
                                    </a>
                                    <a 
                                        href={`mailto:${selectedTicket.agentId?.emailAddress}?subject=RE: ${selectedTicket.subject}`}
                                        className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>✉️</span> Email Agent
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Messages Thread */}
                        <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-2 scroll-thin">
                            {selectedTicket.messages?.map((m, idx) => (
                                <div 
                                    key={idx} 
                                    className={`flex flex-col ${m.senderModel === 'Admin' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {m.senderModel === 'Admin' ? 'Goyafly Support (You)' : selectedTicket.agentId?.agentName || 'Agent'}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400">
                                            {new Date(m.timestamp || selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={`p-4 rounded-2xl max-w-[85%] text-sm font-medium shadow-sm ${
                                        m.senderModel === 'Admin'
                                        ? 'bg-[#1D4171] text-white rounded-tr-none'
                                        : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60'
                                    }`}>
                                        <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Form */}
                        <form onSubmit={handleReply} className="border-t border-slate-100 pt-6 space-y-4">
                            <div className="flex gap-4 items-center justify-between">
                                <label className="text-xs font-black uppercase tracking-widest text-[#1D4171]">Update Status:</label>
                                <select 
                                    value={replyStatus} 
                                    onChange={(e) => setReplyStatus(e.target.value)}
                                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 focus:outline-none focus:border-[#1D4171]"
                                >
                                    <option value="PENDING_AGENT">Pending Agent Reply</option>
                                    <option value="RESOLVED">Mark as Resolved</option>
                                    <option value="PENDING_ADMIN">Keep Pending Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Type your official response here... (Agent will be notified instantly)"
                                    rows="3"
                                    className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#1D4171] focus:bg-white transition-all resize-none shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 bg-gradient-to-br from-[#F07E21] to-[#FF9F43] hover:from-[#d96b18] hover:to-[#e0862e] text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 flex-shrink-0 text-xs sm:text-sm uppercase tracking-widest"
                                >
                                    {submitting ? 'Sending...' : 'Reply'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportTicketManager;
