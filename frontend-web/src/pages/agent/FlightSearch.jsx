import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';
import { toast } from 'react-toastify';
import GoyaflyLoader from '../../components/GoyaflyLoader';
import InspirationLoader from '../../components/InspirationLoader';
import heroBg from '../../assets/hero_bg.png';

const POPULAR_AIRPORTS = [
    { code: 'DEL', city: 'New Delhi', label: 'Indira Gandhi Intl (DEL)' },
    { code: 'BOM', city: 'Mumbai', label: 'Chhatrapati Shivaji (BOM)' },
    { code: 'DXB', city: 'Dubai', label: 'Dubai Intl (DXB)' },
    { code: 'BLR', city: 'Bengaluru', label: 'Kempegowda Intl (BLR)' },
    { code: 'CCU', city: 'Kolkata', label: 'Netaji Subhash (CCU)' }
];

// ── Collapsible sidebar section ──────────────────────────────────────────────
const SidebarSection = ({ title, children, onReset }) => {
    const [open, setOpen] = useState(true);
    return (
        <div className="bg-white rounded border border-[#E0E0E0] shadow-sm overflow-hidden mb-4">
            <div className="flex justify-between items-center px-4 py-3 border-b border-[#EFEFEF] cursor-pointer select-none"
                onClick={() => setOpen(o => !o)}>
                <p className="text-[12px] font-bold text-[#333] uppercase tracking-wide">{title}</p>
                <div className="flex items-center gap-2">
                    {onReset && (
                        <button onClick={e => { e.stopPropagation(); onReset(); }}
                            className="text-[10px] text-blue-500 font-bold hover:underline">Reset</button>
                    )}
                    <span className="text-[#888] text-base leading-none font-bold select-none">{open ? '−' : '+'}</span>
                </div>
            </div>
            {open && children}
        </div>
    );
};

