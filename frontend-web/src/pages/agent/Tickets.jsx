import React, { useState, useEffect } from 'react';
import { agentService } from '../../services/api';
import { toast } from 'react-toastify';

const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTicket, setNewTicket] = useState({ subject: '', priority: 'Medium', message: '' });
    
    // Chat Modal State
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await agentService.getTickets();
            if (res.success) {
                setTickets(res.data);
                // If a ticket is currently open in modal, update its data to reflect new messages
                if (selectedTicket) {
                    const updated = res.data.find(t => (t._id || t.id) === (selectedTicket._id || selectedTicket.id));
                    if (updated) setSelectedTicket(updated);
                }
            } else {
                // Fallback for demo
                setTickets([
                    { id: 'TKT-1002', subject: 'Refund issue for DEL-BOM', status: 'Technical Response', date: '11 Mar', priority: 'High', messages: [{ senderModel: 'Agent', message: 'Refund not received' }] },
                    { id: 'TKT-1001', subject: 'Wallet topup not showing', status: 'Resolved', date: '09 Mar', priority: 'Medium', messages: [{ senderModel: 'Agent', message: 'Topup failed' }, { senderModel: 'Admin', message: 'Resolved now' }] }
                ]);
            }
        } catch (err) {
            console.error('Failed to fetch tickets', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            const res = await agentService.createTicket(newTicket);
            if (res.success) {
                toast.success('Ticket created successfully!');
                setShowCreate(false);
                setNewTicket({ subject: '', priority: 'Medium', message: '' });
                fetchTickets();
            } else {
                toast.error(res.message || 'Failed to create ticket');
            }
        } catch (err) {
            console.error('Create ticket error:', err);
            toast.error(err.response?.data?.message || err.message || 'Failed to create ticket');
        }
    };

    const handleDeleteTicket = async (id) => {
        if (!window.confirm('Are you sure you want to delete this support ticket?')) return;
        try {
            const res = await agentService.deleteTicket(id);
            if (res.success) {
                toast.success('Ticket deleted successfully');
                setTickets(prev => prev.filter(t => (t._id || t.id) !== id));
            } else {
                toast.error(res.message || 'Failed to delete ticket');
            }
        } catch (err) {
            console.error('Delete ticket error:', err);
            toast.error(err.response?.data?.message || err.message || 'Failed to delete ticket');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) return toast.warning('Please enter a message');

        setSendingReply(true);
        try {
            const res = await agentService.addTicketMessage(selectedTicket._id || selectedTicket.id, replyMessage);
            if (res.success) {
                toast.success('Message sent!');
                setReplyMessage('');
                setSelectedTicket(res.data);
                setTickets(prev => prev.map(t => (t._id || t.id) === (selectedTicket._id || selectedTicket.id) ? res.data : t));
            } else {
                toast.error(res.message || 'Failed to send message');
            }
        } catch (err) {
            console.error('Send message error:', err);
            toast.error(err.response?.data?.message || err.message || 'Failed to send message');
        } finally {
            setSendingReply(false);
        }
    };

    const openTickets = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'CLOSED').length;
    const solvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'CLOSED').length;

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 md:space-y-10 animate-fade-in px-3 sm:px-4 md:px-6">
             <div className="flex flex-col xs:flex-row justify-between items-start xs:items-end gap-4 xs:gap-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-1 sm:mb-2">Support Desk</h2>
                    <p className="text-gray-400 font-bold uppercase text-[8px] sm:text-[9px] md:text-[10px] tracking-widest">Active issue tracking & Live Chat</p>
                </div>
                <button 
                    onClick={() => setShowCreate(true)}
                    className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gray-900 text-white font-black rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl hover:bg-secondary-500 transition-all text-xs sm:text-sm md:text-base tracking-widest transform hover:scale-105 active:scale-95"
                >
                    + NEW SUPPORT TICKET
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-8">
                <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl border border-gray-100 card-hover text-center">
                    <p className="text-xl sm:text-2xl md:text-3xl font-black text-primary-500 mb-1">{String(openTickets).padStart(2, '0')}</p>
                    <p className="text-[7px] sm:text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">Open Tickets</p>
                </div>
                <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl border border-gray-100 card-hover text-center">
                    <p className="text-xl sm:text-2xl md:text-3xl font-black text-green-500 mb-1">{solvedTickets}</p>
                    <p className="text-[7px] sm:text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">Solved All Time</p>
                </div>
                <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl border border-gray-100 card-hover text-center">
                    <p className="text-xl sm:text-2xl md:text-3xl font-black text-secondary-500 mb-1">4m</p>
                    <p className="text-[7px] sm:text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">Avg Response</p>
                </div>
            </div>

            <div className="space-y-3 sm:space-y-4 md:space-y-5">
                {loading ? (
                    <div className="p-20 text-center font-black text-gray-300 italic">Syncing with support server...</div>
                ) : tickets.length === 0 ? (
                    <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">No active tickets</div>
                ) : (
                    tickets.map(t => (
                        <div 
                            key={t._id || t.id} 
                            className="bg-white p-5 sm:p-6 md:p-8 lg:p-10 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[3rem] shadow-xl border border-gray-50 flex flex-col md:flex-row justify-between md:items-center gap-4 md:gap-8 group card-hover"
                        >
                            <div className="flex items-center gap-4 sm:gap-6 md:gap-8 flex-1">
                                <div className={`w-1.5 h-12 sm:h-14 md:h-16 rounded-full flex-shrink-0 ${t.priority === 'High' || t.priority === 'URGENT' ? 'bg-red-500' : 'bg-orange-500 animate-pulse'}`}></div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-base sm:text-lg md:text-xl font-black text-gray-900 group-hover:text-primary-500 transition-colors truncate">{t.subject}</h3>
                                    <div className="flex gap-3 sm:gap-4 mt-1 sm:mt-2 flex-wrap items-center">
                                        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">#{t._id || t.id}</span>
                                        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-primary-500 uppercase tracking-widest">Opened: {t.date || new Date(t.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 lg:gap-10 pt-4 md:pt-0 border-t md:border-t-0 w-full md:w-auto md:flex-shrink-0">
                                <button 
                                    onClick={() => handleDeleteTicket(t._id || t.id)}
                                    className="p-2 sm:p-2.5 md:p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg sm:rounded-xl md:rounded-2xl transition-all text-xs sm:text-sm md:text-base flex items-center justify-center shadow-sm"
                                    title="Delete Ticket"
                                >
                                    🗑️
                                </button>
                                <span className={`px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-lg md:rounded-xl text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                                    t.status === 'Resolved' || t.status === 'CLOSED' ? 'bg-green-100 text-green-700' : 'bg-primary-50 text-primary-500'
                                }`}>{t.status}</span>
                                <button className="p-2 sm:p-3 md:p-4 bg-gray-50 rounded-lg sm:rounded-xl md:rounded-2xl group-hover:bg-primary-500 group-hover:text-white transition-all text-base sm:text-lg md:text-xl flex-shrink-0">➔</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Ticket Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 animate-slide-up">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-gray-900">New Support Request</h3>
                            <button onClick={() => setShowCreate(false)} className="w-10 h-10 bg-gray-100 rounded-full font-bold text-gray-400 hover:bg-gray-200 transition-colors">×</button>
                        </div>
                        <form onSubmit={handleCreateTicket} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Subject</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full p-5 bg-gray-50 border-0 rounded-2xl font-bold shadow-inner" 
                                    value={newTicket.subject}
                                    onChange={e => setNewTicket({...newTicket, subject: e.target.value})}
                                    placeholder="Issue summary"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Priority</label>
                                <select 
                                    className="w-full p-5 bg-gray-50 border-0 rounded-2xl font-bold shadow-inner outline-none appearance-none"
                                    value={newTicket.priority}
                                    onChange={e => setNewTicket({...newTicket, priority: e.target.value})}
                                >
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Message</label>
                                <textarea 
                                    required 
                                    className="w-full p-5 bg-gray-50 border-0 rounded-2xl font-bold shadow-inner h-32" 
                                    value={newTicket.message}
                                    onChange={e => setNewTicket({...newTicket, message: e.target.value})}
                                    placeholder="Detailed description of your issue"
                                />
                            </div>
                            <button type="submit" className="w-full py-5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all uppercase tracking-widest text-xs">SUBMIT TICKET</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tickets;
