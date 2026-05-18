import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, StyleSheet, Modal } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { bookingService } from '../../services/api';

export default function FlightRescheduleScreen({ navigation, route }) {
    const { id } = route.params; // Booking Reference
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(0); // 0: Form, 1: Double Confirm

    const [selectedPax, setSelectedPax] = useState([]);
    const [travelDate, setTravelDate] = useState('');
    const [flightDetails, setFlightDetails] = useState('');
    const [remarks, setRemarks] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const res = await bookingService.ftdGetBookingDetails(id);
                if (res.success) setBooking(res.data);
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
        if (!travelDate) return Toast.show({ type: 'info', text1: 'Date Required', text2: 'Please select a new travelling date.' });
        setStep(1);
    };

    const handleFinalSubmit = async () => {
        setSubmitting(true);
        try {
            const realPaxIds = selectedPax.map(i => {
                const pax = booking.passengerDetails[parseInt(i)];
                return pax?.paxID || pax?.paxId || String(parseInt(i) + 1);
            }).join(',');

            const res = await bookingService.ftdReschedule({
                refID: id,
                paxId: realPaxIds,
                travelDate,
                flightDetails,
                remarks
            });

            if (res.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Reschedule request submitted. We will notify you with the quotation shortly.'
                });
                setTimeout(() => navigation.navigate('Bookings'), 2000);
            } else {
                Toast.show({ type: 'error', text1: 'GDS Failure', text2: res.message || 'The airline could not process the reschedule request.' });
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Connection timeout.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <View className="flex-1 bg-white items-center justify-center">
            <ActivityIndicator size="large" color="#1D4171" />
            <Text className="mt-5 text-slate-400 font-black uppercase text-[10px] tracking-widest">Fetching GDS Record...</Text>
        </View>
    );

    if (!booking) return (
        <View className="flex-1 bg-white items-center justify-center p-10">
            <Ionicons name="alert-circle" size={60} color="#f87171" />
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
                            {step === 0 ? 'Reissue Flight' : 'Final Review'}
                        </Text>
                        <Text className="text-white/50 text-[10px] font-black uppercase tracking-widest mt-0.5">
                            Ref: {id}
                        </Text>
                    </View>
                    <View className="bg-[#48A0D4] px-3.5 py-1.5 rounded-xl border border-blue-300 shadow-sm">
                        <Text className="text-slate-950 text-[9px] font-black uppercase tracking-widest">Trustworthy</Text>
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
                                    Current Flight: {booking.fromCity} ➔ {booking.toCity}
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
                                <Text className="text-white font-black text-xs uppercase tracking-widest">Reissue For Passengers</Text>
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
                                            <View className="ml-4 flex-1">
                                                <Text className="font-black text-slate-800 uppercase text-sm tracking-wide">{p.fName} {p.lName}</Text>
                                                <Text className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{p.ticketNumber || 'TKT# PENDING'}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* REISSUE DETAILS */}
                        <View className="bg-white rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 overflow-hidden mb-6" style={{ elevation: 8 }}>
                            <View className="bg-[#1D4171] px-6 py-4 border-b border-[#15305B]">
                                <Text className="text-white font-black text-xs uppercase tracking-widest">New Travel Details</Text>
                            </View>
                            <View className="p-6 space-y-5">
                                <TouchableOpacity 
                                    onPress={() => setShowCalendar(true)}
                                    className="bg-slate-50 p-5 rounded-2xl border border-slate-100 border-b-4 border-slate-200 flex-row items-center justify-between active:scale-95 shadow-sm"
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons name="calendar-outline" size={22} color="#1D4171" className="mr-3.5" />
                                        <Text className={`font-black text-sm tracking-wide ${travelDate ? 'text-slate-800' : 'text-slate-400'}`}>
                                            {travelDate ? travelDate : 'Preferred Travelling Date'}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                                </TouchableOpacity>

                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Preferred Flights</Text>
                                    <TextInput 
                                        multiline
                                        placeholder="Type preferred airline, flight numbers, or times..."
                                        value={flightDetails}
                                        onChangeText={setFlightDetails}
                                        placeholderTextColor="#9ca3af"
                                        style={{ height: 100, textAlignVertical: 'top' }}
                                        className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-800 text-sm shadow-inner"
                                    />
                                </View>

                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Additional Remarks</Text>
                                    <TextInput 
                                        multiline
                                        placeholder="Any other special requests..."
                                        value={remarks}
                                        onChangeText={setRemarks}
                                        placeholderTextColor="#9ca3af"
                                        style={{ height: 100, textAlignVertical: 'top' }}
                                        className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-800 text-sm shadow-inner"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* 4. NOTES */}
                        <View className="bg-amber-50 rounded-[2.5rem] border border-amber-200 border-b-[8px] border-amber-300 shadow-2xl shadow-amber-500/20 p-6 mb-6" style={{ elevation: 8 }}>
                            <View className="flex-row items-start pb-4 border-b border-amber-100 mb-4">
                                <Ionicons name="information-circle" size={24} color="#d97706" />
                                <Text className="ml-3 text-amber-900 font-black text-base uppercase tracking-wide">Please Note</Text>
                            </View>
                            <View className="space-y-2.5 px-1">
                                <Text className="text-amber-900 text-xs font-bold leading-5"><Text className="font-black mr-2">•</Text> Re-issue can only be performed on the same airline as the original booking.</Text>
                                <Text className="text-amber-900 text-xs font-bold leading-5"><Text className="font-black mr-2">•</Text> Requests are subject to airline availability and fare difference.</Text>
                                <Text className="text-amber-900 text-xs font-bold leading-5"><Text className="font-black mr-2">•</Text> Our team will contact you with the final quotation via email.</Text>
                                <Text className="text-amber-900 text-xs font-bold leading-5"><Text className="font-black mr-2">•</Text> Ticket will only be reissued after the difference amount is paid.</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View className="space-y-8">
                        <View className="bg-white border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-8 rounded-[2.5rem] items-center mb-8" style={{ elevation: 8 }}>
                            <View className="w-20 h-20 bg-blue-50 rounded-3xl items-center justify-center mb-6 border border-blue-100 shadow-sm">
                                <Ionicons name="sync" size={38} color="#1D4171" />
                            </View>
                            <Text className="text-slate-900 font-black text-3xl text-center mb-3 tracking-wide">Request Review</Text>
                            <Text className="text-slate-600 font-bold text-center text-xs leading-5 px-4">
                                You are requesting a reissue for <Text className="font-black text-slate-900">{selectedPax.length} passenger(s)</Text> on <Text className="font-black text-slate-900">{travelDate}</Text>.
                            </Text>
                        </View>

                        <View className="bg-white border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-8 rounded-[2.5rem] space-y-5 mb-8" style={{ elevation: 8 }}>
                            <Text className="font-black text-slate-400 uppercase text-[10px] tracking-widest pb-3 border-b border-slate-100">Reissue Summary</Text>
                            <View className="p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">New Date</Text>
                                <Text className="font-black text-slate-900 text-base border-l-4 border-[#1D4171] pl-3">{travelDate}</Text>
                            </View>
                            <View className="p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Preferred Flights</Text>
                                <Text className="font-bold text-slate-700 italic text-xs leading-5">"{flightDetails || 'No specific flights mentioned'}"</Text>
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
                        disabled={selectedPax.length === 0}
                        className={`py-5 rounded-2xl items-center border border-b-[6px] active:scale-95 shadow-xl ${selectedPax.length > 0 ? 'bg-[#F07E21] border-[#F07E21] border-b-[#D96B18] shadow-orange-500/30' : 'bg-slate-100 border-slate-200 border-b-slate-300'}`}
                    >
                        <Text className={`font-black uppercase text-sm tracking-widest ${selectedPax.length > 0 ? 'text-white' : 'text-slate-400'}`}>Review Request</Text>
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
                            onPress={handleFinalSubmit}
                            disabled={submitting}
                            className={`flex-[2] py-5 rounded-2xl items-center border border-b-[6px] active:scale-95 shadow-xl ${submitting ? 'bg-slate-200 border-slate-300 border-b-slate-400' : 'bg-[#1D4171] border-[#1D4171] border-b-[#15305B] shadow-blue-900/30'}`}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text className="text-white font-black uppercase text-sm tracking-widest">Submit Request</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>

            {/* CALENDAR MODAL */}
            <Modal visible={showCalendar} transparent animationType="slide">
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-[3rem] p-8 pb-12 shadow-2xl border-t border-slate-100">
                        <View className="flex-row items-center justify-between mb-8 pb-4 border-b border-slate-100">
                            <Text className="text-2xl font-black text-slate-900 uppercase tracking-wide">Select Travel Date</Text>
                            <TouchableOpacity onPress={() => setShowCalendar(false)} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm">
                                <Ionicons name="close" size={24} color="#0f172a" />
                            </TouchableOpacity>
                        </View>
                        <Calendar 
                            onDayPress={(day) => {
                                setTravelDate(day.dateString);
                                setShowCalendar(false);
                            }}
                            theme={{
                                selectedDayBackgroundColor: '#1D4171',
                                todayTextColor: '#F07E21',
                                arrowColor: '#1D4171',
                                textDayFontWeight: '800',
                                textMonthFontWeight: '900',
                                textDayHeaderFontWeight: '900',
                            }}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}
