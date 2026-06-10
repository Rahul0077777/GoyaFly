import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminService } from '../../services/api';
import Toast from 'react-native-toast-message';

export default function ReportsAnalyticsScreen({ navigation }) {
    const t = useThemeColors();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(null);
    
    // Filtering State
    const [filter, setFilter] = useState('month'); // today, week, month, custom
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);

    const fetchAnalytics = async (params = {}) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('adminToken');
            if (!token) return;

            const res = await adminService.getAnalytics(params);
            if (res.success) setData(res.data);
        } catch (error) {
            if (error.response?.status !== 401) {
                console.error("Analytics Fetch Error", error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch analytics.' });
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        let params = {};
        const today = new Date();
        
        if (filter === 'today') {
            const dateStr = today.toISOString().split('T')[0];
            params = { startDate: dateStr, endDate: dateStr };
        } else if (filter === 'week') {
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 7);
            params = { startDate: lastWeek.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
        } else if (filter === 'month') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            params = { startDate: startOfMonth.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
        } else if (filter === 'custom' && customRange.start && customRange.end) {
            params = { startDate: customRange.start, endDate: customRange.end };
        } else if (filter === 'custom') {
            return; // Wait for user to select dates
        }

        fetchAnalytics(params);
    }, [filter, customRange]);

    const onRefresh = () => {
        setRefreshing(true);
        // Re-trigger the fetch logic by resetting the filter reference, or just manually calling it
        let params = {};
        const today = new Date();
        if (filter === 'today') {
            const dateStr = today.toISOString().split('T')[0];
            params = { startDate: dateStr, endDate: dateStr };
        } else if (filter === 'week') {
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 7);
            params = { startDate: lastWeek.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
        } else if (filter === 'month') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            params = { startDate: startOfMonth.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
        } else if (filter === 'custom' && customRange.start && customRange.end) {
            params = { startDate: customRange.start, endDate: customRange.end };
        }
        fetchAnalytics(params);
    };

    const handleApplyCustomDates = () => {
        if (!customRange.start || !customRange.end) {
            return Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter both start and end dates.' });
        }
        // Basic YYYY-MM-DD validation
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(customRange.start) || !regex.test(customRange.end)) {
            return Toast.show({ type: 'error', text1: 'Invalid Format', text2: 'Use YYYY-MM-DD format.' });
        }
        setFilter('custom');
        setIsCustomDateModalOpen(false);
    };

    const { kpis, revenueVelocity, serviceDistribution, topAgents } = data || {
        kpis: { monthlyGrowth: '+0%', avgTicketValue: '₹0', newAgents: 0, conversionRate: '0%' },
        revenueVelocity: [],
        serviceDistribution: [],
        topAgents: []
    };

    const statsConfig = [
        { label: 'Growth vs Prev', value: kpis?.monthlyGrowth || '0%', color: '#10b981', icon: 'trending-up' },
        { label: 'Avg Ticket Value', value: kpis?.avgTicketValue || '₹0', color: '#3b82f6', icon: 'cash' },
        { label: 'New Agents', value: kpis?.newAgents || '0', color: '#f59e0b', icon: 'people' },
        { label: 'Conversion Rate', value: kpis?.conversionRate || '0%', color: '#8b5cf6', icon: 'pie-chart' },
    ];

    const maxRevenue = revenueVelocity?.length ? Math.max(...revenueVelocity.map(v => v.dailyRevenue || 0)) : 100;
    const totalServiceCount = serviceDistribution?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 1;

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="mx-4 mt-2 mb-4 p-4 flex-row items-center bg-white rounded-3xl border border-slate-100 border-b-[6px] border-b-slate-200 shadow-xl shadow-slate-300/40">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-200 active:scale-95 mr-3">
                        <Ionicons name="arrow-back" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="bg-purple-50 w-12 h-12 rounded-2xl items-center justify-center border border-purple-100 shadow-sm mr-3">
                        <Ionicons name="stats-chart" size={24} color="#8b5cf6" />
                    </View>
                    <View className="flex-1 pr-1">
                        <Text style={{ color: t.text }} className="text-xl sm:text-2xl font-black tracking-wide" numberOfLines={1} adjustsFontSizeToFit>Performance Analytics</Text>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5" numberOfLines={1}>Data-driven intelligence</Text>
                    </View>
                </View>

                {/* Filter Bar */}
                <View className="px-4 mb-4">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex-row">
                        {['today', 'week', 'month', 'custom'].map(f => (
                            <TouchableOpacity 
                                key={f} 
                                onPress={() => f === 'custom' ? setIsCustomDateModalOpen(true) : setFilter(f)}
                                className={`px-5 py-3 rounded-xl mr-2 ${filter === f ? 'bg-slate-900 shadow-md' : 'bg-transparent'}`}
                            >
                                <Text className={`font-black text-[10px] uppercase tracking-widest ${filter === f ? 'text-white' : 'text-slate-400'}`}>
                                    {f === 'week' ? 'Last 7 Days' : f}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    {filter === 'custom' && customRange.start && (
                        <View className="flex-row items-center justify-center mt-3">
                            <Text className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">{customRange.start} to {customRange.end}</Text>
                        </View>
                    )}
                </View>

                <ScrollView 
                    className="flex-1 px-4" 
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}
                >
                    {loading && !data ? (
                        <View className="py-24 items-center justify-center">
                            <ActivityIndicator size="large" color="#8b5cf6" />
                            <Text className="text-slate-400 font-bold mt-4 uppercase tracking-widest text-[10px]">Calculating metrics...</Text>
                        </View>
                    ) : (
                        <>
                            {/* KPI Stats */}
                            <View className="flex-row flex-wrap justify-between mb-2">
                                {statsConfig.map((s) => (
                                    <View key={s.label} style={{ backgroundColor: t.card, elevation: 6 }}
                                        className="w-[48%] p-5 rounded-3xl border border-slate-100 border-b-[6px] border-slate-200 shadow-xl shadow-slate-200/50 mb-4 items-center">
                                        <Text className="text-slate-400 text-[9px] font-black uppercase mb-3 text-center tracking-widest leading-tight h-6">{s.label}</Text>
                                        <Text style={{ color: s.color }} className="text-2xl font-black tracking-tight" numberOfLines={1} adjustsFontSizeToFit>{s.value}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Bar Chart (Revenue Velocity) */}
                            <View style={{ backgroundColor: t.card, elevation: 8 }} className="rounded-3xl border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-6 mb-6 overflow-hidden">
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Revenue Velocity</Text>
                                    <Ionicons name="bar-chart" size={24} color="#3b82f6" />
                                </View>
                                <Text className="text-slate-400 text-[10px] font-bold mb-6 tracking-wide">Daily revenue trajectory</Text>

                                {revenueVelocity?.length === 0 ? (
                                    <View className="h-44 items-center justify-center bg-slate-50 rounded-3xl border border-slate-100">
                                        <Text className="text-slate-300 font-black italic">No revenue data for period.</Text>
                                    </View>
                                ) : (
                                    <View className="flex-row items-end justify-between h-44 mb-2 px-3 bg-slate-50 pt-5 pb-2 rounded-3xl border border-slate-100 shadow-inner">
                                        {revenueVelocity.map((v, i) => {
                                            const heightPct = maxRevenue > 0 ? (v.dailyRevenue / maxRevenue) * 100 : 0;
                                            return (
                                                <View key={i} className="items-center w-6">
                                                    <View
                                                        style={{
                                                            width: '100%',
                                                            height: `${Math.max(heightPct, 5)}%`,
                                                            backgroundColor: '#3b82f6',
                                                            borderRadius: 4,
                                                        }}
                                                        className="shadow-sm"
                                                    />
                                                </View>
                                            )
                                        })}
                                    </View>
                                )}
                            </View>

                            {/* Top Performing Agents */}
                            <View style={{ backgroundColor: t.card, elevation: 8 }} className="rounded-3xl border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-6 mb-6">
                                <View className="flex-row items-center justify-between mb-5 pb-4 border-b border-slate-100">
                                    <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Top Agents</Text>
                                    <Ionicons name="trophy" size={24} color="#f59e0b" />
                                </View>
                                {!topAgents || topAgents.length === 0 ? (
                                    <View className="py-6 items-center justify-center">
                                        <Text className="text-slate-400 font-bold text-xs italic">Gathering recruitment data...</Text>
                                    </View>
                                ) : (
                                    topAgents.map((a, idx) => (
                                        <View key={a._id || idx} className="flex-row justify-between items-center bg-slate-50 border border-slate-100 border-b-4 border-slate-200 p-4 rounded-2xl mb-4 shadow-sm active:scale-95">
                                            <View className="flex-row items-center flex-1 pr-3">
                                                <View className="w-10 h-10 bg-slate-900 rounded-xl items-center justify-center mr-3 shadow-md">
                                                    <Text className="text-white font-black text-xs tracking-wider">#{idx + 1}</Text>
                                                </View>
                                                <View className="flex-1">
                                                    <Text style={{ color: t.textSecondary }} className="font-black text-sm tracking-wide flex-1 mb-0.5" numberOfLines={1}>{a.agencyName}</Text>
                                                    <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{a.bookingCount} Bookings</Text>
                                                </View>
                                            </View>
                                            <Text className="font-black text-[#3b82f6] text-base tracking-tight">₹{a.totalSpent?.toLocaleString()}</Text>
                                        </View>
                                    ))
                                )}
                            </View>

                            {/* Service Distribution */}
                            <View style={{ backgroundColor: t.card, elevation: 8 }} className="rounded-3xl border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-6 mb-10">
                                <View className="flex-row items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                    <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Service Mix</Text>
                                    <Ionicons name="pie-chart" size={24} color="#8b5cf6" />
                                </View>
                                {!serviceDistribution || serviceDistribution.length === 0 ? (
                                    <View className="py-6 items-center justify-center">
                                        <Text className="text-slate-400 font-bold text-xs italic">Awaiting service utilization...</Text>
                                    </View>
                                ) : (
                                    serviceDistribution.map((s, idx) => {
                                        const pct = ((s.count / totalServiceCount) * 100).toFixed(0);
                                        const color = idx === 0 ? '#3b82f6' : idx === 1 ? '#10b981' : '#f59e0b';
                                        
                                        return (
                                            <View key={s._id} className="mb-5 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                <View className="flex-row justify-between mb-3">
                                                    <Text className="text-slate-700 text-[10px] font-black uppercase tracking-widest">{s._id}</Text>
                                                    <Text className="text-slate-900 text-[10px] font-black tracking-wider">{pct}%</Text>
                                                </View>
                                                <View className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                                    <View style={{ width: `${pct}%`, backgroundColor: color, height: '100%', borderRadius: 6 }} className="shadow-sm" />
                                                </View>
                                            </View>
                                        )
                                    })
                                )}
                            </View>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>

            {/* Custom Date Picker Modal */}
            <Modal visible={isCustomDateModalOpen} animationType="fade" transparent={true}>
                <View className="flex-1 justify-center bg-black/60 p-5">
                    <View style={{ backgroundColor: t.card, elevation: 24 }} className="rounded-3xl border border-slate-100 shadow-2xl p-7 bg-white">
                        <View className="flex-row justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Custom Range</Text>
                            <TouchableOpacity onPress={() => setIsCustomDateModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 active:scale-95 shadow-sm">
                                <Ionicons name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-5">
                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Start Date (YYYY-MM-DD)</Text>
                                <TextInput 
                                    value={customRange.start} onChangeText={t => setCustomRange({...customRange, start: t})}
                                    placeholderTextColor="#9ca3af" placeholder="2026-05-01"
                                    className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-black text-slate-900 text-sm shadow-inner"
                                />
                            </View>
                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">End Date (YYYY-MM-DD)</Text>
                                <TextInput 
                                    value={customRange.end} onChangeText={t => setCustomRange({...customRange, end: t})}
                                    placeholderTextColor="#9ca3af" placeholder="2026-05-31"
                                    className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-black text-slate-900 text-sm shadow-inner"
                                />
                            </View>
                        </View>

                        <TouchableOpacity 
                            onPress={handleApplyCustomDates}
                            className="bg-slate-900 py-4 rounded-2xl items-center border border-slate-900 border-b-4 border-b-slate-950 shadow-xl shadow-slate-900/30 active:scale-95 mt-8"
                        >
                            <Text className="text-white font-black text-xs uppercase tracking-widest">Apply Range</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
