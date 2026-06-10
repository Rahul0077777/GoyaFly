import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, Modal, Alert, StyleSheet, useWindowDimensions, Platform, Image } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';
import { fixedDepartureService, bookingService, BASE_URL } from '../../services/api';

const POPULAR_AIRPORTS = [
    { code: 'DEL', city: 'Delhi', label: 'Indira Gandhi Intl (DEL)' },
    { code: 'BOM', city: 'Mumbai', label: 'Chhatrapati Shivaji (BOM)' },
    { code: 'BLR', city: 'Bangalore', label: 'Kempegowda Intl (BLR)' },
    { code: 'HYD', city: 'Hyderabad', label: 'Rajiv Gandhi Intl (HYD)' },
    { code: 'CCU', city: 'Kolkata', label: 'Netaji Subhash (CCU)' },
    { code: 'MAA', city: 'Chennai', label: 'Chennai Intl (MAA)' },
    { code: 'DXB', city: 'Dubai', label: 'Dubai Intl (DXB)' }
];

const QUICK_ROUTES_DATA = {
    'Darbhanga': { code: 'DBR', outbound: [{city: 'Mumbai', code: 'BOM'}, {city: 'Delhi', code: 'DEL'}], inbound: [{city: 'Mumbai', code: 'BOM'}, {city: 'Delhi', code: 'DEL'}] },
    'Ahmedabad': { code: 'AMD', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Goa', code: 'GOI'}, {city: 'Bangalore', code: 'BLR'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Goa', code: 'GOI'}, {city: 'Bangalore', code: 'BLR'}] },
    'Delhi': { code: 'DEL', outbound: [{city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Goa', code: 'GOI'}, {city: 'Darbhanga', code: 'DBR'}, {city: 'Dubai', code: 'DXB'}], inbound: [{city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Goa', code: 'GOI'}, {city: 'Darbhanga', code: 'DBR'}, {city: 'Dubai', code: 'DXB'}] },
    'Mumbai': { code: 'BOM', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Goa', code: 'GOI'}, {city: 'Darbhanga', code: 'DBR'}, {city: 'Chennai', code: 'MAA'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Goa', code: 'GOI'}, {city: 'Darbhanga', code: 'DBR'}, {city: 'Chennai', code: 'MAA'}] },
    'Bangalore': { code: 'BLR', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Kolkata', code: 'CCU'}, {city: 'Pune', code: 'PNQ'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Kolkata', code: 'CCU'}, {city: 'Pune', code: 'PNQ'}] },
    'Chennai': { code: 'MAA', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Hyderabad', code: 'HYD'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Hyderabad', code: 'HYD'}] },
    'Kolkata': { code: 'CCU', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Bagdogra', code: 'IXB'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Bagdogra', code: 'IXB'}] },
    'Hyderabad': { code: 'HYD', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Chennai', code: 'MAA'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Chennai', code: 'MAA'}] },
    'Pune': { code: 'PNQ', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Nagpur', code: 'NAG'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Nagpur', code: 'NAG'}] },
    'Goa': { code: 'GOI', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Ahmedabad', code: 'AMD'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Ahmedabad', code: 'AMD'}] },
    'Jaipur': { code: 'JAI', outbound: [{city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Hyderabad', code: 'HYD'}], inbound: [{city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Hyderabad', code: 'HYD'}] },
    'Lucknow': { code: 'LKO', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}] },
    'Patna': { code: 'PAT', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}] },
    'Guwahati': { code: 'GAU', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Kolkata', code: 'CCU'}, {city: 'Bangalore', code: 'BLR'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Kolkata', code: 'CCU'}, {city: 'Bangalore', code: 'BLR'}] },
    'Bhubaneswar': { code: 'BBI', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}] },
    'Amritsar': { code: 'ATQ', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Dubai', code: 'DXB'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Dubai', code: 'DXB'}] },
    'Chandigarh': { code: 'IXC', outbound: [{city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Hyderabad', code: 'HYD'}], inbound: [{city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Hyderabad', code: 'HYD'}] },
    'Varanasi': { code: 'VNS', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}] },
    'Kochi': { code: 'COK', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Dubai', code: 'DXB'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Dubai', code: 'DXB'}] },
    'Trivandrum': { code: 'TRV', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Dubai', code: 'DXB'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Dubai', code: 'DXB'}] },
    'Kozhikode': { code: 'CCJ', outbound: [{city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Dubai', code: 'DXB'}], inbound: [{city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Dubai', code: 'DXB'}] },
    'Coimbatore': { code: 'CJB', outbound: [{city: 'Chennai', code: 'MAA'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Mumbai', code: 'BOM'}], inbound: [{city: 'Chennai', code: 'MAA'}, {city: 'Bangalore', code: 'BLR'}, {city: 'Mumbai', code: 'BOM'}] },
    'Bagdogra': { code: 'IXB', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Kolkata', code: 'CCU'}, {city: 'Bangalore', code: 'BLR'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Kolkata', code: 'CCU'}, {city: 'Bangalore', code: 'BLR'}] },
    'Srinagar': { code: 'SXR', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Chandigarh', code: 'IXC'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Chandigarh', code: 'IXC'}] },
    'Indore': { code: 'IDR', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}] },
    'Nagpur': { code: 'NAG', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Pune', code: 'PNQ'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Pune', code: 'PNQ'}] },
    'Vadodara': { code: 'BDQ', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}] },
    'Dubai': { code: 'DXB', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Kochi', code: 'COK'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Kochi', code: 'COK'}] },
    'Dammam': { code: 'DMM', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Kochi', code: 'COK'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Kochi', code: 'COK'}] },
    'Fujairah': { code: 'FJR', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Kochi', code: 'COK'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Kochi', code: 'COK'}] },
    'Ayodhya': { code: 'AYJ', outbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}], inbound: [{city: 'Delhi', code: 'DEL'}, {city: 'Mumbai', code: 'BOM'}, {city: 'Bangalore', code: 'BLR'}] },
    'Aizawl': { code: 'AJL', outbound: [{city: 'Kolkata', code: 'CCU'}, {city: 'Delhi', code: 'DEL'}, {city: 'Guwahati', code: 'GAU'}], inbound: [{city: 'Kolkata', code: 'CCU'}, {city: 'Delhi', code: 'DEL'}, {city: 'Guwahati', code: 'GAU'}] }
};

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

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
};

