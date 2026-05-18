import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import { FaTicketAlt, FaCheck, FaTimes, FaSearch, FaUser, FaPlane, FaIdCard } from 'react-icons/fa';

const FixedDepartureBookingManager = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [pnr, setPnr] = useState('');
    const [ticketNumber, setTicketNumber] = useState('');
    const [filter, setFilter] = useState('');

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

    const handleCancel = async (id) => {
        if (window.confirm('Are you sure you want to cancel this booking and refund the agent?')) {
            try {
                await adminService.cancelFixedDepartureBooking(id);
                toast.success('Booking cancelled and agent refunded');
                fetchBookings();
            } catch (error) {
                toast.error('Cancellation failed');
            }
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

    const filteredBookings = bookings.filter(b => 
        b.agentId?.agencyName?.toLowerCase().includes(filter.toLowerCase()) ||
        b.pnr?.toLowerCase().includes(filter.toLowerCase()) ||
        b.flightId?.flightNumber?.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center">Loading bookings...</div>;

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#1D4171] dark:text-white">Fixed Departure Requests</h1>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm">Process and confirm agent booking requests.</p>
                </div>
                <div className="relative w-full sm:w-auto">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search by agency, PNR, flight..."
                        className="pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm font-bold w-full sm:w-80 text-sm outline-none focus:border-[#1D4171]"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead className="bg-[#1D4171] text-white">
                            <tr>
                                <th className="p-6 font-black uppercase text-[10px] tracking-widest">Agency / Date</th>
                                <th className="p-6 font-black uppercase text-[10px] tracking-widest">Flight Details</th>
                                <th className="p-6 font-black uppercase text-[10px] tracking-widest">Passengers</th>
                                <th className="p-6 font-black uppercase text-[10px] tracking-widest">Amount / Payment</th>
                                <th className="p-6 font-black uppercase text-[10px] tracking-widest">Status</th>
                                <th className="p-6 font-black uppercase text-[10px] tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredBookings.map(booking => (
                                <tr key={booking._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6">
                                        <p className="font-black text-[#1D4171]">{booking.agentId?.agencyName}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(booking.createdAt).toLocaleString()}</p>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-[#1D4171]">
                                                <FaPlane />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm">{booking.flightId?.flightNumber}</p>
                                                <p className="text-[10px] font-bold text-[#F07E21] uppercase">{booking.flightId?.fromCity} → {booking.flightId?.toCity}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="space-y-3">
                                            {booking.passengers.map((p, i) => (
                                                <div key={i} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <FaUser className="text-[10px] text-slate-400" />
                                                        <span className="text-xs font-black text-slate-800">{p.firstName || p.name} {p.lastName || ''} ({p.gender.charAt(0)})</span>
                                                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">DOB: {p.dob || 'N/A'} ({p.age} yrs)</span>
                                                    </div>
                                                    {(p.mobileNumber || p.email) && (
                                                        <div className="text-[10px] font-medium text-slate-600 pl-4 pt-1 border-t border-slate-200/60 flex flex-wrap gap-x-3">
                                                            {p.mobileNumber && <span>📞 {p.mobileNumber}</span>}
                                                            {p.email && <span>✉️ {p.email}</span>}
                                                        </div>
                                                    )}
                                                    {booking.isInternational && p.passportNumber && (
                                                        <div className="text-[10px] font-bold text-[#1D4171] pl-4 pt-1 flex flex-wrap gap-x-3 bg-blue-50/50 p-1 rounded-lg">
                                                            <span>🛂 {p.passportNumber}</span>
                                                            <span>Exp: {p.passportExpiry}</span>
                                                            <span>Nationality: {p.nationality}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p className="font-black text-[#1D4171]">₹{booking.totalFare}</p>
                                        <div className="mt-1">
                                            {booking.paymentVerified ? (
                                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                                                    <FaCheck className="text-[9px]" /> Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                                                    ⚠️ Pending Verification
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                            booking.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' :
                                            booking.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                                            'bg-red-50 text-red-600'
                                        }`}>
                                            {booking.status}
                                        </div>
                                        {booking.pnr && (
                                            <p className="text-[10px] font-black text-[#1D4171] mt-1">PNR: {booking.pnr}</p>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        <div className="flex gap-2 items-center flex-wrap">
                                            {booking.status === 'Pending' && (
                                                <>
                                                    {!booking.paymentVerified && (
                                                        <button 
                                                            onClick={() => handleVerifyPayment(booking._id)}
                                                            className="bg-[#1D4171] text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#153054] transition-all flex items-center gap-1 shadow-sm touch-target"
                                                            title="Verify Wallet Deduction"
                                                        >
                                                            <FaCheck /> Verify Payment
                                                        </button>
                                                    )}
                                                    {booking.paymentVerified && (
                                                        <button 
                                                            onClick={() => handleOpenConfirmModal(booking)}
                                                            className="bg-[#F07E21] text-white p-3 rounded-xl hover:bg-[#d96d1a] transition-all shadow-sm touch-target"
                                                            title="Confirm & Enter PNR"
                                                        >
                                                            <FaCheck /> Issue Ticket
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleCancel(booking._id)}
                                                        className="bg-red-50 text-red-600 p-3 rounded-xl hover:bg-red-100 transition-all shadow-sm touch-target"
                                                        title="Reject & Refund"
                                                    >
                                                        <FaTimes /> Reject
                                                    </button>
                                                </>
                                            )}
                                            {booking.status === 'Confirmed' && (
                                                <div className="text-[#48A0D4] text-xl" title="Ticket Issued">
                                                    <FaTicketAlt />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirmation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="bg-[#F07E21] p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-black">Issue Ticket</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-2xl">&times;</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl">
                                    ✈️
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirming for</p>
                                    <p className="font-black text-[#1D4171]">{selectedBooking?.flightId?.flightNumber} | {selectedBooking?.flightId?.fromCity} → {selectedBooking?.flightId?.toCity}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enter GDS PNR</label>
                                    <div className="relative">
                                        <FaIdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-[#48A0D4]" />
                                        <input 
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-2xl font-black text-lg focus:ring-2 ring-[#48A0D4] outline-none"
                                            placeholder="e.g. ABCDEF"
                                            value={pnr}
                                            onChange={e => setPnr(e.target.value.toUpperCase())}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket Number</label>
                                    <div className="relative">
                                        <FaTicketAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-[#48A0D4]" />
                                        <input 
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-2xl font-black text-lg focus:ring-2 ring-[#48A0D4] outline-none"
                                            placeholder="e.g. 098-1234567890"
                                            value={ticketNumber}
                                            onChange={e => setTicketNumber(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleConfirm}
                                className="w-full bg-[#1D4171] text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-[#153156] transition-all flex items-center justify-center gap-2"
                            >
                                <FaCheck /> Confirm & Issue Ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FixedDepartureBookingManager;
