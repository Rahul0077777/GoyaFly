import React, { useState, useEffect } from 'react';
import api, { fixedDepartureService } from '../../services/api';
import { toast } from 'react-toastify';
import { FaTicketAlt, FaClock, FaCheckCircle, FaTimesCircle, FaPlane, FaCloudDownloadAlt, FaExternalLinkAlt } from 'react-icons/fa';

const FixedDepartureHistory = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fixedDepartureService.getMyBookings();
            if (res.success) {
                setBookings(res.data);
            }
        } catch (error) {
            toast.error('Failed to load booking history');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = (booking) => {
        if (!booking.pdfUrl) {
            toast.warn('PDF Ticket is being generated or not available');
            return;
        }
        const baseUrl = api.defaults?.baseURL?.replace('/api', '') || 'http://localhost:5000';
        window.open(`${baseUrl}${booking.pdfUrl}`, '_blank');
    };

    if (loading) return <div className="p-8 text-center font-black text-slate-300 animate-pulse uppercase tracking-widest py-40">Accessing Historical Records...</div>;

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-[#1D4171]">My Fixed Departures</h1>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Status of your manual booking requests</p>
            </div>

            {bookings.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-20 text-center shadow-xl border border-slate-50">
                    <div className="text-8xl mb-8 opacity-20">📂</div>
                    <h3 className="text-2xl font-black text-[#1D4171] mb-2">No Bookings Yet</h3>
                    <p className="text-slate-400 font-bold">Your manual booking history will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {bookings.map(booking => (
                        <div key={booking._id} className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl border border-slate-50 flex flex-col lg:flex-row items-start lg:items-center gap-6 sm:gap-10 hover:shadow-2xl transition-all group w-full overflow-hidden">
                            {/* Status Section */}
                            <div className="flex flex-row lg:flex-col items-center justify-between lg:justify-center w-full lg:w-auto lg:min-w-[140px] pb-4 lg:pb-0 border-b lg:border-b-0 border-slate-50">
                                <div className="flex items-center gap-3 lg:flex-col">
                                    {booking.status === 'Confirmed' ? (
                                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-2xl lg:text-3xl lg:mb-3 shadow-inner">
                                            <FaCheckCircle />
                                        </div>
                                    ) : booking.status === 'Pending' ? (
                                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-2xl lg:text-3xl lg:mb-3 shadow-inner animate-pulse">
                                            <FaClock />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl lg:text-3xl lg:mb-3 shadow-inner">
                                            <FaTimesCircle />
                                        </div>
                                    )}
                                    <span className={`text-xs lg:text-[10px] font-black uppercase tracking-[0.2em] ${
                                        booking.status === 'Confirmed' ? 'text-emerald-500' :
                                        booking.status === 'Pending' ? 'text-amber-500' :
                                        'text-red-500'
                                    }`}>
                                        {booking.status}
                                    </span>
                                </div>
                            </div>

                            {/* Flight Info */}
                            <div className="flex-1 w-full lg:w-auto lg:min-w-[300px]">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#1D4171]">
                                        <FaPlane />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{booking.flightId?.airlineName}</p>
                                        <h4 className="text-xl font-black text-[#1D4171]">{booking.flightId?.flightNumber}</h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <div>
                                        <p className="font-black text-[#1D4171] text-sm sm:text-base">{booking.flightId?.fromCity}</p>
                                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{booking.flightId?.departureTime}</p>
                                    </div>
                                    <div className="flex-1 max-w-[100px]">
                                        <div className="h-[1px] bg-slate-100 w-full relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                                                <FaPlane className="text-[#48A0D4] text-xs" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-black text-[#1D4171] text-sm sm:text-base">{booking.flightId?.toCity}</p>
                                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{booking.flightId?.arrivalTime}</p>
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-[#F07E21] mt-4 uppercase tracking-[0.1em]">Travel Date: {new Date(booking.flightId?.departureDate).toLocaleDateString()}</p>
                            </div>

                            {/* PNR & Details */}
                            <div className="w-full lg:w-auto lg:min-w-[200px] lg:border-l lg:border-slate-50 lg:pl-10 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-50">
                                {booking.pnr ? (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confirmation PNR</p>
                                            <p className="text-2xl font-black text-[#1D4171] tracking-widest">{booking.pnr}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket Number</p>
                                            <p className="text-sm font-black text-slate-600">{booking.ticketNumber}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase text-center leading-relaxed">PNR will be generated once admin processes the request.</p>
                                    </div>
                                )}
                            </div>

                            {/* Passengers & Price */}
                            <div className="w-full lg:w-auto lg:min-w-[180px] text-left lg:text-right pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{booking.passengers.length} Passenger(s)</p>
                                <div className="space-y-1 mb-4 flex flex-wrap gap-2 lg:block">
                                    {booking.passengers.map((p, i) => (
                                        <span key={i} className="text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg lg:bg-transparent lg:p-0 lg:block">{p.name}</span>
                                    ))}
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Paid</p>
                                <p className="text-2xl font-black text-[#1D4171]">₹{booking.totalFare}</p>
                            </div>

                            {/* Actions */}
                            <div className="w-full lg:w-auto lg:min-w-[120px] flex justify-start lg:justify-end pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-50">
                                {booking.status === 'Confirmed' && (
                                    <button 
                                        onClick={() => handleDownloadPdf(booking)}
                                        className="w-full lg:w-auto bg-[#1D4171] text-white p-5 rounded-[1.5rem] shadow-xl hover:bg-[#F07E21] hover:scale-110 transition-all flex items-center justify-center gap-2 touch-target font-bold text-sm"
                                        title="Download E-Ticket"
                                    >
                                        <FaCloudDownloadAlt size={20} /> <span className="lg:hidden">Download E-Ticket</span>
                                    </button>
                                )}
                                {booking.status === 'Pending' && (
                                    <div className="w-full lg:w-auto bg-slate-50 p-5 rounded-[1.5rem] text-slate-300 flex items-center justify-center gap-2 font-bold text-sm">
                                        <FaTicketAlt size={20} /> <span className="lg:hidden">Pending Issue</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FixedDepartureHistory;
