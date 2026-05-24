import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, ActivityIndicator,
    Image, ScrollView, TextInput, Modal, useWindowDimensions
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { bookingService } from '../../services/api';
import GoyaflyLoader from '../../components/GoyaflyLoader';
import InspirationLoader from '../../components/InspirationLoader';
import { useThemeColors } from '../../utils/themeColors';

// ─────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────
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
                    <Text className="text-slate-400 text-[9px] font-black uppercase mb-0.5 tracking-widest">Net Fare</Text>
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
                    <View className="items-end">
                        <Text className="text-2xl font-black text-[#F07E21]">₹{displayPrice.toLocaleString()}</Text>
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

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────
export default function FlightResultsScreen({ navigation, route }) {
    const t = useThemeColors();
    const { width } = useWindowDimensions();
    const { from, to, date, returnDate, passengers, tripType = 0 } = route?.params || {};

    const [flights, setFlights]       = useState([]);
    const [loading, setLoading]       = useState(true);
    const [verifying, setVerifying]   = useState(false);

    // Advanced Filter State
    const [activeFilter, setActiveFilter] = useState('All'); // Stops
    const [selectedDepSlots, setSelectedDepSlots] = useState([]);
    const [selectedArrSlots, setSelectedArrSlots] = useState([]);
    const [selectedAirlines, setSelectedAirlines] = useState([]);
    const [selectedRefundables, setSelectedRefundables] = useState([]);
    const [flightNoQuery, setFlightNoQuery] = useState('');
    const [maxDuration, setMaxDuration] = useState(1440); // 24h
    const [airlineSearch, setAirlineSearch] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    
    const [sortBy, setSortBy]             = useState('priceLow');
    const [showMarkup, setShowMarkup]     = useState(false);
    const [markup, setMarkup]             = useState('1000');
    const [showMarkupModal, setShowMarkupModal] = useState(false);
    const [tempMarkup, setTempMarkup]         = useState('1000');

    const [rules, setRules]             = useState(null);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [fetchingRules, setFetchingRules] = useState(false);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showPriceUpdateModal, setShowPriceUpdateModal] = useState(false);
    const [priceUpdateData, setPriceUpdateData] = useState(null);

    // Step 1: Search
    useEffect(() => {
        const fetchFlights = async () => {
            setLoading(true);
            try {
                const res = await bookingService.ftdSearchFlights({
                    from, to, date, returnDate: tripType === 1 ? returnDate : undefined,
                    tripType, adt: passengers?.adt || 1, chd: passengers?.chd || 0, inf: passengers?.inf || 0,
                });
                if (res.success) setFlights(res.data?.flights || []);
                else Toast.show({ type: 'error', text1: 'Search Failed', text2: res.message || 'No flights found.' });
            } catch (e) { Toast.show({ type: 'error', text1: 'Error', text2: e.message || 'Failed to load flights.' }); }
            finally { setLoading(false); }
        };
        fetchFlights();
    }, [from, to, date, tripType, returnDate]);

    // Derived Airlines list
    const availableAirlines = useMemo(() => {
        const unique = {};
        flights.forEach(f => {
            if (!unique[f.airline]) unique[f.airline] = { name: f.airline, iata: f.airlineIata, count: 0 };
            unique[f.airline].count++;
        });
        return Object.values(unique).sort((a,b) => a.name.localeCompare(b.name));
    }, [flights]);

    // Master Filter Logic
    const filteredFlights = useMemo(() => {
        let result = [...flights];

        // Stops
        if (activeFilter === 'Non-Stop') result = result.filter(f => f.stops === 'Non-Stop' || f.stops === 0);
        else if (activeFilter === '1 Stop') result = result.filter(f => f.stops === '1 Stop' || f.stops === 1);
        else if (activeFilter === '1+ Stop') result = result.filter(f => f.stops !== 'Non-Stop' && f.stops !== 0);

        // Departure Slots
        if (selectedDepSlots.length > 0) result = result.filter(f => selectedDepSlots.includes(getTimeSlot(f.departureTime)));
        
        // Arrival Slots
        if (selectedArrSlots.length > 0) result = result.filter(f => selectedArrSlots.includes(getTimeSlot(f.arrivalTime)));

        // Airlines
        if (selectedAirlines.length > 0) result = result.filter(f => selectedAirlines.includes(f.airline));

        // Refundable
        if (selectedRefundables.length > 0) {
            result = result.filter(f => {
                const isRef = f.refundType === 'P' || f.refundType === 'Refundable';
                return selectedRefundables.includes(isRef ? 'Refundable' : 'Non-Refundable');
            });
        }

        // Flight Number
        if (flightNoQuery) result = result.filter(f => f.flightNumber?.toLowerCase().includes(flightNoQuery.toLowerCase()));

        // Duration
        result = result.filter(f => parseDurationToMinutes(f.duration) <= maxDuration);

        // Sort
        return result.sort((a, b) => sortBy === 'priceLow' ? (a.price - b.price) : (b.price - a.price));
    }, [flights, activeFilter, selectedDepSlots, selectedArrSlots, selectedAirlines, selectedRefundables, flightNoQuery, maxDuration, sortBy]);

    const cheapestPrice = useMemo(() => filteredFlights.length ? Math.min(...filteredFlights.map(f => f.price)) : 0, [filteredFlights]);
    const fastestMins = useMemo(() => filteredFlights.length ? Math.min(...filteredFlights.map(f => parseDurationToMinutes(f.duration))) : 0, [filteredFlights]);

    // Handlers
    const handleViewRules = async (fID) => {
        setFetchingRules(true); setShowRulesModal(true); setRules(null);
        try {
            const res = await bookingService.ftdGetFareRules(fID);
            if (res.success) {
                const parsed = parseFareRules(res.data);
                setRules(parsed);
            } else {
                setRules('Rules unavailable.');
            }
        } catch { 
            setRules('Fetch error.'); 
        } finally { 
            setFetchingRules(false); 
        }
    };

    const handleBook = useCallback(async (fareObj, parentFlight) => {
        const fare = fareObj || {};
        const flight = parentFlight || fare || {};
        const fID = fare.flightID || fare.FlightID || fare.Fare?.flightID || fare.Fare?.FlightID || fare.Flights?.Onward?.[0]?.flightID || fare.ID || flight.flightID || flight.id;
        const rID = fare.refID || fare.RefID || flight.refID || flight.RefID;
        const netfare = Number(fare.Fare?.total?.netfare || fare.total?.netfare || fare.netfare || fare.price || flight.price || 0);

        if (!fID || !rID) return Toast.show({ type: 'error', text1: 'Error', text2: 'Session lost.' });
        setVerifying(true);
        try {
            const verifyRes = await bookingService.ftdVerifyPrice(fID, rID, netfare);
            if (!verifyRes.success) return Toast.show({ type: 'error', text1: 'Price Verification Failed', text2: verifyRes.message });
            
            const verifiedNetfare = Number(verifyRes.data?.currentNetfare || netfare);
            const detailsPayload = { ...(flight || {}), ...(fare || {}), flightID: verifyRes.data?.flightID || fID, refID: verifyRes.data?.refID || rID, netfare: verifiedNetfare, date, returnDate: tripType === 1 ? returnDate : undefined, tripType, appliedMarkup: showMarkup?Number(markup):0, ssrInfo: verifyRes.data?.ssrInfo };
            if (verifiedNetfare > netfare) {
                setPriceUpdateData({ oldPrice: netfare + (showMarkup?Number(markup):0), newPrice: verifiedNetfare + (showMarkup?Number(markup):0), onConfirm: () => navigation.navigate('Checkout', { bookingData: { service: 'Flight', from, to, baseFare: verifiedNetfare, markupPrice: verifiedNetfare + (showMarkup?Number(markup):0), details: detailsPayload }, passengers: (passengers?.adt||1)+(passengers?.chd||0)+(passengers?.inf||0), paxBreakdown: passengers }) });
                setShowPriceUpdateModal(true);
            } else {
                navigation.navigate('Checkout', { bookingData: { service: 'Flight', from, to, baseFare: verifiedNetfare, markupPrice: verifiedNetfare + (showMarkup?Number(markup):0), details: detailsPayload }, passengers: (passengers?.adt||1)+(passengers?.chd||0)+(passengers?.inf||0), paxBreakdown: passengers });
            }
        } catch (e) { Toast.show({ type: 'error', text1: 'Error', text2: e.message }); } finally { setVerifying(false); }
    }, [from, to, date, tripType, returnDate, passengers, showMarkup, markup, navigation]);

    if (loading || verifying) return <InspirationLoader />;

    return (
        <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
            <StatusBar style="light" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header Section */}
                <View style={{ backgroundColor: '#1D4171' }} className="pt-6 pb-6 px-5 shadow-2xl relative overflow-hidden border-b border-[#122a4a]">
                    <View className="flex-row items-center justify-between mb-6">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="w-11 h-11 bg-white/10 rounded-2xl items-center justify-center border border-white/20 active:opacity-80">
                            <Ionicons name="chevron-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <View className="items-center flex-1 px-4">
                            <Text className="text-white text-xl font-black" numberOfLines={1}>{from} ⇄ {to}</Text>
                            <Text className="text-white/60 text-[10px] font-bold uppercase mt-0.5 tracking-widest">{date} • {filteredFlights.length} Flights</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowFilterModal(true)} className="w-11 h-11 bg-[#F07E21] rounded-2xl items-center justify-center shadow-lg shadow-orange-500/30 border-b-4 border-[#D96B18] active:scale-95">
                            <Ionicons name="filter" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Quick Sort Tabs */}
                    <View className="flex-row gap-3">
                        {[['priceLow', 'Cheapest'], ['fastest', 'Fastest']].map(([key, label]) => (
                            <TouchableOpacity key={key} onPress={() => setSortBy(key)} className={`flex-1 py-3.5 rounded-2xl items-center border ${sortBy === key ? 'bg-[#F07E21] border-[#D96B18] border-b-4 shadow-lg shadow-orange-500/30' : 'bg-white/10 border-white/20'}`}>
                                <Text className={`text-[11px] font-black uppercase tracking-wider ${sortBy === key ? 'text-white' : 'text-white/60'}`}>{label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Filter & Markup Bar */}
                <View className="px-5 py-3 border-b border-gray-200 bg-white flex-row justify-between items-center shadow-sm mb-4">
                    <View className="flex-row items-center">
                        <TouchableOpacity 
                            onPress={() => setShowMarkup(!showMarkup)} 
                            className={`w-12 h-10 items-center justify-center rounded-xl border border-b-4 ${showMarkup ? 'bg-[#F07E21] border-[#D96B18] shadow-md shadow-orange-500/20' : 'bg-slate-50 border-slate-200 shadow-sm'}`}
                        >
                            <Ionicons name={showMarkup ? "eye" : "eye-off"} size={18} color={showMarkup ? "#fff" : "#64748b"} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={() => { setTempMarkup(markup); setShowMarkupModal(true); }} 
                            className="ml-3 w-10 h-10 bg-blue-50 rounded-xl items-center justify-center border border-blue-200 border-b-4 shadow-sm"
                        >
                            <Ionicons name="pencil" size={14} color="#1D4171" />
                        </TouchableOpacity>
                    </View>
                    {(selectedDepSlots.length > 0 || selectedAirlines.length > 0 || activeFilter !== 'All' || selectedRefundables.length > 0 || maxDuration !== 1440) && (
                        <TouchableOpacity onPress={() => { setSelectedDepSlots([]); setSelectedArrSlots([]); setSelectedAirlines([]); setSelectedRefundables([]); setFlightNoQuery(''); setMaxDuration(1440); setActiveFilter('All'); }} className="bg-orange-50 px-3.5 py-2 rounded-xl border border-orange-200 border-b-2 active:opacity-80 shadow-sm">
                            <Text className="text-[#F07E21] text-[10px] font-black uppercase tracking-wider">Clear Filters</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Results List */}
                <FlatList
                    data={filteredFlights}
                    renderItem={({ item }) => {
                        if (!item) return null;
                        return (
                            <FlightCard
                                item={item} from={from} to={to} showMarkup={showMarkup} markup={markup}
                                onBook={fare => handleBook(fare, item)} onViewRules={handleViewRules} onViewDetails={it => { setSelectedFlight(it); setShowDetailsModal(true); }}
                                t={t} isCheapest={item.price === cheapestPrice} isFastest={parseDurationToMinutes(item.duration) === fastestMins && fastestMins > 0}
                                screenWidth={width}
                            />
                        );
                    }}
                    keyExtractor={(it, idx) => String(it.flightID || it.id || idx)}
                    contentContainerStyle={{ paddingVertical: 4, paddingBottom: 100 }}
                    ListEmptyComponent={<View className="py-20 items-center"><Text className="text-5xl mb-4">✈️</Text><Text className="font-black text-slate-400 uppercase text-xs tracking-widest">No flights matching your filters</Text></View>}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>

            {/* ── Advanced Filter Modal ── */}
            <Modal visible={showFilterModal} animationType="slide" transparent>
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-[2.5rem] p-6 h-[88%] shadow-2xl border-t border-slate-100">
                        <View className="flex-row items-center justify-between border-b border-gray-100 pb-5 mb-5">
                            <Text className="text-xl font-black text-[#1D4171] uppercase tracking-wider">Advanced Filters</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)} className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center border border-slate-200"><Ionicons name="close" size={20} color="#000" /></TouchableOpacity>
                        </View>
                        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                            {/* Stops Section */}
                            <Text className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Stops Visibility</Text>
                            <View className="flex-row flex-wrap gap-2 mb-6">
                                {['All', 'Non-Stop', '1+ Stop'].map(f => (
                                    <TouchableOpacity key={f} onPress={() => setActiveFilter(f)} className={`px-5 py-3 rounded-xl border border-b-4 ${activeFilter === f ? 'bg-[#F07E21] border-[#D96B18] shadow-md shadow-orange-500/20' : 'bg-slate-50 border-slate-200 shadow-sm'}`}><Text className={`text-xs font-black uppercase tracking-wider ${activeFilter === f ? 'text-white' : 'text-slate-600'}`}>{f}</Text></TouchableOpacity>
                                ))}
                            </View>

                            {/* Departure Time Slots */}
                            <Text className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Departure Window</Text>
                            <View className="flex-row flex-wrap gap-2 mb-6">
                                {['Early Morning', 'Morning', 'Afternoon', 'Evening'].map(slot => (
                                    <TouchableOpacity key={slot} onPress={() => setSelectedDepSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot])} 
                                        className={`px-4 py-3 rounded-xl border border-b-4 ${selectedDepSlots.includes(slot) ? 'bg-[#1D4171] border-[#122a4a] shadow-md shadow-blue-900/20' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                                        <Text className={`text-xs font-black uppercase tracking-wider ${selectedDepSlots.includes(slot) ? 'text-white' : 'text-slate-600'}`}>{slot}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Arrival Time Slots */}
                            <Text className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Arrival Window</Text>
                            <View className="flex-row flex-wrap gap-2 mb-6">
                                {['Early Morning', 'Morning', 'Afternoon', 'Evening'].map(slot => (
                                    <TouchableOpacity key={slot} onPress={() => setSelectedArrSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot])} 
                                        className={`px-4 py-3 rounded-xl border border-b-4 ${selectedArrSlots.includes(slot) ? 'bg-[#1D4171] border-[#122a4a] shadow-md shadow-blue-900/20' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                                        <Text className={`text-xs font-black uppercase tracking-wider ${selectedArrSlots.includes(slot) ? 'text-white' : 'text-slate-600'}`}>{slot}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Airline Explorer */}
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Airline Explorer</Text>
                                <TouchableOpacity onPress={() => setSelectedAirlines([])} className="py-1"><Text className="text-[#F07E21] text-[10px] font-black tracking-wider uppercase">Reset</Text></TouchableOpacity>
                            </View>
                            <TextInput placeholder="Search airline..." value={airlineSearch} onChangeText={setAirlineSearch} placeholderTextColor="#94a3b8" className="bg-slate-50 px-5 py-3.5 rounded-xl mb-4 border border-slate-200 border-b-4 font-bold text-sm text-slate-900 shadow-sm" />
                            <View className="space-y-2 mb-6">
                                {availableAirlines.filter(a => a.name.toLowerCase().includes(airlineSearch.toLowerCase())).map(a => (
                                    <TouchableOpacity key={a.name} onPress={() => setSelectedAirlines(prev => prev.includes(a.name) ? prev.filter(n => n !== a.name) : [...prev, a.name])} 
                                        className="flex-row items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 border-b-2 border-slate-200 mb-2 shadow-sm active:opacity-80">
                                        <View className="flex-row items-center">
                                            <Image source={{ uri: `https://images.kiwi.com/airlines/64/${a.iata || 'AI'}.png` }} style={{ width: 24, height: 24 }} />
                                            <Text className={`ml-3 font-black text-sm ${selectedAirlines.includes(a.name) ? 'text-[#F07E21]' : 'text-slate-800'}`}>{a.name}</Text>
                                        </View>
                                        <View className={`w-6 h-6 rounded-lg border items-center justify-center ${selectedAirlines.includes(a.name) ? 'bg-[#F07E21] border-[#D96B18]' : 'border-slate-300 bg-white'}`}>{selectedAirlines.includes(a.name) && <Ionicons name="checkmark" size={14} color="#fff" />}</View>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Journey Duration */}
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Journey Duration</Text>
                                <Text className="text-[#F07E21] text-[10px] font-black uppercase tracking-wider">Under {Math.floor(maxDuration/60)}h {maxDuration%60}m</Text>
                            </View>
                            <View className="flex-row flex-wrap gap-2 mb-6">
                                {[360, 720, 1080, 1440].map(mins => (
                                    <TouchableOpacity key={mins} onPress={() => setMaxDuration(mins)} 
                                        className={`px-4 py-3 rounded-xl border border-b-4 ${maxDuration === mins ? 'bg-[#1D4171] border-[#122a4a] shadow-md shadow-blue-900/20' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                                        <Text className={`text-xs font-black uppercase tracking-wider ${maxDuration === mins ? 'text-white' : 'text-slate-600'}`}>{mins === 1440 ? 'Any Duration' : `Under ${mins/60}h`}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Refundability */}
                            <Text className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Refundability</Text>
                            <View className="flex-row gap-3 mb-8">
                                {['Refundable', 'Non-Refundable'].map(type => (
                                    <TouchableOpacity key={type} onPress={() => setSelectedRefundables(prev => prev.includes(type) ? prev.filter(t=>t!==type) : [...prev, type])} 
                                        className={`flex-1 py-3.5 rounded-xl border border-b-4 items-center ${selectedRefundables.includes(type) ? 'bg-[#1D4171] border-[#122a4a] shadow-md shadow-blue-900/20' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                                        <Text className={`text-xs font-black uppercase tracking-wider ${selectedRefundables.includes(type) ? 'text-white' : 'text-slate-600'}`}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View className="h-6" />
                        </ScrollView>
                        <View className="pt-4 border-t border-gray-100">
                            <TouchableOpacity onPress={() => setShowFilterModal(false)} className="bg-[#F07E21] py-5 rounded-2xl items-center shadow-xl shadow-orange-500/30 border-b-4 border-[#D96B18] active:scale-[0.98]">
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
                            <TouchableOpacity onPress={() => setShowRulesModal(false)} className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center border border-slate-200"><Ionicons name="close" size={20} color="#000" /></TouchableOpacity>
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

                                <TouchableOpacity onPress={() => Toast.show({ type: 'info', text1: 'Full Rules', text2: rules?.raw || 'Not available', visibilityTime: 10000 })} className="py-3 mb-6 bg-slate-100 rounded-xl border border-slate-200 border-b-2 active:opacity-80 shadow-sm"><Text className="text-[#1D4171] font-black text-[10px] text-center uppercase tracking-widest">View Detailed GDS Text</Text></TouchableOpacity>
                            </ScrollView>
                        )}
                        <TouchableOpacity onPress={() => setShowRulesModal(false)} className="bg-[#1D4171] py-5 rounded-2xl mt-4 shadow-xl shadow-blue-900/30 border-b-4 border-[#122a4a] active:scale-[0.98]"><Text className="text-center text-white font-black uppercase text-xs tracking-widest">OK, Understood</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Markup Editor Modal ── */}
            <Modal visible={showMarkupModal} transparent animationType="slide">
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-[2.5rem] p-6 shadow-2xl border-t border-slate-100">
                        <View className="w-12 h-1 bg-slate-200 rounded-full self-center mb-6" />
                        <Text className="font-black text-xl mb-6 text-center text-[#1D4171] uppercase tracking-wider">Agent Markup</Text>
                        <TextInput keyboardType="numeric" autoFocus value={tempMarkup} onChangeText={setTempMarkup} className="bg-slate-50 px-8 py-6 rounded-2xl text-center text-4xl font-black text-[#F07E21] border border-slate-200 border-b-4 mb-8 shadow-sm" />
                        <View className="flex-row gap-4 mb-4">
                            <TouchableOpacity onPress={()=>setShowMarkupModal(false)} className="flex-1 py-5 rounded-xl bg-slate-100 items-center border border-slate-200 border-b-4 active:opacity-80 shadow-sm">
                                <Text className="font-black text-slate-500 uppercase text-xs tracking-widest">Discard</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={()=>{setMarkup(tempMarkup); setShowMarkupModal(false);}} className="flex-1 py-5 rounded-xl bg-[#F07E21] items-center shadow-lg shadow-orange-500/30 border-b-4 border-[#D96B18] active:scale-95">
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
                                                <Text className="text-[10px] font-bold text-slate-500 uppercase">{selectedFlight.from || from}</Text>
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
                                                <Text className="text-[10px] font-bold text-slate-500 uppercase">{selectedFlight.to || to}</Text>
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
                                            <Text className="text-2xl font-black text-[#1D4171]">₹{((selectedFlight.price || 0) + (showMarkup ? Number(markup) : 0)).toLocaleString()}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => { setShowDetailsModal(false); handleBook(selectedFlight); }} className="bg-[#F07E21] px-6 py-3 rounded-xl shadow-md shadow-orange-500/30 border-b-4 border-[#D96B18] active:scale-95">
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
        </View>
    );
}
