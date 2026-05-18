import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../utils/themeColors';

export default function BookingSuccessScreen({ navigation, route }) {
    const t = useThemeColors();
    const { booking } = route.params || {};

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    const pnr = booking?.pnr || booking?.booking?.pnr || 'PENDING';
    const bookingId = booking?._id || booking?.booking?._id || '';

    return (
        <View style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                    {/* Success Hero */}
                    <LinearGradient colors={['#059669', '#10b981']} style={{ paddingTop: 60, paddingBottom: 80, paddingHorizontal: 24, alignItems: 'center' }}>
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }} className="w-28 h-28 rounded-full bg-white/20 items-center justify-center mb-6">
                            <Text className="text-6xl">✅</Text>
                        </Animated.View>
                        <Text className="text-white font-black text-3xl mb-2 text-center">Booking Confirmed!</Text>
                        <Text className="text-emerald-100 font-bold text-sm text-center opacity-80">Your flight has been successfully booked through GDS.</Text>
                    </LinearGradient>

                    <Animated.View style={{ opacity: fadeAnim, marginTop: -40 }} className="px-5">
                        {/* PNR Card */}
                        <View className="bg-white rounded-[2.5rem] shadow-2xl p-8 mb-6 border border-gray-50">
                            <Text className="text-[9px] font-black text-gray-400 uppercase mb-2 text-center">Booking Reference / PNR</Text>
                            <Text className="text-4xl font-black text-[#1D4171] text-center mb-4">{pnr}</Text>
                            <View className="h-[1px] bg-gray-100 my-4" />
                            <Text className="text-[10px] font-black text-gray-400 uppercase text-center">
                                A confirmation email has been sent to the passenger.
                            </Text>
                        </View>

                        {/* Booking Details */}
                        {booking && (
                            <View className="bg-white rounded-[2.5rem] shadow-xl p-8 mb-6 border border-gray-50">
                                <Text className="font-black text-[#1D4171] uppercase text-[11px] mb-6">Booking Details</Text>
                                {[
                                    ['Status', booking.status || 'Confirmed'],
                                    ['Airline', booking.airline || booking.booking?.airline || ''],
                                    ['Flight No.', booking.flightNumber || booking.booking?.flightNumber || ''],
                                    ['Route', `${booking.from || ''} → ${booking.to || ''}`],
                                    ['Booking ID', bookingId ? bookingId.slice(-8).toUpperCase() : ''],
                                ].filter(([, v]) => v).map(([label, value]) => (
                                    <View key={label} className="flex-row justify-between py-3 border-b border-gray-50">
                                        <Text className="text-[11px] font-black text-gray-400 uppercase">{label}</Text>
                                        <Text className="text-[12px] font-black text-gray-800">{value}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Travellers & Tickets (Section 13 Parity) */}
                        {booking?.passenger && Array.isArray(booking.passenger) && (
                            <View className="bg-white rounded-[2.5rem] shadow-xl p-8 mb-6 border border-gray-50">
                                <Text className="font-black text-[#1D4171] uppercase text-[11px] mb-6">Travellers & Tickets</Text>
                                {booking.passenger.map((p, pIdx) => (
                                    <View key={pIdx} className="mb-4 pb-4 border-b border-gray-50 last:border-0 last:mb-0 last:pb-0">
                                        <View className="flex-row justify-between items-center mb-1">
                                            <Text className="font-black text-gray-800 text-sm">
                                                {p.title} {p.fName} {p.lName}
                                            </Text>
                                            <View className="bg-emerald-100 px-2 py-0.5 rounded">
                                                <Text className="text-emerald-700 font-black text-[8px] uppercase">{p.pType === 'A' ? 'Adult' : p.pType === 'C' ? 'Child' : 'Infant'}</Text>
                                            </View>
                                        </View>
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-gray-400 font-bold text-[10px] uppercase">
                                                Ticket: {p.ticketNo || p.TicketNo || 'PROCESSING...'}
                                            </Text>
                                            {p.pnr && (
                                                <Text className="text-emerald-600 font-black text-[10px] uppercase">
                                                    PNR: {p.pnr}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Actions */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ManageBooking')}
                            className="mb-4 active:scale-95 shadow-xl shadow-blue-500/30"
                        >
                            <LinearGradient colors={['#1D4171', '#2d5fa8']} style={{ paddingVertical: 20, borderRadius: 20, alignItems: 'center' }}>
                                <Text className="text-white font-black text-base uppercase">View & Manage Booking</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Tickets')}
                            className="mb-4 bg-white border border-gray-200 py-5 rounded-2xl items-center shadow-sm active:scale-95"
                        >
                            <Text className="text-[#1D4171] font-black text-sm uppercase">Download Ticket</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('MainApp')}
                            className="py-5 rounded-2xl items-center active:opacity-70"
                        >
                            <Text className="text-gray-400 font-black text-[11px] uppercase">Back to Dashboard</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
