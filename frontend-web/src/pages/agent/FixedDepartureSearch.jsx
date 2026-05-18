import React, { useState, useEffect } from 'react';
import { fixedDepartureService } from '../../services/api';
import { toast } from 'react-toastify';
import { FaPlane, FaMapMarkerAlt, FaCalendarAlt, FaSearch, FaChevronRight, FaUsers, FaShieldAlt, FaSuitcase } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Simple static city list for autocomplete (replace with API in production)
const CITY_LIST = [
  // India
  'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Ahmedabad', 'Pune', 'Jaipur', 'Goa',
  'Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Lucknow', 'Varanasi', 'Patna', 'Gaya',
  'Bhubaneswar', 'Guwahati', 'Bagdogra', 'Amritsar', 'Chandigarh', 'Srinagar', 'Jammu', 'Leh', 'Dehradun', 'Shimla',
  'Indore', 'Bhopal', 'Nagpur', 'Raipur', 'Ranchi', 'Surat', 'Vadodara', 'Rajkot', 'Jodhpur', 'Udaipur',
  'Jaisalmer', 'Agra', 'Kanpur', 'Prayagraj', 'Gorakhpur', 'Port Blair', 'Tirupati', 'Vijayawada', 'Visakhapatnam', 'Mangalore',
  'Hubli', 'Belagavi', 'Mysore', 'Pondicherry', 'Salem', 'Tuticorin', 'Kadapa', 'Kurnool', 'Rajahmundry', 'Warangal',
  'Bilaspur', 'Jagdalpur', 'Jharsuguda', 'Rourkela', 'Dibrugarh', 'Jorhat', 'Silchar', 'Tezpur', 'Dimapur', 'Imphal',
  'Agartala', 'Aizawl', 'Shillong', 'Pakyong', 'Darbhanga', 'Deoghar', 'Durgapur', 'Cooch Behar', 'Rupsi', 'Passighat',

  // Middle East & Gulf
  'Dubai', 'Abu Dhabi', 'Sharjah', 'Doha', 'Muscat', 'Kuwait City', 'Bahrain (Manama)', 'Riyadh', 'Jeddah', 'Dammam',
  'Medina', 'Amman', 'Beirut', 'Tehran', 'Baghdad', 'Erbil', 'Salalah', 'Ras Al Khaimah', 'Al Ain', 'Najaf',

  // South & Southeast Asia
  'Singapore', 'Bangkok', 'Phuket', 'Kuala Lumpur', 'Penang', 'Langkawi', 'Jakarta', 'Bali (Denpasar)', 'Surabaya', 'Manila',
  'Cebu', 'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Phnom Penh', 'Siem Reap', 'Vientiane', 'Yangon', 'Mandalay', 'Colombo',
  'Male', 'Kathmandu', 'Pokhara', 'Dhaka', 'Chittagong', 'Sylhet', 'Islamabad', 'Karachi', 'Lahore', 'Peshawar',

  // East Asia
  'Tokyo', 'Osaka', 'Kyoto', 'Nagoya', 'Fukuoka', 'Sapporo', 'Okinawa', 'Seoul', 'Busan', 'Jeju',
  'Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Xi\'an', 'Chongqing', 'Wuhan', 'Hong Kong',
  'Macau', 'Taipei', 'Kaohsiung',

  // Europe
  'London', 'Paris', 'Rome', 'Madrid', 'Barcelona', 'Berlin', 'Munich', 'Frankfurt', 'Amsterdam', 'Vienna',
  'Zurich', 'Geneva', 'Milan', 'Venice', 'Florence', 'Naples', 'Athens', 'Istanbul', 'Antalya', 'Lisbon',
  'Porto', 'Dublin', 'Brussels', 'Prague', 'Budapest', 'Warsaw', 'Krakow', 'Stockholm', 'Copenhagen', 'Oslo',
  'Helsinki', 'Edinburgh', 'Glasgow', 'Manchester', 'Birmingham', 'Lyon', 'Marseille', 'Nice', 'Hamburg', 'Dusseldorf',
  'Stuttgart', 'Cologne', 'Bucharest', 'Sofia', 'Belgrade', 'Zagreb', 'Ljubljana', 'Bratislava', 'Riga', 'Vilnius',
  'Tallinn', 'Reykjavik', 'Valletta', 'Larnaca', 'Paphos', 'Tbilisi', 'Baku', 'Yerevan',

  // North America
  'New York', 'Los Angeles', 'Chicago', 'San Francisco', 'Miami', 'Las Vegas', 'Orlando', 'Atlanta', 'Dallas', 'Houston',
  'Washington D.C.', 'Boston', 'Seattle', 'Denver', 'Phoenix', 'Philadelphia', 'San Diego', 'Detroit', 'Minneapolis', 'Charlotte',
  'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Halifax', 'Quebec City', 'Mexico City',
  'Cancun', 'Guadalajara', 'Monterrey', 'Puerto Vallarta', 'Los Cabos',

  // South & Central America
  'Sao Paulo', 'Rio de Janeiro', 'Buenos Aires', 'Bogota', 'Lima', 'Santiago', 'Quito', 'Guayaquil', 'Caracas', 'La Paz',
  'Montevideo', 'Asuncion', 'Brasilia', 'Salvador', 'Belo Horizonte', 'Panama City', 'San Jose', 'San Salvador', 'Guatemala City', 'Havana',

  // Africa
  'Cairo', 'Johannesburg', 'Cape Town', 'Durban', 'Nairobi', 'Mombasa', 'Addis Ababa', 'Casablanca', 'Marrakech', 'Tunis',
  'Algiers', 'Lagos', 'Abuja', 'Accra', 'Dakar', 'Abidjan', 'Dar es Salaam', 'Zanzibar', 'Kampala', 'Entebbe',
  'Kigali', 'Lusaka', 'Harare', 'Gaborone', 'Windhoek', 'Luanda', 'Maputo', 'Mauritius (Port Louis)', 'Seychelles (Mahe)', 'Antananarivo',

  // Australia & Oceania
  'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Cairns', 'Canberra', 'Hobart', 'Darwin',
  'Auckland', 'Wellington', 'Christchurch', 'Queenstown', 'Nadi', 'Suva', 'Port Moresby', 'Noumea', 'Papeete'
];

