import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView, Linking, StyleSheet, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookingService } from '../../services/api';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const THEME = {
    deepBlue: '#1D4171',
    brightOrange: '#F07E21',
    skyBlue: '#48A0D4',
    black: '#000000',
    bg: '#F8FAFC'
};

export default function BookingHistoryScreen({ navigation }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('FLIGHT');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('ALL'); // Simple periods like Today, Week, Month

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
            const res = await bookingService.getAgentHistory(1, 100);
            if (res.success) setBookings(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const handleRefresh = () => { setRefreshing(true); fetchBookings(true); };

    const filteredBookings = useMemo(() => {
        let result = bookings.filter(b => b.serviceType === activeTab);

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(b => 
                (b.providerReference || '').toLowerCase().includes(q) || 
                (b.passengerDetails?.[0]?.name || '').toLowerCase().includes(q) ||
                (b.fromCity || '').toLowerCase().includes(q) ||
                (b.toCity || '').toLowerCase().includes(q)
            );
        }

        if (statusFilter !== 'ALL') {
            result = result.filter(b => b.status === statusFilter);
        }

        // Simple date filtering logic
        const now = new Date();
        if (dateFilter === 'TODAY') {
            result = result.filter(b => new Date(b.createdAt).toDateString() === now.toDateString());
        } else if (dateFilter === 'WEEK') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            result = result.filter(b => new Date(b.createdAt) >= weekAgo);
        }

        return result;
    }, [bookings, activeTab, searchQuery, statusFilter, dateFilter]);

    const getStatusStyle = (status) => {
        const s = status?.toUpperCase();
        if (s === 'CONFIRMED' || s === 'SUCCESS' || s === 'TICKETED') return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
        if (s === 'REJECTED' || s === 'CANCELLED' || s === 'FAILED') return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
    };

    const renderBookingItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        const netAmount = item.totalCost - (item.commissionEarned || 0);

        return (
            <View 
                className="mx-5 mb-6 bg-white rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 overflow-hidden border-l-[8px]" 
                style={{ borderLeftColor: THEME.deepBlue, elevation: 8 }}
            >
                <View className="p-6">
                    {/* Header Row */}
                    <View className="flex-row items-center justify-between mb-5 pb-4 border-b border-slate-50">
                        <View className="flex-1">
                            <View className="flex-row items-center mb-1.5">
                                <Text className="font-black text-base text-slate-900 uppercase tracking-wide">{item.fromCity || 'Flight'}</Text>
                                <View className="mx-2.5">
                                    <Ionicons name="airplane" size={14} color={THEME.brightOrange} />
                                </View>
                                <Text className="font-black text-base text-slate-900 uppercase tracking-wide">{item.toCity || 'Booking'}</Text>
                            </View>
                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.createdAt).toLocaleString()}</Text>
                        </View>
                        <View style={{ backgroundColor: statusStyle.bg, borderColor: statusStyle.border }} className="px-3.5 py-2 rounded-2xl border border-b-4 shadow-sm">
                            <Text style={{ color: statusStyle.text }} className="text-[10px] font-black uppercase tracking-wider">{item.status === 'CONFIRMED' ? 'SUCCESS' : item.status}</Text>
                        </View>
                    </View>

                    {/* Info Block */}
                    <View className="bg-slate-50 rounded-3xl p-5 border border-slate-100 mb-6 shadow-inner">
                        <View className="flex-row justify-between mb-4">
                            <View className="flex-1 mr-2">
                                <Text className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Lead Passenger</Text>
                                <Text className="font-black text-xs text-slate-800 uppercase tracking-wide mb-1" numberOfLines={1}>{item.passengerDetails?.[0]?.name || 'N/A'}</Text>
                                <Text className="text-[10px] text-sky-600 font-black tracking-wider">✓ FTD GDS Verified</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Ref PNR</Text>
                                <Text className="font-black text-xs text-[#1D4171] uppercase tracking-wider font-mono bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-sm">{item.providerReference || 'N/A'}</Text>
                            </View>
                        </View>
                        <View className="flex-row justify-between pt-4 border-t border-slate-200/60">
                            <View>
                                <Text className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Airline</Text>
                                <Text className="font-black text-xs text-slate-800 uppercase tracking-wide">{item.airline || item.serviceType}</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Travel Date</Text>
                                <Text className="font-black text-xs text-slate-800 tracking-wide">{new Date(item.travelDate || item.createdAt).toLocaleDateString()}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Actions */}
                    <View className="flex-row items-center justify-between pt-2 border-t border-slate-50">
                        <View className="flex-row gap-2.5">
                            <TouchableOpacity 
                                onPress={() => navigation.navigate('ManageBooking', { booking: item })}
                                style={{ backgroundColor: THEME.deepBlue }}
                                className="px-4 py-3.5 rounded-2xl flex-row items-center border border-b-4 border-[#15305B] shadow-sm active:scale-95"
                            >
                                <Ionicons name="eye" size={14} color="#fff" style={{marginRight: 6}} />
                                <Text className="text-white text-[10px] font-black uppercase tracking-wider">Details</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => navigation.navigate('FlightCancellation', { id: item.ftdBookingRef || item.providerReference || item.pnr || item._id })}
                                style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5' }}
                                className="px-4 py-3.5 rounded-2xl flex-row items-center border border-b-4 border-b-red-300 shadow-sm active:scale-95"
                            >
                                <Ionicons name="close-circle" size={14} color="#dc2626" style={{marginRight: 6}} />
                                <Text className="text-red-600 text-[10px] font-black uppercase tracking-wider">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => navigation.navigate('FlightReschedule', { id: item.ftdBookingRef || item.providerReference || item.pnr || item._id })}
                                style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}
                                className="px-4 py-3.5 rounded-2xl flex-row items-center border border-b-4 border-b-sky-300 shadow-sm active:scale-95"
                            >
                                <Ionicons name="sync" size={14} color="#0369a1" style={{marginRight: 6}} />
                                <Text className="text-sky-700 text-[10px] font-black uppercase tracking-wider">Reissue</Text>
                            </TouchableOpacity>
                        </View>
                        <View className="items-end">
                            <Text className="text-[9px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">Net Payable</Text>
                            <Text style={{ color: THEME.deepBlue }} className="font-black text-xl tracking-tight">₹{netAmount.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: THEME.bg }}>
            <StatusBar style="light" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Brand Header */}
                <View style={{ backgroundColor: THEME.deepBlue }} className="pt-8 pb-16 px-6 rounded-b-[3rem] shadow-2xl relative overflow-hidden border-b border-blue-900/30">
                    <View className="flex-row items-center justify-between mb-8">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center border border-white/20 border-b-4 border-b-white/30 active:scale-95 shadow-sm">
                            <Ionicons name="chevron-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">Secure Terminal</Text>
                        <View className="w-12 h-12"></View>
                    </View>
                    <Text className="text-white text-4xl font-black mb-1 tracking-wide">My Bookings</Text>
                    <Text className="text-white/50 text-xs font-black uppercase tracking-widest">Pixel-Perfect Ledger Flow</Text>
                    
                    {/* Search Bar - Web Parity */}
                    <View className="mt-8 flex-row gap-3">
                        <View className="flex-1 bg-white/10 rounded-2xl flex-row items-center px-5 h-14 border border-white/20 shadow-inner">
                            <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
                            <TextInput 
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search PNR or Guest..."
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                className="flex-1 ml-3 text-white font-bold text-sm"
                            />
                        </View>
                        <TouchableOpacity 
                            onPress={() => setShowFilterModal(true)}
                            className={`w-14 h-14 rounded-2xl items-center justify-center border border-b-4 active:scale-95 shadow-sm ${statusFilter !== 'ALL' || dateFilter !== 'ALL' ? 'bg-[#F07E21] border-[#F07E21] border-b-[#D96B18]' : 'bg-white/10 border-white/20 border-b-white/30'}`}
                        >
                            <Ionicons name="options" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Category Navigation Restored */}
                <View className="-mt-7 px-5">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="flex-row gap-2.5 pb-2">
                             {tabs.map(tab => (
                                 <TouchableOpacity
                                    key={tab.key}
                                    onPress={() => setActiveTab(tab.key)}
                                    style={{ 
                                        backgroundColor: activeTab === tab.key ? '#fff' : '#1e293b',
                                        borderColor: activeTab === tab.key ? '#cbd5e1' : '#334155'
                                    }}
                                    className={`flex-row items-center gap-3 px-7 py-4 rounded-2xl shadow-lg border border-b-4 active:scale-95 ${activeTab === tab.key ? 'border-b-slate-300' : 'border-b-slate-700'}`}
                                 >
                                    <Ionicons name={tab.icon} size={16} color={activeTab === tab.key ? THEME.brightOrange : '#94a3b8'} />
                                    <Text className={`text-xs font-black uppercase tracking-wider ${activeTab === tab.key ? 'text-[#1D4171]' : 'text-slate-300'}`}>
                                        {tab.name}
                                    </Text>
                                 </TouchableOpacity>
                             ))}
                        </View>
                    </ScrollView>
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color={THEME.brightOrange} />
                        <Text className="mt-5 text-slate-400 font-black uppercase text-[10px] tracking-widest">Synching GDS Ledger...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredBookings}
                        renderItem={renderBookingItem}
                        keyExtractor={item => item._id}
                        onRefresh={handleRefresh}
                        refreshing={refreshing}
                        ListEmptyComponent={
                            <View className="py-24 items-center">
                                <Ionicons name="receipt-outline" size={60} color="#cbd5e1" />
                                <Text className="mt-6 font-black text-slate-400 uppercase text-xs tracking-widest">No entries found</Text>
                            </View>
                        }
                        contentContainerStyle={{ paddingTop: 24, paddingBottom: 60 }}
                    />
                )}

                {/* Filter Modal */}
                <Modal visible={showFilterModal} transparent animationType="slide">
                    <View className="flex-1 bg-black/60 justify-end">
                        <View className="bg-white rounded-t-[3rem] p-8 pb-12 shadow-2xl border-t border-slate-100">
                            <View className="flex-row justify-between items-center mb-10 pb-4 border-b border-slate-100">
                                <Text className="text-2xl font-black text-[#1D4171] uppercase tracking-wide">Advanced Filters</Text>
                                <TouchableOpacity onPress={() => setShowFilterModal(false)} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm">
                                    <Ionicons name="close" size={24} color="#0f172a" />
                                </TouchableOpacity>
                            </View>

                            <Text className="text-[10px] font-black text-slate-400 uppercase mb-4 ml-1 tracking-widest">Status Type</Text>
                            <View className="flex-row flex-wrap gap-2.5 mb-8">
                                {['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'].map(s => (
                                    <TouchableOpacity 
                                        key={s} onPress={() => setStatusFilter(s)}
                                        className={`px-6 py-3.5 rounded-2xl border border-b-4 active:scale-95 shadow-sm ${statusFilter === s ? 'bg-[#1D4171] border-[#1D4171] border-b-[#15305B]' : 'bg-white border-slate-100 border-b-slate-200'}`}
                                    >
                                        <Text className={`text-[10px] font-black uppercase tracking-wider ${statusFilter === s ? 'text-white' : 'text-slate-600'}`}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text className="text-[10px] font-black text-slate-400 uppercase mb-4 ml-1 tracking-widest">Period</Text>
                            <View className="flex-row gap-2.5 mb-10">
                                {['ALL', 'TODAY', 'WEEK'].map(d => (
                                    <TouchableOpacity 
                                        key={d} onPress={() => setDateFilter(d)}
                                        className={`flex-1 py-4 rounded-2xl border border-b-4 items-center active:scale-95 shadow-sm ${dateFilter === d ? 'bg-[#1D4171] border-[#1D4171] border-b-[#15305B]' : 'bg-white border-slate-100 border-b-slate-200'}`}
                                    >
                                        <Text className={`text-[10px] font-black uppercase tracking-wider ${dateFilter === d ? 'text-white' : 'text-slate-600'}`}>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity 
                                onPress={() => setShowFilterModal(false)}
                                className="bg-[#F07E21] py-5 rounded-2xl items-center border border-[#F07E21] border-b-[6px] border-[#D96B18] shadow-xl shadow-orange-500/30 active:scale-95"
                            >
                                <Text className="text-white font-black uppercase text-sm tracking-widest">Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}
