import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';
import { fixedDepartureService, authService } from '../../services/api';

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

export default function FixedDepartureBookingScreen({ route, navigation }) {
    const t = useThemeColors();
    const { flight, pax: paxConfig } = route.params;

    const [step, setStep] = useState(1);
    const [isInternational, setIsInternational] = useState(flight?.isInternational || false);

    // Dynamic checkout details from backend
    const [latestFlight, setLatestFlight] = useState(flight);
    const [agentBalance, setAgentBalance] = useState(0);
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [loadingFlight, setLoadingFlight] = useState(true);

    // DOB state tracking: activeDobIndex is passenger index to edit DOB, activeDobField is either 'dob' or 'passportExpiry'
    const [activeDateIndex, setActiveDateIndex] = useState(null);
    const [activeDateField, setActiveDateField] = useState('dob'); // 'dob' or 'passportExpiry'
    
    const [submitting, setSubmitting] = useState(false);

    // Pre-populate passenger list from search config (matching Web)
    const [passengers, setPassengers] = useState(() => {
        const initial = [];
        const adultsCount = paxConfig?.adults || 1;
        const childrenCount = paxConfig?.children || 0;
        const infantsCount = paxConfig?.infants || 0;

        for (let i = 0; i < adultsCount; i++) {
            initial.push({ passengerType: 'Adult', gender: 'Male', firstName: '', lastName: '', dob: '', age: '', mobileNumber: '', email: '', passportNumber: '', passportExpiry: '', nationality: 'IN' });
        }
        for (let i = 0; i < childrenCount; i++) {
            initial.push({ passengerType: 'Child', gender: 'Male', firstName: '', lastName: '', dob: '', age: '', mobileNumber: '', email: '', passportNumber: '', passportExpiry: '', nationality: 'IN' });
        }
        for (let i = 0; i < infantsCount; i++) {
            initial.push({ passengerType: 'Infant', gender: 'Male', firstName: '', lastName: '', dob: '', age: '', mobileNumber: '', email: '', passportNumber: '', passportExpiry: '', nationality: 'IN' });
        }
        return initial;
    });

    useEffect(() => {
        const fetchDynamicDetails = async () => {
            try {
                // 1. Fetch live agent profile for real-time wallet balance verification
                const balanceRes = await authService.getProfile();
                if (balanceRes.success && balanceRes.data) {
                    setAgentBalance(balanceRes.data.walletBalance || 0);
                }

                // 2. Query flight search dynamically using departure date to get fresh seat counts & price
                const dateStr = flight.departureDate ? flight.departureDate.split('T')[0] : '';
                const flightRes = await fixedDepartureService.searchFlights(flight.fromCity, flight.toCity, dateStr);
                if (flightRes.success && flightRes.data) {
                    const matchedFlight = flightRes.data.find(f => f._id === flight._id);
                    if (matchedFlight) {
                        setLatestFlight(matchedFlight);
                    }
                }
            } catch (error) {
                console.error('Failed to load dynamic checkout data', error);
            } finally {
                setLoadingBalance(false);
                setLoadingFlight(false);
            }
        };
        fetchDynamicDetails();
    }, [flight._id]);

    if (!flight) {
        navigation.goBack();
        return null;
    }

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
        for (let i = 0; i < passengers.length; i++) {
            const p = passengers[i];
            const isDobRequired = isInternational || p.passengerType === 'Child' || p.passengerType === 'Infant';
            
            if (!p.firstName || !p.lastName || !p.mobileNumber || !p.email) {
                Alert.alert('Missing Details', `Please fill in First Name, Last Name, Mobile Number, and Email ID for Passenger ${i + 1}.`);
                return false;
            }
            if (isDobRequired && !p.dob) {
                Alert.alert('Missing DOB', `Date of Birth is required for Passenger ${i + 1} (${p.passengerType}).`);
                return false;
            }
            if (isInternational) {
                if (!p.passportNumber || !p.passportExpiry || !p.nationality) {
                    Alert.alert('Passport Required', `Please fill in Passport details for Passenger ${i + 1}.`);
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
            const bookingData = {
                flightId: latestFlight._id,
                passengers,
                isInternational,
                adults: paxConfig?.adults || 1,
                children: paxConfig?.children || 0,
                infants: paxConfig?.infants || 0
            };
            const res = await fixedDepartureService.bookFlight(bookingData);
            if (res.success) {
                Alert.alert('Booking Success', 'Your fixed departure booking request has been submitted successfully!');
                navigation.replace('FixedDepartureHistory');
            }
        } catch (error) {
            Alert.alert('Booking Failed', error.response?.data?.message || 'Wallet deduction failed. Please check balance.');
        } finally {
            setSubmitting(false);
        }
    };

    const adultsCount = paxConfig?.adults || 1;
    const childrenCount = paxConfig?.children || 0;
    const infantsCount = paxConfig?.infants || 0;
    const adultTotal = adultsCount * latestFlight.fare;
    const childTotal = childrenCount * (latestFlight.childFare || 0);
    const infantTotal = infantsCount * (latestFlight.infantFare || 0);
    const totalFare = adultTotal + childTotal + infantTotal;

    const openDatePicker = (index, field) => {
        setActiveDateIndex(index);
        setActiveDateField(field);
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style={t.isDark ? 'light' : 'dark'} />
            <SafeAreaView className="flex-1" edges={['top']}>
                
                <View style={{ borderBottomColor: t.cardBorder, backgroundColor: t.card }} className="px-5 py-4 border-b">
                    <View className="flex-row justify-between items-center mb-3.5">
                        <TouchableOpacity 
                            onPress={() => navigation.goBack()}
                            style={{ backgroundColor: t.isDark ? '#1e293b' : '#f8fafc', borderColor: t.cardBorder }}
                            className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border"
                        >
                            <Ionicons name="arrow-back" size={13} color={t.textSecondary} />
                            <Text style={{ color: t.textSecondary }} className="font-black uppercase text-[10px] tracking-widest">Exit Checkout</Text>
                        </TouchableOpacity>
                        <View style={{ backgroundColor: t.isDark ? 'rgba(240,126,33,0.1)' : 'rgba(29,65,113,0.06)', borderColor: t.isDark ? 'rgba(240,126,33,0.2)' : 'rgba(29,65,113,0.1)' }} className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg border">
                            <MaterialCommunityIcons name="shield-airplane" size={14} color="#F07E21" />
                            <Text style={{ color: t.isDark ? '#F07E21' : '#1D4171' }} className="font-black text-[10px] uppercase tracking-wider">Fixed Departure Portal</Text>
                        </View>
                    </View>

                    <View className="flex-row justify-between items-center px-2">
                        <View className="flex-row items-center gap-2">
                            <View style={{ backgroundColor: step >= 1 ? '#1D4171' : (t.isDark ? '#1e293b' : '#f1f5f9') }} className="w-6.5 h-6.5 rounded-xl items-center justify-center shadow-xs">
                                <Text style={{ color: step >= 1 ? '#ffffff' : t.textMuted }} className="font-black text-[11px]">1</Text>
                            </View>
                            <Text style={{ color: step >= 1 ? t.text : t.textMuted }} className="font-black text-[11px] uppercase tracking-wider">Itinerary</Text>
                        </View>
                        <View style={{ backgroundColor: step >= 2 ? '#1D4171' : (t.isDark ? '#334155' : '#e2e8f0') }} className="h-[1.5px] flex-1 mx-3" />
                        <View className="flex-row items-center gap-2">
                            <View style={{ backgroundColor: step >= 2 ? '#1D4171' : (t.isDark ? '#1e293b' : '#f1f5f9') }} className="w-6.5 h-6.5 rounded-xl items-center justify-center shadow-xs">
                                <Text style={{ color: step >= 2 ? '#ffffff' : t.textMuted }} className="font-black text-[11px]">2</Text>
                            </View>
                            <Text style={{ color: step >= 2 ? t.text : t.textMuted }} className="font-black text-[11px] uppercase tracking-wider">Travelers</Text>
                        </View>
                        <View style={{ backgroundColor: step >= 3 ? '#1D4171' : (t.isDark ? '#334155' : '#e2e8f0') }} className="h-[1.5px] flex-1 mx-3" />
                        <View className="flex-row items-center gap-2">
                            <View style={{ backgroundColor: step >= 3 ? '#1D4171' : (t.isDark ? '#1e293b' : '#f1f5f9') }} className="w-6.5 h-6.5 rounded-xl items-center justify-center shadow-xs">
                                <Text style={{ color: step >= 3 ? '#ffffff' : t.textMuted }} className="font-black text-[11px]">3</Text>
                            </View>
                            <Text style={{ color: step >= 3 ? t.text : t.textMuted }} className="font-black text-[11px] uppercase tracking-wider">Pay</Text>
                        </View>
                    </View>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
                        
                        {loadingFlight || loadingBalance ? (
                            <View className="flex-1 justify-center items-center py-20">
                                <ActivityIndicator size="large" color="#1D4171" />
                                <Text style={{ color: t.textSecondary }} className="font-black text-xs uppercase tracking-widest mt-4">Retrieving secure checkout details...</Text>
                            </View>
                        ) : (
                            <>
                                {/* STEP 1: FLIGHT DETAILS & POLICY */}
                                {step === 1 && (
                                    <View className="space-y-4 pb-10">
                                        <View className="mb-1">
                                            <Text style={{ color: t.text }} className="text-xl font-black">Flight Itinerary & Policy</Text>
                                            <Text style={{ color: t.textMuted }} className="font-bold uppercase text-[9px] tracking-widest mt-0.5">Review your selected Fixed Departure schedule and sector rules</Text>
                                        </View>

                                        {/* Seats Left Banner / Insufficient Seats Warning */}
                                        {latestFlight.availableSeats < (adultsCount + childrenCount) ? (
                                            <View style={{ backgroundColor: t.isDark ? '#3b0f0f' : '#fef2f2', borderColor: t.isDark ? '#7f1d1d' : '#fecaca' }} className="p-4 rounded-2xl border flex-row items-center justify-between shadow-xs">
                                                <View className="flex-row items-center gap-2 flex-1 mr-2">
                                                    <Ionicons name="alert-circle" size={18} color="#ef4444" />
                                                    <Text style={{ color: t.isDark ? '#fca5a5' : '#b91c1c' }} className="font-black text-[11px] uppercase tracking-wider flex-1">
                                                        Insufficient Seats (Only {latestFlight.availableSeats} left, you requested {adultsCount + childrenCount})
                                                    </Text>
                                                </View>
                                            </View>
                                        ) : (
                                            <View style={{ backgroundColor: t.isDark ? '#2e1907' : '#fffbeb', borderColor: t.isDark ? '#78350f' : '#fef3c7' }} className="p-4 rounded-2xl border flex-row items-center justify-between shadow-xs">
                                                <View className="flex-row items-center gap-2">
                                                    <View className="w-2 h-2 rounded-full bg-amber-500" />
                                                    <Text style={{ color: t.isDark ? '#f59e0b' : '#b45309' }} className="font-black text-[11px] uppercase tracking-wider">Seat Availability Status</Text>
                                                </View>
                                                <View className="bg-amber-500 px-3.5 py-1.5 rounded-xl shadow-xs">
                                                    <Text className="text-white font-black text-xs">{latestFlight.availableSeats} Seats Left</Text>
                                                </View>
                                            </View>
                                        )}

                                        {/* Sector Details Option info */}
                                        <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-5 rounded-3xl border shadow-xs">
                                            <View className="flex-row items-center gap-3">
                                                <View style={{ backgroundColor: '#1D4171' }} className="w-10 h-10 rounded-xl items-center justify-center shadow-xs">
                                                    <Text className="text-lg">{isInternational ? '🌐' : '🇮🇳'}</Text>
                                                </View>
                                                <View className="flex-1">
                                                    <View className="flex-row items-center gap-2">
                                                        <Text style={{ color: t.text }} className="font-black text-sm">
                                                            {isInternational ? 'International Route' : 'Domestic Route'}
                                                        </Text>
                                                        <View style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }} className="px-2 py-0.5 rounded border">
                                                            <Text className="text-emerald-800 text-[8px] font-black uppercase tracking-widest">Auto-Detected</Text>
                                                        </View>
                                                    </View>
                                                    <Text style={{ color: t.textSecondary }} className="text-[10px] font-bold mt-0.5 leading-relaxed">
                                                        {isInternational ? 'Passport & Visa details required for booking manifest' : 'Valid Govt. ID required for check-in verification'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Flight Itinerary Card */}
                                        <View style={{ backgroundColor: '#1D4171' }} className="p-6 rounded-[2rem] shadow-md relative overflow-hidden">
                                            <View className="absolute -right-8 -bottom-8 opacity-10 select-none">
                                                <FontAwesome5 name="plane" size={100} color="#ffffff" />
                                            </View>
                                            <View className="flex-row justify-between items-center border-b border-white/10 pb-3.5 mb-4">
                                                <View className="flex-row items-center gap-2">
                                                    <Text className="text-lg">✈️</Text>
                                                    <View>
                                                        <Text className="text-white font-black text-base">{latestFlight.airlineName}</Text>
                                                        <Text className="text-white/60 font-bold text-[9px] uppercase tracking-widest">Flight No: {latestFlight.flightNumber}</Text>
                                                    </View>
                                                </View>
                                                <View className="bg-[#F07E21] px-3 py-1 rounded-lg">
                                                    <Text className="text-white font-black text-[9px] uppercase tracking-widest">{isInternational ? 'Intl Sector' : 'Dom Sector'}</Text>
                                                </View>
                                            </View>

                                            <View className="flex-row justify-between items-center">
                                                <View className="flex-1">
                                                    <Text className="text-white/70 font-black text-[10px] uppercase tracking-wider mb-1">Departure</Text>
                                                    <Text className="text-white text-2xl font-black capitalize" numberOfLines={1}>{latestFlight.fromCity}</Text>
                                                    <Text className="text-[#F07E21] font-black text-lg mt-0.5">{latestFlight.departureTime}</Text>
                                                    <Text className="text-white/80 text-[10px] font-bold mt-1">{formatDisplayDate(latestFlight.departureDate)}</Text>
                                                </View>
                                                <View className="items-center px-3">
                                                    <Text className="text-white font-bold text-xs mb-1.5">
                                                        {calculateDuration(latestFlight.departureTime, latestFlight.arrivalTime)}
                                                    </Text>
                                                    <View className="flex-row items-center justify-center w-14 mb-1">
                                                        <View className="h-[1.5px] bg-white/20 flex-1" />
                                                        <FontAwesome5 name="plane-departure" size={12} color="#F07E21" className="mx-1" />
                                                        <View className="h-[1.5px] bg-white/20 flex-1" />
                                                    </View>
                                                    <Text className="text-white/50 font-black text-[8px] uppercase tracking-widest">Direct</Text>
                                                </View>
                                                <View className="flex-1 items-end">
                                                    <Text className="text-white/70 font-black text-[10px] uppercase tracking-wider mb-1">Arrival</Text>
                                                    <Text className="text-white text-2xl font-black capitalize" numberOfLines={1}>{latestFlight.toCity}</Text>
                                                    <Text className="text-[#F07E21] font-black text-lg mt-0.5">{latestFlight.arrivalTime}</Text>
                                                    <Text className="text-white/80 text-[10px] font-bold mt-1">{formatDisplayDate(latestFlight.departureDate)}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Rules Card */}
                                        <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-5.5 rounded-3xl border shadow-xs space-y-4">
                                            <View className="flex-row items-center gap-2.5 border-b pb-3" style={{ borderBottomColor: t.isDark ? '#334155' : '#f1f5f9' }}>
                                                <FontAwesome5 name="suitcase" size={16} color={t.primary} />
                                                <Text style={{ color: t.text }} className="font-black text-sm">Baggage & Cancellation Rules</Text>
                                            </View>
                                            
                                            <View className="space-y-3">
                                                <View className="flex-row justify-between items-start">
                                                    <View className="flex-1">
                                                        <Text style={{ color: t.textSecondary }} className="font-black text-xs">Baggage Allowance</Text>
                                                        <Text style={{ color: t.textMuted }} className="text-[10px] font-bold mt-0.5">• Cabin Baggage: 7 KG</Text>
                                                        <Text style={{ color: t.textMuted }} className="text-[10px] font-bold">• Check-in: {isInternational ? '30 KG (International)' : '15 KG (Domestic)'}</Text>
                                                    </View>
                                                </View>
                                                
                                                <View className="h-[1px]" style={{ backgroundColor: t.isDark ? '#334155' : '#f1f5f9' }} />
                                                
                                                <View className="flex-row justify-between items-start">
                                                    <View className="flex-1">
                                                        <Text style={{ color: t.textSecondary }} className="font-black text-xs">Cancellation Policy</Text>
                                                        <Text className="text-red-500 text-[10px] font-bold mt-0.5">• Ticket: 100% Non-Refundable</Text>
                                                        <Text style={{ color: t.textMuted }} className="text-[10px] font-bold">• Date Change: Not Permitted</Text>
                                                        <Text className="text-emerald-600 text-[10px] font-bold">• GST Status: Excluded / Pre-Settled</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Next Button */}
                                        <View className="pt-2">
                                            <View className="flex-row justify-between items-center mb-4">
                                                <View>
                                                    <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest">Base Fare Per Passenger</Text>
                                                    <Text style={{ color: t.text }} className="text-xl font-black">₹{latestFlight.fare}</Text>
                                                </View>
                                                <Text className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">No GST Applicable</Text>
                                            </View>
                                            
                                            <TouchableOpacity 
                                                disabled={latestFlight.availableSeats < (adultsCount + childrenCount)}
                                                onPress={() => setStep(2)}
                                                style={{ backgroundColor: latestFlight.availableSeats < (adultsCount + childrenCount) ? '#94a3b8' : '#1D4171' }}
                                                className="py-4.5 rounded-2xl items-center shadow-lg active:opacity-90 flex-row justify-center gap-2"
                                            >
                                                <Text className="text-white font-black text-xs uppercase tracking-widest">
                                                    {latestFlight.availableSeats < (adultsCount + childrenCount) ? 'INSUFFICIENT SEATS' : 'Continue to Travelers'}
                                                </Text>
                                                <Ionicons name="arrow-forward" size={14} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                {/* STEP 2: TRAVELERS MANIFEST */}
                                {step === 2 && (
                                    <View className="space-y-5 pb-10">
                                        <View className="mb-1">
                                            <Text style={{ color: t.text }} className="text-xl font-black">Travelers Information</Text>
                                            <Text style={{ color: t.textMuted }} className="font-bold uppercase text-[9px] tracking-widest mt-0.5">
                                                {isInternational ? 'International Sector: Passport details are mandatory' : 'Domestic Sector: Enter names as per valid Govt. ID'}
                                            </Text>
                                        </View>

                                        {passengers.map((p, index) => {
                                            const isDobRequired = isInternational || p.passengerType === 'Child' || p.passengerType === 'Infant';
                                            return (
                                                <View key={index} style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-5.5 rounded-3xl border shadow-xs space-y-4">
                                                    
                                                    <View style={{ borderBottomColor: t.isDark ? '#334155' : '#f1f5f9' }} className="flex-row justify-between items-center border-b pb-3">
                                                        <View className="flex-row items-center gap-2">
                                                            <View style={{ backgroundColor: '#1D4171' }} className="w-6.5 h-6.5 rounded-lg items-center justify-center">
                                                                <Text className="text-white font-black text-[11px]">{index + 1}</Text>
                                                            </View>
                                                            <Text style={{ color: t.text }} className="font-black text-sm">{p.passengerType} Traveler</Text>
                                                        </View>
                                                    </View>

                                                    <View className="space-y-1">
                                                        <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest ml-1 mb-1">Gender</Text>
                                                        <View style={{ backgroundColor: t.input, borderColor: t.inputBorder }} className="flex-row rounded-2xl p-1 border">
                                                            {['Male', 'Female', 'Other'].map(genderOpt => {
                                                                const isSel = p.gender === genderOpt;
                                                                return (
                                                                    <TouchableOpacity 
                                                                        key={genderOpt}
                                                                        onPress={() => handleInputChange(index, 'gender', genderOpt)}
                                                                        style={{ backgroundColor: isSel ? '#1D4171' : 'transparent' }}
                                                                        className="flex-1 py-2.5 items-center rounded-xl"
                                                                    >
                                                                        <Text style={{ color: isSel ? '#ffffff' : t.textSecondary }} className="text-[10px] font-black uppercase tracking-wider">{genderOpt}</Text>
                                                                    </TouchableOpacity>
                                                                );
                                                            })}
                                                        </View>
                                                    </View>

                                                    <View className="flex-row gap-3">
                                                        <View className="flex-1 space-y-1">
                                                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest ml-1">First Name</Text>
                                                            <View style={{ backgroundColor: t.input, borderColor: t.inputBorder }} className="flex-row items-center border rounded-2xl px-3.5 py-3">
                                                                <Ionicons name="person-outline" size={15} color={t.textMuted} className="mr-2" />
                                                                <TextInput 
                                                                    style={{ color: t.text }} 
                                                                    className="flex-1 font-bold text-xs"
                                                                    placeholder="First name"
                                                                    placeholderTextColor={t.placeholder}
                                                                    value={p.firstName}
                                                                    onChangeText={text => handleInputChange(index, 'firstName', text)}
                                                                />
                                                            </View>
                                                        </View>
                                                        <View className="flex-1 space-y-1">
                                                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest ml-1">Last Name</Text>
                                                            <View style={{ backgroundColor: t.input, borderColor: t.inputBorder }} className="flex-row items-center border rounded-2xl px-3.5 py-3">
                                                                <Ionicons name="person-outline" size={15} color={t.textMuted} className="mr-2" />
                                                                <TextInput 
                                                                    style={{ color: t.text }} 
                                                                    className="flex-1 font-bold text-xs"
                                                                    placeholder="Last name"
                                                                    placeholderTextColor={t.placeholder}
                                                                    value={p.lastName}
                                                                    onChangeText={text => handleInputChange(index, 'lastName', text)}
                                                                />
                                                            </View>
                                                        </View>
                                                    </View>

                                                    <View className="flex-row gap-3">
                                                        <View className="flex-[2] space-y-1">
                                                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest ml-1">
                                                                Date of Birth {isDobRequired ? '(Required)' : '(Optional)'}
                                                            </Text>
                                                            <TouchableOpacity 
                                                                onPress={() => openDatePicker(index, 'dob')}
                                                                style={{ backgroundColor: t.input, borderColor: t.inputBorder }}
                                                                className="flex-row items-center border rounded-2xl px-3.5 py-3 justify-between"
                                                            >
                                                                <View className="flex-row items-center flex-1">
                                                                    <Ionicons name="calendar-outline" size={15} color={t.textMuted} className="mr-2" />
                                                                    <Text style={{ color: p.dob ? t.text : t.placeholder }} className="font-bold text-xs">
                                                                        {p.dob ? formatDisplayDate(p.dob) : 'Select DOB'}
                                                                    </Text>
                                                                </View>
                                                                <Ionicons name="chevron-down" size={14} color={t.textMuted} />
                                                            </TouchableOpacity>
                                                        </View>
                                                        <View className="flex-1 space-y-1">
                                                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest ml-1">Age</Text>
                                                            <View style={{ backgroundColor: t.input, borderColor: t.inputBorder }} className="flex-row items-center border rounded-2xl px-3.5 py-3">
                                                                <TextInput 
                                                                    style={{ color: t.text }} 
                                                                    className="flex-1 font-bold text-xs text-center"
                                                                    placeholder="Age"
                                                                    placeholderTextColor={t.placeholder}
                                                                    keyboardType="numeric"
                                                                    value={p.age}
                                                                    onChangeText={text => handleInputChange(index, 'age', text)}
                                                                />
                                                            </View>
                                                        </View>
                                                    </View>

                                                    <View className="space-y-3">
                                                        <View className="space-y-1">
                                                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest ml-1">Mobile Number</Text>
                                                            <View style={{ backgroundColor: t.input, borderColor: t.inputBorder }} className="flex-row items-center border rounded-2xl px-3.5 py-3">
                                                                <Ionicons name="call-outline" size={15} color={t.textMuted} className="mr-2" />
                                                                <TextInput 
                                                                    style={{ color: t.text }} 
                                                                    className="flex-1 font-bold text-xs"
                                                                    placeholder="Mobile Number"
                                                                    placeholderTextColor={t.placeholder}
                                                                    keyboardType="phone-pad"
                                                                    value={p.mobileNumber}
                                                                    onChangeText={text => handleInputChange(index, 'mobileNumber', text)}
                                                                />
                                                            </View>
                                                        </View>
                                                        
                                                        <View className="space-y-1">
                                                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest ml-1">Email Address</Text>
                                                            <View style={{ backgroundColor: t.input, borderColor: t.inputBorder }} className="flex-row items-center border rounded-2xl px-3.5 py-3">
                                                                <Ionicons name="mail-outline" size={15} color={t.textMuted} className="mr-2" />
                                                                <TextInput 
                                                                    style={{ color: t.text }} 
                                                                    className="flex-1 font-bold text-xs"
                                                                    placeholder="traveler@email.com"
                                                                    placeholderTextColor={t.placeholder}
                                                                    keyboardType="email-address"
                                                                    value={p.email}
                                                                    onChangeText={text => handleInputChange(index, 'email', text)}
                                                                />
                                                            </View>
                                                        </View>
                                                    </View>

                                                    {isInternational && (
                                                        <View style={{ backgroundColor: t.isDark ? 'rgba(72,160,212,0.06)' : 'rgba(29,65,113,0.03)', borderColor: t.isDark ? '#1e3a8a' : '#bfdbfe' }} className="p-4 rounded-2xl border space-y-3.5 mt-2">
                                                            <Text className="text-[10px] font-black text-[#F07E21] uppercase tracking-widest">Passport Details</Text>
                                                            
                                                            <View className="space-y-1">
                                                                <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase tracking-widest ml-1">Passport Number</Text>
                                                                <View style={{ backgroundColor: t.card, borderColor: t.isDark ? '#334155' : '#bfdbfe' }} className="flex-row items-center border rounded-xl px-3.5 py-2.5">
                                                                    <Ionicons name="card-outline" size={14} color={t.textMuted} className="mr-2" />
                                                                    <TextInput 
                                                                        style={{ color: t.text }} 
                                                                        className="flex-1 font-bold text-xs uppercase"
                                                                        placeholder="e.g. A1234567"
                                                                        placeholderTextColor={t.placeholder}
                                                                        value={p.passportNumber}
                                                                        onChangeText={text => handleInputChange(index, 'passportNumber', text)}
                                                                    />
                                                                </View>
                                                            </View>

                                                            <View className="flex-row gap-3">
                                                                <View className="flex-1 space-y-1">
                                                                    <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase tracking-widest ml-1">Expiry Date</Text>
                                                                    <TouchableOpacity 
                                                                        onPress={() => openDatePicker(index, 'passportExpiry')}
                                                                        style={{ backgroundColor: t.card, borderColor: t.isDark ? '#334155' : '#bfdbfe' }}
                                                                        className="flex-row items-center border rounded-xl px-3 py-2.5 justify-between"
                                                                    >
                                                                        <Text style={{ color: p.passportExpiry ? t.text : t.placeholder }} className="font-bold text-[11px]">
                                                                            {p.passportExpiry ? formatDisplayDate(p.passportExpiry) : 'Select Expiry'}
                                                                        </Text>
                                                                        <Ionicons name="calendar-outline" size={13} color={t.textMuted} />
                                                                    </TouchableOpacity>
                                                                </View>
                                                                <View className="flex-1 space-y-1">
                                                                    <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase tracking-widest ml-1">Nationality</Text>
                                                                    <View style={{ backgroundColor: t.card, borderColor: t.isDark ? '#334155' : '#bfdbfe' }} className="flex-row items-center border rounded-xl px-3.5 py-2.5">
                                                                        <Ionicons name="globe-outline" size={14} color={t.textMuted} className="mr-2" />
                                                                        <TextInput 
                                                                            style={{ color: t.text }} 
                                                                            className="flex-1 font-bold text-xs uppercase"
                                                                            placeholder="IN"
                                                                            placeholderTextColor={t.placeholder}
                                                                            value={p.nationality}
                                                                            onChangeText={text => handleInputChange(index, 'nationality', text)}
                                                                        />
                                                                    </View>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    )}
                                                </View>
                                            );
                                        })}

                                        <View className="flex-row gap-4.5 pt-2">
                                            <TouchableOpacity 
                                                onPress={() => setStep(1)}
                                                style={{ backgroundColor: t.isDark ? '#1e293b' : '#f1f5f9', borderColor: t.cardBorder }}
                                                className="flex-1 py-4 rounded-2xl items-center border"
                                            >
                                                <Text style={{ color: t.text }} className="font-black text-xs uppercase tracking-widest">Back</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                onPress={() => {
                                                    if (validateStep2()) setStep(3);
                                                }}
                                                style={{ backgroundColor: '#1D4171' }}
                                                className="flex-[2] py-4 rounded-2xl items-center shadow-lg shadow-[#1D4171]/20 flex-row justify-center gap-1.5"
                                            >
                                                <Text className="text-white font-black text-xs uppercase tracking-widest">Review Itinerary</Text>
                                                <Ionicons name="arrow-forward" size={14} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                {/* STEP 3: REVIEW & PAYMENT */}
                                {step === 3 && (
                                    <View className="space-y-5 pb-10">
                                        <View className="mb-1">
                                            <Text style={{ color: t.text }} className="text-xl font-black">Review & Confirm Booking</Text>
                                            <Text style={{ color: t.textMuted }} className="font-bold uppercase text-[9px] tracking-widest mt-0.5">Final verification of flight itinerary, passenger manifest, and wallet deduction</Text>
                                        </View>

                                        {/* Itinerary Summary Card */}
                                        <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-5.5 rounded-3xl border shadow-xs space-y-4">
                                            <Text style={{ color: t.text }} className="font-black text-sm border-b pb-3 mb-1" style={{ borderBottomColor: t.isDark ? '#334155' : '#f1f5f9' }}>Flight Itinerary Summary</Text>
                                            
                                            <View className="space-y-3 pb-1">
                                                <View className="flex-row justify-between items-center">
                                                    <Text style={{ color: t.textMuted }} className="font-bold text-xs uppercase tracking-wider">Airline</Text>
                                                    <Text style={{ color: t.text }} className="font-black text-sm">{latestFlight.airlineName} ({latestFlight.flightNumber})</Text>
                                                </View>
                                                <View className="flex-row justify-between items-center">
                                                    <Text style={{ color: t.textMuted }} className="font-bold text-xs uppercase tracking-wider">Sector</Text>
                                                    <Text style={{ color: t.text }} className="font-black text-sm capitalize">{latestFlight.fromCity} ✈️ {latestFlight.toCity}</Text>
                                                </View>
                                                <View className="flex-row justify-between items-center">
                                                    <Text style={{ color: t.textMuted }} className="font-bold text-xs uppercase tracking-wider">Date & Time</Text>
                                                    <Text style={{ color: t.text }} className="font-black text-xs">{formatDisplayDate(latestFlight.departureDate)} • {latestFlight.departureTime}</Text>
                                                </View>
                                                <View className="flex-row justify-between items-center">
                                                    <Text style={{ color: t.textMuted }} className="font-bold text-xs uppercase tracking-wider">Sector Type</Text>
                                                    <Text className="font-black text-[#F07E21] text-xs uppercase tracking-wider">{isInternational ? 'International' : 'Domestic'}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Passengers Manifest Summary */}
                                        <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-5.5 rounded-3xl border shadow-xs space-y-4">
                                            <Text style={{ color: t.text }} className="font-black text-sm border-b pb-3" style={{ borderBottomColor: t.isDark ? '#334155' : '#f1f5f9' }}>Passenger Manifest ({passengers.length})</Text>
                                            <View className="space-y-3">
                                                {passengers.map((p, idx) => (
                                                    <View key={idx} style={{ backgroundColor: t.isDark ? '#1e293b' : '#f9fafb', borderColor: t.cardBorder }} className="p-4 rounded-2xl border">
                                                        <View className="flex-row justify-between items-center">
                                                            <View className="flex-row items-center gap-2">
                                                                <View style={{ backgroundColor: '#1D4171' }} className="w-5.5 h-5.5 rounded-md items-center justify-center">
                                                                    <Text className="text-white font-black text-[10px]">{idx + 1}</Text>
                                                                </View>
                                                                <Text style={{ color: t.text }} className="font-black text-sm">{p.firstName} {p.lastName}</Text>
                                                            </View>
                                                            <Text style={{ color: t.textSecondary }} className="font-bold text-[11px]">{p.passengerType}</Text>
                                                        </View>
                                                        <Text style={{ color: t.textMuted }} className="text-[10px] font-bold mt-1.5 ml-7">
                                                            {p.gender} • DOB: {p.dob ? formatDisplayDate(p.dob) : 'N/A'} {p.age ? `(${p.age} yrs)` : ''}
                                                        </Text>
                                                        {isInternational && (
                                                            <View style={{ borderTopColor: t.isDark ? '#334155' : '#e2e8f0' }} className="flex-row justify-between items-center mt-2.5 pt-2 ml-7 border-t">
                                                                <Text style={{ color: t.textMuted }} className="text-[9px] font-bold uppercase">Passport: {p.passportNumber}</Text>
                                                                <Text style={{ color: t.textMuted }} className="text-[9px] font-bold uppercase">Exp: {p.passportExpiry ? formatDisplayDate(p.passportExpiry) : 'N/A'}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                ))}
                                            </View>
                                        </View>

                                        {/* Cost Breakdown & Wallet Settlement Card */}
                                        <View style={{ backgroundColor: t.card, borderColor: '#1D4171' }} className="p-6 rounded-3xl border-2 shadow-xl space-y-4">
                                            <View className="flex-row justify-between items-center border-b pb-3.5" style={{ borderBottomColor: t.isDark ? '#334155' : '#f1f5f9' }}>
                                                <Text style={{ color: t.text }} className="font-black text-base">Payment Breakup</Text>
                                                <View style={{ backgroundColor: '#ecfdf5' }} className="px-2 py-0.5 rounded">
                                                    <Text className="text-emerald-800 text-[8px] font-black uppercase tracking-widest">Instant Booking</Text>
                                                </View>
                                            </View>
                                            
                                            <View className="space-y-3 pb-3.5 border-b" style={{ borderBottomColor: t.isDark ? '#334155' : '#f1f5f9' }}>
                                                {adultsCount > 0 && (
                                                    <View className="flex-row justify-between items-center">
                                                        <Text style={{ color: t.textMuted }} className="font-bold text-xs">Adults Fare ({adultsCount}x)</Text>
                                                        <Text style={{ color: t.text }} className="font-black text-xs">₹{adultTotal}</Text>
                                                    </View>
                                                )}
                                                {childrenCount > 0 && (
                                                    <View className="flex-row justify-between items-center">
                                                        <Text style={{ color: t.textMuted }} className="font-bold text-xs">Children Fare ({childrenCount}x)</Text>
                                                        <Text style={{ color: t.text }} className="font-black text-xs">₹{childTotal}</Text>
                                                    </View>
                                                )}
                                                {infantsCount > 0 && (
                                                    <View className="flex-row justify-between items-center">
                                                        <Text style={{ color: t.textMuted }} className="font-bold text-xs">Infants Fare ({infantsCount}x)</Text>
                                                        <Text style={{ color: t.text }} className="font-black text-xs">₹{infantTotal}</Text>
                                                    </View>
                                                )}
                                                <View className="flex-row justify-between items-center">
                                                    <Text style={{ color: t.textMuted }} className="font-bold text-xs">GST & Surcharge</Text>
                                                    <Text className="font-black text-emerald-600 text-[10px] uppercase tracking-wider">Pre-Settled / Nil</Text>
                                                </View>
                                            </View>

                                            <View className="flex-row justify-between items-center pt-1.5">
                                                <View>
                                                    <Text style={{ color: t.textMuted }} className="font-black text-[9px] uppercase tracking-widest">Total Net Payable</Text>
                                                    <Text style={{ color: t.text }} className="text-2xl font-black">₹{totalFare}</Text>
                                                </View>
                                                <View className="items-end">
                                                    <Text style={{ color: t.textMuted }} className="font-black text-[9px] uppercase tracking-widest mb-0.5">Your Balance</Text>
                                                    <Text style={{ color: agentBalance < totalFare ? '#ef4444' : '#10b981' }} className="font-black text-sm">
                                                        {loadingBalance ? '...' : `₹${agentBalance.toLocaleString('en-IN')}`}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Wallet / Seats Status Warnings */}
                                        {agentBalance < totalFare ? (
                                            <View style={{ backgroundColor: t.isDark ? '#3b0f0f' : '#fef2f2', borderColor: t.isDark ? '#7f1d1d' : '#fecaca' }} className="p-4 rounded-2xl border flex-row items-start gap-3">
                                                <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
                                                <Text style={{ color: t.isDark ? '#fca5a5' : '#b91c1c' }} className="flex-1 text-[10px] font-bold leading-relaxed">
                                                    Insufficient Wallet Balance. Your B2B wallet balance (₹{agentBalance.toLocaleString('en-IN')}) is insufficient for this booking of ₹{totalFare.toLocaleString('en-IN')}. Please top up before checking out.
                                                </Text>
                                            </View>
                                        ) : latestFlight.availableSeats < (adultsCount + childrenCount) ? (
                                            <View style={{ backgroundColor: t.isDark ? '#3b0f0f' : '#fef2f2', borderColor: t.isDark ? '#7f1d1d' : '#fecaca' }} className="p-4 rounded-2xl border flex-row items-start gap-3">
                                                <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
                                                <Text style={{ color: t.isDark ? '#fca5a5' : '#b91c1c' }} className="flex-1 text-[10px] font-bold leading-relaxed">
                                                    Insufficient Seats Available. This flight only has {latestFlight.availableSeats} available seats, but you requested booking for {adultsCount + childrenCount} seat-consuming travelers.
                                                </Text>
                                            </View>
                                        ) : (
                                            <View style={{ backgroundColor: t.isDark ? 'rgba(72,160,212,0.1)' : '#eff6ff', borderColor: t.isDark ? '#1e3a8a' : '#bfdbfe' }} className="p-4 rounded-2xl border flex-row items-start gap-3">
                                                <Ionicons name="shield-checkmark-outline" size={20} color={t.isDark ? '#48A0D4' : '#1D4171'} />
                                                <Text style={{ color: t.isDark ? '#93c5fd' : '#1D4171' }} className="flex-1 text-[10px] font-bold leading-relaxed">
                                                    By confirming, the B2B agent balance of ₹{totalFare} will be deducted from your account wallet immediately to lock this departure seat.
                                                </Text>
                                            </View>
                                        )}

                                        {/* Submit / Back buttons */}
                                        <View className="flex-row gap-4.5 pt-2">
                                            <TouchableOpacity 
                                                disabled={submitting}
                                                onPress={() => setStep(2)}
                                                style={{ backgroundColor: t.isDark ? '#1e293b' : '#f1f5f9', borderColor: t.cardBorder }}
                                                className="flex-1 py-4 rounded-2xl items-center border disabled:opacity-50"
                                            >
                                                <Text style={{ color: t.text }} className="font-black text-xs uppercase tracking-widest">Back</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                disabled={submitting || agentBalance < totalFare || latestFlight.availableSeats < (adultsCount + childrenCount)}
                                                onPress={handleSubmit}
                                                style={{ backgroundColor: (agentBalance < totalFare || latestFlight.availableSeats < (adultsCount + childrenCount)) ? '#94a3b8' : '#1D4171' }}
                                                className="flex-[2] py-4 rounded-2xl items-center shadow-lg shadow-[#1D4171]/20 flex-row justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                {submitting ? (
                                                    <ActivityIndicator color="white" />
                                                ) : (
                                                    <>
                                                        <Text className="text-white font-black text-xs uppercase tracking-widest">
                                                            {agentBalance < totalFare ? 'Insufficient Balance' : latestFlight.availableSeats < (adultsCount + childrenCount) ? 'No Seats Left' : 'Confirm & Pay'}
                                                        </Text>
                                                        <Ionicons name="checkmark-circle-outline" size={15} color="white" />
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </>
                        )}

                        <View style={{ height: 60 }} />
                    </ScrollView>
                </KeyboardAvoidingView>

                <Modal
                    visible={activeDateIndex !== null}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setActiveDateIndex(null)}
                >
                    <View className="flex-1 justify-center items-center bg-black/60 p-5">
                        <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="w-full max-w-sm rounded-3xl overflow-hidden p-4.5 shadow-2xl border">
                            <View className="flex-row justify-between items-center mb-4 px-2 pt-2">
                                <Text style={{ color: t.text }} className="font-black text-base">
                                    {activeDateField === 'dob' ? 'Select Date of Birth' : 'Select Expiry Date'}
                                </Text>
                                <TouchableOpacity onPress={() => setActiveDateIndex(null)} style={{ backgroundColor: t.isDark ? '#1e293b' : '#f1f5f9' }} className="p-2 rounded-full">
                                    <Ionicons name="close" size={20} color={t.text} />
                                </TouchableOpacity>
                            </View>
                            <Calendar
                                current={activeDateField === 'dob' ? '2000-01-01' : undefined}
                                maxDate={activeDateField === 'dob' ? new Date().toISOString().split('T')[0] : undefined}
                                minDate={activeDateField === 'passportExpiry' ? new Date().toISOString().split('T')[0] : undefined}
                                onDayPress={(day) => {
                                    handleInputChange(activeDateIndex, activeDateField, day.dateString);
                                    setActiveDateIndex(null);
                                }}
                                theme={{
                                    calendarBackground: t.card,
                                    dayTextColor: t.text,
                                    monthTextColor: t.text,
                                    todayTextColor: '#F07E21',
                                    arrowColor: '#1D4171',
                                    selectedDayBackgroundColor: '#1D4171',
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
            </SafeAreaView>
        </View>
    );
}