const parseTimeString = (timeStr) => {
    if (!timeStr) return null;
    const cleanStr = timeStr.trim().toLowerCase();
    const isPM = cleanStr.includes('pm');
    const isAM = cleanStr.includes('am');
    
    const match = cleanStr.match(/(\d+):(\d+)/);
    if (!match) return null;
    
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    
    if (isPM && hours < 12) {
        hours += 12;
    } else if (isAM && hours === 12) {
        hours = 0;
    }
    
    return { hours, mins };
};

const calculateDuration = (deptTime, arrTime) => {
    if (!deptTime || !arrTime) return '2h 15m';
    try {
        const dept = parseTimeString(deptTime);
        const arr = parseTimeString(arrTime);
        
        if (!dept || !arr) return '2h 15m';
        
        let deptMinutes = dept.hours * 60 + dept.mins;
        let arrMinutes = arr.hours * 60 + arr.mins;
        
        if (arrMinutes < deptMinutes) {
            arrMinutes += 24 * 60;
        }
        
        const diffMinutes = arrMinutes - deptMinutes;
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        
        return `${hours}h ${mins}m`;
    } catch (e) {
        return '2h 15m';
    }
};

const formatDateWithDay = (dateStr) => {
    if (!dateStr) return '20 May - Wed';
    try {
        const d = new Date(dateStr);
        const dayNum = d.getDate();
        const month = d.toLocaleString('default', { month: 'short' });
        const weekday = d.toLocaleString('default', { weekday: 'short' });
        return `${dayNum} ${month} - ${weekday}`;
    } catch(e) {
        return '20 May - Wed';
    }
};

