import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import { FaTicketAlt, FaCheck, FaTimes, FaSearch, FaUser, FaPlane, FaIdCard, FaUndo, FaFilter, FaCalendarAlt, FaClock, FaEye, FaPrint, FaCopy } from 'react-icons/fa';

const FixedDepartureBookingManager = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [pnr, setPnr] = useState('');
    const [ticketNumber, setTicketNumber] = useState('');
    const [filter, setFilter] = useState('');

    // Cancel Modal States
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedCancelBooking, setSelectedCancelBooking] = useState(null);
    const [cancelRemarks, setCancelRemarks] = useState('');

    // View Modal States
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedViewBooking, setSelectedViewBooking] = useState(null);

    const handleViewClick = (booking) => {
        setSelectedViewBooking(booking);
        setIsViewModalOpen(true);
    };

    const handlePrintClick = (booking) => {
        setSelectedViewBooking(booking);
        setIsViewModalOpen(true);
        setTimeout(() => {
            window.print();
        }, 500);
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await adminService.getFixedDepartureBookings();
            if (res.success) {
                setBookings(res.data);
            }
        } catch (error) {
            toast.error('Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenConfirmModal = (booking) => {
        setSelectedBooking(booking);
        setPnr('');
        setTicketNumber('');
        setIsModalOpen(true);
    };

    const handleConfirm = async () => {
        if (!pnr || !ticketNumber) {
            return toast.warn('Please enter PNR and Ticket Number');
        }
        try {
            await adminService.confirmFixedDepartureBooking(selectedBooking._id, pnr, ticketNumber);
            toast.success('Booking confirmed successfully');
            setIsModalOpen(false);
            fetchBookings();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Confirmation failed');
        }
    };

    const handleCancelClick = (booking) => {
        setSelectedCancelBooking(booking);
        setCancelRemarks('');
        setIsCancelModalOpen(true);
    };

    const submitCancel = async () => {
        if (!selectedCancelBooking) return;
        try {
            await adminService.cancelFixedDepartureBooking(selectedCancelBooking._id, cancelRemarks);
            toast.success('Booking cancelled and agent refunded');
            setIsCancelModalOpen(false);
            fetchBookings();
        } catch (error) {
            toast.error('Cancellation failed');
        }
    };

    const handleVerifyPayment = async (id) => {
        try {
            await adminService.verifyFixedDepartureBookingPayment(id);
            toast.success('Payment verified successfully! You can now issue the ticket.');
            fetchBookings();
        } catch (error) {
            toast.error('Payment verification failed');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const handleCopyPassengers = (booking) => {
        if (!booking.passengers || booking.passengers.length === 0) return;
        let text = `Flight: ${booking.flightId?.airlineName} ${booking.flightId?.flightNumber} (${booking.flightId?.fromCity} -> ${booking.flightId?.toCity})\n`;
        text += `Travel Date: ${new Date(booking.flightId?.departureDate || Date.now()).toLocaleDateString()}\n\n`;
        
        booking.passengers.forEach((p, i) => {
            text += `Passenger ${i + 1}:\n`;
            text += `Name: ${p.firstName || p.name} ${p.lastName || ''}\n`;
            if (p.dob) text += `DOB: ${p.dob}\n`;
            if (p.gender) text += `Gender: ${p.gender}\n`;
            if (booking.isInternational) {
                if (p.passportNumber) text += `Passport: ${p.passportNumber}\n`;
                if (p.nationality) text += `Nationality: ${p.nationality}\n`;
            }
            text += `\n`;
        });
        copyToClipboard(text);
    };

    const filteredBookings = bookings.filter(b => 
        b.agentId?.agencyName?.toLowerCase().includes(filter.toLowerCase()) ||
        b.pnr?.toLowerCase().includes(filter.toLowerCase()) ||
        b.flightId?.flightNumber?.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
            <div className="flex flex-col items-center gap-4">
                <FaPlane className="text-[#1D4171] text-4xl animate-bounce" />
                <div className="text-xl text-[#1D4171] font-black tracking-widest animate-pulse">LOADING REQUESTS...</div>
            </div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 bg-slate-50 min-h-screen font-sans">
            {/* Header Area with Glassmorphism Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="animate-in slide-in-from-left duration-500">
                    <h1 className="text-3xl md:text-4xl font-black text-[#1D4171] mb-1">Fixed Departure Requests</h1>
                    <p className="text-slate-500 font-medium text-sm">Process, verify, and confirm agent booking requests smoothly.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto animate-in slide-in-from-right duration-500">
                    <div className="relative flex-1 md:w-96 group">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#48A0D4] transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search by agency, PNR, flight..."
                            className="pl-12 pr-6 py-3.5 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md focus:shadow-lg font-bold w-full text-sm outline-none focus:border-[#48A0D4] focus:ring-4 ring-[#48A0D4]/10 transition-all duration-300"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                    </div>
                    <button className="p-4 bg-white border border-slate-200/60 rounded-2xl text-[#1D4171] shadow-sm hover:shadow-md hover:bg-slate-50 active:scale-95 transition-all duration-300 group">
                        <FaFilter className="group-hover:text-[#48A0D4] transition-colors" />
                    </button>
                </div>
            </div>

            {/* Premium Desktop Table Layout */}
            <div className="hidden xl:block bg-white/50 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                {/* Table Header */}
                <div className="grid grid-cols-[1.5fr_2fr_3fr_1.5fr_1fr_0.5fr] bg-gradient-to-r from-[#1D4171] to-[#153156] text-white p-5 uppercase tracking-[0.2em] text-[10px] font-black rounded-t-[2rem] shadow-inner">
                    <div className="px-5">AGENCY / DATE</div>
                    <div className="px-5">FLIGHT DETAILS</div>
                    <div className="px-5">PASSENGER DETAILS</div>
                    <div className="px-5">AMOUNT / PAYMENT</div>
                    <div className="px-5 text-center">STATUS</div>
                    <div className="px-5 text-center">ACTIONS</div>
                </div>

                {/* Table Body */}
                <div className="flex flex-col p-5 gap-5 bg-slate-50/50">
                    {filteredBookings.map((booking, idx) => {
                        const firstPassenger = booking.passengers?.[0];
                        const additionalPassengersCount = Math.max(0, (booking.passengers?.length || 0) - 1);
                        const isConfirmed = booking.status === 'Confirmed';
                        const isCancelled = booking.status === 'Cancelled';

                        return (
                            <div 
                                key={booking._id} 
                                className="grid grid-cols-[1.5fr_2fr_3fr_1.5fr_1fr_0.5fr] bg-white rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 p-5 items-stretch hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:border-slate-200 transition-all duration-300 group"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                {/* AGENCY / DATE */}
                                <div className="px-5 py-3 border-r border-slate-100 flex flex-col justify-center group-hover:border-slate-200 transition-colors">
                                    <p className="font-black text-[#1D4171] text-lg mb-4 leading-tight">{booking.agentId?.agencyName || 'Agency Name'}</p>
                                    
                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-3 text-slate-500 bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                                            <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                                <FaCalendarAlt className="text-[#48A0D4] text-xs" />
                                            </div>
                                            <span className="text-xs font-bold">{new Date(booking.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-500 bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                                            <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                                <FaClock className="text-[#48A0D4] text-xs" />
                                            </div>
                                            <span className="text-xs font-bold">{new Date(booking.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-[11px] font-black text-slate-400 mt-5 uppercase tracking-widest">
                                        Req ID: <span className="text-[#1D4171] bg-slate-100 px-2 py-1 rounded-md">#{booking._id.substring(booking._id.length - 6).toUpperCase()}</span>
                                    </p>
                                </div>

                                {/* FLIGHT DETAILS */}
                                <div className="px-5 py-3 border-r border-slate-100 flex flex-col justify-center">
                                    <div className="flex justify-between items-center mb-5 bg-orange-50/50 p-2.5 rounded-2xl border border-orange-100/50">
                                        <div className="text-rose-600 font-black text-lg italic tracking-tight">
                                            {booking.flightId?.airlineName || 'Airline'}
                                        </div>
                                        <div className="bg-gradient-to-r from-orange-400 to-rose-400 text-white px-3 py-1 rounded-xl text-xs font-black shadow-md shadow-orange-500/20">
                                            {booking.flightId?.flightNumber}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mb-6 px-3">
                                        <div className="font-black text-2xl text-[#1D4171]">{booking.flightId?.fromCity?.substring(0, 3).toUpperCase() || 'BOM'}</div>
                                        <div className="flex-1 px-4 flex justify-center items-center relative">
                                            <div className="h-[2px] w-full bg-slate-200 absolute border-dashed border-t-2 border-slate-300"></div>
                                            <div className="bg-white p-2 rounded-full z-10 shadow-sm border border-slate-100">
                                                <FaPlane className="text-[#48A0D4] text-lg group-hover:text-[#F07E21] transition-colors" />
                                            </div>
                                        </div>
                                        <div className="font-black text-2xl text-[#1D4171]">{booking.flightId?.toCity?.substring(0, 3).toUpperCase() || 'DXB'}</div>
                                    </div>

                                    <div className="grid grid-cols-[100px_1fr] gap-y-3 text-xs bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                                        <div className="text-slate-400 font-black uppercase tracking-wider text-[10px]">Travel Date</div>
                                        <div className="font-bold text-[#1D4171]">{new Date(booking.flightId?.departureDate || Date.now()).toLocaleDateString()}</div>
                                        
                                        <div className="text-slate-400 font-black uppercase tracking-wider text-[10px]">Dep Time</div>
                                        <div className="font-bold text-[#1D4171]">{booking.flightId?.departureTime || 'N/A'}</div>
                                        
                                        <div className="text-slate-400 font-black uppercase tracking-wider text-[10px]">Sector</div>
                                        <div className="font-bold text-[#1D4171]">{booking.flightId?.fromCity} → {booking.flightId?.toCity}</div>
                                    </div>
                                </div>

                                {/* PASSENGER DETAILS */}
                                <div className="px-5 py-2 border-r border-slate-100">
                                    <div className="bg-gradient-to-br from-blue-50/40 to-slate-50/80 border border-blue-100/50 rounded-2xl p-5 h-full relative overflow-hidden group/pass">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/30 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover/pass:scale-150 duration-700"></div>
                                        
                                        <div className="flex items-center justify-between mb-5 border-b border-blue-100/50 pb-3 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
                                                    <FaUser className="text-xs" />
                                                </div>
                                                <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.15em]">PASSENGER DETAILS</h3>
                                            </div>
                                            {booking.passengers && booking.passengers.length > 0 && (
                                                <button onClick={() => handleCopyPassengers(booking)} className="text-[#48A0D4] hover:text-[#1D4171] bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm transition-colors active:scale-95" title="Copy all passengers">
                                                    <FaCopy className="text-xs" />
                                                </button>
                                            )}
                                        </div>

                                        {firstPassenger ? (
                                            <>
                                                <div className="grid grid-cols-[100px_1fr] gap-y-2.5 text-xs relative z-10 items-center">
                                                    <span className="text-slate-500 font-medium text-[11px]">First Name</span>
                                                    <span className="font-black text-[#1D4171]">{firstPassenger.firstName || firstPassenger.name}</span>
                                                    
                                                    <span className="text-slate-500 font-medium text-[11px]">Last Name</span>
                                                    <span className="font-black text-[#1D4171]">{firstPassenger.lastName || '-'}</span>
                                                    
                                                    <span className="text-slate-500 font-medium text-[11px]">Date of Birth</span>
                                                    <span className="font-bold text-slate-700">{firstPassenger.dob || '-'}</span>
                                                    
                                                    <span className="text-slate-500 font-medium text-[11px]">Gender</span>
                                                    <span className="font-bold text-slate-700">{firstPassenger.gender || '-'}</span>
                                                    
                                                    {booking.isInternational && (
                                                        <>
                                                            <span className="text-slate-500 font-medium text-[11px]">Passport No.</span>
                                                            <span className="font-bold text-slate-800">{firstPassenger.passportNumber || '-'}</span>
                                                            
                                                            <span className="text-slate-500 font-medium text-[11px]">Nationality</span>
                                                            <span className="font-bold text-slate-700">{firstPassenger.nationality || '-'}</span>
                                                        </>
                                                    )}
                                                </div>
                                                {additionalPassengersCount > 0 && (
                                                    <div className="mt-5 text-[11px] font-black text-blue-600 bg-blue-100/50 inline-block px-3 py-1.5 rounded-lg border border-blue-200/50">
                                                        + {additionalPassengersCount} more passenger{additionalPassengersCount > 1 ? 's' : ''}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-xs text-slate-500 italic mt-4">No passenger details available.</div>
                                        )}
                                    </div>
                                </div>

                                {/* AMOUNT / PAYMENT */}
                                <div className="px-5 py-3 border-r border-slate-100 flex flex-col justify-center">
                                    <div className="text-3xl font-black text-[#1D4171] mb-4 tracking-tight">₹{booking.totalFare?.toLocaleString() || 0}</div>
                                    
                                    <div className="mb-5">
                                        {booking.paymentVerified ? (
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase border border-emerald-200 shadow-sm">
                                                <div className="bg-emerald-500 text-white p-0.5 rounded-full">
                                                    <FaCheck className="text-[8px]" />
                                                </div> 
                                                VERIFIED
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-black uppercase border border-amber-200 shadow-sm">
                                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                                PENDING
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-slate-400 font-black text-[9px] uppercase tracking-widest">Payment Mode</span>
                                            <span className="font-bold text-slate-700">Online</span>
                                        </div>
                                        {booking.pnr && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-slate-400 font-black text-[9px] uppercase tracking-widest">PNR</span>
                                                <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                                    <span className="font-black text-[#1D4171] uppercase tracking-widest text-sm">{booking.pnr}</span>
                                                    <button onClick={() => copyToClipboard(booking.pnr)} className="text-[#48A0D4] hover:text-[#1D4171] hover:bg-slate-100 rounded p-1.5 transition-all ml-auto active:scale-95">
                                                        <FaCopy />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* STATUS */}
                                <div className="px-5 py-3 flex flex-col justify-center items-center">
                                    <span className={`inline-block px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] mb-5 border shadow-sm ${
                                        isConfirmed ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200' :
                                        isCancelled ? 'bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 border-rose-200' :
                                        'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200'
                                    }`}>
                                        {booking.status}
                                    </span>

                                    {(isConfirmed || isCancelled) && (
                                        <div className="text-center text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100 w-full">
                                            <span className="text-slate-400 font-black text-[9px] uppercase tracking-widest block mb-1">
                                                {isConfirmed ? 'Confirmed On' : 'Cancelled On'}
                                            </span>
                                            <span className="font-bold text-[#1D4171] block">
                                                {new Date(booking.updatedAt || booking.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="font-bold text-[#1D4171] block">
                                                {new Date(booking.updatedAt || booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}
                                    {booking.status === 'Pending' && !booking.paymentVerified && (
                                        <button 
                                            onClick={() => handleVerifyPayment(booking._id)}
                                            className="mt-3 bg-gradient-to-r from-[#1D4171] to-[#153054] text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all w-full text-center"
                                        >
                                            Verify Pay
                                        </button>
                                    )}
                                    {booking.status === 'Pending' && booking.paymentVerified && (
                                        <button 
                                            onClick={() => handleOpenConfirmModal(booking)}
                                            className="mt-3 bg-gradient-to-r from-[#F07E21] to-[#d96d1a] text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-orange-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all w-full text-center"
                                        >
                                            Issue Ticket
                                        </button>
                                    )}
                                </div>

                                {/* ACTIONS */}
                                <div className="px-5 py-3 flex flex-col justify-center gap-3">
                                    <button onClick={() => handleViewClick(booking)} className="flex items-center justify-center gap-2 border-2 border-slate-200 bg-white hover:border-[#48A0D4] hover:text-[#48A0D4] text-slate-600 rounded-xl py-3 px-4 text-xs font-black transition-all w-full active:scale-95 group/btn">
                                        <FaEye className="group-hover/btn:scale-110 transition-transform" /> View
                                    </button>
                                    <button onClick={() => handlePrintClick(booking)} className="flex items-center justify-center gap-2 border-2 border-slate-200 bg-white hover:border-[#1D4171] hover:text-[#1D4171] text-slate-600 rounded-xl py-3 px-4 text-xs font-black transition-all w-full active:scale-95 group/btn">
                                        <FaPrint className="group-hover/btn:scale-110 transition-transform" /> Print
                                    </button>
                                    {booking.status === 'Pending' && (
                                        <button 
                                            onClick={() => handleCancelClick(booking)}
                                            className="flex items-center justify-center gap-2 border-2 border-rose-100 bg-rose-50 hover:bg-rose-500 hover:border-rose-500 hover:text-white text-rose-600 rounded-xl py-3 px-4 text-xs font-black transition-all w-full active:scale-95 mt-2"
                                        >
                                            <FaUndo /> Refund
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {filteredBookings.length === 0 && (
                        <div className="py-20 text-center flex flex-col items-center">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <FaPlane className="text-slate-300 text-4xl" />
                            </div>
                            <h3 className="text-xl font-black text-[#1D4171] mb-2">No Requests Found</h3>
                            <p className="text-slate-500 font-medium">There are no fixed departure bookings matching your search.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile View Layout (Shows on screens smaller than xl) */}
            {/* Mobile View Layout (Shows on screens smaller than xl) */}
            <div className="xl:hidden flex flex-col gap-6">
                {filteredBookings.map((booking, idx) => {
                    const firstPassenger = booking.passengers?.[0];
                    const additionalPassengersCount = Math.max(0, (booking.passengers?.length || 0) - 1);
                    const isConfirmed = booking.status === 'Confirmed';
                    const isCancelled = booking.status === 'Cancelled';

                    return (
                        <div 
                            key={booking._id} 
                            className="bg-white rounded-[2rem] shadow-lg border border-slate-100 p-5 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            {/* Status Pill Absolute */}
                            <div className="absolute top-4 right-4 z-10">
                                <span className={`inline-block px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                                    isConfirmed ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200' :
                                    isCancelled ? 'bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 border-rose-200' :
                                    'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200'
                                }`}>
                                    {booking.status}
                                </span>
                            </div>
                            
                            {/* AGENCY / DATE */}
                            <div className="mb-5 pr-20">
                                <h3 className="font-black text-[#1D4171] text-xl mb-2">{booking.agentId?.agencyName || 'Agency Name'}</h3>
                                <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                                        <FaCalendarAlt className="text-[#48A0D4] text-xs" />
                                        <span className="text-[10px] font-bold text-slate-600">{new Date(booking.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                                        <FaClock className="text-[#48A0D4] text-xs" />
                                        <span className="text-[10px] font-bold text-slate-600">{new Date(booking.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                                <div className="mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Req ID: <span className="text-[#1D4171] bg-slate-50 px-2 py-1 rounded-md border border-slate-100">#{booking._id.substring(booking._id.length - 6).toUpperCase()}</span>
                                </div>
                            </div>

                            {/* FLIGHT DETAILS */}
                            <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
                                <div className="flex justify-between items-center mb-4 bg-orange-50/50 p-2 rounded-xl border border-orange-100/50">
                                    <div className="text-rose-600 font-black text-sm italic tracking-tight px-2">
                                        {booking.flightId?.airlineName || 'Airline'}
                                    </div>
                                    <div className="bg-gradient-to-r from-orange-400 to-rose-400 text-white px-3 py-1 rounded-lg text-[10px] font-black shadow-sm">
                                        {booking.flightId?.flightNumber}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="font-black text-xl text-[#1D4171]">{booking.flightId?.fromCity?.substring(0, 3).toUpperCase() || 'BOM'}</div>
                                    <div className="flex-1 px-4 flex justify-center items-center relative">
                                        <div className="h-[2px] w-full bg-slate-200 absolute border-dashed border-t-2 border-slate-300"></div>
                                        <div className="bg-white p-1.5 rounded-full z-10 shadow-sm border border-slate-100">
                                            <FaPlane className="text-[#48A0D4] text-sm" />
                                        </div>
                                    </div>
                                    <div className="font-black text-xl text-[#1D4171]">{booking.flightId?.toCity?.substring(0, 3).toUpperCase() || 'DXB'}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-100">
                                    <div>
                                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Travel Date</div>
                                        <div className="text-xs font-bold text-[#1D4171]">{new Date(booking.flightId?.departureDate || Date.now()).toLocaleDateString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Dep Time</div>
                                        <div className="text-xs font-bold text-[#1D4171]">{booking.flightId?.departureTime || 'N/A'}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Sector</div>
                                        <div className="text-xs font-bold text-[#1D4171]">{booking.flightId?.fromCity} → {booking.flightId?.toCity}</div>
                                    </div>
                                </div>
                            </div>

                            {/* PASSENGER DETAILS */}
                            <div className="bg-gradient-to-br from-blue-50/40 to-slate-50/80 rounded-2xl p-4 mb-5 border border-blue-100/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/30 rounded-full blur-xl -mr-8 -mt-8"></div>
                                <div className="flex items-center justify-between mb-3 border-b border-blue-100/50 pb-2 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                                            <FaUser className="text-[10px]" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-widest">PASSENGERS ({booking.passengers?.length || 0})</h3>
                                    </div>
                                    {booking.passengers && booking.passengers.length > 0 && (
                                        <button onClick={() => handleCopyPassengers(booking)} className="text-[#48A0D4] hover:text-[#1D4171] bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm transition-colors active:scale-95">
                                            <FaCopy className="text-xs" />
                                        </button>
                                    )}
                                </div>
                                {firstPassenger ? (
                                    <div>
                                        <div className="grid grid-cols-[100px_1fr] gap-y-2.5 relative z-10 items-center text-xs">
                                            <span className="text-slate-500 font-medium text-[11px]">First Name</span>
                                            <span className="font-black text-[#1D4171]">{firstPassenger.firstName || firstPassenger.name}</span>
                                            
                                            <span className="text-slate-500 font-medium text-[11px]">Last Name</span>
                                            <span className="font-black text-[#1D4171]">{firstPassenger.lastName || '-'}</span>
                                            
                                            <span className="text-slate-500 font-medium text-[11px]">Date of Birth</span>
                                            <span className="font-bold text-slate-700">{firstPassenger.dob || '-'}</span>
                                            
                                            <span className="text-slate-500 font-medium text-[11px]">Gender</span>
                                            <span className="font-bold text-slate-700">{firstPassenger.gender || '-'}</span>
                                            
                                            {booking.isInternational && (
                                                <>
                                                    <span className="text-slate-500 font-medium text-[11px]">Passport No.</span>
                                                    <span className="font-bold text-slate-800">{firstPassenger.passportNumber || '-'}</span>
                                                    
                                                    <span className="text-slate-500 font-medium text-[11px]">Nationality</span>
                                                    <span className="font-bold text-slate-700">{firstPassenger.nationality || '-'}</span>
                                                </>
                                            )}
                                        </div>
                                        {additionalPassengersCount > 0 && (
                                            <div className="mt-3 text-[10px] font-black text-blue-600 bg-blue-100/50 self-start inline-block px-3 py-1.5 rounded-lg border border-blue-200/50">
                                                + {additionalPassengersCount} more passenger{additionalPassengersCount > 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-500 italic">No passenger details available.</div>
                                )}
                            </div>

                            {/* AMOUNT & PNR */}
                            <div className="flex justify-between items-end mb-5">
                                <div>
                                    <div className="text-3xl font-black text-[#1D4171] tracking-tight mb-2">₹{booking.totalFare?.toLocaleString() || 0}</div>
                                    {booking.paymentVerified ? (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase border border-emerald-200 shadow-sm">
                                            <div className="bg-emerald-500 text-white p-0.5 rounded-full">
                                                <FaCheck className="text-[6px]" />
                                            </div> 
                                            VERIFIED
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-black uppercase border border-amber-200 shadow-sm">
                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                            PENDING
                                        </div>
                                    )}
                                </div>
                                <div className="items-end">
                                    {booking.pnr && (
                                        <div>
                                            <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest text-right mb-1">PNR</div>
                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-sm">
                                                <span className="font-black text-[#1D4171] text-sm uppercase tracking-widest">{booking.pnr}</span>
                                                <button onClick={() => copyToClipboard(booking.pnr)} className="text-[#48A0D4] hover:text-[#1D4171] transition-colors">
                                                    <FaCopy />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ACTIONS */}
                            <div className="flex flex-col gap-3">
                                {booking.status === 'Pending' && (
                                    <div className="flex gap-3">
                                        {!booking.paymentVerified ? (
                                            <button onClick={() => handleVerifyPayment(booking._id)} className="flex-1 bg-gradient-to-r from-[#1D4171] to-[#153054] text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">Verify Payment</button>
                                        ) : (
                                            <button onClick={() => handleOpenConfirmModal(booking)} className="flex-1 bg-gradient-to-r from-[#F07E21] to-[#d96d1a] text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-orange-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all">Issue Ticket</button>
                                        )}
                                        <button onClick={() => handleCancelClick(booking)} className="px-4 bg-rose-50 text-rose-600 border border-rose-200 py-3 rounded-xl font-black text-xs uppercase shadow-sm hover:bg-rose-500 hover:text-white transition-all"><FaUndo /></button>
                                    </div>
                                )}
                                
                                <div className="flex gap-3">
                                    <button onClick={() => handleViewClick(booking)} className="flex-1 flex items-center justify-center gap-2 border-2 border-slate-200 bg-white hover:border-[#48A0D4] hover:text-[#48A0D4] text-slate-600 rounded-xl py-3 text-[10px] uppercase font-black transition-all active:scale-95 group/btn">
                                        <FaEye className="group-hover/btn:scale-110 transition-transform" /> View
                                    </button>
                                    <button onClick={() => handlePrintClick(booking)} className="flex-1 flex items-center justify-center gap-2 border-2 border-slate-200 bg-white hover:border-[#1D4171] hover:text-[#1D4171] text-slate-600 rounded-xl py-3 text-[10px] uppercase font-black transition-all active:scale-95 group/btn">
                                        <FaPrint className="group-hover/btn:scale-110 transition-transform" /> Print
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination Footer */}
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div>Showing <span className="font-bold text-[#1D4171]">{filteredBookings.length}</span> requests</div>
                <div className="flex gap-2">
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 transition-colors">&lt;</button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-b from-[#1D4171] to-[#153156] text-white font-black shadow-md">1</button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 transition-colors">&gt;</button>
                </div>
            </div>

            {/* Modals remain structurally same but visually enhanced */}
            {/* Confirmation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="bg-gradient-to-r from-[#F07E21] to-[#d96d1a] p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-black tracking-wide">Issue Ticket</h2>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-slate-50 p-5 rounded-2xl flex items-center gap-5 border border-slate-100 shadow-inner">
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center text-2xl border border-slate-50">
                                    ✈️
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confirming for</p>
                                    <p className="font-black text-[#1D4171] text-lg leading-tight">{selectedBooking?.flightId?.flightNumber}</p>
                                    <p className="font-bold text-[#F07E21] text-xs">{selectedBooking?.flightId?.fromCity} → {selectedBooking?.flightId?.toCity}</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enter GDS PNR</label>
                                    <div className="relative group">
                                        <FaIdCard className="absolute left-5 top-1/2 -translate-y-1/2 text-[#48A0D4] text-lg group-focus-within:scale-110 transition-transform" />
                                        <input 
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 pl-14 pr-4 py-4 rounded-2xl font-black text-lg focus:ring-4 ring-[#48A0D4]/20 focus:border-[#48A0D4] outline-none transition-all shadow-inner uppercase placeholder:normal-case placeholder:text-slate-300"
                                            placeholder="e.g. ABCDEF"
                                            value={pnr}
                                            onChange={e => setPnr(e.target.value.toUpperCase())}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ticket Number</label>
                                    <div className="relative group">
                                        <FaTicketAlt className="absolute left-5 top-1/2 -translate-y-1/2 text-[#48A0D4] text-lg group-focus-within:scale-110 transition-transform" />
                                        <input 
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 pl-14 pr-4 py-4 rounded-2xl font-black text-lg focus:ring-4 ring-[#48A0D4]/20 focus:border-[#48A0D4] outline-none transition-all shadow-inner placeholder:text-slate-300"
                                            placeholder="e.g. 098-1234567890"
                                            value={ticketNumber}
                                            onChange={e => setTicketNumber(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleConfirm}
                                className="w-full bg-gradient-to-r from-[#1D4171] to-[#153156] text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 hover:-translate-y-1 hover:shadow-2xl transition-all flex items-center justify-center gap-3 mt-4"
                            >
                                <FaCheck /> Confirm & Issue Ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Cancel Modal with similar enhanced UI */}
            {isCancelModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="bg-gradient-to-r from-rose-500 to-red-600 p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-black tracking-wide flex items-center gap-3"><FaUndo /> Refund & Cancel</h2>
                            <button onClick={() => setIsCancelModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-rose-50 p-5 rounded-2xl flex items-center gap-5 border border-rose-100 shadow-inner">
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center text-2xl border border-rose-50">
                                    ⚠️
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Confirm Refund For</p>
                                    <p className="font-black text-rose-700 text-lg leading-tight">{selectedCancelBooking?.flightId?.flightNumber}</p>
                                    <p className="font-bold text-rose-500 text-xs">{selectedCancelBooking?.flightId?.fromCity} → {selectedCancelBooking?.flightId?.toCity}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason / Remarks (Optional)</label>
                                <textarea 
                                    className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl font-bold text-sm focus:ring-4 ring-rose-400/20 focus:border-rose-400 outline-none resize-none h-32 shadow-inner placeholder:text-slate-300 transition-all"
                                    placeholder="E.g., Flight fully booked, Price changed..."
                                    value={cancelRemarks}
                                    onChange={e => setCancelRemarks(e.target.value)}
                                ></textarea>
                                <p className="text-[10px] font-bold text-slate-400 ml-1">This message will be shown to the agent in their dashboard.</p>
                            </div>

                            <button 
                                onClick={submitCancel}
                                className="w-full bg-gradient-to-r from-rose-500 to-red-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-red-500/20 hover:-translate-y-1 hover:shadow-2xl transition-all flex items-center justify-center gap-3 mt-4"
                            >
                                <FaUndo /> Confirm Refund
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details / Print Modal */}
            {isViewModalOpen && selectedViewBooking && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300 print:bg-white print:fixed print:inset-0 print:block print:p-0">
                    <div className="bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 print:shadow-none print:max-h-none print:w-full print:rounded-none">
                        
                        {/* Header Area */}
                        <div className="bg-gradient-to-r from-[#0B1A30] via-[#1D4171] to-[#25528a] p-8 flex justify-between items-start text-white shadow-md z-10 relative print:bg-white print:border-b-2 print:border-black print:pb-4">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight mb-2 uppercase print:text-black">Request #{selectedViewBooking._id.substring(selectedViewBooking._id.length - 8)}</h2>
                                <p className="text-slate-300 font-bold print:text-slate-800">Submitted on {new Date(selectedViewBooking.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-3 print:hidden">
                                <button onClick={() => window.print()} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl font-black flex items-center gap-2 transition-all backdrop-blur-sm shadow-sm hover:shadow-md">
                                    <FaPrint /> Print
                                </button>
                                <button onClick={() => setIsViewModalOpen(false)} className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 border border-rose-500/30 px-4 py-2 rounded-xl font-black transition-all backdrop-blur-sm shadow-sm hover:shadow-md">
                                    <FaTimes /> Close
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 print:p-4">
                            
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:grid-cols-3 print:gap-4">
                                <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] print:border-slate-300">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 print:text-slate-600">Agency Name</p>
                                    <p className="text-xl font-black text-[#1D4171] print:text-black">{selectedViewBooking.agentId?.agencyName || 'N/A'}</p>
                                </div>
                                <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] print:border-slate-300">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 print:text-slate-600">Total Fare</p>
                                    <p className="text-2xl font-black text-[#1D4171] print:text-black">₹{selectedViewBooking.totalFare?.toLocaleString()}</p>
                                </div>
                                <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] print:border-slate-300">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 print:text-slate-600">Status</p>
                                    <p className="text-xl font-black uppercase text-[#F07E21] print:text-black">{selectedViewBooking.status}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-6">
                                {/* Flight Details */}
                                <div>
                                    <div className="flex items-center gap-3 mb-5 border-b border-slate-200 pb-3 print:border-black">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-[#1D4171] shadow-sm print:bg-white print:border print:border-black">
                                            <FaPlane size={14} />
                                        </div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest print:text-black">Flight Itinerary</h3>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-2xl p-6 print:border-black">
                                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                            <p className="text-rose-600 font-black italic">{selectedViewBooking.flightId?.airlineName}</p>
                                            <p className="bg-slate-100 px-3 py-1 rounded-md font-bold text-slate-700 text-sm">{selectedViewBooking.flightId?.flightNumber}</p>
                                        </div>
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="text-center">
                                                <p className="text-3xl font-black text-[#1D4171] print:text-black">{selectedViewBooking.flightId?.fromCity?.substring(0,3).toUpperCase()}</p>
                                                <p className="text-xs font-bold text-slate-500 uppercase mt-1">{selectedViewBooking.flightId?.fromCity}</p>
                                            </div>
                                            <FaPlane className="text-slate-300 text-2xl mx-4" />
                                            <div className="text-center">
                                                <p className="text-3xl font-black text-[#1D4171] print:text-black">{selectedViewBooking.flightId?.toCity?.substring(0,3).toUpperCase()}</p>
                                                <p className="text-xs font-bold text-slate-500 uppercase mt-1">{selectedViewBooking.flightId?.toCity}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl print:bg-white print:border print:border-slate-200">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Departure Date</p>
                                                <p className="font-bold text-[#1D4171] print:text-black">{new Date(selectedViewBooking.flightId?.departureDate).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</p>
                                                <p className="font-bold text-[#1D4171] print:text-black">{selectedViewBooking.flightId?.departureTime}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Details */}
                                <div>
                                    <div className="flex items-center gap-3 mb-5 border-b border-slate-200 pb-3 print:border-black">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center text-emerald-600 shadow-sm print:bg-white print:border print:border-black">
                                            <FaIdCard size={14} />
                                        </div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest print:text-black">Payment & Ticket</h3>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-2xl p-6 print:border-black">
                                        <div className="mb-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Status</p>
                                            <p className="font-bold text-lg">{selectedViewBooking.paymentVerified ? <span className="text-emerald-600">Verified</span> : <span className="text-amber-600">Pending</span>}</p>
                                        </div>
                                        <div className="mb-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">PNR</p>
                                            <p className="font-bold text-xl uppercase tracking-widest text-[#1D4171] print:text-black">{selectedViewBooking.pnr || 'Not Issued'}</p>
                                        </div>
                                        <div className="mb-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket Number</p>
                                            <p className="font-bold text-lg tracking-widest text-[#1D4171] print:text-black">{selectedViewBooking.ticketNumber || 'Not Issued'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* All Passengers */}
                            <div className="mt-8">
                                <div className="flex items-center gap-3 mb-5 border-b border-slate-200 pb-3 print:border-black">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-50 to-fuchsia-100 flex items-center justify-center text-purple-600 shadow-sm print:bg-white print:border print:border-black">
                                        <FaUser size={14} />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest print:text-black">All Passengers</h3>
                                </div>
                                <div className="space-y-4">
                                    {selectedViewBooking.passengers?.map((p, i) => (
                                        <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap lg:flex-nowrap gap-6 items-start print:border-black print:bg-white">
                                            <div className="bg-[#1D4171] text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-xs print:bg-slate-200 print:text-black border print:border-black shrink-0">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-4 text-sm">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-slate-600">Name & Type</p>
                                                    <p className="font-bold text-[#1D4171] print:text-black">{p.firstName} {p.lastName}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{p.passengerType || 'Adult'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-slate-600">DOB / Gender</p>
                                                    <p className="font-bold text-[#1D4171] print:text-black">{p.dob} • {p.gender}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-slate-600">Contact</p>
                                                    <p className="font-bold text-[#1D4171] print:text-black">{p.mobileNumber || 'N/A'}</p>
                                                    <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[120px]" title={p.email}>{p.email || 'N/A'}</p>
                                                </div>
                                                {selectedViewBooking.isInternational && (
                                                    <>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-slate-600">Passport / Nationality</p>
                                                            <p className="font-bold text-[#1D4171] print:text-black">{p.passportNumber || 'N/A'} <span className="text-slate-500 font-normal">({p.nationality || 'IN'})</span></p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-slate-600">Passport Expiry</p>
                                                            <p className="font-bold text-[#1D4171] print:text-black">{p.passportExpiry || 'N/A'}</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {(!selectedViewBooking.passengers || selectedViewBooking.passengers.length === 0) && (
                                        <p className="text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">No passengers added to this request.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FixedDepartureBookingManager;
