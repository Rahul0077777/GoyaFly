import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminService } from '../../services/api';

export default function SubAgentManagerScreen({ navigation }) {
    const t = useThemeColors();
    const [subAgents, setSubAgents] = useState([]);
    const [stats, setStats] = useState({ totalSubAgents: 0, revenueTier2: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('All');

    const fetchData = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('adminToken');
            if (!token) return;

            const [saRes, statsRes] = await Promise.all([
                adminService.getSubAgents(),
                adminService.getSubAgentStats()
            ]);
            if (saRes.success) setSubAgents(saRes.data);
            if (statsRes.success) setStats(statsRes.data);
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch network data' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const uniqueParents = ['All', ...new Set(subAgents.map(sa => sa.parentAgent?.agencyName).filter(Boolean))];

    const filtered = filter === 'All' 
        ? subAgents 
        : subAgents.filter(s => s.parentAgent?.agencyName === filter);

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-5 py-5 flex-row items-center border-b border-slate-100 mb-2">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm mr-3.5">
                        <Ionicons name="arrow-back" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center border border-blue-100 shadow-sm mr-3.5">
                        <Ionicons name="git-network" size={24} color="#1D4171" />
                    </View>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">Sub-Agent Network</Text>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Multi-tier distribution console</Text>
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#1D4171" />
                    </View>
                ) : (
                    <>
                        {/* Filter Chips */}
                        <View className="px-5 mb-2">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner flex-grow-0">
                                {uniqueParents.map(f => (
                                    <TouchableOpacity
                                        key={f}
                                        onPress={() => setFilter(f)}
                                        className={`mr-1 px-5 py-3 rounded-xl ${filter === f ? 'bg-white shadow-md border border-slate-100' : ''}`}
                                    >
                                        <Text className={`font-black text-[10px] uppercase tracking-wider ${filter === f ? 'text-slate-900' : 'text-slate-400'}`}>{f}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <ScrollView 
                            className="flex-1 pt-2" 
                            showsVerticalScrollIndicator={false}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1D4171" />}
                        >
                            {/* Sub-agent cards */}
                            {filtered.map(s => {
                                const isActive = s.isKycVerified;
                                return (
                                    <View key={s._id} style={{ backgroundColor: t.card, elevation: 8 }}
                                        className="p-7 rounded-3xl border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-6 mx-5">
                                        <View className="flex-row justify-between items-start mb-6 pb-4 border-b border-slate-100">
                                            <View className="flex-1 pr-3">
                                                <Text style={{ color: t.text }} className="font-black text-xl tracking-wide mb-1.5">{s.agentName}</Text>
                                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">ID: {s._id.slice(-6).toUpperCase()}</Text>
                                            </View>
                                            <View className={`px-3.5 py-1.5 rounded-xl border shadow-sm ${isActive ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                                <Text className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                    {isActive ? 'Active' : 'Pending'}
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner mb-6 flex-row justify-between items-center">
                                            <View>
                                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Parent Org</Text>
                                                <Text className="text-[#1D4171] font-black text-sm tracking-wide">{s.parentAgent?.agencyName || 'Direct'}</Text>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Monthly Vol</Text>
                                                <Text style={{ color: t.text }} className="text-xl font-black tracking-tight">{s.monthlyVolume || 0}</Text>
                                            </View>
                                        </View>

                                        <View className="flex-row justify-end">
                                            <TouchableOpacity className="bg-[#1D4171] px-5 py-3.5 rounded-2xl border border-[#1D4171] border-b-4 border-b-[#11294a] shadow-lg shadow-blue-900/20 active:scale-95 flex-row items-center justify-center">
                                                <Text className="text-white font-black text-xs uppercase tracking-widest">View Dash</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}

                            {filtered.length === 0 && (
                                <View className="py-24 items-center">
                                    <Ionicons name="people-outline" size={64} color="#cbd5e1" className="mb-4" />
                                    <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Sub-Agents Found</Text>
                                    <Text className="text-slate-400 font-bold text-xs">No multi-tier partners match this filter.</Text>
                                </View>
                            )}

                            {/* Stats + Download CTA */}
                            <TouchableOpacity
                                onPress={() => Toast.show({ type: 'info', text1: 'Download', text2: 'Downloading network report...' })}
                                className="mb-12 mx-5 active:scale-95"
                            >
                                <LinearGradient
                                    colors={['#1D4171', '#17365e']}
                                    style={{ elevation: 12 }}
                                    className="p-7 rounded-3xl border border-slate-100 border-b-[8px] border-[#0f233d] shadow-2xl shadow-blue-900/30 overflow-hidden"
                                >
                                    <View className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl" />
                                    <View className="flex-row mb-8 pb-6 border-b border-white/10">
                                        <View className="flex-1 pr-4">
                                            <Text className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1.5">Total Sub-Agents</Text>
                                            <Text className="text-4xl font-black text-white tracking-tight">{stats.totalSubAgents}</Text>
                                        </View>
                                        <View className="flex-1 border-l border-white/20 pl-6">
                                            <Text className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1.5">Revenue Tier-2</Text>
                                            <Text className="text-4xl font-black text-white tracking-tight">₹{(stats.revenueTier2 / 100000).toFixed(1)}L</Text>
                                        </View>
                                    </View>
                                    <View className="bg-white py-4 rounded-2xl items-center border border-slate-100 border-b-4 border-slate-200 shadow-lg active:scale-95">
                                        <Text className="text-[#1D4171] font-black text-xs uppercase tracking-widest">Download Network Report</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </>
                )}
            </SafeAreaView>
        </View>
    );
}
