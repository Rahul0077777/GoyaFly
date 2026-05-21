import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';
import { 
    IoBusOutline, IoCalendarOutline, 
    IoPersonOutline, IoSearchOutline, IoSwapHorizontal, IoSwapVertical, 
    IoShieldCheckmarkOutline, IoPricetagOutline, 
    IoTimeOutline, IoHeadsetOutline, IoLocateOutline, 
    IoChevronDown, IoLocation, IoArrowForward
} from 'react-icons/io5';

const BusSearch = () => {
    const navigate = useNavigate();
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [date, setDate] = useState('');
    const [passengers, setPassengers] = useState(1);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResults([]);
        try {
            const res = await bookingService.searchGeneric('bus', { from, to, date });
            if (res.success) setResults(res.data);
        } catch (err) {
            setError('No buses found for this route.');
        } finally {
            setLoading(false);
        }
    };

    const handleBook = (item) => {
        navigate('/agent/checkout', { 
            state: { 
                bookingData: { 
                    service: 'Bus', 
                    from: from, 
                    to: to, 
                    baseFare: item.price,
                    details: item
                } 
            } 
        });
    };

    const handleSwap = () => {
        const temp = from;
        setFrom(to);
        setTo(temp);
    };

    return (
        <div className="w-full min-h-screen bg-[#F5F8FA] pb-24 font-sans flex flex-col items-center">
            {/* Top Banner / Header Area */}
            <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-4">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-green-100/50">
                        🚐
                    </div>
                    <div>
                        <h2 className="text-[28px] font-black leading-tight text-[#111827]">
                            Surface <br className="hidden sm:block lg:hidden" />
                            <span className="text-[#2563EB]">Transport</span>
                        </h2>
                        <p className="text-gray-500 font-bold uppercase text-[9px] tracking-[0.2em] mt-1">Buses across India</p>
                    </div>
                    {/* Optional: Add a subtle bus illustration on the right for desktop */}
                    <div className="hidden sm:block ml-auto opacity-20 text-6xl">
                        🏙️🚌
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-[#1D4ED8] rounded-2xl p-4 flex items-center gap-4 text-white shadow-lg relative overflow-hidden mb-6">
                    <div className="absolute right-0 top-0 bottom-0 w-32 opacity-10 flex items-center justify-end pr-4 pointer-events-none">
                        <IoBusOutline size={80} />
                    </div>
                    <div className="w-10 h-10 bg-[#F97316] rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-inner">
                        <IoShieldCheckmarkOutline size={20} />
                    </div>
                    <div className="z-10">
                        <h4 className="font-bold text-sm sm:text-base">1000+ Operators • Real-time Availability</h4>
                        <p className="text-blue-100 text-[10px] sm:text-xs">Book bus tickets instantly with lowest fares</p>
                    </div>
                </div>

                {/* Search Form Card */}
                <form onSubmit={handleSearch} className="bg-white rounded-[2rem] shadow-xl p-5 sm:p-6 lg:p-8 border border-gray-100 relative mb-8">
                    <div className="flex flex-col lg:flex-row items-end gap-4 lg:gap-6 relative">
                        
                        {/* Origin & Destination Block (Flex relative for swap button) */}
                        <div className="flex flex-col lg:flex-row items-stretch flex-1 gap-4 lg:gap-6 w-full relative">
                            {/* Origin Field */}
                            <div className="flex-1 relative">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Origin</label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 text-[#2563EB]">
                                        <IoLocation size={20} />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={from} 
                                        onChange={e=>setFrom(e.target.value.toUpperCase())} 
                                        placeholder="Source City" 
                                        className="w-full pl-12 pr-12 py-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] font-bold text-gray-800 transition-all"
                                        required 
                                    />
                                    <div className="absolute right-4 text-[#2563EB] p-1 cursor-pointer hover:bg-blue-50 rounded-full transition-colors hidden sm:block">
                                        <IoLocateOutline size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Swap Button */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:translate-y-2 z-10 flex items-center justify-center">
                                <button 
                                    type="button" 
                                    onClick={handleSwap}
                                    className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-[#2563EB] shadow-md hover:shadow-lg transition-all hover:bg-gray-50 active:scale-95 mt-4 lg:mt-0"
                                >
                                    <IoSwapVertical size={20} className="lg:hidden" />
                                    <IoSwapHorizontal size={20} className="hidden lg:block" />
                                </button>
                            </div>

                            {/* Destination Field */}
                            <div className="flex-1 relative">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Destination</label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 text-[#F97316]">
                                        <IoLocation size={20} />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={to} 
                                        onChange={e=>setTo(e.target.value.toUpperCase())} 
                                        placeholder="Target City" 
                                        className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] font-bold text-gray-800 transition-all"
                                        required 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Date & Passengers */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-[450px]">
                            <div className="flex-1 relative">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Date of Journey</label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 text-[#2563EB]">
                                        <IoCalendarOutline size={20} />
                                    </div>
                                    <input 
                                        type="date" 
                                        value={date} 
                                        onChange={e=>setDate(e.target.value)} 
                                        className="w-full pl-12 pr-10 py-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] font-bold text-gray-800 transition-all appearance-none"
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="flex-1 relative">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Passengers</label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 text-[#2563EB]">
                                        <IoPersonOutline size={20} />
                                    </div>
                                    <select 
                                        value={passengers} 
                                        onChange={e=>setPassengers(Number(e.target.value))}
                                        className="w-full pl-12 pr-10 py-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] font-bold text-gray-800 transition-all appearance-none cursor-pointer"
                                    >
                                        {[1,2,3,4,5,6].map(num => (
                                            <option key={num} value={num}>{num} Pax</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 text-gray-400 pointer-events-none">
                                        <IoChevronDown size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="w-full lg:w-auto mt-2 lg:mt-0">
                            <button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full lg:w-auto px-8 h-[56px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
                            >
                                {loading ? (
                                    <span className="animate-pulse flex items-center gap-2">
                                        SEARCHING...
                                    </span>
                                ) : (
                                    <>
                                        <IoSearchOutline size={20} /> <span className="whitespace-nowrap">SEARCH BUSES</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Features Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-8 flex items-center justify-between overflow-x-auto no-scrollbar gap-4">
                    <div className="flex flex-col items-center justify-center text-center min-w-[100px] flex-1">
                        <IoShieldCheckmarkOutline className="text-[#3B82F6] mb-2 text-2xl lg:text-3xl" />
                        <p className="text-[10px] sm:text-xs font-black text-gray-800">Secure Booking</p>
                        <p className="text-[8px] sm:text-[10px] text-gray-400">100% Safe</p>
                    </div>
                    <div className="w-px h-10 bg-gray-100"></div>
                    <div className="flex flex-col items-center justify-center text-center min-w-[100px] flex-1">
                        <IoPricetagOutline className="text-[#F59E0B] mb-2 text-2xl lg:text-3xl" />
                        <p className="text-[10px] sm:text-xs font-black text-gray-800">Best Prices</p>
                        <p className="text-[8px] sm:text-[10px] text-gray-400">Guaranteed</p>
                    </div>
                    <div className="w-px h-10 bg-gray-100"></div>
                    <div className="flex flex-col items-center justify-center text-center min-w-[100px] flex-1">
                        <IoTimeOutline className="text-[#10B981] mb-2 text-2xl lg:text-3xl" />
                        <p className="text-[10px] sm:text-xs font-black text-gray-800">Instant Confirm</p>
                        <p className="text-[8px] sm:text-[10px] text-gray-400">Quick & Easy</p>
                    </div>
                    <div className="w-px h-10 bg-gray-100"></div>
                    <div className="flex flex-col items-center justify-center text-center min-w-[100px] flex-1">
                        <IoHeadsetOutline className="text-[#8B5CF6] mb-2 text-2xl lg:text-3xl" />
                        <p className="text-[10px] sm:text-xs font-black text-gray-800">24/7 Support</p>
                        <p className="text-[8px] sm:text-[10px] text-gray-400">We're here</p>
                    </div>
                </div>

                {/* Results Section */}
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl font-bold text-sm text-center mb-6 shadow-inner">{error}</div>}

                {results.length > 0 && (
                    <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-8 duration-500">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-black text-gray-900 border-l-4 border-[#2563EB] pl-3 py-0.5">Available Buses</h3>
                            <span className="text-xs font-bold text-gray-400 bg-gray-200 px-3 py-1 rounded-full">{results.length} Found</span>
                        </div>
                        {/* Results Grid - responsive layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {results.map((item, index) => (
                                <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-[#2563EB] flex-shrink-0">
                                            <IoBusOutline size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-[15px] text-gray-900 leading-tight">{item.operator || 'Premium Bus Service'}</h4>
                                            <p className="text-[11px] font-bold text-gray-500 uppercase mt-1">{from} <IoArrowForward className="inline mx-1 opacity-50" /> {to}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-row justify-between items-center border-t border-gray-50 pt-3 mt-2">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Base Fare</span>
                                            <p className="text-xl font-black text-gray-900">₹{item.price}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleBook(item)}
                                            className="px-6 py-2 bg-gray-900 group-hover:bg-[#2563EB] text-white font-bold rounded-xl text-xs transition-colors shadow-sm active:scale-95"
                                        >
                                            BOOK NOW
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BusSearch;
