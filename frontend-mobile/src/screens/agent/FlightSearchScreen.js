import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, useWindowDimensions } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { bookingService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';
import { Ionicons } from '@expo/vector-icons';

const POPULAR_AIRPORTS = [
    { code: 'DEL', city: 'New Delhi', label: 'Indira Gandhi Intl (DEL)' },
    { code: 'BOM', city: 'Mumbai', label: 'Chhatrapati Shivaji (BOM)' },
    { code: 'DXB', city: 'Dubai', label: 'Dubai Intl (DXB)' },
    { code: 'BLR', city: 'Bengaluru', label: 'Kempegowda Intl (BLR)' },
    { code: 'CCU', city: 'Kolkata', label: 'Netaji Subhash (CCU)' }
];

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
                                    onPress={() => { onSelect(date.toISOString().split('T')[0]); onClose(); }}
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

export default function FlightSearchScreen({ navigation }) {
    const t = useThemeColors();
    const { width } = useWindowDimensions();

    const [tripType, setTripType] = useState('oneWay');
    const [from, setFrom] = useState({});
    const [to, setTo] = useState({});
    const [date, setDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [pax, setPax] = useState({ adt: 1, chd: 0, inf: 0 });
    const [multiCitySectors, setMultiCitySectors] = useState([
        { from: { code: 'DEL', city: 'New Delhi', label: 'Indira Gandhi Intl' }, to: { code: 'BOM', city: 'Mumbai', label: 'Chhatrapati Shivaji' }, date: new Date().toISOString().split('T')[0] },
        { from: { code: 'BOM', city: 'Mumbai', label: 'Chhatrapati Shivaji' }, to: { code: 'BLR', city: 'Bengaluru', label: 'Kempegowda Intl' }, date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] }
    ]);

    const [showSelection, setShowSelection] = useState(false);
    const [activeType, setActiveType] = useState('FROM');
    const [search, setSearch] = useState('');
    const [results, setResults] = useState(POPULAR_AIRPORTS);
    const [searching, setSearching] = useState(false);
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [calendarTarget, setCalendarTarget] = useState('OUTBOUND');
    const [showPaxModal, setShowPaxModal] = useState(false);

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

    const totalPax = pax.adt + pax.chd + pax.inf;

    const handleSearch = () => {
        if (!from?.code || !to?.code || !date) {
            Toast.show({ type: 'info', text1: 'Missing Details', text2: 'Please select origin, destination, and travel date.' });
            return;
        }
        
        const TRIP_TYPE_MAP = { oneWay: 0, roundTrip: 1, multiCity: 2 };
        const tripTypeInt = TRIP_TYPE_MAP[tripType] ?? 0;

        const searchPayload = {
            passengers: pax || { adt: 1, chd: 0, inf: 0 },
            tripType: tripTypeInt
        };

        if (tripType === 'multiCity') {
            searchPayload.sectors = (multiCitySectors || []).map(s => ({ from: s?.from?.code || '', to: s?.to?.code || '', date: s?.date || '' }));
        } else {
            searchPayload.from = from?.code || '';
            searchPayload.to = to?.code || '';
            searchPayload.date = date || '';
            if (tripTypeInt === 1) searchPayload.returnDate = returnDate || '';
        }

        navigation.navigate('FlightResults', searchPayload);

        // Reset fields to blank after searching as requested by user
        setFrom({});
        setTo({});
        setDate('');
        setReturnDate('');
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    
                    {/* Header */}
                    <View className="px-5 pt-5 pb-3 flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <TouchableOpacity 
                                onPress={() => navigation.goBack()}
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

                    <View className="p-5 pt-2">
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
                                        <Text className="text-xs font-bold text-slate-400 ml-2">• Economy</Text>
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

                        {/* Recent Searches / Help 3D Box */}
                        <View className="bg-white rounded-2xl p-4 border border-slate-100 border-b-4 border-slate-200 shadow-sm flex-row items-center justify-between">
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
                    </View>
                    
                    <View className="h-10" />
                </ScrollView>

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
                                                else setTo(airport);
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

                {/* Passengers Modal */}
                <Modal visible={showPaxModal} transparent animationType="slide">
                    <View className="flex-1 bg-black/60 justify-end">
                        <View className="bg-white rounded-t-[2.5rem] p-6 shadow-2xl border-t border-slate-100">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-black text-slate-900 uppercase tracking-wider">Travelers Selection</Text>
                                <TouchableOpacity onPress={() => setShowPaxModal(false)} className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center border border-slate-200">
                                    <Ionicons name="close" size={20} color="#000" />
                                </TouchableOpacity>
                            </View>
                            <PaxCounter label="Adults" sub="12+ Years" value={pax.adt} min={1} onInc={() => setPax({...pax, adt: pax.adt+1})} onDec={() => setPax({...pax, adt: pax.adt-1})} />
                            <PaxCounter label="Children" sub="2-12 Years" value={pax.chd} onInc={() => setPax({...pax, chd: pax.chd+1})} onDec={() => setPax({...pax, chd: pax.chd-1})} />
                            <PaxCounter label="Infants" sub="Under 2 Years" value={pax.inf} onInc={() => setPax({...pax, inf: pax.inf+1})} onDec={() => setPax({...pax, inf: pax.inf-1})} />
                            
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

                <CalendarPicker 
                    visible={calendarVisible} 
                    onClose={() => setCalendarVisible(false)} 
                    onSelect={(selected) => {
                        if (calendarTarget === 'INBOUND') setReturnDate(selected);
                        else setDate(selected);
                    }} 
                    initialDate={calendarTarget === 'INBOUND' ? (returnDate || new Date().toISOString().split('T')[0]) : (date || new Date().toISOString().split('T')[0])} 
                    t={t} 
                />

            </SafeAreaView>
        </View>
    );
}

