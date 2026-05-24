import React, { useState, useEffect } from 'react';
import { otbService } from '../../services/otbService';
import OTBApply from '../public/OTBApply';
import { toast } from 'react-toastify';
import heroBg from '../../assets/hero_bg.png';
import otbAirplaneGraphic from '../../assets/otb_airplane.png';
import otbExampleImage from '../../assets/otb_example.png';
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
        if (!window.confirm(`Activate OTB Lifetime Access using ₹9999 from your wallet?`)) return;
        
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
            <div className="bg-[#F4F7FE] min-h-screen pb-10 font-sans animate-fade-in -mt-6">
                {/* Blue Header Section */}
                <div 
                    className="relative pt-12 pb-16 px-4 rounded-b-[3rem]" 
                    style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#0B4EE3' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0B359C] to-[#0A2670] opacity-90 rounded-b-[3rem]"></div>
                    
                    <div className="relative z-10 max-w-6xl mx-auto">
                        {status === 'REJECTED' && (
                            <div className="w-full bg-red-500/90 text-white p-4 rounded-2xl mb-6 font-bold border border-red-400 flex items-center gap-3 backdrop-blur-sm">
                                <span>⚠️</span> Your previous request was rejected. You can try paying again or contact support.
                            </div>
                        )}
                    
                        {/* Top Badge */}
                        <div className="inline-flex items-center gap-2 bg-[#2D5A9E]/40 border border-white/10 rounded-full px-3 py-1.5 mb-6 shadow-inner">
                            <span className="text-white text-xs">🛡️</span>
                            <span className="text-white text-[10px] font-bold tracking-wide">Trusted by 5000+ Agents</span>
                        </div>

                        <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
                            <div className="lg:w-1/2 pt-4">
                                <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 tracking-tight">
                                    OK to Board <br/>
                                    <span className="text-[#FF9F43]">Services</span>
                                </h1>
                                <p className="text-white/80 text-sm md:text-lg leading-relaxed mb-10 max-w-md font-medium">
                                    Unlock the ability to process airline-approved OTB requests for your customers directly through our portal.
                                </p>

                                {/* Three Feature Cards */}
                                <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-md">
                                    <div className="bg-[#0B359C]/40 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 backdrop-blur-md shadow-lg">
                                        <div className="w-10 h-10 rounded-full bg-[#1A56DB] flex items-center justify-center text-white text-base shadow-inner">⚡</div>
                                        <span className="text-white text-[10px] sm:text-xs font-bold text-center leading-tight">Instant<br/>Application</span>
                                    </div>
                                    <div className="bg-[#0B359C]/40 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 backdrop-blur-md shadow-lg">
                                        <div className="w-10 h-10 rounded-full bg-[#1A56DB] flex items-center justify-center text-white text-base shadow-inner">🛡️</div>
                                        <span className="text-white text-[10px] sm:text-xs font-bold text-center leading-tight">Lifetime<br/>Access</span>
                                    </div>
                                    <div className="bg-[#0B359C]/40 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 backdrop-blur-md shadow-lg">
                                        <div className="w-10 h-10 rounded-full bg-[#1A56DB] flex items-center justify-center text-white text-base shadow-inner">🎧</div>
                                        <span className="text-white text-[10px] sm:text-xs font-bold text-center leading-tight">24/7 Admin<br/>Support</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="lg:w-1/2 flex justify-center lg:justify-end w-full lg:-mt-12">
                                {/* Premium Activation Card */}
                                <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 sm:p-10 text-center border border-gray-100 w-full max-w-md">
                                    <div className="inline-flex items-center gap-2 bg-blue-50 rounded-full px-3 py-1.5 mb-6">
                                        <span className="text-[#1A56DB] text-xs">👑</span>
                                        <span className="text-[#1A56DB] text-[10px] font-black uppercase tracking-widest">Premium Access</span>
                                    </div>

                                    <h2 className="text-2xl sm:text-3xl font-black text-[#0B1A42] mb-3">Premium Activation</h2>
                                    <p className="text-gray-500 text-sm font-medium mb-8 max-w-sm mx-auto">Activate your account for OTB services with a one-time fee</p>

                                    <div className="border-t border-dashed border-gray-200 w-full mb-8"></div>

                                    <p className="text-[#1A56DB] text-[10px] font-black uppercase tracking-[0.2em] mb-2">Investment Amount</p>
                                    <div className="flex justify-center items-end gap-1 mb-8">
                                        <span className="text-5xl sm:text-6xl font-black text-[#0B1A42] leading-none tracking-tighter">₹9999</span>
                                        <span className="text-gray-400 font-bold mb-1 sm:mb-1.5">/lifetime</span>
                                    </div>

                                    <div className="space-y-4">
                                        {agentData?.walletBalance >= 9999 ? (
                                            <>
                                                <button onClick={handleWalletPayment} className="w-full bg-gradient-to-r from-[#FF9F43] to-[#FF9100] text-white font-black py-4 sm:py-5 rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-3 uppercase tracking-wide text-xs sm:text-sm transition-transform hover:scale-[1.02] active:scale-95">
                                                    💳 Activate Using Wallet <span className="text-lg leading-none font-normal">›</span>
                                                </button>
                                                <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">₹9999 will be deducted from your agency credits</p>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => window.location.href = '/agent/wallet'} className="w-full bg-gradient-to-r from-[#FF9F43] to-[#FF9100] text-white font-black py-4 sm:py-5 rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-3 uppercase tracking-wide text-xs sm:text-sm transition-transform hover:scale-[1.02] active:scale-95">
                                                    👛 Recharge Wallet To Activate <span className="text-lg leading-none font-normal">›</span>
                                                </button>
                                                <p className="text-[10px] text-center text-red-400 font-bold uppercase tracking-widest">Balance too low (Current: ₹{agentData?.walletBalance?.toLocaleString('en-IN')})</p>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-center gap-2 text-gray-500 mt-8 mb-8">
                                        <span className="text-green-500">🛡️</span>
                                        <span className="text-[10px] font-bold">Secure Payment via Razorpay</span>
                                    </div>

                                    <div className="bg-[#F0F5FF] rounded-2xl p-4 flex items-center gap-4 text-left border border-blue-50">
                                        <div className="w-10 h-10 rounded-full bg-[#1A56DB] shadow-md flex items-center justify-center text-white text-xl shrink-0">
                                            ★
                                        </div>
                                        <div>
                                            <p className="text-[#0B1A42] text-[10px] font-black">100% Secure • Fast Processing</p>
                                            <p className="text-gray-500 text-[9px] mt-0.5 font-medium">Join thousands of agents growing their business with us.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* OTB Information Section */}
                <div className="max-w-6xl mx-auto px-4 py-16">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-16">
                        <div className="md:w-1/2 text-left">
                            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 rounded-full px-3 py-1.5 mb-4 text-[10px] font-black uppercase tracking-widest">
                                ℹ️ About OTB
                            </div>
                            <h2 className="text-3xl font-black text-[#0B1A42] mb-4">What is "Okay to Board" (OTB)?</h2>
                            <p className="text-gray-500 leading-relaxed font-medium mb-4 text-lg">
                                Okay to Board (OTB) is a mandatory airline requirement for passengers traveling to certain countries (like UAE, Oman, Qatar) on a paper or electronic visa. 
                            </p>
                            <p className="text-gray-500 leading-relaxed font-medium text-sm">
                                Without this airline approval message stamped in their PNR, passengers may be denied boarding at the airport, causing immense hassle and financial loss. We handle this entire process for you seamlessly.
                            </p>
                        </div>
                        <div className="md:w-1/2 flex justify-center md:justify-end">
                            <img 
                                src={otbExampleImage} 
                                alt="OK TO BOARD Stamp Example" 
                                className="w-full max-w-sm rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-8 border-white transform rotate-3 hover:rotate-0 transition-transform duration-500 bg-white" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow">
                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner">
                                🛂
                            </div>
                            <h3 className="text-xl font-black text-[#0B1A42] mb-3">Why is it needed?</h3>
                            <p className="text-gray-500 text-sm leading-relaxed font-medium">
                                Airlines need to verify that the passenger holds a valid visa before allowing them to board. We send the visa details directly to the airline to officially update the PNR with the "OK to Board" remark.
                            </p>
                        </div>
                        
                        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow">
                            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner">
                                ⏱️
                            </div>
                            <h3 className="text-xl font-black text-[#0B1A42] mb-3">Fast Processing</h3>
                            <p className="text-gray-500 text-sm leading-relaxed font-medium">
                                Our system is directly connected with major airlines. We process OTB requests instantly or within a few hours, ensuring your customers never face delays or panic at the airport.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow">
                            <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner">
                                💰
                            </div>
                            <h3 className="text-xl font-black text-[#0B1A42] mb-3">Extra Revenue</h3>
                            <p className="text-gray-500 text-sm leading-relaxed font-medium">
                                As a premium agent, you can process OTB for any PNR (even if not booked through us) and charge your customers a markup, creating an effortless additional revenue stream for your agency.
                            </p>
                        </div>
                    </div>

                    <div className="bg-[#0B1A42] rounded-[3rem] p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-20 -mr-20 -mt-20"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-[80px] opacity-20 -ml-20 -mb-20"></div>
                        
                        <h2 className="text-2xl sm:text-3xl font-black mb-12 relative z-10">How It Works</h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-2xl font-black mb-5 border border-white/20">1</div>
                                <h4 className="font-bold mb-2">Submit Request</h4>
                                <p className="text-xs text-white/60 font-medium leading-relaxed px-2">Enter PNR and upload the passenger's Visa & Passport copy.</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-2xl font-black mb-5 border border-white/20">2</div>
                                <h4 className="font-bold mb-2">Airline Verification</h4>
                                <p className="text-xs text-white/60 font-medium leading-relaxed px-2">Our team securely transmits the documents to the respective airline.</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-2xl font-black mb-5 border border-white/20">3</div>
                                <h4 className="font-bold mb-2">PNR Update</h4>
                                <p className="text-xs text-white/60 font-medium leading-relaxed px-2">The airline verifies and updates the passenger's PNR with the OTB message.</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-2xl font-black mb-5 shadow-[0_0_20px_rgba(52,211,153,0.4)] text-white">✓</div>
                                <h4 className="font-bold mb-2">Ready to Fly</h4>
                                <p className="text-xs text-white/60 font-medium leading-relaxed px-2">Download the OTB confirmation receipt directly from your dashboard.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Action Button (FAB) */}
                <div className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-[#4B83F3] to-[#8A4BF3] rounded-full flex items-center justify-center text-white text-2xl shadow-xl shadow-blue-500/30 border-[3px] border-white cursor-pointer hover:scale-105 active:scale-95 transition-transform z-50">
                    ✨
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
