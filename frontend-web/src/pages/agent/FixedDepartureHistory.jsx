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
                <div className="grid grid-cols-1 gap-4">
                    {bookings.map(booking => (
                        <div key={booking._id} className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-slate-100 flex flex-col lg:flex-row items-start lg:items-center gap-4 hover:shadow-lg transition-all group w-full overflow-hidden">
                            {/* Status Section */}
                            <div className="flex flex-row lg:flex-col items-center justify-between lg:justify-center w-full lg:w-auto lg:min-w-[120px] pb-3 lg:pb-0 border-b lg:border-b-0 border-slate-100">
                                <div className="flex items-center gap-2 lg:flex-col">
                                    {booking.status === 'Confirmed' ? (
                                        <div className="w-8 h-8 lg:w-12 lg:h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-lg lg:text-2xl lg:mb-2 shadow-inner">
                                            <FaCheckCircle />
                                        </div>
                                    ) : booking.status === 'Pending' ? (
                                        <div className="w-8 h-8 lg:w-12 lg:h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-lg lg:text-2xl lg:mb-2 shadow-inner animate-pulse">
                                            <FaClock />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 lg:w-12 lg:h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-lg lg:text-2xl lg:mb-2 shadow-inner">
                                            <FaTimesCircle />
                                        </div>
                                    )}
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                        booking.status === 'Confirmed' ? 'text-emerald-500' :
                                        booking.status === 'Pending' ? 'text-amber-500' :
                                        'text-red-500'
                                    }`}>
                                        {booking.status}
                                    </span>
                                </div>
                            </div>

                            {/* Flight Info */}
                            <div className="flex-1 w-full lg:w-auto lg:min-w-[280px]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-[#1D4171] text-sm">
                                        <FaPlane />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{booking.flightId?.airlineName}</p>
                                        <h4 className="text-lg font-black text-[#1D4171] leading-none mt-0.5">{booking.flightId?.flightNumber}</h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div>
                                        <p className="font-black text-[#1D4171] text-xs sm:text-sm">{booking.flightId?.fromCity}</p>
                                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">{booking.flightId?.departureTime}</p>
                                    </div>
                                    <div className="flex-1 max-w-[80px]">
                                        <div className="h-[1px] bg-slate-200 w-full relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                                                <FaPlane className="text-[#48A0D4] text-[10px]" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-black text-[#1D4171] text-xs sm:text-sm">{booking.flightId?.toCity}</p>
                                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">{booking.flightId?.arrivalTime}</p>
                                    </div>
                                </div>
                                <p className="text-[9px] font-black text-[#F07E21] mt-3 uppercase tracking-widest">Travel Date: {new Date(booking.flightId?.departureDate).toLocaleDateString()}</p>
                            </div>

                            {/* PNR & Details */}
                            <div className="w-full lg:w-auto lg:min-w-[150px] lg:border-l lg:border-slate-100 lg:pl-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                                {booking.pnr ? (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Confirmation PNR</p>
                                            <p className="text-lg font-black text-[#1D4171] tracking-widest">{booking.pnr}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Ticket Number</p>
                                            <p className="text-xs font-black text-slate-600">{booking.ticketNumber}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-[9px] font-black text-slate-400 uppercase text-center leading-relaxed">PNR will be generated once admin processes the request.</p>
                                    </div>
                                )}
                            </div>

                            {/* Passengers & Price */}
                            <div className="w-full lg:w-auto lg:min-w-[140px] text-left lg:text-right pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{booking.passengers.length} Passenger(s)</p>
                                <div className="space-y-1 mb-3 flex flex-wrap gap-1.5 lg:block">
                                    {booking.passengers.map((p, i) => (
                                        <span key={i} className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md lg:bg-transparent lg:p-0 lg:block">{p.name}</span>
                                    ))}
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Paid</p>
                                <p className="text-lg font-black text-[#1D4171]">₹{booking.totalFare}</p>
                            </div>

                            {/* Actions */}
                            <div className="w-full lg:w-auto lg:min-w-[120px] flex justify-start lg:justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                                {booking.status === 'Confirmed' && (
                                    <button 
                                        onClick={() => handleDownloadPdf(booking)}
                                        className="w-full lg:w-auto bg-[#F07E21] text-white py-2.5 px-4 rounded-xl shadow-md hover:bg-[#1D4171] hover:scale-105 transition-all flex items-center justify-center gap-2 touch-target font-bold text-xs"
                                        title="Download E-Ticket"
                                    >
                                        <FaCloudDownloadAlt size={16} /> <span className="lg:hidden">Download E-Ticket</span>
                                    </button>
                                )}
                                {booking.status === 'Pending' && (
                                    <div className="w-full lg:w-auto bg-slate-50 py-2.5 px-4 rounded-xl text-slate-400 flex items-center justify-center gap-2 font-bold text-xs border border-slate-100">
                                        <FaTicketAlt size={16} /> <span className="lg:hidden">Pending Issue</span>
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
