import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, ScrollView, Modal, 
    ActivityIndicator, useWindowDimensions, Image, FlatList, BackHandler 
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { bookingService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';
import GoyaflyLoader from '../../components/GoyaflyLoader';
import InspirationLoader from '../../components/InspirationLoader';

const POPULAR_AIRPORTS = [
    { code: 'DEL', city: 'New Delhi', label: 'Indira Gandhi Intl (DEL)' },
    { code: 'BOM', city: 'Mumbai', label: 'Chhatrapati Shivaji (BOM)' },
    { code: 'DXB', city: 'Dubai', label: 'Dubai Intl (DXB)' },
    { code: 'BLR', city: 'Bengaluru', label: 'Kempegowda Intl (BLR)' },
    { code: 'CCU', city: 'Kolkata', label: 'Netaji Subhash (CCU)' }
];

const FARE_TYPE_MAP = {
    '0': { label: 'SME Fares',       bg: '#F07E21', text: 'white' },
    '1': { label: 'Corporate Fares', bg: '#7c3aed', text: 'white' },
    '2': { label: 'Retail Fares',    bg: '#1D4171', text: 'white' },
    '3': { label: 'Flexi Fares',     bg: '#059669', text: 'white' },
    '4': { label: 'Business Class',  bg: '#1e293b', text: '#f59e0b' },
    '5': { label: 'SpiceMax',        bg: '#dc2626', text: 'white' },
    SME:    { label: 'SME Fares',    bg: '#F07E21', text: 'white' },
    Flexi:  { label: 'Flexi Fares',  bg: '#059669', text: 'white' },
    Retail: { label: 'Retail Fares', bg: '#1D4171', text: 'white' },
};

const getFareStyle = (f) => {
    const ind = String(f.fareTypeInd ?? f.fareType ?? '');
    return FARE_TYPE_MAP[ind] ||
           FARE_TYPE_MAP[ind.charAt(0).toUpperCase() + ind.slice(1).toLowerCase()] ||
           { label: ind || 'Standard', bg: '#64748b', text: 'white' };
};

const getTimeSlot = (timeStr) => {
    if (!timeStr) return null;
    const hour = parseInt(timeStr.split(':')[0]);
    if (hour >= 0 && hour < 6) return 'Early Morning';
    if (hour >= 6 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 18) return 'Afternoon';
    return 'Evening';
};

const parseTimeToMinutes = t => {
    if (!t) return 0;
    const m = t.match(/^(\d{1,2}):(\d{2})(\s*)(AM|PM)?/i);
    if (!m) { 
        const [h, min] = t.split(':').map(Number); 
        return (h || 0) * 60 + (min || 0); 
    }
    let h = parseInt(m[1]), min = parseInt(m[2]);
    const mod = m[4]?.toUpperCase();
    if (mod === 'PM' && h < 12) h += 12;
    if (mod === 'AM' && h === 12) h = 0;
    return h * 60 + min;
};

const parseDurationToMinutes = (duration) => {
    if (!duration) return 0;
    const parts = duration.split(' ');
    let mins = 0;
    parts.forEach(p => {
        if (p.includes('h')) mins += parseInt(p) * 60;
        if (p.includes('m')) mins += parseInt(p);
    });
    return mins;
};

const parseFareRules = (rawContent) => {
    if (!rawContent || typeof rawContent !== 'string') return { cancellation: 'N/A', dateChange: 'N/A', noShow: 'N/A', raw: String(rawContent) };
    const text = rawContent.replace(/\s+/g, ' ');
    const getSection = keywords => {
        for (const kw of keywords) {
            const idx = text.toUpperCase().indexOf(kw.toUpperCase());
            if (idx !== -1) {
                let chunk = text.substring(idx, idx + 300);
                const markers = ['REISSUE', 'DATE CHANGE', 'NO SHOW', 'REFUND', 'CANCELLATION', 'NOTES', 'RE-ISSUE'];
                let end = 300;
                markers.forEach(m => { const i = chunk.toUpperCase().indexOf(m.toUpperCase(), kw.length); if (i !== -1 && i < end) end = i; });
                return chunk.substring(0, end).trim();
            }
        }
        return '';
    };
    return {
        cancellation: getSection(['CANCELLATION', 'REFUND', 'CANCL']) || 'Refer to airline policy',
        dateChange: getSection(['REISSUE', 'DATE CHANGE', 'RE-ISSUE', 'CHANGES']) || 'Refer to airline policy',
        noShow: getSection(['NO SHOW', 'NOSHOW']) || 'Refer to airline policy',
        raw: rawContent
    };
};

const CalendarPicker = ({ visible, onClose, onSelect, initialDate, t }) => {
    const { width } = useWindowDimensions();
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(new Date(initialDate || today));

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const startDay = (year, month) => new Date(year, month, 1).getDay();

    const generateDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const totalDays = daysInMonth(year, month);
        const offset = startDay(year, month);
        const days = [];
        for (let i = 0; i < offset; i++) days.push(null);
        for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
        return days;
    };

    const isSelected = (date) => {
        if (!date || !initialDate) return false;
        return new Date(date).toDateString() === new Date(initialDate).toDateString();
    };

    const isPast = (date) => {
        if (!date) return false;
        const d = new Date(date);
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return d < t;
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 bg-black/60 justify-center items-center p-5">
                <View style={{ width: width - 40, backgroundColor: '#fff', elevation: 12 }} className="rounded-[2rem] p-6 border border-slate-100 border-b-8 border-slate-200 shadow-2xl overflow-hidden">
                    <View className="flex-row justify-between items-center mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="w-10 h-10 bg-white rounded-xl items-center justify-center border border-slate-200 shadow-sm">
                            <Ionicons name="chevron-back" size={20} color="#1D4171" />
                        </TouchableOpacity>
                        <Text className="font-black text-base text-[#1D4171] uppercase tracking-wider">
                            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </Text>
                        <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="w-10 h-10 bg-white rounded-xl items-center justify-center border border-slate-200 shadow-sm">
                            <Ionicons name="chevron-forward" size={20} color="#1D4171" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row mb-3">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <Text key={i} className="flex-1 text-center text-[10px] font-black text-slate-400 uppercase">{d}</Text>
                        ))}
                    </View>

                    <View className="flex-row flex-wrap mb-4">
                        {generateDays().map((date, i) => {
                            const selected = isSelected(date);
                            const past = !date || isPast(date);
                            return (
                                <TouchableOpacity
                                    key={i}
                                    disabled={past}
                                    onPress={() => { 
                                        const year = date.getFullYear();
                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                        const day = String(date.getDate()).padStart(2, '0');
                                        onSelect(`${year}-${month}-${day}`); 
                                        onClose(); 
                                    }}
                                    style={{ width: (width - 88) / 7, height: 42 }}
                                    className={`items-center justify-center rounded-xl mb-1.5 ${selected ? 'bg-[#1D4171] border-b-4 border-[#122a4a] shadow-lg shadow-blue-900/30' : ''} ${past ? 'opacity-20' : 'bg-slate-50/50 border border-slate-100'}`}
                                >
                                    {date && <Text className={`font-black text-xs ${selected ? 'text-white' : 'text-slate-800'}`}>{date.getDate()}</Text>}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity onPress={onClose} className="bg-slate-100 py-4 rounded-xl items-center border-b-4 border-slate-200 active:opacity-80">
                        <Text className="font-black text-slate-500 uppercase text-xs tracking-widest">Close Calendar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const PaxCounter = ({ label, sub, value, onInc, onDec, min = 0 }) => (
    <View className="flex-row items-center justify-between py-4 border-b border-slate-100 bg-slate-50/50 px-4 rounded-2xl mb-3 border border-slate-100 border-b-4 border-slate-200 shadow-sm">
        <View>
            <Text className="font-black text-slate-800 text-sm">{label}</Text>
            <Text className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{sub}</Text>
        </View>
        <View className="flex-row items-center gap-3">
            <TouchableOpacity
                onPress={onDec}
                disabled={value <= min}
                className={`w-10 h-10 rounded-xl items-center justify-center border-b-4 ${value <= min ? 'border-slate-200 bg-slate-100' : 'border-slate-300 bg-white shadow-sm'}`}
            >
                <Ionicons name="remove" size={18} color={value <= min ? '#94a3b8' : '#1e293b'} />
            </TouchableOpacity>
            <Text className="font-black text-slate-900 text-base w-8 text-center">{value}</Text>
            <TouchableOpacity
                onPress={onInc}
                className="w-10 h-10 rounded-xl items-center justify-center border border-orange-200 border-b-4 border-[#D96B18] bg-[#F07E21] shadow-md shadow-orange-500/20"
            >
                <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
        </View>
    </View>
);

const FareRow = ({ fare, showMarkup, markup, onBook, onViewRules, t }) => {
    const f = fare.Fare || fare;
    const style = getFareStyle(f);
    const refundable = (f.refundType === 'P' || f.refundType === 'Refundable');
    const bagCkin  = f.bagCkin  || fare.baggage?.checkin  || '15 KG';
    const bagCabin = f.bagCabin || f.bagCbin || fare.baggage?.cabin || '7 KG';
    const netPrice   = Number(f.total?.netfare || f.netfare || fare.price || 0);
    const publishedPrice = netPrice + (showMarkup ? Number(markup || 0) : 0);
    const fareFlightID = f.flightID || f.FlightID || fare.flightID || fare.FlightID || fare.Flights?.Onward?.[0]?.flightID || fare.ID || '';

    return (
        <View className="m-3 p-5 bg-white rounded-2xl border border-slate-200 border-b-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <View className="flex-row items-center">
                    <View style={{ backgroundColor: style.bg }} className="px-3 py-1.5 rounded-lg mr-2 shadow-sm">
                        <Text style={{ color: style.text }} className="font-black text-[10px] uppercase tracking-wider">{style.label}</Text>
                    </View>
                    <Text className={`text-[10px] font-black ${refundable ? 'text-green-600' : 'text-slate-400'}`}>{refundable ? '✓ Refundable' : '✗ Non-Refundable'}</Text>
                </View>
                <TouchableOpacity onPress={() => onViewRules(fareFlightID)} className="py-1">
                    <Text className="text-blue-600 text-[10px] font-black uppercase underline tracking-wider">Fare Rules ›</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-row justify-between items-center mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-100 shadow-inner">
                <View className="items-center flex-1 border-r border-slate-200">
                    <Text className="text-slate-400 text-[9px] font-black uppercase mb-0.5 tracking-widest">Check-in</Text>
                    <Text className="text-slate-800 text-xs font-black">💼 {bagCkin}</Text>
                </View>
                <View className="items-center flex-1 border-r border-slate-200">
                    <Text className="text-slate-400 text-[9px] font-black uppercase mb-0.5 tracking-widest">Cabin</Text>
                    <Text className="text-slate-800 text-xs font-black">👜 {bagCabin}</Text>
                </View>
                <View className="items-center flex-1">
                    <Text className="text-slate-400 text-[9px] font-black uppercase mb-0.5 tracking-widest">Add-ons</Text>
                    <Text className="text-orange-600 text-[10px] font-black uppercase">🍴 Paid</Text>
                </View>
            </View>

            <View className="flex-row justify-between items-center pt-1">
                <View>
                    <Text className="text-slate-400 text-[9px] font-black uppercase mb-0.5 tracking-widest">Price</Text>
                    <Text className="text-[#F07E21] font-black text-xl">₹{publishedPrice.toLocaleString()}</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => onBook(fare)} 
                    className="bg-[#F07E21] px-8 py-3.5 rounded-xl shadow-md shadow-orange-500/30 border-b-4 border-[#D96B18] active:scale-95"
                >
                    <Text className="text-white font-black text-xs uppercase tracking-wider">Book Fare</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const FlightCard = ({ item, from, to, showMarkup, markup, onBook, onViewRules, onViewDetails, t, isCheapest, isFastest, screenWidth }) => {
    const [expanded, setExpanded]   = useState(false);
    const [fares, setFares]         = useState([]);
    const [loadingFares, setLoadingFares] = useState(false);

    const toggle = async () => {
        if (!expanded && fares.length === 0) {
            setLoadingFares(true);
            try {
                const res = await bookingService.ftdGetFareDetails(item.flightID || item.id, item.refID);
                if (res.success) {
                    const raw = res.data?.results || res.data?.data || (Array.isArray(res.data) ? res.data : []);
                    setFares(raw.length > 0 ? raw : [item]);
                } else setFares([item]);
            } catch { setFares([item]); } finally { setLoadingFares(false); }
        }
        setExpanded(v => !v);
    };

    const displayPrice = (item.price || 0) + (showMarkup ? Number(markup || 0) : 0);

    if (!item) return null;

    return (
        <View style={{ backgroundColor: t?.card || '#fff', elevation: 6 }} className="mx-4 mb-4 rounded-[2rem] border border-slate-100 border-b-[6px] border-slate-200 shadow-xl shadow-slate-300/40 overflow-hidden relative">
            <View className="flex-row absolute top-3 left-5 z-10 gap-2">
                {isCheapest && <View className="bg-green-100 px-3 py-1 rounded-md border border-green-200 shadow-sm"><Text className="text-green-700 font-black text-[8px] uppercase tracking-wider">✓ Cheapest</Text></View>}
                {isFastest && <View className="bg-blue-100 px-3 py-1 rounded-md border border-blue-200 shadow-sm"><Text className="text-blue-700 font-black text-[8px] uppercase tracking-wider">⚡ Fastest</Text></View>}
            </View>
            <View className="p-5 pt-10">
                <View className="flex-row justify-between items-center mb-5">
                    <View className="flex-row items-center flex-1 pr-2">
                        <View className="w-11 h-11 rounded-xl bg-white items-center justify-center mr-3.5 border border-slate-100 shadow-sm">
                            <Image source={{ uri: `https://images.kiwi.com/airlines/64/${item.airlineIata || 'AI'}.png` }} style={{ width: 28, height: 28 }} resizeMode="contain" />
                        </View>
                        <View className="flex-1">
                            <Text style={{ color: t.text }} className="font-black text-base" numberOfLines={1}>{item.airline}</Text>
                            <Text className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{item.flightNumber} • Economy</Text>
                        </View>
                    </View>
                    <View className="items-end shrink">
                        <Text className="text-2xl font-black text-[#F07E21]" numberOfLines={1} adjustsFontSizeToFit={true}>₹{displayPrice.toLocaleString()}</Text>
                    </View>
                </View>
                <View style={{ backgroundColor: t.bg }} className="flex-row justify-between items-center p-4 rounded-2xl border border-slate-100 border-b-2 border-slate-200 mb-5 shadow-inner">
                    <View className="items-center">
                        <Text className="font-black text-xl text-gray-800">{item.departureTime}</Text>
                        <Text className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{from}</Text>
                        {item.depTer ? <Text className="text-[9px] text-gray-400 font-bold mt-0.5">T-{item.depTer}</Text> : null}
                    </View>
                    <View className="flex-1 items-center px-4">
                        <Text className="text-[9px] text-gray-400 font-black uppercase mb-1 tracking-widest">{item.duration || '—'}</Text>
                        <View className="w-full h-[2px] bg-slate-200 relative">
                            <View className="absolute top-[-3px] left-0 w-2 h-2 rounded-full bg-slate-300" />
                            <View className="absolute top-[-3px] right-0 w-2 h-2 rounded-full bg-[#F07E21]" />
                        </View>
                        <Text className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-wider">{item.stops || 'Non-Stop'}</Text>
                    </View>
                    <View className="items-center">
                        <Text className="font-black text-xl text-gray-800">{item.arrivalTime}</Text>
                        <Text className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{to}</Text>
                        {item.arrTer ? <Text className="text-[9px] text-gray-400 font-bold mt-0.5">T-{item.arrTer}</Text> : null}
                    </View>
                </View>
                <View className="flex-row justify-between items-center px-1">
                    <TouchableOpacity onPress={toggle} className={`flex-row items-center px-5 py-2.5 rounded-xl border border-b-4 active:scale-95 shadow-sm ${expanded ? 'bg-[#1D4171] border-[#1D4171] border-b-[#122a4a]' : 'bg-[#F07E21] border-[#F07E21] border-b-[#D96B18]'}`}>
                        <Text className="text-white font-black text-[10px] uppercase tracking-widest">{expanded ? 'Hide Price ↑' : 'View Price ↓'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onViewDetails(item)} className="py-2"><Text className="text-[#48A0D4] text-[10px] font-black uppercase underline tracking-wider">Flight Details ›</Text></TouchableOpacity>
                </View>
            </View>
            {expanded && (
                <View className="border-t border-gray-100 bg-slate-50/50 p-2">
                    {loadingFares ? (
                        <View className="py-10 items-center justify-center">
                            <ActivityIndicator color="#F07E21" size="small" />
                            <Text className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">Loading Fares...</Text>
                        </View>
                    ) : (
                        fares.map((f, idx) => (
                            <FareRow key={idx} fare={f} showMarkup={showMarkup} markup={markup} onBook={onBook} onViewRules={onViewRules} t={t} />
                        ))
                    )}
                </View>
            )}
        </View>
    );
};

const getStopLabel = (stops) => {
    if (!stops) return 'Non-Stop';
    const s = String(stops).toLowerCase().trim();
    if (s === '0' || s === 'non-stop' || s === 'direct' || s === 'nonstop') return 'Non-Stop';
    if (s === '1' || s === '1 stop' || s === '1stop') return '1 Stop';
    return '2+ Stops';
};

export default function FlightSearchScreen({ navigation }) {
    const t = useThemeColors();
    const { width } = useWindowDimensions();

    const [tripType, setTripType] = useState('oneWay');
    const [from, setFrom] = useState({});
    const [to, setTo] = useState({});
    
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
    const [cabinClass, setCabinClass] = useState('Economy');
    const [multiCitySectors, setMultiCitySectors] = useState([
        { from: { code: 'DEL', city: 'New Delhi', label: 'Indira Gandhi Intl' }, to: { code: 'BOM', city: 'Mumbai', label: 'Chhatrapati Shivaji' }, date: new Date().toISOString().split('T')[0] },
        { from: { code: 'BOM', city: 'Mumbai', label: 'Chhatrapati Shivaji' }, to: { code: 'BLR', city: 'Bengaluru', label: 'Kempegowda Intl' }, date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] }
    ]);

    // Search Result states
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isFormCollapsed, setIsFormCollapsed] = useState(false);

    // Filter, Sort, Markup states
    const [sortBy, setSortBy] = useState('priceLow');
    const [selectedStops, setSelectedStops] = useState([]);
    const [selectedDepSlots, setSelectedDepSlots] = useState([]);
    const [selectedArrSlots, setSelectedArrSlots] = useState([]);
    const [selectedAirlines, setSelectedAirlines] = useState([]);
    const [selectedRefundables, setSelectedRefundables] = useState([]);
    const [flightNoQuery, setFlightNoQuery] = useState('');
    const [maxDurationFilter, setMaxDurationFilter] = useState(1440); // 24 hours default
    const [airlineSearch, setAirlineSearch] = useState('');
    
    const [showNetPrice, setShowNetPrice] = useState(true);
    const [markupAmount, setMarkupAmount] = useState(0);
    const [isEditingMarkup, setIsEditingMarkup] = useState(false);
    const [tempMarkup, setTempMarkup] = useState('0');

    // Modals visibility states
    const [showSelection, setShowSelection] = useState(false);
    const [activeType, setActiveType] = useState('FROM');
    const [search, setSearch] = useState('');
    const [results, setResults] = useState(POPULAR_AIRPORTS);
    const [searching, setSearching] = useState(false);
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [calendarTarget, setCalendarTarget] = useState('OUTBOUND');
    const [showPaxModal, setShowPaxModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Rules / Details Modal states
    const [rules, setRules] = useState(null);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [fetchingRules, setFetchingRules] = useState(false);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [verifyingPrice, setVerifyingPrice] = useState(false);
    const [showPriceUpdateModal, setShowPriceUpdateModal] = useState(false);
    const [priceUpdateData, setPriceUpdateData] = useState(null);

    // Airport Search autocomplete debouncing
    useEffect(() => {
        if (!search || search.length < 2) {
            setResults(POPULAR_AIRPORTS);
            return;
        }
        const delay = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await bookingService.searchAirports(search);
                if (res.success) setResults(res.data);
            } catch (e) { console.error(e); }
            finally { setSearching(false); }
        }, 500);
        return () => clearTimeout(delay);
    }, [search]);

    // Hardware Back Button Handler
    useEffect(() => {
        const onBackPress = () => {
            if (showSelection) { setShowSelection(false); return true; }
            if (calendarVisible) { setCalendarVisible(false); return true; }
            if (showPaxModal) { setShowPaxModal(false); return true; }
            if (showFilterModal) { setShowFilterModal(false); return true; }
            if (showRulesModal) { setShowRulesModal(false); return true; }
            if (isEditingMarkup) { setIsEditingMarkup(false); return true; }
            if (showDetailsModal) { setShowDetailsModal(false); return true; }
            if (showPriceUpdateModal) { setShowPriceUpdateModal(false); return true; }
            if (flights.length > 0 && isFormCollapsed) { setIsFormCollapsed(false); return true; }
            if (flights.length > 0 && !isFormCollapsed) { setFlights([]); return true; }
            return false;
        };
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [showSelection, calendarVisible, showPaxModal, showFilterModal, showRulesModal, isEditingMarkup, showDetailsModal, showPriceUpdateModal, flights, isFormCollapsed]);

    const totalPax = pax.adt + pax.chd + pax.inf;

    // Available Airlines list
    const availableAirlines = useMemo(() => {
        const unique = {};
        flights.forEach(f => {
            if (!unique[f.airline]) unique[f.airline] = { name: f.airline, iata: f.airlineIata, count: 0 };
            unique[f.airline].count++;
        });
        return Object.values(unique).sort((a,b) => a.name.localeCompare(b.name));
    }, [flights]);

    // Master Filter logic
    const filteredFlights = useMemo(() => {
        let result = [...flights];

        // Stops
        if (selectedStops.length > 0) {
            result = result.filter(f => selectedStops.includes(getStopLabel(f.stops)));
        }

        // Departure window slots
        if (selectedDepSlots.length > 0) {
            result = result.filter(f => selectedDepSlots.includes(getTimeSlot(f.departureTime)));
        }

        // Arrival window slots
        if (selectedArrSlots.length > 0) {
            result = result.filter(f => selectedArrSlots.includes(getTimeSlot(f.arrivalTime)));
        }

        // Airlines
        if (selectedAirlines.length > 0) {
            result = result.filter(f => selectedAirlines.includes(f.airline));
        }

        // Refundable / Non-refundable
        if (selectedRefundables.length > 0) {
            result = result.filter(f => {
                const rType = f.refType || f.refundType?.charAt(0) || 'N';
                const isRef = rType === 'R' || rType === 'P';
                const label = isRef ? 'Refundable' : 'Non-Refundable';
                return selectedRefundables.includes(label);
            });
        }

        // Flight number query
        if (flightNoQuery) {
            result = result.filter(f => f.flightNumber?.toLowerCase().includes(flightNoQuery.toLowerCase()));
        }

        // Max Duration
        if (maxDurationFilter < 1440) {
            result = result.filter(f => parseDurationToMinutes(f.duration) <= maxDurationFilter);
        }

        // Sorting
        if (sortBy === 'priceLow') {
            return result.sort((a, b) => a.price - b.price);
        } else {
            // Sort by Fastest / Duration
            return result.sort((a, b) => parseDurationToMinutes(a.duration) - parseDurationToMinutes(b.duration));
        }
    }, [flights, selectedStops, selectedDepSlots, selectedArrSlots, selectedAirlines, selectedRefundables, flightNoQuery, maxDurationFilter, sortBy]);

    const cheapestPrice = useMemo(() => filteredFlights.length ? Math.min(...filteredFlights.map(f => f.price)) : 0, [filteredFlights]);
    const fastestMins = useMemo(() => filteredFlights.length ? Math.min(...filteredFlights.map(f => parseDurationToMinutes(f.duration))) : 0, [filteredFlights]);

    const handleSearch = async () => {
        if (!from?.code || !to?.code || !date) {
            Toast.show({ type: 'info', text1: 'Missing Details', text2: 'Please select origin, destination, and travel date.' });
            return;
        }
        if (from.code === to.code) {
            Toast.show({ type: 'info', text1: 'Invalid Route', text2: 'Origin and destination cannot be the same.' });
            return;
        }

        setLoading(true);
        setError('');
        setFlights([]);
        setIsFormCollapsed(true); // Auto collapse search form on execution to give space

        const TRIP_TYPE_MAP = { oneWay: 0, roundTrip: 1, multiCity: 2 };
        const tripTypeInt = TRIP_TYPE_MAP[tripType] ?? 0;

        const CABIN_CLASS_MAP = {
            'Economy': 'E',
            'Premium Economy': 'PE',
            'Business': 'B',
            'First': 'F'
        };

        const searchPayload = {
            passengers: pax || { adt: 1, chd: 0, inf: 0 },
            tripType: tripTypeInt,
            cabin: CABIN_CLASS_MAP[cabinClass] || 'E',
        };

        if (tripType === 'multiCity') {
            searchPayload.sectors = (multiCitySectors || []).map(s => ({ 
                from: s?.from?.code || '', 
                to: s?.to?.code || '', 
                date: s?.date || '' 
            }));
        } else {
            searchPayload.from = from?.code || '';
            searchPayload.to = to?.code || '';
            searchPayload.date = date || '';
            if (tripTypeInt === 1) searchPayload.returnDate = returnDate || '';
        }

        try {
            const res = await bookingService.ftdSearchFlights(searchPayload);
            if (res.success) {
                let data = res.data?.flights || (Array.isArray(res.data) ? res.data : []);
                if (date === today) {
                    const now = new Date();
                    const buf = (now.getHours() * 60 + now.getMinutes()) + 60;
                    data = data.filter(f => parseTimeToMinutes(f.departureTime) >= buf);
                }
                setFlights(data);
                if (data.length === 0) {
                    Toast.show({ type: 'info', text1: 'No Flights', text2: 'No flights found on this route.' });
                }
            } else {
                setError(res.message || 'No flights found.');
                Toast.show({ type: 'error', text1: 'Search Failed', text2: res.message || 'No flights found.' });
            }
        } catch (err) {
            setError(err.message || 'Error fetching flights.');
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to fetch flights.' });
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async (fareObj, parentFlight) => {
        const fare = fareObj || {};
        const flight = parentFlight || fare || {};
        const fID = fare.flightID || fare.FlightID || fare.Fare?.flightID || fare.Fare?.FlightID || fare.Flights?.Onward?.[0]?.flightID || fare.ID || flight.flightID || flight.id;
        const rID = fare.refID || fare.RefID || flight.refID || flight.RefID;
        const netfare = Number(fare.Fare?.total?.netfare || fare.total?.netfare || fare.netfare || fare.price || flight.price || 0);

        if (!fID || !rID) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Session lost.' });
            return;
        }
        setVerifyingPrice(true);
        try {
            const verifyRes = await bookingService.ftdVerifyPrice(fID, rID, netfare);
            if (!verifyRes.success) {
                Toast.show({ type: 'error', text1: 'Price Verification Failed', text2: verifyRes.message });
                return;
            }

            const verifiedNetfare = Number(verifyRes.data?.currentNetfare || netfare);
            const detailsPayload = { 
                ...(flight || {}), 
                ...(fare || {}), 
                flightID: verifyRes.data?.flightID || fID, 
                refID: verifyRes.data?.refID || rID, 
                netfare: verifiedNetfare, 
                date, 
                returnDate: tripType === 'roundTrip' ? returnDate : undefined, 
                tripType: tripType === 'oneWay' ? 0 : tripType === 'roundTrip' ? 1 : 2, 
                appliedMarkup: showNetPrice ? Number(markupAmount) : 0, 
                ssrInfo: verifyRes.data?.ssrInfo 
            };

            const finalBaseFare = verifiedNetfare;
            const markupPrice = verifiedNetfare + (showNetPrice ? Number(markupAmount) : 0);

            if (verifiedNetfare > netfare) {
                setPriceUpdateData({
                    oldPrice: netfare + (showNetPrice ? Number(markupAmount) : 0),
                    newPrice: verifiedNetfare + (showNetPrice ? Number(markupAmount) : 0),
                    onConfirm: () => {
                        setShowPriceUpdateModal(false);
                        navigation.navigate('Checkout', { 
                            bookingData: { 
                                service: 'Flight', 
                                from: from.code, 
                                to: to.code, 
                                baseFare: finalBaseFare, 
                                markupPrice, 
                                details: detailsPayload 
                            }, 
                            passengers: totalPax, 
                            paxBreakdown: pax 
                        });
                    }
                });
                setShowPriceUpdateModal(true);
            } else {
                navigation.navigate('Checkout', { 
                    bookingData: { 
                        service: 'Flight', 
                        from: from.code, 
                        to: to.code, 
                        baseFare: finalBaseFare, 
                        markupPrice, 
                        details: detailsPayload 
                    }, 
                    passengers: totalPax, 
                    paxBreakdown: pax 
                });
            }
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: e.message || 'Failed to verify price.' });
        } finally {
            setVerifyingPrice(false);
        }
    };

    const handleViewRules = async (fID) => {
        setFetchingRules(true);
        setShowRulesModal(true);
        setRules(null);
        try {
            const res = await bookingService.ftdGetFareRules(fID);
            if (res.success) {
                const parsed = parseFareRules(res.data);
                setRules(parsed);
            } else {
                setRules({ cancellation: 'Unavailable', dateChange: 'Unavailable', noShow: 'Unavailable', raw: 'Unavailable' });
            }
        } catch {
            setRules({ cancellation: 'Fetch error', dateChange: 'Fetch error', noShow: 'Fetch error', raw: 'Fetch error' });
        } finally {
            setFetchingRules(false);
        }
    };

    const renderHeader = () => (
        <View className="px-5 pt-5 pb-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
                <TouchableOpacity 
                    onPress={() => {
                        if (flights.length > 0) {
                            setFlights([]);
                            setIsFormCollapsed(false);
                        } else {
                            navigation.goBack();
                        }
                    }}
                    className="w-11 h-11 bg-white rounded-2xl items-center justify-center border border-slate-200 border-b-4 shadow-sm mr-3.5 active:opacity-80"
                >
                    <Ionicons name="chevron-back" size={22} color="#1D4171" />
                </TouchableOpacity>
                <View>
                    <Text className="text-slate-400 text-[10px] font-black uppercase mb-0.5 tracking-widest">Goyafly Portal</Text>
                    <Text className="text-2xl font-black text-slate-900">Flight <Text className="text-[#F07E21]">Search</Text></Text>
                </View>
            </View>
            <View className="w-10 h-10 bg-[#1D4171]/10 rounded-2xl items-center justify-center border border-[#1D4171]/20">
                <Ionicons name="airplane" size={20} color="#1D4171" style={{ transform: [{ rotate: '-45deg' }] }} />
            </View>
        </View>
    );

    const renderSearchCard = () => {
        if (isFormCollapsed && flights.length > 0) {
            return (
                <View className="mx-4 mb-4 bg-white rounded-3xl p-5 border border-slate-100 border-b-4 border-slate-200 shadow-md flex-row justify-between items-center">
                    <View className="flex-1 pr-3">
                        <View className="flex-row items-center gap-2">
                            <Text className="font-black text-slate-800 text-base">{from?.code || 'Origin'}</Text>
                            <Ionicons name="swap-horizontal" size={14} color="#F07E21" />
                            <Text className="font-black text-slate-800 text-base">{to?.code || 'Destination'}</Text>
                        </View>
                        <Text className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                            {date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Select Date'}
                            {tripType === 'roundTrip' && returnDate ? ` - ${new Date(returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : ''}
                            {` • ${totalPax} Pax • ${cabinClass}`}
                        </Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => setIsFormCollapsed(false)}
                        className="bg-[#1D4171] px-4 py-2.5 rounded-xl border-b-2 border-[#122a4a] active:scale-95"
                    >
                        <Text className="text-white font-black text-[10px] uppercase tracking-wider">Modify</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View className="mx-4">
                {/* 3D Trip Type Selector Container */}
                <View className="bg-slate-200/70 p-1.5 rounded-[1.8rem] border border-slate-300/60 flex-row mb-5 shadow-inner">
                    {[
                        { id: 'oneWay', label: 'One Way', icon: 'arrow-forward' },
                        { id: 'roundTrip', label: 'Round Trip', icon: 'swap-horizontal' },
                        { id: 'multiCity', label: 'Multi City', icon: 'git-commit' }
                    ].map((type) => {
                        const active = tripType === type.id;
                        return (
                            <TouchableOpacity
                                key={type.id}
                                onPress={() => setTripType(type.id)}
                                className={`flex-1 py-3 rounded-[1.4rem] flex-row items-center justify-center gap-1.5 ${active ? 'bg-[#1D4171] border-b-4 border-[#122a4a] shadow-lg shadow-blue-900/30' : 'bg-transparent'}`}
                            >
                                <Ionicons name={type.icon} size={14} color={active ? '#fff' : '#64748b'} />
                                <Text className={`text-[11px] font-black uppercase tracking-wider ${active ? 'text-white' : 'text-slate-500'}`}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Main 3D Search Card */}
                {tripType === 'multiCity' ? (
                    <View className="mb-6">
                        {multiCitySectors.map((sector, index) => (
                            <View key={index} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 border-b-[8px] border-slate-200 shadow-xl shadow-slate-300/30 mb-5 relative">
                                <View className="flex-row justify-between items-center mb-4">
                                    <View className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"><Text className="font-black text-slate-500 uppercase text-[10px] tracking-widest">Flight {index + 1}</Text></View>
                                    {multiCitySectors.length > 2 && (
                                        <TouchableOpacity onPress={() => setMultiCitySectors(s => s.filter((_, i) => i !== index))} className="bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 active:scale-95"><Text className="text-red-500 font-bold text-[10px] uppercase">Remove</Text></TouchableOpacity>
                                    )}
                                </View>
                                
                                <View className="mb-4 relative">
                                    <TouchableOpacity 
                                        onPress={() => { setActiveType(`SECTOR_${index}_FROM`); setShowSelection(true); }}
                                        className="bg-slate-50 p-4 rounded-2xl border border-slate-100 border-b-4 border-slate-200 mb-3 flex-row items-center justify-between shadow-sm active:opacity-85"
                                    >
                                        <View className="flex-1 pr-2">
                                            <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Departure City</Text>
                                            <Text className="text-lg font-black text-slate-900 mb-0.5">{sector.from?.city || 'Select Origin'}</Text>
                                            <Text className="text-[9px] font-bold text-slate-500" numberOfLines={1}>{sector.from?.label || 'Tap to choose'}</Text>
                                        </View>
                                        <View className="w-10 h-10 bg-white rounded-xl items-center justify-center border border-slate-200 shadow-sm"><Ionicons name="airplane-outline" size={18} color="#1D4171" style={{ transform: [{ rotate: '-45deg' }] }} /></View>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        onPress={() => setMultiCitySectors(s => { const c = [...s]; const t = c[index].from; c[index].from = c[index].to; c[index].to = t; return c; })}
                                        className="absolute right-8 top-[55px] z-10 w-9 h-9 bg-[#F07E21] rounded-full items-center justify-center border-2 border-white shadow-lg shadow-orange-500/40 active:scale-95"
                                    >
                                        <Ionicons name="swap-vertical" size={16} color="#fff" />
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        onPress={() => { setActiveType(`SECTOR_${index}_TO`); setShowSelection(true); }}
                                        className="bg-slate-50 p-4 rounded-2xl border border-slate-100 border-b-4 border-slate-200 flex-row items-center justify-between shadow-sm active:opacity-85"
                                    >
                                        <View className="flex-1 pr-2">
                                            <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Destination City</Text>
                                            <Text className="text-lg font-black text-slate-900 mb-0.5">{sector.to?.city || 'Select Destination'}</Text>
                                            <Text className="text-[9px] font-bold text-slate-500" numberOfLines={1}>{sector.to?.label || 'Tap to choose'}</Text>
                                        </View>
                                        <View className="w-10 h-10 bg-white rounded-xl items-center justify-center border border-slate-200 shadow-sm"><Ionicons name="location-outline" size={18} color="#F07E21" /></View>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity 
                                    onPress={() => { setCalendarTarget(`SECTOR_${index}`); setCalendarVisible(true); }}
                                    className="bg-slate-50 p-4 rounded-2xl border border-slate-100 border-b-4 border-slate-200 flex-row items-center justify-between shadow-sm active:opacity-85"
                                >
                                    <View>
                                        <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Travel Date</Text>
                                        <Text className="text-sm font-black text-slate-900">{sector.date ? new Date(sector.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select Date'}</Text>
                                    </View>
                                    <Ionicons name="calendar-outline" size={18} color="#1D4171" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {multiCitySectors.length < 5 && (
                            <TouchableOpacity 
                                onPress={() => setMultiCitySectors(s => [...s, { from: s[s.length-1].to || {}, to: {}, date: new Date(new Date(s[s.length-1].date).getTime() + 86400000).toISOString().split('T')[0] }])}
                                className="bg-[#1D4171]/10 py-4 rounded-[2rem] border-2 border-dashed border-[#1D4171]/30 items-center justify-center mb-5 active:bg-[#1D4171]/20"
                            >
                                <Text className="font-black text-[#1D4171] uppercase text-xs tracking-wider">+ Add Another Flight</Text>
                            </TouchableOpacity>
                        )}

                        {/* Travelers 3D Box for Multi City */}
                        <TouchableOpacity 
                            onPress={() => setShowPaxModal(true)}
                            className="bg-white p-5 rounded-3xl border border-slate-100 border-b-[6px] border-slate-200 mb-6 flex-row items-center justify-between shadow-xl active:opacity-85"
                        >
                            <View>
                                <Text className="text-slate-400 text-[10px] font-black uppercase mb-1.5 tracking-widest">Travelers & Class</Text>
                                <View className="flex-row items-center">
                                    <Text className="text-lg font-black text-slate-900">{totalPax} Pax</Text>
                                    <Text className="text-xs font-bold text-[#F07E21] ml-2">• {cabinClass}</Text>
                                </View>
                            </View>
                            <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-200 shadow-sm">
                                <Ionicons name="people-outline" size={24} color="#1D4171" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={handleSearch}
                            className="bg-[#1D4171] py-5 rounded-2xl items-center shadow-xl shadow-blue-900/40 border-b-4 border-[#122a4a] active:scale-[0.98]"
                            style={{ elevation: 6 }}
                        >
                            <Text className="text-white font-black uppercase text-sm tracking-widest">Search Multi-City Flights</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="bg-white rounded-[2.5rem] p-6 border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/50 mb-6" style={{ elevation: 8 }}>
                        
                        {/* Origin & Destination 3D Boxes */}
                        <View className="mb-5 relative">
                            <TouchableOpacity 
                                onPress={() => { setActiveType('FROM'); setShowSelection(true); }}
                                className="bg-slate-50 p-4 rounded-2xl border border-slate-100 border-b-4 border-slate-200 mb-3.5 flex-row items-center justify-between shadow-sm active:opacity-85"
                            >
                                <View className="flex-1 pr-2">
                                    <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Departure City</Text>
                                    <Text className="text-xl font-black text-slate-900 mb-0.5">{from?.city || 'Select Origin'}</Text>
                                    <Text className="text-[10px] font-bold text-slate-500" numberOfLines={1}>{from?.label ? `${from.label} (${from.code})` : 'Tap to choose departure airport'}</Text>
                                </View>
                                <View className="w-10 h-10 bg-white rounded-xl items-center justify-center border border-slate-200 shadow-sm">
                                    <Ionicons name="airplane-outline" size={20} color="#1D4171" style={{ transform: [{ rotate: '-45deg' }] }} />
                                </View>
                            </TouchableOpacity>

                            {/* 3D Swap Button */}
                            <TouchableOpacity 
                                onPress={() => { const temp = from; setFrom(to); setTo(temp); }}
                                className="absolute right-8 top-[68px] z-10 w-11 h-11 bg-[#F07E21] rounded-full items-center justify-center border-2 border-white shadow-lg shadow-orange-500/40 active:scale-95"
                                style={{ elevation: 6 }}
                            >
                                <Ionicons name="swap-vertical" size={20} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => { setActiveType('TO'); setShowSelection(true); }}
                                className="bg-slate-50 p-4 rounded-2xl border border-slate-100 border-b-4 border-slate-200 flex-row items-center justify-between shadow-sm active:opacity-85"
                            >
                                <View className="flex-1 pr-2">
                                    <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Destination City</Text>
                                    <Text className="text-xl font-black text-slate-900 mb-0.5">{to?.city || 'Select Destination'}</Text>
                                    <Text className="text-[10px] font-bold text-slate-500" numberOfLines={1}>{to?.label ? `${to.label} (${to.code})` : 'Tap to choose arrival airport'}</Text>
                                </View>
                                <View className="w-10 h-10 bg-white rounded-xl items-center justify-center border border-slate-200 shadow-sm">
                                    <Ionicons name="location-outline" size={20} color="#F07E21" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Travel Dates 3D Boxes */}
                        <View className="flex-row mb-5 gap-3">
                            <TouchableOpacity 
                                onPress={() => { setCalendarTarget('OUTBOUND'); setCalendarVisible(true); }}
                                className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 border-b-4 border-slate-200 flex-row items-center justify-between shadow-sm active:opacity-85"
                            >
                                <View>
                                    <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Travel Date</Text>
                                    <Text className="text-sm font-black text-slate-900">{date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select Date'}</Text>
                                </View>
                                <Ionicons name="calendar-outline" size={18} color="#1D4171" />
                            </TouchableOpacity>

                            {tripType === 'roundTrip' && (
                                <TouchableOpacity 
                                    onPress={() => { setCalendarTarget('INBOUND'); setCalendarVisible(true); }}
                                    className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 border-b-4 border-slate-200 flex-row items-center justify-between shadow-sm active:opacity-85"
                                >
                                    <View>
                                        <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Return Date</Text>
                                        <Text className="text-sm font-black text-slate-900">{returnDate ? new Date(returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select Date'}</Text>
                                    </View>
                                    <Ionicons name="calendar-outline" size={18} color="#F07E21" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Travelers 3D Box */}
                        <TouchableOpacity 
                            onPress={() => setShowPaxModal(true)}
                            className="bg-slate-50 p-4 rounded-2xl border border-slate-100 border-b-4 border-slate-200 mb-6 flex-row items-center justify-between shadow-sm active:opacity-85"
                        >
                            <View>
                                <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Travelers & Class</Text>
                                <View className="flex-row items-center">
                                    <Text className="text-base font-black text-slate-900">{totalPax} Passenger{totalPax > 1 ? 's' : ''}</Text>
                                    <Text className="text-xs font-bold text-[#F07E21] ml-2">• {cabinClass}</Text>
                                </View>
                            </View>
                            <View className="w-10 h-10 bg-white rounded-xl items-center justify-center border border-slate-200 shadow-sm">
                                <Ionicons name="people-outline" size={20} color="#1D4171" />
                            </View>
                        </TouchableOpacity>

                        {/* Main Search 3D Button */}
                        <TouchableOpacity 
                            onPress={handleSearch}
                            className="bg-[#1D4171] py-5 rounded-2xl items-center shadow-xl shadow-blue-900/40 border-b-4 border-[#122a4a] active:scale-[0.98]"
                            style={{ elevation: 6 }}
                        >
                            <Text className="text-white font-black uppercase text-sm tracking-widest">Search Flights</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {flights.length > 0 && (
                    <TouchableOpacity 
                        onPress={() => setIsFormCollapsed(true)}
                        className="bg-slate-100 border border-slate-200 border-b-2 py-3 rounded-2xl items-center mb-6"
                    >
                        <Text className="text-[#1D4171] font-black uppercase text-[10px] tracking-wider">Collapse Search Form ↑</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderSortFilterMarkupBar = () => {
        if (flights.length === 0) return null;
        return (
            <View className="mb-4">
                {/* Agent Tools / Markup & Net Price Bar */}
                <View className="mx-4 p-4 border border-slate-200 rounded-3xl bg-white shadow-sm flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center">
                        <TouchableOpacity 
                            onPress={() => setShowNetPrice(!showNetPrice)} 
                            className={`w-12 h-10 items-center justify-center rounded-xl border border-b-4 ${showNetPrice ? 'bg-[#F07E21] border-[#D96B18] shadow-md shadow-orange-500/20' : 'bg-slate-50 border-slate-200 shadow-sm'}`}
                        >
                            <Ionicons name={showNetPrice ? "eye" : "eye-off"} size={18} color={showNetPrice ? "#fff" : "#64748b"} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={() => { setTempMarkup(String(markupAmount)); setIsEditingMarkup(true); }} 
                            className="ml-3 w-10 h-10 bg-blue-50 rounded-xl items-center justify-center border border-blue-200 border-b-4 shadow-sm"
                        >
                            <Ionicons name="pencil" size={14} color="#1D4171" />
                        </TouchableOpacity>

                        <Text className="ml-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                            Markup: ₹{markupAmount}
                        </Text>
                    </View>

                    <TouchableOpacity 
                        onPress={() => setShowFilterModal(true)} 
                        className="w-11 h-11 bg-[#F07E21] rounded-2xl items-center justify-center shadow-lg shadow-orange-500/30 border-b-4 border-[#D96B18] active:scale-95"
                    >
                        <Ionicons name="filter" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Quick Sort Tabs & Clear Filters */}
                <View className="mx-4 flex-row gap-3 items-center justify-between">
                    <View className="flex-1 flex-row gap-2">
                        {[['priceLow', 'Cheapest'], ['fastest', 'Fastest']].map(([key, label]) => (
                            <TouchableOpacity 
                                key={key} 
                                onPress={() => setSortBy(key)} 
                                className={`flex-1 py-3 rounded-2xl items-center border ${sortBy === key ? 'bg-[#1D4171] border-[#122a4a] border-b-4 shadow-lg shadow-blue-900/30' : 'bg-white border-slate-200 shadow-sm'}`}
                            >
                                <Text className={`text-[10px] font-black uppercase tracking-wider ${sortBy === key ? 'text-white' : 'text-slate-500'}`}>{label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {(selectedDepSlots.length > 0 || selectedArrSlots.length > 0 || selectedAirlines.length > 0 || selectedStops.length > 0 || selectedRefundables.length > 0 || maxDurationFilter !== 1440 || flightNoQuery) && (
                        <TouchableOpacity 
                            onPress={() => { 
                                setSelectedDepSlots([]); 
                                setSelectedArrSlots([]); 
                                setSelectedAirlines([]); 
                                setSelectedRefundables([]); 
                                setSelectedStops([]);
                                setFlightNoQuery(''); 
                                setMaxDurationFilter(1440); 
                            }} 
                            className="bg-orange-50 px-3 py-2.5 rounded-xl border border-orange-200 border-b-2 active:opacity-80 shadow-sm"
                        >
                            <Text className="text-[#F07E21] text-[9px] font-black uppercase tracking-wider">Reset</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                
                {/* InspirationLoader / GoyaflyLoader */}
                {loading && <InspirationLoader />}
                {verifyingPrice && <InspirationLoader />}

                <FlatList
                    data={loading ? [] : filteredFlights}
                    keyExtractor={(item, index) => String(item.flightID || item.id || index)}
                    ListHeaderComponent={
                        <View className="pb-4">
                            {renderHeader()}
                            {renderSearchCard()}
                            {renderSortFilterMarkupBar()}
                            
                            {/* Empty inventory placeholder in header when flights is empty */}
                            {flights.length === 0 && !loading && (
                                <View className="mx-4 mt-2 bg-white rounded-2xl p-4 border border-slate-100 border-b-4 border-slate-200 shadow-sm flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <View className="w-8 h-8 bg-orange-50 rounded-lg items-center justify-center border border-orange-100 mr-3">
                                            <Ionicons name="shield-checkmark" size={16} color="#F07E21" />
                                        </View>
                                        <View>
                                            <Text className="font-black text-xs text-slate-800">Goyafly Best Price Guarantee</Text>
                                            <Text className="text-[10px] text-slate-400 font-bold">Instant GDS ticketing & wallet settlement</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                                </View>
                            )}
                        </View>
                    }
                    renderItem={({ item }) => (
                        <FlightCard
                            item={item} 
                            from={from?.code} 
                            to={to?.code} 
                            showMarkup={showNetPrice} 
                            markup={markupAmount}
                            onBook={fare => handleBook(fare, item)} 
                            onViewRules={handleViewRules} 
                            onViewDetails={it => { setSelectedFlight(it); setShowDetailsModal(true); }}
                            t={t} 
                            isCheapest={item.price === cheapestPrice} 
                            isFastest={parseDurationToMinutes(item.duration) === fastestMins && fastestMins > 0}
                            screenWidth={width}
                        />
                    )}
                    ListEmptyComponent={
                        !loading && flights.length > 0 && filteredFlights.length === 0 ? (
                            <View className="py-20 items-center">
                                <Text className="text-5xl mb-4">✈️</Text>
                                <Text className="font-black text-slate-400 uppercase text-xs tracking-widest text-center px-6">No flights matching your filters</Text>
                            </View>
                        ) : null
                    }
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                />

                {/* Airport Selection Modal */}
                <Modal visible={showSelection} animationType="slide" transparent>
                    <View className="flex-1 bg-black/60 justify-end">
                        <View className="bg-white rounded-t-[2.5rem] p-6 h-[88%] border-t border-slate-100 shadow-2xl">
                            <View className="flex-row justify-between items-center mb-5">
                                <Text className="text-xl font-black text-slate-900 uppercase tracking-wider">Select City or Airport</Text>
                                <TouchableOpacity onPress={() => setShowSelection(false)} className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center border border-slate-200">
                                    <Ionicons name="close" size={20} color="#000" />
                                </TouchableOpacity>
                            </View>
                            
                            <View className="bg-slate-50 flex-row items-center px-5 py-3.5 rounded-2xl border border-slate-200 border-b-4 mb-5 shadow-sm">
                                <Ionicons name="search" size={20} color="#1D4171" />
                                <TextInput 
                                    className="flex-1 ml-3 font-bold text-slate-900 text-sm" 
                                    placeholder="Search by city or airport code..." 
                                    value={search} onChangeText={setSearch} 
                                    autoFocus
                                    placeholderTextColor="#94a3b8"
                                />
                                {search.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearch('')}>
                                        <Ionicons name="close-circle" size={18} color="#94a3b8" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {searching ? (
                                    <ActivityIndicator color="#F07E21" size="large" className="py-12" />
                                ) : (
                                    results.map((airport) => (
                                        <TouchableOpacity 
                                            key={airport.code}
                                            onPress={() => {
                                                if (activeType === 'FROM') setFrom(airport);
                                                else if (activeType === 'TO') setTo(airport);
                                                else if (activeType?.startsWith('SECTOR_')) {
                                                    const parts = activeType.split('_');
                                                    const index = parseInt(parts[1]);
                                                    const field = parts[2].toLowerCase();
                                                    setMultiCitySectors(s => { const c = [...s]; c[index][field] = airport; return c; });
                                                }
                                                setShowSelection(false);
                                                setSearch('');
                                            }}
                                            className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 border-b-4 border-slate-200 mb-3 flex-row justify-between items-center shadow-sm active:opacity-80"
                                        >
                                            <View className="flex-1 pr-4">
                                                <Text className="font-black text-slate-900 text-sm mb-0.5">{airport.city}</Text>
                                                <Text className="text-[10px] text-slate-500 font-bold uppercase">{airport.label}</Text>
                                            </View>
                                            <View className="bg-[#1D4171]/10 px-3 py-1.5 rounded-xl border border-[#1D4171]/20">
                                                <Text className="font-black text-[#1D4171] text-xs">{airport.code}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                )}
                                <View className="h-10" />
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Travelers & Cabin Class Modal */}
                <Modal visible={showPaxModal} transparent animationType="slide">
                    <View className="flex-1 bg-black/60 justify-end">
                        <View className="bg-white rounded-t-[2.5rem] p-6 shadow-2xl border-t border-slate-100 max-h-[85%]">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-black text-slate-900 uppercase tracking-wider">Travelers & Class</Text>
                                <TouchableOpacity onPress={() => setShowPaxModal(false)} className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center border border-slate-200">
                                    <Ionicons name="close" size={20} color="#000" />
                                </TouchableOpacity>
                            </View>
                            
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <PaxCounter label="Adults" sub="12+ Years" value={pax.adt} min={1} onInc={() => setPax({...pax, adt: pax.adt+1})} onDec={() => setPax({...pax, adt: pax.adt-1})} />
                                <PaxCounter label="Children" sub="2-12 Years" value={pax.chd} onInc={() => setPax({...pax, chd: pax.chd+1})} onDec={() => setPax({...pax, chd: pax.chd-1})} />
                                <PaxCounter label="Infants" sub="Under 2 Years" value={pax.inf} onInc={() => setPax({...pax, inf: pax.inf+1})} onDec={() => setPax({...pax, inf: pax.inf-1})} />
                                
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-4">Cabin Class</Text>
                                <View className="flex-row flex-wrap gap-2 mb-6">
                                    {['Economy', 'Premium Economy', 'Business', 'First'].map(c => {
                                        const selected = cabinClass === c;
                                        return (
                                            <TouchableOpacity 
                                                key={c} 
                                                onPress={() => setCabinClass(c)}
                                                style={{ 
                                                    backgroundColor: selected ? '#1D4171' : '#F8FAFC',
                                                    borderColor: selected ? '#122a4a' : '#E2E8F0',
                                                    borderWidth: 1
                                                }}
                                                className="px-4 py-3.5 rounded-2xl shadow-sm mr-2 mb-2 active:scale-95"
                                            >
                                                <Text style={{ color: selected ? 'white' : '#1E293B' }} className="font-black text-xs uppercase tracking-wider">
                                                    {c}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>

                            <TouchableOpacity 
                                onPress={() => setShowPaxModal(false)}
                                className="bg-[#1D4171] py-5 rounded-2xl items-center mt-6 shadow-xl shadow-blue-900/30 border-b-4 border-[#122a4a] active:scale-[0.98]"
                                style={{ elevation: 6 }}
                            >
                                <Text className="text-white font-black uppercase text-xs tracking-widest">Apply Details</Text>
                            </TouchableOpacity>
                            <View className="h-4" />
                        </View>
                    </View>
                </Modal>

                {/* Calendar picker */}
                <CalendarPicker 
                    visible={calendarVisible} 
                    onClose={() => setCalendarVisible(false)} 
                    onSelect={(selected) => {
                        if (calendarTarget === 'INBOUND') setReturnDate(selected);
                        else if (calendarTarget?.startsWith('SECTOR_')) {
                            const index = parseInt(calendarTarget.split('_')[1]);
                            setMultiCitySectors(s => { const c = [...s]; c[index].date = selected; return c; });
                        }
                        else setDate(selected);
                    }} 
                    initialDate={
                        calendarTarget === 'INBOUND' ? (returnDate || new Date().toISOString().split('T')[0]) :
                        calendarTarget?.startsWith('SECTOR_') ? (multiCitySectors[parseInt(calendarTarget.split('_')[1])]?.date || new Date().toISOString().split('T')[0]) :
                        (date || new Date().toISOString().split('T')[0])
                    } 
                    t={t} 
                />

                {/* ── Advanced Filter Modal ── */}
                <Modal visible={showFilterModal} animationType="slide" transparent>
                    <View className="flex-1 bg-black/60 justify-end">
                        <View className="bg-white rounded-t-[2.5rem] p-6 h-[88%] shadow-2xl border-t border-slate-100">
                            <View className="flex-row items-center justify-between border-b border-gray-100 pb-5 mb-5">
                                <Text className="text-xl font-black text-[#1D4171] uppercase tracking-wider">Advanced Filters</Text>
                                <TouchableOpacity onPress={() => setShowFilterModal(false)} className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center border border-slate-200">
                                    <Ionicons name="close" size={20} color="#000" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                                {/* Stops Section */}
                                <Text className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Stops Visibility</Text>
                                <View className="flex-row flex-wrap gap-2 mb-6">
                                    {['Non-Stop', '1 Stop', '2+ Stops'].map(s => {
                                        const active = selectedStops.includes(s);
                                        return (
                                            <TouchableOpacity 
                                                key={s} 
                                                onPress={() => setSelectedStops(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])} 
                                                className={`px-5 py-3 rounded-xl border border-b-4 ${active ? 'bg-[#F07E21] border-[#D96B18] shadow-md shadow-orange-500/20' : 'bg-slate-50 border-slate-200 shadow-sm'}`}
                                            >
                                                <Text className={`text-xs font-black uppercase tracking-wider ${active ? 'text-white' : 'text-slate-600'}`}>{s}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Departure Time Slots */}
                                <Text className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Departure Window</Text>
                                <View className="flex-row flex-wrap gap-2 mb-6">
                                    {['Early Morning', 'Morning', 'Afternoon', 'Evening'].map(slot => {
                                        const active = selectedDepSlots.includes(slot);
                                        return (
                                            <TouchableOpacity 
                                                key={slot} 
                                                onPress={() => setSelectedDepSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot])} 
                                                className={`px-4 py-3 rounded-xl border border-b-4 ${active ? 'bg-[#1D4171] border-[#122a4a] shadow-md shadow-blue-900/20' : 'bg-slate-50 border-slate-200 shadow-sm'}`}
                                            >
                                                <Text className={`text-xs font-black uppercase tracking-wider ${active ? 'text-white' : 'text-slate-600'}`}>{slot}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Arrival Time Slots */}
                                <Text className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Arrival Window</Text>
                                <View className="flex-row flex-wrap gap-2 mb-6">
                                    {['Early Morning', 'Morning', 'Afternoon', 'Evening'].map(slot => {
                                        const active = selectedArrSlots.includes(slot);
                                        return (
                                            <TouchableOpacity 
                                                key={slot} 
                                                onPress={() => setSelectedArrSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot])} 
                                                className={`px-4 py-3 rounded-xl border border-b-4 ${active ? 'bg-[#1D4171] border-[#122a4a] shadow-md shadow-blue-900/20' : 'bg-slate-50 border-slate-200 shadow-sm'}`}
                                            >
                                                <Text className={`text-xs font-black uppercase tracking-wider ${active ? 'text-white' : 'text-slate-600'}`}>{slot}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Airline Explorer */}
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Airline Explorer</Text>
                                    <TouchableOpacity onPress={() => setSelectedAirlines([])} className="py-1">
                                        <Text className="text-[#F07E21] text-[10px] font-black tracking-wider uppercase">Reset</Text>
                                    </TouchableOpacity>
                                </View>
                                <TextInput 
                                    placeholder="Search airline..." 
                                    value={airlineSearch} 
                                    onChangeText={setAirlineSearch} 
                                    placeholderTextColor="#94a3b8" 
                                    className="bg-slate-50 px-5 py-3.5 rounded-xl mb-4 border border-slate-200 border-b-4 font-bold text-sm text-slate-900 shadow-sm" 
                                />
                                <View className="space-y-2 mb-6">
                                    {availableAirlines.filter(a => a.name.toLowerCase().includes(airlineSearch.toLowerCase())).map(a => {
                                        const active = selectedAirlines.includes(a.name);
                                        return (
                                            <TouchableOpacity 
                                                key={a.name} 
                                                onPress={() => setSelectedAirlines(prev => prev.includes(a.name) ? prev.filter(n => n !== a.name) : [...prev, a.name])} 
                                                className="flex-row items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 border-b-2 border-slate-200 mb-2 shadow-sm active:opacity-80"
                                            >
                                                <View className="flex-row items-center">
                                                    <Image source={{ uri: `https://images.kiwi.com/airlines/64/${a.iata || 'AI'}.png` }} style={{ width: 24, height: 24 }} />
                                                    <Text className={`ml-3 font-black text-sm ${active ? 'text-[#F07E21]' : 'text-slate-800'}`}>{a.name}</Text>
                                                </View>
                                                <View className={`w-6 h-6 rounded-lg border items-center justify-center ${active ? 'bg-[#F07E21] border-[#D96B18]' : 'border-slate-300 bg-white'}`}>
                                                    {active && <Ionicons name="checkmark" size={14} color="#fff" />}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Journey Duration */}
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Journey Duration</Text>
                                    <Text className="text-[#F07E21] text-[10px] font-black uppercase tracking-wider">Under {Math.floor(maxDurationFilter/60)}h {maxDurationFilter%60}m</Text>
                                </View>
                                <View className="flex-row flex-wrap gap-2 mb-6">
                                    {[360, 720, 1080, 1440].map(mins => (
                                        <TouchableOpacity 
                                            key={mins} 
                                            onPress={() => setMaxDurationFilter(mins)} 
                                            className={`px-4 py-3 rounded-xl border border-b-4 ${maxDurationFilter === mins ? 'bg-[#1D4171] border-[#122a4a] shadow-md shadow-blue-900/20' : 'bg-slate-50 border-slate-200 shadow-sm'}`}
                                        >
                                            <Text className={`text-xs font-black uppercase tracking-wider ${maxDurationFilter === mins ? 'text-white' : 'text-slate-600'}`}>{mins === 1440 ? 'Any Duration' : `Under ${mins/60}h`}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Refundability */}
                                <Text className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Refundability</Text>
                                <View className="flex-row gap-3 mb-8">
                                    {['Refundable', 'Non-Refundable'].map(type => {
                                        const active = selectedRefundables.includes(type);
                                        return (
                                            <TouchableOpacity 
                                                key={type} 
                                                onPress={() => setSelectedRefundables(prev => prev.includes(type) ? prev.filter(t=>t!==type) : [...prev, type])} 
                                                className={`flex-1 py-3.5 rounded-xl border border-b-4 items-center ${active ? 'bg-[#1D4171] border-[#122a4a] shadow-md shadow-blue-900/20' : 'bg-slate-50 border-slate-200 shadow-sm'}`}
                                            >
                                                <Text className={`text-xs font-black uppercase tracking-wider ${active ? 'text-white' : 'text-slate-600'}`}>{type}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                <View className="h-6" />
                            </ScrollView>
                            <View className="pt-4 border-t border-gray-100">
                                <TouchableOpacity 
                                    onPress={() => setShowFilterModal(false)} 
                                    className="bg-[#F07E21] py-5 rounded-2xl items-center shadow-xl shadow-orange-500/30 border-b-4 border-[#D96B18] active:scale-[0.98]"
                                >
                                    <Text className="text-white font-black uppercase text-xs tracking-widest">Apply Filters · {filteredFlights.length} Results</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* ── Fare Rules Modal (Premium Blue Theme) ── */}
                <Modal visible={showRulesModal} transparent animationType="slide">
                    <View className="flex-1 bg-black/60 justify-end">
                        <View className="bg-white rounded-t-[2.5rem] p-6 h-[78%] shadow-2xl border-t border-slate-100">
                            <View className="flex-row justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                <Text className="font-black text-xl text-[#1D4171] uppercase tracking-wider">Price Policy</Text>
                                <TouchableOpacity onPress={() => setShowRulesModal(false)} className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center border border-slate-200">
                                    <Ionicons name="close" size={20} color="#000" />
                                </TouchableOpacity>
                            </View>
                            {fetchingRules ? <ActivityIndicator size="large" color="#F07E21" className="mt-20" /> : (
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <View className="p-5 bg-slate-50 rounded-2xl mb-5 border border-slate-200 border-b-4 shadow-sm relative overflow-hidden">
                                         <View className="absolute top-0 right-0 p-3 opacity-10"><Text className="text-5xl">📝</Text></View>
                                         <Text className="text-[#1D4171] font-black text-[10px] uppercase mb-1.5 tracking-widest">Policy Summary</Text>
                                         <Text className="text-[#1D4171] font-bold text-xs leading-5">Cancellation & date change charges are subject to airline rules.</Text>
                                    </View>
                                    
                                    {rules?.cancellation && (
                                        <View className="mb-5 bg-red-50/50 p-5 rounded-2xl border border-red-100 border-b-4 border-red-200 shadow-sm">
                                            <Text className="text-red-600 font-black text-[10px] uppercase mb-2 tracking-widest">⚑ Cancellation Policy</Text>
                                            <Text className="text-slate-800 leading-6 text-xs font-bold">{rules.cancellation}</Text>
                                        </View>
                                    )}

                                    {rules?.dateChange && (
                                        <View className="mb-5 bg-orange-50/50 p-5 rounded-2xl border border-orange-100 border-b-4 border-orange-200 shadow-sm">
                                            <Text className="text-[#F07E21] font-black text-[10px] uppercase mb-2 tracking-widest">⟳ Date Change Policy</Text>
                                            <Text className="text-slate-800 leading-6 text-xs font-bold">{rules.dateChange}</Text>
                                        </View>
                                    )}

                                    {rules?.noShow && (
                                        <View className="mb-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 border-b-4 border-slate-200 shadow-sm">
                                            <Text className="text-slate-500 font-black text-[10px] uppercase mb-2 tracking-widest">⚠ No-Show Policy</Text>
                                            <Text className="text-slate-800 leading-6 text-xs font-bold">{rules.noShow}</Text>
                                        </View>
                                    )}

                                    <TouchableOpacity 
                                        onPress={() => Toast.show({ type: 'info', text1: 'Full Rules', text2: rules?.raw || 'Not available', visibilityTime: 10000 })} 
                                        className="py-3 mb-6 bg-slate-100 rounded-xl border border-slate-200 border-b-2 active:opacity-80 shadow-sm"
                                    >
                                        <Text className="text-[#1D4171] font-black text-[10px] text-center uppercase tracking-widest">View Detailed GDS Text</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            )}
                            <TouchableOpacity 
                                onPress={() => setShowRulesModal(false)} 
                                className="bg-[#1D4171] py-5 rounded-2xl mt-4 shadow-xl shadow-blue-900/30 border-b-4 border-[#122a4a] active:scale-[0.98]"
                            >
                                <Text className="text-center text-white font-black uppercase text-xs tracking-widest">OK, Understood</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* ── Markup Editor Modal ── */}
                <Modal visible={isEditingMarkup} transparent animationType="slide">
                    <View className="flex-1 bg-black/60 justify-end">
                        <View className="bg-white rounded-t-[2.5rem] p-6 shadow-2xl border-t border-slate-100">
                            <View className="w-12 h-1 bg-slate-200 rounded-full self-center mb-6" />
                            <Text className="font-black text-xl mb-6 text-center text-[#1D4171] uppercase tracking-wider">Agent Markup</Text>
                            <TextInput 
                                keyboardType="numeric" 
                                autoFocus 
                                value={tempMarkup} 
                                onChangeText={setTempMarkup} 
                                className="bg-slate-50 px-8 py-6 rounded-2xl text-center text-4xl font-black text-[#F07E21] border border-slate-200 border-b-4 mb-8 shadow-sm" 
                            />
                            <View className="flex-row gap-4 mb-4">
                                <TouchableOpacity 
                                    onPress={() => setIsEditingMarkup(false)} 
                                    className="flex-1 py-5 rounded-xl bg-slate-100 items-center border border-slate-200 border-b-4 active:opacity-80 shadow-sm"
                                >
                                    <Text className="font-black text-slate-500 uppercase text-xs tracking-widest">Discard</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => { 
                                        const amount = Number(tempMarkup) || 0;
                                        setMarkupAmount(amount); 
                                        setIsEditingMarkup(false); 
                                    }} 
                                    className="flex-1 py-5 rounded-xl bg-[#F07E21] items-center shadow-lg shadow-orange-500/30 border-b-4 border-[#D96B18] active:scale-95"
                                >
                                    <Text className="text-white font-black uppercase text-xs tracking-widest">Save Markup</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* ── Flight Details Modal ── */}
                <Modal visible={showDetailsModal} animationType="slide" transparent>
                    <View className="flex-1 bg-black/60 justify-end">
                        <View className="bg-white rounded-t-[2.5rem] p-6 h-[85%] shadow-2xl border-t border-slate-100">
                            <View className="flex-row justify-between items-center mb-6 border-b border-gray-100 pb-4">
                                <Text className="text-xl font-black text-slate-900 uppercase tracking-wider">Flight Details</Text>
                                <TouchableOpacity onPress={() => setShowDetailsModal(false)} className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center border border-slate-200">
                                    <Ionicons name="close" size={20} color="#000" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {selectedFlight && (
                                    <View>
                                        <View className="bg-slate-50 p-5 rounded-2xl border border-slate-100 border-b-4 border-slate-200 mb-5 shadow-sm">
                                            <View className="flex-row justify-between items-center mb-5 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                                                <View className="flex-row items-center">
                                                    <Image source={{ uri: `https://images.kiwi.com/airlines/64/${selectedFlight.airlineIata || 'AI'}.png` }} style={{ width: 24, height: 24 }} />
                                                    <Text className="ml-3 font-black text-slate-900 text-sm">{selectedFlight.airline}</Text>
                                                </View>
                                                <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{selectedFlight.flightNumber}</Text>
                                            </View>

                                            <View className="flex-row justify-between items-center p-2">
                                                <View>
                                                    <Text className="text-xl font-black text-slate-900 mb-0.5">{selectedFlight.departureTime}</Text>
                                                    <Text className="text-[10px] font-bold text-slate-500 uppercase">{selectedFlight.from || from?.code}</Text>
                                                </View>
                                                <View className="items-center flex-1 px-4">
                                                    <Text className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">{selectedFlight.duration}</Text>
                                                    <View className="w-full h-[2px] bg-slate-200 relative">
                                                        <View className="absolute top-[-3px] left-0 w-2 h-2 rounded-full bg-slate-300" />
                                                        <View className="absolute top-[-3px] right-0 w-2 h-2 rounded-full bg-[#F07E21]" />
                                                    </View>
                                                    <Text className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-wider">{selectedFlight.stops || 'Non-Stop'}</Text>
                                                </View>
                                                <View className="items-end">
                                                    <Text className="text-xl font-black text-slate-900 mb-0.5">{selectedFlight.arrivalTime}</Text>
                                                    <Text className="text-[10px] font-bold text-slate-500 uppercase">{selectedFlight.to || to?.code}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View className="bg-slate-50 border border-slate-100 border-b-4 border-slate-200 p-5 rounded-2xl mb-5 shadow-sm">
                                            <Text className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Baggage Info</Text>
                                            <View className="flex-row justify-between mb-3 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm items-center">
                                                <Text className="text-slate-600 font-bold text-xs">Check-in Baggage</Text>
                                                <Text className="font-black text-slate-900 text-sm">{selectedFlight.bagCkin || '15 KG'}</Text>
                                            </View>
                                            <View className="flex-row justify-between bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm items-center">
                                                <Text className="text-slate-600 font-bold text-xs">Cabin Baggage</Text>
                                                <Text className="font-black text-slate-900 text-sm">{selectedFlight.bagCabin || '7 KG'}</Text>
                                            </View>
                                        </View>

                                        <View className="bg-blue-50 p-5 rounded-2xl border border-blue-100 border-b-4 border-blue-200 shadow-sm mb-6 flex-row items-center justify-between">
                                            <View>
                                                <Text className="text-[10px] font-black text-[#1D4171] uppercase mb-1 tracking-widest">Total Payable</Text>
                                                <Text className="text-2xl font-black text-[#1D4171]">₹{((selectedFlight.price || 0) + (showNetPrice ? Number(markupAmount) : 0)).toLocaleString()}</Text>
                                            </View>
                                            <TouchableOpacity 
                                                onPress={() => { 
                                                    setShowDetailsModal(false); 
                                                    handleBook(null, selectedFlight); 
                                                }} 
                                                className="bg-[#F07E21] px-6 py-3 rounded-xl shadow-md shadow-orange-500/30 border-b-4 border-[#D96B18] active:scale-95"
                                            >
                                                <Text className="text-white font-black text-xs uppercase tracking-wider">Book Now</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* ── Price Update Modal ── */}
                <Modal visible={showPriceUpdateModal} transparent animationType="fade">
                    <View className="flex-1 bg-black/60 justify-center items-center p-5">
                        <View className="bg-white rounded-[2.5rem] p-6 w-full shadow-2xl border border-slate-100 border-b-8 border-slate-200">
                            <View className="w-16 h-16 bg-orange-50 rounded-2xl items-center justify-center self-center mb-6 border border-orange-100 border-b-4 shadow-sm">
                                <Ionicons name="trending-up" size={32} color="#F07E21" />
                            </View>
                            <Text className="text-xl font-black text-slate-900 text-center mb-3 uppercase tracking-wider">Fare Updated</Text>
                            <Text className="text-slate-600 text-center mb-6 font-medium text-xs leading-5">
                                The airline has updated the fare for this flight. Please review the new price before proceeding.
                            </Text>
                            
                            <View className="flex-row justify-between items-center mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 border-b-4 border-slate-200 shadow-sm">
                                <View>
                                    <Text className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Old Price</Text>
                                    <Text className="text-base font-black text-slate-400 line-through">₹{priceUpdateData?.oldPrice?.toLocaleString()}</Text>
                                </View>
                                <View className="w-8 h-8 bg-white rounded-full items-center justify-center border border-slate-200 shadow-sm">
                                    <Ionicons name="arrow-forward" size={16} color="#1D4171" />
                                </View>
                                <View className="items-end">
                                    <Text className="text-[9px] font-black text-[#F07E21] uppercase mb-1 tracking-widest">New Price</Text>
                                    <Text className="text-xl font-black text-slate-900">₹{priceUpdateData?.newPrice?.toLocaleString()}</Text>
                                </View>
                            </View>

                            <View className="flex-row gap-3">
                                <TouchableOpacity 
                                    onPress={() => setShowPriceUpdateModal(false)}
                                    className="flex-1 py-4 rounded-xl bg-slate-100 items-center border border-slate-200 border-b-4 active:opacity-80 shadow-sm"
                                >
                                    <Text className="font-black text-slate-500 uppercase text-xs tracking-widest">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => { setShowPriceUpdateModal(false); priceUpdateData?.onConfirm(); }}
                                    className="flex-1 py-4 rounded-xl bg-[#1D4171] items-center shadow-lg shadow-blue-900/30 border-b-4 border-[#122a4a] active:scale-95"
                                >
                                    <Text className="text-white font-black uppercase text-xs tracking-widest">Accept</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

            </SafeAreaView>
        </View>
    );
}