// ── Airport Autocomplete ─────────────────────────────────────────────────────
const AirportAutocomplete = ({ label, codeValue, onChangeCode }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [airports, setAirports] = useState(POPULAR_AIRPORTS);
    const [loading, setLoading] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState(codeValue);

    useEffect(() => {
        if (!search) { setAirports(POPULAR_AIRPORTS); return; }
        
        // Local filtering
        const localMatch = POPULAR_AIRPORTS.filter(a => 
            a.code.toLowerCase().includes(search.toLowerCase()) || 
            a.city.toLowerCase().includes(search.toLowerCase()) ||
            a.label.toLowerCase().includes(search.toLowerCase())
        );

        if (localMatch.length > 0) {
            setAirports(localMatch);
        } else if (search.length < 2) {
            setAirports(POPULAR_AIRPORTS);
        } else {
            setAirports([]);
        }

        if (search.length < 2) return;

        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await bookingService.searchAirports(search);
                if (res.success) setAirports(res.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }, 500);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        if (codeValue) {
            const found = airports.find(a => a.code === codeValue);
            if (found) {
                setSelectedLabel(`${found.code} - ${found.city}`);
            } else {
                bookingService.searchAirports(codeValue).then(res => {
                    if (res.success && res.data) {
                        const resolved = res.data.find(a => a.code === codeValue);
                        if (resolved) {
                            setAirports(prev => {
                                if (prev.some(x => x.code === resolved.code)) return prev;
                                return [...prev, resolved];
                            });
                            setSelectedLabel(`${resolved.code} - ${resolved.city}`);
                        } else {
                            setSelectedLabel(codeValue);
                        }
                    } else {
                        setSelectedLabel(codeValue);
                    }
                }).catch(() => {
                    setSelectedLabel(codeValue);
                });
            }
        } else {
            setSelectedLabel('');
        }
    }, [codeValue]);

    return (
        <div className="flex-1 relative">
            {label && <span className="text-[10px] font-semibold text-[#999] uppercase tracking-widest block">{label}</span>}
            <input
                className="w-full text-[15px] font-bold text-[#222] outline-none bg-transparent placeholder-[#aaa] mt-0.5"
                value={open ? search : (selectedLabel || codeValue)}
                onChange={e => { setSearch(e.target.value); setOpen(true); }}
                onFocus={() => { setSearch(''); setOpen(true); }}
                onBlur={() => setTimeout(() => setOpen(false), 200)}
                placeholder="City / Airport"
            />
            {open && (
                <div className="absolute top-[44px] left-0 w-full min-w-[260px] bg-white border border-[#E0E0E0] rounded shadow-xl z-[100] max-h-[300px] overflow-y-auto">
                    {loading && <div className="p-3 text-center text-xs text-[#888]">Searching...</div>}
                    {!loading && airports.map(a => (
                        <div key={a.code}
                            className="px-4 py-3 hover:bg-[#FFF4EC] border-b border-[#F4F4F4] cursor-pointer flex justify-between items-center"
                            onClick={() => { onChangeCode(a.code); setSelectedLabel(`${a.code} - ${a.city}`); setOpen(false); }}>
                            <div>
                                <p className="text-sm font-bold text-[#222]">{a.city}</p>
                                <p className="text-[10px] text-[#999]">{a.label}{a.country ? ` • ${a.country}` : ''}</p>
                            </div>
                            <span className="text-[#FF8000] font-black text-sm ml-2">{a.code}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Main Component ───────────────────────────────────────────────────────────
const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${month}/${day}/${year}`;
};

const FlightSearch = () => {
    const [tripType, setTripType] = useState('oneWay');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const getLocalDateString = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const today = getLocalDateString();
    const [date, setDate] = useState(today);
    const [returnDate, setReturnDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 3);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [pax, setPax] = useState({ adt: 1, chd: 0, inf: 0 });
    const passengers = pax.adt + pax.chd + pax.inf;
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showNetPrice, setShowNetPrice] = useState(true);
    const [markupAmount, setMarkupAmount] = useState(1000);
    const [isEditingMarkup, setIsEditingMarkup] = useState(false);
    const [selectedAirlines, setSelectedAirlines] = useState([]);
    const [selectedStops, setSelectedStops] = useState([]);
    const [sortBy, setSortBy] = useState('priceLow');
    const [expandedFlightId, setExpandedFlightId] = useState(null);
    const [fareDetails, setFareDetails] = useState({});
    const [loadingFares, setLoadingFares] = useState(null);
    const [verifyingPrice, setVerifyingPrice] = useState(false);
    const [fareRulesModal, setFareRulesModal] = useState({ show: false, content: '', flightNo: '' });
    const [fetchingRules, setFetchingRules] = useState(false);
    const [paxOpen, setPaxOpen] = useState(false);
    const [cabinClass, setCabinClass] = useState('Economy');

    // Advanced Filter State
    const [selectedDepSlots, setSelectedDepSlots] = useState([]); 
    const [selectedArrSlots, setSelectedArrSlots] = useState([]);
    const [flightNoQuery, setFlightNoQuery] = useState('');
    const [airlineSubQuery, setAirlineSubQuery] = useState('');
    const [selectedRefundables, setSelectedRefundables] = useState([]);
    const [maxDurationFilter, setMaxDurationFilter] = useState(1440); // 24 hours default
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const h = e => { if (paxOpen && !e.target.closest('.pax-container')) setPaxOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [paxOpen]);

    const parseTimeToMinutes = t => {
        if (!t) return 0;
        const m = t.match(/^(\d{1,2}):(\d{2})(\s*)(AM|PM)?/i);
        if (!m) { const [h, min] = t.split(':').map(Number); return (h || 0) * 60 + (min || 0); }
        let h = parseInt(m[1]), min = parseInt(m[2]);
        const mod = m[4]?.toUpperCase();
        if (mod === 'PM' && h < 12) h += 12;
        if (mod === 'AM' && h === 12) h = 0;
        return h * 60 + min;
    };

    const availableAirlines = [...new Set(flights.map(f => f.airline))];

    const parseDurationToMinutes = (str) => {
        if (!str) return 0;
        let total = 0;
        const hMatch = str.match(/(\d+)h/);
        const mMatch = str.match(/(\d+)m/);
        if (hMatch) total += parseInt(hMatch[1]) * 60;
        if (mMatch) total += parseInt(mMatch[1]);
        return total;
    };

    const getTimeSlot = (timeStr) => {
        const mins = parseTimeToMinutes(timeStr);
        if (mins < 360) return 'early'; // 0-6 AM
        if (mins < 720) return 'morning'; // 6-12 PM
        if (mins < 1080) return 'afternoon'; // 12-6 PM
        return 'evening'; // 6PM-12AM
    };

    const getStopLabel = (stops) => {
        if (!stops) return 'Non-Stop';
        const s = String(stops).toLowerCase().trim();
        if (s === '0' || s === 'non-stop' || s === 'direct' || s === 'nonstop') return 'Non-Stop';
        if (s === '1' || s === '1 stop' || s === '1stop') return '1 Stop';
        return '2+ Stops';
    };

    const filteredFlights = flights
        .filter(f => {
            if (selectedAirlines.length > 0 && !selectedAirlines.includes(f.airline)) return false;
            if (selectedStops.length > 0 && !selectedStops.includes(getStopLabel(f.stops))) return false;
            if (selectedDepSlots.length > 0 && !selectedDepSlots.includes(getTimeSlot(f.departureTime))) return false;
            if (selectedArrSlots.length > 0 && !selectedArrSlots.includes(getTimeSlot(f.arrivalTime))) return false;
            if (flightNoQuery && !f.flightNumber?.toLowerCase().includes(flightNoQuery.toLowerCase())) return false;
            if (selectedRefundables.length > 0) {
                const rType = f.refType || f.refundType?.charAt(0) || 'N';
                const label = rType === 'R' || rType === 'P' ? 'Refundable' : 'Non-Refundable';
                if (!selectedRefundables.includes(label)) return false;
            }
            if (maxDurationFilter < 1440) {
                if (parseDurationToMinutes(f.duration) > maxDurationFilter) return false;
            }
            return true;
        })
        .sort((a, b) => sortBy === 'priceLow' ? a.price - b.price : b.price - a.price);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!from || !to) { toast.warn('Please select origin and destination'); return; }
        if (from === to) { toast.warn('Origin and destination cannot be the same.'); return; }
        setLoading(true); setError(''); setFlights([]);
        try {
            const TRIP_TYPE_MAP = { oneWay: 0, roundTrip: 1, multiCity: 2 };
            const res = await bookingService.searchFlights(from, to, date, {
                adt: pax.adt, chd: pax.chd, inf: pax.inf,
                tripType: TRIP_TYPE_MAP[tripType] ?? 0,
                returnDate: tripType === 'roundTrip' ? returnDate : undefined,
            });
            if (res.success) {
                let data = res.data?.flights || (Array.isArray(res.data) ? res.data : []);
                if (date === today) {
                    const now = new Date();
                    const buf = (now.getHours() * 60 + now.getMinutes()) + 60;
                    data = data.filter(f => parseTimeToMinutes(f.departureTime) >= buf);
                }
                setFlights(data);
            } else { setError(res.message); }
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const handleBook = async (flight, selectedFareOption = null) => {
        setVerifyingPrice(true);
        try {
            let flightID = selectedFareOption?.flightID || selectedFareOption?.FlightID ||
                           selectedFareOption?.Fare?.flightID || selectedFareOption?.Fare?.FlightID ||
                           selectedFareOption?.Flights?.Onward?.[0]?.flightID ||
                           selectedFareOption?.Flights?.Onward?.["0"]?.flightID ||
                           selectedFareOption?.ID || flight.flightID;
            let originalNetfare = Number(selectedFareOption?.Fare?.total?.netfare ||
                                         selectedFareOption?.Netfare || selectedFareOption?.netfare ||
                                         selectedFareOption?.price || flight.netfare || 0);
            if (!selectedFareOption) {
                const fareRes = await bookingService.ftdGetFareDetails(flight.id, flight.refID);
                const faresArray = fareRes.data?.results || fareRes.data?.data || (Array.isArray(fareRes.data) ? fareRes.data : []);
                if (fareRes.success && faresArray?.length > 0) {
                    const ff = faresArray[0];
                    flightID = ff.flightID || ff.FlightID || ff.Fare?.flightID || ff.Fare?.FlightID || ff.Flights?.Onward?.[0]?.flightID || flightID;
                    originalNetfare = Number(ff.Netfare || ff.Fare?.total?.netfare || originalNetfare);
                }
            }
            const verifyRes = await bookingService.ftdVerifyPrice(flightID, flight.refID, originalNetfare);
            if (verifyRes.success) {
                const { currentNetfare } = verifyRes.data;
                const finalBaseFare = showNetPrice ? (currentNetfare + (Number(markupAmount) || 0)) : currentNetfare;
                navigate('/agent/checkout', { state: { bookingData: { service: 'Flight', from, to, baseFare: finalBaseFare, passengers, details: { ...flight, ...selectedFareOption, flightID, date, appliedMarkup: Number(markupAmount), ssrInfo: verifyRes.data.ssrInfo } } } });
            } else { toast.error(`Verification failed: ${verifyRes.message}`); }
        } catch (err) { toast.error(err.message || 'Error verifying price.'); }
        finally { setVerifyingPrice(false); }
    };

    const fetchFares = async (flight) => {
        if (expandedFlightId === flight.id) { setExpandedFlightId(null); return; }
        setExpandedFlightId(flight.id);
        if (fareDetails[flight.id]) return;
        setLoadingFares(flight.id);
        try {
            const res = await bookingService.ftdGetFareDetails(flight.id, flight.refID);
            if (res.success) {
                const fares = res.data?.results || res.data?.data || (Array.isArray(res.data) ? res.data : []);
                setFareDetails(prev => ({ ...prev, [flight.id]: fares }));
            }
        } catch (err) { toast.error(err.message || 'Error fetching fares.'); }
        finally { setLoadingFares(null); }
    };

    const parseFareRules = rawContent => {
        if (!rawContent || typeof rawContent !== 'string') return { cancellation: '', dateChange: '', noShow: '', penalties: [], raw: String(rawContent) };
        const text = rawContent.replace(/\s+/g, ' ');
        const getSection = keywords => {
            for (const kw of keywords) {
                const idx = text.toUpperCase().indexOf(kw.toUpperCase());
                if (idx !== -1) {
                    let chunk = text.substring(idx, idx + 500);
                    const markers = ['REISSUE', 'DATE CHANGE', 'NO SHOW', 'REFUND', 'CANCELLATION', 'NOTES', 'RE-ISSUE', 'BAGGAGE'];
                    let end = 500;
                    markers.forEach(m => { const i = chunk.toUpperCase().indexOf(m.toUpperCase(), kw.length); if (i !== -1 && i < end) end = i; });
                    return chunk.substring(0, end).trim();
                }
            }
            return '';
        };

        // Try to extract penalty amounts from text
        const penalties = [];
        const amtRegex = /(?:Rs\.?|INR|₹)\s*([\d,]+)/gi;
        const cancText = getSection(['CANCELLATION', 'REFUND', 'CANCL']);
        let match;
        while ((match = amtRegex.exec(cancText)) !== null) {
            const amt = parseInt(match[1].replace(/,/g, ''));
            if (amt > 0 && amt < 50000) penalties.push(amt);
        }

        return {
            cancellation: getSection(['CANCELLATION', 'REFUND', 'CANCL']),
            dateChange: getSection(['REISSUE', 'DATE CHANGE', 'RE-ISSUE', 'CHANGES']),
            noShow: getSection(['NO SHOW', 'NOSHOW']),
            penalties,
            raw: rawContent
        };
    };

    const handleViewFareRules = async (flightID, flightNo, refType, origin, destination) => {
        setFetchingRules(true);
        try {
            const res = await bookingService.ftdGetFareRules(flightID);
            if (res.success) {
                const parsed = parseFareRules(res.data);
                setFareRulesModal({ show: true, content: res.data || 'No rules provided.', parsed, flightNo, refType, route: `${origin}-${destination}` });
            }
        } catch { toast.error('Error fetching rules.'); }
        finally { setFetchingRules(false); }
    };

    return (
        <div className="flex-1 min-h-screen bg-white -m-4 sm:-m-6 lg:-m-8 pb-12" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

            {/* ── HEADER ───────────────────────────────────────────────────── */}
            <div 
                className="w-full pt-12 pb-36 px-4 sm:px-6 relative overflow-hidden"
                style={{ 
                    backgroundImage: `url(${heroBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#1D4171'
                }}
            >
                <div className="max-w-7xl mx-auto relative z-10">
                    <h1 className="text-white text-3xl sm:text-[38px] font-black mb-2 tracking-tight animate-fade-in">Book Flights</h1>
                    <p className="text-white/80 text-xs sm:text-sm font-medium animate-fade-in">Search across multiple airlines with real-time pricing.</p>
                </div>
            </div>

            {/* ── SEARCH CARD ──────────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 -mt-28 sm:-mt-24 relative z-20">
                <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(10,100,219,0.08)] p-5 sm:p-8 mb-6 border border-slate-100">

                    {/* Tab Selection */}
                    <div className="relative border-b border-slate-100 mb-6">
                        <div className="flex items-center w-full pb-3">
                            {/* One Way Tab */}
                            <button
                                type="button"
                                onClick={() => setTripType('oneWay')}
                                className={`flex-1 flex items-center justify-center gap-3 py-1.5 transition-all relative ${tripType === 'oneWay' ? 'text-slate-900 font-extrabold' : 'text-slate-400 font-bold hover:text-slate-600'}`}
                            >
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${tripType === 'oneWay' ? 'bg-[#ff6c00] text-white shadow-sm' : 'bg-blue-50/50 text-blue-500'}`}>
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="7" y1="17" x2="17" y2="7"></line>
                                        <polyline points="7 7 17 7 17 17"></polyline>
                                    </svg>
                                </span>
                                <span className="text-xs sm:text-sm uppercase tracking-wider">One Way</span>
                                {tripType === 'oneWay' && (
                                    <div className="absolute bottom-[-13px] left-0 right-0 h-[3px] bg-gradient-to-r from-[#ff8000] to-[#ff5100] rounded-full" />
                                )}
                            </button>
                            
                            <div className="w-[1px] h-6 bg-slate-200" />
                            
                            {/* Round Trip Tab */}
                            <button
                                type="button"
                                onClick={() => setTripType('roundTrip')}
                                className={`flex-1 flex items-center justify-center gap-3 py-1.5 transition-all relative ${tripType === 'roundTrip' ? 'text-slate-900 font-extrabold' : 'text-slate-400 font-bold hover:text-slate-600'}`}
                            >
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${tripType === 'roundTrip' ? 'bg-[#ff6c00] text-white shadow-sm' : 'bg-blue-50/50 text-blue-500'}`}>
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 2.5l4 4-4 4M7 21.5l-4-4 4-4"/>
                                        <path d="M3 17.5h18M21 6.5H3"/>
                                    </svg>
                                </span>
                                <span className="text-xs sm:text-sm uppercase tracking-wider">Round Trip</span>
                                {tripType === 'roundTrip' && (
                                    <div className="absolute bottom-[-13px] left-0 right-0 h-[3px] bg-gradient-to-r from-[#ff8000] to-[#ff5100] rounded-full" />
                                )}
                            </button>
                            
                            <div className="w-[1px] h-6 bg-slate-200" />
                            
                            {/* Multi City Tab */}
                            <button
                                type="button"
                                onClick={() => setTripType('multiCity')}
                                className={`flex-1 flex items-center justify-center gap-3 py-1.5 transition-all relative ${tripType === 'multiCity' ? 'text-slate-900 font-extrabold' : 'text-slate-400 font-bold hover:text-slate-600'}`}
                            >
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${tripType === 'multiCity' ? 'bg-[#ff6c00] text-white shadow-sm' : 'bg-blue-50/50 text-blue-500'}`}>
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 9 6 9 12 15 12 15 18 21 18"></polyline>
                                        <circle cx="3" cy="6" r="1"></circle>
                                        <circle cx="21" cy="18" r="1"></circle>
                                    </svg>
                                </span>
                                <span className="text-xs sm:text-sm uppercase tracking-wider">Multi City</span>
                                {tripType === 'multiCity' && (
                                    <div className="absolute bottom-[-13px] left-0 right-0 h-[3px] bg-gradient-to-r from-[#ff8000] to-[#ff5100] rounded-full" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* MOBILE INPUTS STACK CONTAINER */}
                    <div className="md:hidden border border-slate-200/80 rounded-3xl bg-white shadow-[0_4px_25px_rgba(0,0,0,0.02)] mb-5">
                        {/* Row 1: FROM */}
                        <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 relative rounded-t-[22px]">
                            <div className="text-blue-500 shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25C4.5 6.63 7.63 3.5 11.5 3.5s7 3.13 7 7z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">FROM</span>
                                <AirportAutocomplete label="" codeValue={from} onChangeCode={setFrom} />
                            </div>
                            {/* Swap Button inside FROM */}
                            <button 
                                type="button" 
                                onClick={() => { const t = from; setFrom(to); setTo(t); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-blue-50 text-blue-600 shadow-sm flex items-center justify-center text-sm font-bold border border-white hover:bg-blue-100 active:scale-90 transition-all duration-200"
                            >
                                ⇅
                            </button>
                        </div>

                        {/* Row 2: TO */}
                        <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100">
                            <div className="text-blue-500 shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25C4.5 6.63 7.63 3.5 11.5 3.5s7 3.13 7 7z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">TO</span>
                                <AirportAutocomplete label="" codeValue={to} onChangeCode={setTo} />
                            </div>
                        </div>

                        {/* Row 3: DEPART */}
                        <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 relative">
                            <div className="text-blue-500 shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0 relative">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">DEPART</span>
                                <div className="relative mt-0.5">
                                    <span className="text-[15px] font-bold text-slate-800 block pointer-events-none">
                                        {formatDisplayDate(date)}
                                    </span>
                                    <input 
                                        type="date" 
                                        value={date} 
                                        min={today} 
                                        onChange={e => setDate(e.target.value)}
                                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0" 
                                    />
                                </div>
                            </div>
                            <div className="text-slate-400 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </div>
                        </div>

                        {/* Row 4 (if roundTrip): RETURN */}
                        {tripType === 'roundTrip' && (
                            <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 relative">
                                <div className="text-blue-500 shrink-0">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0 relative">
                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block">RETURN</span>
                                    <div className="relative mt-0.5">
                                        <span className="text-[15px] font-bold text-slate-800 block pointer-events-none">
                                            {formatDisplayDate(returnDate)}
                                        </span>
                                        <input 
                                            type="date" 
                                            value={returnDate} 
                                            min={date} 
                                            onChange={e => setReturnDate(e.target.value)}
                                            onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0" 
                                        />
                                    </div>
                                </div>
                                <div className="text-slate-400 pointer-events-none">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <polyline points="6 9 12 15 18 9"/>
                                    </svg>
                                </div>
                            </div>
                        )}

                        {/* Row 5: TRAVELLERS & CLASS */}
                        <div 
                            onClick={() => setPaxOpen(!paxOpen)}
                            className="flex items-center gap-4 px-5 py-4 relative cursor-pointer pax-container rounded-b-[22px]"
                        >
                            <div className="text-blue-500 shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5A8.25 8.25 0 0112 11.25a8.25 8.25 0 017.5 8.25v1.5H4.5v-1.5z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">TRAVELLERS & CLASS</span>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-[15px] font-bold text-slate-800">{passengers} Pax</span>
                                    <span className="text-[11px] font-black uppercase text-[#ff6c00] tracking-wider">{cabinClass.toUpperCase()}</span>
                                </div>
                            </div>
                            <div className="text-slate-400 shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </div>

                            {/* Dropdown overlay for Pax */}
                            {paxOpen && (
                                <div 
                                    className="absolute top-[76px] left-0 bg-white rounded-3xl shadow-2xl z-[100] flex flex-col overflow-hidden border border-slate-100 w-full animate-scale-in max-h-[450px] overflow-y-auto"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="p-5 space-y-5 bg-white">
                                        {[
                                            { id: 'adt', label: 'Adults', sub: '12+ yrs', min: 1, max: 9 },
                                            { id: 'chd', label: 'Children', sub: '2-12 yrs', min: 0, max: 8 },
                                            { id: 'inf', label: 'Infants', sub: '0-2 yrs', min: 0, max: 8 }
                                        ].map(type => (
                                            <div key={type.id}>
                                                <p className="text-xs font-black text-blue-950 mb-2 uppercase tracking-tighter">{type.label} <span className="text-[10px] text-slate-400 font-normal lowercase">({type.sub})</span></p>
                                                <div className="flex flex-wrap gap-2">
                                                    {Array.from({ length: type.max - type.min + 1 }, (_, i) => i + type.min).map(n => (
                                                        <button 
                                                            type="button"
                                                            key={n} 
                                                            onClick={() => setPax(p => ({ ...p, [type.id]: n }))}
                                                            className="w-8 h-8 rounded-lg text-xs font-black transition-all"
                                                            style={{ background: pax[type.id] === n ? '#ff6c00' : '#F4F4F4', color: pax[type.id] === n ? '#fff' : '#555' }}
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-5 border-t border-slate-50 bg-slate-50/40">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Class</p>
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            {['Economy', 'Premium Economy', 'Business', 'First'].map(c => (
                                                <label key={c} className="flex items-center justify-between cursor-pointer gap-2 bg-white px-3 py-2 rounded-xl border border-slate-150 shadow-sm">
                                                    <span className="text-[10px] font-bold text-slate-700">{c}</span>
                                                    <input 
                                                        type="radio" 
                                                        className="w-3.5 h-3.5 accent-[#ff6c00]"
                                                        checked={cabinClass === c} 
                                                        onChange={() => setCabinClass(c)} 
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setPaxOpen(false)}
                                            className="w-full bg-[#ff6c00] hover:bg-orange-600 text-white font-black py-3 rounded-xl uppercase text-xs tracking-wider shadow-lg shadow-orange-500/20"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* DESKTOP & TABLET INPUTS GRID */}
                    <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-5 mb-6">
                        {/* FROM */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-4 flex items-center gap-3.5 shadow-sm transition-all focus-within:border-blue-300 focus-within:shadow-md relative min-w-0">
                            <div className="text-blue-500 shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25C4.5 6.63 7.63 3.5 11.5 3.5s7 3.13 7 7z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">FROM</span>
                                <AirportAutocomplete label="" codeValue={from} onChangeCode={setFrom} />
                            </div>
                            {/* Desktop Swap Button */}
                            <button 
                                type="button" 
                                onClick={() => { const t = from; setFrom(to); setTo(t); }}
                                className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-blue-50 text-blue-600 shadow-md flex items-center justify-center text-sm font-bold border border-white hover:bg-blue-100 hover:rotate-180 transition-all duration-350 active:scale-95"
                            >
                                ⇅
                            </button>
                        </div>

                        {/* TO */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-4 flex items-center gap-3.5 shadow-sm transition-all focus-within:border-blue-300 focus-within:shadow-md relative min-w-0">
                            <div className="text-blue-500 shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25C4.5 6.63 7.63 3.5 11.5 3.5s7 3.13 7 7z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">TO</span>
                                <AirportAutocomplete label="" codeValue={to} onChangeCode={setTo} />
                            </div>
                        </div>

                        {/* DEPART */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-4 flex items-center gap-3.5 shadow-sm transition-all focus-within:border-blue-300 focus-within:shadow-md relative min-w-0">
                            <div className="text-blue-500 shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0 relative">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">DEPART</span>
                                <div className="relative mt-0.5">
                                    <span className="text-sm font-bold text-slate-800 block pointer-events-none">
                                        {formatDisplayDate(date)}
                                    </span>
                                    <input 
                                        type="date" 
                                        value={date} 
                                        min={today} 
                                        onChange={e => setDate(e.target.value)}
                                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0" 
                                    />
                                </div>
                            </div>
                            <div className="text-slate-400 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </div>
                        </div>

                        {/* RETURN / TRAVELLERS (depending on tripType) */}
                        {tripType === 'roundTrip' ? (
                            <>
                                <div className="bg-white border border-slate-200 rounded-3xl p-4 flex items-center gap-3.5 shadow-sm transition-all focus-within:border-blue-300 focus-within:shadow-md relative min-w-0">
                                    <div className="text-blue-500 shrink-0">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                            <line x1="16" y1="2" x2="16" y2="6"/>
                                            <line x1="8" y1="2" x2="8" y2="6"/>
                                            <line x1="3" y1="10" x2="21" y2="10"/>
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0 relative">
                                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-0.5">RETURN</span>
                                        <div className="relative mt-0.5">
                                            <span className="text-sm font-bold text-slate-800 block pointer-events-none">
                                                {formatDisplayDate(returnDate)}
                                            </span>
                                            <input 
                                                type="date" 
                                                value={returnDate} 
                                                min={date} 
                                                onChange={e => setReturnDate(e.target.value)}
                                                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0" 
                                            />
                                        </div>
                                    </div>
                                    <div className="text-slate-400 pointer-events-none">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <polyline points="6 9 12 15 18 9"/>
                                        </svg>
                                    </div>
                                </div>
                                
                                {/* Full Width Row for Travellers in Round Trip */}
                                <div 
                                    className="col-span-full bg-white border border-slate-200 rounded-3xl p-4 flex items-center gap-3.5 shadow-sm transition-all focus-within:border-blue-300 focus-within:shadow-md relative min-w-0 cursor-pointer pax-container"
                                    onClick={() => setPaxOpen(!paxOpen)}
                                >
                                    <div className="text-blue-500 shrink-0">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5A8.25 8.25 0 0112 11.25a8.25 8.25 0 017.5 8.25v1.5H4.5v-1.5z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">TRAVELLERS & CLASS</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-sm font-bold text-slate-800">{passengers} Pax</span>
                                            <span className="text-[10px] font-black uppercase text-[#ff6c00] bg-orange-50 px-2 py-0.5 rounded-full">{cabinClass}</span>
                                        </div>
                                    </div>
                                    <div className="text-slate-400 shrink-0">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <polyline points="6 9 12 15 18 9"/>
                                        </svg>
                                    </div>

                                    {paxOpen && (
                                        <div 
                                            className="absolute top-[76px] right-0 bg-white rounded-3xl shadow-2xl z-[100] flex overflow-hidden border border-slate-100 animate-scale-in w-[480px]"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <div className="flex-1 p-6 space-y-6 bg-white">
                                                {[
                                                    { id: 'adt', label: 'Adults', sub: '12+ yrs', min: 1, max: 9 },
                                                    { id: 'chd', label: 'Children', sub: '2-12 yrs', min: 0, max: 8 },
                                                    { id: 'inf', label: 'Infants', sub: '0-2 yrs', min: 0, max: 8 }
                                                ].map(type => (
                                                    <div key={type.id}>
                                                        <p className="text-xs font-black text-blue-950 mb-3 uppercase tracking-tighter">{type.label} <span className="text-[10px] text-slate-400 font-normal lowercase">({type.sub})</span></p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {Array.from({ length: type.max - type.min + 1 }, (_, i) => i + type.min).map(n => (
                                                                <button 
                                                                    type="button"
                                                                    key={n} 
                                                                    onClick={() => setPax(p => ({ ...p, [type.id]: n }))}
                                                                    className="w-9 h-9 rounded-lg text-xs font-black transition-all"
                                                                    style={{ background: pax[type.id] === n ? '#ff6c00' : '#F4F4F4', color: pax[type.id] === n ? '#fff' : '#555' }}
                                                                >
                                                                    {n}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-6 border-l border-slate-50 bg-slate-50/40 w-[180px]">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Class</p>
                                                <div className="space-y-4">
                                                    {['Economy', 'Premium Economy', 'Business', 'First'].map(c => (
                                                        <label key={c} className="flex items-center justify-between cursor-pointer gap-2">
                                                            <span className="text-xs font-bold" style={{ color: cabinClass === c ? '#ff6c00' : '#555' }}>{c}</span>
                                                            <input 
                                                                type="radio" 
                                                                className="w-4 h-4 accent-[#ff6c00]" 
                                                                checked={cabinClass === c} 
                                                                onChange={() => setCabinClass(c)} 
                                                            />
                                                        </label>
                                                    ))}
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => setPaxOpen(false)}
                                                    className="w-full mt-8 bg-[#ff6c00] hover:bg-orange-600 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-[0.15em] shadow-lg shadow-orange-500/20"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            /* TRAVELLERS & CLASS (Default One Way / Multi City Column) */
                            <div 
                                className="bg-white border border-slate-200 rounded-3xl p-4 flex items-center gap-3.5 shadow-sm transition-all focus-within:border-blue-300 focus-within:shadow-md relative min-w-0 cursor-pointer pax-container"
                                onClick={() => setPaxOpen(!paxOpen)}
                            >
                                <div className="text-blue-500 shrink-0">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5A8.25 8.25 0 0112 11.25a8.25 8.25 0 017.5 8.25v1.5H4.5v-1.5z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">TRAVELLERS & CLASS</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-sm font-bold text-slate-800">{passengers} Pax</span>
                                        <span className="text-[10px] font-black uppercase text-[#ff6c00] bg-orange-50 px-2 py-0.5 rounded-full">{cabinClass}</span>
                                    </div>
                                </div>
                                <div className="text-slate-400 shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <polyline points="6 9 12 15 18 9"/>
                                    </svg>
                                </div>

                                {paxOpen && (
                                    <div 
                                        className="absolute top-[76px] right-0 bg-white rounded-3xl shadow-2xl z-[100] flex overflow-hidden border border-slate-100 animate-scale-in w-[480px]"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="flex-1 p-6 space-y-6 bg-white">
                                            {[
                                                { id: 'adt', label: 'Adults', sub: '12+ yrs', min: 1, max: 9 },
                                                { id: 'chd', label: 'Children', sub: '2-12 yrs', min: 0, max: 8 },
                                                { id: 'inf', label: 'Infants', sub: '0-2 yrs', min: 0, max: 8 }
                                            ].map(type => (
                                                <div key={type.id}>
                                                    <p className="text-xs font-black text-blue-950 mb-3 uppercase tracking-tighter">{type.label} <span className="text-[10px] text-slate-400 font-normal lowercase">({type.sub})</span></p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Array.from({ length: type.max - type.min + 1 }, (_, i) => i + type.min).map(n => (
                                                            <button 
                                                                type="button"
                                                                key={n} 
                                                                onClick={() => setPax(p => ({ ...p, [type.id]: n }))}
                                                                className="w-9 h-9 rounded-lg text-xs font-black transition-all"
                                                                style={{ background: pax[type.id] === n ? '#ff6c00' : '#F4F4F4', color: pax[type.id] === n ? '#fff' : '#555' }}
                                                            >
                                                                {n}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-6 border-l border-slate-50 bg-slate-50/40 w-[180px]">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Class</p>
                                            <div className="space-y-4">
                                                {['Economy', 'Premium Economy', 'Business', 'First'].map(c => (
                                                    <label key={c} className="flex items-center justify-between cursor-pointer gap-2">
                                                        <span className="text-xs font-bold" style={{ color: cabinClass === c ? '#ff6c00' : '#555' }}>{c}</span>
                                                        <input 
                                                            type="radio" 
                                                            className="w-4 h-4 accent-[#ff6c00]" 
                                                            checked={cabinClass === c} 
                                                            onChange={() => setCabinClass(c)} 
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => setPaxOpen(false)}
                                                className="w-full mt-8 bg-[#ff6c00] hover:bg-orange-600 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-[0.15em] shadow-lg shadow-orange-500/20"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SEARCH FLIGHTS BUTTON (Centered & Responsive) */}
                    <div className="flex justify-center mt-6">
                        <button 
                            onClick={handleSearch}
                            className="w-full md:w-auto md:min-w-[340px] h-14 bg-gradient-to-r from-[#ff7a00] to-[#ff5100] hover:shadow-xl hover:shadow-orange-500/10 text-white font-black rounded-full transition-all transform active:scale-98 text-xs sm:text-sm tracking-widest uppercase flex items-center justify-between px-6 shadow-lg group relative overflow-hidden"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs shrink-0 font-bold">
                                    <svg className="w-4 h-4 transform -rotate-45" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                    </svg>
                                </span>
                                <span>{loading ? 'Searching...' : 'Search Flights'}</span>
                            </div>
                            <span className="text-lg group-hover:translate-x-1.5 transition-transform duration-200">➔</span>
                        </button>
                    </div>

                </div>

                {/* Features Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 bg-white border border-slate-100 p-3.5 rounded-2xl shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-50/70 flex items-center justify-center text-[#095ec8] shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-[10px] sm:text-[11px] font-black text-slate-800 uppercase tracking-wider">Best Price</h4>
                            <p className="text-[9px] font-bold text-slate-400">Guarantee</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white border border-slate-100 p-3.5 rounded-2xl shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-50/70 flex items-center justify-center text-[#095ec8] shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V6a3 3 0 016 0v6.75a3 3 0 01-3 3z"/>
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-[10px] sm:text-[11px] font-black text-slate-800 uppercase tracking-wider">24/7 Support</h4>
                            <p className="text-[9px] font-bold text-slate-400">We are here</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white border border-slate-100 p-3.5 rounded-2xl shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-50/70 flex items-center justify-center text-[#095ec8] shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-[10px] sm:text-[11px] font-black text-slate-800 uppercase tracking-wider">Secure Booking</h4>
                            <p className="text-[9px] font-bold text-slate-400">Your data is safe</p>
                        </div>
                    </div>
                </div>

                {/* Floating Action Button */}
                <div className="fixed bottom-6 right-6 z-[99]">
                    <button className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#095ec8] to-[#8b5cf6] hover:scale-105 active:scale-95 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center transition-all duration-200">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
                        </svg>
                    </button>
                </div>

                {loading && <InspirationLoader />}
                {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-600 font-bold">{error}</div>}

                {!loading && flights.length > 0 && (
                    <div className="lg:hidden flex items-center justify-between mb-4 gap-3">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="flex-1 bg-white border border-[#D0D0D0] py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm active:bg-gray-50">
                            <span className="text-lg">⚙️</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#555]">Filters & Sort</span>
                        </button>
                        <p className="text-[10px] font-black text-[#888] uppercase tracking-widest pr-2">{filteredFlights.length} Flights</p>
                    </div>
                )}

                {!loading && flights.length > 0 && (
                    <div className="flex flex-col lg:flex-row gap-6 pb-20 items-start">
                        {/* SIDEBAR */}
                        <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                            fixed lg:sticky top-0 lg:top-4 left-0 w-full lg:w-[280px] h-full lg:h-auto
                            bg-gray-50 lg:bg-transparent z-[150] lg:z-10 transition-transform duration-300 p-4 lg:p-0 overflow-y-auto lg:overflow-visible`}>
                            
                            <div className="lg:hidden flex items-center justify-between mb-6">
                                <p className="text-sm font-black uppercase tracking-widest text-[#222]">Filters</p>
                                <button onClick={() => setIsSidebarOpen(false)} className="w-10 h-10 flex border rounded-full justify-center items-center text-xl font-bold">×</button>
                            </div>

                            <div className="bg-white rounded border border-[#E0E0E0] shadow-sm mb-4">
                                <div className="flex justify-between items-center px-4 py-3 border-b border-[#EFEFEF]">
                                    <p className="text-xs font-bold text-[#333] uppercase">Agent Tools</p>
                                    <button onClick={() => setIsEditingMarkup(true)} className="text-[11px] font-bold text-[#FF8000] hover:underline">Set Markup</button>
                                </div>
                                <div className="px-4 py-3 flex items-center gap-3">
                                    <div onClick={() => setShowNetPrice(!showNetPrice)} className="flex items-center rounded-full p-0.5 cursor-pointer"
                                        style={{ width: '36px', height: '20px', background: showNetPrice ? '#FF8000' : '#CCC' }}>
                                        <div className="bg-white rounded-full w-4 h-4 shadow transition-transform" style={{ transform: showNetPrice ? 'translateX(16px)' : 'translateX(0)' }} />
                                    </div>
                                    <p className="text-[11px] font-semibold text-[#555]">Show Net Price</p>
                                </div>
                            </div>

                            <div className="bg-white rounded border border-[#E0E0E0] shadow-sm mb-4">
                                <div className="px-4 py-3 border-b border-[#F0F0F0]">
                                    <p className="text-[10px] font-black text-[#999] uppercase tracking-widest mb-2">Search Flight No.</p>
                                    <input type="text" placeholder="e.g. 6E-203" 
                                        className="w-full bg-[#FAFAFA] border border-[#DDD] rounded px-3 py-2 text-xs font-bold outline-none focus:border-[#FF8000] transition-colors"
                                        value={flightNoQuery} onChange={e => setFlightNoQuery(e.target.value)} />
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-2 px-1">
                                <p className="text-[10px] font-black text-[#888] uppercase tracking-widest">{filteredFlights.length} Flights</p>
                                <button onClick={() => {
                                    setSelectedAirlines([]); setSelectedStops([]); setSelectedDepSlots([]); setSelectedArrSlots([]);
                                    setFlightNoQuery(''); setAirlineSubQuery(''); setSelectedRefundables([]); setMaxDurationFilter(1440); setSortBy('fareLow');
                                }} className="text-[11px] font-bold text-blue-500 hover:underline">Reset All</button>
                            </div>

                            <SidebarSection title="Sort By">
                                <div className="space-y-2 px-4 py-3">
                                    {[{v:'priceLow',l:'Price: Lowest First'},{v:'priceHigh',l:'Price: Highest First'}].map(s => (
                                        <label key={s.v} className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="sort" style={{ accentColor: '#FF8000' }} checked={sortBy === s.v} onChange={() => setSortBy(s.v)} />
                                            <span className="text-[12px] font-medium" style={{ color: sortBy === s.v ? '#FF8000' : '#555' }}>{s.l}</span>
                                        </label>
                                    ))}
                                </div>
                            </SidebarSection>

                            <SidebarSection title="Stops" onReset={() => setSelectedStops([])}>
                                <div className="space-y-2 px-4 py-3">
                                    {['Non-Stop', '1 Stop', '2+ Stops'].map(s => {
                                        const count = flights.filter(f => getStopLabel(f.stops) === s).length;
                                        if (count === 0) return null;
                                        return (
                                            <label key={s} className="flex items-center justify-between cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" style={{ accentColor: '#FF8000' }} checked={selectedStops.includes(s)}
                                                        onChange={e => e.target.checked ? setSelectedStops([...selectedStops, s]) : setSelectedStops(selectedStops.filter(x => x !== s))} />
                                                    <span className="text-[12px] font-medium text-[#555]">{s}</span>
                                                </div>
                                                <span className="text-[11px] text-[#888]">{count}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </SidebarSection>

                            <SidebarSection title="Departure" onReset={() => setSelectedDepSlots([])}>
                                <div className="grid grid-cols-2 gap-2 px-4 py-3">
                                    {[{id:'early',l:'Before 6AM'},{id:'morning',l:'6AM-12PM'},{id:'afternoon',l:'12PM-6PM'},{id:'evening',l:'After 6PM'}].map(s => (
                                        <button key={s.id} onClick={() => setSelectedDepSlots(prev => prev.includes(s.id)?prev.filter(x=>x!==s.id):[...prev,s.id])}
                                            className={`p-2 border rounded text-[10px] font-bold transition-all ${selectedDepSlots.includes(s.id)?'border-[#FF8000] bg-[#FFFAF5] text-[#FF8000]':'border-[#E0E0E0] text-[#555] opacity-70'}`}>
                                            {s.l}
                                        </button>
                                    ))}
                                </div>
                            </SidebarSection>

                            <SidebarSection title="Arrival" onReset={() => setSelectedArrSlots([])}>
                                <div className="grid grid-cols-2 gap-2 px-4 py-3">
                                    {[{id:'early',l:'Before 6AM'},{id:'morning',l:'6AM-12PM'},{id:'afternoon',l:'12PM-6PM'},{id:'evening',l:'After 6PM'}].map(s => (
                                        <button key={s.id} onClick={() => setSelectedArrSlots(prev => prev.includes(s.id)?prev.filter(x=>x!==s.id):[...prev,s.id])}
                                            className={`p-2 border rounded text-[10px] font-bold transition-all ${selectedArrSlots.includes(s.id)?'border-[#FF8000] bg-[#FFFAF5] text-[#FF8000]':'border-[#E0E0E0] text-[#555] opacity-70'}`}>
                                            {s.l}
                                        </button>
                                    ))}
                                </div>
                            </SidebarSection>

                            <SidebarSection title="Airlines" onReset={() => setSelectedAirlines([])}>
                                <div className="px-4 py-2 border-b border-[#F0F0F0]"><input type="text" placeholder="Search" className="w-full text-[11px] outline-none" value={airlineSubQuery} onChange={e=>setAirlineSubQuery(e.target.value)} /></div>
                                <div className="space-y-2 px-4 py-3 max-h-[220px] overflow-y-auto">
                                    {availableAirlines.filter(a=>a.toLowerCase().includes(airlineSubQuery.toLowerCase())).map(a => (
                                        <label key={a} className="flex items-center justify-between cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" style={{ accentColor: '#FF8000' }} checked={selectedAirlines.includes(a)}
                                                    onChange={e=>e.target.checked?setSelectedAirlines([...selectedAirlines,a]):setSelectedAirlines(selectedAirlines.filter(x=>x!==a))} />
                                                <span className="text-[12px] font-medium text-[#555] truncate max-w-[140px]">{a}</span>
                                            </div>
                                            <span className="text-[11px] text-[#888]">{flights.filter(f=>f.airline===a).length}</span>
                                        </label>
                                    ))}
                                </div>
                            </SidebarSection>

                            <SidebarSection title="Journey Duration" onReset={() => setMaxDurationFilter(1440)}>
                                <div className="px-4 py-4"><input type="range" min="60" max="1440" step="30" className="w-full h-1 bg-gray-200 accent-[#FF8000] cursor-pointer" value={maxDurationFilter} onChange={e=>setMaxDurationFilter(parseInt(e.target.value))} />
                                <p className="text-[10px] font-bold text-[#888] mt-2 italic text-center">Up to {Math.floor(maxDurationFilter/60)}h {maxDurationFilter%60}m</p></div>
                            </SidebarSection>

                            <SidebarSection title="Refundability" onReset={() => setSelectedRefundables([])}>
                                <div className="space-y-2 px-4 py-3">
                                    {['Refundable', 'Non-Refundable'].map(r => (
                                        <label key={r} className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" style={{ accentColor: '#FF8000' }} checked={selectedRefundables.includes(r)}
                                                onChange={e => e.target.checked ? setSelectedRefundables([...selectedRefundables, r]) : setSelectedRefundables(selectedRefundables.filter(x => x !== r))} />
                                            <span className="text-[12px] font-medium text-[#555]">{r}</span>
                                        </label>
                                    ))}
                                </div>
                            </SidebarSection>

                            {/* Mobile Apply Button */}
                            <div className="lg:hidden sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E0E0E0] mt-auto">
                                <button onClick={() => setIsSidebarOpen(false)}
                                    className="w-full bg-[#FF8000] text-white font-black py-4 rounded-xl uppercase text-xs tracking-[0.2em] shadow-xl shadow-orange-500/20">
                                    Show {filteredFlights.length} Flights
                                </button>
                            </div>
                        </div>

                        {/* CARDS LIST */}
                        <div className="flex-1 min-w-0 space-y-4">
                            {filteredFlights.map((flight, idx) => {
                                const displayFare = showNetPrice ? Number(flight.price) + Number(markupAmount) : Number(flight.price);
                                const isExpanded = expandedFlightId === flight.id;
                                const rType = flight.refType || flight.refundType?.charAt(0) || 'N';
                                const refBadge = rType==='R'?{l:'Refundable',c:'#1e7e34',b:'#d4edda'}:rType==='P'?{l:'P Refundable',c:'#856404',b:'#fff3cd'}:{l:'Non-Refundable',c:'#721c24',b:'#f8d7da'};

                                return (
                                    <div 
                                        key={`${flight.id}-${idx}`} 
                                        className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgb(29,65,113,0.15)] border border-slate-100 hover:border-[#FF8000]/30 transform transition-all duration-500 hover:-translate-y-2 hover:scale-[1.01] overflow-hidden group"
                                    >
                                        <div className="flex flex-col md:flex-row items-stretch">
                                            {/* Left: Branding */}
                                            <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100 md:w-[220px] flex flex-row md:flex-col items-center md:items-start gap-4 bg-slate-50/50 group-hover:bg-[#FFF4EC]/50 transition-colors duration-500">
                                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center p-2.5 border border-slate-100">
                                                    <img src={`https://images.kiwi.com/airlines/64/${flight.airlineIata || 'XX'}.png`} className="max-h-full object-contain" alt="" />
                                                </div>
                                                <div className="flex-1 md:flex-none">
                                                    <p className="text-base font-black text-[#1B2131] line-clamp-1 group-hover:text-[#FF8000] transition-colors duration-300">{flight.airline}</p>
                                                    <p className="text-xs font-bold text-[#8A9BB5] mt-0.5">{flight.flightNumber}</p>
                                                </div>
                                                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border" style={{background:refBadge.b, color:refBadge.c, borderColor: `${refBadge.c}30`}}>{refBadge.l}</span>
                                            </div>
                                            {/* Mid: Timeline */}
                                            <div className="flex-1 p-6 md:p-8 flex items-center justify-between border-b md:border-b-0 md:border-r border-slate-100">
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-[#8A9BB5] uppercase tracking-widest">{flight.depCName || from}</p>
                                                    <p className="text-2xl sm:text-3xl font-black text-[#1B2131] my-1">{flight.departureTime}</p>
                                                    <p className="text-xs font-bold text-[#8A9BB5]">{new Date(date+'T00:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</p>
                                                </div>
                                                <div className="px-4 flex flex-col items-center min-w-[120px]">
                                                    <p className="text-[10px] font-bold text-[#8A9BB5] uppercase mb-2 tracking-wider">{flight.duration}</p>
                                                    <div className="w-full flex items-center relative">
                                                        <div className="w-2 h-2 rounded-full bg-[#FF8000] shadow-sm"/>
                                                        <div className="flex-1 h-[2px] bg-slate-100"/>
                                                        <div className="w-2 h-2 rounded-full bg-[#FF8000] shadow-sm"/>
                                                    </div>
                                                    <p className="text-[10px] font-black mt-2 uppercase tracking-wider" style={{color:(!flight.stops||flight.stops==='Non-Stop')?'#10B981':'#F59E0B'}}>{flight.stops || 'Non-Stop'}</p>
                                                </div>
                                                <div className="flex-1 text-right">
                                                    <p className="text-[10px] font-bold text-[#8A9BB5] uppercase tracking-widest">{flight.arrCName || to}</p>
                                                    <p className="text-2xl sm:text-3xl font-black text-[#1B2131] my-1">{flight.arrivalTime}</p>
                                                    <p className="text-xs font-bold text-[#8A9BB5]">{new Date(date+'T00:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</p>
                                                </div>
                                            </div>
                                            {/* Right: Pricing */}
                                            <div className="p-6 md:p-8 bg-slate-50/50 md:bg-transparent flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 md:w-[200px]">
                                                <div className="text-left md:text-right">
                                                    <p className="text-[10px] font-bold text-[#8A9BB5] uppercase tracking-widest">Per Adult</p>
                                                    <p className="text-2xl sm:text-3xl font-black text-[#1B2131] leading-none group-hover:scale-105 transform transition-transform origin-left duration-300">₹{displayFare.toLocaleString()}</p>
                                                </div>
                                                <button 
                                                    onClick={()=>fetchFares(flight)} 
                                                    disabled={loadingFares===flight.id} 
                                                    className="bg-[#1B2131] hover:bg-[#FF8000] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-[#1B2131]/10 hover:shadow-[#FF8000]/25 transform active:scale-95 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
                                                >
                                                    {loadingFares===flight.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (isExpanded ? 'Hide' : 'Select')}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="px-6 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/30">
                                            <button onClick={()=>fetchFares(flight)} className="text-xs font-black text-[#1B2131] uppercase tracking-wider hover:text-[#FF8000] transition-colors flex items-center gap-1">{isExpanded?'Collapse Details':'View Details & Fares ›'}</button>
                                        </div>
                                        {isExpanded && (
                                            <div className="border-t border-[#E0E0E0] flex flex-col">
                                                {/* Scroll Hint for Mobile */}
                                                <div className="lg:hidden flex items-center justify-between px-5 py-2 bg-[#FFF4EC] border-b border-[#FFE0CC]">
                                                    <p className="text-[9px] font-black text-[#FF8000] uppercase tracking-widest">Pricing Details</p>
                                                    <p className="text-[9px] font-bold text-[#FF8000] animate-pulse">Swipe left to Book ›</p>
                                                </div>
                                                {/* Mobile Pricing Details Cards */}
                                                <div className="lg:hidden flex flex-col divide-y divide-[#E0E0E0] bg-[#FAFAFA]">
                                                    {loadingFares===flight.id ? <div className="p-10 text-center text-[#888] text-sm italic">Loading fare options...</div> : (
                                                        (fareDetails[flight.id]||[flight]).map((fare, fi)=>{
                                                            const fn = Number(fare.Fare?.total?.netfare||fare.price||0);
                                                            const fp = showNetPrice ? (fn + Number(markupAmount)) : fn;
                                                            const ft = fare.Fare?.fareTypeInd || (fare.fareType?.toLowerCase().includes('sme')?'SME':'Retail');
                                                            const rtc = fare.refType || fare.Fare?.refundType || 'N';
                                                            const rtcText = rtc==='R'?'Refundable':rtc==='P'?'Partial Refund':'Non-Refundable';
                                                            const rtcBg = rtc==='R'?'#d4edda':rtc==='P'?'#fff3cd':'#f8d7da';
                                                            const rtcColor = rtc==='R'?'#1e7e34':rtc==='P'?'#856404':'#721c24';
                                                            
                                                            return (
                                                                <div key={fi} className="p-5 flex flex-col gap-4 hover:bg-orange-50/50 transition-colors">
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex flex-col gap-2">
                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                <span className="px-2.5 py-1 rounded-md text-[9px] font-black text-white bg-slate-600 uppercase tracking-widest">{ft}</span>
                                                                                <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest" style={{background:rtcBg, color:rtcColor}}>{rtcText}</span>
                                                                            </div>
                                                                            <p className="text-xs font-bold text-[#444]">{cabinClass}</p>
                                                                        </div>
                                                                        <div className="text-right shrink-0 ml-4">
                                                                            <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-0.5">Total</p>
                                                                            <p className="text-xl font-black text-[#222]">₹{fp.toLocaleString()}</p>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-[#E8E8E8] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                                                        <div className="flex gap-5">
                                                                            <div>
                                                                                <p className="text-[9px] text-[#888] uppercase font-black tracking-widest mb-1">Baggage</p>
                                                                                <p className="text-[11px] font-bold text-[#333] flex items-center gap-1"><span>🧳</span> {fare.baggage?.checkin || '15 KG'}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[9px] text-[#888] uppercase font-black tracking-widest mb-1">Extras</p>
                                                                                <p className="text-[10px] font-bold text-[#555]">🍴 Paid • 💺 Paid</p>
                                                                            </div>
                                                                        </div>
                                                                        <button onClick={()=>handleViewFareRules(fare.flightID||flight.id, flight.flightNumber, rtc, from, to)} disabled={fetchingRules} className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase text-right tracking-wider">
                                                                            {fetchingRules ? 'Loading...' : 'Rules ›'}
                                                                        </button>
                                                                    </div>
                                                                    
                                                                    <button onClick={()=>handleBook(flight, fare)} className="w-full py-3.5 mt-1 bg-gradient-to-r from-[#ff7a00] to-[#ff5100] hover:from-[#e66a00] hover:to-[#e64900] text-white rounded-xl font-black text-[12px] uppercase tracking-[0.15em] shadow-[0_8px_16px_rgba(255,108,0,0.2)] active:scale-[0.98] transition-all flex justify-center items-center gap-2">
                                                                        Book Now <span className="text-lg leading-none">›</span>
                                                                    </button>
                                                                </div>
                                                            )
                                                        })
                                                    )}
                                                </div>

                                                {/* Desktop Pricing Details Table */}
                                                <div className="hidden lg:block overflow-x-auto w-full max-w-full pb-2">
                                                    {loadingFares===flight.id ? <div className="p-10 text-center text-[#888] text-sm italic">Loading fare options...</div> : (
                                                        <table className="w-full min-w-[800px] border-separate" style={{ borderSpacing: 0 }}>
                                                        <thead className="bg-[#F8F8F8] sticky top-0 z-20">
                                                            <tr>
                                                                {['Fare Type','Status','Rules','Baggage','Meal/Seat'].map(h=><th key={h} className="px-4 py-3 text-[10px] font-bold text-[#666] uppercase text-left border-b border-[#E0E0E0]">{h}</th>)}
                                                                <th className="px-4 py-3 text-[10px] font-bold text-[#666] uppercase text-right sticky right-[84px] bg-[#F8F8F8] shadow-[-4px_0_4px_-2px_rgba(0,0,0,0.05)] border-b border-[#E0E0E0] z-30">Price</th>
                                                                <th className="px-4 py-3 text-[10px] font-bold text-[#666] uppercase text-center sticky right-0 bg-[#F8F8F8] border-b border-[#E0E0E0] z-30">Book</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[#F0F0F0]">
                                                            {(fareDetails[flight.id]||[flight]).map((fare, fi)=>{
                                                                const fn = Number(fare.Fare?.total?.netfare||fare.price||0);
                                                                const fp = showNetPrice ? (fn + Number(markupAmount)) : fn;
                                                                const ft = fare.Fare?.fareTypeInd || (fare.fareType?.toLowerCase().includes('sme')?'SME':'Retail');
                                                                const rtc = fare.refType || fare.Fare?.refundType || 'N';
                                                                return (
                                                                    <tr key={fi} className="hover:bg-orange-50/30 group">
                                                                        <td className="px-4 py-4 border-b border-[#F0F0F0]"><span className="px-2 py-0.5 rounded-sm text-[9px] font-bold text-white bg-slate-500 uppercase">{ft}</span><p className="text-[11px] text-[#888] mt-1">{cabinClass}</p></td>
                                                                        <td className="px-4 py-4 border-b border-[#F0F0F0]"><span className="px-2 py-1 rounded text-[9px] font-black uppercase" style={{background:rtc==='R'?'#d4edda':rtc==='P'?'#fff3cd':'#f8d7da', color:rtc==='R'?'#1e7e34':rtc==='P'?'#856404':'#721c24'}}>{rtc==='R'?'Refundable':rtc==='P'?'Partial Refund':'Non-Refundable'}</span></td>
                                                                        <td className="px-4 py-4 border-b border-[#F0F0F0]"><button onClick={()=>handleViewFareRules(fare.flightID||flight.id, flight.flightNumber, rtc, from, to)} disabled={fetchingRules} className="text-[10px] font-black text-blue-500 hover:underline uppercase flex items-center gap-1">{fetchingRules ? <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/> : 'Fare Rules ›'}</button></td>
                                                                        <td className="px-4 py-4 text-[11px] text-[#555] font-bold border-b border-[#F0F0F0]">{fare.baggage?.checkin || '15 KG'}</td>
                                                                        <td className="px-4 py-4 border-b border-[#F0F0F0]"><p className="text-[10px] text-[#888]">🍴 Paid Meal</p><p className="text-[10px] text-[#888]">💺 Paid Seat</p></td>
                                                                        <td className="px-4 py-4 text-[16px] font-black text-[#222] text-right sticky right-[84px] bg-white group-hover:bg-[#FFFBF5] shadow-[-4px_0_4px_-2px_rgba(0,0,0,0.05)] border-b border-[#F0F0F0] z-20">₹{fp.toLocaleString()}</td>
                                                                        <td className="px-4 py-4 text-center sticky right-0 bg-white group-hover:bg-[#FFFBF5] border-b border-[#F0F0F0] z-20"><button onClick={()=>handleBook(flight, fare)} className="bg-[#FF8000] text-white px-4 py-2 rounded font-black text-[10px] uppercase shadow-md shadow-orange-500/20 active:scale-95 transition-all">Book</button></td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
                {!loading && flights.length === 0 && !error && <div className="py-20 text-center text-[#888] text-sm italic">Search flights above to see results.</div>}
            </div>

            {/* MODALS */}
            {isEditingMarkup && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-8 w-full max-w-sm shadow-2xl">
                        <p className="text-xs font-black text-[#999] uppercase mb-4">Set Agent Markup (₹)</p>
                        <input type="number" className="text-4xl font-black text-[#222] w-full outline-none p-4 rounded-lg bg-gray-50 mb-6 border border-gray-100" value={markupAmount} onChange={e=>setMarkupAmount(Number(e.target.value))} />
                        <button onClick={()=>setIsEditingMarkup(false)} className="w-full bg-[#FF8000] text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest">Save Markup</button>
                    </div>
                </div>
            )}

            {verifyingPrice && <div className="fixed inset-0 bg-black/40 z-[400] flex items-center justify-center"><div className="bg-white p-8 rounded-xl flex items-center gap-4 shadow-2xl"><div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin border-orange-500" /><p className="text-sm font-black text-[#444]">Verifying Price...</p></div></div>}

            {fareRulesModal.show && (
                <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4" onClick={()=>setFareRulesModal({...fareRulesModal,show:false})}>
                    <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={e=>e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-5 border-b border-[#E8E8E8] flex justify-between items-center bg-[#FAFAFA]">
                            <div>
                                <p className="font-black text-sm text-[#222] uppercase tracking-wide">Fare Rules</p>
                                <p className="text-[11px] font-bold text-[#888] mt-0.5">{fareRulesModal.flightNo} • {fareRulesModal.route}</p>
                            </div>
                            <button onClick={()=>setFareRulesModal({...fareRulesModal,show:false})} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg font-bold text-[#666] transition-colors">×</button>
                        </div>

                        <div className="p-5 overflow-y-auto space-y-5">
                            {/* Refundability Badge */}
                            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                                fareRulesModal.refType==='R' ? 'bg-green-50 border-green-200' :
                                fareRulesModal.refType==='P' ? 'bg-amber-50 border-amber-200' :
                                'bg-red-50 border-red-200'
                            }`}>
                                <span className="text-2xl">{fareRulesModal.refType==='R'?'✅':fareRulesModal.refType==='P'?'⚠️':'❌'}</span>
                                <div>
                                    <p className={`text-sm font-black uppercase ${
                                        fareRulesModal.refType==='R'?'text-green-700':fareRulesModal.refType==='P'?'text-amber-700':'text-red-700'
                                    }`}>{fareRulesModal.refType==='R'?'Refundable Fare':fareRulesModal.refType==='P'?'Partially Refundable Fare':'Non-Refundable Fare'}</p>
                                    <p className={`text-[11px] font-medium ${
                                        fareRulesModal.refType==='R'?'text-green-600':fareRulesModal.refType==='P'?'text-amber-600':'text-red-600'
                                    }`}>{fareRulesModal.refType==='R'?'Full refund available on cancellation':fareRulesModal.refType==='P'?'Partial refund with cancellation charges':'No refund on cancellation (taxes may be refundable)'}</p>
                                </div>
                            </div>

                            {/* Penalty Breakdown */}
                            <div>
                                <p className="text-[11px] font-black text-[#444] uppercase tracking-wider mb-3 flex items-center gap-2"><span>📋</span> Penalty Details</p>
                                <div className="border border-[#E0E0E0] rounded-xl overflow-hidden">
                                    {[
                                        { icon: '🚫', label: 'Cancellation Fee', key: 'cancellation', color: '#dc3545' },
                                        { icon: '📅', label: 'Date Change Fee', key: 'dateChange', color: '#fd7e14' },
                                        { icon: '🚷', label: 'No-Show Penalty', key: 'noShow', color: '#6c757d' }
                                    ].map((item, i) => (
                                        <div key={item.key} className={`p-4 flex items-start gap-3 ${i < 2 ? 'border-b border-[#F0F0F0]' : ''}`}>
                                            <span className="text-lg mt-0.5">{item.icon}</span>
                                            <div className="flex-1">
                                                <p className="text-[11px] font-black text-[#333] uppercase tracking-wide mb-1">{item.label}</p>
                                                <p className="text-[12px] text-[#666] leading-relaxed">
                                                    {fareRulesModal.parsed?.[item.key] || 'As per airline policy. Please check with the airline for exact charges.'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Reference Penalty Table */}
                            <div>
                                <p className="text-[11px] font-black text-[#444] uppercase tracking-wider mb-3 flex items-center gap-2"><span>⏰</span> Indicative Cancellation Charges</p>
                                <div className="border border-[#E0E0E0] rounded-xl overflow-hidden">
                                    <table className="w-full">
                                        <thead><tr className="bg-[#F8F8F8] border-b border-[#E0E0E0]">
                                            <th className="px-4 py-2.5 text-[10px] font-black text-[#666] uppercase text-left">Time Before Departure</th>
                                            <th className="px-4 py-2.5 text-[10px] font-black text-[#666] uppercase text-right">Airline Fee</th>
                                        </tr></thead>
                                        <tbody className="divide-y divide-[#F0F0F0]">
                                            {[
                                                { time: '0 – 2 Hours', fee: 'Non-Cancellable', cls: 'text-red-600 font-black' },
                                                { time: '2 – 4 Hours', fee: fareRulesModal.parsed?.penalties?.[0] ? `₹${fareRulesModal.parsed.penalties[0].toLocaleString()}` : '₹3,000 – ₹3,500', cls: 'text-red-500 font-bold' },
                                                { time: '4 – 24 Hours', fee: fareRulesModal.parsed?.penalties?.[1] ? `₹${fareRulesModal.parsed.penalties[1].toLocaleString()}` : '₹2,500 – ₹3,000', cls: 'text-orange-500 font-bold' },
                                                { time: '24 Hrs – 3 Days', fee: fareRulesModal.parsed?.penalties?.[2] ? `₹${fareRulesModal.parsed.penalties[2].toLocaleString()}` : '₹2,000 – ₹2,500', cls: 'text-amber-600 font-bold' },
                                                { time: '3 – 7 Days', fee: '₹1,500 – ₹2,000', cls: 'text-yellow-600 font-bold' },
                                                { time: 'More than 7 Days', fee: '₹500 – ₹1,500', cls: 'text-green-600 font-bold' },
                                            ].map(row => (
                                                <tr key={row.time} className="hover:bg-[#FAFAFA]">
                                                    <td className="px-4 py-2.5 text-[12px] font-medium text-[#555]">{row.time}</td>
                                                    <td className={`px-4 py-2.5 text-[12px] text-right ${row.cls}`}>{row.fee}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Important Notes */}
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                                <p className="text-[11px] font-black text-blue-700 uppercase mb-2 flex items-center gap-1.5"><span>ℹ️</span> Important Notes</p>
                                <div className="text-[11px] text-blue-600 leading-relaxed space-y-1">
                                    <p>• Charges shown are indicative and vary by airline & fare class.</p>
                                    <p>• GST of 5% applicable on cancellation/change fees.</p>
                                    <p>• All charges are per passenger per sector.</p>
                                    <p>• DGCA Rule: Cancellation fee cannot exceed base fare + fuel surcharge.</p>
                                    <p>• Non-refundable fares: Government taxes are still refundable.</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[#E8E8E8] bg-[#FAFAFA]">
                            <button onClick={()=>setFareRulesModal({...fareRulesModal,show:false})} className="w-full py-3 bg-[#1B2131] hover:bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlightSearch;
