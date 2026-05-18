import React, { useState, useEffect } from 'react';
import { otbService } from '../../services/otbService';
import OTBApply from '../public/OTBApply';
import { toast } from 'react-toastify';

const OTBAgent = () => {
    const [status, setStatus] = useState('LOADING');
    const [loading, setLoading] = useState(true);
    const [agentData, setAgentData] = useState(null);

    // OTB Status Check State
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [searchRef, setSearchRef] = useState('');
    const [searchContact, setSearchContact] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        fetchAgentStatus();
    }, []);

    const fetchAgentStatus = async () => {
        try {
            setLoading(true);
            const res = await otbService.getAgentStatus(); 
            if (res.success) {
                setStatus(res.status);
                setAgentData(res.agent);
            }
        } catch (err) {
            console.error('Failed to fetch agent status', err);
            setStatus('NONE');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchStatus = async () => {
        let cleanRef = searchRef.trim().toUpperCase();
        
        // Auto-prepend prefix if user only entered digits
        if (/^\d+$/.test(cleanRef)) {
            cleanRef = `GF-OTB-${cleanRef.padStart(4, '0')}`;
        }

        if (!cleanRef) {
            toast.warn('Enter Reference Number');
            return;
        }
        setSearchLoading(true);
        setSearchResult(null);
        try {
            const res = await otbService.getStatus(cleanRef);
            if (res.success) {
                setSearchResult(res.otbRequest);
            } else {
                setSearchResult({ error: res.message || 'Application not found.' });
            }
        } catch (err) {
            setSearchResult({ error: err.response?.data?.message || 'Failed to fetch status. Please try again.' });
        } finally {
            setSearchLoading(false);
        }
    };

    const handleWalletPayment = async () => {
        if (!window.confirm(`Activate OTB Lifetime Access using ₹999 from your wallet?`)) return;
        
        try {
            setLoading(true);
            const res = await otbService.activateWithWallet();
            if (res.success) {
                toast.success(res.message);
                fetchAgentStatus();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Wallet payment failed.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mb-4"></div>
                <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Verifying Access Credentials...</p>
            </div>
        );
    }

    if (status === 'NONE' || status === 'REJECTED') {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in">
                <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
                    <div className="bg-primary-700 p-12 text-white md:w-5/12 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                        <div className="relative z-10">
                            <span className="text-5xl mb-6 block">🛫</span>
                            <h2 className="text-4xl font-black mb-4 leading-tight text-white">OK to Board <br/><span className="text-secondary-400">Services</span></h2>
                            <p className="text-primary-100 font-bold text-sm leading-relaxed mb-10 opacity-80">Unlock the ability to process airline-approved OTB requests for your customers directly through our portal.</p>
                            
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-sm font-bold">
                                    <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px]">✓</span> 
                                    Instant Application
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold">
                                    <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px]">✓</span> 
                                    Lifetime Access
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold">
                                    <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px]">✓</span> 
                                    24/7 Admin Support
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="p-12 md:w-7/12 flex flex-col justify-center items-center text-center">
                        {status === 'REJECTED' && (
                            <div className="w-full bg-red-50 text-red-600 p-4 rounded-2xl mb-8 font-bold border border-red-100 flex items-center gap-3">
                                <span>⚠️</span> Your previous request was rejected. You can try paying again or contact support.
                            </div>
                        )}
                        <h3 className="text-3xl font-black text-gray-900 mb-2">Premium Activation</h3>
                        <p className="text-gray-400 font-bold text-sm mb-12">Activate your account for OTB services with a one-time fee</p>
                        
                        <div className="mb-12">
                            <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mb-2">Investment Amount</p>
                            <p className="text-6xl font-black text-gray-900">₹999<span className="text-lg text-gray-400">/lifetime</span></p>
                        </div>

                        <div className="space-y-4">
                            {agentData?.walletBalance >= 999 ? (
                                <>
                                    <button 
                                        onClick={handleWalletPayment}
                                        className="w-full py-5 bg-secondary-500 text-white font-extrabold rounded-2xl shadow-xl hover:bg-secondary-600 transition-all transform hover:scale-[1.02] active:scale-95 text-[15px] tracking-widest uppercase flex items-center justify-center gap-3"
                                    >
                                        💳 ACTIVATE VIA WALLET
                                    </button>
                                    <p className="text-[10px] text-center text-white/50 font-bold uppercase tracking-widest">₹999 will be deducted from your agency credits</p>
                                </>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => window.location.href = '/agent/wallet'}
                                        className="w-full py-5 bg-amber-500 text-white font-extrabold rounded-2xl shadow-xl hover:bg-amber-600 transition-all transform hover:scale-[1.02] active:scale-95 text-[15px] tracking-widest uppercase flex items-center justify-center gap-3"
                                    >
                                        ⚠️ RECHARGE WALLET TO ACTIVATE
                                    </button>
                                    <p className="text-[10px] text-center text-white/50 font-bold uppercase tracking-widest">Balance too low (Current: ₹{agentData?.walletBalance?.toLocaleString()})</p>
                                </>
                            )}
                        </div>
                        <p className="mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secure Payment via Razorpay</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'PENDING_APPROVAL') {
        return (
            <div className="max-w-xl mx-auto text-center py-20 animate-fade-in">
                <div className="w-32 h-32 bg-orange-50 text-secondary-500 rounded-[2.5rem] flex items-center justify-center text-5xl mx-auto mb-10 shadow-lg glow-secondary relative">
                    ⏳
                    <div className="absolute inset-0 border-4 border-secondary-500/20 rounded-[2.5rem] animate-ping"></div>
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-4">Verification in Progress</h3>
                <p className="text-gray-500 font-bold leading-relaxed mb-10">We have received your payment. Our administrators are currently reviewing your profile for OTB activation. You will be notified once approved.</p>
                <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm inline-block">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Status</p>
                    <p className="text-secondary-600 font-black uppercase tracking-widest">Pending Admin Approval</p>
                </div>
            </div>
        );
    }

    if (status === 'APPROVED') {
        return (
            <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 mb-1">OK to Board <span className="text-primary-600">Application</span></h2>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                             <span className="w-2 h-2 bg-green-500 rounded-full"></span> Lifetime Access Active
                        </p>
                    </div>
                    <button 
                        onClick={() => { setShowStatusModal(true); setSearchResult(null); setSearchRef(''); setSearchContact(''); }}
                        className="bg-white border-2 border-primary-100 hover:border-primary-500 text-primary-600 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                    >
                        <span>🔍</span> Check OTB Status
                    </button>
                </div>
                {/* Re-using OTBApply logic here or just showing it */}
                <OTBApply isAgent={true} />

                {/* --- Check OTB Status Modal --- */}
                {showStatusModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-3"><span>🔍</span> OTB Track Application</h3>
                                <button onClick={() => setShowStatusModal(false)} className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center font-bold text-gray-600 transition-colors">✕</button>
                            </div>
                            <div className="p-8">
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Reference / Receipt Number</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. OTB-1647..." 
                                            value={searchRef} 
                                            onChange={e => setSearchRef(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSearchStatus}
                                    disabled={searchLoading}
                                    className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-colors mb-6 shadow-md"
                                >
                                    {searchLoading ? 'Searching...' : 'Track Status'}
                                </button>

                                {searchResult && (
                                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                        {searchResult.error ? (
                                            <p className="text-red-500 font-bold text-sm text-center">{searchResult.error}</p>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Application Status</span>
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                                                        searchResult.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                        searchResult.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                        'bg-orange-100 text-orange-700'
                                                    }`}>{searchResult.status}</span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Passenger</span>
                                                    <span className="text-sm font-black text-gray-800">{searchResult.passengers?.[0]?.firstName} {searchResult.passengers?.[0]?.lastName}</span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date Submitted</span>
                                                    <span className="text-xs font-bold text-gray-600">{new Date(searchResult.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-1">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">OTB Airline</span>
                                                    <span className="text-sm font-black text-gray-800 uppercase tracking-widest">{searchResult.airline}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default OTBAgent;
