import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import hotelRoomImg from '../../assets/hotel_room.png';

export const HotelSearch = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useState({ city: 'Mumbai', checkIn: '', checkOut: '', rooms: 1, adults: 1 });
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Dummy Data
    const dummyHotels = [
        { id: 'H1', name: 'The Grand Palace', city: 'Mumbai', location: 'Andheri East, Mumbai', rating: 4, price: 10000, taxes: 1800, fees: 200, image: hotelRoomImg, stars: '⭐⭐⭐⭐' },
        { id: 'H2', name: 'Taj Sea View', city: 'Mumbai', location: 'Colaba, Mumbai', rating: 5, price: 25000, taxes: 4500, fees: 500, image: hotelRoomImg, stars: '⭐⭐⭐⭐⭐' },
        { id: 'H3', name: 'Trident Nariman Point', city: 'Mumbai', location: 'Nariman Point, Mumbai', rating: 5, price: 18000, taxes: 3200, fees: 400, image: hotelRoomImg, stars: '⭐⭐⭐⭐⭐' },
        { id: 'H4', name: 'Novotel Juhu Beach', city: 'Mumbai', location: 'Juhu, Mumbai', rating: 4, price: 12000, taxes: 2100, fees: 300, image: hotelRoomImg, stars: '⭐⭐⭐⭐' },
        { id: 'H5', name: 'ITC Maratha', city: 'Mumbai', location: 'Sahar, Mumbai', rating: 5, price: 15000, taxes: 2700, fees: 400, image: hotelRoomImg, stars: '⭐⭐⭐⭐⭐' },
        { id: 'H6', name: 'Radisson Blu', city: 'Delhi', location: 'Dwarka, New Delhi', rating: 4, price: 8000, taxes: 1400, fees: 200, image: hotelRoomImg, stars: '⭐⭐⭐⭐' },
        { id: 'H7', name: 'Leela Palace', city: 'Delhi', location: 'Chanakyapuri, New Delhi', rating: 5, price: 28000, taxes: 5000, fees: 600, image: hotelRoomImg, stars: '⭐⭐⭐⭐⭐' },
        { id: 'H8', name: 'JW Marriott', city: 'Bangalore', location: 'Vittal Mallya Road, Bangalore', rating: 5, price: 16000, taxes: 2800, fees: 400, image: hotelRoomImg, stars: '⭐⭐⭐⭐⭐' },
        { id: 'H9', name: 'Hyatt Centric', city: 'Bangalore', location: 'MG Road, Bangalore', rating: 4, price: 9500, taxes: 1700, fees: 250, image: hotelRoomImg, stars: '⭐⭐⭐⭐' },
        { id: 'H10', name: 'Holiday Inn', city: 'Chennai', location: 'OMR IT Expressway, Chennai', rating: 4, price: 6500, taxes: 1100, fees: 150, image: hotelRoomImg, stars: '⭐⭐⭐⭐' },
    ];

    const handleSearch = (e) => {
        e.preventDefault();
        setIsSearching(true);
        setTimeout(() => {
            setIsSearching(false);
            setHasSearched(true);
        }, 1200);
    };

    const handleBook = (hotel) => {
        navigate('/agent/hotel-checkout', { 
            state: { 
                hotel: hotel,
                search: searchParams
            } 
        });
    };

    const displayedHotels = hasSearched ? dummyHotels.filter(h => h.city.toLowerCase() === searchParams.city.toLowerCase() || searchParams.city === '') : dummyHotels;

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 animate-fade-in pb-20">
            {/* Search Header */}
            <div className="flex items-center gap-4">
                <span className="text-4xl p-4 bg-blue-50 text-blue-600 rounded-3xl shadow-sm">🏨</span>
                <div>
                    <h2 className="text-3xl font-black text-gray-900">Hotel Search</h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Global Premium Inventory</p>
                </div>
            </div>

            {/* Search Form */}
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16"></div>
                
                <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end relative z-10">
                    <div className="lg:col-span-3 w-full text-left">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest mx-1 truncate">Destination City</label>
                        <input 
                            type="text" 
                            value={searchParams.city} 
                            onChange={e => setSearchParams({...searchParams, city: e.target.value})} 
                            className="w-full bg-gray-50 border-0 rounded-xl p-4 font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
                            placeholder="e.g. Mumbai"
                        />
                    </div>
                    <div className="lg:col-span-2 w-full text-left">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest mx-1 truncate">Check In</label>
                        <input 
                            type="date" 
                            value={searchParams.checkIn} 
                            onChange={e => setSearchParams({...searchParams, checkIn: e.target.value})} 
                            className="w-full bg-gray-50 border-0 rounded-xl p-4 font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
                        />
                    </div>
                    <div className="lg:col-span-2 w-full text-left">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest mx-1 truncate">Check Out</label>
                        <input 
                            type="date" 
                            value={searchParams.checkOut} 
                            onChange={e => setSearchParams({...searchParams, checkOut: e.target.value})} 
                            className="w-full bg-gray-50 border-0 rounded-xl p-4 font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
                        />
                    </div>
                    <div className="lg:col-span-3 w-full text-left">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest mx-1 truncate">Rooms & Guests</label>
                        <div className="w-full bg-gray-50 border-0 rounded-xl p-4 font-bold text-gray-800 shadow-inner flex items-center justify-between cursor-pointer">
                            <span className="truncate mr-2">{searchParams.rooms} Room, {searchParams.adults} Adult</span>
                            <span className="text-gray-400 shrink-0">⌄</span>
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={isSearching} 
                        className="lg:col-span-2 w-full px-4 py-4 h-[56px] bg-[#1A56DB] text-white font-black rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-70 transform active:scale-95 whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-center"
                    >
                        {isSearching ? 'SEARCHING...' : 'SEARCH HOTELS'}
                    </button>
                </form>
            </div>

            {/* Loading State */}
            {isSearching && (
                <div className="py-20 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Finding best deals...</p>
                </div>
            )}

            {/* Results Grid */}
            {!isSearching && displayedHotels.length > 0 && (
                <div className="flex flex-col gap-6 animate-slide-up">
                    <h3 className="text-xl font-black text-gray-900 border-l-4 border-blue-500 pl-3 py-1">
                        {hasSearched ? `Found ${displayedHotels.length} hotels in ${searchParams.city}` : 'Featured Hotels'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {displayedHotels.map(hotel => (
                            <div key={hotel.id} className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 flex flex-col group hover:shadow-2xl transition-all duration-300">
                                <div className="h-48 overflow-hidden relative">
                                    <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black shadow-sm">
                                        {hotel.stars}
                                    </div>
                                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                                        Exclusive Deal
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-black text-xl text-gray-900 mb-1">{hotel.name}</h4>
                                        <p className="text-sm font-bold text-gray-500 flex items-center gap-1 mb-4">
                                            <span>📍</span> {hotel.location}
                                        </p>
                                    </div>
                                    <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-100">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Starting From</p>
                                            <p className="text-2xl font-black text-[#1A56DB] leading-none">₹{hotel.price.toLocaleString('en-IN')}</p>
                                            <p className="text-[10px] font-bold text-gray-400 mt-1">+ ₹{hotel.taxes} taxes</p>
                                        </div>
                                        <button 
                                            onClick={() => handleBook(hotel)}
                                            className="px-6 py-2.5 bg-[#FF9F43] hover:bg-[#FF9100] text-white font-black rounded-xl shadow-md transition-transform transform active:scale-95 text-xs uppercase tracking-wider"
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* No Results */}
            {!isSearching && hasSearched && displayedHotels.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <span className="text-5xl mb-4 opacity-50">🏨</span>
                    <p className="text-lg font-black text-gray-800">No hotels found in {searchParams.city}</p>
                    <p className="text-sm font-medium text-gray-500 mt-2">Try searching for Mumbai, Delhi, or Bangalore.</p>
                </div>
            )}
        </div>
    );
};

export default HotelSearch;
