import React, { useState, useEffect } from 'react';
import { agentService } from '../../services/api';
import { toast } from 'react-toastify';
import supportAgentImg from '../../assets/support_agent_header.png';
import emptyTicketsImg from '../../assets/no_tickets_empty.png';

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
                if (selectedTicket) {
                    const updated = res.data.find(t => (t._id || t.id) === (selectedTicket._id || selectedTicket.id));
                    if (updated) setSelectedTicket(updated);
                }
            } else {
                setTickets([]);
            }
        } catch (err) {
            console.error('Failed to fetch tickets', err);
            setTickets([]);
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
            toast.error('Failed to delete ticket');
        }
    };

    const openTickets = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'CLOSED').length;
    const solvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'CLOSED').length;

    return (
        <div className="w-full max-w-[1100px] mx-auto p-4 sm:p-6 md:p-8 font-sans animate-fade-in pb-16">
            
            {/* Hero Header */}
            <div className="relative w-full bg-[#FAFBFC] rounded-[2rem] p-6 sm:p-10 mb-6 flex flex-col md:flex-row justify-between items-center overflow-hidden border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)]">
                <div className="flex-1 z-10 w-full mb-8 md:mb-0">
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-[72px] h-[72px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.04)] rounded-[1.25rem] flex items-center justify-center shrink-0">
                            <svg className="w-10 h-10 text-[#4B83F3]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 3c-4.97 0-9 4.03-9 9v7c0 1.1.9 2 2 2h3v-8H5v-1c0-3.86 3.14-7 7-7s7 3.14 7 7v1h-3v8h3c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z"/>
                                <rect x="15" y="13" width="6" height="4" rx="1" className="text-[#4B83F3]"/>
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-[32px] sm:text-[42px] font-black text-[#1A202C] leading-none mb-1 tracking-tight">Support Desk</h1>
                            <p className="text-[#8B98A9] font-black text-[10px] sm:text-[11px] uppercase tracking-widest">Active issue tracking & Live Chat</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowCreate(true)}
                        className="bg-[#0B1A42] hover:bg-[#132a68] text-white font-black text-[12px] px-8 py-3.5 rounded-lg uppercase tracking-widest shadow-md transition-all transform active:scale-95 flex items-center gap-2 w-max"
                    >
                        <span className="text-lg leading-none mb-0.5">+</span> NEW SUPPORT TICKET
                    </button>
                </div>

                {/* Illustration Right */}
                <div className="w-full md:w-[400px] z-10 -my-10 md:-my-16 relative flex justify-end">
                    <img src={supportAgentImg} alt="Support Agent" className="w-[320px] md:w-[420px] h-auto object-contain" />
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                {/* Card 1 */}
                <div className="bg-white rounded-3xl p-8 shadow-[0_2px_24px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col items-center relative h-[240px]">
                    <div className="w-14 h-14 rounded-full bg-[#EDF3FF] flex items-center justify-center mb-4 z-10">
                        <svg className="w-6 h-6 text-[#4B83F3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                    </div>
                    <h2 className="text-[48px] font-black text-[#4B83F3] leading-none mb-2 z-10">{String(openTickets).padStart(2, '0')}</h2>
                    <p className="text-[10px] font-black text-[#A0ABC0] uppercase tracking-widest z-10">Open Tickets</p>
                    <div className="absolute bottom-6 left-0 w-full overflow-hidden flex justify-center items-end h-16">
                        <svg viewBox="0 0 400 40" className="w-full h-[40px] opacity-30"><path fill="none" stroke="#4B83F3" strokeWidth="2" strokeDasharray="3,3" d="M0,20 Q50,40 100,20 T200,20 T300,10 T400,20" /><path fill="none" stroke="#4B83F3" strokeWidth="1.5" d="M0,20 Q50,40 100,20 T200,20 T300,10 T400,20" /></svg>
                    </div>
                </div>
                
                {/* Card 2 */}
                <div className="bg-white rounded-3xl p-8 shadow-[0_2px_24px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col items-center relative h-[240px]">
                    <div className="w-14 h-14 rounded-full bg-[#EAF8F1] flex items-center justify-center mb-4 z-10">
                        <svg className="w-7 h-7 text-[#17C671]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-[48px] font-black text-[#17C671] leading-none mb-2 z-10">{solvedTickets}</h2>
                    <p className="text-[10px] font-black text-[#A0ABC0] uppercase tracking-widest z-10">Solved All Time</p>
                    <div className="absolute bottom-6 left-0 w-full overflow-hidden flex justify-center items-end h-16">
                        <svg viewBox="0 0 400 40" className="w-full h-[40px] opacity-30"><path fill="none" stroke="#17C671" strokeWidth="2" strokeDasharray="3,3" d="M0,30 Q80,10 150,20 T250,15 T350,25 T400,30" /><path fill="none" stroke="#17C671" strokeWidth="1.5" d="M0,30 Q80,10 150,20 T250,15 T350,25 T400,30" /></svg>
                    </div>
                </div>
                
                {/* Card 3 */}
                <div className="bg-white rounded-3xl p-8 shadow-[0_2px_24px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col items-center relative h-[240px]">
                    <div className="w-14 h-14 rounded-full bg-[#FFF3E5] flex items-center justify-center mb-4 z-10">
                        <svg className="w-6 h-6 text-[#FF9100]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className="text-[48px] font-black text-[#FF9100] leading-none mb-2 z-10">4m</h2>
                    <p className="text-[10px] font-black text-[#A0ABC0] uppercase tracking-widest z-10">Avg Response Time</p>
                    <div className="absolute bottom-6 left-0 w-full overflow-hidden flex justify-center items-end h-16">
                        <svg viewBox="0 0 400 40" className="w-full h-[40px] opacity-30"><path fill="none" stroke="#FF9100" strokeWidth="2" strokeDasharray="3,3" d="M0,15 Q60,35 120,20 T240,10 T320,25 T400,15" /><path fill="none" stroke="#FF9100" strokeWidth="1.5" d="M0,15 Q60,35 120,20 T240,10 T320,25 T400,15" /></svg>
                    </div>
                </div>
            </div>

            {/* Your Tickets Container */}
            <div className="bg-white rounded-[2rem] shadow-[0_2px_24px_rgba(0,0,0,0.02)] p-6 sm:p-10 mb-8 border border-gray-50">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-[22px] font-black text-[#1A202C]">Your Tickets</h3>
                    <div className="relative">
                        <select className="appearance-none bg-[#F5F8FF] text-[#1A202C] font-bold text-[12px] pl-5 pr-12 py-3 rounded-xl outline-none cursor-pointer border border-[#E2E8F0]">
                            <option>All Status</option>
                            <option>Open</option>
                            <option>Resolved</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#A0ABC0]">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center font-bold text-[#A0ABC0]">Loading tickets...</div>
                ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 pb-12">
                        <img src={emptyTicketsImg} alt="No Active Tickets" className="w-[240px] md:w-[280px] h-auto mb-6 drop-shadow-md" />
                        <h4 className="text-[24px] font-black text-[#1A202C] mb-2">No Active Tickets</h4>
                        <p className="text-[#8B98A9] text-[13px] font-medium mb-8">You don't have any active support tickets.</p>
                        <button 
                            onClick={() => setShowCreate(true)}
                            className="bg-white text-[#4B83F3] border-2 border-[#4B83F3] font-black text-[12px] px-8 py-3.5 rounded-lg uppercase tracking-widest hover:bg-[#F5F8FF] active:scale-95 transition-all shadow-sm"
                        >
                            CREATE NEW TICKET
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tickets.map(t => (
                            <div key={t._id || t.id} className="p-6 border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FAFBFC] hover:bg-white group">
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl shadow-sm ${t.priority === 'High' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                                        #
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black text-gray-900 group-hover:text-blue-500 transition-colors">{t.subject}</h4>
                                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{t.id || t._id} • {t.date || new Date(t.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <span className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest ${t.status === 'Resolved' || t.status === 'CLOSED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                                        {t.status}
                                    </span>
                                    <button onClick={() => handleDeleteTicket(t._id || t.id)} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-colors ml-auto sm:ml-0">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Support Features Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#F8FAFC] p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-[#E5EEFF] flex items-center justify-center text-[#4B83F3] shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div>
                        <h4 className="text-[12px] font-black text-[#1A202C]">Quick Support</h4>
                        <p className="text-[10px] text-[#8B98A9] font-medium mt-0.5">Get fast resolution</p>
                    </div>
                </div>
                <div className="bg-[#F8FAFC] p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-[#E8F8F0] flex items-center justify-center text-[#17C671] shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                    <div>
                        <h4 className="text-[12px] font-black text-[#1A202C]">Live Chat</h4>
                        <p className="text-[10px] text-[#8B98A9] font-medium mt-0.5">Chat with our team</p>
                    </div>
                </div>
                <div className="bg-[#F8FAFC] p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-[#FFF4E5] flex items-center justify-center text-[#FF9100] shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    </div>
                    <div>
                        <h4 className="text-[12px] font-black text-[#1A202C]">24/7 Assistance</h4>
                        <p className="text-[10px] text-[#8B98A9] font-medium mt-0.5">We're here always</p>
                    </div>
                </div>
                <div className="bg-[#F8FAFC] p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-[#F3E8FF] flex items-center justify-center text-[#9D4EDD] shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <div>
                        <h4 className="text-[12px] font-black text-[#1A202C]">Secure & Safe</h4>
                        <p className="text-[10px] text-[#8B98A9] font-medium mt-0.5">Your data is safe</p>
                    </div>
                </div>
            </div>

            {/* Bottom Banner */}
            <div className="bg-[#0B1839] rounded-[2rem] p-8 md:p-10 flex flex-col sm:flex-row justify-between items-center gap-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-center gap-6 z-10">
                    <div className="w-16 h-16 rounded-full border-[3px] border-[#2A3F75] flex items-center justify-center bg-[#13285C] relative shrink-0">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243-2.829a4 4 0 00-5.656 0l-2.829 2.829a9 9 0 000 12.728l2.829-2.829a5 5 0 017.072 0z" /></svg>
                        <div className="absolute top-0 right-0 w-3 h-3 bg-[#17C671] rounded-full border-2 border-[#0B1839]"></div>
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#4B83F3] rounded-full"></div>
                    </div>
                    <div>
                        <h4 className="text-[20px] font-black text-white mb-1">Need immediate help?</h4>
                        <p className="text-[#8B98A9] text-[13px]">Start a live chat with our support team now.</p>
                    </div>
                </div>
                <button className="bg-white text-[#4B83F3] font-black text-[12px] px-8 py-4 rounded-xl uppercase tracking-widest shadow-[0_8px_16px_rgba(255,255,255,0.1)] hover:bg-gray-50 active:scale-95 transition-all shrink-0 z-10">
                    START LIVE CHAT
                </button>
            </div>

            {/* Create Ticket Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 animate-slide-up">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-[#1A202C]">New Support Request</h3>
                            <button onClick={() => setShowCreate(false)} className="w-10 h-10 bg-gray-100 rounded-full font-bold text-gray-400 hover:bg-gray-200 transition-colors">×</button>
                        </div>
                        <form onSubmit={handleCreateTicket} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-[#A0ABC0] uppercase tracking-widest mb-2 ml-2">Subject</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full p-5 bg-[#F8FAFC] border border-gray-100 rounded-2xl font-bold text-[#1A202C] outline-none focus:border-[#4B83F3] focus:ring-2 focus:ring-[#4B83F3]/20 transition-all" 
                                    value={newTicket.subject}
                                    onChange={e => setNewTicket({...newTicket, subject: e.target.value})}
                                    placeholder="Issue summary"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-[#A0ABC0] uppercase tracking-widest mb-2 ml-2">Priority</label>
                                <select 
                                    className="w-full p-5 bg-[#F8FAFC] border border-gray-100 rounded-2xl font-bold text-[#1A202C] outline-none focus:border-[#4B83F3] focus:ring-2 focus:ring-[#4B83F3]/20 transition-all appearance-none"
                                    value={newTicket.priority}
                                    onChange={e => setNewTicket({...newTicket, priority: e.target.value})}
                                >
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-[#A0ABC0] uppercase tracking-widest mb-2 ml-2">Message</label>
                                <textarea 
                                    required 
                                    className="w-full p-5 bg-[#F8FAFC] border border-gray-100 rounded-2xl font-bold text-[#1A202C] outline-none focus:border-[#4B83F3] focus:ring-2 focus:ring-[#4B83F3]/20 transition-all h-32 resize-none" 
                                    value={newTicket.message}
                                    onChange={e => setNewTicket({...newTicket, message: e.target.value})}
                                    placeholder="Detailed description of your issue"
                                />
                            </div>
                            <button type="submit" className="w-full py-5 bg-[#4B83F3] text-white font-black rounded-2xl shadow-lg hover:bg-blue-600 transition-all uppercase tracking-widest text-xs active:scale-95">
                                SUBMIT TICKET
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tickets;Tickets;
