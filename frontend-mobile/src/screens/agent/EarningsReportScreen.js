import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { agentService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function EarningsReportScreen({ navigation }) {
    const t = useThemeColors();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchReport = useCallback(async () => {
        try {
            const res = await agentService.getEarningsReport();
            if (res.success) setStats(res.data);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: t.bg }}>
                <ActivityIndicator size="large" color="#F07E21" />
                <Text className="mt-4 font-black text-gray-400 uppercase text-[10px]">Analyzing Finances...</Text>
            </View>
        );
    }

    const totalProfit = stats?.serviceBreakdown?.reduce((sum, s) => sum + s.totalCommission, 0) || 0;
    const totalBookings = stats?.serviceBreakdown?.reduce((sum, s) => sum + s.count, 0) || 0;

    return (
        <View style={{ flex: 1, backgroundColor: t.isDark ? '#0f172a' : '#f8fafc' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-6 py-6 flex-row items-center border-b border-gray-100 bg-white">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-11 h-11 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 shadow-sm mr-4 active:scale-95">
                        <Ionicons name="chevron-back" size={20} color="#000" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-2xl font-black text-slate-900">Earnings Report</Text>
                        <Text className="text-slate-400 text-[9px] font-black uppercase">Revenue Analytics Dashboard</Text>
                    </View>
                </View>

                <ScrollView 
                    className="flex-1 px-6" 
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchReport();}} />}
                >
                    {/* KPI Cards */}
                    <View className="mt-8 space-y-4">
                        <LinearGradient colors={['#10b981', '#059669']} style={{ elevation: 8 }} className="p-8 rounded-[2.5rem] border border-emerald-400 border-b-[8px] border-emerald-700 shadow-2xl shadow-green-900/30 relative overflow-hidden">
                             <View className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                             <Text className="text-[10px] font-black text-white/60 uppercase mb-2 tracking-widest">Total Net Profit</Text>
                             <Text className="text-4xl font-black text-white">₹{totalProfit.toLocaleString('en-IN')}</Text>
                             <View className="mt-4 flex-row items-center">
                                 <Ionicons name="trending-up" size={16} color="white" />
                                 <Text className="ml-2 text-[10px] font-black text-white uppercase tracking-widest">Lifetime Earnings</Text>
                             </View>
                        </LinearGradient>

                        <View className="flex-row gap-4">
                            <View className="flex-1 bg-white p-6 rounded-[2rem] border border-slate-100 border-b-[6px] border-slate-200 shadow-sm" style={{ elevation: 6 }}>
                                <Text className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Bookings</Text>
                                <Text className="text-2xl font-black text-slate-900">{totalBookings}</Text>
                            </View>
                            <View className="flex-1 bg-white p-6 rounded-[2rem] border border-slate-100 border-b-[6px] border-slate-200 shadow-sm" style={{ elevation: 6 }}>
                                <Text className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Avg / Sale</Text>
                                <Text className="text-2xl font-black text-slate-900">₹{totalBookings > 0 ? Math.round(totalProfit / totalBookings).toLocaleString('en-IN') : 0}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Service Breakdown */}
                    <Text className="mt-10 mb-6 text-[11px] font-black text-slate-400 uppercase ml-1 tracking-widest">Revenue by Service</Text>
                    <View className="bg-white rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 p-8 shadow-2xl shadow-slate-300/40 space-y-8" style={{ elevation: 8 }}>
                        {stats?.serviceBreakdown?.map(s => {
                            const share = totalProfit > 0 ? Math.round((s.totalCommission / totalProfit) * 100) : 0;
                            return (
                                <View key={s._id}>
                                    <View className="flex-row justify-between items-center mb-3">
                                        <View className="flex-row items-center gap-4">
                                            <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center">
                                                <Text className="text-lg">{s._id === 'FLIGHT' ? '✈️' : s._id === 'HOTEL' ? '🏨' : '🎟️'}</Text>
                                            </View>
                                            <View>
                                                <Text className="font-black text-slate-900 text-sm">{s._id}</Text>
                                                <Text className="text-[9px] font-black text-slate-400 uppercase">{s.count} Sales</Text>
                                            </View>
                                        </View>
                                        <Text className="font-black text-slate-900 text-base">₹{s.totalCommission.toLocaleString('en-IN')}</Text>
                                    </View>
                                    <View className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                                        <View style={{ width: `${share}%`, backgroundColor: s._id === 'FLIGHT' ? '#48A0D4' : '#f59e0b' }} className="h-full rounded-full" />
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Monthly Growth */}
                    <Text className="mt-10 mb-6 text-[11px] font-black text-slate-400 uppercase ml-1 tracking-widest">Historical Performance</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6 mb-10">
                        {stats?.monthlyHistory?.map(m => (
                            <View key={m._id} className="bg-slate-900 p-8 rounded-[2.5rem] mr-4 w-40 items-center justify-center border border-slate-800 border-b-[8px] border-slate-950 shadow-2xl shadow-slate-900/40" style={{ elevation: 8 }}>
                                <Text className="text-slate-500 font-black text-[9px] uppercase mb-3 tracking-widest">{m._id}</Text>
                                <Text className="text-white font-black text-xl mb-1">₹{m.profit.toLocaleString()}</Text>
                                <Text className="text-orange-400 font-black text-[9px] uppercase tracking-widest">{m.bookings} Bookings</Text>
                            </View>
                        ))}
                    </ScrollView>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
