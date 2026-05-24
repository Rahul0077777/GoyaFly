import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, Modal, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';
import { fixedDepartureService } from '../../services/api';

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

const COLORS = {
    deepBlue: '#1D4171',
    orange: '#F07E21',
    skyBlue: '#48A0D4',
    bg: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1E293B',
    muted: '#94A3B8'
};

export default function FixedDepartureSearchScreen({ navigation }) {

    const t = useThemeColors();
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [date, setDate] = useState('17/May/2026');
    const [paxSize, setPaxSize] = useState('1');
    const [loading, setLoading] = useState(false);
    const [flights, setFlights] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [availableDates, setAvailableDates] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (from && to) {
            fixedDepartureService.getAvailableDates(from, to).then(res => {
                if (res.success) {
                    setAvailableDates(res.data);
                }
            }).catch(err => console.log(err));
        } else {
            setAvailableDates([]);
        }
    }, [from, to]);

    const markedDates = {};
    if (from && to && availableDates.length > 0) {
        let curr = new Date();
        for (let i = 0; i < 365; i++) {
            const dStr = curr.toISOString().split('T')[0];
            if (availableDates.includes(dStr)) {
                markedDates[dStr] = { selected: dStr === date, selectedColor: COLORS.orange, marked: true, dotColor: COLORS.deepBlue };
            } else {
                markedDates[dStr] = { disabled: true, disableTouchEvent: true };
            }
            curr.setDate(curr.getDate() + 1);
        }
    }

    const handleDayPress = (day) => {
        if (availableDates.length > 0 && !availableDates.includes(day.dateString)) {
            Alert.alert('No Flights', 'No fixed departure flights available on this date. Please select one of the highlighted dates.');
        } else {
            setDate(day.dateString);
            setShowDatePicker(false);
        }
    };

    // Autocomplete state
    const [showCityModal, setShowCityModal] = useState(false);
    const [cityField, setCityField] = useState(null);
    const [cityQuery, setCityQuery] = useState('');
    const filteredCities = CITY_LIST.filter(c => c.toLowerCase().includes(cityQuery.toLowerCase()));

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
        } finally {
            setLoading(false);
        }
    };

    const handleBook = (flight) => {
        const reqPax = parseInt(paxSize, 10) || 1;
        if (reqPax > flight.availableSeats) {
            Alert.alert('No Seat Available', `Only ${flight.availableSeats} seats left on this flight.`);
        } else {
            navigation.navigate('FixedDepartureBooking', { flight });
        }
    };

    const openCityPicker = (field) => {
        setCityField(field);
        setCityQuery('');
        setShowCityModal(true);
    };

    const selectCity = (city) => {
        if (cityField === 'from') setFrom(city);
        else if (cityField === 'to') setTo(city);
        setShowCityModal(false);
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-4 py-4 flex-row items-center justify-between border-b border-gray-200 bg-white">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center">
                        <Ionicons name="arrow-back" size={24} color={COLORS.deepBlue} />
                    </TouchableOpacity>
                    <Text className="text-xl font-black" style={{ color: COLORS.deepBlue }}>Flight Search</Text>
                    <View className="w-10" />
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    {/* Search Card mimicking Image 4 */}
                    <View className="m-4 bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        {/* FROM Field */}
                        <TouchableOpacity onPress={() => openCityPicker('from')} className="mb-6 border-b border-gray-200 pb-2">
                            <Text className="text-gray-500 font-bold text-xs mb-1 uppercase">FROM</Text>
                            <View className="flex-row items-center justify-between">
                                <Text className="flex-1 font-black text-xl text-gray-800">{from || 'Select City'}</Text>
                                <Ionicons name="caret-down" size={16} color="#94A3B8" />
                            </View>
                        </TouchableOpacity>

                        {/* TO Field */}
                        <TouchableOpacity onPress={() => openCityPicker('to')} className="mb-6 border-b border-gray-200 pb-2">
                            <Text className="text-gray-500 font-bold text-xs mb-1 uppercase">TO</Text>
                            <View className="flex-row items-center justify-between">
                                <Text className="flex-1 font-black text-xl text-gray-800">{to || 'Select City'}</Text>
                                <Ionicons name="caret-down" size={16} color="#94A3B8" />
                            </View>
                        </TouchableOpacity>

                        {/* DATE & PAX Row */}
                        <View className="flex-row gap-6 mb-8">
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} className="flex-[2] border-b border-gray-200 pb-2">
                                <Text className="text-gray-500 font-bold text-xs mb-1 uppercase">TRAVEL DATE</Text>
                                <View className="flex-row items-center justify-between">
                                    <Text className="flex-1 font-black text-xl text-gray-800">{date || 'Select Date'}</Text>
                                    <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
                                </View>
                            </TouchableOpacity>

                            <View className="flex-[1] border-b border-gray-200 pb-2">
                                <Text className="text-gray-500 font-bold text-xs mb-1 uppercase">PAX SIZE</Text>
                                <View className="flex-row items-center justify-between">
                                    <TextInput 
                                        className="flex-1 font-black text-xl text-gray-800"
                                        placeholder="1"
                                        placeholderTextColor="#1E293B"
                                        value={paxSize}
                                        onChangeText={setPaxSize}
                                        keyboardType="numeric"
                                    />
                                    <Ionicons name="caret-down" size={16} color="#94A3B8" />
                                </View>
                            </View>
                        </View>

                        {/* Available Dates Horizontal Scroll */}
                        {availableDates.length > 0 && (
                            <View className="mb-6 border-t border-gray-100 pt-4">
                                <Text className="text-gray-500 font-bold text-[10px] mb-2 uppercase tracking-widest">Available Departure Dates:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                    {availableDates.map(d => (
                                        <TouchableOpacity 
                                            key={d}
                                            onPress={() => setDate(d)}
                                            style={{ backgroundColor: date === d ? COLORS.orange : '#F1F5F9' }}
                                            className="px-4 py-2 rounded-xl mr-2 shadow-sm"
                                        >
                                            <Text style={{ color: date === d ? 'white' : COLORS.deepBlue }} className="font-black text-xs uppercase">
                                                {d}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Search Button */}
                        <TouchableOpacity 
                            onPress={handleSearch}
                            style={{ backgroundColor: COLORS.orange }}
                            className="py-4 rounded-xl items-center flex-row justify-center shadow-lg mb-4"
                        >
                            <Text className="text-white font-black text-lg mr-2 uppercase tracking-widest">SEARCH</Text>
                            <Ionicons name="search" size={20} color="white" />
                        </TouchableOpacity>

                        {/* Date Navigation Footer */}
                        <View className="flex-row items-center justify-between border-t border-gray-100 pt-4 mt-2">
                            <TouchableOpacity>
                                <Text style={{ color: COLORS.orange }} className="font-bold text-sm uppercase">« PREV DAY</Text>
                            </TouchableOpacity>
                            <Text style={{ color: COLORS.orange }} className="font-black text-sm uppercase">{date.toUpperCase()}</Text>
                            <TouchableOpacity>
                                <Text style={{ color: COLORS.orange }} className="font-bold text-sm uppercase">NEXT DAY »</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Results Section */}
                    <View className="px-4">
                        {loading ? (
                            <View className="py-20 items-center">
                                <ActivityIndicator size="large" color={COLORS.deepBlue} />
                                <Text className="mt-4 text-gray-400 font-black uppercase text-[10px] tracking-widest">Scanning Inventory...</Text>
                            </View>
                        ) : flights.length > 0 ? (
                            flights.map(flight => {
                                const reqPax = parseInt(paxSize, 10) || 1;
                                const hasEnoughSeats = reqPax <= flight.availableSeats;
                                const tourCode = flight.tourCode || 'AQP' + (flight.flightNumber?.replace(/\D/g, '') || '65252') + '50';
                                return (
                                    <TouchableOpacity 
                                        key={flight._id}
                                        onPress={() => handleBook(flight)}
                                        className="bg-white p-5 rounded-3xl shadow-lg border border-[#1D4171]/10 mb-5"
                                    >
                                        {/* Top Row: Logo/Airline & Route & Baggage */}
                                        <View className="flex-row justify-between items-start mb-4 pb-4 border-b border-[#1D4171]/10">
                                            <View className="flex-row items-center gap-3">
                                                <View className="w-12 h-12 bg-[#1D4171] rounded-2xl items-center justify-center shadow-sm">
                                                    <Text className="text-white font-black text-lg">✈️</Text>
                                                </View>
                                                <View>
                                                    <Text style={{ color: COLORS.deepBlue }} className="text-base font-black mb-1 capitalize">✈ {flight.fromCity} → {flight.toCity}</Text>
                                                    <Text style={{ color: COLORS.skyBlue }} className="text-xs font-black uppercase tracking-wider">{flight.airlineName}</Text>
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <Text style={{ color: COLORS.deepBlue }} className="text-xs font-black opacity-70 mb-1">Non - Stop</Text>
                                                <View className="flex-row items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                                                    <FontAwesome5 name="suitcase" size={10} color={COLORS.orange} />
                                                    <Text className="text-[10px] font-black text-black">7 KG , {flight.isInternational ? '20 KG' : '15 KG'}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Middle Row: Date, Flight No, Time ┈ Duration ┈ Time */}
                                        <View className="flex-row items-center justify-between mb-5 bg-[#1D4171]/5 p-3 rounded-2xl border border-[#1D4171]/10">
                                            <View className="flex-row items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-[#1D4171]/10">
                                                <Ionicons name="calendar" size={12} color={COLORS.deepBlue} />
                                                <Text style={{ color: COLORS.deepBlue }} className="text-[11px] font-black">{formatDateWithDay(flight.departureDate)}</Text>
                                            </View>
                                            <View className="bg-[#48A0D4]/10 px-2.5 py-1.5 rounded-xl border border-[#48A0D4]/20">
                                                <Text style={{ color: COLORS.skyBlue }} className="text-[11px] font-black tracking-wider">{flight.flightNumber}</Text>
                                            </View>
                                            <View className="flex-row items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#1D4171]/10">
                                                <Text style={{ color: COLORS.deepBlue }} className="text-[11px] font-black">{flight.departureTime}</Text>
                                                <View style={{ backgroundColor: COLORS.orange }} className="px-2 py-0.5 rounded-full shadow-sm">
                                                    <Text className="text-white font-black text-[9px] tracking-wider">
                                                        {calculateDuration(flight.departureTime, flight.arrivalTime)}
                                                    </Text>
                                                </View>
                                                <Text style={{ color: COLORS.deepBlue }} className="text-[11px] font-black">{flight.arrivalTime}</Text>
                                            </View>
                                        </View>

                                        {/* Bottom Button Row: Tour Code + Book Now */}
                                        <View className="flex-row items-center rounded-2xl overflow-hidden mb-4 border border-[#1D4171]/10 shadow-sm">
                                            <View className="flex-1 bg-[#F8FAFC] py-4 items-center justify-center border-r border-[#1D4171]/10">
                                                <Text style={{ color: COLORS.deepBlue }} className="text-[11px] font-black tracking-widest uppercase">TOUR CODE {tourCode}</Text>
                                            </View>
                                            <View style={{ backgroundColor: COLORS.orange }} className="flex-1 py-4 items-center justify-center shadow-inner">
                                                <Text className="text-white font-black text-xs tracking-widest uppercase">BOOK NOW (₹{flight.fare})</Text>
                                            </View>
                                        </View>

                                        {/* Footer Row: Seats left & Copy / Status */}
                                        <View className="flex-row items-center justify-between px-1 pt-1 border-t border-slate-100">
                                            <View className="flex-row items-center gap-2">
                                                {hasEnoughSeats ? (
                                                    <View className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm flex-row items-center">
                                                        <Text className="text-emerald-600 font-black text-[10px]">✅ Seat Available</Text>
                                                    </View>
                                                ) : (
                                                    <View className="bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 shadow-sm flex-row items-center">
                                                        <Text className="text-red-600 font-black text-[10px]">❌ No Seat Available</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View className="flex-row items-center gap-2.5">
                                                <Text className="text-xs font-black text-black">Seats : {flight.availableSeats}</Text>
                                                <TouchableOpacity 
                                                    onPress={() => Alert.alert('Copied', 'Flight details copied to clipboard!')}
                                                    className="bg-[#1D4171]/10 px-2.5 py-1 rounded-lg"
                                                >
                                                    <Text style={{ color: COLORS.deepBlue }} className="text-[10px] font-black">COPY</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        ) : hasSearched ? (
                            <View className="py-20 items-center opacity-50">
                                <Ionicons name="search" size={48} color="#CBD5E1" />
                                <Text className="mt-4 font-black uppercase text-xs tracking-widest text-center text-gray-500">No flights found</Text>
                            </View>
                        ) : null}
                        <View style={{ height: 100 }} />
                    </View>
                </ScrollView>

                {/* Calendar Modal */}
                <Modal visible={showDatePicker} transparent animationType="slide">
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-white rounded-t-3xl p-6 max-h-[80%] shadow-2xl">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-lg font-black" style={{ color: COLORS.deepBlue }}>Select Departure Date</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Ionicons name="close-circle" size={28} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>
                            <Calendar 
                                current={date}
                                markedDates={markedDates}
                                onDayPress={handleDayPress}
                                minDate={availableDates.length > 0 ? availableDates[0] : undefined}
                                maxDate={availableDates.length > 0 ? availableDates[availableDates.length - 1] : undefined}
                                theme={{
                                    todayTextColor: COLORS.orange,
                                    arrowColor: COLORS.deepBlue,
                                    selectedDayBackgroundColor: COLORS.orange,
                                    selectedDayTextColor: '#ffffff',
                                    textDayFontWeight: 'bold',
                                    textMonthFontWeight: 'bold',
                                    textDayHeaderFontWeight: 'bold'
                                }}
                            />
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}
