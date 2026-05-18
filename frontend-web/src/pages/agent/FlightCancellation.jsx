import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';
import { IoChevronForward, IoAirplaneOutline, IoCloseCircleOutline } from "react-icons/io5";
import { toast } from 'react-toastify';

const FlightCancellation = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    const [selectedPax, setSelectedPax] = useState([]);
    const [cancelReason, setCancelReason] = useState('Full Cancellation');
    const [remarks, setRemarks] = useState('');
    const [step, setStep] = useState(0); // 0: Form, 1: First Confirm, 2: Final Confirm
    const [agreedToPolicy, setAgreedToPolicy] = useState(false);
    const [isWithin24Hours, setIsWithin24Hours] = useState(false);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const res = await bookingService.ftdGetBookingDetails(id);
                if (res.success) {
                    setBooking(res.data);
                    // Select all by default
                    setSelectedPax(res.data.passengerDetails?.map((_, i) => String(i)) || []);

                    // Check if within 24 hours
                    const now = new Date();
                    const departureDate = new Date(res.data.travelDate);
                    const hoursUntilDeparture = (departureDate - now) / (1000 * 60 * 60);
                    if (hoursUntilDeparture < 24) {
                        setIsWithin24Hours(true);
                    }
                } else {
                    toast.error(res.message || 'Booking not found.');
                }
            } catch (err) {
                toast.error(err.message || 'Error fetching booking details.');
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [id]);

    const togglePax = (idx) => {
        const s = String(idx);
        setSelectedPax(prev => 
            prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s]
        );
    };

    const handleSubmit = async () => {
        if (step < 2) {
            setStep(prev => prev + 1);
            return;
        }

        setSubmitting(true);
        try {
            const realPaxIds = selectedPax.map(i => {
                const pax = booking.passengerDetails[parseInt(i)];
                return pax?.paxID || pax?.paxId || String(parseInt(i) + 1);
            }).join(',');

            const res = await bookingService.ftdCancelFlight({
                refID: booking.ftdBookingRef || booking.providerReference,
                paxId: realPaxIds,
                canRemarks: remarks || cancelReason,
                canMode: selectedPax.length === booking.passengerDetails?.length ? 5 : 1
            });

            if (res.success) {
                toast.success('✅ Cancellation request submitted successfully!');
                setTimeout(() => navigate('/agent/history'), 2000);
            } else {
                toast.error(res.message || 'Cancellation failed.');
                setStep(0);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
            setStep(0);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-12 h-12 border-4 border-[#F07E21] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
            <div className="text-rose-500 mb-4 font-bold text-lg">Error: {error}</div>
            <button onClick={() => navigate(-1)} className="bg-[#1D4171] text-white px-8 py-3 rounded font-bold">Back</button>
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-white font-sans text-slate-800 pb-20">
            {/* Title Banner (Navy) */}

            {/* Title Banner (Navy) */}
            <div className="bg-[#1D4171] w-full py-4 px-[10%] flex justify-between items-center">
                <h1 className="text-white text-[18px] font-bold tracking-tight">
                    Cancel or Claim your Refund for Flight Tickets
                </h1>
                <span className="hidden md:block text-[#000000] bg-[#48A0D4] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">
                    Travel & Action
                </span>
            </div>

            {/* Main Content Area */}
            <div className="w-full mt-4 md:mt-10 px-4 md:px-10 space-y-6 md:space-y-10 pb-20">
                
                {step === 0 ? (
                    <>
                        {/* ONWARD FLIGHT TABLE */}
                        <section className="space-y-4">
                            <div className="bg-[#1D4171] text-white px-4 py-2.5 text-[14px] font-bold rounded-t">
                                Onward Flight: {booking.fromCity} To {booking.toCity}
                            </div>
                            <div className="border border-[#dddddd] rounded-b overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[13px] min-w-[600px]">
                                        <thead className="bg-[#f2f2f2] border-b border-[#dddddd]">
                                            <tr className="text-slate-600 font-bold">
                                                <th className="px-4 py-3 border-r border-[#dddddd]">From</th>
                                                <th className="px-4 py-3 border-r border-[#dddddd]">To</th>
                                                <th className="px-4 py-3 border-r border-[#dddddd]">Travel Date</th>
                                                <th className="px-4 py-3 border-r border-[#dddddd]">Booking ID</th>
                                                <th className="px-4 py-3 border-r border-[#dddddd]">PNR</th>
                                                <th className="px-4 py-3">Flight</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="px-4 py-4 border-r border-[#dddddd] font-bold">
                                                    {booking.fromCity}
                                                </td>
                                                <td className="px-4 py-4 border-r border-[#dddddd] font-bold">
                                                    {booking.toCity}
                                                </td>
                                                <td className="px-4 py-4 border-r border-[#dddddd]">
                                                    <p className="font-bold">{new Date(booking.travelDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                </td>
                                                <td className="px-4 py-4 border-r border-[#dddddd] font-bold text-slate-500">
                                                    {booking.ftdBookingRef || booking.providerReference}
                                                </td>
                                                <td className="px-4 py-4 border-r border-[#dddddd] font-black text-rose-600">
                                                    {booking.pnr}
                                                </td>
                                                <td className="px-4 py-4 font-black">
                                                    {(() => {
                                                        try {
                                                            const segments = booking.flightDetails;
                                                            let flattened = [];
                                                            if (Array.isArray(segments)) flattened = segments;
                                                            else if (segments?.Onward) Object.keys(segments.Onward).filter(k => !isNaN(k)).sort().forEach(k => flattened.push(segments.Onward[k]));
                                                            
                                                            if (flattened.length > 0) {
                                                                return `${flattened[0].airCode || ''} - ${flattened[0].flightNo || ''}`;
                                                            }
                                                        } catch (e) {}
                                                        return booking.airline;
                                                    })()}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Promotional / Information Banner */}
                            {(() => {
                                const type = booking.refundType || 'Non-Refundable';
                                let config = {
                                    label: 'Standard Fare',
                                    color: 'bg-slate-50 text-slate-600 border-slate-200',
                                    text: 'Cancellation & Reissue as per Airline Policy + ₹150 SC',
                                    badge: 'GDS FARE'
                                };

                                if (type === 'Non-Refundable') {
                                    config = {
                                        label: 'Instant Offer',
                                        color: 'bg-rose-50 text-rose-600 border-rose-100',
                                        text: 'Strictly Non-Refundable Fare. No refund will be provided upon cancellation.',
                                        badge: 'NON-REFUNDABLE'
                                    };
                                } else if (type === 'P Refundable') {
                                    config = {
                                        label: 'Promo Fare',
                                        color: 'bg-orange-50 text-[#F07E21] border-orange-100',
                                        text: 'Issues in 15 mins | Cancellation ₹3000 onwards + ₹150; Reissue ₹2500 onwards + Fare Diff + SC',
                                        badge: 'PARTIAL REF'
                                    };
                                } else if (type === 'Refundable') {
                                    config = {
                                        label: 'Regular Fare',
                                        color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                                        text: 'Cancellation ₹2500 onwards + ₹150; Reissue ₹2000 onwards + Fare Diff + SC',
                                        badge: 'REFUNDABLE'
                                    };
                                }

                                return (
                                    <div className={`border border-dashed rounded-xl p-4 flex items-center justify-between mt-4 ${config.color.split(' ')[0]} ${config.color.split(' ')[2]}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`${config.color.split(' ')[1]} font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded border opacity-90`}>
                                                {config.label}:
                                            </span>
                                            <p className="text-slate-600 font-bold text-xs">{config.text}</p>
                                        </div>
                                        <span className="hidden md:block text-[9px] font-black text-slate-400 opacity-50 uppercase tracking-widest">{config.badge}</span>
                                    </div>
                                );
                            })()}
                        </section>

                        {/* PASSENGER INFORMATION TABLE */}
                        <section className="space-y-4">
                            <div className="bg-[#1D4171] text-white px-4 py-2.5 text-[14px] font-bold rounded-t">
                                Passenger Information
                            </div>
                            <div className="border border-[#dddddd] rounded-b overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[14px] min-w-[700px]">
                                        <thead className="bg-[#f2f2f2] border-b border-[#dddddd]">
                                            <tr className="text-slate-600 font-bold">
                                                <th className="px-4 py-3 border-r border-[#dddddd] w-[40px]">Select</th>
                                                <th className="px-4 py-3 border-r border-[#dddddd] w-[80px]">S No</th>
                                                <th className="px-4 py-3 border-r border-[#dddddd]">First Name</th>
                                                <th className="px-4 py-3 border-r border-[#dddddd]">Last Name</th>
                                                <th className="px-4 py-3 border-r border-[#dddddd]">Ticket Number</th>
                                                <th className="px-4 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#dddddd]">
                                            {booking.passengerDetails?.map((p, i) => (
                                                <tr key={i} className={selectedPax.includes(String(i)) ? 'bg-orange-50/20' : ''}>
                                                    <td className="px-4 py-4 border-r border-[#dddddd] text-center">
                                                        <input 
                                                            type="checkbox"
                                                            checked={selectedPax.includes(String(i))}
                                                            onChange={() => togglePax(i)}
                                                            className="w-4 h-4 accent-[#F07E21] cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4 border-r border-[#dddddd] font-bold text-slate-400">{i + 1}</td>
                                                    <td className="px-4 py-4 border-r border-[#dddddd] font-bold">{p.fName}</td>
                                                    <td className="px-4 py-4 border-r border-[#dddddd] font-bold">{p.lName}</td>
                                                    <td className="px-4 py-4 border-r border-[#dddddd] font-mono font-bold text-gray-700">{p.ticketNumber || booking.pnr || 'N/A'}</td>
                                                    <td className="px-4 py-4 text-emerald-600 font-bold uppercase text-[11px] tracking-tight">{booking.status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        {/* CANCELLATION TYPE & REMARKS */}
                        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-10">
                            {/* Radio Buttons */}
                            <div className="space-y-4">
                                <div className="bg-[#1D4171] text-white px-4 py-2.5 text-[14px] font-bold rounded-t">
                                    Cancellation type
                                </div>
                                <div className="border border-[#dddddd] rounded-b p-4 md:p-6 space-y-4">
                                     {[
                                        "Full Cancellation",
                                        "Already cancelled with airlines",
                                        "Flight was cancelled by airline",
                                        "Time changed by airline",
                                        "Missed Flight / No Show",
                                        "Others"
                                    ].map(r => (
                                        <label key={r} className="flex items-center gap-3 cursor-pointer group hover:text-[#F07E21] transition-colors">
                                            <div className="relative w-5 h-5 flex-shrink-0">
                                                <input 
                                                    type="radio"
                                                    name="cancelReason"
                                                    value={r}
                                                    checked={cancelReason === r}
                                                    onChange={e => setCancelReason(e.target.value)}
                                                    className="sr-only"
                                                />
                                                <div className={`w-5 h-5 rounded-full border-2 transition-all ${cancelReason === r ? 'border-[#F07E21]' : 'border-slate-300'}`}></div>
                                                {cancelReason === r && (
                                                    <div className="absolute inset-0 m-auto w-2.5 h-2.5 bg-[#F07E21] rounded-full"></div>
                                                )}
                                            </div>
                                            <span className={`text-[13px] font-bold ${cancelReason === r ? 'text-[#F07E21]' : 'text-slate-600'}`}>{r}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="space-y-4">
                                <div className="bg-[#1D4171] text-white px-4 py-2.5 text-[14px] font-bold rounded-t text-left">
                                    Description
                                </div>
                                <div className="border border-[#dddddd] rounded-b p-4 md:p-6 flex flex-col items-end">
                                    <textarea 
                                        value={remarks}
                                        onChange={e => setRemarks(e.target.value)}
                                        placeholder="Remark"
                                        className="w-full h-[120px] p-4 border border-[#cccccc] rounded-md outline-none focus:border-[#F07E21] text-[14px] font-bold transition-all"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* NOTES & POLICY SECTION */}
                        <section className="space-y-6">
                            {isWithin24Hours && (
                                <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-6 animate-pulse">
                                    <div className="flex items-center gap-3 text-rose-600 font-black uppercase tracking-widest text-[12px] mb-2">
                                        <IoCloseCircleOutline size={20} /> Urgent: Departure within 24 Hours
                                    </div>
                                    <p className="text-rose-500 font-bold text-[13px]">
                                        Policy #4: If flight time is less than 24 hours, we cannot assure cancellation. 
                                        It is highly recommended to cancel directly with the airline first and then raise the refund request here.
                                    </p>
                                </div>
                            )}

                            <div className="border border-[#dddddd] rounded p-6 bg-white shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-[#1D4171] uppercase tracking-widest text-sm">Cancellation Policy</span>
                                        <IoChevronForward className="text-[#F07E21]" size={14} />
                                    </div>
                                    <span className="bg-[#1D4171] text-white text-[9px] font-black px-2 py-1 rounded uppercase tracking-tighter">Strict GDS Protocol</span>
                                </div>
                                <ul className="space-y-4 text-[13px] text-slate-700 font-bold leading-relaxed">
                                    <li className="flex items-start gap-3">
                                        <span className="bg-slate-100 text-slate-400 w-5 h-5 flex-shrink-0 rounded flex items-center justify-center text-[10px]">1</span>
                                        <span>Mentioned Cancellation charges are tentative and per PAX per Sector</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="bg-slate-100 text-slate-400 w-5 h-5 flex-shrink-0 rounded flex items-center justify-center text-[10px]">2</span>
                                        <span>Refunds (Full, Partial or No Show) are subject to Airlines Policy and are processed once received from airlines</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="bg-slate-100 text-slate-400 w-5 h-5 flex-shrink-0 rounded flex items-center justify-center text-[10px]">3</span>
                                        <span>All SSRs (Meals, Baggage, Seats, etc.) are Non Refundable incase of cancellation</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="bg-slate-100 text-slate-400 w-5 h-5 flex-shrink-0 rounded flex items-center justify-center text-[10px]">4</span>
                                        <span>If flight time is less than 24 hours, then we cannot assure cancellation. Recommended to cancel directly with airlines first and then raise refund request</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="bg-slate-100 text-slate-400 w-5 h-5 flex-shrink-0 rounded flex items-center justify-center text-[10px]">5</span>
                                        <span className="text-rose-600">This is NOT a cancellation quote request. Once you file the request, your tickets will be cancelled automatically and there is no way to re-instate or stop the cancellation request</span>
                                    </li>
                                </ul>

                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <label className="flex items-center gap-4 cursor-pointer group p-4 bg-slate-50 rounded-xl border-2 border-transparent hover:border-[#F07E21]/30 transition-all">
                                        <input 
                                            type="checkbox" 
                                            checked={agreedToPolicy}
                                            onChange={(e) => setAgreedToPolicy(e.target.checked)}
                                            className="w-5 h-5 accent-[#F07E21]"
                                        />
                                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight">I have read and agree to all the cancellation policies mentioned above.</span>
                                    </label>
                                </div>
                            </div>
                        </section>

                        {/* SUBMIT BUTTON SECTION */}
                        <div className="flex justify-end pt-6">
                            <button 
                                onClick={handleSubmit}
                                disabled={selectedPax.length === 0 || submitting || !agreedToPolicy}
                                className="w-full md:w-auto bg-[#F07E21] text-white px-10 py-3 rounded-md font-bold hover:bg-[#e67e00] transition-all shadow-lg active:scale-95 disabled:opacity-30"
                            >
                                {submitting ? 'Please wait...' : 'Submit'}
                            </button>
                        </div>
                    </>
                ) : (
                    /* CONFIRMATION STEPS overlay style matching previous request's safety steps */
                    <div className="flex flex-col items-center justify-center min-h-[400px] animate-in zoom-in duration-300">
                         <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-xl ${
                            step === 1 ? 'bg-[#F07E21] text-white' : 'bg-rose-600 text-white animate-bounce'
                        }`}>
                            <IoCloseCircleOutline size={48} />
                        </div>
                        <h2 className={`text-4xl font-black italic tracking-tighter uppercase ${step === 2 ? 'text-rose-600' : 'text-[#F07E21]'}`}>
                            {step === 1 ? 'Are you sure?' : 'Final Confirmation!'}
                        </h2>
                        <p className="mt-6 text-slate-500 font-bold max-w-md text-center">
                            {step === 1 
                                ? `You have selected ${selectedPax.length} passenger(s) for cancellation. Please verify before proceeding.`
                                : "This action is PERMANENT and CANNOT be undone. The GDS session will be closed."}
                        </p>
                        
                        <div className="mt-12 flex gap-6">
                            <button 
                                onClick={() => setStep(prev => prev - 1)}
                                className="px-10 py-3.5 border-2 border-slate-100 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest text-sm"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handleSubmit}
                                className={`px-16 py-3.5 rounded-xl text-white font-black shadow-xl transition-all active:scale-95 uppercase tracking-widest text-sm ${
                                    step === 2 ? 'bg-rose-600' : 'bg-[#F07E21]'
                                }`}
                            >
                                {submitting ? 'Processing...' : step === 1 ? 'Yes, Continue' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlightCancellation;
