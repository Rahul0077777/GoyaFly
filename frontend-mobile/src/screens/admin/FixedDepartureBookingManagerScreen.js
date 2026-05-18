import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';
import { adminService } from '../../services/api';

export default function FixedDepartureBookingManagerScreen({ navigation }) {
    const t = useThemeColors();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [pnr, setPnr] = useState('');
    const [ticketNumber, setTicketNumber] = useState('');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await adminService.getFixedDepartureBookings();
            if (res.success) setBookings(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const handleOpenConfirm = (booking) => {
        setSelectedBooking(booking);
        setPnr('');
        setTicketNumber('');
        setIsModalOpen(true);
    };

    const handleConfirm = async () => {
        if (!pnr || !ticketNumber) return Alert.alert('Error', 'Please enter PNR and Ticket Number');
        try {
            await adminService.confirmFixedDepartureBooking(selectedBooking._id, pnr, ticketNumber);
            setIsModalOpen(false);
            fetchBookings();
            Alert.alert('Success', 'Booking confirmed and ticketed');
        } catch (error) {
            Alert.alert('Error', 'Confirmation failed');
        }
    };

    const handleCancel = (id) => {
        Alert.alert('Cancel Booking', 'This will refund the agent. Proceed?', [
            { text: 'No' },
            { text: 'Yes, Cancel', onPress: async () => {
                await adminService.cancelFixedDepartureBooking(id);
                fetchBookings();
            }, style: 'destructive' }
        ]);
    };

    const handleVerifyPayment = async (id) => {
        try {
            await adminService.verifyFixedDepartureBookingPayment(id);
            fetchBookings();
            Alert.alert('Success', 'Payment verified successfully! You can now issue the ticket.');
        } catch (error) {
            Alert.alert('Error', 'Payment verification failed');
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-50 bg-white">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 w-10 h-10 bg-gray-50 rounded-xl items-center justify-center">
                            <Ionicons name="chevron-back" size={20} color="#000" />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ color: t.text }} className="text-xl font-black">Manual Requests</Text>
                            <Text style={{ color: t.textMuted }} className="font-bold uppercase text-[9px]">Process Booking Requests</Text>
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
                        {bookings.map(booking => (
                            <View key={booking._id} style={{ backgroundColor: t.card }} className="p-6 rounded-[2.5rem] mb-6 shadow-xl shadow-slate-200/50 border border-slate-50">
                                <View className="flex-row justify-between items-start mb-6">
                                    <View>
                                        <Text className="text-[#1D4171] font-black text-sm">{booking.agentId?.agencyName}</Text>
                                        <Text className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(booking.createdAt).toLocaleString()}</Text>
                                    </View>
                                    <View className={`px-3 py-1 rounded-full ${
                                        booking.status === 'Confirmed' ? 'bg-emerald-50' :
                                        booking.status === 'Pending' ? 'bg-amber-50' : 'bg-red-50'
                                    }`}>
                                        <Text className={`font-black text-[8px] uppercase ${
                                            booking.status === 'Confirmed' ? 'text-emerald-600' :
                                            booking.status === 'Pending' ? 'text-amber-600' : 'text-red-600'
                                        }`}>{booking.status}</Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center gap-4 mb-6">
                                    <View className="w-8 h-8 bg-slate-50 rounded-lg items-center justify-center">
                                        <MaterialCommunityIcons name="airplane" size={16} color={t.primary} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-xs font-black text-slate-800">{booking.flightId?.flightNumber} | {booking.flightId?.fromCity} → {booking.flightId?.toCity}</Text>
                                        <Text className="text-[8px] font-black text-slate-400 uppercase">Passengers: {booking.passengers.length}</Text>
                                    </View>
                                </View>

                                {booking.pnr && (
                                    <View className="bg-blue-50/50 p-4 rounded-2xl mb-6">
                                        <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Confirmed PNR</Text>
                                        <Text className="text-lg font-black text-[#1D4171] tracking-[2px]">{booking.pnr}</Text>
                                    </View>
                                )}

                                <View className="flex-row justify-between items-center pt-4 border-t border-slate-50">
                                    <View>
                                        <Text className="text-lg font-black text-[#1D4171]">₹{booking.totalFare}</Text>
                                        {booking.paymentVerified ? (
                                            <View className="flex-row items-center mt-1 bg-emerald-100 self-start px-2 py-0.5 rounded-full">
                                                <Ionicons name="checkmark-circle" size={10} color="#065f46" />
                                                <Text className="text-[9px] font-bold text-emerald-800 ml-1 uppercase">Verified</Text>
                                            </View>
                                        ) : (
                                            <View className="flex-row items-center mt-1 bg-amber-100 self-start px-2 py-0.5 rounded-full">
                                                <Ionicons name="warning" size={10} color="#b45309" />
                                                <Text className="text-[9px] font-bold text-amber-800 ml-1 uppercase">Pending Verif.</Text>
                                            </View>
                                        )}
                                    </View>
                                    {booking.status === 'Pending' && (
                                        <View className="flex-row gap-2">
                                            {!booking.paymentVerified && (
                                                <TouchableOpacity onPress={() => handleVerifyPayment(booking._id)} className="px-3 py-2 bg-[#1D4171] rounded-xl items-center justify-center">
                                                    <Text className="text-white font-black text-[10px] uppercase">Verify Pay</Text>
                                                </TouchableOpacity>
                                            )}
                                            {booking.paymentVerified && (
                                                <TouchableOpacity onPress={() => handleOpenConfirm(booking)} className="px-4 py-2 bg-[#F07E21] rounded-xl items-center justify-center shadow-md shadow-orange-500/20">
                                                    <Text className="text-white font-black text-[10px] uppercase">Issue</Text>
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity onPress={() => handleCancel(booking._id)} className="px-3 py-2 bg-red-50 rounded-xl items-center justify-center">
                                                <Text className="text-red-600 font-black text-[10px] uppercase">Reject</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                )}

                <Modal visible={isModalOpen} animationType="fade" transparent>
                    <View className="flex-1 bg-black/60 justify-center p-6">
                        <View className="bg-white rounded-[3rem] p-8">
                            <Text className="text-2xl font-black text-[#1D4171] mb-2 text-center">Issue Ticket</Text>
                            <Text className="text-slate-400 text-center font-bold text-[10px] uppercase mb-8 tracking-widest">Enter GDS Confirmation Details</Text>
                            
                            <View className="space-y-4">
                                <View>
                                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Confirmation PNR</Text>
                                    <TextInput 
                                        className="bg-slate-50 p-4 rounded-2xl font-black text-lg text-slate-800"
                                        placeholder="e.g. ABCDEF"
                                        autoCapitalize="characters"
                                        value={pnr}
                                        onChangeText={setPnr}
                                    />
                                </View>
                                <View>
                                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Ticket Number</Text>
                                    <TextInput 
                                        className="bg-slate-50 p-4 rounded-2xl font-black text-slate-800"
                                        placeholder="e.g. 098-1234567890"
                                        value={ticketNumber}
                                        onChangeText={setTicketNumber}
                                    />
                                </View>
                            </View>

                            <View className="flex-row gap-4 mt-10">
                                <TouchableOpacity onPress={() => setIsModalOpen(false)} className="flex-1 py-4 items-center">
                                    <Text className="text-slate-400 font-black uppercase text-xs">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleConfirm} className="flex-[2] bg-[#1D4171] py-4 rounded-[1.5rem] items-center shadow-xl">
                                    <Text className="text-white font-black uppercase text-xs tracking-widest">Issue Ticket</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}
