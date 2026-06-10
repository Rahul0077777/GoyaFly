import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { adminService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';
import Toast from 'react-native-toast-message';

const AIRLINES = [
    { name: 'IndiGo', code: '6E' },
    { name: 'Air India', code: 'AI' },
    { name: 'Air India Express', code: 'IX' },
    { name: 'Akasa Air', code: 'QP' },
    { name: 'Vistara', code: 'UK' },
    { name: 'SpiceJet', code: 'SG' },
    { name: 'Alliance Air', code: '9I' },
    { name: 'Emirates', code: 'EK' },
    { name: 'Qatar Airways', code: 'QR' },
    { name: 'Etihad Airways', code: 'EY' },
    { name: 'Singapore Airlines', code: 'SQ' },
    { name: 'Malaysia Airlines', code: 'MH' },
    { name: 'Thai Airways', code: 'TG' },
    { name: 'SriLankan Airlines', code: 'UL' },
    { name: 'British Airways', code: 'BA' },
    { name: 'Lufthansa', code: 'LH' },
    { name: 'Air France', code: 'AF' },
    { name: 'KLM Royal Dutch Airlines', code: 'KL' },
    { name: 'Swiss International Air Lines', code: 'LX' },
    { name: 'Virgin Atlantic', code: 'VS' },
    { name: 'United Airlines', code: 'UA' },
    { name: 'American Airlines', code: 'AA' },
    { name: 'Delta Air Lines', code: 'DL' },
    { name: 'Air Canada', code: 'AC' },
    { name: 'Cathay Pacific', code: 'CX' },
    { name: 'Japan Airlines', code: 'JL' },
    { name: 'All Nippon Airways', code: 'NH' },
    { name: 'Korean Air', code: 'KE' },
    { name: 'Vietnam Airlines', code: 'VN' },
    { name: 'Saudia', code: 'SV' },
    { name: 'Oman Air', code: 'WY' },
    { name: 'Gulf Air', code: 'GF' },
    { name: 'Kuwait Airways', code: 'KU' },
    { name: 'flydubai', code: 'FZ' },
    { name: 'Air Arabia', code: 'G9' },
    { name: 'Turkish Airlines', code: 'TK' },
    { name: 'Qantas', code: 'QF' },
    { name: 'Air New Zealand', code: 'NZ' },
    { name: 'Ethiopian Airlines', code: 'ET' }
];

export default function FixedDepartureManagerScreen({ navigation }) {
    const t = useThemeColors();
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAirlinePicker, setShowAirlinePicker] = useState(false);
    const [editingFlight, setEditingFlight] = useState(null);
    const [updating, setUpdating] = useState(false);
    
    const [formData, setFormData] = useState({
        airlineName: '', flightNumber: '', fromCity: '', toCity: '',
        fromAirportCode: '', toAirportCode: '', baggageAllowance: '',
        departureDate: '', departureTime: '', arrivalTime: '',
        fare: '', childFare: '', infantFare: '', totalSeats: '', availableSeats: '', status: 'Available'
    });
    
    // Airport Picker State
    const [isAirportModalOpen, setIsAirportModalOpen] = useState(false);
    const [airportSearchQuery, setAirportSearchQuery] = useState('');
    const [airportList, setAirportList] = useState([]);
    const [airportLoading, setAirportLoading] = useState(false);
    const [airportFieldToSet, setAirportFieldToSet] = useState(''); // 'from' or 'to'

    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        fetchFlights();
        fetchBookings();
    }, []);

    const fetchFlights = async () => {
        try {
            const res = await adminService.getFixedDepartureFlights();
            if (res.success) setFlights(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookings = async () => {
        try {
            const res = await adminService.getFixedDepartureBookings();
            if (res.success) setBookings(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenModal = (flight = null) => {
        if (flight) {
            setEditingFlight(flight);
            setFormData({
                ...flight,
                fare: String(flight.fare || ''),
                childFare: String(flight.childFare || ''),
                infantFare: String(flight.infantFare || ''),
                totalSeats: String(flight.totalSeats || ''),
                availableSeats: String(flight.availableSeats || ''),
                departureDate: flight.departureDate ? flight.departureDate.split('T')[0] : ''
            });
        } else {
            setEditingFlight(null);
            setFormData({
                airlineName: '', flightNumber: '', fromCity: '', toCity: '',
                fromAirportCode: '', toAirportCode: '', baggageAllowance: '',
                departureDate: '', departureTime: '', arrivalTime: '',
                fare: '', childFare: '', infantFare: '', totalSeats: '', availableSeats: '', status: 'Available'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.airlineName || !formData.flightNumber || !formData.fromCity || !formData.toCity || !formData.fare) {
            return Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill all required fields.' });
        }
        setUpdating(true);
        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== undefined) {
                    submitData.append(key, formData[key]);
                }
            });

            if (editingFlight) {
                await adminService.updateFixedDepartureFlight(editingFlight._id, submitData);
                Toast.show({ type: 'success', text1: 'Success', text2: 'Flight updated successfully' });
            } else {
                await adminService.createFixedDepartureFlight(submitData);
                Toast.show({ type: 'success', text1: 'Success', text2: 'Flight created successfully' });
            }
            setIsModalOpen(false);
            fetchFlights();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Operation failed' });
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Delete Flight', 'Are you sure you want to delete this inventory?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', onPress: async () => {
                try {
                    await adminService.deleteFixedDepartureFlight(id);
                    Toast.show({ type: 'success', text1: 'Success', text2: 'Flight deleted' });
                    fetchFlights();
                } catch (e) {
                    Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete' });
                }
            }, style: 'destructive' }
        ]);
    };

    const summary = {
        total: flights.length,
        bookings: bookings.length,
        confirmed: bookings.filter(b => b.status === 'Confirmed').length,
        pending: bookings.filter(b => b.status === 'Pending').length
    };

    // Handle Airport Search
    useEffect(() => {
        if (isAirportModalOpen && airportSearchQuery.length >= 2) {
            const timeoutId = setTimeout(async () => {
                setAirportLoading(true);
                try {
                    const res = await adminService.api?.get('/booking/airports/search', { params: { query: airportSearchQuery }});
                    if (res?.data?.success) {
                        setAirportList(res.data.data);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setAirportLoading(false);
                }
            }, 500);
            return () => clearTimeout(timeoutId);
        } else if (isAirportModalOpen && airportSearchQuery.length < 2) {
            setAirportList([]);
        }
    }, [airportSearchQuery, isAirportModalOpen]);

    const handleSelectAirport = (airport) => {
        if (airportFieldToSet === 'from') {
            setFormData(prev => ({ ...prev, fromCity: airport.city, fromAirportCode: airport.code }));
        } else {
            setFormData(prev => ({ ...prev, toCity: airport.city, toAirportCode: airport.code }));
        }
        setIsAirportModalOpen(false);
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="mx-4 mt-2 mb-6 p-4 flex-row items-center bg-white rounded-3xl border border-slate-100 border-b-[6px] border-b-slate-200 shadow-xl shadow-slate-300/40">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-200 active:scale-95 mr-3">
                        <Ionicons name="arrow-back" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="bg-orange-50 w-12 h-12 rounded-2xl items-center justify-center border border-orange-100 shadow-sm mr-3">
                        <Ionicons name="airplane" size={24} color="#F07E21" />
                    </View>
                    <View className="flex-1 pr-1">
                        <Text style={{ color: t.text }} className="text-xl sm:text-2xl font-black tracking-wide" numberOfLines={1} adjustsFontSizeToFit>Flight Inventory</Text>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5" numberOfLines={1}>Fixed Departure Manager</Text>
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#1D4171" />
                    </View>
                ) : (
                    <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                        {/* Summary Cards */}
                        <View className="flex-row flex-wrap justify-between mb-4">
                            <View style={{ backgroundColor: t.card, elevation: 6 }} className="w-[48%] p-5 rounded-[2rem] border border-slate-100 border-b-[6px] border-[#F07E21] shadow-xl shadow-slate-200/50 mb-4 items-center">
                                <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Total Flights</Text>
                                <Text className="text-[#1D4171] text-3xl font-black tracking-tight">{summary.total}</Text>
                            </View>
                            <View style={{ backgroundColor: t.card, elevation: 6 }} className="w-[48%] p-5 rounded-[2rem] border border-slate-100 border-b-[6px] border-[#48A0D4] shadow-xl shadow-slate-200/50 mb-4 items-center">
                                <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Total Bookings</Text>
                                <Text className="text-[#1D4171] text-3xl font-black tracking-tight">{summary.bookings}</Text>
                            </View>
                            <View style={{ backgroundColor: t.card, elevation: 6 }} className="w-[48%] p-5 rounded-[2rem] border border-slate-100 border-b-[6px] border-emerald-500 shadow-xl shadow-slate-200/50 mb-4 items-center">
                                <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Confirmed</Text>
                                <Text className="text-[#1D4171] text-3xl font-black tracking-tight">{summary.confirmed}</Text>
                            </View>
                            <View style={{ backgroundColor: t.card, elevation: 6 }} className="w-[48%] p-5 rounded-[2rem] border border-slate-100 border-b-[6px] border-purple-500 shadow-xl shadow-slate-200/50 mb-4 items-center">
                                <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Pending</Text>
                                <Text className="text-[#1D4171] text-3xl font-black tracking-tight">{summary.pending}</Text>
                            </View>
                        </View>

                        {/* Inventory Section Header */}
                        <View className="flex-row items-center justify-between mb-6 px-1">
                            <Text className="text-slate-800 font-black text-sm uppercase tracking-widest">Active Inventory</Text>
                            <TouchableOpacity 
                                onPress={() => handleOpenModal()}
                                className="bg-[#1D4171] px-4 py-2.5 rounded-xl flex-row items-center border border-[#15305B] border-b-4 border-b-[#0f2342] shadow-sm active:scale-95"
                            >
                                <Ionicons name="add" size={14} color="white" />
                                <Text className="text-white font-black text-[10px] uppercase tracking-widest ml-1">Add Flight</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Flight List */}
                        {flights.length === 0 ? (
                            <View className="py-16 items-center">
                                <Ionicons name="airplane-outline" size={64} color="#cbd5e1" className="mb-4" />
                                <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Flights Found</Text>
                                <Text className="text-slate-400 font-bold text-xs">Add a flight to manage inventory.</Text>
                            </View>
                        ) : (
                            flights.map((flight) => (
                                <View key={flight._id} style={{ backgroundColor: t.card, elevation: 8 }} className="p-6 rounded-3xl border border-slate-100 border-b-[8px] border-slate-200 mb-6 shadow-2xl shadow-slate-300/40">
                                    <View className="flex-row justify-between items-start mb-5 pb-4 border-b border-slate-100">
                                        <View className="flex-row items-center gap-3">
                                            <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 shadow-inner">
                                                <Ionicons name="airplane" size={20} color="#1D4171" />
                                            </View>
                                            <View>
                                                <Text className="text-[#1D4171] font-black text-lg tracking-wide">{flight.flightNumber}</Text>
                                                <Text className="text-[#F07E21] font-black text-[10px] uppercase tracking-widest">{flight.airlineName}</Text>
                                            </View>
                                        </View>
                                        <Text className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                                            flight.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                        }`}>{flight.status}</Text>
                                    </View>

                                    {/* Route Visual */}
                                    <View className="flex-row items-center justify-between bg-slate-50 p-4 rounded-2xl mb-5 border border-slate-100 shadow-inner">
                                        <View className="items-center w-20">
                                            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">From</Text>
                                            <Text className="text-[#1D4171] font-black text-base">{flight.fromCity}</Text>
                                            <Text className="text-slate-500 font-bold text-[10px]">{flight.departureTime}</Text>
                                        </View>
                                        <View className="flex-1 items-center px-2">
                                            <View className="w-full h-0.5 bg-slate-300 relative justify-center items-center">
                                                <View className="absolute bg-slate-50 px-2">
                                                    <Ionicons name="airplane" size={14} color="#94a3b8" style={{ transform: [{ rotate: '90deg' }] }} />
                                                </View>
                                            </View>
                                        </View>
                                        <View className="items-center w-20">
                                            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">To</Text>
                                            <Text className="text-[#1D4171] font-black text-base">{flight.toCity}</Text>
                                            <Text className="text-slate-500 font-bold text-[10px]">{flight.arrivalTime}</Text>
                                        </View>
                                    </View>

                                    {/* Info Grid */}
                                    <View className="flex-row justify-between mb-5 px-1">
                                        <View className="flex-row items-center gap-2">
                                            <Ionicons name="calendar" size={16} color="#48A0D4" />
                                            <View>
                                                <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Date</Text>
                                                <Text className="text-slate-800 font-bold text-xs">{new Date(flight.departureDate).toLocaleDateString()}</Text>
                                            </View>
                                        </View>
                                        <View className="flex-row items-center gap-2">
                                            <Ionicons name="people" size={16} color="#48A0D4" />
                                            <View>
                                                <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Seats</Text>
                                                <Text className="text-slate-800 font-bold text-xs">{flight.availableSeats} / {flight.totalSeats}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Fares & Actions */}
                                    <View className="flex-row items-center justify-between pt-5 border-t border-slate-100">
                                        <View className="flex-row gap-4">
                                            <View>
                                                <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Adult</Text>
                                                <Text className="text-[#1D4171] font-black text-lg">₹{flight.fare}</Text>
                                            </View>
                                            <View>
                                                <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Child</Text>
                                                <Text className="text-[#1D4171] font-black text-lg">₹{flight.childFare || 0}</Text>
                                            </View>
                                        </View>
                                        <View className="flex-row gap-2">
                                            <TouchableOpacity 
                                                onPress={() => handleOpenModal(flight)}
                                                className="w-10 h-10 bg-sky-50 rounded-xl items-center justify-center border border-sky-100 shadow-sm active:scale-95"
                                            >
                                                <Ionicons name="pencil" size={16} color="#0284c7" />
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                onPress={() => handleDelete(flight._id)}
                                                className="w-10 h-10 bg-rose-50 rounded-xl items-center justify-center border border-rose-100 shadow-sm active:scale-95"
                                            >
                                                <Ionicons name="trash" size={16} color="#e11d48" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}

                {/* Add/Edit Modal */}
                <Modal visible={isModalOpen} animationType="slide" transparent>
                    <View className="flex-1 bg-black/60 justify-end">
                        <View style={{ backgroundColor: t.card }} className="rounded-t-3xl border-t border-slate-200 mt-20 max-h-[95%]">
                            <View className="flex-row justify-between items-center p-6 border-b border-slate-100">
                                <Text className="text-slate-900 text-xl font-black uppercase tracking-widest">{editingFlight ? 'Edit Flight' : 'Add New Flight'}</Text>
                                <TouchableOpacity onPress={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 shadow-sm">
                                    <Ionicons name="close" size={20} color="#64748B" />
                                </TouchableOpacity>
                            </View>
                            
                            <ScrollView showsVerticalScrollIndicator={false} className="p-6 space-y-5">
                                <TouchableOpacity onPress={() => setShowAirlinePicker(true)} className="space-y-2">
                                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Airline *</Text>
                                    <View className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex-row justify-between items-center shadow-inner">
                                        <Text className="text-slate-800 font-bold">{formData.airlineName || 'Select Airline'}</Text>
                                        <Ionicons name="chevron-down" size={16} color="#64748B" />
                                    </View>
                                </TouchableOpacity>

                                <View className="space-y-2">
                                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Flight Number *</Text>
                                    <TextInput 
                                        placeholder="e.g. 6E-123" placeholderTextColor="#9ca3af"
                                        className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-slate-800 font-bold shadow-inner" 
                                        value={formData.flightNumber} onChangeText={t => setFormData({...formData, flightNumber: t})} 
                                    />
                                </View>

                                <View className="flex-row gap-4">
                                    <TouchableOpacity 
                                        onPress={() => { setAirportFieldToSet('from'); setAirportSearchQuery(''); setIsAirportModalOpen(true); }}
                                        className="space-y-2 flex-1"
                                    >
                                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">From City *</Text>
                                        <View className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner flex-row justify-between items-center">
                                            <Text className={formData.fromCity ? "text-slate-800 font-bold" : "text-slate-400"}>
                                                {formData.fromCity ? `${formData.fromCity} (${formData.fromAirportCode || ''})` : 'Select Origin'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => { setAirportFieldToSet('to'); setAirportSearchQuery(''); setIsAirportModalOpen(true); }}
                                        className="space-y-2 flex-1"
                                    >
                                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">To City *</Text>
                                        <View className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner flex-row justify-between items-center">
                                            <Text className={formData.toCity ? "text-slate-800 font-bold" : "text-slate-400"}>
                                                {formData.toCity ? `${formData.toCity} (${formData.toAirportCode || ''})` : 'Select Dest'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-row gap-4">
                                    <View className="space-y-2 flex-1">
                                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Dep Time *</Text>
                                        <TextInput 
                                            placeholder="10:00 AM" placeholderTextColor="#9ca3af"
                                            className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-slate-800 font-bold shadow-inner" 
                                            value={formData.departureTime} onChangeText={t => setFormData({...formData, departureTime: t})} 
                                        />
                                    </View>
                                    <View className="space-y-2 flex-1">
                                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Arr Time *</Text>
                                        <TextInput 
                                            placeholder="1:00 PM" placeholderTextColor="#9ca3af"
                                            className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-slate-800 font-bold shadow-inner" 
                                            value={formData.arrivalTime} onChangeText={t => setFormData({...formData, arrivalTime: t})} 
                                        />
                                    </View>
                                </View>

                                <View className="space-y-2">
                                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Travel Date *</Text>
                                    <TextInput 
                                        placeholder="YYYY-MM-DD" placeholderTextColor="#9ca3af"
                                        className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-slate-800 font-bold shadow-inner" 
                                        value={formData.departureDate} onChangeText={t => setFormData({...formData, departureDate: t})} 
                                    />
                                </View>

                                <View className="space-y-2">
                                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Total Seats *</Text>
                                    <TextInput 
                                        placeholder="40" placeholderTextColor="#9ca3af" keyboardType="numeric"
                                        className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-slate-800 font-bold shadow-inner" 
                                        value={formData.totalSeats.toString()} onChangeText={t => setFormData({...formData, totalSeats: t, availableSeats: editingFlight ? formData.availableSeats : t})} 
                                    />
                                </View>
                                {editingFlight && (
                                    <View className="space-y-2">
                                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Available Seats</Text>
                                        <TextInput 
                                            placeholder="20" placeholderTextColor="#9ca3af" keyboardType="numeric"
                                            className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-slate-800 font-bold shadow-inner" 
                                            value={formData.availableSeats.toString()} onChangeText={t => setFormData({...formData, availableSeats: t})} 
                                        />
                                    </View>
                                )}

                                <View className="space-y-2">
                                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Baggage Allowance (Optional)</Text>
                                    <TextInput 
                                        placeholder="e.g. 15 KG Check-in / 7 KG Cabin" placeholderTextColor="#9ca3af"
                                        className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-slate-800 font-bold shadow-inner" 
                                        value={formData.baggageAllowance} onChangeText={t => setFormData({...formData, baggageAllowance: t})} 
                                    />
                                </View>

                                <View className="flex-row gap-3">
                                    <View className="space-y-2 flex-1">
                                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Adult Fare *</Text>
                                        <TextInput 
                                            placeholder="14500" placeholderTextColor="#9ca3af" keyboardType="numeric"
                                            className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-[#F07E21] font-black shadow-inner" 
                                            value={formData.fare.toString()} onChangeText={t => setFormData({...formData, fare: t})} 
                                        />
                                    </View>
                                    <View className="space-y-2 flex-1">
                                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Child Fare (Opt)</Text>
                                        <TextInput 
                                            placeholder="12000" placeholderTextColor="#9ca3af" keyboardType="numeric"
                                            className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-[#1D4171] font-black shadow-inner" 
                                            value={formData.childFare.toString()} onChangeText={t => setFormData({...formData, childFare: t})} 
                                        />
                                    </View>
                                    <View className="space-y-2 flex-1">
                                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Infant Fare (Opt)</Text>
                                        <TextInput 
                                            placeholder="3500" placeholderTextColor="#9ca3af" keyboardType="numeric"
                                            className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-[#1D4171] font-black shadow-inner" 
                                            value={formData.infantFare.toString()} onChangeText={t => setFormData({...formData, infantFare: t})} 
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity 
                                    onPress={handleSubmit} disabled={updating}
                                    className="bg-[#F07E21] py-5 rounded-2xl items-center border border-[#d96d1a] border-b-4 border-b-[#b85a12] shadow-xl shadow-orange-500/30 active:scale-95 mt-6 mb-10"
                                >
                                    <Text className="text-white font-black text-xs uppercase tracking-widest">{updating ? 'Saving...' : 'Save Flight Inventory'}</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Airline Picker Bottom Sheet */}
                <Modal visible={showAirlinePicker} animationType="fade" transparent>
                    <TouchableOpacity activeOpacity={1} onPress={() => setShowAirlinePicker(false)} className="flex-1 bg-black/60 justify-center p-6">
                        <View className="bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[70%] border border-slate-100">
                            <View className="p-5 border-b border-slate-100 bg-slate-50">
                                <Text className="text-slate-800 font-black text-lg">Select Airline</Text>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {AIRLINES.map((airline, idx) => (
                                    <TouchableOpacity 
                                        key={airline.name} 
                                        onPress={() => { 
                                            setFormData(prev => ({
                                                ...prev, 
                                                airlineName: airline.name,
                                                flightNumber: prev.flightNumber ? prev.flightNumber : `${airline.code}-`
                                            })); 
                                            setShowAirlinePicker(false); 
                                        }}
                                        className={`p-5 flex-row justify-between items-center ${idx !== AIRLINES.length - 1 ? 'border-b border-slate-100' : ''}`}
                                    >
                                        <Text className="text-slate-700 text-base font-bold">{airline.name} ({airline.code})</Text>
                                        <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${formData.airlineName === airline.name ? 'border-[#1D4171]' : 'border-slate-300'}`}>
                                            {formData.airlineName === airline.name && <View className="w-3 h-3 rounded-full bg-[#1D4171]" />}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>
                {/* Airport Picker Bottom Sheet */}
                <Modal visible={isAirportModalOpen} animationType="fade" transparent>
                    <TouchableOpacity activeOpacity={1} onPress={() => setIsAirportModalOpen(false)} className="flex-1 bg-black/60 justify-center p-6">
                        <View className="bg-white rounded-3xl overflow-hidden shadow-2xl h-[70%] border border-slate-100">
                            <View className="p-5 border-b border-slate-100 bg-slate-50">
                                <Text className="text-slate-800 font-black text-lg mb-3">Search Airport</Text>
                                <TextInput 
                                    className="bg-white border border-slate-200 p-4 rounded-xl text-slate-800 font-bold"
                                    placeholder="Search city or airport code..."
                                    placeholderTextColor="#94a3b8"
                                    value={airportSearchQuery}
                                    onChangeText={setAirportSearchQuery}
                                    autoFocus
                                />
                            </View>
                            {airportLoading ? (
                                <View className="p-10 items-center justify-center">
                                    <ActivityIndicator size="small" color="#F07E21" />
                                    <Text className="text-slate-400 mt-2 font-bold text-xs">Searching...</Text>
                                </View>
                            ) : (
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {airportList.map((airport, idx) => (
                                        <TouchableOpacity 
                                            key={airport.code} 
                                            onPress={() => handleSelectAirport(airport)}
                                            className={`p-5 flex-row justify-between items-center ${idx !== airportList.length - 1 ? 'border-b border-slate-100' : ''}`}
                                        >
                                            <View className="flex-1 pr-4">
                                                <Text className="text-slate-800 text-base font-bold">{airport.city}</Text>
                                                <Text className="text-slate-400 text-xs mt-0.5">{airport.label} {airport.country ? `• ${airport.country}` : ''}</Text>
                                            </View>
                                            <View className="bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                                                <Text className="text-[#F07E21] font-black">{airport.code}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                    {airportList.length === 0 && airportSearchQuery.length >= 2 && (
                                        <View className="p-10 items-center justify-center">
                                            <Text className="text-slate-400 font-bold">No airports found.</Text>
                                        </View>
                                    )}
                                </ScrollView>
                            )}
                        </View>
                    </TouchableOpacity>
                </Modal>
            </SafeAreaView>
        </View>
    );
}