const formatDateWithDay = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        const dayNum = d.getDate();
        const month = d.toLocaleString('default', { month: 'short' });
        const weekday = d.toLocaleString('default', { weekday: 'short' });
        return `${dayNum} ${month} - ${weekday}`;
    } catch(e) {
        return dateStr;
    }
};

export default function FixedDepartureSearchScreen({ navigation }) {
    const t = useThemeColors();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [date, setDate] = useState('');
    const [pax, setPax] = useState({ adults: 1, children: 0, infants: 0 });
    const [showPaxModal, setShowPaxModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [flights, setFlights] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [availableDates, setAvailableDates] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Quick route dropdown city selection
    const [quickRouteCity, setQuickRouteCity] = useState('Darbhanga');
    const [showQuickCityModal, setShowQuickCityModal] = useState(false);

    // City Autocomplete States
    const [showCityModal, setShowCityModal] = useState(false);
    const [cityField, setCityField] = useState(null); // 'from' or 'to'
    const [citySearchQuery, setCitySearchQuery] = useState('');
    const [airportSearchResults, setAirportSearchResults] = useState(POPULAR_AIRPORTS);
    const [searchingAirports, setSearchingAirports] = useState(false);

    // Fetch dates when route selected
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

    // Handle City Autocomplete Search
    useEffect(() => {
        if (!citySearchQuery) {
            setAirportSearchResults(POPULAR_AIRPORTS);
            return;
        }

        const localMatch = POPULAR_AIRPORTS.filter(a => 
            a.code.toLowerCase().includes(citySearchQuery.toLowerCase()) || 
            a.city.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
            a.label.toLowerCase().includes(citySearchQuery.toLowerCase())
        );

        if (localMatch.length > 0) {
            setAirportSearchResults(localMatch);
        } else if (citySearchQuery.length < 2) {
            setAirportSearchResults(POPULAR_AIRPORTS);
        } else {
            setAirportSearchResults([]);
        }

        if (citySearchQuery.length < 2) return;

        const timeout = setTimeout(async () => {
            setSearchingAirports(true);
            try {
                const res = await bookingService.searchAirports(citySearchQuery);
                if (res.success) {
                    setAirportSearchResults(res.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setSearchingAirports(false);
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [citySearchQuery]);

    // Marked Dates for Calendar
    const markedDates = useMemo(() => {
        const marked = {};
        if (from && to && availableDates.length > 0) {
            availableDates.forEach(dStr => {
                marked[dStr] = {
                    selected: dStr === date,
                    selectedColor: '#F07E21',
                    marked: true,
                    dotColor: '#1D4171',
                    disableTouchEvent: false
                };
            });
            // Disable all other days in the calendar range for fixed departure matches
            let curr = new Date();
            for (let i = 0; i < 180; i++) {
                const dStr = curr.toISOString().split('T')[0];
                if (!availableDates.includes(dStr)) {
                    marked[dStr] = { disabled: true, disableTouchEvent: true };
                }
                curr.setDate(curr.getDate() + 1);
            }
        }
        return marked;
    }, [from, to, availableDates, date]);

    const handleDayPress = (day) => {
        if (availableDates.length > 0 && !availableDates.includes(day.dateString)) {
            Alert.alert('No Flights', 'No fixed departure flights available on this date.');
        } else {
            setDate(day.dateString);
            setShowDatePicker(false);
        }
    };

    const handleSearch = async () => {
        if (!from || !to || !date) {
            Alert.alert('Required', 'Please select From City, To City, and a Departure Date first.');
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
            console.error('Search failed', error);
            Alert.alert('Search Error', 'Failed to retrieve inventory.');
        } finally {
            setLoading(false);
        }
    };

    const handleDateNav = (direction) => {
        if (!from || !to || !date) {
            Alert.alert('Required', 'Please select From City, To City, and a Departure Date first.');
            return;
        }
        const d = new Date(date);
        d.setDate(d.getDate() + direction);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const newDateStr = `${year}-${month}-${day}`;
        
        setDate(newDateStr);
        setLoading(true);
        fixedDepartureService.searchFlights(from, to, newDateStr).then(res => {
            if (res.success) {
                setFlights(res.data);
                setHasSearched(true);
            }
        }).catch(err => console.error(err)).finally(() => setLoading(false));
    };

    const handleBook = (flight) => {
        const reqPax = pax.adults + pax.children;
        if (reqPax > flight.availableSeats) {
            Alert.alert('No Seat Available', `Only ${flight.availableSeats} seats left on this flight.`);
        } else {
            navigation.navigate('FixedDepartureBooking', { flight, pax });
        }
    };

    const openCityPicker = (field) => {
        setCityField(field);
        setCitySearchQuery('');
        setAirportSearchResults(POPULAR_AIRPORTS);
        setShowCityModal(true);
    };

    const selectCity = (city) => {
        if (cityField === 'from') setFrom(city);
        else if (cityField === 'to') setTo(city);
        setShowCityModal(false);
    };

    const selectedRouteData = QUICK_ROUTES_DATA[quickRouteCity];

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style={t.isDark ? 'light' : 'dark'} />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View style={{ borderBottomColor: t.cardBorder, backgroundColor: t.card }} className="px-6 py-4 flex-row items-center justify-between border-b">
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: t.isDark ? '#1e293b' : '#f8fafc', borderColor: t.cardBorder }} className="w-10 h-10 items-center justify-center rounded-2xl border">
                        <Ionicons name="chevron-back" size={20} color={t.text} />
                    </TouchableOpacity>
                    <Text style={{ color: t.text }} className="text-lg font-black">Fixed Departure Flights</Text>
                    <View className="w-10" />
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    {/* Search Card mimicking Web */}
                    <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="m-5 rounded-3xl shadow-lg p-6 border">
                        {/* FROM Field */}
                        <TouchableOpacity onPress={() => openCityPicker('from')} style={{ borderBottomColor: t.isDark ? '#334155' : '#e2e8f0' }} className="mb-5 border-b pb-3">
                            <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="font-bold text-xs mb-1 uppercase">FROM</Text>
                            <View className="flex-row items-center justify-between">
                                <Text style={{ color: from ? t.text : (t.isDark ? '#475569' : '#9ca3af') }} className="flex-1 font-black text-xl">{from || 'Select Departure City'}</Text>
                                <Ionicons name="caret-down" size={16} color="#94A3B8" />
                            </View>
                        </TouchableOpacity>

                        {/* TO Field */}
                        <TouchableOpacity onPress={() => openCityPicker('to')} style={{ borderBottomColor: t.isDark ? '#334155' : '#e2e8f0' }} className="mb-5 border-b pb-3">
                            <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="font-bold text-xs mb-1 uppercase">TO</Text>
                            <View className="flex-row items-center justify-between">
                                <Text style={{ color: to ? t.text : (t.isDark ? '#475569' : '#9ca3af') }} className="flex-1 font-black text-xl">{to || 'Select Destination City'}</Text>
                                <Ionicons name="caret-down" size={16} color="#94A3B8" />
                            </View>
                        </TouchableOpacity>

                        {/* DATE & TRAVELERS Row */}
                        <View className="flex-row gap-5 mb-6">
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ borderBottomColor: t.isDark ? '#334155' : '#e2e8f0' }} className="flex-[3] border-b pb-3">
                                <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="font-bold text-xs mb-1 uppercase">TRAVEL DATE</Text>
                                <View className="flex-row items-center justify-between">
                                    <Text style={{ color: date ? t.text : (t.isDark ? '#475569' : '#9ca3af') }} className="flex-1 font-black text-base">{formatDisplayDate(date) || 'Select Date'}</Text>
                                    <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setShowPaxModal(true)} style={{ borderBottomColor: t.isDark ? '#334155' : '#e2e8f0' }} className="flex-[2] border-b pb-3">
                                <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="font-bold text-xs mb-1 uppercase">TRAVELERS</Text>
                                <View className="flex-row items-center justify-between">
                                    <Text style={{ color: t.text }} className="flex-1 font-black text-base">
                                        {pax.adults + pax.children + pax.infants} Pax
                                    </Text>
                                    <Ionicons name="people-outline" size={18} color="#94A3B8" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Available Dates Horizontal Scroll */}
                        {availableDates.length > 0 && (
                            <View style={{ borderTopColor: t.isDark ? '#334155' : '#f1f5f9' }} className="mb-5 border-t pt-4">
                                <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="font-bold text-[10px] mb-3.5 uppercase tracking-widest">Available Departure Dates:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                    {availableDates.map(d => (
                                        <TouchableOpacity 
                                            key={d}
                                            onPress={() => setDate(d)}
                                            style={{ backgroundColor: date === d ? '#F07E21' : (t.isDark ? '#1e293b' : '#f1f5f9') }}
                                            className="px-4.5 py-2.5 rounded-xl mr-2.5 shadow-xs"
                                        >
                                            <Text style={{ color: date === d ? 'white' : (t.isDark ? '#cbd5e1' : '#1D4171') }} className="font-black text-xs uppercase">
                                                {formatDisplayDate(d)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Search Button */}
                        <TouchableOpacity 
                            onPress={handleSearch}
                            style={{ backgroundColor: '#F07E21' }}
                            className="py-4.5 rounded-2xl items-center flex-row justify-center shadow-lg active:scale-98 transition-all"
                        >
                            <Text className="text-white font-black text-base mr-2 uppercase tracking-widest">SEARCH FLIGHTS</Text>
                            <Ionicons name="search" size={18} color="white" />
                        </TouchableOpacity>

                        {/* Date Navigation Footer */}
                        {date !== '' && (
                            <View style={{ borderTopColor: t.isDark ? '#334155' : '#f1f5f9' }} className="flex-row items-center justify-between border-t pt-4 mt-3">
                                <TouchableOpacity onPress={() => handleDateNav(-1)}>
                                    <Text className="font-bold text-xs text-[#F07E21] uppercase tracking-wider">« PREV DAY</Text>
                                </TouchableOpacity>
                                <Text className="font-black text-xs text-[#F07E21] uppercase tracking-widest">{formatDisplayDate(date).toUpperCase()}</Text>
                                <TouchableOpacity onPress={() => handleDateNav(1)}>
                                    <Text className="font-bold text-xs text-[#F07E21] uppercase tracking-wider">NEXT DAY »</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Popular Routes Section */}
                    <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="mx-5 mb-5 rounded-3xl shadow-sm p-6 border">
                        <View className="flex-row items-center justify-between border-b pb-3 mb-4" style={{ borderBottomColor: t.isDark ? '#334155' : '#f1f5f9' }}>
                            <Text style={{ color: t.isDark ? '#f1f5f9' : '#1D4171' }} className="text-base font-black">Popular routes from:</Text>
                            <TouchableOpacity 
                                onPress={() => setShowQuickCityModal(true)} 
                                style={{ backgroundColor: t.isDark ? '#1e293b' : '#eff6ff' }} 
                                className="flex-row items-center px-3 py-1.5 rounded-xl"
                            >
                                <Text className="font-black text-xs text-[#0B4EE3] mr-1.5">{quickRouteCity}</Text>
                                <Ionicons name="chevron-down" size={14} color="#0B4EE3" />
                            </TouchableOpacity>
                        </View>

                        {selectedRouteData && (
                            <View className="space-y-4">
                                <View>
                                    <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="text-[10px] font-black uppercase tracking-widest mb-2">Outbound Departures</Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        {selectedRouteData.outbound.map(route => (
                                            <TouchableOpacity 
                                                key={route.code}
                                                onPress={() => {
                                                    setFrom(quickRouteCity);
                                                    setTo(route.city);
                                                }}
                                                style={{ backgroundColor: t.isDark ? '#1e293b' : '#f8fafc', borderColor: t.cardBorder }} 
                                                className="px-3 py-2 rounded-xl border flex-row items-center"
                                            >
                                                <Text style={{ color: t.text }} className="text-xs font-bold mr-1.5">{route.city}</Text>
                                                <Text className="text-[10px] font-black text-[#F07E21]">{route.code}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View className="mt-2">
                                    <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="text-[10px] font-black uppercase tracking-widest mb-2">Inbound Arrivals</Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        {selectedRouteData.inbound.map(route => (
                                            <TouchableOpacity 
                                                key={route.code}
                                                onPress={() => {
                                                    setFrom(route.city);
                                                    setTo(quickRouteCity);
                                                }}
                                                style={{ backgroundColor: t.isDark ? '#1e293b' : '#f8fafc', borderColor: t.cardBorder }} 
                                                className="px-3 py-2 rounded-xl border flex-row items-center"
                                            >
                                                <Text style={{ color: t.text }} className="text-xs font-bold mr-1.5">{route.city}</Text>
                                                <Text className="text-[10px] font-black text-[#F07E21]">{route.code}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Results List */}
                    <View className="px-5">
                        {loading ? (
                            <View className="py-20 items-center justify-center">
                                <ActivityIndicator size="large" color={t.primary} />
                                <Text style={{ color: t.textMuted }} className="mt-4 font-black uppercase text-[10px] tracking-widest">Scanning inventory...</Text>
                            </View>
                        ) : flights.length > 0 ? (
                            flights.map(flight => {
                                const reqPax = pax.adults + pax.children;
                                const hasEnoughSeats = reqPax <= flight.availableSeats;
                                const tourCode = flight.tourCode || 'AQP' + (flight.flightNumber?.replace(/\D/g, '') || '65252') + '50';
                                return (
                                    <TouchableOpacity 
                                        key={flight._id}
                                        onPress={() => handleBook(flight)}
                                        style={{ backgroundColor: t.card, borderColor: t.cardBorder }}
                                        className="p-5 rounded-3xl shadow-md border mb-5"
                                    >
                                        {/* Top Row: sector route path */}
                                        <View style={{ borderBottomColor: t.isDark ? '#334155' : '#f1f5f9' }} className="flex-row justify-between items-start mb-4 pb-4 border-b">
                                            <View className="flex-row items-center gap-3">
                                                <View style={{ backgroundColor: t.isDark ? 'rgba(29,65,113,0.3)' : 'rgba(29,65,113,0.1)' }} className="w-12 h-12 rounded-2xl items-center justify-center overflow-hidden">
                                                    {flight.airlineLogo ? (
                                                        <Image source={{ uri: `${BASE_URL}/${flight.airlineLogo}` }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                                                    ) : (
                                                        <Ionicons name="airplane" size={24} color={t.primary} />
                                                    )}
                                                </View>
                                                <View>
                                                    <Text style={{ color: t.text }} className="text-base font-black mb-1 capitalize">✈ {flight.fromCity} → {flight.toCity}</Text>
                                                    <Text style={{ color: t.isDark ? '#60a5fa' : '#48A0D4' }} className="text-xs font-black uppercase tracking-wider">{flight.airlineName}</Text>
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <Text style={{ color: t.textMuted }} className="text-xs font-black mb-1">Non-Stop</Text>
                                                <View style={{ backgroundColor: t.isDark ? '#1e293b' : '#f8fafc', borderColor: t.cardBorder }} className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-xl border">
                                                    <FontAwesome5 name="suitcase" size={10} color="#F07E21" />
                                                    <Text style={{ color: t.text }} className="text-[10px] font-black">7 KG , {flight.isInternational ? '20 KG' : '15 KG'}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Middle Row: departure arrival schedule */}
                                        <View style={{ backgroundColor: t.isDark ? '#1e293b' : '#f8fafc', borderColor: t.cardBorder }} className="flex-row items-center justify-between mb-5 p-3 rounded-2xl border">
                                            <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-xl border">
                                                <Ionicons name="calendar-outline" size={12} color="#1D4171" />
                                                <Text style={{ color: t.isDark ? '#cbd5e1' : '#1D4171' }} className="text-[11px] font-black">{formatDateWithDay(flight.departureDate)}</Text>
                                            </View>
                                            <View style={{ backgroundColor: t.isDark ? 'rgba(72,160,212,0.15)' : '#48A0D4/10', borderColor: 'rgba(72,160,212,0.3)' }} className="px-2.5 py-1.5 rounded-xl border">
                                                <Text style={{ color: '#48A0D4' }} className="text-[11px] font-black tracking-wider">{flight.flightNumber}</Text>
                                            </View>
                                            <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border">
                                                <Text style={{ color: t.text }} className="text-[11px] font-black">{flight.departureTime}</Text>
                                                <View style={{ backgroundColor: '#F07E21' }} className="px-2 py-0.5 rounded-full">
                                                    <Text className="text-white font-black text-[9px]">
                                                        {calculateDuration(flight.departureTime, flight.arrivalTime)}
                                                    </Text>
                                                </View>
                                                <Text style={{ color: t.text }} className="text-[11px] font-black">{flight.arrivalTime}</Text>
                                            </View>
                                        </View>

                                        {/* Bottom Action buttons */}
                                        <View style={{ borderColor: t.isDark ? '#334155' : 'rgba(29,65,113,0.1)' }} className="flex-row items-center rounded-2xl overflow-hidden mb-4 border shadow-sm">
                                            <View style={{ backgroundColor: t.isDark ? '#1e293b' : '#f8fafc', borderRightColor: t.isDark ? '#334155' : 'rgba(29,65,113,0.1)' }} className="flex-1 py-4 items-center justify-center border-r">
                                                <Text style={{ color: t.isDark ? '#cbd5e1' : '#1D4171' }} className="text-[11px] font-black tracking-widest uppercase">CODE {tourCode}</Text>
                                            </View>
                                            <View style={{ backgroundColor: '#F07E21' }} className="flex-1 py-4 items-center justify-center">
                                                <Text className="text-white font-black text-xs tracking-widest uppercase">BOOK (₹{flight.fare})</Text>
                                            </View>
                                        </View>

                                        {/* Footer seats availability */}
                                        <View style={{ borderTopColor: t.isDark ? '#334155' : '#f1f5f9' }} className="flex-row items-center justify-between px-1 pt-2 border-t">
                                            <View className="flex-row items-center gap-2">
                                                {hasEnoughSeats ? (
                                                    <View style={{ backgroundColor: t.isDark ? '#064e3b' : '#dcfce7', borderColor: t.isDark ? '#047857' : '#bbf7d0' }} className="px-3 py-1.5 rounded-xl border flex-row items-center">
                                                        <Text style={{ color: t.isDark ? '#4ade80' : '#16a34a' }} className="font-black text-[10px]">✅ Available</Text>
                                                    </View>
                                                ) : (
                                                    <View style={{ backgroundColor: t.isDark ? '#7f1d1d' : '#fee2e2', borderColor: t.isDark ? '#b91c1c' : '#fca5a5' }} className="px-3 py-1.5 rounded-xl border flex-row items-center">
                                                        <Text style={{ color: t.isDark ? '#f87171' : '#dc2626' }} className="font-black text-[10px]">❌ Filled</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View className="flex-row items-center gap-2.5">
                                                <Text style={{ color: t.text }} className="text-xs font-black">Seats left: {flight.availableSeats}</Text>
                                                <TouchableOpacity 
                                                    onPress={() => Alert.alert('Copied', 'Flight details copied to clipboard!')}
                                                    style={{ backgroundColor: t.isDark ? '#1e293b' : 'rgba(29,65,113,0.1)' }}
                                                    className="px-2.5 py-1.5 rounded-lg"
                                                >
                                                    <Text style={{ color: t.isDark ? '#cbd5e1' : '#1D4171' }} className="text-[10px] font-black">COPY</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        ) : hasSearched ? (
                            <View className="py-20 items-center opacity-30">
                                <Ionicons name="airplane-outline" size={48} color={t.textMuted} />
                                <Text style={{ color: t.text }} className="mt-4 font-black uppercase text-xs tracking-widest text-center">No flights found</Text>
                            </View>
                        ) : null}
                    </View>
                    <View style={{ height: 60 }} />
                </ScrollView>

                {/* Calendar Modal */}
                <Modal visible={showDatePicker} transparent animationType="slide">
                    <View className="flex-1 justify-end bg-black/50">
                        <View style={{ backgroundColor: t.card }} className="rounded-t-3xl p-6 max-h-[80%] shadow-2xl">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text style={{ color: t.text }} className="text-lg font-black">Select Travel Date</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Ionicons name="close-circle" size={28} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>
                            <Calendar 
                                current={date || undefined}
                                markedDates={markedDates}
                                onDayPress={handleDayPress}
                                minDate={availableDates.length > 0 ? availableDates[0] : undefined}
                                maxDate={availableDates.length > 0 ? availableDates[availableDates.length - 1] : undefined}
                                theme={{
                                    calendarBackground: t.card,
                                    dayTextColor: t.text,
                                    monthTextColor: t.text,
                                    todayTextColor: '#F07E21',
                                    arrowColor: '#1D4171',
                                    selectedDayBackgroundColor: '#F07E21',
                                    selectedDayTextColor: '#ffffff',
                                    textSectionTitleColor: t.textMuted,
                                    textDisabledColor: t.isDark ? '#334155' : '#cbd5e1',
                                    textDayFontWeight: 'bold',
                                    textMonthFontWeight: 'bold',
                                    textDayHeaderFontWeight: 'bold'
                                }}
                            />
                        </View>
                    </View>
                </Modal>

                {/* Travelers counter Modal */}
                <Modal visible={showPaxModal} transparent animationType="fade">
                    <View className="flex-1 justify-center items-center bg-black/60 p-5">
                        <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="w-full max-w-sm rounded-3xl p-6 border shadow-2xl">
                            <View className="flex-row justify-between items-center mb-5 border-b pb-3" style={{ borderBottomColor: t.isDark ? '#334155' : '#f1f5f9' }}>
                                <Text style={{ color: t.text }} className="text-lg font-black">Select Travelers</Text>
                                <TouchableOpacity onPress={() => setShowPaxModal(false)} style={{ backgroundColor: t.isDark ? '#1e293b' : '#f1f5f9' }} className="p-2 rounded-full">
                                    <Ionicons name="close" size={20} color={t.text} />
                                </TouchableOpacity>
                            </View>

                            <View className="space-y-5">
                                <View className="flex-row justify-between items-center mb-3">
                                    <View>
                                        <Text style={{ color: t.text }} className="font-bold text-sm">Adults</Text>
                                        <Text style={{ color: t.textMuted }} className="text-[10px] font-bold">&gt; 12 years</Text>
                                    </View>
                                    <View className="flex-row items-center gap-3">
                                        <TouchableOpacity onPress={() => setPax({...pax, adults: Math.max(1, pax.adults - 1)})} style={{ backgroundColor: t.isDark ? '#1e293b' : '#f1f5f9' }} className="w-8 h-8 rounded-full items-center justify-center"><Text style={{ color: t.text }} className="font-black text-sm">-</Text></TouchableOpacity>
                                        <Text style={{ color: t.text }} className="font-black text-sm w-4 text-center">{pax.adults}</Text>
                                        <TouchableOpacity onPress={() => setPax({...pax, adults: Math.min(9, pax.adults + 1)})} style={{ backgroundColor: t.isDark ? '#1e293b' : '#f1f5f9' }} className="w-8 h-8 rounded-full items-center justify-center"><Text style={{ color: t.text }} className="font-black text-sm">+</Text></TouchableOpacity>
                                    </View>
                                </View>

                                <View className="flex-row justify-between items-center mb-3">
                                    <View>
                                        <Text style={{ color: t.text }} className="font-bold text-sm">Children</Text>
                                        <Text style={{ color: t.textMuted }} className="text-[10px] font-bold">2 - 12 years</Text>
                                    </View>
                                    <View className="flex-row items-center gap-3">
                                        <TouchableOpacity onPress={() => setPax({...pax, children: Math.max(0, pax.children - 1)})} style={{ backgroundColor: t.isDark ? '#1e293b' : '#f1f5f9' }} className="w-8 h-8 rounded-full items-center justify-center"><Text style={{ color: t.text }} className="font-black text-sm">-</Text></TouchableOpacity>
                                        <Text style={{ color: t.text }} className="font-black text-sm w-4 text-center">{pax.children}</Text>
                                        <TouchableOpacity onPress={() => setPax({...pax, children: Math.min(9, pax.children + 1)})} style={{ backgroundColor: t.isDark ? '#1e293b' : '#f1f5f9' }} className="w-8 h-8 rounded-full items-center justify-center"><Text style={{ color: t.text }} className="font-black text-sm">+</Text></TouchableOpacity>
                                    </View>
                                </View>

                                <View className="flex-row justify-between items-center mb-4">
                                    <View>
                                        <Text style={{ color: t.text }} className="font-bold text-sm">Infants</Text>
                                        <Text style={{ color: t.textMuted }} className="text-[10px] font-bold">&lt; 2 years</Text>
                                    </View>
                                    <View className="flex-row items-center gap-3">
                                        <TouchableOpacity onPress={() => setPax({...pax, infants: Math.max(0, pax.infants - 1)})} style={{ backgroundColor: t.isDark ? '#1e293b' : '#f1f5f9' }} className="w-8 h-8 rounded-full items-center justify-center"><Text style={{ color: t.text }} className="font-black text-sm">-</Text></TouchableOpacity>
                                        <Text style={{ color: t.text }} className="font-black text-sm w-4 text-center">{pax.infants}</Text>
                                        <TouchableOpacity onPress={() => setPax({...pax, infants: Math.min(pax.adults, pax.infants + 1)})} style={{ backgroundColor: t.isDark ? '#1e293b' : '#f1f5f9' }} className="w-8 h-8 rounded-full items-center justify-center"><Text style={{ color: t.text }} className="font-black text-sm">+</Text></TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity 
                                onPress={() => setShowPaxModal(false)}
                                style={{ backgroundColor: '#1D4171' }}
                                className="w-full mt-4 py-3 rounded-2xl"
                            >
                                <Text className="text-white font-black text-xs uppercase tracking-widest text-center">Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Popular routes selection city picker Modal */}
                <Modal visible={showQuickCityModal} transparent animationType="fade">
                    <View className="flex-1 justify-center items-center bg-black/50 p-5">
                        <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="w-full max-w-xs rounded-2xl border p-4 shadow-xl">
                            <Text style={{ color: t.text }} className="font-black text-sm mb-3.5 border-b pb-2">Select Hub City</Text>
                            <ScrollView style={{ maxHeight: 200 }}>
                                {Object.keys(QUICK_ROUTES_DATA).map(city => (
                                    <TouchableOpacity 
                                        key={city}
                                        onPress={() => {
                                            setQuickRouteCity(city);
                                            setShowQuickCityModal(false);
                                        }}
                                        style={{ borderBottomColor: t.isDark ? '#334155' : '#f1f5f9' }}
                                        className="py-2.5 border-b last:border-0"
                                    >
                                        <Text style={{ color: quickRouteCity === city ? '#0B4EE3' : t.text }} className="font-bold text-sm">{city}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* City Autocomplete Modal */}
                <Modal visible={showCityModal} animationType="slide" transparent>
                    <View style={{ flex: 1, backgroundColor: t.bg, marginTop: Platform.OS === 'ios' ? 44 : 0 }}>
                        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: t.divider, backgroundColor: t.card }}>
                            <View className="flex-row items-center marginBottom-16">
                                <TouchableOpacity onPress={() => setShowCityModal(false)} className="w-10 h-10 items-center justify-center">
                                    <Ionicons name="close" size={28} color={t.text} />
                                </TouchableOpacity>
                                <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: t.text, marginRight: 40 }}>
                                    Select Airport
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.input, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: t.inputBorder, marginTop: 12 }}>
                                <Ionicons name="search" size={20} color={t.textMuted} />
                                <TextInput
                                    autoFocus
                                    value={citySearchQuery}
                                    onChangeText={setCitySearchQuery}
                                    placeholder="Search city or airport..."
                                    placeholderTextColor={t.placeholder}
                                    style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16, color: t.text, fontWeight: 'bold' }}
                                />
                                {citySearchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setCitySearchQuery('')}>
                                        <Ionicons name="close-circle" size={20} color={t.textMuted} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        <FlatList
                            data={airportSearchResults}
                            keyExtractor={(item) => item.code}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ padding: 20 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => selectCity(item.city)}
                                    style={{ paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: t.divider, flexDirection: 'row', alignItems: 'center', justifyContent: 'between' }}
                                >
                                    <View className="flex-row items-center flex-1">
                                        <Text className="text-xl mr-4">📍</Text>
                                        <View className="flex-1">
                                            <Text style={{ fontSize: 16, fontWeight: '800', color: t.text }}>{item.city} ({item.code})</Text>
                                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: t.textMuted }} numberOfLines={1}>{item.label || item.name}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    {searchingAirports ? (
                                        <ActivityIndicator color={t.primary} />
                                    ) : (
                                        <Text style={{ color: t.textMuted, fontSize: 16, fontWeight: 'bold' }}>No airports found</Text>
                                    )}
                                </View>
                            }
                        />
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}
