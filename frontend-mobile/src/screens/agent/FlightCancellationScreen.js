import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { bookingService } from '../../services/api';
import Toast from 'react-native-toast-message';

export default function FlightCancellationScreen({ navigation, route }) {
    const { id } = route.params; // Booking Reference
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(0); // 0: Form, 1: Double Confirm
    const [agreedToPolicy, setAgreedToPolicy] = useState(false);
    const [isWithin24Hours, setIsWithin24Hours] = useState(false);

    const [selectedPax, setSelectedPax] = useState([]);
    const [cancelReason, setCancelReason] = useState('Full Cancellation');
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const res = await bookingService.ftdGetBookingDetails(id);
                if (res.success) {
                    setBooking(res.data);
                    // Check if within 24 hours
                    const now = new Date();
                    const departureDate = new Date(res.data.travelDate);
                    const hoursUntilDeparture = (departureDate - now) / (1000 * 60 * 60);
                    if (hoursUntilDeparture < 24) {
                        setIsWithin24Hours(true);
                    }
                }
                else Toast.show({ type: 'error', text1: 'Error', text2: 'Could not load booking data.' });
            } catch (err) {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to sync with GDS.' });
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [id]);

    const togglePax = (index) => {
        const s = String(index);
        setSelectedPax(prev => prev.includes(s) ? prev.filter(p => p !== s) : [...prev, s]);
    };

    const handleInitialSubmit = () => {
        if (selectedPax.length === 0) return Toast.show({ type: 'info', text1: 'Selection Required', text2: 'Please select at least one passenger.' });
        setStep(1);
    };

    const handleFinalCancel = async () => {
        setSubmitting(true);
        try {
            const realPaxIds = selectedPax.map(i => {
                const pax = booking.passengerDetails[Number(i)];
                return pax?.paxID || pax?.paxId || String(Number(i) + 1);
            }).join(',');

            const res = await bookingService.ftdCancelFlight({
                refID: booking.ftdBookingRef || booking.providerReference || id,
                paxId: realPaxIds,
                canRemarks: remarks || cancelReason,
                canMode: selectedPax.length === booking.passengerDetails?.length ? 5 : 1
            });

            if (res.success) {
                Toast.show({ 
                    type: 'success', 
                    text1: 'Success', 
                    text2: 'Cancellation request submitted successfully.' 
                });
                setTimeout(() => navigation.navigate('Bookings'), 2000);
            } else {
                Toast.show({ type: 'error', text1: 'GDS Failure', text2: res.message || 'The airline rejected the cancellation request.' });
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Connection timeout.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <View className="flex-1 bg-white items-center justify-center">
            <ActivityIndicator size="large" color="#F07E21" />
            <Text className="mt-5 text-slate-400 font-black uppercase text-[10px] tracking-widest">Decrypting GDS Ticket...</Text>
        </View>
    );

    if (!booking) return (
        <View className="flex-1 bg-white items-center justify-center p-10">
            <Ionicons name="alert-circle" size={60} color="#F07E21" />
            <Text className="mt-4 text-slate-800 font-black text-center text-xl tracking-wide">Booking Not Found</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} className="mt-6 bg-slate-100 px-8 py-4 rounded-2xl border border-b-4 border-slate-200 active:scale-95 shadow-sm">
                <Text className="font-black text-slate-600 uppercase text-xs tracking-wider">Go Back</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
            <StatusBar style="light" />
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#1D4171' }}>
                <View className="px-5 py-5 flex-row items-center border-b border-blue-900/30 shadow-lg">
                    <TouchableOpacity onPress={() => step === 1 ? setStep(0) : navigation.goBack()} className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center border border-white/20 border-b-4 border-b-white/30 active:scale-95 shadow-sm mr-4">
                        <Ionicons name="arrow-back" size={22} color="#FFF" />
                    </TouchableOpacity>
                    <View className="flex-1 pr-2">
                        <Text className="text-white text-xl font-black uppercase tracking-wide">
                            Cancel Flight
                        </Text>
                        <Text className="text-white/50 text-[10px] font-black uppercase tracking-widest mt-0.5">
                            Ref: {id}
                        </Text>
                    </View>
                    <View className="bg-[#48A0D4] px-3.5 py-1.5 rounded-xl border border-blue-300 shadow-sm">
                        <Text className="text-slate-950 text-[9px] font-black uppercase tracking-widest">Secure & Fast</Text>
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                {step === 0 ? (
                    <View className="space-y-6">
                        {/* FLIGHT INFO */}
                        <View className="bg-white rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 overflow-hidden mb-6" style={{ elevation: 8 }}>
                            <View className="bg-[#1D4171] px-6 py-4 border-b border-[#15305B]">
                                <Text className="text-white font-black text-xs uppercase tracking-widest">
                                    {booking.fromCity} ⇄ {booking.toCity}
                                </Text>
                            </View>
                            <View className="p-6 flex-row items-center justify-between">
                                <View>
                                    <Text className="text-slate-400 font-black text-[10px] uppercase mb-1 tracking-widest">Airline</Text>
                                    <View className="flex-row items-center">
                                        <Ionicons name="airplane" size={16} color="#1D4171" className="mr-2.5" />
                                        <Text className="font-black text-slate-800 uppercase text-base tracking-wide">{booking.airline || 'Flight'}</Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="text-slate-400 font-black text-[10px] uppercase mb-1 tracking-widest">PNR</Text>
                                    <Text className="font-black text-[#F07E21] uppercase text-base tracking-wider font-mono bg-orange-50 px-3 py-1 rounded-xl border border-orange-100 shadow-sm">{booking.pnr || booking.providerReference}</Text>
                                </View>
                            </View>
                        </View>

                        {/* PASSENGER SELECTION */}
                        <View className="bg-white rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 overflow-hidden mb-6" style={{ elevation: 8 }}>
                            <View className="bg-[#1D4171] px-6 py-4 border-b border-[#15305B]">
                                <Text className="text-white font-black text-xs uppercase tracking-widest">Select Passengers</Text>
                            </View>
                            <View className="p-6">
                                {booking.passengerDetails?.map((p, i) => {
                                    const selected = selectedPax.includes(String(i));
                                    return (
                                        <TouchableOpacity 
                                            key={i} 
                                            onPress={() => togglePax(i)}
                                            className={`flex-row items-center p-5 rounded-2xl mb-3.5 border border-b-4 active:scale-95 shadow-sm ${selected ? 'bg-orange-50 border-orange-200 border-b-orange-300' : 'bg-slate-50 border-slate-100 border-b-slate-200'}`}
                                        >
                                            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center shadow-sm ${selected ? 'bg-[#F07E21] border-[#F07E21]' : 'border-slate-300 bg-white'}`}>
                                                {selected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                            </View>
                                            <View className="ml-4 flex-1 pr-2">
                                                <Text className="font-black text-slate-800 uppercase text-sm tracking-wide">{p.fName} {p.lName}</Text>
                                                <Text className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{p.ticketNumber || 'TKT# PENDING'}</Text>
                                            </View>
                                            <View className="px-3.5 py-1.5 bg-emerald-100 rounded-xl border border-emerald-200 shadow-sm">
                                                <Text className="text-emerald-800 font-black text-[9px] uppercase tracking-wider">{booking.status}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* REASON */}
                        <View className="bg-white rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 overflow-hidden mb-6" style={{ elevation: 8 }}>
                            <View className="bg-[#1D4171] px-6 py-4 border-b border-[#15305B]">
                                <Text className="text-white font-black text-xs uppercase tracking-widest">Cancellation Reason</Text>
                            </View>
                            <View className="p-6">
                                {[
                                    "Full Cancellation",
                                    "Already cancelled with airlines",
                                    "Flight was cancelled by airline",
                                    "Time changed by airline",
                                    "Missed Flight / No Show",
                                    "Others"
                                ].map(r => {
                                    const active = cancelReason === r;
                                    return (
                                        <TouchableOpacity 
                                            key={r} 
                                            onPress={() => setCancelReason(r)}
                                            className={`flex-row items-center p-4 rounded-2xl mb-3 border border-b-4 active:scale-95 shadow-sm ${active ? 'bg-orange-50 border-orange-200 border-b-orange-300' : 'bg-slate-50 border-slate-100 border-b-slate-200'}`}
                                        >
                                            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center shadow-sm ${active ? 'border-[#F07E21] bg-white' : 'border-slate-300 bg-white'}`}>
                                                {active && <View className="w-3 h-3 rounded-full bg-[#F07E21]" />}
                                            </View>
                                            <Text className={`ml-3.5 font-black text-sm tracking-wide ${active ? 'text-[#F07E21]' : 'text-slate-600'}`}>{r}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* REMARKS */}
                        <View className="bg-white rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 overflow-hidden mb-6" style={{ elevation: 8 }}>
                            <View className="bg-[#1D4171] px-6 py-4 border-b border-[#15305B]">
                                <Text className="text-white font-black text-xs uppercase tracking-widest">Additional Remarks</Text>
                            </View>
                            <View className="p-6">
                                <TextInput 
                                    multiline
                                    placeholder="Enter cancellation details..."
                                    value={remarks}
                                    onChangeText={setRemarks}
                                    placeholderTextColor="#9ca3af"
                                    style={{ height: 100, textAlignVertical: 'top' }}
                                    className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-800 text-sm shadow-inner"
                                />
                            </View>
                        </View>

                        {/* CANCELLATION POLICIES */}
                        <View className="space-y-6">
                            {isWithin24Hours && (
                                <View className="bg-rose-50 border border-rose-200 border-b-[8px] border-b-rose-300 p-6 rounded-[2.5rem] shadow-2xl shadow-rose-500/20 mb-6" style={{ elevation: 8 }}>
                                    <View className="flex-row items-center mb-3">
                                        <Ionicons name="alert-circle" size={24} color="#dc2626" />
                                        <Text className="ml-2.5 text-red-600 font-black text-sm uppercase tracking-wide">Urgent Departure Warning</Text>
                                    </View>
                                    <Text className="text-red-900 font-bold text-xs leading-5">
                                        If flight time is less than 24 hours, we cannot assure cancellation. 
                                        Recommended to cancel directly with airline first.
                                    </Text>
                                </View>
                            )}

                            <View className="bg-white rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 overflow-hidden mb-6" style={{ elevation: 8 }}>
                                <View className="bg-[#1D4171] px-6 py-4 border-b border-[#15305B] flex-row justify-between items-center">
                                    <Text className="text-white font-black text-xs uppercase tracking-widest">Cancellation Policy</Text>
                                    <Ionicons name="document-text" size={16} color="#FFF" />
                                </View>
                                <View className="p-6 space-y-4">
                                    {[
                                        "Mentioned Cancellation charges are tentative and per PAX per Sector",
                                        "Refunds are subject to Airlines Policy and are processed once received from airlines",
                                        "All SSRs are Non Refundable incase of cancellation",
                                        "Departure < 24h: contact airline directly first",
                                        "This is NOT a quote. Booking will be cancelled automatically once submitted."
                                    ].map((policy, idx) => (
                                        <View key={idx} className="flex-row items-start bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm mb-3">
                                            <View className="w-6 h-6 bg-orange-50 rounded-full items-center justify-center border border-orange-100 mr-3.5 shadow-sm">
                                                <Text className="font-black text-[#F07E21] text-xs">{idx + 1}</Text>
                                            </View>
                                            <Text className="text-slate-700 font-bold text-xs leading-5 flex-1 pr-1">{policy}</Text>
                                        </View>
                                    ))}

                                    <TouchableOpacity 
                                        onPress={() => setAgreedToPolicy(!agreedToPolicy)}
                                        className={`mt-4 p-5 rounded-2xl border border-b-4 flex-row items-center active:scale-95 shadow-sm ${agreedToPolicy ? 'bg-orange-50 border-orange-200 border-b-orange-300' : 'bg-slate-50 border-slate-100 border-b-slate-200'}`}
                                    >
                                        <View className={`w-6 h-6 rounded-lg items-center justify-center border-2 shadow-sm ${agreedToPolicy ? 'bg-[#F07E21] border-[#F07E21]' : 'bg-white border-slate-300'}`}>
                                            {agreedToPolicy && <Ionicons name="checkmark" size={16} color="#FFF" />}
                                        </View>
                                        <Text className="ml-4 flex-1 font-black text-slate-800 text-xs uppercase tracking-wider">I Agree to the Policies</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View className="space-y-8">
                        <View className="bg-rose-50 border border-rose-100 border-b-[8px] border-rose-200 shadow-2xl shadow-rose-500/20 p-8 rounded-[2.5rem] items-center mb-8" style={{ elevation: 8 }}>
                            <View className="w-20 h-20 bg-red-100 rounded-3xl items-center justify-center mb-6 border border-red-200 shadow-sm">
                                <Ionicons name="warning" size={38} color="#dc2626" />
                            </View>
                            <Text className="text-red-950 font-black text-3xl text-center mb-3 tracking-wide">Are you sure?</Text>
                            <Text className="text-red-800 font-bold text-center text-xs leading-5 px-4">
                                You are about to cancel this booking for <Text className="font-black text-red-950">{selectedPax.length} passenger(s)</Text>. This action is irreversible on the GDS.
                            </Text>
                        </View>

                        <View className="bg-white border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-8 rounded-[2.5rem] space-y-5 mb-8" style={{ elevation: 8 }}>
                            <Text className="font-black text-slate-400 uppercase text-[10px] tracking-widest pb-3 border-b border-slate-100">Cancellation Summary</Text>
                            <View className="p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Reason</Text>
                                <Text className="font-black text-slate-900 text-base border-l-4 border-[#F07E21] pl-3">{cancelReason}</Text>
                            </View>
                            <View className="p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Selected Passengers</Text>
                                {selectedPax.map(idx => (
                                    <Text key={idx} className="font-black text-slate-800 text-sm mb-1">• {booking.passengerDetails[Number(idx)].fName} {booking.passengerDetails[Number(idx)].lName}</Text>
                                ))}
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* ACTION BAR */}
            <SafeAreaView edges={['bottom']} className="bg-white border-t border-slate-100 p-5 shadow-2xl">
                {step === 0 ? (
                    <TouchableOpacity 
                        onPress={handleInitialSubmit}
                        disabled={selectedPax.length === 0 || !agreedToPolicy}
                        className={`py-5 rounded-2xl items-center border border-b-[6px] active:scale-95 shadow-xl ${selectedPax.length > 0 && agreedToPolicy ? 'bg-[#F07E21] border-[#F07E21] border-b-[#D96B18] shadow-orange-500/30' : 'bg-slate-100 border-slate-200 border-b-slate-300'}`}
                    >
                        <Text className={`font-black uppercase text-sm tracking-widest ${selectedPax.length > 0 && agreedToPolicy ? 'text-white' : 'text-slate-400'}`}>Review Cancellation</Text>
                    </TouchableOpacity>
                ) : (
                    <View className="flex-row gap-4">
                        <TouchableOpacity 
                            onPress={() => setStep(0)}
                            className="flex-1 py-5 rounded-2xl bg-white border border-slate-100 border-b-[6px] border-slate-200 items-center active:scale-95 shadow-sm"
                        >
                            <Text className="text-slate-600 font-black uppercase text-xs tracking-widest">Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={handleFinalCancel}
                            disabled={submitting}
                            className={`flex-[2] py-5 rounded-2xl items-center border border-b-[6px] active:scale-95 shadow-xl ${submitting ? 'bg-slate-200 border-slate-300 border-b-slate-400' : 'bg-red-600 border-red-600 border-b-red-800 shadow-red-900/30'}`}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text className="text-white font-black uppercase text-sm tracking-widest">Yes, Cancel Now</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}
