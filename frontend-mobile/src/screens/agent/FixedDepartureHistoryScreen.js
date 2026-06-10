import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';
import { fixedDepartureService, BASE_URL } from '../../services/api';

export default function FixedDepartureHistoryScreen({ navigation }) {
    const t = useThemeColors();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fixedDepartureService.getMyBookings();
            if (res.success) {
                setBookings(res.data);
            }
        } catch (error) {
            console.error('History failed', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const handleDownloadPdf = (pdfUrl) => {
        if (!pdfUrl) {
            Alert.alert('Not Available', 'PDF Ticket is being generated or not available yet.');
            return;
        }
        let fullUrl = pdfUrl;
        if (!pdfUrl.startsWith('http://') && !pdfUrl.startsWith('https://')) {
            const cleanPdfUrl = pdfUrl.startsWith('/') ? pdfUrl : `/${pdfUrl}`;
            fullUrl = `${BASE_URL}${cleanPdfUrl}`;
        }
        Linking.openURL(fullUrl).catch(err => {
            Alert.alert('Error', 'Could not open PDF ticket.');
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-50 bg-white">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 w-10 h-10 bg-gray-50 rounded-xl items-center justify-center">
                            <Ionicons name="chevron-back" size={20} color="#000" />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ color: t.text }} className="text-xl font-black">My Manual Bookings</Text>
                            <Text style={{ color: t.textMuted }} className="font-bold uppercase text-[9px]">Fixed Departure History</Text>
                        </View>
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={t.primary} />
                    </View>
                ) : (
                    <ScrollView 
                        className="flex-1 px-6 pt-6" 
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    >
                        {bookings.length === 0 ? (
                            <View className="py-20 items-center opacity-20">
                                <Ionicons name="folder-open-outline" size={80} color="#cbd5e1" />
                                <Text className="mt-4 font-black uppercase text-xs tracking-widest text-center">No bookings found</Text>
                            </View>
                        ) : (
                            bookings.map(booking => (
                                <View key={booking._id} style={{ backgroundColor: t.card }} className="p-6 rounded-[2.5rem] mb-6 shadow-xl shadow-slate-200/50 border border-slate-50">
                                    <View className="flex-row justify-between items-center mb-6">
                                        <View className={`px-4 py-2 rounded-2xl ${
                                            booking.status === 'Confirmed' ? 'bg-emerald-50' :
                                            booking.status === 'Pending' ? 'bg-amber-50' : 'bg-red-50'
                                        }`}>
                                            <Text className={`font-black text-[10px] uppercase tracking-widest ${
                                                booking.status === 'Confirmed' ? 'text-emerald-600' :
                                                booking.status === 'Pending' ? 'text-amber-600' : 'text-red-600'
                                            }`}>
                                                {booking.status}
                                            </Text>
                                        </View>
                                        <Text className="text-slate-300 font-bold text-[9px] uppercase tracking-widest">
                                            {new Date(booking.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center gap-4 mb-6">
                                        <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center">
                                            <MaterialCommunityIcons name="airplane" size={20} color={t.primary} />
                                        </View>
                                        <View>
                                            <Text className="text-sm font-black text-slate-800">{booking.flightId?.flightNumber}</Text>
                                            <Text className="text-[10px] font-black text-[#F07E21] uppercase tracking-widest">
                                                {booking.flightId?.fromCity} → {booking.flightId?.toCity}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="bg-slate-50/50 p-4 rounded-3xl mb-6">
                                        {booking.pnr ? (
                                            <View className="flex-row justify-between items-center">
                                                <View>
                                                    <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest">PNR</Text>
                                                    <Text className="text-xl font-black text-[#1D4171] tracking-[2px]">{booking.pnr}</Text>
                                                </View>
                                                <TouchableOpacity 
                                                    onPress={() => handleDownloadPdf(booking.pdfUrl)}
                                                    className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm"
                                                >
                                                    <Ionicons name="download-outline" size={20} color={t.primary} />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <View className="items-center py-2">
                                                <Text className="text-[10px] font-black text-slate-400 uppercase text-center leading-relaxed">
                                                    Processing... PNR will appear once confirmed.
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <View className="flex-row justify-between items-end">
                                        <View>
                                            <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{booking.passengers.length} Passenger(s)</Text>
                                            <Text className="text-xs font-bold text-slate-600">{booking.passengers[0]?.name}{booking.passengers.length > 1 ? ' + others' : ''}</Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</Text>
                                            <Text className="text-xl font-black text-[#1D4171]">₹{booking.totalFare}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}
            </SafeAreaView>
        </View>
    );
}
