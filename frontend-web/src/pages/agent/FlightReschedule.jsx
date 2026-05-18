import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';
import { IoArrowBackOutline, IoCalendarOutline, IoCheckmarkCircleOutline, IoAlertCircleOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';

const FlightReschedule = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPax, setSelectedPax] = useState([]);
    const [travelDate, setTravelDate] = useState('');
    const [flightDetails, setFlightDetails] = useState('');
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(0); // 0: Form, 1: Success

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                // Using the same service as cancellation for consistency
                const res = await bookingService.ftdGetBookingDetails(id);
                if (res.success) {
                    setBooking(res.data);
                } else {
                    toast.error(res.message || 'Booking not found.');
                }
            } catch (err) {
                const msg = err.response?.data?.message || err.message || 'Failed to fetch booking details. Please try again.';
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [id]);

    const togglePax = (index) => {
        const s = String(index);
        if (selectedPax.includes(s)) {
            setSelectedPax(selectedPax.filter(item => item !== s));
        } else {
            setSelectedPax([...selectedPax, s]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedPax.length === 0) {
            toast.warn('Please select at least one passenger.');
            return;
        }
        if (!travelDate) {
            toast.warn('Please select a new travelling date.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await bookingService.ftdReschedule({
                refID: id,
                paxId: selectedPax.join(','),
                travelDate,
                flightDetails,
                remarks
            });

            if (res.success) {
                toast.success('Reissue request submitted successfully!');
                setStep(1);
            } else {
                toast.error(res.message || 'Reschedule request failed.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Connection error. Please try again later.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-[#1D4171] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">GDS Sync in progress...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
            <IoAlertCircleOutline className="text-rose-500 text-6xl mb-4" />
            <div className="text-rose-500 mb-4 font-bold text-lg">Error: {error}</div>
            <button onClick={() => navigate(-1)} className="bg-[#1D4171] text-white px-8 py-3 rounded font-bold hover:bg-[#002560] transition-all">Back</button>
        </div>
    );

    if (!booking) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
            <IoAlertCircleOutline className="text-rose-500 text-6xl mb-4" />
            <div className="text-slate-500 mb-4 font-bold text-lg">Booking details not found.</div>
            <button onClick={() => navigate(-1)} className="bg-[#1D4171] text-white px-8 py-3 rounded font-bold hover:bg-[#002560] transition-all">Back</button>
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-white font-sans text-slate-800 pb-20">
            {/* Title Banner (Navy) */}
            <div className="bg-[#1D4171] w-full py-4 px-4 md:px-10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-white hover:text-[#F07E21] transition-colors">
                        <IoArrowBackOutline size={24} />
                    </button>
                    <h1 className="text-white text-[18px] font-bold tracking-tight">
                        Get Reissue Quotation for Flight Tickets
                    </h1>
                </div>
                <span className="hidden md:block text-[#000000] bg-[#48A0D4] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">
                    Corporate & Trustworthy
                </span>
            </div>

            <div className="w-full mt-4 md:mt-10 px-4 md:px-10 space-y-6 md:space-y-10 pb-20">
                {step === 0 ? (
                    <>
                        {/* 1. ONWARD FLIGHT INFORMATION */}
                        <section className="space-y-4">
                            <div className="bg-[#1D4171] text-white px-4 py-2.5 text-[14px] font-bold rounded-t flex justify-between items-center">
                                <span>Onward Flight Quotation Information: {booking.fromCity} To {booking.toCity}</span>
                                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">{booking.status}</span>
                            </div>
                            <div className="border border-[#dddddd] rounded-b overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[13px] min-w-[700px]">
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
                            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-4 flex items-center justify-between mt-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-[#F07E21] font-black uppercase text-[10px] tracking-widest bg-orange-50 px-3 py-1 rounded border border-orange-100">Promo Fare:</span>
                                    <p className="text-slate-600 font-bold text-xs">Issues in 15 mins Cancellation 3000 onwards + 150; Reissue 2500 onwards + Fare Diff + SC</p>
                                </div>
                            </div>
                        </section>

                        {/* 2. PASSENGER REISSUE SECTION */}
                        <section className="space-y-4">
                            <div className="bg-[#1D4171] text-white px-5 py-3 text-[14px] font-bold rounded-t">
                                Passenger Reissue Section
                            </div>
                            <div className="border border-[#dddddd] rounded-b overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[14px] min-w-[700px]">
                                        <thead className="bg-[#f8fafc] border-b border-[#dddddd]">
                                            <tr className="text-slate-600 font-bold uppercase text-[11px]">
                                                <th className="px-6 py-4 border-r border-[#dddddd] w-[80px]">Select</th>
                                                <th className="px-6 py-4 border-r border-[#dddddd] w-[80px]">S No</th>
                                                <th className="px-6 py-4 border-r border-[#dddddd]">First Name</th>
                                                <th className="px-6 py-4 border-r border-[#dddddd]">Last Name</th>
                                                <th className="px-6 py-4 border-r border-[#dddddd]">Ticket Number</th>
                                                <th className="px-6 py-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#dddddd]">
                                            {booking.passengerDetails?.map((p, i) => (
                                                <tr key={i} className={`hover:bg-slate-50 transition-colors ${selectedPax.includes(String(i)) ? 'bg-orange-50/30' : ''}`}>
                                                    <td className="px-6 py-5 border-r border-[#dddddd] text-center">
                                                        <input 
                                                            type="checkbox"
                                                            checked={selectedPax.includes(String(i))}
                                                            onChange={() => togglePax(i)}
                                                            className="w-5 h-5 accent-[#F07E21] cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-5 border-r border-[#dddddd] font-bold text-slate-400">{i + 1}</td>
                                                    <td className="px-6 py-5 border-r border-[#dddddd] font-black uppercase text-[#1D4171]">{p.fName}</td>
                                                    <td className="px-6 py-5 border-r border-[#dddddd] font-black uppercase text-[#1D4171]">{p.lName}</td>
                                                    <td className="px-6 py-5 border-r border-[#dddddd] font-mono font-bold text-gray-700">{p.ticketNumber || booking.pnr || 'N/A'}</td>
                                                    <td className="px-6 py-5 text-emerald-600 font-black uppercase text-[11px] tracking-tight">{booking.status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        {/* 3. REISSUE QUOTATION DETAILS */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="bg-[#1D4171] text-white px-5 py-3 text-[14px] font-bold rounded-t">
                                Reissue Quotation Details
                            </div>
                            <div className="border border-[#dddddd] rounded-b p-8 shadow-sm">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 pt-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-[#48A0D4] uppercase tracking-widest pl-1">New Traveling Date</label>
                                            <div className="relative">
                                                <input 
                                                    type="date"
                                                    required
                                                    value={travelDate}
                                                    onChange={e => setTravelDate(e.target.value)}
                                                    className="w-full p-4 pl-12 border border-[#cccccc] rounded-xl outline-none focus:border-[#F07E21] focus:ring-4 focus:ring-[#F07E21]/10 font-bold transition-all appearance-none"
                                                />
                                                <IoCalendarOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest pl-1">Onward Flights Detail</label>
                                            <textarea 
                                                value={flightDetails}
                                                onChange={e => setFlightDetails(e.target.value)}
                                                placeholder="Enter preferred flight numbers, times, or airline preferences..."
                                                className="w-full h-[150px] p-5 border border-[#cccccc] rounded-xl outline-none focus:border-[#F07E21] focus:ring-4 focus:ring-[#F07E21]/10 font-bold transition-all resize-none shadow-inner bg-slate-50/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-8 flex flex-col items-end">
                                        <div className="w-full space-y-2">
                                            <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest pl-1">Remarks</label>
                                            <textarea 
                                                value={remarks}
                                                onChange={e => setRemarks(e.target.value)}
                                                placeholder="Any additional notes for the operator..."
                                                className="w-full h-[150px] p-5 border border-[#cccccc] rounded-xl outline-none focus:border-[#F07E21] focus:ring-4 focus:ring-[#F07E21]/10 font-bold transition-all resize-none shadow-inner bg-slate-50/50"
                                            />
                                        </div>
                                        
                                        <div className="pt-4 w-full md:w-auto">
                                            <button 
                                                type="submit"
                                                disabled={submitting || selectedPax.length === 0}
                                                className="w-full md:w-[250px] bg-[#F07E21] text-white py-4 rounded-xl font-black text-[15px] hover:bg-[#e67e00] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-30 disabled:hover:scale-100 uppercase tracking-widest"
                                            >
                                                {submitting ? 'Sending Request...' : 'Get Quotation'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* 4. NOTES */}
                        <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl shadow-sm">
                            <div className="flex gap-4">
                                <IoAlertCircleOutline className="text-amber-500 text-2xl flex-shrink-0 mt-1" />
                                <div className="space-y-2">
                                    <h4 className="text-amber-900 font-black text-sm uppercase tracking-wider">Please Note:</h4>
                                    <ul className="text-amber-800 text-[12px] font-bold space-y-1 list-disc pl-4">
                                        <li>Reschedule requests are subject to airline availability and fare difference.</li>
                                        <li>Standard reissue fees and service charges will apply.</li>
                                        <li>Our team will contact you with the final quotation via email.</li>
                                        <li>Ticket will only be reissued after the difference amount is paid.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="py-20 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8 shadow-inner">
                            <IoCheckmarkCircleOutline className="text-emerald-600 text-6xl" />
                        </div>
                        <h2 className="text-3xl font-black text-[#1D4171] mb-4">Reissue Request Submitted!</h2>
                        <p className="text-slate-400 font-bold max-w-[500px] text-center mb-10 text-lg leading-relaxed">
                            Your reissue request for PNR <span className="text-[#F07E21]">{booking.pnr || booking.providerReference}</span> has been received. 
                            The reissue quotation will be sent to your registered email shortly.
                        </p>
                        <button 
                            onClick={() => navigate('/agent/history')}
                            className="bg-[#1D4171] text-white px-12 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-[#002560] transition-all shadow-xl active:scale-95"
                        >
                            Back to Bookings
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlightReschedule;
