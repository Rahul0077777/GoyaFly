import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminService } from '../../services/api';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';
import { Ionicons } from '@expo/vector-icons';

export default function BookingManagerScreen({ navigation }) {
    const t = useThemeColors();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [search, setSearch] = useState('');

    const fetchBookings = useCallback(async (pageNum = 1, isRefresh = false) => {
        try {
            const actualToken = await AsyncStorage.getItem('adminToken');
            if (!actualToken) return;

            if (pageNum === 1 && !isRefresh) setLoading(true);
            const typeMap = { 'Flights': 'FLIGHT', 'Hotels': 'HOTEL', 'Buses': 'BUS', 'Trains': 'TRAIN' };
            const serviceType = activeTab === 'All' ? '' : typeMap[activeTab];
            
            const res = await adminService.getBookings(pageNum, 15, statusFilter, '', serviceType, search);
            if (res.success) {
                if (pageNum === 1) setBookings(res.data);
                else setBookings(prev => [...prev, ...res.data]);
                setHasMore(res.pagination.page < res.pagination.pages);
            }
        } catch (error) { 
            if (error.response?.status !== 401) console.error(error); 
        }
        finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
    }, [statusFilter, activeTab]);

    useEffect(() => { 
        const delay = setTimeout(() => {
            setPage(1); 
            fetchBookings(1, false); 
        }, 500);
        return () => clearTimeout(delay);
    }, [statusFilter, activeTab, search, fetchBookings]);
    const handleRefresh = () => { setRefreshing(true); setPage(1); fetchBookings(1, true); };
    const handleLoadMore = () => {
        if (!loadingMore && hasMore) { setLoadingMore(true); const np = page + 1; setPage(np); fetchBookings(np, false); }
    };

    const getIcon = (type) => type === 'FLIGHT' ? '✈️' : type === 'HOTEL' ? '🏨' : '🚌';
    const statuses = [
        { label: 'All', value: '' }, { label: 'Confirmed', value: 'CONFIRMED' },
        { label: 'Pending', value: 'PENDING' }, { label: 'Cancelled', value: 'CANCELLED' }
    ];

    const categories = ['All', 'Flights', 'Hotels', 'Buses', 'Trains'];

    const renderBookingItem = ({ item }) => (
        <View style={{ backgroundColor: t.card, elevation: 8 }} className="mx-5 mb-6 p-6 rounded-3xl border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40">
            <View className="flex-row justify-between items-start mb-4 pb-4 border-b border-slate-100">
                <View className="flex-row items-center flex-1 pr-2">
                    <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center mr-4 border border-slate-100 shadow-sm">
                        <Text className="text-xl">{getIcon(item.serviceType)}</Text>
                    </View>
                    <View className="flex-1 pr-2">
                        <Text style={{ color: t.text }} className="font-black text-base uppercase tracking-wide">{item.serviceType}</Text>
                        <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest mt-0.5">Ref: {item.providerReference}</Text>
                    </View>
                </View>
                <View className={`px-3.5 py-1.5 rounded-xl border shadow-sm ${item.status === 'CONFIRMED' ? 'bg-emerald-50 border-emerald-200' : item.status === 'CANCELLED' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                    <Text className={`text-[9px] font-black uppercase tracking-widest ${item.status === 'CONFIRMED' ? 'text-emerald-800' : item.status === 'CANCELLED' ? 'text-rose-800' : 'text-amber-800'}`}>{item.status}</Text>
                </View>
            </View>
            <View className="flex-row justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                <View className="flex-1 pr-2">
                    <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase mb-1 tracking-widest">Agency</Text>
                    <Text className="text-slate-900 font-black text-xs tracking-wide" numberOfLines={1}>{item.agentId?.agencyName || 'Direct'}</Text>
                </View>
                <View className="items-end">
                    <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase mb-1 tracking-widest">Amount</Text>
                    <Text className="text-xl font-black text-[#1D4171] tracking-tight">₹{item.totalCost?.toLocaleString()}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-5 py-5 flex-row items-center border-b border-slate-100 mb-2">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm mr-3.5">
                        <Ionicons name="arrow-back" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="bg-emerald-50 w-12 h-12 rounded-2xl items-center justify-center border border-emerald-100 shadow-sm mr-3.5">
                        <Ionicons name="journal" size={24} color="#10b981" />
                    </View>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">Booking Manager</Text>
                        <Text style={{ color: t.textMuted }} className="font-black uppercase text-[10px] tracking-widest mt-0.5">All bookings archive</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View className="px-5 pb-4">
                    <View className="flex-row items-center bg-white px-5 py-4 rounded-2xl border border-slate-100 border-b-4 border-slate-200 shadow-sm">
                        <Ionicons name="search" size={20} color="#64748b" className="mr-3" />
                        <TextInput 
                            className="flex-1 text-slate-800 font-black text-sm" 
                            placeholder="Find PNR or Reference..." 
                            placeholderTextColor="#9ca3af" 
                            value={search} 
                            onChangeText={setSearch} 
                        />
                    </View>
                </View>

                <View className="mb-4 space-y-3">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 pb-1">
                        {categories.map(cat => {
                            const active = activeTab === cat;
                            return (
                                <TouchableOpacity key={cat} onPress={() => setActiveTab(cat)}
                                    className={`px-5 py-2.5 rounded-xl mr-2.5 border border-b-4 active:scale-95 shadow-sm ${active ? 'bg-[#1D4171] border-[#15305B] border-b-[#0f2342]' : 'bg-white border-slate-100 border-b-slate-200'}`}>
                                    <Text className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-slate-400'}`}>{cat}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 pb-2">
                        {statuses.map(s => {
                            const active = statusFilter === s.value;
                            return (
                                <TouchableOpacity key={s.label} onPress={() => setStatusFilter(s.value)}
                                    className={`px-5 py-2.5 rounded-xl mr-2.5 border border-b-4 active:scale-95 shadow-sm ${active ? 'bg-[#F07E21] border-[#D96B18] border-b-[#B35612]' : 'bg-white border-slate-100 border-b-slate-200'}`}>
                                    <Text className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-slate-400'}`}>{s.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {loading && page === 1 ? (
                    <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#1D4171" /></View>
                ) : (
                    <FlatList
                        data={bookings} renderItem={renderBookingItem} keyExtractor={item => item._id}
                        onRefresh={handleRefresh} refreshing={refreshing} onEndReached={handleLoadMore} onEndReachedThreshold={0.5}
                        ListHeaderComponent={<View className="h-1" />}
                        ListFooterComponent={loadingMore ? <ActivityIndicator className="py-8" color="#F07E21" /> : <View className="h-10" />}
                        ListEmptyComponent={
                            <View className="py-20 items-center">
                                <Ionicons name="journal-outline" size={64} color="#cbd5e1" className="mb-4" />
                                <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Bookings Found</Text>
                                <Text style={{ color: t.textSecondary }} className="font-bold text-xs">Try adjusting your filters.</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
