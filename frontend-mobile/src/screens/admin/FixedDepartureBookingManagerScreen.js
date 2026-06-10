import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';
import { adminService } from '../../services/api';
import Toast from 'react-native-toast-message';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

export default function FixedDepartureBookingManagerScreen({ navigation }) {
    const t = useThemeColors();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Search Filter
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [pnr, setPnr] = useState('');
    const [ticketNumber, setTicketNumber] = useState('');

    // Cancel Modal
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedCancelBooking, setSelectedCancelBooking] = useState(null);
    const [cancelRemarks, setCancelRemarks] = useState('');

    // View Modal
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedViewBooking, setSelectedViewBooking] = useState(null);

    const handleViewClick = (booking) => {
        setSelectedViewBooking(booking);
        setIsViewModalOpen(true);
    };

    const handlePrintClick = (booking) => {
        Toast.show({ type: 'info', text1: 'Print Action', text2: 'Please use the Web Admin Panel for high-quality printing.' });
    };

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
        if (!pnr || !ticketNumber) return Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter PNR and Ticket Number' });
        try {
            await adminService.confirmFixedDepartureBooking(selectedBooking._id, pnr, ticketNumber);
            setIsModalOpen(false);
            fetchBookings();
            Toast.show({ type: 'success', text1: 'Success', text2: 'Booking confirmed and ticketed' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Confirmation failed' });
        }
    };

    const handleCancelClick = (booking) => {
        setSelectedCancelBooking(booking);
        setCancelRemarks('');
        setIsCancelModalOpen(true);
    };

    const submitCancel = async () => {
        if (!selectedCancelBooking) return;
        try {
            await adminService.cancelFixedDepartureBooking(selectedCancelBooking._id, cancelRemarks);
            setIsCancelModalOpen(false);
            fetchBookings();
            Toast.show({ type: 'success', text1: 'Refunded', text2: 'Booking cancelled and agent refunded' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Cancellation failed' });
        }
    };

    const handleVerifyPayment = async (id) => {
        try {
            await adminService.verifyFixedDepartureBookingPayment(id);
            fetchBookings();
            Toast.show({ type: 'success', text1: 'Payment Verified', text2: 'You can now issue the ticket' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Payment verification failed' });
        }
    };

    const handleCopyPassengers = async (booking) => {
        if (!booking.passengers || booking.passengers.length === 0) return;
        let text = `Flight: ${booking.flightId?.airlineName} ${booking.flightId?.flightNumber} (${booking.flightId?.fromCity} -> ${booking.flightId?.toCity})\n`;
        text += `Travel Date: ${new Date(booking.flightId?.departureDate || Date.now()).toLocaleDateString()}\n\n`;
        
        booking.passengers.forEach((p, i) => {
            text += `Passenger ${i + 1}:\n`;
            text += `Name: ${p.firstName || p.name} ${p.lastName || ''}\n`;
            if (p.dob) text += `DOB: ${p.dob}\n`;
            if (p.gender) text += `Gender: ${p.gender}\n`;
            if (booking.isInternational) {
                if (p.passportNumber) text += `Passport: ${p.passportNumber}\n`;
                if (p.nationality) text += `Nationality: ${p.nationality}\n`;
            }
            text += `\n`;
        });
        await Clipboard.setStringAsync(text);
        Toast.show({ type: 'success', text1: 'Copied!', text2: 'Passenger details copied to clipboard' });
    };

    const filteredBookings = bookings.filter(b => 
        (b.agentId?.agencyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.pnr || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.flightId?.flightNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-5 py-4 flex-row justify-between items-center bg-white shadow-sm border-b border-slate-100 z-10">
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        className="w-11 h-11 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 active:scale-95"
                    >
                        <Ionicons name="arrow-back" size={20} color="#1D4171" />
                    </TouchableOpacity>
                    <View className="flex-1 ml-4">
                        <Text className="text-2xl font-black text-[#1D4171] tracking-tight">Requests</Text>
                        <Text className="text-slate-500 text-xs font-bold mt-0.5">Fixed Departure Bookings</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View className="px-5 py-5 flex-row gap-3 items-center z-0">
                    <View className="flex-1 bg-white rounded-2xl border border-slate-200/70 flex-row items-center px-4 h-14 shadow-sm">
                        <Ionicons name="search" size={20} color="#94a3b8" />
                        <TextInput 
                            value={searchQuery} onChangeText={setSearchQuery}
                            placeholder="Search agency, PNR, flight..."
                            placeholderTextColor="#94a3b8"
                            className="flex-1 ml-3 font-bold text-[#1D4171] text-sm h-full"
                        />
                    </View>
                    <TouchableOpacity className="w-14 h-14 bg-white rounded-2xl border border-slate-200/70 items-center justify-center shadow-sm active:scale-95">
                        <Ionicons name="filter" size={22} color="#1D4171" />
                    </TouchableOpacity>
                </View>

                {loading && !refreshing ? (
                    <View className="flex-1 items-center justify-center gap-4">
                        <Ionicons name="airplane" size={40} color="#1D4171" />
                        <ActivityIndicator size="small" color="#48A0D4" />
                        <Text className="font-black text-slate-400 text-xs tracking-[0.2em]">LOADING</Text>
                    </View>
                ) : (
                    <ScrollView 
                        className="flex-1 px-5" 
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1D4171" />}
                    >
                        {filteredBookings.length === 0 ? (
                            <View className="py-20 items-center">
                                <View className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-5">
                                    <Ionicons name="folder-open-outline" size={40} color="#cbd5e1" />
                                </View>
                                <Text className="font-black text-xl mb-2 text-[#1D4171]">No Requests Found</Text>
                                <Text className="font-medium text-slate-400 text-center px-10">There are no fixed departure bookings matching your search.</Text>
                            </View>
                        ) : (
                            filteredBookings.map((booking, index) => {
                                const isConfirmed = booking.status === 'Confirmed';
                                const isCancelled = booking.status === 'Cancelled';
                                const firstPassenger = booking.passengers?.[0];
                                const extraPassengers = Math.max(0, (booking.passengers?.length || 0) - 1);

                                return (
                                <View key={booking._id} style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }} className="bg-white rounded-[2rem] mb-6 border border-slate-100 overflow-hidden">
                                    
                                    {/* STATUS PILL OVERLAY */}
                                    <View className="absolute top-4 right-4 z-10">
                                        <View className={`px-3 py-1.5 rounded-xl border shadow-sm ${
                                            isConfirmed ? 'bg-emerald-50 border-emerald-100' :
                                            isCancelled ? 'bg-rose-50 border-rose-100' :
                                            'bg-amber-50 border-amber-100'
                                        }`}>
                                            <Text className={`font-black text-[9px] uppercase tracking-widest ${
                                                isConfirmed ? 'text-emerald-700' :
                                                isCancelled ? 'text-rose-700' : 'text-amber-700'
                                            }`}>{booking.status}</Text>
                                        </View>
                                    </View>

                                    {/* AGENCY SECTION */}
                                    <View className="p-5 border-b border-slate-50 bg-slate-50/50">
                                        <View className="pr-24">
                                            <Text className="text-[#1D4171] font-black text-xl mb-3 tracking-tight">{booking.agentId?.agencyName || 'Agency Name'}</Text>
                                        </View>
                                        <View className="flex-row items-center gap-3">
                                            <View className="flex-row items-center bg-white px-2 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                                                <Ionicons name="calendar" size={12} color="#48A0D4" />
                                                <Text className="text-[10px] font-bold text-slate-600 ml-1.5">{new Date(booking.createdAt).toLocaleDateString()}</Text>
                                            </View>
                                            <View className="flex-row items-center bg-white px-2 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                                                <Ionicons name="time" size={12} color="#48A0D4" />
                                                <Text className="text-[10px] font-bold text-slate-600 ml-1.5">{new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* FLIGHT DETAILS SECTION */}
                                    <View className="p-5 border-b border-slate-50">
                                        <View className="flex-row justify-between items-center mb-4 bg-orange-50/50 p-2.5 rounded-2xl border border-orange-100/50">
                                            <Text className="text-rose-600 font-black text-sm italic tracking-tight px-1">{booking.flightId?.airlineName || 'Airline'}</Text>
                                            <View className="bg-[#F07E21] px-3 py-1 rounded-xl shadow-sm">
                                                <Text className="text-white font-black text-[10px]">{booking.flightId?.flightNumber}</Text>
                                            </View>
                                        </View>
                                        <View className="flex-row items-center justify-between mb-5 px-1">
                                            <Text className="font-black text-2xl text-[#1D4171]">{booking.flightId?.fromCity?.substring(0, 3).toUpperCase() || 'BOM'}</Text>
                                            <View className="flex-1 flex-row items-center justify-center px-3 relative">
                                                <View className="h-[2px] w-full bg-slate-200 absolute border-dashed border-slate-300 border-t-2" />
                                                <View className="bg-white p-1 rounded-full border border-slate-100 shadow-sm z-10">
                                                    <Ionicons name="airplane" size={16} color="#48A0D4" />
                                                </View>
                                            </View>
                                            <Text className="font-black text-2xl text-[#1D4171]">{booking.flightId?.toCity?.substring(0, 3).toUpperCase() || 'DXB'}</Text>
                                        </View>
                                        
                                        <View className="flex-row flex-wrap bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                                            <View className="w-1/2 mb-3">
                                                <Text className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Travel Date</Text>
                                                <Text className="text-xs font-bold text-[#1D4171]">{new Date(booking.flightId?.departureDate || Date.now()).toLocaleDateString()}</Text>
                                            </View>
                                            <View className="w-1/2 mb-3">
                                                <Text className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Dep Time</Text>
                                                <Text className="text-xs font-bold text-[#1D4171]">{booking.flightId?.departureTime || 'N/A'}</Text>
                                            </View>
                                            <View className="w-1/2">
                                                <Text className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Sector</Text>
                                                <Text className="text-xs font-bold text-[#1D4171]">{booking.flightId?.fromCity} → {booking.flightId?.toCity}</Text>
                                            </View>
                                            <View className="w-1/2">
                                                <Text className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Airline</Text>
                                                <Text className="text-xs font-bold text-[#1D4171]">{booking.flightId?.airlineName}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* PASSENGER DETAILS SECTION */}
                                    <View className="p-5 border-b border-slate-50">
                                        <View className="bg-blue-50/40 rounded-2xl p-4 border border-blue-100/60 overflow-hidden">
                                            {/* Decorative blob */}
                                            <View className="absolute top-0 right-0 w-24 h-24 bg-blue-100/50 rounded-full opacity-50 -mr-10 -mt-10" />

                                            <View className="flex-row items-center justify-between mb-4 border-b border-blue-100/50 pb-3 relative z-10">
                                                <View className="flex-row items-center gap-2">
                                                    <View className="bg-blue-100 p-1.5 rounded-lg">
                                                        <Ionicons name="person" size={12} color="#1D4171" />
                                                    </View>
                                                    <Text className="text-[10px] font-black text-blue-900 uppercase tracking-widest">PASSENGERS ({booking.passengers?.length || 0})</Text>
                                                </View>
                                                {booking.passengers && booking.passengers.length > 0 && (
                                                    <TouchableOpacity onPress={() => handleCopyPassengers(booking)} className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm active:scale-95">
                                                        <Ionicons name="copy-outline" size={14} color="#48A0D4" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>

                                            {firstPassenger ? (
                                                <View>
                                                    <View className="flex-col gap-2.5">
                                                        <View className="flex-row items-center">
                                                            <Text className="w-24 text-slate-500 font-medium text-[11px]">First Name</Text>
                                                            <Text className="flex-1 font-black text-[#1D4171] text-xs">{firstPassenger.firstName || firstPassenger.name}</Text>
                                                        </View>
                                                        <View className="flex-row items-center">
                                                            <Text className="w-24 text-slate-500 font-medium text-[11px]">Last Name</Text>
                                                            <Text className="flex-1 font-black text-[#1D4171] text-xs">{firstPassenger.lastName || '-'}</Text>
                                                        </View>
                                                        <View className="flex-row items-center">
                                                            <Text className="w-24 text-slate-500 font-medium text-[11px]">Date of Birth</Text>
                                                            <Text className="flex-1 font-bold text-slate-700 text-xs">{firstPassenger.dob || '-'}</Text>
                                                        </View>
                                                        <View className="flex-row items-center">
                                                            <Text className="w-24 text-slate-500 font-medium text-[11px]">Gender</Text>
                                                            <Text className="flex-1 font-bold text-slate-700 text-xs">{firstPassenger.gender || '-'}</Text>
                                                        </View>
                                                        {booking.isInternational && (
                                                            <>
                                                                <View className="flex-row items-center">
                                                                    <Text className="w-24 text-slate-500 font-medium text-[11px]">Passport No.</Text>
                                                                    <Text className="flex-1 font-bold text-slate-800 text-xs">{firstPassenger.passportNumber || '-'}</Text>
                                                                </View>
                                                                <View className="flex-row items-center">
                                                                    <Text className="w-24 text-slate-500 font-medium text-[11px]">Nationality</Text>
                                                                    <Text className="flex-1 font-bold text-slate-700 text-xs">{firstPassenger.nationality || '-'}</Text>
                                                                </View>
                                                            </>
                                                        )}
                                                    </View>
                                                    {extraPassengers > 0 && (
                                                        <View className="bg-blue-100/70 self-start px-3 py-1.5 rounded-lg mt-3 border border-blue-200/50">
                                                            <Text className="text-[10px] font-black text-blue-700">+ {extraPassengers} more passenger{extraPassengers > 1 ? 's' : ''}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            ) : (
                                                <Text className="text-xs text-slate-500 italic">No passenger details available.</Text>
                                            )}
                                        </View>
                                    </View>

                                    {/* AMOUNT / PAYMENT & PNR */}
                                    <View className="p-5 border-b border-slate-50 bg-slate-50/30 flex-row justify-between items-center">
                                        <View>
                                            <Text className="text-3xl font-black text-[#1D4171] tracking-tight mb-2">₹{booking.totalFare?.toLocaleString() || 0}</Text>
                                            {booking.paymentVerified ? (
                                                <View className="flex-row items-center bg-emerald-50 self-start px-3 py-1 rounded-xl border border-emerald-100 shadow-sm">
                                                    <View className="bg-emerald-500 rounded-full p-0.5">
                                                        <Ionicons name="checkmark" size={10} color="white" />
                                                    </View>
                                                    <Text className="text-[9px] font-black text-emerald-700 ml-1.5 uppercase tracking-widest">VERIFIED</Text>
                                                </View>
                                            ) : (
                                                <View className="flex-row items-center bg-amber-50 self-start px-3 py-1 rounded-xl border border-amber-100 shadow-sm">
                                                    <Text className="text-[9px] font-black text-amber-700 uppercase tracking-widest">PENDING</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View className="items-end">
                                            {booking.pnr && (
                                                <View>
                                                    <Text className="text-[9px] text-slate-400 font-black uppercase tracking-widest text-right mb-1">PNR</Text>
                                                    <View className="flex-row items-center bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
                                                        <Text className="font-black text-[#1D4171] text-sm uppercase mr-3 tracking-widest">{booking.pnr}</Text>
                                                        <Ionicons name="copy" size={14} color="#48A0D4" />
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* ACTIONS */}
                                    <View className="p-5 flex-row gap-3 bg-white">
                                        {booking.status === 'Pending' && (
                                            <>
                                                {!booking.paymentVerified ? (
                                                    <TouchableOpacity onPress={() => handleVerifyPayment(booking._id)} className="flex-1 bg-[#1D4171] py-3.5 rounded-2xl items-center justify-center shadow-lg shadow-blue-900/20 active:scale-95">
                                                        <Text className="text-white font-black text-[10px] uppercase tracking-widest">Verify Pay</Text>
                                                    </TouchableOpacity>
                                                ) : (
                                                    <TouchableOpacity onPress={() => handleOpenConfirm(booking)} className="flex-1 bg-[#F07E21] py-3.5 rounded-2xl items-center justify-center shadow-lg shadow-orange-500/20 active:scale-95">
                                                        <Text className="text-white font-black text-[10px] uppercase tracking-widest">Issue Ticket</Text>
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity onPress={() => handleCancelClick(booking)} className="w-14 h-14 bg-rose-50 border border-rose-100 items-center justify-center rounded-2xl shadow-sm active:scale-95">
                                                    <Ionicons name="arrow-undo" size={20} color="#e11d48" />
                                                </TouchableOpacity>
                                            </>
                                        )}
                                        
                                        {(isConfirmed || isCancelled) && (
                                            <View className="flex-1 flex-row gap-3">
                                                <TouchableOpacity onPress={() => handleViewClick(booking)} className="flex-1 bg-white border-2 border-slate-200 py-3 rounded-2xl items-center justify-center flex-row gap-2 active:scale-95">
                                                    <Ionicons name="eye" size={16} color="#1D4171" />
                                                    <Text className="text-[#1D4171] font-black text-[10px] uppercase tracking-widest">View</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handlePrintClick(booking)} className="flex-1 bg-white border-2 border-slate-200 py-3 rounded-2xl items-center justify-center flex-row gap-2 active:scale-95">
                                                    <Ionicons name="print" size={16} color="#1D4171" />
                                                    <Text className="text-[#1D4171] font-black text-[10px] uppercase tracking-widest">Print</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )})
                        )}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}

                {/* Modals updated to match aesthetic */}
                {/* Issue Ticket Modal */}
                <Modal visible={isModalOpen} animationType="slide" transparent>
                    <View className="flex-1 bg-slate-900/50 justify-end">
                        <View className="bg-white rounded-t-[2.5rem] max-h-[90%] shadow-2xl">
                            <View className="bg-[#F07E21] p-6 rounded-t-[2.5rem] flex-row justify-between items-center">
                                <Text className="text-white text-xl font-black uppercase tracking-widest">Issue Ticket</Text>
                                <TouchableOpacity onPress={() => setIsModalOpen(false)} className="w-10 h-10 bg-white/20 rounded-full items-center justify-center active:scale-95">
                                    <Ionicons name="close" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                            
                            <ScrollView showsVerticalScrollIndicator={false} className="p-8">
                                <View className="bg-slate-50 p-5 rounded-3xl flex-row items-center gap-4 border border-slate-100 mb-8 shadow-inner">
                                    <View className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-100">
                                        <Ionicons name="airplane" size={24} color="#1D4171" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confirming For</Text>
                                        <Text className="font-black text-[#1D4171] text-lg">{selectedBooking?.flightId?.flightNumber}</Text>
                                        <Text className="font-bold text-[#F07E21] text-xs mt-0.5">{selectedBooking?.flightId?.fromCity} → {selectedBooking?.flightId?.toCity}</Text>
                                    </View>
                                </View>

                                <View className="mb-6">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">GDS Confirmation PNR *</Text>
                                    <View className="relative justify-center">
                                        <View className="absolute left-5 z-10">
                                            <Ionicons name="card" size={22} color="#48A0D4" />
                                        </View>
                                        <TextInput 
                                            className="bg-slate-50 pl-14 pr-5 py-5 rounded-2xl font-black text-lg text-slate-800 border border-slate-200 shadow-inner"
                                            placeholder="e.g. ABCDEF"
                                            placeholderTextColor="#cbd5e1"
                                            autoCapitalize="characters"
                                            value={pnr}
                                            onChangeText={t => setPnr(t.toUpperCase())}
                                        />
                                    </View>
                                </View>
                                
                                <View className="mb-8">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Ticket Number *</Text>
                                    <View className="relative justify-center">
                                        <View className="absolute left-5 z-10">
                                            <Ionicons name="ticket" size={22} color="#48A0D4" />
                                        </View>
                                        <TextInput 
                                            className="bg-slate-50 pl-14 pr-5 py-5 rounded-2xl font-black text-lg text-slate-800 border border-slate-200 shadow-inner"
                                            placeholder="e.g. 098-1234567890"
                                            placeholderTextColor="#cbd5e1"
                                            value={ticketNumber}
                                            onChangeText={setTicketNumber}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity 
                                    onPress={handleConfirm} 
                                    className="w-full bg-[#1D4171] py-5 rounded-2xl items-center mb-10 flex-row justify-center shadow-xl shadow-blue-900/20 active:scale-95"
                                >
                                    <Ionicons name="checkmark-circle" size={20} color="white" className="mr-3" />
                                    <Text className="text-white font-black uppercase text-sm tracking-widest">Confirm & Issue</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Cancel & Refund Modal */}
                <Modal visible={isCancelModalOpen} animationType="fade" transparent>
                    <View className="flex-1 bg-slate-900/50 justify-center p-5">
                        <View className="bg-white rounded-[3rem] overflow-hidden shadow-2xl">
                            <View className="bg-rose-500 p-6 flex-row justify-between items-center">
                                <Text className="text-white text-xl font-black uppercase tracking-widest ml-2">Refund Agent</Text>
                                <TouchableOpacity onPress={() => setIsCancelModalOpen(false)} className="w-10 h-10 bg-white/20 rounded-full items-center justify-center active:scale-95">
                                    <Ionicons name="close" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                            
                            <View className="p-8">
                                <View className="bg-rose-50 p-5 rounded-3xl flex-row items-center gap-5 border border-rose-100 mb-8 shadow-inner">
                                    <View className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-rose-100">
                                        <Ionicons name="warning" size={28} color="#e11d48" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Cancelling For</Text>
                                        <Text className="font-black text-rose-700 text-lg">{selectedCancelBooking?.flightId?.flightNumber}</Text>
                                        <Text className="font-bold text-rose-500 text-xs mt-0.5">{selectedCancelBooking?.flightId?.fromCity} → {selectedCancelBooking?.flightId?.toCity}</Text>
                                    </View>
                                </View>

                                <View className="mb-8">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Reason / Remarks (Optional)</Text>
                                    <TextInput 
                                        className="bg-slate-50 p-5 rounded-2xl font-bold text-base text-slate-800 border border-slate-200 h-32 shadow-inner"
                                        placeholder="E.g., Flight fully booked..."
                                        placeholderTextColor="#cbd5e1"
                                        multiline
                                        textAlignVertical="top"
                                        value={cancelRemarks}
                                        onChangeText={setCancelRemarks}
                                    />
                                    <Text className="text-[9px] font-bold text-slate-400 ml-1 mt-2">This message will be shown to the agent.</Text>
                                </View>

                                <TouchableOpacity 
                                    onPress={submitCancel} 
                                    className="w-full bg-rose-500 py-5 rounded-2xl items-center flex-row justify-center shadow-xl shadow-rose-500/20 active:scale-95"
                                >
                                    <Ionicons name="arrow-undo" size={20} color="white" className="mr-3" />
                                    <Text className="text-white font-black uppercase text-sm tracking-widest">Confirm Refund</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* View Details Modal */}
                <Modal visible={isViewModalOpen} animationType="slide" presentationStyle="pageSheet">
                    <View className="flex-1 bg-[#F8FAFC]">
                        {/* Header */}
                        <View className="bg-white px-5 pt-6 pb-4 border-b border-slate-200 flex-row justify-between items-center z-10 shadow-sm">
                            <View>
                                <Text className="text-xl font-black text-[#1D4171] uppercase tracking-widest mb-1">
                                    REQ #{selectedViewBooking?._id?.substring(selectedViewBooking?._id?.length - 6)}
                                </Text>
                                <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {selectedViewBooking?.status} • ₹{selectedViewBooking?.totalFare?.toLocaleString()}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsViewModalOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center active:scale-95">
                                <Ionicons name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
                            {/* Agency & Status */}
                            <View className="bg-white p-5 rounded-2xl border border-slate-100 mb-5 shadow-sm">
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Agency Name</Text>
                                <Text className="text-lg font-black text-[#1D4171] mb-4">{selectedViewBooking?.agentId?.agencyName}</Text>
                                
                                <View className="flex-row justify-between">
                                    <View>
                                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</Text>
                                        <Text className="font-bold text-[#1D4171] text-xs">{new Date(selectedViewBooking?.createdAt || Date.now()).toLocaleDateString()}</Text>
                                    </View>
                                    <View>
                                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment</Text>
                                        <Text className={`font-black text-xs uppercase ${selectedViewBooking?.paymentVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {selectedViewBooking?.paymentVerified ? 'Verified' : 'Pending'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Flight Details */}
                            <Text className="text-xs font-black text-[#1D4171] uppercase tracking-widest mb-3 ml-1"><Ionicons name="airplane" size={14} /> Flight Itinerary</Text>
                            <View className="bg-white p-5 rounded-2xl border border-slate-100 mb-6 shadow-sm">
                                <View className="flex-row justify-between items-center mb-4 border-b border-slate-50 pb-4">
                                    <Text className="text-rose-600 font-black italic">{selectedViewBooking?.flightId?.airlineName}</Text>
                                    <View className="bg-slate-100 px-3 py-1 rounded-md">
                                        <Text className="font-bold text-slate-700 text-xs">{selectedViewBooking?.flightId?.flightNumber}</Text>
                                    </View>
                                </View>
                                <View className="flex-row justify-between items-center mb-5">
                                    <View className="items-center">
                                        <Text className="text-2xl font-black text-[#1D4171]">{selectedViewBooking?.flightId?.fromCity?.substring(0,3).toUpperCase()}</Text>
                                        <Text className="text-[9px] font-bold text-slate-500 uppercase mt-1">{selectedViewBooking?.flightId?.fromCity}</Text>
                                    </View>
                                    <Ionicons name="airplane" size={20} color="#cbd5e1" />
                                    <View className="items-center">
                                        <Text className="text-2xl font-black text-[#1D4171]">{selectedViewBooking?.flightId?.toCity?.substring(0,3).toUpperCase()}</Text>
                                        <Text className="text-[9px] font-bold text-slate-500 uppercase mt-1">{selectedViewBooking?.flightId?.toCity}</Text>
                                    </View>
                                </View>
                                <View className="flex-row justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <View>
                                        <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Departure</Text>
                                        <Text className="font-bold text-[#1D4171] text-xs">{new Date(selectedViewBooking?.flightId?.departureDate || Date.now()).toLocaleDateString()}</Text>
                                    </View>
                                    <View>
                                        <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time</Text>
                                        <Text className="font-bold text-[#1D4171] text-xs">{selectedViewBooking?.flightId?.departureTime}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Passengers */}
                            <Text className="text-xs font-black text-[#1D4171] uppercase tracking-widest mb-3 ml-1"><Ionicons name="people" size={14} /> Passengers</Text>
                            {selectedViewBooking?.passengers?.map((p, i) => (
                                <View key={i} className="bg-white border border-slate-100 rounded-2xl p-4 mb-4 shadow-sm">
                                    <View className="flex-row items-center gap-3 mb-4 border-b border-slate-50 pb-3">
                                        <View className="bg-[#1D4171] w-6 h-6 rounded-full items-center justify-center">
                                            <Text className="text-white font-black text-[10px]">{i + 1}</Text>
                                        </View>
                                        <Text className="font-black text-[#1D4171] text-sm flex-1">{p.firstName} {p.lastName}</Text>
                                        <View className="bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                            <Text className="text-[9px] font-black text-blue-700 uppercase tracking-widest">{p.passengerType || 'Adult'}</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row flex-wrap mb-2">
                                        <View className="w-1/2 mb-3">
                                            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">DOB / Gender</Text>
                                            <Text className="font-bold text-slate-700 text-xs">{p.dob} • {p.gender}</Text>
                                        </View>
                                        <View className="w-1/2 mb-3">
                                            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Contact</Text>
                                            <Text className="font-bold text-slate-700 text-xs">{p.mobileNumber || 'N/A'}</Text>
                                            {p.email && <Text className="text-[9px] text-slate-500 mt-0.5" numberOfLines={1}>{p.email}</Text>}
                                        </View>
                                        
                                        {selectedViewBooking.isInternational && (
                                            <>
                                                <View className="w-1/2 mt-1">
                                                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Passport / Nat</Text>
                                                    <Text className="font-bold text-[#1D4171] text-xs">{p.passportNumber || 'N/A'} <Text className="font-normal text-slate-500">({p.nationality || 'IN'})</Text></Text>
                                                </View>
                                                <View className="w-1/2 mt-1">
                                                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Passport Expiry</Text>
                                                    <Text className="font-bold text-[#1D4171] text-xs">{p.passportExpiry || 'N/A'}</Text>
                                                </View>
                                            </>
                                        )}
                                    </View>
                                </View>
                            ))}
                            {(!selectedViewBooking?.passengers || selectedViewBooking.passengers.length === 0) && (
                                <View className="bg-slate-50 p-5 rounded-2xl items-center border border-slate-200">
                                    <Text className="text-slate-400 font-bold text-xs italic">No passenger details available.</Text>
                                </View>
                            )}
                            <View className="h-10" />
                        </ScrollView>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}
