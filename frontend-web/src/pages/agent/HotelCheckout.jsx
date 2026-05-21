import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import hotelGraphic from '../../assets/hotel_graphic.png';

const HotelCheckout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Fallback data if accessed directly
    const hotel = location.state?.hotel || {
        name: 'The Grand Palace',
        location: 'Andheri East, Mumbai',
        image: hotelGraphic,
        stars: '⭐⭐⭐⭐',
        price: 10000,
        taxes: 1800,
        fees: 200
    };

    const searchParams = location.state?.search || {
        checkIn: '2025-05-12',
        checkOut: '2025-05-14',
        rooms: 1,
        adults: 1
    };

    const totalAmount = hotel.price + hotel.taxes + hotel.fees;
    const [agentInfo, setAgentInfo] = useState(null);

    useEffect(() => {
        const storedInfo = localStorage.getItem('agentInfo');
        if (storedInfo) {
            try { setAgentInfo(JSON.parse(storedInfo)); } catch (e) {}
        }
    }, []);

    const handleProceed = () => {
        toast.success('Successfully proceeded to Add-ons!');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Select Date';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="bg-[#F4F7FE] min-h-screen pb-10 font-sans animate-fade-in -mt-6">
            {/* Header Section */}
            <div className="relative pt-12 pb-32 px-4 rounded-b-[3rem] bg-gradient-to-r from-[#0B1A42] to-[#0A2670] overflow-hidden">
                {/* Decorative lines/stars */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                
                <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
                    <div className="md:w-1/2">
                        <div className="inline-flex items-center gap-2 bg-[#2D5A9E]/40 border border-white/10 rounded-lg px-3 py-1.5 mb-6 shadow-inner">
                            <span className="text-white text-xs">🏨</span>
                            <span className="text-white text-[10px] font-black tracking-wide uppercase">Hotel Booking</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3 tracking-tight">Checkout</h1>
                        <p className="text-white/80 text-sm md:text-base leading-relaxed font-medium">
                            Complete your hotel booking with secure & professional processing.
                        </p>
                    </div>
                    <div className="md:w-1/2 flex justify-center md:justify-end mt-8 md:mt-0 relative">
                        <img src={hotelGraphic} alt="Hotel" className="w-[300px] md:w-[400px] object-contain drop-shadow-2xl z-10" />
                    </div>
                </div>
            </div>

            {/* Stepper Card - Overlapping */}
            <div className="relative z-20 px-4 -mt-20 max-w-6xl mx-auto mb-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 flex items-center justify-start gap-4 sm:gap-12 overflow-x-auto">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-[#1A56DB] text-white flex items-center justify-center font-black shadow-md shadow-blue-500/30">1</div>
                        <div>
                            <p className="text-xs font-black text-[#1A56DB] uppercase tracking-widest leading-none mb-1">Travellers</p>
                            <p className="text-[10px] text-gray-500 font-bold">Enter guest details</p>
                        </div>
                    </div>
                    <div className="hidden sm:block border-t-2 border-dashed border-gray-200 w-16"></div>
                    <div className="flex items-center gap-3 shrink-0 opacity-50">
                        <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-black">2</div>
                        <div>
                            <p className="text-xs font-black text-gray-800 uppercase tracking-widest leading-none mb-1">Add-Ons</p>
                            <p className="text-[10px] text-gray-500 font-bold">Meal, Extra bed, etc.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20">
                {/* Left Column (Forms) */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* Traveller Form */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1A56DB]"></div>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                                    <span className="text-[#1A56DB] text-xl">👤</span> Traveller 1 (Adult - Lead)
                                </h3>
                                <span className="bg-blue-50 text-[#1A56DB] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Pax Type: Adult</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Title</label>
                                    <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB] outline-none">
                                        <option>Mr</option>
                                        <option>Mrs</option>
                                        <option>Ms</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">First & Middle Name *</label>
                                    <input type="text" placeholder="Enter given name" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Last Name *</label>
                                    <input type="text" placeholder="Enter surname" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Date of Birth *</label>
                                    <input type="date" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB] outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Notifications */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF9F43]"></div>
                        <div className="p-6">
                            <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide mb-6">
                                <span className="text-[#FF9F43] text-xl">🔔</span> Booking Notifications
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Mobile Number *</label>
                                    <div className="flex w-full border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#FF9F43] focus-within:ring-1 focus-within:ring-[#FF9F43]">
                                        <div className="bg-gray-50 px-4 py-3 border-r border-gray-200 flex items-center gap-2">
                                            <span>🇮🇳</span> <span className="font-bold text-sm">+91</span>
                                        </div>
                                        <input type="text" placeholder="10 digit mobile number" className="flex-1 px-4 py-3 text-sm font-bold text-gray-800 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Email ID *</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3 text-gray-400">✉️</span>
                                        <input type="email" placeholder="Enter email address" className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-gray-800 focus:border-[#FF9F43] focus:ring-1 focus:ring-[#FF9F43] outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Ticket / Voucher Email (Optional)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3 text-gray-400">✉️</span>
                                        <input type="email" placeholder="ticket@example.com" className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-gray-800 focus:border-[#FF9F43] focus:ring-1 focus:ring-[#FF9F43] outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* GST Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500"></div>
                        <div className="p-6">
                            <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide mb-6">
                                <span className="text-green-500 text-xl">🛡️</span> GST Details <span className="text-[10px] text-gray-400 font-bold ml-1">(Optional for Tax Invoice)</span>
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">GST Number</label>
                                    <input type="text" placeholder="GSTIN (e.g. 07AAAAA0000A1Z5)" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Company Name</label>
                                    <input type="text" placeholder="Registered Agency / Company Name" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button onClick={handleProceed} className="w-full bg-[#0B1A42] hover:bg-[#152a66] text-white font-black py-5 rounded-xl shadow-lg transition-all transform active:scale-95 uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                        Proceed to Add-Ons <span className="text-lg leading-none">→</span>
                    </button>
                    
                    {/* Bottom Trust Badges */}
                    <div className="flex flex-wrap items-center justify-between sm:justify-center gap-4 sm:gap-8 pt-4 pb-8 border-t border-gray-200 mt-8">
                        <div className="flex items-center gap-2 text-gray-500">
                            <span className="text-green-500">🛡️</span>
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Secure Booking</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <span className="text-blue-500">🏷️</span>
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Best Price Guaranteed</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <span className="text-purple-500">🎧</span>
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">24/7 Support</span>
                        </div>
                    </div>

                </div>

                {/* Right Column (Summary) */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Hotel Summary Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <img src={hotel.image} alt={hotel.name} className="w-full h-40 object-cover" />
                        <div className="p-5">
                            <div className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded inline-block mb-2 font-black tracking-widest">{hotel.stars}</div>
                            <h3 className="text-lg font-black text-gray-900 leading-tight mb-1">{hotel.name}</h3>
                            <p className="text-xs text-gray-500 font-bold mb-5 flex items-center gap-1"><span>📍</span> {hotel.location}</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-5 border-y border-gray-100 py-4">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-in</p>
                                    <p className="text-sm font-black text-gray-800">{formatDate(searchParams.checkIn)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-out</p>
                                    <p className="text-sm font-black text-gray-800">{formatDate(searchParams.checkOut)}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Room & Guests</p>
                                <p className="text-sm font-black text-gray-800">{searchParams.rooms} Room • {searchParams.adults} Adult</p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <button className="text-[#1A56DB] text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-1">
                                    View Hotel Details <span>→</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Price Summary */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <h4 className="text-[10px] font-black text-[#1A56DB] uppercase tracking-widest mb-4">Price Summary <span className="text-gray-400 ml-1">({searchParams.rooms} Room)</span></h4>
                        
                        <div className="space-y-3 mb-5 border-b border-gray-100 pb-5">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-600">Room Charges</span>
                                <span className="text-sm font-black text-gray-800">₹{hotel.price.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-600">Taxes & Fees</span>
                                <span className="text-sm font-black text-gray-800">₹{hotel.taxes.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-600">Service Fee</span>
                                <span className="text-sm font-black text-gray-800">₹{hotel.fees.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-[#FF9F43] leading-none">₹{totalAmount.toLocaleString('en-IN')}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Inc. GST</span>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Summary */}
                    <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center text-xl shrink-0">
                            👛
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Available Wallet</p>
                            <p className="text-xl font-black text-green-600 leading-none">₹{agentInfo?.walletBalance?.toLocaleString('en-IN') || '48,502.8'}</p>
                        </div>
                    </div>

                    {/* Secure Booking Badge */}
                    <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl p-5 flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg shrink-0 mt-0.5">
                            🛡️
                        </div>
                        <div>
                            <p className="text-xs font-black text-[#1E3A8A] mb-1">100% Secure Booking</p>
                            <p className="text-[10px] text-[#3B82F6] font-bold leading-relaxed">Your payment is protected with SSL encryption.</p>
                        </div>
                    </div>

                </div>
            </div>
            
            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-[#4B83F3] to-[#8A4BF3] rounded-full flex items-center justify-center text-white text-2xl shadow-xl shadow-blue-500/30 border-[3px] border-white cursor-pointer hover:scale-105 active:scale-95 transition-transform z-50">
                ✨
            </div>
        </div>
    );
};

export default HotelCheckout;
