import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, RefreshControl } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';
import { agentService } from '../../services/api';
import GoyaflyLoader from '../../components/GoyaflyLoader';

export default function TicketsScreen({ navigation }) {
    const t = useThemeColors();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'OPEN', 'RESOLVED'

    const fetchTickets = async () => {
        try {
            const res = await agentService.getTickets();
            if (res.success) {
                setTickets(res.data);
            }
        } catch (e) {
            console.error(e);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch tickets' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    React.useEffect(() => {
        fetchTickets();
    }, []);

    const handleDeleteTicket = async (id) => {
        Alert.alert(
            'Delete Ticket',
            'Are you sure you want to delete this support ticket?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await agentService.deleteTicket(id);
                            if (res.success) {
                                Toast.show({ type: 'success', text1: 'Success', text2: 'Ticket deleted successfully' });
                                setTickets(prev => prev.filter(ticket => (ticket._id || ticket.id) !== id));
                            } else {
                                Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Failed to delete ticket' });
                            }
                        } catch (err) {
                            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete ticket' });
                        }
                    }
                }
            ]
        );
    };

    const openTicketsCount = tickets.filter(tk => (tk.status || '').toUpperCase() !== 'RESOLVED' && (tk.status || '').toUpperCase() !== 'CLOSED').length;
    const resolvedTicketsCount = tickets.filter(tk => (tk.status || '').toUpperCase() === 'RESOLVED' || (tk.status || '').toUpperCase() === 'CLOSED').length;

    const filteredTickets = tickets.filter(tk => {
        const status = (tk.status || '').toUpperCase();
        if (statusFilter === 'OPEN') {
            return status !== 'RESOLVED' && status !== 'CLOSED';
        }
        if (statusFilter === 'RESOLVED') {
            return status === 'RESOLVED' || status === 'CLOSED';
        }
        return true;
    });

    const STATS = [
        { 
            label: 'Open Tickets', 
            value: String(openTicketsCount).padStart(2, '0'), 
            color: '#4B83F3', 
            bgColor: t.isDark ? '#1e293b' : '#EDF3FF',
            icon: 'ticket-outline'
        },
        { 
            label: 'Solved All Time', 
            value: String(resolvedTicketsCount), 
            color: '#17C671', 
            bgColor: t.isDark ? '#1e293b' : '#EAF8F1',
            icon: 'checkmark-circle-outline'
        },
        { 
            label: 'Avg Response', 
            value: '4m', 
            color: '#FF9100', 
            bgColor: t.isDark ? '#1e293b' : '#FFF3E5',
            icon: 'time-outline'
        },
    ];

    if (loading) return <GoyaflyLoader />;

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style={t.statusBar} />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Custom Header Row */}
                <View className="px-4 py-4 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity 
                            onPress={() => navigation.goBack()} 
                            style={{ backgroundColor: t.card, borderColor: t.cardBorder }}
                            className="w-11 h-11 rounded-2xl items-center justify-center border border-b-4 shadow-sm mr-4 active:scale-95"
                        >
                            <Ionicons name="arrow-back" size={20} color={t.text} />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Support Desk</Text>
                            <Text style={{ color: t.textMuted }} className="font-black uppercase text-[9px] tracking-widest">
                                Active Issue Tracking
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('NewTicket')}
                        style={{ backgroundColor: '#1D4171', borderColor: '#1D4171' }}
                        className="px-5 py-3 rounded-2xl border border-b-4 border-b-[#11294a] shadow-md active:scale-95"
                    >
                        <Text className="text-white font-black text-xs tracking-widest">+ NEW TICKET</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    className="flex-1 px-4" 
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={() => { setRefreshing(true); fetchTickets(); }} 
                            colors={['#1D4171']} 
                            tintColor="#1D4171" 
                        />
                    }
                >
                    {/* Web-Style Hero Header Card */}
                    <View 
                        style={{ backgroundColor: t.isDark ? '#1e293b' : '#FAFBFC', borderColor: t.isDark ? '#334155' : '#F1F5F9' }} 
                        className="p-6 rounded-[2rem] border shadow-sm mb-6 flex-col items-center"
                    >
                        <View className="flex-row items-center w-full mb-4">
                            <View style={{ backgroundColor: t.card }} className="w-14 h-14 rounded-2xl items-center justify-center shadow-md mr-4">
                                <Ionicons name="headset" size={26} color="#4B83F3" />
                            </View>
                            <View className="flex-1">
                                <Text style={{ color: t.text }} className="text-2xl font-black tracking-tight leading-none mb-1">Support Desk</Text>
                                <Text style={{ color: t.textMuted }} className="font-bold text-[9px] uppercase tracking-widest">Active issue tracking & Live Chat</Text>
                            </View>
                        </View>
                        
                        {/* Illustration Image */}
                        <Image 
                            source={require('../../../assets/support_agent_header.png')} 
                            style={{ width: '100%', height: 140, resizeMode: 'contain' }}
                            className="mb-4"
                        />

                        <TouchableOpacity 
                            onPress={() => navigation.navigate('NewTicket')}
                            style={{ backgroundColor: '#0B1A42' }}
                            className="w-full py-4 rounded-xl items-center shadow-md active:scale-95"
                        >
                            <Text className="text-white font-black text-xs uppercase tracking-widest">+ NEW SUPPORT TICKET</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Stats Row */}
                    <View className="flex-row mb-6 mt-2">
                        {STATS.map((s, i) => (
                            <View
                                key={s.label}
                                style={{ backgroundColor: t.card, borderColor: t.cardBorder, elevation: 3 }}
                                className={`flex-1 p-4 rounded-3xl border border-b-[5px] shadow-sm items-center ${i !== STATS.length - 1 ? 'mr-2.5' : ''}`}
                            >
                                <View style={{ backgroundColor: s.bgColor }} className="w-9 h-9 rounded-full items-center justify-center mb-2">
                                    <Ionicons name={s.icon} size={18} color={s.color} />
                                </View>
                                <Text style={{ color: s.color }} className="text-2xl font-black mb-0.5">{s.value}</Text>
                                <Text style={{ color: t.textMuted }} className="text-[8px] font-black uppercase text-center tracking-wider">{s.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Section Header & Interactive Status Filters */}
                    <View className="bg-white rounded-[2rem] border border-slate-50 p-6 mb-6 shadow-sm">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text style={{ color: t.text }} className="text-lg font-black">Your Tickets</Text>
                            
                            {/* Filter Chips */}
                            <View className="flex-row gap-1">
                                {['ALL', 'OPEN', 'RESOLVED'].map(filterVal => {
                                    const isActive = statusFilter === filterVal;
                                    const label = filterVal === 'ALL' ? 'All' : filterVal === 'OPEN' ? 'Open' : 'Resolved';
                                    return (
                                        <TouchableOpacity
                                            key={filterVal}
                                            onPress={() => setStatusFilter(filterVal)}
                                            style={{
                                                backgroundColor: isActive ? '#1D4171' : '#F1F5F9',
                                            }}
                                            className="px-3.5 py-1.5 rounded-lg active:scale-95"
                                        >
                                            <Text 
                                                style={{ color: isActive ? '#fff' : '#475569' }} 
                                                className="text-[10px] font-bold"
                                            >
                                                {label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* List of Tickets */}
                        <View className="space-y-4">
                            {filteredTickets.map((ticket) => {
                                const status = (ticket.status || 'OPEN').toUpperCase();
                                const priority = (ticket.priority || 'MEDIUM').toUpperCase();
                                const isResolved = status === 'RESOLVED' || status === 'CLOSED';
                                const isHigh = priority === 'HIGH' || priority === 'URGENT';

                                return (
                                    <View
                                        key={ticket._id || ticket.id}
                                        style={{ backgroundColor: '#FAFBFC', borderColor: '#F1F5F9' }}
                                        className="p-5 border rounded-2xl flex-row justify-between items-center group"
                                    >
                                        <TouchableOpacity 
                                            onPress={() => navigation.navigate('TicketConversation', { ticketId: ticket._id || ticket.id, subject: ticket.subject })}
                                            className="flex-1 flex-row items-center mr-2"
                                        >
                                            {/* Priority Badge */}
                                            <View className={`w-11 h-11 rounded-full flex items-center justify-center mr-4 shadow-sm ${isHigh ? 'bg-red-100' : 'bg-blue-100'}`}>
                                                <Text className={`font-black text-base ${isHigh ? 'text-red-500' : 'text-blue-500'}`}>#</Text>
                                            </View>
                                            
                                            {/* Content */}
                                            <View className="flex-1">
                                                <Text style={{ color: t.text }} className="text-sm font-black mb-1" numberOfLines={1}>
                                                    {ticket.subject}
                                                </Text>
                                                <Text style={{ color: t.textMuted }} className="text-[10px] font-bold uppercase tracking-wider">
                                                    {(ticket._id || ticket.id || '').slice(-6).toUpperCase()} • {new Date(ticket.lastUpdate || ticket.updatedAt || ticket.createdAt).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>

                                        {/* Status & Delete */}
                                        <View className="flex-row items-center gap-2">
                                            <View className={`px-2.5 py-1 rounded-md ${isResolved ? 'bg-green-100' : 'bg-orange-100'}`}>
                                                <Text className={`text-[9px] font-black uppercase tracking-widest ${isResolved ? 'text-green-700' : 'text-orange-600'}`}>
                                                    {status}
                                                </Text>
                                            </View>
                                            <TouchableOpacity 
                                                onPress={() => handleDeleteTicket(ticket._id || ticket.id)}
                                                className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 active:scale-95"
                                            >
                                                <Ionicons name="trash-outline" size={16} color="#f43f5e" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Empty State */}
                        {filteredTickets.length === 0 && (
                            <View className="flex flex-col items-center justify-center py-6 pb-8">
                                <Image 
                                    source={require('../../../assets/no_tickets_empty.png')} 
                                    style={{ width: 160, height: 120, resizeMode: 'contain' }}
                                    className="mb-4"
                                />
                                <Text className="text-lg font-black text-slate-800 mb-1">No Active Tickets</Text>
                                <Text className="text-slate-400 text-xs font-semibold mb-6">You don't have any active support tickets.</Text>
                                <TouchableOpacity 
                                    onPress={() => navigation.navigate('NewTicket')}
                                    style={{ borderColor: '#4B83F3' }}
                                    className="border-2 px-6 py-3 rounded-xl active:scale-95"
                                >
                                    <Text className="text-[#4B83F3] font-black text-[10px] uppercase tracking-wider">CREATE NEW TICKET</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Support Features Row (Grid) */}
                    <View className="flex-row flex-wrap justify-between mb-6">
                        <View style={{ backgroundColor: '#F8FAFC' }} className="w-[48%] p-4 rounded-2xl flex-row items-center gap-3 mb-3 border border-slate-100 shadow-sm">
                            <View className="w-9 h-9 rounded-full bg-[#E5EEFF] items-center justify-center">
                                <Ionicons name="flash-outline" size={16} color="#4B83F3" />
                            </View>
                            <View className="flex-1">
                                <Text style={{ color: t.text }} className="text-[11px] font-black leading-none">Quick Support</Text>
                                <Text style={{ color: t.textMuted }} className="text-[9px] font-medium mt-0.5">Fast resolution</Text>
                            </View>
                        </View>
                        <View style={{ backgroundColor: '#F8FAFC' }} className="w-[48%] p-4 rounded-2xl flex-row items-center gap-3 mb-3 border border-slate-100 shadow-sm">
                            <View className="w-9 h-9 rounded-full bg-[#E8F8F0] items-center justify-center">
                                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#17C671" />
                            </View>
                            <View className="flex-1">
                                <Text style={{ color: t.text }} className="text-[11px] font-black leading-none">Live Chat</Text>
                                <Text style={{ color: t.textMuted }} className="text-[9px] font-medium mt-0.5">Chat with team</Text>
                            </View>
                        </View>
                        <View style={{ backgroundColor: '#F8FAFC' }} className="w-[48%] p-4 rounded-2xl flex-row items-center gap-3 border border-slate-100 shadow-sm">
                            <View className="w-9 h-9 rounded-full bg-[#FFF4E5] items-center justify-center">
                                <Ionicons name="help-circle-outline" size={16} color="#FF9100" />
                            </View>
                            <View className="flex-1">
                                <Text style={{ color: t.text }} className="text-[11px] font-black leading-none">24/7 Desk</Text>
                                <Text style={{ color: t.textMuted }} className="text-[9px] font-medium mt-0.5">Always here</Text>
                            </View>
                        </View>
                        <View style={{ backgroundColor: '#F8FAFC' }} className="w-[48%] p-4 rounded-2xl flex-row items-center gap-3 border border-slate-100 shadow-sm">
                            <View className="w-9 h-9 rounded-full bg-[#F3E8FF] items-center justify-center">
                                <Ionicons name="shield-checkmark-outline" size={16} color="#9D4EDD" />
                            </View>
                            <View className="flex-1">
                                <Text style={{ color: t.text }} className="text-[11px] font-black leading-none">Secure & Safe</Text>
                                <Text style={{ color: t.textMuted }} className="text-[9px] font-medium mt-0.5">Your data is safe</Text>
                            </View>
                        </View>
                    </View>

                    {/* Bottom CTA Banner */}
                    <View style={{ backgroundColor: '#0B1839' }} className="p-6 rounded-[2rem] flex-col items-center justify-center gap-4 mb-10 shadow-lg relative overflow-hidden">
                        <View className="items-center text-center">
                            <View className="w-12 h-12 rounded-full border border-blue-900 bg-blue-950 items-center justify-center mb-3">
                                <Ionicons name="chatbubbles-outline" size={24} color="#FFF" />
                            </View>
                            <Text className="text-white text-base font-black mb-1 text-center">Need immediate help?</Text>
                            <Text className="text-slate-400 text-xs text-center">Start a live chat with our support team now.</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('AIChat')}
                            className="bg-white px-6 py-3.5 rounded-xl shadow-md active:scale-95 w-full items-center"
                        >
                            <Text className="text-[#4B83F3] font-black text-xs uppercase tracking-widest">START LIVE CHAT</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
