import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';
import { fixedDepartureService } from '../../services/api';

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

export default function FixedDepartureBookingScreen({ route, navigation }) {
    const t = useThemeColors();
    const { flight } = route.params;

    const [step, setStep] = useState(1);
    const [isInternational, setIsInternational] = useState(flight?.isInternational || false);
    const [passengers, setPassengers] = useState([
        { firstName: '', lastName: '', dob: '', age: '', gender: 'Male', mobileNumber: '', email: '', passportNumber: '', passportExpiry: '', nationality: 'IN' }
    ]);
    const [activeDobIndex, setActiveDobIndex] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    if (!flight) {
        navigation.goBack();
        return null;
    }

    const handleAddPassenger = () => {
        if (passengers.length >= flight.availableSeats) {
            return Alert.alert('Seat Limit', `Only ${flight.availableSeats} seats available on this flight.`);
        }
        setPassengers([...passengers, { firstName: '', lastName: '', dob: '', age: '', gender: 'Male', mobileNumber: '', email: '', passportNumber: '', passportExpiry: '', nationality: 'IN' }]);
    };

    const handleRemovePassenger = (index) => {
        setPassengers(passengers.filter((_, i) => i !== index));
    };

    const handleInputChange = (index, field, value) => {
        const newPax = [...passengers];
        newPax[index][field] = value;
        if (field === 'dob' && value) {
            const birthYear = new Date(value).getFullYear();
            const currentYear = new Date().getFullYear();
            if (birthYear && currentYear >= birthYear) {
                newPax[index].age = (currentYear - birthYear).toString();
            }
        }
        setPassengers(newPax);
    };

    const validateStep2 = () => {
        for (const p of passengers) {
            if (!p.firstName || !p.lastName || !p.dob || !p.age || !p.mobileNumber || !p.email) {
                Alert.alert('Missing Details', 'Please fill in First Name, Last Name, DOB, Age, Mobile Number, and Email ID for all travelers.');
                return false;
            }
            if (isInternational) {
                if (!p.passportNumber || !p.passportExpiry || !p.nationality) {
                    Alert.alert('Passport Required', 'Please fill in Passport details for all international travelers.');
                    return false;
                }
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateStep2()) return;

        setSubmitting(true);
        try {
            const res = await fixedDepartureService.bookFlight(flight._id, passengers, isInternational);
            if (res.success) {
                Alert.alert('Booking Success', 'Your fixed departure booking request has been submitted successfully!');
                navigation.replace('FixedDepartureHistory');
            }
        } catch (error) {
            Alert.alert('Booking Failed', error.response?.data?.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const totalFare = flight.fare * passengers.length;

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Top Header */}
                <View className="px-6 py-4 flex-row justify-between items-center border-b border-gray-100 bg-white">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100">
                        <Ionicons name="chevron-back" size={20} color="#000" />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text style={{ color: t.text }} className="text-lg font-black">Fixed Departure</Text>
                        <Text style={{ color: t.textMuted }} className="font-bold uppercase text-[9px] tracking-widest">
                            Step {step} of 3 • {step === 1 ? 'Flight Details' : step === 2 ? 'Travelers' : 'Review & Pay'}
                        </Text>
                    </View>
                    <View className="w-10 h-10 bg-blue-50 rounded-2xl items-center justify-center border border-blue-100">
                        <MaterialCommunityIcons name="shield-check" size={20} color={t.primary} />
                    </View>
                </View>

                {/* Progress Bar */}
                <View className="bg-white px-6 py-3 border-b border-gray-100 flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                        <View className={`w-7 h-7 rounded-xl items-center justify-center ${step >= 1 ? 'bg-[#1D4171]' : 'bg-gray-100'}`}>
                            <Text className={`font-black text-xs ${step >= 1 ? 'text-white' : 'text-gray-400'}`}>1</Text>
                        </View>
                        <Text className={`font-bold text-xs ${step >= 1 ? 'text-[#1D4171]' : 'text-gray-400'}`}>Flight</Text>
                    </View>
                    <View className="h-[2px] bg-gray-200 flex-1 mx-3" />
                    <View className="flex-row items-center gap-2">
                        <View className={`w-7 h-7 rounded-xl items-center justify-center ${step >= 2 ? 'bg-[#1D4171]' : 'bg-gray-100'}`}>
                            <Text className={`font-black text-xs ${step >= 2 ? 'text-white' : 'text-gray-400'}`}>2</Text>
                        </View>
                        <Text className={`font-bold text-xs ${step >= 2 ? 'text-[#1D4171]' : 'text-gray-400'}`}>Travelers</Text>
                    </View>
                    <View className="h-[2px] bg-gray-200 flex-1 mx-3" />
                    <View className="flex-row items-center gap-2">
                        <View className={`w-7 h-7 rounded-xl items-center justify-center ${step >= 3 ? 'bg-[#1D4171]' : 'bg-gray-100'}`}>
                            <Text className={`font-black text-xs ${step >= 3 ? 'text-white' : 'text-gray-400'}`}>3</Text>
                        </View>
                        <Text className={`font-bold text-xs ${step >= 3 ? 'text-[#1D4171]' : 'text-gray-400'}`}>Review</Text>
                    </View>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                        
                        {/* STEP 1: FLIGHT DETAILS */}
                        {step === 1 && (
                            <View className="space-y-6">
                                <View className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex-row items-center justify-between">
                                    <Text className="text-amber-800 font-black text-xs uppercase tracking-wider">Available Seats</Text>
                                    <View className="bg-amber-500 px-3 py-1 rounded-lg">
                                        <Text className="text-white font-black text-xs">{flight.availableSeats} Seats Left</Text>
                                    </View>
                                </View>

                                {/* Sector Toggle */}
                                <View className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                                    <Text className="text-[#1D4171] font-black text-base">Select Sector Type</Text>
                                    <View className="flex-row gap-4">
                                        <TouchableOpacity 
                                            onPress={() => setIsInternational(false)}
                                            className={`flex-1 p-4 rounded-2xl border-2 items-center ${!isInternational ? 'border-[#1D4171] bg-blue-50/20' : 'border-gray-100 bg-gray-50/50'}`}
                                        >
                                            <Text className="text-2xl mb-1">🇮🇳</Text>
                                            <Text className={`font-black text-xs ${!isInternational ? 'text-[#1D4171]' : 'text-gray-400'}`}>Domestic</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            onPress={() => setIsInternational(true)}
                                            className={`flex-1 p-4 rounded-2xl border-2 items-center ${isInternational ? 'border-[#1D4171] bg-blue-50/20' : 'border-gray-100 bg-gray-50/50'}`}
                                        >
                                            <Text className="text-2xl mb-1">🌐</Text>
                                            <Text className={`font-black text-xs ${isInternational ? 'text-[#1D4171]' : 'text-gray-400'}`}>International</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Flight Itinerary Card */}
                                <View className="bg-[#1D4171] p-6 rounded-[2.5rem] shadow-xl">
                                    <View className="flex-row justify-between items-center border-b border-white/10 pb-4 mb-4">
                                        <View>
                                            <Text className="text-white font-black text-lg">{flight.airlineName}</Text>
                                            <Text className="text-white/60 font-bold text-[10px] uppercase tracking-widest">{flight.flightNumber}</Text>
                                        </View>
                                        <View className="bg-[#F07E21] px-3 py-1.5 rounded-xl">
                                            <Text className="text-white font-black text-[10px] uppercase tracking-widest">{isInternational ? 'Intl' : 'Dom'}</Text>
                                        </View>
                                    </View>
                                    <View className="flex-row justify-between items-center mb-4">
                                        <View>
                                            <Text className="text-white text-3xl font-black">{flight.fromCity}</Text>
                                            <Text className="text-[#F07E21] font-black text-sm">{flight.departureTime}</Text>
                                        </View>
                                        <View className="items-center">
                                            <Text className="text-white/80 font-bold text-[10px] mb-1 tracking-wider">
                                                {calculateDuration(flight.departureTime, flight.arrivalTime)}
                                            </Text>
                                            <MaterialCommunityIcons name="airplane" size={24} color="#F07E21" />
                                            <Text className="text-white/60 font-black text-[9px] uppercase tracking-widest mt-1">Direct</Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-white text-3xl font-black">{flight.toCity}</Text>
                                            <Text className="text-[#F07E21] font-black text-sm">{flight.arrivalTime}</Text>
                                        </View>
                                    </View>
                                    <Text className="text-white/60 text-xs font-bold text-center mt-2 border-t border-white/10 pt-4">
                                        {new Date(flight.departureDate).toDateString()}
                                    </Text>
                                </View>

                                {/* Rules Card */}
                                <View className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                                    <View className="flex-row items-center gap-3 border-b border-gray-100 pb-4">
                                        <FontAwesome5 name="suitcase" size={20} color={t.primary} />
                                        <Text className="font-black text-[#1D4171] text-base">Baggage & Fare Rules</Text>
                                    </View>
                                    <View className="space-y-2">
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-gray-500 font-bold text-xs">Cabin Baggage</Text>
                                            <Text className="font-black text-gray-800 text-xs">7 KG per pax</Text>
                                        </View>
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-gray-500 font-bold text-xs">Check-in Baggage</Text>
                                            <Text className="font-black text-gray-800 text-xs">{isInternational ? '20 KG' : '15 KG'} per pax</Text>
                                        </View>
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-gray-500 font-bold text-xs">Cancellation</Text>
                                            <Text className="font-black text-red-500 text-xs uppercase">100% Non-Refundable</Text>
                                        </View>
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-gray-500 font-bold text-xs">GST & Taxes</Text>
                                            <Text className="font-black text-emerald-600 text-xs uppercase">Excluded / Not Applicable</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Next Button */}
                                <TouchableOpacity 
                                    onPress={() => setStep(2)}
                                    className="bg-[#1D4171] py-5 rounded-[2rem] items-center shadow-lg shadow-[#1D4171]/20 mt-4"
                                >
                                    <Text className="text-white font-black text-base uppercase tracking-widest">Continue to Travelers</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* STEP 2: PASSENGER DETAILS */}
                        {step === 2 && (
                            <View className="space-y-6">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-[#1D4171] font-black text-lg">Traveler Details</Text>
                                    <TouchableOpacity 
                                        onPress={handleAddPassenger}
                                        className="flex-row items-center gap-1.5 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100"
                                    >
                                        <Ionicons name="add" size={16} color={t.primary} />
                                        <Text className="text-[#1D4171] font-black text-[10px] uppercase tracking-wider">Add Traveler</Text>
                                    </TouchableOpacity>
                                </View>

                                {passengers.map((p, index) => (
                                    <View key={index} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm mb-6 space-y-4">
                                        <View className="flex-row justify-between items-center border-b border-gray-100 pb-4">
                                            <View className="flex-row items-center gap-3">
                                                <View className="w-8 h-8 bg-[#1D4171] rounded-xl items-center justify-center">
                                                    <Text className="text-white font-black text-xs">{index + 1}</Text>
                                                </View>
                                                <Text className="font-black text-[#1D4171] text-base">Passenger {index + 1}</Text>
                                            </View>
                                            {passengers.length > 1 && (
                                                <TouchableOpacity onPress={() => handleRemovePassenger(index)} className="bg-red-50 p-2 rounded-xl">
                                                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <View className="space-y-4 pt-2">
                                            <View className="flex-row gap-4">
                                                <View className="flex-1">
                                                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">First Name</Text>
                                                    <TextInput 
                                                        className="bg-gray-50 p-4 rounded-2xl font-bold text-gray-800 border border-gray-100"
                                                        placeholder="e.g. John"
                                                        value={p.firstName}
                                                        onChangeText={text => handleInputChange(index, 'firstName', text)}
                                                    />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Last Name</Text>
                                                    <TextInput 
                                                        className="bg-gray-50 p-4 rounded-2xl font-bold text-gray-800 border border-gray-100"
                                                        placeholder="e.g. Doe"
                                                        value={p.lastName}
                                                        onChangeText={text => handleInputChange(index, 'lastName', text)}
                                                    />
                                                </View>
                                            </View>
                                            <View className="flex-row gap-4">
                                                <View className="flex-1">
                                                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">DOB</Text>
                                                    <TouchableOpacity 
                                                        onPress={() => setActiveDobIndex(index)}
                                                        className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex-row items-center justify-between"
                                                    >
                                                        <Text className={`font-bold ${p.dob ? 'text-gray-800' : 'text-gray-400'}`}>
                                                            {p.dob || 'Select Date'}
                                                        </Text>
                                                        <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
                                                    </TouchableOpacity>
                                                </View>
                                                <View className="w-20">
                                                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Age</Text>
                                                    <TextInput 
                                                        className="bg-gray-50 p-4 rounded-2xl font-bold text-gray-800 border border-gray-100"
                                                        placeholder="28"
                                                        keyboardType="numeric"
                                                        value={p.age}
                                                        onChangeText={text => handleInputChange(index, 'age', text)}
                                                    />
                                                </View>
                                            </View>
                                            <View>
                                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Gender</Text>
                                                <View className="flex-row bg-gray-50 rounded-2xl p-1 border border-gray-100">
                                                    {['Male', 'Female'].map(g => (
                                                        <TouchableOpacity 
                                                            key={g}
                                                            onPress={() => handleInputChange(index, 'gender', g)}
                                                            className={`flex-1 py-3 items-center rounded-xl ${p.gender === g ? 'bg-white shadow-sm' : ''}`}
                                                        >
                                                            <Text className={`text-[10px] font-black uppercase ${p.gender === g ? 'text-[#1D4171]' : 'text-gray-300'}`}>{g}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </View>
                                            <View className="flex-row gap-4">
                                                <View className="flex-1">
                                                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Mobile No (Required)</Text>
                                                    <TextInput 
                                                        className="bg-gray-50 p-4 rounded-2xl font-bold text-gray-800 border border-gray-100"
                                                        placeholder="e.g. 9876543210"
                                                        keyboardType="phone-pad"
                                                        value={p.mobileNumber}
                                                        onChangeText={text => handleInputChange(index, 'mobileNumber', text)}
                                                    />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email (Required)</Text>
                                                    <TextInput 
                                                        className="bg-gray-50 p-4 rounded-2xl font-bold text-gray-800 border border-gray-100"
                                                        placeholder="traveler@example.com"
                                                        keyboardType="email-address"
                                                        value={p.email}
                                                        onChangeText={text => handleInputChange(index, 'email', text)}
                                                    />
                                                </View>
                                            </View>

                                            {/* International Passport Fields */}
                                            {isInternational && (
                                                <View className="space-y-4 pt-4 border-t border-gray-100">
                                                    <Text className="text-xs font-black text-[#F07E21] uppercase tracking-widest">Passport Information</Text>
                                                    <View>
                                                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Passport Number</Text>
                                                        <TextInput 
                                                            className="bg-blue-50/30 p-4 rounded-2xl font-bold text-gray-800 border border-blue-100 uppercase"
                                                            placeholder="A1234567"
                                                            value={p.passportNumber}
                                                            onChangeText={text => handleInputChange(index, 'passportNumber', text)}
                                                        />
                                                    </View>
                                                    <View className="flex-row gap-4">
                                                        <View className="flex-1">
                                                            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Expiry Date</Text>
                                                            <TextInput 
                                                                className="bg-blue-50/30 p-4 rounded-2xl font-bold text-gray-800 border border-blue-100"
                                                                placeholder="DD-MM-YYYY"
                                                                value={p.passportExpiry}
                                                                onChangeText={text => handleInputChange(index, 'passportExpiry', text)}
                                                            />
                                                        </View>
                                                        <View className="flex-1">
                                                            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nationality</Text>
                                                            <TextInput 
                                                                className="bg-blue-50/30 p-4 rounded-2xl font-bold text-gray-800 border border-blue-100 uppercase"
                                                                placeholder="IN"
                                                                value={p.nationality}
                                                                onChangeText={text => handleInputChange(index, 'nationality', text)}
                                                            />
                                                        </View>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))}

                                {/* Navigation Buttons */}
                                <View className="flex-row gap-4 mt-4">
                                    <TouchableOpacity 
                                        onPress={() => setStep(1)}
                                        className="flex-1 bg-gray-100 py-5 rounded-[2rem] items-center border border-gray-200"
                                    >
                                        <Text className="text-gray-600 font-black text-xs uppercase tracking-widest">Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => {
                                            if (validateStep2()) setStep(3);
                                        }}
                                        className="flex-[2] bg-[#1D4171] py-5 rounded-[2rem] items-center shadow-lg shadow-[#1D4171]/20"
                                    >
                                        <Text className="text-white font-black text-xs uppercase tracking-widest">Continue to Review</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* STEP 3: REVIEW & PAYMENT */}
                        {step === 3 && (
                            <View className="space-y-6">
                                <View className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                                    <Text className="text-[#1D4171] font-black text-lg border-b border-gray-100 pb-4">Booking Summary</Text>
                                    
                                    <View className="space-y-3 border-b border-gray-100 pb-4">
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest">Flight</Text>
                                            <Text className="font-black text-gray-800 text-sm">{flight.airlineName} ({flight.flightNumber})</Text>
                                        </View>
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest">Route</Text>
                                            <Text className="font-black text-gray-800 text-sm">{flight.fromCity} ✈️ {flight.toCity}</Text>
                                        </View>
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest">Date</Text>
                                            <Text className="font-black text-gray-800 text-sm">{new Date(flight.departureDate).toLocaleDateString()}</Text>
                                        </View>
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest">Sector</Text>
                                            <Text className="font-black text-[#F07E21] text-xs uppercase tracking-wider">{isInternational ? 'International' : 'Domestic'}</Text>
                                        </View>
                                    </View>

                                    <Text className="text-[#1D4171] font-black text-base pt-2">Travelers ({passengers.length})</Text>
                                    <View className="space-y-3">
                                        {passengers.map((p, idx) => (
                                            <View key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                <View className="flex-row justify-between items-center">
                                                    <Text className="font-black text-gray-800 text-sm">{p.firstName} {p.lastName}</Text>
                                                    <Text className="font-bold text-gray-400 text-xs">{p.gender} • DOB: {p.dob} ({p.age} yrs)</Text>
                                                </View>
                                                {isInternational && (
                                                    <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-200/60">
                                                        <Text className="text-[10px] font-bold text-gray-500 uppercase">Passport: {p.passportNumber}</Text>
                                                        <Text className="text-[10px] font-bold text-gray-500 uppercase">Exp: {p.passportExpiry}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Payment Breakdown Card */}
                                <View className="bg-white p-6 rounded-[2.5rem] border-2 border-[#1D4171] shadow-xl space-y-4">
                                    <Text className="text-[#1D4171] font-black text-lg border-b border-gray-100 pb-4">Payment Calculation</Text>
                                    
                                    <View className="space-y-3 border-b border-gray-100 pb-4">
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-gray-500 font-bold text-xs">Fare per seat</Text>
                                            <Text className="font-black text-gray-800 text-sm">₹{flight.fare}</Text>
                                        </View>
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-gray-500 font-bold text-xs">Travelers</Text>
                                            <Text className="font-black text-gray-800 text-sm">x{passengers.length}</Text>
                                        </View>
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-gray-500 font-bold text-xs">GST & Taxes</Text>
                                            <Text className="font-black text-emerald-600 text-xs uppercase tracking-wider">Not Applicable / Excluded</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between items-center pt-2">
                                        <View>
                                            <Text className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Total Net Payable</Text>
                                            <Text className="text-3xl font-black text-[#1D4171]">₹{totalFare}</Text>
                                        </View>
                                        <View className="bg-orange-50 p-3 rounded-2xl border border-orange-100">
                                            <Ionicons name="wallet" size={24} color="#F07E21" />
                                        </View>
                                    </View>
                                </View>

                                {/* Wallet Warning */}
                                <View className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex-row items-center gap-3">
                                    <MaterialCommunityIcons name="shield-lock" size={24} color="#1D4171" />
                                    <Text className="flex-1 text-[11px] font-bold text-[#1D4171] leading-relaxed">
                                        Clicking confirm will securely deduct ₹{totalFare} from your B2B wallet balance.
                                    </Text>
                                </View>

                                {/* Navigation Buttons */}
                                <View className="flex-row gap-4 mt-2">
                                    <TouchableOpacity 
                                        disabled={submitting}
                                        onPress={() => setStep(2)}
                                        className="flex-1 bg-gray-100 py-5 rounded-[2rem] items-center border border-gray-200"
                                    >
                                        <Text className="text-gray-600 font-black text-xs uppercase tracking-widest">Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        disabled={submitting}
                                        onPress={handleSubmit}
                                        className="flex-[2] bg-[#1D4171] py-5 rounded-[2rem] items-center shadow-lg shadow-[#1D4171]/20 flex-row justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <>
                                                <Text className="text-white font-black text-xs uppercase tracking-widest">Confirm & Pay</Text>
                                                <Ionicons name="checkmark-circle" size={16} color="white" />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <View style={{ height: 120 }} />
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* DOB Calendar Modal */}
                <Modal
                    visible={activeDobIndex !== null}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setActiveDobIndex(null)}
                >
                    <View className="flex-1 justify-center items-center bg-black/50 p-4">
                        <View className="bg-white rounded-3xl overflow-hidden w-full max-w-sm p-4 shadow-2xl">
                            <View className="flex-row justify-between items-center mb-4 px-2 pt-2">
                                <Text className="font-black text-lg text-[#1D4171]">Select Date of Birth</Text>
                                <TouchableOpacity onPress={() => setActiveDobIndex(null)} className="bg-gray-100 p-2 rounded-full">
                                    <Ionicons name="close" size={20} color="#1E293B" />
                                </TouchableOpacity>
                            </View>
                            <Calendar
                                current={'2000-01-01'}
                                maxDate={new Date().toISOString().split('T')[0]}
                                onDayPress={(day) => {
                                    handleInputChange(activeDobIndex, 'dob', day.dateString);
                                    setActiveDobIndex(null);
                                }}
                                theme={{
                                    todayTextColor: '#F07E21',
                                    arrowColor: '#1D4171',
                                    selectedDayBackgroundColor: '#1D4171',
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