const FixedDepartureSearch = () => {
    const navigate = useNavigate();
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [date, setDate] = useState('');
    const [paxSize, setPaxSize] = useState('1');
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [availableDates, setAvailableDates] = useState([]);
    const [showCalPopup, setShowCalPopup] = useState(false);
    const [calMonth, setCalMonth] = useState(new Date());

    useEffect(() => {
        if (availableDates.length > 0) {
            setCalMonth(new Date(availableDates[0]));
        }
    }, [availableDates]);

    useEffect(() => {
        if (from && to) {
            fixedDepartureService.getAvailableDates(from, to).then(res => {
                if (res.success) {
                    setAvailableDates(res.data);
                }
            }).catch(err => console.error(err));
        } else {
            setAvailableDates([]);
        }
    }, [from, to]);

    const getDaysInMonth = (year, month) => {
        const date = new Date(year, month, 1);
        const days = [];
        const startDay = date.getDay();
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!from || !to || !date) {
            toast.error('Please select From City, To City, and a Departure Date first');
            return;
        }
        setLoading(true);
        try {
            const res = await fixedDepartureService.searchFlights(from, to, date);
            if (res.success) {
                setFlights(res.data);
                setHasSearched(true);
            }
        } catch (error) {
            toast.error('Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBook = (flight) => {
        const reqPax = parseInt(paxSize, 10) || 1;
        if (reqPax > flight.availableSeats) {
            toast.error(`❌ No Seat Available. Only ${flight.availableSeats} seats left on this flight.`);
            return;
        }
        navigate('/agent/fixed-departure-book', { state: { flight } });
    };

    return (
        <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
            {/* Hero Search Section */}
            <div className="bg-[#1D4171] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white mb-8 relative shadow-xl">
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4 hidden sm:block">
                        <FaPlane size={300} />
                    </div>
                </div>
                
                <div className="relative z-10">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black mb-1">Fixed Departure Flights</h1>
                    <p className="text-blue-200 font-bold mb-4 sm:mb-6 text-xs sm:text-sm uppercase tracking-wider">Guaranteed Seats • Best Market Fares • Instant Confirmation</p>
                    
                    <form onSubmit={handleSearch} className="bg-white p-3 rounded-xl sm:rounded-2xl flex flex-col lg:flex-row gap-3 shadow-lg w-full">
                        <div className="w-full lg:flex-1 relative">
                            <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-[#48A0D4]" />
                            <input 
                                type="text"
                                placeholder="From City" list="city-options"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-lg sm:rounded-xl text-slate-900 font-bold focus:ring-2 ring-[#48A0D4] outline-none text-xs sm:text-sm"
                                value={from}
                                onChange={e => setFrom(e.target.value)}
                            />
                        </div>
                        <div className="w-full lg:flex-1 relative">
                            <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-[#48A0D4]" />
                            <input 
                                type="text"
                                placeholder="To City" list="city-options"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-lg sm:rounded-xl text-slate-900 font-bold focus:ring-2 ring-[#48A0D4] outline-none text-xs sm:text-sm"
                                value={to}
                                onChange={e => setTo(e.target.value)}
                            />
                        </div>
                        <div className="w-full lg:flex-1 relative">
                            <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-[#48A0D4]" />
                            <input 
                                type="text"
                                readOnly
                                placeholder="Select Travel Date"
                                onClick={() => setShowCalPopup(!showCalPopup)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-lg sm:rounded-xl text-slate-900 font-bold focus:ring-2 ring-[#48A0D4] outline-none text-xs sm:text-sm cursor-pointer"
                                value={date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                            />
                            {showCalPopup && (
                                <div className="absolute left-0 top-full mt-2 bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-slate-100 z-50 w-80 text-slate-900 animate-fadeIn">
                                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                                        <button 
                                            type="button" 
                                            onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
                                            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-[#F07E21] hover:text-white transition-colors font-bold"
                                        >
                                            ◀
                                        </button>
                                        <span className="font-black text-base text-[#1D4171]">
                                            {calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </span>
                                        <button 
                                            type="button" 
                                            onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
                                            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-[#F07E21] hover:text-white transition-colors font-bold"
                                        >
                                            ▶
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 mb-2">
                                        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 text-center">
                                        {getDaysInMonth(calMonth.getFullYear(), calMonth.getMonth()).map((d, i) => {
                                            if (!d) return <div key={`empty-${i}`} className="py-2" />;
                                            const year = d.getFullYear();
                                            const month = String(d.getMonth() + 1).padStart(2, '0');
                                            const day = String(d.getDate()).padStart(2, '0');
                                            const dStr = `${year}-${month}-${day}`;
                                            
                                            const isAvail = availableDates.includes(dStr);
                                            const isSel = date === dStr;
                                            return (
                                                <button
                                                    key={dStr}
                                                    type="button"
                                                    disabled={!isAvail}
                                                    onClick={() => {
                                                        setDate(dStr);
                                                        setShowCalPopup(false);
                                                    }}
                                                    className={`py-2 rounded-xl text-xs font-black transition-all relative ${
                                                        isSel 
                                                            ? 'bg-[#F07E21] text-white shadow-md scale-105 z-10' 
                                                            : isAvail 
                                                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-sm' 
                                                                : 'text-slate-300 cursor-not-allowed bg-slate-50 line-through decoration-red-500 decoration-2 opacity-40'
                                                    }`}
                                                >
                                                    {d.getDate()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {(!from || !to) && (
                                        <p className="text-[10px] font-black text-red-500 text-center mt-4 bg-red-50 p-2 rounded-xl border border-red-100">
                                            ⚠️ Please select From and To cities first to view available dates.
                                        </p>
                                    )}
                                    <div className="flex justify-end mt-4 pt-2 border-t border-slate-100">
                                        <button 
                                            type="button" 
                                            onClick={() => setShowCalPopup(false)}
                                            className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-wider"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="w-full lg:w-32 relative">
                            <FaUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-[#48A0D4]" />
                            <input 
                                type="number"
                                placeholder="Pax"
                                min="1"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-lg sm:rounded-xl text-slate-900 font-bold focus:ring-2 ring-[#48A0D4] outline-none text-xs sm:text-sm"
                                value={paxSize}
                                onChange={e => setPaxSize(e.target.value)}
                            />
                        </div>
                        <button 
                            type="submit"
                            className="w-full lg:w-auto bg-[#F07E21] text-white px-8 py-3 rounded-lg sm:rounded-xl font-black text-xs sm:text-sm hover:bg-[#d96d1a] transition-all flex items-center justify-center gap-2 shadow-md"
                        >
                            <FaSearch /> SEARCH
                        </button>
                    </form>
                    {availableDates.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-blue-500/30">
                            <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Available Departure Dates:</span>
                            {availableDates.map(d => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDate(d)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${date === d ? 'bg-[#F07E21] text-white shadow-md scale-105 ring-2 ring-white/50' : 'bg-white/10 text-blue-100 hover:bg-white/20'}`}
                                >
                                    {new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </button>
                            ))}
                        </div>
                    )}
                    <datalist id="city-options">
                      {CITY_LIST.map(city => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                </div>
            </div>

            {/* Date Navigation Bar */}
            <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100 mb-6 max-w-4xl mx-auto gap-2">
                <button className="text-[#F07E21] font-bold text-xs uppercase tracking-widest hover:text-[#d96d1a] truncate">« Prev Day</button>
                <h3 className="text-[#1D4171] font-black text-xs sm:text-sm uppercase tracking-widest truncate">{date || 'Select Date'}</h3>
                <button className="text-[#F07E21] font-bold text-xs uppercase tracking-widest hover:text-[#d96d1a] truncate">Next Day »</button>
            </div>

            {/* Results Section */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 border-8 border-slate-200 border-t-[#1D4171] rounded-full animate-spin mb-6"></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest animate-pulse text-xs sm:text-sm">Scanning Flight Inventory...</p>
                </div>
            ) : flights.length > 0 ? (
                <div className="space-y-4 max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-2 gap-1 px-1">
                        <h2 className="text-lg sm:text-xl font-black text-[#1D4171]">{flights.length} Flights Available</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sorted by Departure Time</p>
                    </div>
                    
                    {flights.map(flight => {
                        const reqPax = parseInt(paxSize, 10) || 1;
                        const hasEnoughSeats = reqPax <= flight.availableSeats;
                        const tourCode = flight.tourCode || 'GF' + (flight.flightNumber?.replace(/\D/g, '') || '5252') + (flight._id?.slice(-4)?.toUpperCase() || '9A2B');
                        return (
                            <div 
                                key={flight._id} 
                                className="bg-white rounded-[1.75rem] p-5 shadow-md hover:shadow-xl border border-[#1D4171]/10 hover:border-[#F07E21]/40 transition-all duration-300 w-full mb-5 group"
                            >
                                {/* Top Row: Logo/Airline & Route & Baggage */}
                                <div className="flex justify-between items-start mb-4 pb-3 border-b border-[#1D4171]/10">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 bg-gradient-to-br from-[#1D4171] to-[#48A0D4] rounded-2xl flex items-center justify-center text-white text-xl shadow-sm shadow-[#1D4171]/20">
                                            ✈️
                                        </div>
                                        <div>
                                            <h3 className="text-base sm:text-lg font-black text-[#1D4171] mb-0.5 capitalize">✈ {flight.fromCity} → {flight.toCity}</h3>
                                            <p className="text-[#48A0D4] font-black text-xs uppercase tracking-wider">{flight.airlineName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[#1D4171]/70 font-black text-xs mb-1">Non - Stop</p>
                                        <div className="flex items-center gap-1.5 justify-end bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                                            <FaSuitcase className="text-[#F07E21] text-xs" />
                                            <span className="text-black font-black text-[10px]">7 KG , {flight.isInternational ? '20 KG' : '15 KG'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Middle Row: Date, Flight No, Time ┈ Duration ┈ Time */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5 px-2 bg-[#1D4171]/5 py-3 rounded-2xl border border-[#1D4171]/10">
                                    <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl shadow-sm border border-[#1D4171]/10">
                                        <FaCalendarAlt className="text-[#1D4171] text-xs" />
                                        <p className="text-xs sm:text-sm font-black text-[#1D4171]">{formatDateWithDay(flight.departureDate)}</p>
                                    </div>
                                    <div className="bg-[#48A0D4]/10 px-3.5 py-1.5 rounded-xl border border-[#48A0D4]/20 shadow-sm">
                                        <p className="text-xs sm:text-sm font-black text-[#48A0D4] tracking-wider">{flight.flightNumber}</p>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-white px-4 py-1.5 rounded-xl shadow-sm border border-[#1D4171]/10">
                                        <p className="text-xs sm:text-sm font-black text-[#1D4171]">{flight.departureTime}</p>
                                        <span className="bg-[#F07E21] text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm tracking-wider animate-pulse">
                                            {calculateDuration(flight.departureTime, flight.arrivalTime)}
                                        </span>
                                        <p className="text-xs sm:text-sm font-black text-[#1D4171]">{flight.arrivalTime}</p>
                                    </div>
                                </div>

                                {/* Bottom Button Row: Tour Code + Book Now */}
                                <div 
                                    onClick={() => handleBook(flight)}
                                    className="flex flex-col sm:flex-row items-stretch rounded-xl overflow-hidden mb-4 border border-[#1D4171]/10 shadow-sm cursor-pointer group-hover:shadow-md transition-all duration-300"
                                >
                                    <div className="flex-1 bg-[#F8FAFC] py-3.5 px-5 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-[#1D4171]/10">
                                        <p className="text-[#1D4171] font-black text-xs sm:text-sm tracking-widest truncate">TOUR CODE {tourCode}</p>
                                    </div>
                                    <div className="flex-1 bg-gradient-to-r from-[#F07E21] to-[#d96d1a] hover:from-[#1D4171] hover:to-[#1D4171] transition-all duration-500 py-3.5 px-5 flex items-center justify-center shadow-inner">
                                        <p className="text-white font-black text-xs sm:text-sm tracking-widest uppercase truncate">BOOK NOW (₹{flight.fare})</p>
                                    </div>
                                </div>

                                {/* Footer Row: Seats left & Copy / Status */}
                                <div className="flex items-center justify-between px-2 pt-1.5 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                        {hasEnoughSeats ? (
                                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-1">✅ Seat Available</span>
                                        ) : (
                                            <span className="text-[10px] font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-xl border border-red-200 shadow-sm flex items-center gap-1">❌ No Seat Available</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <p className="text-xs sm:text-sm font-black text-black">Seats : {flight.availableSeats}</p>
                                        <span 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(`Flight: ${flight.airlineName} ${flight.flightNumber}, Route: ${flight.fromCity} to ${flight.toCity}, Date: ${flight.departureDate}, Fare: ₹${flight.fare}`);
                                                toast.success('Flight details copied!');
                                            }}
                                            className="bg-[#1D4171]/10 text-[#1D4171] font-black text-[10px] px-2 py-1 rounded-lg hover:bg-[#1D4171] hover:text-white transition-colors cursor-pointer shadow-sm"
                                        >
                                            COPY
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : hasSearched ? (
                <div className="bg-white rounded-[3rem] py-20 px-8 text-center shadow-xl border border-slate-50">
                    <div className="text-8xl mb-8">🏜️</div>
                    <h3 className="text-3xl font-black text-[#1D4171] mb-2">No Flights Found</h3>
                    <p className="text-slate-400 font-bold text-lg max-w-md mx-auto">We couldn't find any fixed departure flights for this route on the selected date.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 text-center">
                        <div className="w-20 h-20 bg-blue-50 text-[#1D4171] rounded-[1.5rem] flex items-center justify-center text-3xl mx-auto mb-6">💰</div>
                        <h4 className="font-black text-[#1D4171] text-xl mb-2">Unbeatable Pricing</h4>
                        <p className="text-slate-500 font-medium">Get exclusive group rates that you won't find on any live API.</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 text-center">
                        <div className="w-20 h-20 bg-orange-50 text-[#F07E21] rounded-[1.5rem] flex items-center justify-center text-3xl mx-auto mb-6">🎟️</div>
                        <h4 className="font-black text-[#1D4171] text-xl mb-2">Guaranteed Seats</h4>
                        <p className="text-slate-500 font-medium">Pre-purchased inventory ensures your booking is confirmed even in peak season.</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 text-center">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center text-3xl mx-auto mb-6">⚡</div>
                        <h4 className="font-black text-[#1D4171] text-xl mb-2">Quick Process</h4>
                        <p className="text-slate-500 font-medium">Simple 2-step booking flow designed for fast-paced travel agents.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FixedDepartureSearch;
