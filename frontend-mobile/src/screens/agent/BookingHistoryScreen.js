import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, FlatList, TouchableOpacity, ActivityIndicator, 
    RefreshControl, ScrollView, Linking, Alert, Modal, TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { bookingService, BASE_URL } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';
import GoyaflyLoader from '../../components/GoyaflyLoader';

export default function BookingHistoryScreen({ navigation }) {
    const t = useThemeColors();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('FLIGHT');
    
    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    
    // Details Modal
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const entriesPerPage = 20;

    const tabs = [
        { name: 'Flight', key: 'FLIGHT', icon: 'airplane' },
        { name: 'Bus', key: 'BUS', icon: 'bus' },
        { name: 'Cab', key: 'CAB', icon: 'car' },
        { name: 'Hotel', key: 'HOTEL', icon: 'business' },
        { name: 'Insurance', key: 'INSURANCE', icon: 'shield-checkmark' },
        { name: 'Visa', key: 'VISA', icon: 'document-text' }
    ];

    const fetchBookings = useCallback(async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            const params = {
                page: currentPage,
                limit: entriesPerPage,
                serviceType: activeTab,
                status: statusFilter === 'ALL' ? '' : statusFilter,
                fromDate: fromDate,
                toDate: toDate,
                bookingId: searchQuery.trim()
            };
            const res = await bookingService.getAgentHistory(params);
            if (res.success) {
                setBookings(res.data);
                if (res.pagination) {
                    setTotalPages(res.pagination.pages || 1);
                    setTotalEntries(res.pagination.total || res.data.length);
                } else {
                    setTotalPages(1);
                    setTotalEntries(res.data.length);
                }
            }
        } catch (error) {
            console.error('Fetch booking history failed', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab, currentPage, statusFilter, fromDate, toDate, searchQuery]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchBookings(true);
    };

    const handleSearchSubmit = () => {
        setCurrentPage(1);
        fetchBookings();
    };

    const handleDownload = async (booking, type) => {
        try {
            const ref = booking.providerReference || booking.pnr;
            if (!ref) {
                Alert.alert('Not Available', 'Reference PNR is not available for download.');
                return;
            }
            const res = type === 'INVOICE'
                ? await bookingService.ftdDownloadInvoice(ref)
                : await bookingService.ftdDownloadTicket(ref);
            if (res.success && res.url) {
                let fullUrl = res.url;
                if (!res.url.startsWith('http://') && !res.url.startsWith('https://')) {
                    const cleanUrl = res.url.startsWith('/') ? res.url : `/${res.url}`;
                    fullUrl = `${BASE_URL}${cleanUrl}`;
                }
                Linking.openURL(fullUrl).catch(err => {
                    Alert.alert('Error', 'Could not open ticket PDF.');
                });
            } else {
                Alert.alert('Not Available', res.message || 'The PDF has not been generated yet.');
            }
        } catch (error) {
            console.error('Download failed', error);
            Alert.alert('Error', 'Failed to retrieve download link.');
        }
    };

    const getStatusStyle = (status) => {
        const s = (status || '').toUpperCase();
        if (s === 'CONFIRMED' || s === 'SUCCESS' || s === 'TICKETED') {
            return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
        }
        if (s === 'REJECTED' || s === 'CANCELLED' || s === 'FAILED') {
            return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
        }
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
    };

    const getPaxName = (b) => {
        const details = b.passengerDetails;
        if (!details) return 'N/A';
        if (Array.isArray(details) && details[0]) {
            const p = details[0];
            if (p.fName || p.lName) return `${p.title || ''} ${p.fName || ''} ${p.lName || ''}`.trim();
            return p.passengerName || p.name || 'N/A';
        }
        if (typeof details === 'object') return details.name || details.passengerName || 'N/A';
        return 'N/A';
    };

    const renderBookingItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        const netAmount = item.totalCost - (item.commissionEarned || 0);
        const isFlight = activeTab === 'FLIGHT';
        const isConfirmed = item.status === 'CONFIRMED' || item.status === 'SUCCESS' || item.status === 'TICKETED';

        return (
            <View 
                style={{ backgroundColor: t.card, borderColor: t.cardBorder, borderLeftColor: '#1D4171', elevation: 4 }}
                className="mx-4 mb-5 rounded-[2rem] border border-slate-100 border-b-4 border-l-8 shadow-sm overflow-hidden"
            >
                <View className="p-5">
                    {/* Header Row */}
                    <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <View className="flex-1">
                            <View className="flex-row items-center mb-1">
                                <Text style={{ color: t.text }} className="font-black text-sm uppercase tracking-wide">
                                    {item.fromCity || 'Flight'}
                                </Text>
                                <View className="mx-2">
                                    <Ionicons name={isFlight ? "airplane" : "arrow-forward"} size={13} color="#F07E21" />
                                </View>
                                <Text style={{ color: t.text }} className="font-black text-sm uppercase tracking-wide">
                                    {item.toCity || 'Booking'}
                                </Text>
                            </View>
                            <Text style={{ color: t.textMuted }} className="text-[9px] font-bold uppercase tracking-wider">
                                {new Date(item.createdAt).toLocaleString()}
                            </Text>
                        </View>
                        <View style={{ backgroundColor: statusStyle.bg, borderColor: statusStyle.border }} className="px-3 py-1 rounded-xl border">
                            <Text style={{ color: statusStyle.text }} className="text-[9px] font-black uppercase tracking-wider">
                                {item.status === 'CONFIRMED' ? 'SUCCESS' : item.status}
                            </Text>
                        </View>
                    </View>

                    {/* Content Detail Card */}
                    <View style={{ backgroundColor: t.isDark ? '#1e293b' : '#F8FAFC', borderColor: t.cardBorder }} className="rounded-2xl p-4 border mb-4">
                        <View className="flex-row justify-between mb-3">
                            <View className="flex-1 mr-2">
                                <Text style={{ color: t.textMuted }} className="text-[8px] font-black uppercase tracking-widest mb-0.5">Passenger</Text>
                                <Text style={{ color: t.text }} className="font-black text-xs uppercase" numberOfLines={1}>
                                    {getPaxName(item)}
                                </Text>
                            </View>
                            <View className="items-end">
                                <Text style={{ color: t.textMuted }} className="text-[8px] font-black uppercase tracking-widest mb-0.5">PNR</Text>
                                <Text style={{ color: '#1D4171' }} className="font-black text-xs uppercase tracking-wider font-mono bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-sm">
                                    {item.providerReference || 'N/A'}
                                </Text>
                            </View>
                        </View>
                        
                        <View className="flex-row justify-between pt-3 border-t border-slate-200/60">
                            <View>
                                <Text style={{ color: t.textMuted }} className="text-[8px] font-black uppercase tracking-widest mb-0.5">Carrier</Text>
                                <Text style={{ color: t.text }} className="font-bold text-xs uppercase">
                                    {item.airline || item.serviceType}
                                </Text>
                            </View>
                            <View className="items-end">
                                <Text style={{ color: t.textMuted }} className="text-[8px] font-black uppercase tracking-widest mb-0.5">Travel Date</Text>
                                <Text style={{ color: t.text }} className="font-bold text-xs">
                                    {new Date(item.travelDate || item.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Actions and Net Amount */}
                    <View className="flex-row items-center justify-between pt-1">
                        <View className="flex-row items-center gap-1.5">
                            <TouchableOpacity 
                                onPress={() => { setSelectedBooking(item); setShowDetailModal(true); }}
                                style={{ backgroundColor: '#1D4171' }}
                                className="w-8 h-8 rounded-xl items-center justify-center active:scale-95 shadow-sm"
                            >
                                <Ionicons name="eye-outline" size={15} color="#fff" />
                            </TouchableOpacity>

                            {isConfirmed && (
                                <>
                                    <TouchableOpacity 
                                        onPress={() => handleDownload(item, 'TICKET')}
                                        style={{ backgroundColor: '#F07E21' }}
                                        className="w-8 h-8 rounded-xl items-center justify-center active:scale-95 shadow-sm"
                                    >
                                        <Ionicons name="download-outline" size={15} color="#fff" />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => handleDownload(item, 'INVOICE')}
                                        style={{ backgroundColor: '#48A0D4' }}
                                        className="w-8 h-8 rounded-xl items-center justify-center active:scale-95 shadow-sm"
                                    >
                                        <Ionicons name="document-text-outline" size={15} color="#fff" />
                                    </TouchableOpacity>
                                </>
                            )}

                            {!isConfirmed && item.status !== 'CANCELLED' && isFlight && (
                                <>
                                    <TouchableOpacity 
                                        onPress={() => navigation.navigate('FlightCancellation', { id: item.ftdBookingRef || item.providerReference || item.pnr || item._id })}
                                        className="bg-red-50 border border-red-100 w-8 h-8 rounded-xl items-center justify-center active:scale-95"
                                    >
                                        <Ionicons name="close-circle-outline" size={15} color="#dc2626" />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => navigation.navigate('FlightReschedule', { id: item.ftdBookingRef || item.providerReference || item.pnr || item._id })}
                                        className="bg-sky-50 border border-sky-100 w-8 h-8 rounded-xl items-center justify-center active:scale-95"
                                    >
                                        <Ionicons name="sync-outline" size={15} color="#0369a1" />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        <View className="items-end">
                            <Text style={{ color: t.textMuted }} className="text-[8px] font-black uppercase mb-0.5 tracking-wider">Net Amount</Text>
                            <Text style={{ color: '#1D4171' }} className="font-black text-base">
                                ₹{netAmount.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="light" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Brand Header */}
                <View style={{ backgroundColor: '#1D4171' }} className="pt-6 pb-12 px-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
                    <View className="flex-row items-center justify-between mb-6">
                        <TouchableOpacity 
                            onPress={() => navigation.goBack()} 
                            className="w-11 h-11 bg-white/10 rounded-2xl items-center justify-center border border-white/20 border-b-4 border-b-white/30 active:scale-95"
                        >
                            <Ionicons name="chevron-back" size={20} color="#fff" />
                        </TouchableOpacity>
                        <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest">Secure Terminal</Text>
                        <View className="w-11 h-11" />
                    </View>
                    <Text className="text-white text-3xl font-black mb-1">My Bookings</Text>
                    <Text className="text-white/50 text-[9px] font-black uppercase tracking-widest">Dynamic GDS Ledger</Text>
                    
                    {/* Search & Filter Trigger */}
                    <View className="mt-6 flex-row gap-3">
                        <View className="flex-1 bg-white/10 rounded-2xl flex-row items-center px-4 h-12 border border-white/20">
                            <Ionicons name="search" size={16} color="rgba(255,255,255,0.6)" />
                            <TextInput 
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search PNR or Guest..."
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                onSubmitEditing={handleSearchSubmit}
                                className="flex-1 ml-2 text-white font-bold text-xs"
                            />
                        </View>
                        <TouchableOpacity 
                            onPress={() => setShowFilterModal(true)}
                            style={{ backgroundColor: statusFilter !== 'ALL' || fromDate !== '' ? '#F07E21' : 'rgba(255,255,255,0.1)' }}
                            className="w-12 h-12 rounded-2xl items-center justify-center border border-white/10 active:scale-95 shadow-sm"
                        >
                            <Ionicons name="options" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Category Horizontal Navigation */}
                <View className="-mt-6 px-4 mb-4">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="flex-row gap-2 pb-2">
                             {tabs.map(tab => (
                                 <TouchableOpacity
                                    key={tab.key}
                                    onPress={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                                    style={{ 
                                        backgroundColor: activeTab === tab.key ? '#fff' : '#1e293b',
                                        borderColor: activeTab === tab.key ? '#cbd5e1' : '#334155'
                                    }}
                                    className={`flex-row items-center gap-2.5 px-6 py-3.5 rounded-2xl shadow-sm border border-b-4 active:scale-95 ${activeTab === tab.key ? 'border-b-slate-300' : 'border-b-slate-800'}`}
                                 >
                                    <Ionicons name={tab.icon} size={14} color={activeTab === tab.key ? '#F07E21' : '#94a3b8'} />
                                    <Text className={`text-[10px] font-black uppercase tracking-wider ${activeTab === tab.key ? 'text-[#1D4171]' : 'text-slate-300'}`}>
                                        {tab.name}
                                    </Text>
                                 </TouchableOpacity>
                             ))}
                        </View>
                    </ScrollView>
                </View>

                {/* List Container */}
                {loading && !refreshing ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#F07E21" />
                        <Text style={{ color: t.textMuted }} className="mt-4 font-black uppercase text-[9px] tracking-widest">Syncing Ledger...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={bookings}
                        renderItem={renderBookingItem}
                        keyExtractor={item => item._id}
                        onRefresh={handleRefresh}
                        refreshing={refreshing}
                        contentContainerStyle={{ paddingTop: 10, paddingBottom: 60 }}
                        ListEmptyComponent={
                            <View className="py-20 items-center opacity-30">
                                <Ionicons name="receipt-outline" size={60} color="#cbd5e1" />
                                <Text style={{ color: t.text }} className="mt-4 font-black uppercase text-xs tracking-widest">No bookings found</Text>
                            </View>
                        }
                    />
                )}

                {/* MODAL: Filter Modal */}
                <Modal visible={showFilterModal} transparent animationType="slide">
                    <View className="flex-1 bg-black/60 justify-end">
                        <View style={{ backgroundColor: t.card }} className="rounded-t-[2.5rem] p-6 pb-10 border-t border-slate-100">
                            <View className="flex-row justify-between items-center mb-6 pb-3 border-b border-slate-100">
                                <Text style={{ color: t.text }} className="text-lg font-black uppercase tracking-wide">Advanced Filters</Text>
                                <TouchableOpacity onPress={() => setShowFilterModal(false)} className="w-10 h-10 bg-slate-100 rounded-xl items-center justify-center active:scale-95">
                                    <Ionicons name="close" size={20} color="#0f172a" />
                                </TouchableOpacity>
                            </View>

                            {/* Status Filter */}
                            <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase mb-3 ml-1 tracking-widest">Booking Status</Text>
                            <View className="flex-row flex-wrap gap-2 mb-6">
                                {['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'].map(s => (
                                    <TouchableOpacity 
                                        key={s} 
                                        onPress={() => setStatusFilter(s)}
                                        style={{ 
                                            backgroundColor: statusFilter === s ? '#1D4171' : '#F1F5F9',
                                        }}
                                        className="px-4 py-2.5 rounded-xl active:scale-95"
                                    >
                                        <Text style={{ color: statusFilter === s ? '#fff' : '#475569' }} className="text-[10px] font-black uppercase">
                                            {s === 'CONFIRMED' ? 'SUCCESS' : s}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* From/To Date Picker inputs */}
                            <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase mb-3 ml-1 tracking-widest">Travel Dates</Text>
                            <View className="flex-row gap-3 mb-8">
                                <View className="flex-1">
                                    <Text className="text-[8px] font-bold text-slate-400 mb-1 ml-1">FROM DATE</Text>
                                    <TextInput 
                                        value={fromDate}
                                        onChangeText={setFromDate}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#A0AEC0"
                                        style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}
                                        className="px-4 py-3 rounded-xl border text-xs font-bold text-slate-700"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[8px] font-bold text-slate-400 mb-1 ml-1">TO DATE</Text>
                                    <TextInput 
                                        value={toDate}
                                        onChangeText={setToDate}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#A0AEC0"
                                        style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}
                                        className="px-4 py-3 rounded-xl border text-xs font-bold text-slate-700"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity 
                                onPress={() => { setShowFilterModal(false); fetchBookings(); }}
                                className="bg-[#F07E21] py-4 rounded-xl items-center shadow-md active:scale-95"
                            >
                                <Text className="text-white font-black uppercase text-xs tracking-widest">Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* MODAL: Detailed View */}
                {showDetailModal && selectedBooking && (
                    <Modal visible={showDetailModal} transparent animationType="slide">
                        <View className="flex-1 bg-black/60 justify-end">
                            <View style={{ backgroundColor: t.card }} className="rounded-t-[2.5rem] p-6 pb-10 border-t border-slate-100 max-h-[85vh]">
                                <View className="flex-row justify-between items-center mb-6 pb-3 border-b border-slate-100">
                                    <View>
                                        <Text style={{ color: t.text }} className="text-lg font-black uppercase tracking-wide">Booking Detail View</Text>
                                        <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase font-mono tracking-wider">{selectedBooking.providerReference}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setShowDetailModal(false)} className="w-10 h-10 bg-slate-100 rounded-xl items-center justify-center active:scale-95">
                                        <Ionicons name="close" size={20} color="#0f172a" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView className="space-y-6 mb-6" showsVerticalScrollIndicator={false}>
                                    {/* Sector Route */}
                                    <View className="flex-row items-center justify-between text-center px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                        <View>
                                            <Text style={{ color: '#1D4171' }} className="text-xl font-black uppercase">{selectedBooking.fromCity || 'Flight'}</Text>
                                            <Text className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Origin</Text>
                                        </View>
                                        <Ionicons name="airplane" size={20} color="#F07E21" />
                                        <View className="items-end">
                                            <Text style={{ color: '#1D4171' }} className="text-xl font-black uppercase">{selectedBooking.toCity || 'Booking'}</Text>
                                            <Text className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Arrival</Text>
                                        </View>
                                    </View>

                                    {/* Passenger Info */}
                                    <View className="space-y-2">
                                        <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase tracking-widest ml-1">Passenger Details</Text>
                                        <View className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <Text style={{ color: t.text }} className="font-extrabold text-sm uppercase">{getPaxName(selectedBooking)}</Text>
                                            <Text className="text-[#1D4171] font-bold text-[10px] mt-0.5">Status: {selectedBooking.status}</Text>
                                        </View>
                                    </View>

                                    {/* Financial breakdown */}
                                    <View className="space-y-2">
                                        <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase tracking-widest ml-1">Financial Summary</Text>
                                        <View style={{ backgroundColor: '#0f172a' }} className="p-5 rounded-2xl text-white space-y-2">
                                            <View className="flex-row justify-between items-center opacity-50 text-[10px] font-bold uppercase">
                                                <Text className="text-white text-[10px]">Gross Base Fare</Text>
                                                <Text className="text-white text-[10px]">₹{(selectedBooking.totalCost || 0).toLocaleString()}</Text>
                                            </View>
                                            <View className="h-px bg-white/10" />
                                            <View className="flex-row justify-between items-center">
                                                <Text className="text-white/40 text-[10px] font-bold uppercase">Agency Commission</Text>
                                                <Text className="text-emerald-400 font-bold text-xs">+₹{(selectedBooking.commissionEarned || 0).toLocaleString()}</Text>
                                            </View>
                                            <View className="flex-row justify-between items-end pt-1">
                                                <Text className="text-sky-400 font-black uppercase text-[10px]">Net Payable</Text>
                                                <Text className="text-white text-xl font-black">₹{(selectedBooking.totalCost - (selectedBooking.commissionEarned || 0)).toLocaleString()}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </ScrollView>

                                {/* Action Buttons inside detail view */}
                                {selectedBooking.status !== 'CANCELLED' && (
                                    <View className="flex-row gap-3">
                                        <TouchableOpacity 
                                            onPress={() => { setShowDetailModal(false); handleDownload(selectedBooking, 'TICKET'); }}
                                            className="flex-1 py-4 bg-[#1D4171] rounded-xl items-center shadow-md"
                                        >
                                            <Text className="text-white font-black text-xs uppercase tracking-widest">Get E-Ticket</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            onPress={() => { setShowDetailModal(false); handleDownload(selectedBooking, 'INVOICE'); }}
                                            style={{ borderColor: '#cbd5e1' }}
                                            className="flex-1 py-4 bg-white border rounded-xl items-center"
                                        >
                                            <Text className="text-slate-800 font-black text-xs uppercase tracking-widest">Get Invoice</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    </Modal>
                )}
            </SafeAreaView>
        </View>
    );
}
