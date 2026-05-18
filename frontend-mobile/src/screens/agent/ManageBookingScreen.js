import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Linking, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { bookingService } from '../../services/api';

export default function ManageBookingScreen({ navigation, route }) {
    const { booking } = route.params;
    const [loading, setLoading] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [activeTab, setActiveTab] = useState('INFO'); 
    
    useEffect(() => {
        const fetchStatus = async () => {
            setLoading(true);
            try {
                const res = await bookingService.ftdGetBookingStatus(booking.providerReference || booking.pnr);
                if (res.success) setBookingDetails(res.data);
            } catch (err) { console.log(err); } finally { setLoading(false); }
        };
        fetchStatus();
    }, []);

    const handleDownload = async (type) => {
        setLoading(true);
        try {
            const ref = booking.providerReference || booking.pnr;
            const res = type === 'TICKET' ? await bookingService.ftdDownloadTicket(ref) : await bookingService.ftdDownloadInvoice(ref);
            if (res.success && res.url) {
                const url = res.url.startsWith('http') ? res.url : `${bookingService.BASE_URL}${res.url}`;
                Linking.openURL(url);
            }
        } catch (err) { Toast.show({ type: 'error', text1: 'Error', text2: 'Download failed.' }); } finally { setLoading(false); }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <StatusBar style="light" />
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#1D4171' }}>
                <View className="px-6 py-5 flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-11 h-11 bg-white/10 rounded-2xl items-center justify-center border border-white/20 mr-4 active:scale-95">
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-black uppercase tracking-widest">Manage Booking</Text>
                </View>
            </SafeAreaView>

            <View className="bg-white border-b border-slate-100 flex-row">
                {['INFO', 'CANCEL', 'REISSUE'].map(tab => (
                    <TouchableOpacity 
                        key={tab} 
                        onPress={() => setActiveTab(tab)}
                        className={`flex-1 py-4 items-center border-b-2 ${activeTab === tab ? 'border-[#F07E21]' : 'border-transparent'}`}
                    >
                        <Text className={`text-[10px] font-black uppercase ${activeTab === tab ? 'text-[#F07E21]' : 'text-slate-400'}`}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView className="flex-1 p-5">
                {activeTab === 'INFO' && (
                    <View style={{ elevation: 8 }} className="bg-white rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 overflow-hidden mb-10">
                        <View style={{ backgroundColor: '#0D4771' }} className="p-6 pb-8">
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="flex-row items-center">
                                    <Text className="text-white text-xl font-bold">{booking.fromCity || 'Source'}</Text>
                                    <Text className="text-[#93c5fd] mx-3 text-lg">✈️</Text>
                                    <Text className="text-white text-xl font-bold">{booking.toCity || 'Destination'}</Text>
                                </View>
                            </View>
                            <Text className="text-[#93c5fd]/60 text-[10px] font-semibold">{new Date(booking.createdAt).toLocaleString()}</Text>
                        </View>

                        <View className="p-8 bg-blue-50/50 -mt-4 rounded-t-[32px]">
                            <Text className="text-[#0D4771] text-base font-black mb-6 uppercase">Travel Info</Text>
                            
                            <View className="mb-6">
                                <Text className="text-slate-400 text-[10px] font-black uppercase mb-1">PNR</Text>
                                <Text className="text-sm font-black text-slate-800 uppercase">{booking.providerReference}</Text>
                            </View>

                            <View className="flex-row justify-between mb-10">
                                <View className="flex-1 pr-4">
                                    <TouchableOpacity 
                                        onPress={() => handleDownload('INVOICE')}
                                        className="flex-row items-center justify-center py-4 bg-white border border-slate-100 border-b-4 border-slate-200 rounded-2xl shadow-sm active:scale-95"
                                    >
                                        <Ionicons name="document-text" size={14} color="#0D4771" />
                                        <Text className="text-[#0D4771] text-[10px] font-black ml-2 uppercase tracking-widest">Invoice</Text>
                                    </TouchableOpacity>
                                </View>
                                <View className="flex-1 pl-4">
                                    <TouchableOpacity 
                                        onPress={() => handleDownload('TICKET')}
                                        className="flex-row items-center justify-center py-4 bg-[#1D4171] border border-[#1D4171] border-b-4 border-[#11294a] rounded-2xl shadow-md shadow-blue-900/20 active:scale-95"
                                    >
                                        <Ionicons name="download" size={14} color="#FFF" />
                                        <Text className="text-white text-[10px] font-black ml-2 uppercase tracking-widest">Ticket</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View className="pt-4 border-t border-slate-100">
                                <View className="flex-row justify-between items-center">
                                    <Text style={{ color: '#1D4171' }} className="text-[11px] font-black uppercase">Net Deducted</Text>
                                    <Text style={{ color: '#1D4171' }} className="text-lg font-black">₹{(booking.totalCost - (booking.commissionEarned || 0)).toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {activeTab === 'CANCEL' && (
                    <View className="py-20 items-center px-8">
                        <View className="w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-6">
                            <Ionicons name="close-circle" size={40} color="#dc2626" />
                        </View>
                        <Text className="text-slate-800 font-black text-xl text-center mb-3 uppercase">Initiate Cancellation</Text>
                        <Text className="text-slate-400 font-bold text-[10px] text-center uppercase leading-4 mb-10">
                            Managed via GDS Secure Gateway. You will be able to select passengers and provide cancellation reasons on the next screen.
                        </Text>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('FlightCancellation', { id: booking.ftdBookingRef || booking.providerReference || booking._id })}
                            className="bg-[#dc2626] px-10 py-5 rounded-2xl border border-[#dc2626] border-b-[6px] border-b-[#991b1b] shadow-xl shadow-red-600/30 active:scale-95"
                        >
                            <Text className="text-white font-black uppercase text-xs tracking-widest">Open Cancellation Portal</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {activeTab === 'REISSUE' && (
                    <View className="py-20 items-center px-8">
                        <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-6">
                            <Ionicons name="sync" size={40} color="#003580" />
                        </View>
                        <Text className="text-slate-800 font-black text-xl text-center mb-3 uppercase">Reissue Flight</Text>
                        <Text className="text-slate-400 font-bold text-[10px] text-center uppercase leading-4 mb-10">
                            Our operator will find the best alternative flights and provide a reissue quotation. Fees and fare differences may apply.
                        </Text>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('FlightReschedule', { id: booking.ftdBookingRef || booking.providerReference || booking._id })}
                            className="bg-[#1D4171] px-10 py-5 rounded-2xl border border-[#1D4171] border-b-[6px] border-b-[#11294a] shadow-xl shadow-blue-900/20 active:scale-95"
                        >
                            <Text className="text-white font-black uppercase text-xs tracking-widest">Open Reissue Portal</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {loading && (
                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 1000, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#F07E21" />
                </View>
            )}
        </View>
    );
}
