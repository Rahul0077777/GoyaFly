import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { bookingService } from '../../services/api';
import { toast } from 'react-toastify';

const ManageBooking = () => {
    // =============================================
    // STATE
    // =============================================
    const [activeTab, setActiveTab] = useState('status');     // status | cancel | reschedule
    const [refID, setRefID] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Cancel form
    const [cancelForm, setCancelForm] = useState({ paxId: '', paxIdr: '', canMode: 5, canRemarks: '' });

    // Reschedule form
    const [rescheduleForm, setRescheduleForm] = useState({
        paxId: '', paxIdr: '', travelDate: '', flightDetail: 'Onward Same Flight',
        travelDater: '', flightDetailr: '', reissueRemarks: ''
    });

    // Fare rules
    const [fareRules, setFareRules] = useState(null);

    // =============================================
    // HANDLERS
    // =============================================

    const fillPaxId = (id) => {
        if (!id) return;
        setCancelForm(prev => ({ ...prev, paxId: String(id) }));
        setRescheduleForm(prev => ({ ...prev, paxId: String(id) }));
        setSuccessMsg(`✅ PaxID ${id} copied to cancellation/reschedule form!`);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const resetState = () => {
        setResult(null);
        setError('');
        setSuccessMsg('');
        setFareRules(null);
    };

    // 1. CHECK BOOKING STATUS
    const handleCheckStatus = useCallback(async () => {
        if (!refID.trim()) { setError('Please enter a Booking Reference (refID)'); return; }
        resetState();
        setLoading(true);
        try {
            const res = await bookingService.ftdGetBookingStatus(refID.trim());
            if (res.success) {
                setResult(res.data);
            } else {
                setError(res.message || 'Failed to fetch booking status.');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch booking status.');
        } finally {
            setLoading(false);
        }
    }, [refID]);

    // 2. CANCEL BOOKING
    const handleCancelBooking = useCallback(async () => {
        if (!refID.trim()) { setError('Please enter a Booking Reference (refID)'); return; }
        if (!cancelForm.paxId.trim()) { setError('Passenger ID (paxId) is required for cancellation.'); return; }
        resetState();
        setLoading(true);
        try {
            const res = await bookingService.ftdCancelFlight({
                refID: refID.trim(),
                paxId: cancelForm.paxId,
                paxIdr: cancelForm.paxIdr,
                canMode: cancelForm.canMode,
                canRemarks: cancelForm.canRemarks || 'Agent requested cancel'
            });
            if (res.success) {
                setResult(res.data);
                setSuccessMsg('✅ Cancellation request submitted successfully!');
            } else {
                setError(res.message || 'Cancellation failed.');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Cancellation failed.');
        } finally {
            setLoading(false);
        }
    }, [refID, cancelForm]);

    // 3. RESCHEDULE BOOKING
    const handleReschedule = useCallback(async () => {
        if (!refID.trim()) { setError('Please enter a Booking Reference (refID)'); return; }
        if (!rescheduleForm.paxId.trim()) { setError('Passenger ID (paxId) is required.'); return; }
        if (!rescheduleForm.travelDate) { setError('New travel date is required.'); return; }
        resetState();
        setLoading(true);
        try {
            // Format date to DD-MM-YYYY as FTD expects
            const d = new Date(rescheduleForm.travelDate);
            const formattedDate = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;

            const res = await bookingService.ftdReschedule({
                refID: refID.trim(),
                paxId: rescheduleForm.paxId,
                paxIdr: rescheduleForm.paxIdr,
                travelDate: formattedDate,
                flightDetail: rescheduleForm.flightDetail || 'Onward Same Flight',
                travelDater: rescheduleForm.travelDater,
                flightDetailr: rescheduleForm.flightDetailr,
                reissueRemarks: rescheduleForm.reissueRemarks || 'Date change request'
            });
            if (res.success) {
                setResult(res.data);
                setSuccessMsg('✅ Reschedule quote request submitted!');
            } else {
                setError(res.message || 'Reschedule failed.');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Reschedule failed.');
        } finally {
            setLoading(false);
        }
    }, [refID, rescheduleForm]);

    // 4. FARE RULES
    const handleFareRules = useCallback(async () => {
        if (!result?.localBooking && !result?.ftdStatus) {
            setError('Please check booking status first to get flightID.');
            return;
        }
        setFareRules(null);
        setLoading(true);
        try {
            const flightID = result?.localBooking?.providerReference || '';
            const res = await bookingService.ftdGetFareRules(flightID);
            if (res.success) setFareRules(res.data);
        } catch (err) {
            console.error('Fare rules error:', err);
        } finally {
            setLoading(false);
        }
    }, [result]);

    const handleDownloadTicket = async () => {
        if (!result?.localBooking) return;
        try {
            setLoading(true);
            const agentToken = localStorage.getItem('agentToken');
            const ref = result.localBooking.ftdBookingRef || result.localBooking.providerReference || result.localBooking.pnr;
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/booking/flights/download-ticket/${ref}`, {
                headers: { Authorization: `Bearer ${agentToken}` }
            });
            if (res.data.success) {
                const url = res.data.url.startsWith('http') ? res.data.url : `${import.meta.env.VITE_API_URL}${res.data.url}`;
                window.open(url, '_blank');
            }
        } catch (err) {
            toast.error('Failed to download ticket: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadInvoice = async () => {
        if (!result?.localBooking) return;
        try {
            setLoading(true);
            const agentToken = localStorage.getItem('agentToken');
            const ref = result.localBooking.ftdBookingRef || result.localBooking.providerReference || result.localBooking.pnr;
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/booking/flights/download-invoice/${ref}`, {
                headers: { Authorization: `Bearer ${agentToken}` }
            });
            if (res.data.success) {
                const url = res.data.url.startsWith('http') ? res.data.url : `${import.meta.env.VITE_API_URL}${res.data.url}`;
                window.open(url, '_blank');
            }
        } catch (err) {
            toast.error('Failed to download invoice: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // =============================================
    // TAB CONFIG
    // =============================================
    const tabs = [
        { key: 'status', label: 'Check Status', icon: '🔍', color: 'from-blue-500 to-indigo-600' },
        { key: 'cancel', label: 'Cancel / Refund', icon: '❌', color: 'from-red-500 to-rose-600' },
        { key: 'reschedule', label: 'Reschedule', icon: '🔄', color: 'from-amber-500 to-orange-600' },
    ];


    // =============================================
    // STATUS BADGE
    // =============================================
    const getStatusBadge = (status) => {
        const st = (status || '').toUpperCase();
        const styles = {
            'CONFIRMED': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'SUCCESS': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'PENDING': 'bg-amber-100 text-amber-700 border-amber-200',
            'CANCELLED': 'bg-red-100 text-red-700 border-red-200',
            'REJECTED': 'bg-red-100 text-red-700 border-red-200',
            'FAILED': 'bg-gray-100 text-gray-700 border-gray-200',
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase border ${styles[st] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                <span className={`w-2 h-2 rounded-full ${st === 'CONFIRMED' || st === 'SUCCESS' ? 'bg-emerald-500 animate-pulse' : st === 'PENDING' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`}></span>
                {status || 'UNKNOWN'}
            </span>
        );
    };


    // =============================================
    // RENDER
    // =============================================
    return (
        <div className="w-full max-w-5xl mx-auto py-4 sm:py-6 md:py-8 lg:py-10 px-3 sm:px-4 md:px-6">
            {/* Page Header */}
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3 text-gray-900 tracking-tight">
                <div className="w-auto h-auto p-2 sm:p-2.5 md:p-3 bg-primary-500/10 text-primary-500 rounded-lg sm:rounded-xl md:rounded-2xl text-base sm:text-lg md:text-2xl lg:text-3xl flex-shrink-0">📋</div>
                <span>Manage Booking</span>
            </h2>

            {/* Tab Bar */}
            <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-2 scroll-thin">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => { setActiveTab(tab.key); resetState(); }}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-300 border ${
                            activeTab === tab.key
                                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg border-transparent scale-[1.02]`
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-md hover:scale-[1.01]'
                        }`}
                    >
                        <span className="text-lg">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Reference ID Input (shared) */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-5 sm:p-6 md:p-8 mb-6">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Booking Reference (refID / PNR)</label>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={refID}
                        onChange={(e) => setRefID(e.target.value.toUpperCase())}
                        placeholder="e.g. FTD48QYATRPQ868"
                        className="flex-1 px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none text-sm sm:text-base font-bold text-gray-800 placeholder-gray-300 transition-all duration-300 w-full"
                    />
                    {activeTab === 'status' && (
                        <button
                            onClick={handleCheckStatus}
                            disabled={loading}
                            className="px-5 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl sm:rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 whitespace-nowrap w-full sm:w-auto touch-target"
                        >
                            {loading ? '⏳ Checking...' : '🔍 Check Status'}
                        </button>
                    )}
                </div>
            </div>

            {/* Error / Success Messages */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-slide-up">
                    <span className="text-xl flex-shrink-0">⚠️</span>
                    <div>
                        <p className="font-bold text-red-800 text-sm">{error}</p>
                    </div>
                    <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600 font-bold">✕</button>
                </div>
            )}
            {successMsg && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3 animate-slide-up">
                    <span className="text-xl flex-shrink-0">✅</span>
                    <p className="font-bold text-green-800 text-sm">{successMsg}</p>
                    <button onClick={() => setSuccessMsg('')} className="ml-auto text-green-400 hover:text-green-600 font-bold">✕</button>
                </div>
            )}


            {/* ============================================= */}
            {/* TAB: CHECK STATUS */}
            {/* ============================================= */}
            {activeTab === 'status' && result && (
                <div className="bg-white rounded-2xl sm:rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden animate-slide-up w-full max-w-lg mx-auto">
                    {/* Ticket Header */}
                    <div className="bg-[#0D4771] p-4 sm:p-6 md:p-8 pb-8 sm:pb-10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <span className="text-white text-lg sm:text-xl font-bold">{result.localBooking?.from || 'Source'}</span>
                                <span className="text-primary-300 text-lg">✈️</span>
                                <span className="text-white text-lg sm:text-xl font-bold">{result.localBooking?.to || 'Destination'}</span>
                            </div>
                            <button 
                                onClick={handleDownloadTicket}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-white/30 rounded-xl text-white text-xs font-bold hover:bg-white/10 transition-colors w-full sm:w-auto"
                            >
                                <span className="text-sm">🎫</span> View Ticket
                            </button>
                        </div>
                        <p className="text-primary-100/60 text-[10px] sm:text-xs font-medium tracking-wide">
                            {result.localBooking?.createdAt ? new Date(result.localBooking.createdAt).toLocaleString('en-IN') : '--'}
                        </p>
                    </div>

                    {/* Ticket Body */}
                    <div className="p-5 sm:p-8 bg-[#F0F7FB] -mt-6 sm:-mt-8 rounded-t-[24px] sm:rounded-t-[32px] space-y-6 sm:space-y-8">
                        {/* Travel Information Section */}
                        <section>
                            <h4 className="text-[#0D4771] text-sm sm:text-base font-extrabold mb-4 uppercase tracking-tight">Travel Information</h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Passengers</p>
                                    <div className="space-y-2">
                                        {result.localBooking?.passengerDetails?.map((pax, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-[#0D4771]/5">
                                                <div>
                                                    <p className="text-xs sm:text-sm font-black text-gray-800 uppercase">{pax.fName} {pax.lName}</p>
                                                    {pax.ticketNo && <p className="text-[10px] text-primary-500 font-bold tracking-tight mt-0.5 whitespace-nowrap">Tkt: {pax.ticketNo}</p>}
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-2">PAX {idx + 1}</span>
                                            </div>
                                        )) || <p className="text-xs font-black text-gray-800">NO PASSENGERS</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                                    <div className="bg-white/40 p-3 rounded-xl border border-[#0D4771]/5">
                                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Airline</p>
                                        <p className="text-xs font-black text-gray-800 truncate">{result.localBooking?.airline || 'Airline'}</p>
                                        <p className="text-[10px] text-primary-500 font-medium italic mt-0.5 truncate">Instant Offers,</p>
                                    </div>
                                    <div className="bg-white/40 p-3 rounded-xl border border-[#0D4771]/5">
                                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">PNR</p>
                                        <p className="text-xs font-black text-emerald-500 uppercase tracking-tighter">{result.localBooking?.pnr || 'VKQF9R'}</p>
                                    </div>
                                    <div className="bg-white/40 p-3 rounded-xl border border-[#0D4771]/5 col-span-2 sm:col-span-1">
                                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Travel Date</p>
                                        <p className="text-xs font-black text-gray-800">
                                            {result.localBooking?.travelDate ? new Date(result.localBooking.travelDate).toLocaleDateString('en-IN') : '--'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Status and Action Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                            <section className="space-y-3">
                                <h4 className="text-[#0D4771] text-sm sm:text-base font-extrabold mb-1">Current Status</h4>
                                <div className="w-full sm:w-fit px-6 py-2 bg-emerald-100/80 border border-emerald-200 rounded-lg text-emerald-600 text-xs font-bold text-center">
                                    {result.currentStatus || 'Success'}
                                </div>
                                <button 
                                    onClick={handleDownloadInvoice}
                                    className="w-full sm:w-fit flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-[#0D4771]/30 rounded-lg text-[#0D4771] text-xs font-bold hover:bg-white transition-all shadow-sm"
                                >
                                    <span>🧾</span> Download Invoice
                                </button>
                            </section>

                            <section className="space-y-3">
                                <h4 className="text-[#0D4771] text-sm sm:text-base font-extrabold mb-1">Available Actions</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                                    <button 
                                        onClick={() => setActiveTab('cancel')}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-500 rounded-lg text-red-500 text-xs font-bold hover:bg-red-50 transition-colors"
                                    >
                                        <span>✕</span> Cancel
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('reschedule')}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-primary-400 rounded-lg text-primary-500 text-xs font-bold hover:bg-primary-50 transition-colors"
                                    >
                                        <span>🔄</span> Reissue
                                    </button>
                                </div>
                            </section>
                        </div>

                        {/* Amount Section */}
                        <section className="pt-2">
                            <h4 className="text-[#0D4771] text-sm sm:text-base font-extrabold mb-3">Financial Details</h4>
                            <div className="space-y-2 p-4 sm:p-5 bg-white/60 rounded-2xl border border-[#0D4771]/5 shadow-inner">
                                <div className="flex justify-between items-center text-xs sm:text-sm font-medium text-gray-500">
                                    <span>Total Paid by Client</span>
                                    <span>₹{(result.localBooking?.totalCost || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs sm:text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                    <span>Your Commission</span>
                                    <span>₹{((result.localBooking?.totalCost || 0) - (result.localBooking?.netfare || 0)).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-sm sm:text-base font-black text-gray-800">
                                    <span>Net Wallet Deduction</span>
                                    <span className="text-primary-600">₹{(result.localBooking?.netfare || 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            )}


            {/* TAB: CANCEL / REFUND */}
            {/* ============================================= */}
            {activeTab === 'cancel' && (
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 md:p-10 animate-slide-up w-full max-w-2xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">❌</span>
                        <div>
                            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">Cancel Flight</h3>
                            <p className="text-xs text-gray-400">Submit a cancellation request to the airline</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Passenger ID (paxId) *</label>
                            <input
                                type="text"
                                value={cancelForm.paxId}
                                onChange={(e) => setCancelForm({ ...cancelForm, paxId: e.target.value })}
                                placeholder="e.g. 691182"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 focus:ring-4 focus:ring-red-50 outline-none text-sm font-bold transition-all"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Get this from the booking status response</p>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Return Passenger ID (paxIdr)</label>
                            <input
                                type="text"
                                value={cancelForm.paxIdr}
                                onChange={(e) => setCancelForm({ ...cancelForm, paxIdr: e.target.value })}
                                placeholder="Leave empty for one-way"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 focus:ring-4 focus:ring-red-50 outline-none text-sm font-bold transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Cancel Mode</label>
                            <select
                                value={cancelForm.canMode}
                                onChange={(e) => setCancelForm({ ...cancelForm, canMode: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 focus:ring-4 focus:ring-red-50 outline-none text-sm font-bold transition-all bg-white"
                            >
                                <option value={5}>Full Cancellation</option>
                                <option value={1}>Partial Cancellation</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Cancellation Remarks</label>
                            <textarea
                                value={cancelForm.canRemarks}
                                onChange={(e) => setCancelForm({ ...cancelForm, canRemarks: e.target.value })}
                                placeholder="Reason for cancellation..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 focus:ring-4 focus:ring-red-50 outline-none text-sm font-bold transition-all resize-none"
                            />
                        </div>

                        <button
                            onClick={handleCancelBooking}
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            {loading ? '⏳ Submitting...' : '🚫 Submit Cancellation Request'}
                        </button>
                    </div>

                    {/* Cancel Result */}
                    {result && (
                        <div className="mt-6 bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Cancellation Response</h4>
                            <pre className="text-xs sm:text-sm text-gray-700 font-mono whitespace-pre-wrap break-all overflow-x-auto">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}


            {/* TAB: RESCHEDULE */}
            {/* ============================================= */}
            {activeTab === 'reschedule' && (
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 md:p-10 animate-slide-up w-full max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">🔄</span>
                        <div>
                            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">Reschedule Flight</h3>
                            <p className="text-xs text-gray-400">Request a date change / reissue quote from the airline</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Passenger ID (paxId) *</label>
                                <input
                                    type="text"
                                    value={rescheduleForm.paxId}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, paxId: e.target.value })}
                                    placeholder="e.g. 691182"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none text-sm font-bold transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Return Passenger ID</label>
                                <input
                                    type="text"
                                    value={rescheduleForm.paxIdr}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, paxIdr: e.target.value })}
                                    placeholder="Leave empty for one-way"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none text-sm font-bold transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">New Travel Date *</label>
                                <input
                                    type="date"
                                    value={rescheduleForm.travelDate}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, travelDate: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none text-sm font-bold transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Flight Detail</label>
                                <select
                                    value={rescheduleForm.flightDetail}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, flightDetail: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none text-sm font-bold transition-all bg-white"
                                >
                                    <option value="Onward Same Flight">Onward Same Flight</option>
                                    <option value="Onward Different Flight">Onward Different Flight</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Return Date (Round Trip)</label>
                                <input
                                    type="date"
                                    value={rescheduleForm.travelDater}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, travelDater: e.target.value })}
                                    min={rescheduleForm.travelDate || new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none text-sm font-bold transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Return Flight Detail</label>
                                <select
                                    value={rescheduleForm.flightDetailr}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, flightDetailr: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none text-sm font-bold transition-all bg-white"
                                >
                                    <option value="">Not Applicable</option>
                                    <option value="Return Same Flight">Return Same Flight</option>
                                    <option value="Return Different Flight">Return Different Flight</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Remarks</label>
                            <textarea
                                value={rescheduleForm.reissueRemarks}
                                onChange={(e) => setRescheduleForm({ ...rescheduleForm, reissueRemarks: e.target.value })}
                                placeholder="Reason for reschedule..."
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none text-sm font-bold transition-all resize-none"
                            />
                        </div>

                        <button
                            onClick={handleReschedule}
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            {loading ? '⏳ Submitting...' : '📅 Submit Reschedule Request'}
                        </button>
                    </div>

                    {/* Reschedule Result */}
                    {result && (
                        <div className="mt-6 bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Reschedule Response</h4>
                            <pre className="text-xs sm:text-sm text-gray-700 font-mono whitespace-pre-wrap break-all overflow-x-auto">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            {/* Loading Overlay */}
            {loading && !result && (
                <div className="flex flex-col items-center justify-center py-16 animate-slide-up">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-5"></div>
                    <p className="text-sm font-bold text-gray-500">Processing your request...</p>
                </div>
            )}
        </div>
    );
};

export default ManageBooking;
