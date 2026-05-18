import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';
import { agentService } from '../../services/api';
import GoyaflyLoader from '../../components/GoyaflyLoader';
import { RefreshControl } from 'react-native';

const MOCK_TICKETS = [
    {
        id: 'TKT-1002',
        subject: 'Refund issue for DEL-BOM',
        status: 'Technical Response',
        date: '11 Mar',
        priority: 'High',
    },
    {
        id: 'TKT-1001',
        subject: 'Wallet topup not showing',
        status: 'Resolved',
        date: '09 Mar',
        priority: 'Medium',
    },
];

const STATS = [
    { label: 'Open Tickets', value: '02', color: '#1D4171' },
    { label: 'Solved All Time', value: '142', color: '#22c55e' },
    { label: 'Avg Response', value: '4m', color: '#F07E21' },
];

export default function TicketsScreen({ navigation }) {
    const t = useThemeColors();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTickets = async () => {
        try {
            const res = await agentService.getTickets();
            if (res.success) setTickets(res.data);
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

    const openCount = tickets.filter(tk => tk.status === 'OPEN' || tk.status === 'PENDING_ADMIN').length;
    const resolvedCount = tickets.filter(tk => tk.status === 'RESOLVED' || tk.status === 'CLOSED').length;

    const STATS = [
        { label: 'Open Tickets', value: String(openCount).padStart(2, '0'), color: '#1D4171' },
        { label: 'Solved All Time', value: String(resolvedCount), color: '#22c55e' },
        { label: 'Avg Response', value: '4m', color: '#F07E21' },
    ];

    const handleNewTicket = () => {
        navigation.navigate('NewTicket'); // We'll create this or use a modal
    };

    if (loading) return <GoyaflyLoader />;

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style={t.statusBar} />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-4 py-4 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="w-11 h-11 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 shadow-sm mr-4 active:scale-95">
                            <Text className="text-xl font-black text-slate-800">←</Text>
                        </TouchableOpacity>
                        <View>
                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Support Desk</Text>
                            <Text style={{ color: t.textMuted }} className="font-bold uppercase text-[9px] tracking-widest">
                                Active issue tracking
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={handleNewTicket}
                        className="bg-[#1D4171] px-5 py-3 rounded-2xl border border-[#1D4171] border-b-4 border-[#11294a] shadow-md shadow-blue-900/20 active:scale-95"
                    >
                        <Text className="text-white font-black text-xs tracking-widest">+ NEW TICKET</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    className="flex-1 px-4" 
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTickets(); }} />}
                >
                    {/* Stats Row */}
                    <View className="flex-row mb-6 mt-2">
                        {STATS.map((s, i) => (
                            <View
                                key={s.label}
                                style={{ backgroundColor: t.card, borderColor: t.cardBorder, elevation: 6 }}
                                className={`flex-1 p-4 rounded-2xl border border-b-[6px] shadow-xl items-center ${i !== STATS.length - 1 ? 'mr-3' : ''}`}
                            >
                                <Text style={{ color: s.color }} className="text-3xl font-black mb-1">{s.value}</Text>
                                <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase text-center tracking-widest">{s.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Ticket List */}
                    <View className="space-y-3">
                        {tickets.map((ticket, idx) => {
                            const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
                            const isHigh = ticket.priority === 'HIGH' || ticket.priority === 'URGENT';
                            return (
                                <TouchableOpacity
                                    key={ticket._id}
                                    onPress={() => navigation.navigate('TicketConversation', { ticketId: ticket._id, subject: ticket.subject })}
                                    style={{ backgroundColor: t.card, borderColor: t.cardBorder, elevation: 8 }}
                                    className="rounded-[2.5rem] border border-b-[8px] shadow-2xl mb-5 overflow-hidden active:scale-95 flex-row"
                                >
                                    {/* Priority Bar */}
                                    <View
                                        style={{
                                            backgroundColor: isHigh ? '#ef4444' : '#f97316',
                                            width: 5,
                                        }}
                                    />

                                    {/* Content */}
                                    <View className="flex-1 p-5">
                                        <View className="flex-row justify-between items-start">
                                            <View className="flex-1 mr-3">
                                                <Text style={{ color: t.text }} className="font-black text-base mb-1" numberOfLines={2}>
                                                    {ticket.subject}
                                                </Text>
                                                <View className="flex-row flex-wrap gap-2 mt-1">
                                                    <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase">
                                                        #{ticket._id.slice(-6).toUpperCase()}
                                                    </Text>
                                                    <Text className="text-[9px] font-black text-[#1D4171] uppercase">
                                                        Updated: {new Date(ticket.lastUpdate || ticket.updatedAt).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className="items-end flex-shrink-0">
                                                <View className={`px-3 py-1.5 rounded-xl mb-2 ${isResolved ? 'bg-green-100' : 'bg-blue-50'}`}>
                                                    <Text className={`text-[9px] font-black uppercase ${isResolved ? 'text-green-700' : 'text-[#1D4171]'}`}>
                                                        {ticket.status}
                                                    </Text>
                                                </View>
                                                <View style={{ backgroundColor: t.isDark ? '#1e293b' : '#f3f4f6' }} className="w-9 h-9 rounded-xl items-center justify-center">
                                                    <Text style={{ color: t.text }} className="text-base">➔</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {tickets.length === 0 && (
                        <View className="py-20 items-center">
                            <Text className="text-5xl mb-4">🎫</Text>
                            <Text style={{ color: t.text }} className="font-black text-xl mb-2">No tickets yet</Text>
                            <Text style={{ color: t.textSecondary }} className="font-medium text-sm text-center">
                                Tap "+ NEW TICKET" to raise a support request.
                            </Text>
                        </View>
                    )}

                    <View className="h-8" />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
