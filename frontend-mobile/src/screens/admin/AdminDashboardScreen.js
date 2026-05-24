import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminService } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboardScreen({ navigation }) {
    const t = useThemeColors();
    const [stats, setStats] = useState({ revenue: 0, activeAgents: 0, pendingKyc: 0, weeklyBookings: 0, recentAgentsList: [] });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchStats = async () => {
        try {
            const token = await AsyncStorage.getItem('adminToken');
            if (!token) return;

            setError('');
            const res = await adminService.getStats();
            if (res.success) setStats(res.data);
            else setError('Failed to load dashboard data.');
        } catch (err) {
            if (err.response?.status !== 401) {
                setError('Could not connect to server.');
            }
        } finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { fetchStats(); }, []);
    const onRefresh = () => { setRefreshing(true); fetchStats(); };

    const handleKyc = async (agentId) => {
        Alert.alert("Approve KYC?", "Grant this agent full access?", [
            { text: "Cancel", style: "cancel" },
            { text: "Approve", onPress: async () => {
                setLoading(true);
                try {
                    const res = await adminService.updateKyc(agentId);
                    if (res.success) { 
                        Toast.show({ type: 'success', text1: 'Success', text2: 'Agent KYC approved!' }); 
                        fetchStats(); 
                    }
                } catch(err) { 
                    Toast.show({ type: 'error', text1: 'Error', text2: 'KYC approval failed.' }); 
                    setLoading(false); 
                }
            }}
        ]);
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('adminToken');
        await AsyncStorage.removeItem('adminInfo');
        navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    };

    const modules = [
        { title: 'Agents', icon: 'people', route: 'AgentManager', color: '#48A0D4' },
        { title: 'Bookings', icon: 'journal', route: 'BookingManager', color: '#10b981' },
        { title: 'Refunds', icon: 'cash', route: 'RefundManager', color: '#f97316' },
        { title: 'Reissue', icon: 'sync', route: 'RescheduleManager', color: '#8b5cf6' },
        { title: 'Holidays', icon: 'sunny', route: 'HolidayManager', color: '#06b6d4' },
        { title: 'Visas', icon: 'document-text', route: 'VisaManager', color: '#ec4899' },
        { title: 'Reports', icon: 'bar-chart', route: 'ReportsAnalytics', color: '#f59e0b' },
        { title: 'OTB', icon: 'airplane', route: 'OTBManager', color: '#ef4444' },
        { title: 'Flight Inv', icon: 'calendar', route: 'FixedDepartureManager', color: '#1D4171' },
        { title: 'Manual Req', icon: 'clipboard', route: 'FixedDepartureBookingManager', color: '#F07E21' },
        { title: 'Support', icon: 'headset', route: 'AdminTickets', color: '#14b8a6' },
        { title: 'Comms', icon: 'calculator', route: 'CommissionSetup', color: '#6366f1' },
        { title: 'Promos', icon: 'megaphone', route: 'PromotionManager', color: '#f43f5e' },
        { title: 'Offers', icon: 'pricetag', route: 'OfferManager', color: '#a855f7' },
        { title: 'Sub-Agents', icon: 'git-branch', route: 'SubAgentManager', color: '#0ea5e9' },
        { title: 'Taxes', icon: 'receipt', route: 'TaxConfig', color: '#059669' },
        { title: 'Settings', icon: 'settings', route: 'GlobalSettings', color: '#64748b' },
    ];

    if (loading && !refreshing) {
        return (
            <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={t.primary} />
                <Text style={{ color: t.textMuted }} className="mt-5 font-black uppercase text-[10px] tracking-widest">Loading Control Center...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView 
                    className="flex-1" showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1D4171" />}
                >
                    {/* Admin Header */}
                    <View className="px-6 pt-6 pb-6 flex-row justify-between items-center">
                        <View>
                            <Text className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-widest">Command Center</Text>
                            <Text className="text-3xl font-black text-slate-900 tracking-wide">Admin <Text className="text-[#1D4171]">Panel</Text></Text>
                        </View>
                        <TouchableOpacity 
                            onPress={handleLogout}
                            className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm"
                        >
                            <Ionicons name="power" size={22} color="#ef4444" />
                        </TouchableOpacity>
                    </View>

                    {error ? (
                        <View className="mx-6 bg-red-50 border border-red-100 border-b-4 border-red-200 p-5 rounded-[2rem] mb-6 flex-row items-center shadow-sm">
                            <Ionicons name="alert-circle" size={22} color="#ef4444" />
                            <Text className="ml-3 text-red-700 font-bold text-xs flex-1 leading-5">{error}</Text>
                        </View>
                    ) : null}

                    {/* KPI Grid - 3D Extruded */}
                    <View className="px-6 mb-8 flex-row flex-wrap justify-between">
                        {[
                            { label: 'Revenue', value: `₹${stats.revenue?.toLocaleString()}`, icon: 'wallet', color: '#1D4171' },
                            { label: 'Agents', value: stats.activeAgents, icon: 'people', color: '#48A0D4' },
                            { label: 'Pending KYC', value: stats.pendingKyc, icon: 'time', color: '#f59e0b' },
                            { label: 'Bookings', value: stats.weeklyBookings, icon: 'journal', color: '#10b981' },
                        ].map((kpi, idx) => (
                            <View key={idx} className="w-[48%] bg-white p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-5" style={{ elevation: 8 }}>
                                <View style={{ backgroundColor: kpi.color + '15' }} className="w-12 h-12 rounded-2xl items-center justify-center mb-4 border border-slate-100 shadow-sm">
                                    <Ionicons name={kpi.icon} size={22} color={kpi.color} />
                                </View>
                                <Text className="text-slate-400 text-[10px] font-black uppercase mb-1.5 tracking-widest">{kpi.label}</Text>
                                <Text className="text-2xl font-black text-slate-900 tracking-wide" numberOfLines={1}>{kpi.value}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Management Modules Grid */}
                    <View className="px-6 mb-10">
                        <Text className="text-slate-900 text-xl font-black mb-6 tracking-wide">Operations Hub</Text>
                        <View className="flex-row flex-wrap justify-between">
                            {modules.map(m => (
                                <TouchableOpacity
                                    key={m.title}
                                    onPress={() => navigation.navigate(m.route)}
                                    className="w-[22%] items-center mb-6 active:scale-95"
                                >
                                    <View style={{ backgroundColor: '#fff' }} className="w-15 h-15 rounded-2xl p-4 items-center justify-center mb-2.5 shadow-md border border-slate-100 border-b-4 border-slate-200">
                                        <Ionicons name={m.icon} size={24} color={m.color} />
                                    </View>
                                    <Text className="text-slate-600 font-black text-[10px] text-center tracking-tight">{m.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Recent Registrations - 3D Extruded */}
                    <View className="px-6 mb-12">
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-slate-900 text-xl font-black tracking-wide">Recent Signups</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('AgentManager')} className="bg-[#1D4171]/10 px-3.5 py-1.5 rounded-xl border border-[#1D4171]/20 shadow-sm active:scale-95">
                                <Text className="text-[#1D4171] text-[10px] font-black uppercase tracking-widest">View All</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View className="bg-white rounded-[2.5rem] p-6 border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40" style={{ elevation: 8 }}>
                            {!stats.recentAgentsList || stats.recentAgentsList.length === 0 ? (
                                <View className="py-8 items-center justify-center">
                                    <Text className="text-slate-400 font-black text-center text-xs tracking-widest uppercase">No pending signups</Text>
                                </View>
                            ) : (
                                stats.recentAgentsList.map((agent, i) => (
                                    <View key={agent._id} className={`py-4 flex-row items-center justify-between ${i !== stats.recentAgentsList.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                        <View className="flex-row items-center flex-1">
                                            <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center mr-4 border border-slate-100 shadow-sm">
                                                <Text className="text-slate-900 font-black text-base tracking-wider">{agent.agentName?.charAt(0) || 'A'}</Text>
                                            </View>
                                            <View className="flex-1 pr-2">
                                                <Text className="font-black text-base text-slate-900 tracking-wide" numberOfLines={1}>{agent.agentName}</Text>
                                                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {agent._id.substring(0,8)}</Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity 
                                            onPress={() => handleKyc(agent._id)}
                                            className="bg-[#1D4171] px-5 py-3 rounded-xl border-b-4 border-[#122a4a] active:scale-95 shadow-md shadow-blue-900/30"
                                        >
                                            <Text className="text-white font-black text-[10px] uppercase tracking-wider">Approve</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>

                    <View className="h-10" />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
