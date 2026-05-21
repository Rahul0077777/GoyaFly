import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';
import { toast } from 'react-toastify';
import { FaCalendarAlt } from 'react-icons/fa';

const ServiceCheckout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { service, item } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [travelDate, setTravelDate] = useState('');
    const [paxCount, setPaxCount] = useState({ adults: 1, children: 0 });
    const [notes, setNotes] = useState('');
    const [paxDetails, setPaxDetails] = useState({
        leadName: '',
        mobile: '',
        email: ''
    });

    useEffect(() => {
        if (!service || !item) {
            navigate('/agent/holidays');
            return;
        }

        // Prefill contact from agent profile if available
        const agentInfo = JSON.parse(localStorage.getItem('agentInfo') || '{}');
        setPaxDetails(prev => ({
            ...prev,
            mobile: agentInfo.mobileNumber || '',
            email: agentInfo.emailAddress || ''
        }));
    }, [service, item, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await bookingService.createServiceRequest({
                serviceType: service,
                item,
                travelDate,
                paxCount,
                paxDetails,
                notes
            });

            if (res.success) {
                toast.success(res.message);
                navigate('/agent/history', { 
                    state: { 
                        success: true, 
                        message: 'Holiday request submitted! Our team will contact you for confirmation.' 
                    } 
                });
            }
        } catch (err) {
            toast.error('Failed to submit request: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (!service || !item) return null;

    return (
        <div className="flex-1 bg-[#f8fafc] min-h-[calc(100vh-64px)] pb-12 animate-fade-in">
            {/* Header */}
            <div className="bg-[#1D4171] w-full pt-8 sm:pt-10 pb-32 sm:pb-40 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="bg-[#48A0D4]/20 text-[#48A0D4] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-[#48A0D4]/30">
                            {service} BOOKING
                        </span>
                    </div>
                    <h1 className="text-white text-3xl sm:text-4xl font-black italic tracking-tight mb-2">Complete your <span className="text-[#48A0D4]">Request</span></h1>
                    <p className="text-slate-200 text-xs sm:text-sm font-bold opacity-80 uppercase tracking-widest">A customized expert will process your application shortly</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-24 relative z-10">
                <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
                    
                    {/* Package Review Card */}
                    <div className="w-full lg:w-[40%] space-y-6 lg:sticky top-6">
                        <div className="bg-white rounded-3xl sm:rounded-[3rem] shadow-2xl border border-slate-200/50 overflow-hidden transform transition-all duration-500 hover:shadow-[#1D4171]/10">
                            <div className="bg-[#1D4171] p-6 sm:p-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#48A0D4]/10 rounded-full -mr-16 -mt-16"></div>
                                <h2 className="text-white font-black text-xl sm:text-2xl mb-2 flex items-center justify-between relative z-10">
                                    {item.title || item.country}
                                </h2>
                                <p className="text-[#48A0D4] text-xs sm:text-sm font-black uppercase tracking-widest relative z-10">
                                    {item.days || 'Service Plan'} • {item.type || 'Luxury'}
                                </p>
                            </div>

                            <div className="p-6 sm:p-10 space-y-6 sm:space-y-8">
                                <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Cost</p>
                                        <p className="text-3xl font-black text-slate-900 leading-none">
                                            ₹{((item.price || 0) * (paxCount.adults || 1)).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Margin</p>
                                        <p className="text-sm font-black text-emerald-600">~15% Agent</p>
                                    </div>
                                </div>

                                {item.highlights && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trip Highlights:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {item.highlights.map(h => (
                                                <span key={h} className="text-[10px] font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                                                    ✨ {h}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {item.description && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Package Description / Itinerary:</p>
                                        <div 
                                            className="text-sm text-slate-600 prose prose-sm max-w-none prose-p:leading-relaxed prose-a:text-primary-500"
                                            dangerouslySetInnerHTML={{ __html: item.description }}
                                        />
                                    </div>
                                )}

                                <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
                                    <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                        ℹ️ Request Information
                                    </p>
                                    <p className="text-xs font-bold text-amber-600 leading-relaxed">
                                        This is a booking request. No funds will be deducted from your wallet until our operators confirm the availability and final pricing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Form */}
                    <div className="w-full lg:w-[60%]">
                        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                            <div className="bg-white rounded-3xl sm:rounded-[3rem] shadow-xl border border-slate-200/50 p-6 sm:p-10 animate-slide-up">
                                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-6 sm:mb-10 flex items-center gap-4">
                                    <span className="w-1.5 h-6 bg-[#1D4171] rounded-full"></span>
                                    Plan Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Travel Date *</label>
                                        <div className="relative">
                                            <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-[#48A0D4] pointer-events-none" />
                                            <input 
                                                type="date" 
                                                required 
                                                value={travelDate}
                                                onChange={(e) => setTravelDate(e.target.value)}
                                                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                                className="w-full pl-11 pr-3 border-2 border-slate-100 rounded-2xl h-[60px] text-sm font-black text-slate-800 focus:border-[#1D4171] focus:ring-4 focus:ring-[#1D4171]/10 outline-none transition-all cursor-pointer bg-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Adults</label>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                value={paxCount.adults}
                                                onChange={(e) => setPaxCount({...paxCount, adults: parseInt(e.target.value)})}
                                                className="w-full border-2 border-slate-100 rounded-2xl px-6 h-[60px] text-sm font-black text-slate-800 focus:border-primary-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Children</label>
                                            <input 
                                                type="number" 
                                                min="0"
                                                value={paxCount.children}
                                                onChange={(e) => setPaxCount({...paxCount, children: parseInt(e.target.value)})}
                                                className="w-full border-2 border-slate-100 rounded-2xl px-6 h-[60px] text-sm font-black text-slate-800 focus:border-primary-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl sm:rounded-[3rem] shadow-xl border border-slate-200/50 p-6 sm:p-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-6 sm:mb-10 flex items-center gap-4">
                                    <span className="w-1.5 h-6 bg-[#F07E21] rounded-full"></span>
                                    Lead Passenger & Contact
                                </h3>

                                <div className="space-y-8">
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Passenger Name *</label>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="FULL NAME AS PER PASSPORT"
                                            value={paxDetails.leadName}
                                            onChange={(e) => setPaxDetails({...paxDetails, leadName: e.target.value})}
                                            className="w-full border-2 border-slate-100 rounded-2xl px-6 h-[60px] text-sm font-black text-slate-800 focus:border-primary-500 outline-none transition-all placeholder:text-slate-200 uppercase"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Email Address *</label>
                                            <input 
                                                type="email" 
                                                required 
                                                value={paxDetails.email}
                                                onChange={(e) => setPaxDetails({...paxDetails, email: e.target.value})}
                                                className="w-full border-2 border-slate-100 rounded-2xl px-6 h-[60px] text-sm font-black text-slate-800 focus:border-primary-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Mobile Number *</label>
                                            <input 
                                                type="tel" 
                                                required 
                                                value={paxDetails.mobile}
                                                onChange={(e) => setPaxDetails({...paxDetails, mobile: e.target.value})}
                                                className="w-full border-2 border-slate-100 rounded-2xl px-6 h-[60px] text-sm font-black text-slate-800 focus:border-primary-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Special Requests / Notes</label>
                                        <textarea 
                                            rows="4"
                                            placeholder="Add any specific requirements or questions..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full border-2 border-slate-100 rounded-[2rem] p-6 text-sm font-black text-slate-800 focus:border-primary-500 outline-none transition-all placeholder:text-slate-200"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-[#F07E21] text-white font-black py-4 sm:py-6 rounded-2xl sm:rounded-[2rem] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[13px] sm:text-[15px] shadow-2xl hover:bg-[#d66e1b] hover:-translate-y-2 transition-all active:scale-95 flex items-center justify-center gap-4"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        SUBMITTING...
                                    </>
                                ) : (
                                    'CONFIRM BOOKING REQUEST →'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceCheckout;
