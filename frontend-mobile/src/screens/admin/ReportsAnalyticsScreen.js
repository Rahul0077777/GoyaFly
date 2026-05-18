import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminService } from '../../services/api';

export default function ReportsAnalyticsScreen({ navigation }) {
    const t = useThemeColors();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(null);

    const fetchAnalytics = async () => {
        try {
            const token = await AsyncStorage.getItem('adminToken');
            if (!token) return;

            const res = await adminService.getAnalytics();
            if (res.success) setData(res.data);
        } catch (error) {
            if (error.response?.status !== 401) {
                console.error("Analytics Fetch Error", error);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAnalytics();
    };

    if (loading && !data) {
        return (
            <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#F07E21" />
            </View>
        );
    }

    const { kpis, revenueVelocity, serviceDistribution, topAgents } = data || {
        kpis: { monthlyGrowth: '+0%', avgTicketValue: '₹0', newAgents: 0, conversionRate: '0%' },
        revenueVelocity: [0, 0, 0, 0, 0, 0, 0, 0],
        serviceDistribution: [],
        topAgents: []
    };

    const statsConfig = [
        { label: 'Monthly Growth', value: kpis.monthlyGrowth, color: '#059669', icon: 'trending-up' },
        { label: 'Avg Ticket Value', value: kpis.avgTicketValue, color: '#1D4171', icon: 'cash' },
        { label: 'New Agents', value: kpis.newAgents, color: '#F07E21', icon: 'people' },
        { label: 'Conversion Rate', value: kpis.conversionRate, color: '#9333ea', icon: 'pie-chart' },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-5 py-5 flex-row items-center border-b border-slate-100 mb-2">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm mr-3.5">
                        <Ionicons name="arrow-back" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="bg-purple-50 w-12 h-12 rounded-2xl items-center justify-center border border-purple-100 shadow-sm mr-3.5">
                        <Ionicons name="stats-chart" size={24} color="#a855f7" />
                    </View>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">Performance Analytics</Text>
                        <Text className="text-slate-400 font-black uppercase tracking-widest text-[10px] mt-0.5">Data-driven intelligence</Text>
                    </View>
                </View>

                <ScrollView 
                    className="flex-1 px-5 pt-2" 
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F07E21" />}
                >
                    {/* KPI Stats */}
                    <View className="flex-row flex-wrap justify-between mb-6">
                        {statsConfig.map((s) => (
                            <View key={s.label} style={{ backgroundColor: t.card, elevation: 6 }}
                                className="w-[48%] p-6 rounded-[2rem] border border-slate-100 border-b-[6px] border-slate-200 shadow-xl shadow-slate-200/50 mb-4 items-center">
                                <View className="w-12 h-12 rounded-2xl items-center justify-center mb-3.5 bg-slate-50 border border-slate-100 shadow-inner">
                                    <Ionicons name={s.icon} size={22} color={s.color} />
                                </View>
                                <Text className="text-slate-400 text-[10px] font-black uppercase mb-1.5 text-center tracking-widest">{s.label}</Text>
                                <Text style={{ color: s.color }} className="text-2xl font-black tracking-tight">{s.value}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Bar Chart (Dynamic) */}
                    <View style={{ backgroundColor: t.card, elevation: 8 }} className="rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-7 mb-6 overflow-hidden">
                        <View className="flex-row items-center justify-between mb-1">
                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Revenue Velocity</Text>
                            <Ionicons name="bar-chart" size={24} color="#1D4171" />
                        </View>
                        <Text className="text-slate-400 text-xs font-bold mb-6 tracking-wide">Platform growth trajectory — last 8 reporting periods</Text>

                        <View className="flex-row items-end justify-between h-44 mb-2 px-3 bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-inner">
                            {revenueVelocity.map((val, i) => (
                                <View key={i} className="items-center">
                                    <View
                                        style={{
                                            width: 22,
                                            height: `${Math.max(Math.min(val * 10, 100), 12)}%`, // Simplified scaling for UI with min height
                                            backgroundColor: i % 2 === 0 ? '#1D4171' : '#F07E21',
                                            borderRadius: 8,
                                        }}
                                        className="shadow-md"
                                    />
                                    <Text className="text-[10px] font-black text-slate-400 mt-2.5 tracking-wider">P{i+1}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Top Performing Agents (Dynamic) */}
                    <View style={{ backgroundColor: t.card, elevation: 8 }} className="rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-7 mb-6">
                        <View className="flex-row items-center justify-between mb-5 pb-4 border-b border-slate-100">
                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Top Performing Agents</Text>
                            <Ionicons name="trophy" size={24} color="#f59e0b" />
                        </View>
                        {topAgents.length === 0 ? (
                            <View className="py-8 items-center justify-center">
                                <Ionicons name="shield-half-outline" size={48} color="#cbd5e1" className="mb-2" />
                                <Text className="text-slate-400 font-bold text-xs italic">No revenue data for agents yet.</Text>
                            </View>
                        ) : (
                            topAgents.map((a, idx) => (
                                <View key={idx} className="flex-row justify-between items-center bg-slate-50 border border-slate-100 border-b-4 border-slate-200 p-5 rounded-2xl mb-4 shadow-sm active:scale-95">
                                    <View className="flex-row items-center flex-1 pr-3">
                                        <View className="w-12 h-12 bg-[#1D4171] rounded-2xl items-center justify-center mr-3.5 shadow-md">
                                            <Text className="text-white font-black text-xs tracking-wider">#{idx + 1}</Text>
                                        </View>
                                        <Text style={{ color: t.textSecondary }} className="font-black text-base tracking-wide flex-1" numberOfLines={1}>{a.agencyName || a.agentName}</Text>
                                    </View>
                                    <Text className="font-black text-[#F07E21] text-lg tracking-tight">₹{a.totalSpent?.toLocaleString()}</Text>
                                </View>
                            ))
                        )}
                    </View>

                    {/* Service Distribution (Dynamic) */}
                    <View style={{ backgroundColor: t.card, elevation: 8 }} className="rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-7 mb-10">
                        <View className="flex-row items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Service Distribution</Text>
                            <Ionicons name="analytics" size={24} color="#059669" />
                        </View>
                        {serviceDistribution.length === 0 ? (
                            <View className="py-8 items-center justify-center">
                                <Ionicons name="cube-outline" size={48} color="#cbd5e1" className="mb-2" />
                                <Text className="text-slate-400 font-bold text-xs italic">No service data available.</Text>
                            </View>
                        ) : (
                            serviceDistribution.map((s, idx) => (
                                <View key={idx} className="mb-5 bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                                    <View className="flex-row justify-between mb-3">
                                        <Text className="text-slate-700 text-xs font-black uppercase tracking-widest">{s.label}</Text>
                                        <Text className="text-slate-900 text-xs font-black tracking-wider">{s.pct}%</Text>
                                    </View>
                                    <View className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                        <View style={{ width: `${s.pct}%`, backgroundColor: idx === 0 ? '#1D4171' : idx === 1 ? '#F07E21' : '#059669', height: '100%', borderRadius: 6 }} className="shadow-sm" />
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
