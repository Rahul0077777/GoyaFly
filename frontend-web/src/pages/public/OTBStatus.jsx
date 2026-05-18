import React, { useState } from 'react';
import { otbService } from '../../services/otbService';

const OTBStatus = () => {
    const [receiptNumber, setReceiptNumber] = useState('');
    const [contactNo, setContactNo] = useState('');
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCheckStatus = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setStatusData(null);
        try {
            const res = await otbService.getStatus(receiptNumber, contactNo);
            if (res.success) {
                setStatusData(res.otbRequest);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Request not found. Please check details.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'text-green-600 bg-green-50 border-green-200';
            case 'REJECTED': return 'text-red-600 bg-red-50 border-red-200';
            case 'PROCESSING': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-12 animate-fade-in flex flex-col gap-12">
            <div className="text-center space-y-4">
                <span className="text-5xl inline-block p-6 bg-white rounded-full shadow-2xl mb-4">🔍</span>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Track OTB Status</h2>
                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Instantly check your application progress</p>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col gap-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500"></div>
                
                <form onSubmit={handleCheckStatus} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:items-end">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Receipt Number</label>
                        <input 
                            className="w-full bg-gray-50 border-0 rounded-2xl p-5 font-bold text-gray-800 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-inner text-lg placeholder-gray-300"
                            placeholder="GF-OTB-XXXX"
                            value={receiptNumber}
                            onChange={e => setReceiptNumber(e.target.value.toUpperCase())}
                            required 
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Mobile Number</label>
                        <input 
                            className="w-full bg-gray-50 border-0 rounded-2xl p-5 font-bold text-gray-800 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-inner text-lg placeholder-gray-300"
                            placeholder="Registered Mobile No"
                            value={contactNo}
                            onChange={e => setContactNo(e.target.value)}
                            required 
                        />
                    </div>
                    <div className="md:col-span-2 mt-4">
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-2xl shadow-primary-500/30 transition-all transform active:scale-95 text-xl tracking-wider disabled:opacity-50"
                        >
                            {loading ? 'SEARCHING...' : 'CHECK STATUS'}
                        </button>
                    </div>
                </form>

                {error && <p className="text-red-500 text-center font-bold animate-bounce mt-4 p-4 bg-red-50 rounded-2xl border border-red-100">{error}</p>}
            </div>

            {statusData && (
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 animate-slide-up space-y-12">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Status</p>
                            <span className={`px-8 py-3 rounded-full text-lg font-black border-2 ${getStatusColor(statusData.status)}`}>
                                {statusData.status}
                            </span>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Airline</p>
                            <p className="text-2xl font-black text-gray-900">{statusData.airline}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-gray-100">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">PNR</p>
                            <p className="text-lg font-black text-gray-800">{statusData.travelDetails.pnr}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Destination</p>
                            <p className="text-lg font-black text-gray-800">{statusData.travelDetails.destination}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Travel Date</p>
                            <p className="text-lg font-black text-gray-800">{new Date(statusData.travelDetails.dateOfTravel).toLocaleDateString()}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment</p>
                            <p className={`text-lg font-black ${statusData.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>{statusData.paymentStatus}</p>
                        </div>
                    </div>

                    {statusData.adminNotes && (
                        <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Admin Remarks</p>
                            <p className="text-blue-900 font-bold leading-relaxed italic">"{statusData.adminNotes}"</p>
                        </div>
                    )}

                    {/* Simple Progress Tracker */}
                    <div className="relative pt-10 px-4">
                         <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gray-100 -translate-y-1/2 rounded-full"></div>
                         <div className="relative flex justify-between items-center w-full">
                            {['PENDING', 'PROCESSING', 'APPROVED'].map((step, idx) => {
                                const isDone = ['PENDING', 'PROCESSING', 'APPROVED'].indexOf(statusData.status) >= idx;
                                return (
                                    <div key={idx} className="flex flex-col items-center gap-3 relative z-10">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-lg transition-all ${isDone ? 'bg-primary-500 text-white scale-125' : 'bg-white text-gray-300 border-2'}`}>
                                            {isDone ? '✓' : idx + 1}
                                        </div>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDone ? 'text-primary-600' : 'text-gray-300'}`}>{step}</p>
                                    </div>
                                )
                            })}
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OTBStatus;
