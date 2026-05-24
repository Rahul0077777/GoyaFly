import React, { useState, useEffect } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, TextInput, 
    ActivityIndicator, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../utils/themeColors';
import { walletService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

// Local Assets
const hotelRoomImg = require('../../../assets/hotel_room.png');
const hotelGraphic = require('../../../assets/hotel_graphic.png');

const TITLE_OPTIONS = ['Mr', 'Mrs', 'Ms'];

export default function HotelCheckoutScreen({ navigation, route }) {
    const { hotel, search } = route.params || {};

    // Fallbacks
    const selectedHotel = hotel || {
        name: 'The Grand Palace',
        location: 'Andheri East, Mumbai',
        stars: '⭐⭐⭐⭐',
        price: 10000,
        taxes: 1800,
        fees: 200,
        image: hotelRoomImg
    };

    const searchParams = search || {
        checkIn: '',
        checkOut: '',
        rooms: 1,
        adults: 1
    };

    const totalAmount = selectedHotel.price + selectedHotel.taxes + selectedHotel.fees;

    // Form States
    const [title, setTitle] = useState('Mr');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dob, setDob] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [ticketEmail, setTicketEmail] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const [companyName, setCompanyName] = useState('');

    const [agentBalance, setAgentBalance] = useState(0);
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await walletService.getBalance();
                if (res.success) {
                    setAgentBalance(res.balance);
                }
            } catch (err) {
                console.warn('Failed to fetch wallet balance for hotel checkout', err);
            } finally {
                setLoadingBalance(false);
            }
        })();
    }, []);

    const handleConfirmBooking = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            return Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter guest name.' });
        }
        if (!mobile || !email) {
            return Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter contact number and email.' });
        }

        setLoadingSubmit(true);
        // Simulate booking process matching the web toast behavior
        setTimeout(() => {
            setLoadingSubmit(false);
            Toast.show({ 
                type: 'success', 
                text1: 'Booking Success', 
                text2: 'Hotel reservation request submitted successfully!' 
            });
            navigation.navigate('MainApp');
        }, 1500);
    };

    const formatDateStr = (dateString) => {
        if (!dateString) return 'Select Date';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F4F7FE' }}>
            <StatusBar style="light" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    
                    {/* Header Banner - Safe wrapped LinearGradient for Android */}
                    <View style={{ overflow: 'hidden', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }} className="pt-16 pb-32 px-6 relative bg-[#0B1A42]">
                        <LinearGradient
                            colors={['#0B1A42', '#0A2670']}
                            start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                        />
                        <View className="flex-row items-center justify-between mb-6 relative z-10">
                            <TouchableOpacity 
                                onPress={() => navigation.goBack()} 
                                className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center border border-white/10 active:scale-95"
                            >
                                <Ionicons name="chevron-back" size={22} color="#fff" />
                            </TouchableOpacity>
                            <View className="bg-[#2D5A9E]/40 border border-white/10 rounded-lg px-3 py-1.5 shadow-inner">
                                <Text className="text-white text-[10px] font-black uppercase tracking-wider">🏨 Hotel Booking</Text>
                            </View>
                            <View className="w-12" />
                        </View>
                        
                        <View className="flex-row items-center justify-between relative z-10">
                            <View className="flex-1 pr-4">
                                <Text className="text-white text-3xl font-black mb-1">Checkout</Text>
                                <Text className="text-slate-300 font-bold text-xs uppercase tracking-widest opacity-80 leading-relaxed">
                                    Complete your hotel booking with secure & professional processing.
                                </Text>
                            </View>
                            <Image source={hotelGraphic} className="w-24 h-24" resizeMode="contain" />
                        </View>
                    </View>

                    {/* Stepper Overlay Card */}
                    <View className="px-5 -mt-16 relative z-20 mb-6">
                        <View className="bg-white p-5 rounded-[2rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-xl flex-row items-center justify-start gap-4">
                            <View className="flex-row items-center gap-2">
                                <View className="w-8 h-8 rounded-full bg-[#1A56DB] items-center justify-center shadow-md">
                                    <Text className="text-white font-black text-xs">1</Text>
                                </View>
                                <View>
                                    <Text className="text-[10px] font-black text-[#1A56DB] uppercase tracking-widest leading-none mb-0.5">Travellers</Text>
                                    <Text className="text-[8px] text-slate-400 font-bold">Guest details</Text>
                                </View>
                            </View>
                            <View className="h-0.5 w-12 border-t border-dashed border-slate-200 mx-2" />
                            <View className="flex-row items-center gap-2 opacity-40">
                                <View className="w-8 h-8 rounded-full bg-slate-200 items-center justify-center">
                                    <Text className="text-slate-500 font-black text-xs">2</Text>
                                </View>
                                <View>
                                    <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">Add-Ons</Text>
                                    <Text className="text-[8px] text-slate-400 font-bold">Special requests</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View className="px-5 space-y-6">
                        {/* Guest Details Form */}
                        <View className="bg-white p-6 rounded-[2rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-lg relative overflow-hidden">
                            {/* Accent line */}
                            <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1A56DB]" />
                            
                            <View className="flex-row items-center justify-between mb-5 mt-1">
                                <Text className="text-sm font-black text-slate-900 uppercase tracking-wider">👤 Traveller 1 (Adult - Lead)</Text>
                                <View className="bg-blue-50 px-2 py-1 rounded-full">
                                    <Text className="text-[#1A56DB] text-[8px] font-black uppercase">Pax Type: Adult</Text>
                                </View>
                            </View>

                            {/* Title Selector */}
                            <View className="mb-4">
                                <Text className="text-slate-500 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">Title *</Text>
                                <View className="flex-row gap-2">
                                    {TITLE_OPTIONS.map(opt => (
                                        <TouchableOpacity
                                            key={opt}
                                            onPress={() => setTitle(opt)}
                                            className={`flex-1 py-3 rounded-xl border items-center active:scale-95 ${title === opt ? 'bg-[#1A56DB] border-[#1A56DB] border-b-4 border-[#123e9e]' : 'bg-white border-slate-200 border-b-4 border-slate-300'}`}
                                        >
                                            <Text className={`font-black text-xs tracking-wider ${title === opt ? 'text-white' : 'text-slate-600'}`}>
                                                {opt}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* First Name Input */}
                            <View className="mb-4">
                                <Text className="text-slate-500 text-[10px] font-black uppercase ml-1 mb-1.5 tracking-widest">First & Middle Name *</Text>
                                <TextInput
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    autoCapitalize="characters"
                                    placeholder="Enter given name"
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            {/* Last Name Input */}
                            <View className="mb-4">
                                <Text className="text-slate-500 text-[10px] font-black uppercase ml-1 mb-1.5 tracking-widest">Last Name *</Text>
                                <TextInput
                                    value={lastName}
                                    onChangeText={setLastName}
                                    autoCapitalize="characters"
                                    placeholder="Enter surname"
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            {/* Date of Birth Input */}
                            <View className="mb-2">
                                <Text className="text-slate-500 text-[10px] font-black uppercase ml-1 mb-1.5 tracking-widest">Date of Birth *</Text>
                                <TextInput
                                    value={dob}
                                    onChangeText={setDob}
                                    placeholder="YYYY-MM-DD"
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </View>

                        {/* Booking Notifications */}
                        <View className="bg-white p-6 rounded-[2rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-lg relative overflow-hidden">
                            {/* Accent line */}
                            <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF9F43]" />
                            
                            <View className="flex-row items-center mb-5 mt-1">
                                <Text className="text-sm font-black text-slate-900 uppercase tracking-wider">🔔 Booking Notifications</Text>
                            </View>

                            {/* Mobile Input */}
                            <View className="mb-4">
                                <Text className="text-slate-500 text-[10px] font-black uppercase ml-1 mb-1.5 tracking-widest">Mobile Number *</Text>
                                <View className="flex-row gap-3">
                                    <View className="bg-slate-50 px-5 py-4 rounded-xl border border-slate-200 justify-center">
                                        <Text className="font-black text-slate-500 text-xs">🇮🇳 +91</Text>
                                    </View>
                                    <View className="flex-1">
                                        <TextInput
                                            value={mobile}
                                            onChangeText={v => setMobile(v.replace(/[^0-9]/g, '').slice(0, 10))}
                                            placeholder="10 digit mobile"
                                            keyboardType="phone-pad"
                                            className="bg-white border border-slate-200 p-4 rounded-xl font-bold text-slate-800 text-sm"
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Email Input */}
                            <View className="mb-4">
                                <Text className="text-slate-500 text-[10px] font-black uppercase ml-1 mb-1.5 tracking-widest">Email ID *</Text>
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholder="Enter email address"
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            {/* Ticket Email Input */}
                            <View className="mb-2">
                                <Text className="text-slate-500 text-[10px] font-black uppercase ml-1 mb-1.5 tracking-widest">Ticket / Voucher Email (Optional)</Text>
                                <TextInput
                                    value={ticketEmail}
                                    onChangeText={setTicketEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholder="ticket@example.com"
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </View>

                        {/* GST details */}
                        <View className="bg-white p-6 rounded-[2rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-lg relative overflow-hidden">
                            {/* Accent line */}
                            <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
                            
                            <View className="flex-row items-center mb-5 mt-1">
                                <Text className="text-sm font-black text-slate-900 uppercase tracking-wider">🛡️ GST Details (Optional)</Text>
                            </View>

                            {/* GST number */}
                            <View className="mb-4">
                                <Text className="text-slate-500 text-[10px] font-black uppercase ml-1 mb-1.5 tracking-widest">GSTIN Number</Text>
                                <TextInput
                                    value={gstNumber}
                                    onChangeText={v => setGstNumber(v.toUpperCase())}
                                    autoCapitalize="characters"
                                    placeholder="07AAAAA0000A1Z5"
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            {/* Company Name */}
                            <View className="mb-2">
                                <Text className="text-slate-500 text-[10px] font-black uppercase ml-1 mb-1.5 tracking-widest">Company Name</Text>
                                <TextInput
                                    value={companyName}
                                    onChangeText={setCompanyName}
                                    placeholder="Registered Agency / Company Name"
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </View>

                        {/* Hotel Summary Card */}
                        <View className="bg-white rounded-[2rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-lg overflow-hidden">
                            {/* Check if image is local or uri string */}
                            <Image 
                                source={typeof selectedHotel.image === 'number' ? selectedHotel.image : { uri: selectedHotel.image }} 
                                className="w-full h-40" 
                                resizeMode="cover" 
                            />
                            <View className="p-6">
                                <View className="bg-yellow-100 px-3 py-1 rounded-md self-start mb-3">
                                    <Text className="text-yellow-800 font-black text-[9px] uppercase tracking-wider">{selectedHotel.stars}</Text>
                                </View>
                                <Text className="text-lg font-black text-slate-900 leading-tight mb-1">{selectedHotel.name}</Text>
                                <Text className="text-xs text-slate-500 font-bold mb-4">📍 {selectedHotel.location}</Text>

                                <View className="flex-row justify-between border-y border-slate-100 py-4 mb-4">
                                    <View>
                                        <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Check-in</Text>
                                        <Text className="text-xs font-black text-slate-800">{formatDateStr(searchParams.checkIn)}</Text>
                                    </View>
                                    <View>
                                        <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Check-out</Text>
                                        <Text className="text-xs font-black text-slate-800">{formatDateStr(searchParams.checkOut)}</Text>
                                    </View>
                                </View>
                                <View>
                                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Room & Guests</Text>
                                    <Text className="text-xs font-black text-slate-800">{searchParams.rooms} Room • {searchParams.adults} Adult</Text>
                                </View>
                            </View>
                        </View>

                        {/* Price Summary Card */}
                        <View className="bg-white p-6 rounded-[2rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-lg">
                            <Text className="text-[10px] font-black text-[#1A56DB] uppercase tracking-widest mb-4">Price Summary ({searchParams.rooms} Room)</Text>

                            <View className="space-y-3 mb-5 border-b border-slate-100 pb-5">
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-xs font-bold text-slate-600">Room Charges</Text>
                                    <Text className="text-sm font-black text-slate-800">₹{selectedHotel.price.toLocaleString('en-IN')}</Text>
                                </View>
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-xs font-bold text-slate-600">Taxes & Fees</Text>
                                    <Text className="text-sm font-black text-slate-800">₹{selectedHotel.taxes.toLocaleString('en-IN')}</Text>
                                </View>
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-xs font-bold text-slate-600">Service Fee</Text>
                                    <Text className="text-sm font-black text-slate-800">₹{selectedHotel.fees.toLocaleString('en-IN')}</Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between items-end">
                                <View>
                                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Amount</Text>
                                    <Text className="text-3xl font-black text-[#FF9F43] leading-none">₹{totalAmount.toLocaleString('en-IN')}</Text>
                                </View>
                                <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Inc. GST</Text>
                            </View>
                        </View>

                        {/* Agent Wallet Summary Card */}
                        <View className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-[2rem] p-5 flex-row items-center gap-4">
                            <View className="w-10 h-10 rounded-xl bg-[#DCFCE7] items-center justify-center">
                                <Text className="text-xl">👛</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Available Wallet</Text>
                                <Text className="text-xl font-black text-emerald-600 leading-none">
                                    {loadingBalance ? '...' : `₹${agentBalance.toLocaleString('en-IN')}`}
                                </Text>
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleConfirmBooking}
                            disabled={loadingSubmit}
                            className="active:scale-95"
                        >
                            <View
                                className="bg-[#0B1A42] py-5 rounded-2xl items-center border border-b-[6px] border-[#071330] shadow-lg"
                            >
                                {loadingSubmit ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white font-black text-sm uppercase tracking-widest">
                                        Proceed to Add-ons →
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
