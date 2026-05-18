import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { adminService } from '../../services/api';

const COLORS = {
    bg: '#0F1A2A',
    surface: '#162840',
    deepBlue: '#1D4171',
    orange: '#F07E21',
    skyBlue: '#48A0D4',
    text: '#FFFFFF',
    textMuted: '#94A3B8',
    green: '#10B981',
    red: '#EF4444',
    black: '#000000',
};

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
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAirlinePicker, setShowAirlinePicker] = useState(false);
    const [editingFlight, setEditingFlight] = useState(null);
    
    const [formData, setFormData] = useState({
        airlineName: '', flightNumber: '', fromCity: '', toCity: '',
        departureDate: '', departureTime: '', arrivalTime: '',
        fare: '', totalSeats: '', availableSeats: '', status: 'Available'
    });

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
                departureDate: flight.departureDate ? flight.departureDate.split('T')[0] : ''
            });
        } else {
            setEditingFlight(null);
            setFormData({
                airlineName: '', flightNumber: '', fromCity: '', toCity: '',
                departureDate: '', departureTime: '', arrivalTime: '',
                fare: '', totalSeats: '', availableSeats: '', status: 'Available'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingFlight) {
                await adminService.updateFixedDepartureFlight(editingFlight._id, formData);
            } else {
                await adminService.createFixedDepartureFlight(formData);
            }
            setIsModalOpen(false);
            fetchFlights();
        } catch (error) {
            Alert.alert('Error', 'Operation failed');
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Delete Flight', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', onPress: async () => {
                await adminService.deleteFixedDepartureFlight(id);
                fetchFlights();
            }, style: 'destructive' }
        ]);
    };

    const summary = {
        total: flights.length,
        bookings: bookings.length,
        confirmed: bookings.filter(b => b.status === 'Confirmed').length,
        pending: bookings.filter(b => b.status === 'Pending').length
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <StatusBar style="light" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Top Navigation Bar mimicking Web Header */}
                <View className="flex-row items-center px-4 py-3 bg-[#0a111a]">
                    <Text className="text-white font-black text-lg mr-4">FIX<Text className="text-gray-400">DEPART</Text></Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                        <TouchableOpacity className="px-3 py-1 justify-center"><Text className="text-gray-400 font-bold text-xs">Agent Portal</Text></TouchableOpacity>
                        <TouchableOpacity className="px-3 py-1 bg-orange-500 rounded justify-center"><Text className="text-white font-bold text-xs">Admin Panel</Text></TouchableOpacity>
                        <TouchableOpacity className="px-3 py-1 justify-center"><Text className="text-gray-400 font-bold text-xs">Booking History</Text></TouchableOpacity>
                    </ScrollView>
                    <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center ml-2">
                        <Text className="text-white font-bold text-xs">AD</Text>
                    </View>
                </View>

                {/* Header */}
                <View className="px-6 py-4">
                    <Text className="text-white text-2xl font-black uppercase tracking-widest">Admin Panel</Text>
                    <Text className="text-gray-400 font-medium text-xs">Manually manage flights, fares, and bookings</Text>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={COLORS.orange} />
                    </View>
                ) : (
                    <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                        {/* Summary Cards */}
                        <View className="flex-row flex-wrap justify-between mb-6">
                            <View style={{ backgroundColor: COLORS.surface, borderTopWidth: 3, borderTopColor: '#EAB308' }} className="w-[48%] p-4 rounded-xl mb-3 shadow-lg">
                                <Text className="text-white text-2xl font-black">{summary.total}</Text>
                                <Text className="text-gray-400 text-[10px] uppercase mt-1">Total Flights</Text>
                            </View>
                            <View style={{ backgroundColor: COLORS.surface, borderTopWidth: 3, borderTopColor: COLORS.skyBlue }} className="w-[48%] p-4 rounded-xl mb-3 shadow-lg">
                                <Text className="text-white text-2xl font-black">{summary.bookings}</Text>
                                <Text className="text-gray-400 text-[10px] uppercase mt-1">Total Bookings</Text>
                            </View>
                            <View style={{ backgroundColor: COLORS.surface, borderTopWidth: 3, borderTopColor: COLORS.green }} className="w-[48%] p-4 rounded-xl mb-3 shadow-lg">
                                <Text className="text-white text-2xl font-black">{summary.confirmed}</Text>
                                <Text className="text-gray-400 text-[10px] uppercase mt-1">Confirmed</Text>
                            </View>
                            <View style={{ backgroundColor: COLORS.surface, borderTopWidth: 3, borderTopColor: '#A855F7' }} className="w-[48%] p-4 rounded-xl mb-3 shadow-lg">
                                <Text className="text-white text-2xl font-black">{summary.pending}</Text>
                                <Text className="text-gray-400 text-[10px] uppercase mt-1">Pending</Text>
                            </View>
                        </View>

                        {/* Inventory Section */}
                        <View className="flex-row items-center justify-between mb-4 px-2">
                            <Text className="text-white font-black text-lg uppercase tracking-widest">Flight Inventory</Text>
                            <TouchableOpacity 
                                onPress={() => handleOpenModal()}
                                className="bg-[#10B981] px-4 py-2 rounded-lg items-center flex-row"
                            >
                                <Ionicons name="add" size={16} color="white" />
                                <Text className="text-white font-bold text-xs ml-1">Add Flight</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Flight List header */}
                        <View style={{ backgroundColor: COLORS.surface }} className="rounded-t-2xl px-4 py-3 flex-row border-b border-gray-700">
                            <Text className="text-gray-400 text-[10px] uppercase font-bold flex-[1.5]">Airline</Text>
                            <Text className="text-gray-400 text-[10px] uppercase font-bold flex-[1.5]">Flight No.</Text>
                            <Text className="text-gray-400 text-[10px] uppercase font-bold flex-[2]">Route</Text>
                            <Text className="text-gray-400 text-[10px] uppercase font-bold flex-[1.5]">Timing</Text>
                            <Text className="text-gray-400 text-[10px] uppercase font-bold flex-[1] text-right">Seats</Text>
                        </View>

                        {flights.map((flight, index) => (
                            <TouchableOpacity 
                                key={flight._id} 
                                onLongPress={() => handleDelete(flight._id)}
                                onPress={() => handleOpenModal(flight)}
                                style={{ backgroundColor: COLORS.surface }} 
                                className={`px-4 py-4 flex-row items-center border-b border-gray-800 ${index === flights.length - 1 ? 'rounded-b-2xl mb-6' : ''}`}
                            >
                                <View className="flex-[1.5]">
                                    <Text className="text-white font-bold text-xs">{flight.airlineName}</Text>
                                </View>
                                <View className="flex-[1.5]">
                                    <Text className="text-orange-500 font-bold text-xs">{flight.flightNumber}</Text>
                                </View>
                                <View className="flex-[2]">
                                    <Text className="text-white text-[10px]">{flight.fromCity}</Text>
                                    <Text className="text-gray-400 text-[10px]">→ {flight.toCity}</Text>
                                </View>
                                <View className="flex-[1.5]">
                                    <Text className="text-white text-[10px]">{flight.departureTime}</Text>
                                    <Text className="text-gray-400 text-[10px]">- {flight.arrivalTime}</Text>
                                </View>
                                <View className="flex-[1] items-end">
                                    <Text className="text-white font-bold text-xs">{flight.availableSeats}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}

                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}

                {/* Add/Edit Modal */}
                <Modal visible={isModalOpen} animationType="slide" transparent>
                    <View className="flex-1 bg-black/80 justify-end">
                        <View style={{ backgroundColor: COLORS.bg }} className="rounded-t-[2rem] max-h-[90%] border border-gray-800">
                            <View className="flex-row justify-between items-center p-6 border-b border-gray-800">
                                <Text className="text-white text-lg font-black uppercase tracking-widest">{editingFlight ? 'Edit Flight' : 'Add New Flight'}</Text>
                                <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                                    <Ionicons name="close" size={24} color="#64748B" />
                                </TouchableOpacity>
                            </View>
                            
                            <ScrollView showsVerticalScrollIndicator={false} className="p-6 space-y-5">
                                <TouchableOpacity onPress={() => setShowAirlinePicker(true)} className="space-y-1">
                                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Airline</Text>
                                    <View style={{ backgroundColor: COLORS.surface }} className="p-4 rounded-xl border border-gray-700 flex-row justify-between items-center">
                                        <Text className="text-white font-bold">{formData.airlineName || 'Select Airline'}</Text>
                                        <Ionicons name="chevron-down" size={16} color="#64748B" />
                                    </View>
                                </TouchableOpacity>

                                <View className="space-y-1">
                                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Flight Number</Text>
                                    <TextInput 
                                        placeholder="e.g. SG-123" placeholderTextColor="#475569"
                                        style={{ backgroundColor: COLORS.surface, color: COLORS.text }}
                                        className="p-4 rounded-xl border border-gray-700 font-bold" 
                                        value={formData.flightNumber} onChangeText={t => setFormData({...formData, flightNumber: t})} 
                                    />
                                </View>

                                <View className="space-y-1">
                                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">From City</Text>
                                    <TextInput 
                                        placeholder="Mumbai" placeholderTextColor="#475569"
                                        style={{ backgroundColor: COLORS.surface, color: COLORS.text }}
                                        className="p-4 rounded-xl border border-gray-700 font-bold" 
                                        value={formData.fromCity} onChangeText={t => setFormData({...formData, fromCity: t})} 
                                    />
                                </View>

                                <View className="space-y-1">
                                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">To City</Text>
                                    <TextInput 
                                        placeholder="Dubai" placeholderTextColor="#475569"
                                        style={{ backgroundColor: COLORS.surface, color: COLORS.text }}
                                        className="p-4 rounded-xl border border-gray-700 font-bold" 
                                        value={formData.toCity} onChangeText={t => setFormData({...formData, toCity: t})} 
                                    />
                                </View>

                                <View className="flex-row gap-4">
                                    <View className="space-y-1 flex-1">
                                        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Departure Time</Text>
                                        <TextInput 
                                            placeholder="10:00 AM" placeholderTextColor="#475569"
                                            style={{ backgroundColor: COLORS.surface, color: COLORS.text }}
                                            className="p-4 rounded-xl border border-gray-700 font-bold" 
                                            value={formData.departureTime} onChangeText={t => setFormData({...formData, departureTime: t})} 
                                        />
                                    </View>
                                    <View className="space-y-1 flex-1">
                                        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Arrival Time</Text>
                                        <TextInput 
                                            placeholder="1:00 PM" placeholderTextColor="#475569"
                                            style={{ backgroundColor: COLORS.surface, color: COLORS.text }}
                                            className="p-4 rounded-xl border border-gray-700 font-bold" 
                                            value={formData.arrivalTime} onChangeText={t => setFormData({...formData, arrivalTime: t})} 
                                        />
                                    </View>
                                </View>

                                <View className="space-y-1">
                                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Travel Date</Text>
                                    <TextInput 
                                        placeholder="YYYY-MM-DD" placeholderTextColor="#475569"
                                        style={{ backgroundColor: COLORS.surface, color: COLORS.text }}
                                        className="p-4 rounded-xl border border-gray-700 font-bold" 
                                        value={formData.departureDate} onChangeText={t => setFormData({...formData, departureDate: t})} 
                                    />
                                </View>

                                <View className="flex-row gap-4">
                                    <View className="space-y-1 flex-1">
                                        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Available Seats</Text>
                                        <TextInput 
                                            placeholder="12" placeholderTextColor="#475569" keyboardType="numeric"
                                            style={{ backgroundColor: COLORS.surface, color: COLORS.text }}
                                            className="p-4 rounded-xl border border-gray-700 font-bold" 
                                            value={formData.availableSeats.toString()} onChangeText={t => setFormData({...formData, availableSeats: t, totalSeats: editingFlight ? formData.totalSeats : t})} 
                                        />
                                    </View>
                                    <View className="space-y-1 flex-1">
                                        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Fare (₹)</Text>
                                        <TextInput 
                                            placeholder="14500" placeholderTextColor="#475569" keyboardType="numeric"
                                            style={{ backgroundColor: COLORS.surface, color: COLORS.text }}
                                            className="p-4 rounded-xl border border-gray-700 font-bold" 
                                            value={formData.fare.toString()} onChangeText={t => setFormData({...formData, fare: t})} 
                                        />
                                    </View>
                                </View>

                                <View className="flex-row gap-4 mt-6">
                                    <TouchableOpacity 
                                        onPress={() => setIsModalOpen(false)} 
                                        style={{ backgroundColor: COLORS.surface }}
                                        className="flex-1 py-4 rounded-xl items-center border border-gray-700"
                                    >
                                        <Text className="text-white font-bold">Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={handleSubmit} 
                                        style={{ backgroundColor: COLORS.green }}
                                        className="flex-1 py-4 rounded-xl items-center flex-row justify-center shadow-lg"
                                    >
                                        <Ionicons name="save-outline" size={18} color="white" className="mr-2" />
                                        <Text className="text-white font-bold ml-2">Save Flight</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Airline Picker Bottom Sheet */}
                <Modal visible={showAirlinePicker} animationType="fade" transparent>
                    <TouchableOpacity activeOpacity={1} onPress={() => setShowAirlinePicker(false)} className="flex-1 bg-black/50 justify-center px-6">
                        <View className="bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[70%]">
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
                                        className={`p-5 flex-row justify-between items-center ${idx !== AIRLINES.length - 1 ? 'border-b border-gray-100' : ''}`}
                                    >
                                        <Text className="text-gray-800 text-base font-bold">{airline.name} ({airline.code})</Text>
                                        <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${formData.airlineName === airline.name ? 'border-deepBlue' : 'border-gray-300'}`}>
                                            {formData.airlineName === airline.name && <View className="w-3 h-3 rounded-full bg-deepBlue" style={{ backgroundColor: COLORS.deepBlue }} />}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </SafeAreaView>
        </View>
    );
}
