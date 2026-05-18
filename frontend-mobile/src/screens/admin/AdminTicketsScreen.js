import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminService } from '../../services/api';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';

export default function AdminTicketsScreen({ navigation }) {
    const t = useThemeColors();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTickets = useCallback(async () => {
        try {
            const res = await adminService.adminGetAllTickets();
            if (res.success) setTickets(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    const getStatusStyle = (status) => {
        const s = status?.toUpperCase();
        if (s === 'CLOSED' || s === 'RESOLVED') return { bg: '#ecfdf5', text: '#059669', border: '#d1fae5' };
        if (s === 'OPEN') return { bg: '#fffbeb', text: '#d97706', border: '#fef3c7' };
        return { bg: '#f8fafc', text: '#64748b', border: '#f1f5f9' };
    };

    const renderTicketItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        const lastMsg = item.messages?.[item.messages.length - 1];

        return (
            <TouchableOpacity 
                onPress={() => navigation.navigate('AdminTicketConversation', { ticket: item })}
                style={{ backgroundColor: t.card, elevation: 8 }}
                className="mx-5 mb-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-7 active:scale-95"
            >
                <View className="flex-row justify-between items-start mb-6 pb-4 border-b border-slate-100">
                    <View className="flex-1 pr-3">
                        <Text style={{ color: t.text }} className="text-xl font-black tracking-wide mb-1.5" numberOfLines={1}>{item.subject}</Text>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{item.category} • #{item._id.substring(0,8)}</Text>
                    </View>
                    <View style={{ backgroundColor: statusStyle.bg, borderColor: statusStyle.border }} className="px-3.5 py-1.5 rounded-xl border shadow-sm">
                        <Text style={{ color: statusStyle.text }} className="text-[10px] font-black uppercase tracking-wider">{item.status}</Text>
                    </View>
                </View>

                <View className="bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-inner mb-6">
                    <View className="flex-row items-center mb-2.5 pb-2 border-b border-slate-200/60">
                        <Ionicons name="person" size={14} color="#1D4171" />
                        <Text className="ml-2 text-xs font-black text-[#1D4171] uppercase tracking-wider">{item.agentId?.agencyName || 'Partner'}</Text>
                    </View>
                    <Text style={{ color: t.textSecondary }} className="text-xs font-bold leading-5 tracking-wide text-slate-700" numberOfLines={2}>
                        {lastMsg?.message || 'No messages yet.'}
                    </Text>
                </View>

                <View className="flex-row justify-between items-center">
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.updatedAt).toLocaleString()}</Text>
                    <View className="flex-row items-center bg-[#1D4171] px-4 py-3 rounded-xl border border-[#1D4171] border-b-4 border-b-[#11294a] shadow-md shadow-blue-900/20">
                        <Ionicons name="chatbubbles" size={14} color="#FFF" />
                        <Text className="ml-2 text-white font-black text-[10px] uppercase tracking-widest">Reply Flow</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-5 py-5 flex-row items-center border-b border-slate-100 mb-2">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm mr-3.5">
                        <Ionicons name="arrow-back" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center border border-blue-100 shadow-sm mr-3.5">
                        <Ionicons name="headset" size={24} color="#1D4171" />
                    </View>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">Support Desk</Text>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Global Inbound Tickets</Text>
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#F07E21" /></View>
                ) : (
                    <FlatList
                        data={tickets}
                        renderItem={renderTicketItem}
                        keyExtractor={item => item._id}
                        onRefresh={() => { setRefreshing(true); fetchTickets(); }}
                        refreshing={refreshing}
                        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
                        ListEmptyComponent={
                            <View className="py-24 items-center">
                                <Ionicons name="mail-unread-outline" size={64} color="#cbd5e1" className="mb-4" />
                                <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Active Tickets</Text>
                                <Text className="text-slate-400 font-bold text-xs">Support queue is completely clear.</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
