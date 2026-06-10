import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Linking } from 'react-native';
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
    const [filterPriority, setFilterPriority] = useState('ALL');

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

    useEffect(() => { 
        const unsubscribe = navigation.addListener('focus', () => {
            fetchTickets();
        });
        return unsubscribe;
    }, [navigation, fetchTickets]);

    const getStatusStyle = (status) => {
        const s = status?.toUpperCase();
        if (s === 'CLOSED' || s === 'RESOLVED') return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: 'checkmark-circle' };
        if (s === 'PENDING_ADMIN') return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: 'time' };
        return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: 'chatbubbles' };
    };

    const getPriorityStyle = (priority) => {
        const p = (priority || '').toUpperCase();
        if (p === 'URGENT' || p === 'HIGH') return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', icon: 'warning' };
        if (p === 'MEDIUM') return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: 'alert' };
        return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: 'information-circle' };
    };

    const handleCall = (phone) => {
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    const handleEmail = (email, subject) => {
        if (email) Linking.openURL(`mailto:${email}?subject=RE: ${subject}`);
    };

    const filteredTickets = tickets.filter(t => filterPriority === 'ALL' || (t.priority || '').toUpperCase() === filterPriority);

    const renderTicketItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        const priorityStyle = getPriorityStyle(item.priority);
        const lastMsg = item.messages?.[item.messages.length - 1];

        return (
            <TouchableOpacity 
                onPress={() => navigation.navigate('AdminTicketConversation', { ticket: item })}
                style={{ backgroundColor: t.card, elevation: 8 }}
                className="mx-5 mb-6 rounded-3xl border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-6 active:scale-95"
            >
                <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1 pr-3">
                        <Text className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.category} • #{item._id.substring(0,6)}</Text>
                        <Text style={{ color: t.text }} className="text-lg font-black tracking-wide leading-tight mb-2" numberOfLines={2}>{item.subject}</Text>
                        <View className="flex-row items-center">
                            <Ionicons name="person" size={12} color="#94a3b8" />
                            <Text className="ml-1 text-[10px] font-black text-slate-500 uppercase tracking-wider">{item.agentId?.agencyName || item.agentId?.agentName || 'Travel Partner'}</Text>
                        </View>
                    </View>
                    <View className="items-end gap-2">
                        <View className={`px-2.5 py-1 rounded-xl border flex-row items-center gap-1 ${statusStyle.bg} ${statusStyle.border}`}>
                            <Ionicons name={statusStyle.icon} size={10} className={statusStyle.text} />
                            <Text className={`text-[9px] font-black uppercase tracking-wider ${statusStyle.text}`}>{item.status === 'PENDING_AGENT' ? 'Agent Reply' : item.status}</Text>
                        </View>
                        <View className={`px-2.5 py-1 rounded-xl border flex-row items-center gap-1 ${priorityStyle.bg} ${priorityStyle.border}`}>
                            <Ionicons name={priorityStyle.icon} size={10} className={priorityStyle.text} />
                            <Text className={`text-[9px] font-black uppercase tracking-wider ${priorityStyle.text}`}>{item.priority || 'LOW'}</Text>
                        </View>
                    </View>
                </View>

                {/* Contact Quick Actions */}
                <View className="flex-row gap-2 mb-4">
                    <TouchableOpacity onPress={() => handleCall(item.agentId?.mobileNumber)} className="flex-1 bg-green-50 py-2.5 rounded-xl border border-green-100 flex-row items-center justify-center gap-2">
                        <Ionicons name="call" size={14} color="#16a34a" />
                        <Text className="text-[10px] font-black text-green-700 uppercase tracking-widest truncate">{item.agentId?.mobileNumber || 'Call'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEmail(item.agentId?.emailAddress, item.subject)} className="flex-1 bg-blue-50 py-2.5 rounded-xl border border-blue-100 flex-row items-center justify-center gap-2">
                        <Ionicons name="mail" size={14} color="#2563eb" />
                        <Text className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Email</Text>
                    </TouchableOpacity>
                </View>

                {/* Last Message Snippet */}
                <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-inner mb-5">
                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{lastMsg?.senderModel === 'Admin' ? 'Last Reply (You)' : 'Last Message (Agent)'}</Text>
                    <Text style={{ color: t.textSecondary }} className="text-xs font-bold leading-5 tracking-wide text-slate-700" numberOfLines={2}>
                        {lastMsg?.message || 'No messages yet.'}
                    </Text>
                </View>

                <View className="flex-row justify-between items-center">
                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.updatedAt).toLocaleString()}</Text>
                    <View className="flex-row items-center bg-[#1D4171] px-5 py-3 rounded-xl border border-[#15305B] border-b-4 border-b-[#0f2342] shadow-md shadow-blue-900/20 active:scale-95">
                        <Text className="text-white font-black text-[10px] uppercase tracking-widest">View Thread</Text>
                        <Ionicons name="arrow-forward" size={12} color="#FFF" style={{ marginLeft: 6 }} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Premium Header */}
                <View className="mx-4 mt-2 mb-4 p-4 flex-row items-center bg-white rounded-3xl border border-slate-100 border-b-[6px] border-b-slate-200 shadow-xl shadow-slate-300/40">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-200 active:scale-95 mr-3">
                        <Ionicons name="arrow-back" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="bg-rose-50 w-12 h-12 rounded-2xl items-center justify-center border border-rose-100 shadow-sm mr-3">
                        <Ionicons name="headset" size={24} color="#e11d48" />
                    </View>
                    <View className="flex-1 pr-1">
                        <Text style={{ color: t.text }} className="text-xl sm:text-2xl font-black tracking-wide" numberOfLines={1} adjustsFontSizeToFit>Support Desk</Text>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5" numberOfLines={1}>Global Inbound Tickets</Text>
                    </View>
                </View>

                {/* Priority Filters */}
                <View className="px-4 mb-4">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                        {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                            <TouchableOpacity 
                                key={p} onPress={() => setFilterPriority(p)}
                                className={`px-5 py-3 rounded-xl mr-2 border border-b-4 shadow-sm active:scale-95 ${
                                    filterPriority === p 
                                    ? 'bg-[#1D4171] border-[#15305B] border-b-[#0f2342]' 
                                    : 'bg-white border-slate-100 border-b-slate-200'
                                }`}
                            >
                                <Text className={`font-black text-[10px] uppercase tracking-widest ${
                                    filterPriority === p ? 'text-white' : 'text-slate-500'
                                }`}>{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {loading && !refreshing ? (
                    <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#1D4171" /></View>
                ) : (
                    <FlatList
                        data={filteredTickets}
                        renderItem={renderTicketItem}
                        keyExtractor={item => item._id}
                        onRefresh={() => { setRefreshing(true); fetchTickets(); }}
                        refreshing={refreshing}
                        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View className="py-24 items-center px-6">
                                <Ionicons name="mail-unread-outline" size={64} color="#cbd5e1" className="mb-4" />
                                <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide text-center">No Active Tickets</Text>
                                <Text className="text-slate-400 font-bold text-xs text-center">Support queue matching this filter is completely clear.</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
