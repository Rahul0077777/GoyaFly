import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator, 
    RefreshControl,
    TextInput,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { bookingService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';

export default function MyRefundsScreen({ navigation }) {
    const t = useThemeColors();
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('FLIGHT');
    
    // Filters
    const [bookingId, setBookingId] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const categories = [
        { id: 'FLIGHT', label: 'Flight', icon: 'airplane' },
        { id: 'BUS', label: 'Bus', icon: 'bus' },
        { id: 'CAB', label: 'Cab', icon: 'car' },
        { id: 'HOTEL', label: 'Hotel', icon: 'business' },
        { id: 'INSURANCE', label: 'Insurance', icon: 'shield-checkmark' },
        { id: 'VISA', label: 'Visa', icon: 'document-text' },
    ];

    const fetchRefunds = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const res = await bookingService.getAgentHistory({
                status: 'CANCELLED',
                serviceType: activeTab,
                bookingId: bookingId.trim() || undefined,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
                limit: 50
            });
            if (res.success) {
                setRefunds(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch refunds on mobile', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRefunds();
    }, [activeTab]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchRefunds(true);
    };

    const handleSearchSubmit = () => {
        fetchRefunds();
    };

    const renderRefundCard = ({ item }) => {
        const isProcessed = item.refundStatus === 'PROCESSED';
        const isPending = item.refundStatus === 'PENDING_AIRLINE';
        const isFailed = item.refundStatus === 'FAILED';

        const getStatusStyles = () => {
            if (isProcessed) return { bg: '#ecfdf5', text: '#059669', label: 'REFUNDED' };
            if (isPending) return { bg: '#fff7ed', text: '#ea580c', label: 'PENDING AIRLINE' };
            if (isFailed) return { bg: '#fef2f2', text: '#dc2626', label: 'FAILED' };
            return { bg: '#f1f5f9', text: '#64748b', label: 'NON-REFUNDABLE' };
        };

        const status = getStatusStyles();

        const getPaxName = (b) => {
            const details = b.passengerDetails;
            if (!details) return 'Customer';
            if (Array.isArray(details) && details[0]) {
                const p = details[0];
                if (p.fName || p.lName) return `${p.title || ''} ${p.fName || ''} ${p.lName || ''}`.trim();
                return p.passengerName || p.name || 'Customer';
            }
            if (typeof details === 'object') return details.name || details.passengerName || 'Customer';
            return 'Customer';
        };

        return (
            <View 
                style={{ backgroundColor: t.card, borderColor: t.cardBorder, borderLeftColor: '#1D4171', elevation: 4 }}
                className="mb-5 rounded-[2rem] border border-slate-100 border-b-4 border-l-8 shadow-sm overflow-hidden"
            >
                {/* Header Row */}
                <View className="px-5 py-3.5 border-b border-slate-100 flex-row justify-between items-center bg-slate-50/50">
                    <View style={{ backgroundColor: '#1D4171' }} className="px-2.5 py-1 rounded-lg">
                        <Text className="text-white text-[9px] font-black uppercase tracking-wider font-mono">
                            {(item.providerReference || item._id || '').slice(-8).toUpperCase()}
                        </Text>
                    </View>
                    <View style={{ backgroundColor: status.bg, borderColor: status.text + '20' }} className="px-3 py-1 rounded-xl border">
                        <Text style={{ color: status.text }} className="text-[9px] font-black uppercase tracking-wider">
                            {status.label}
                        </Text>
                    </View>
                </View>

                {/* Body Details */}
                <View className="p-5">
                    <View className="flex-row justify-between mb-3">
                        <View className="flex-1 mr-2">
                            <Text style={{ color: t.textMuted }} className="text-[8px] font-black uppercase tracking-widest mb-0.5">Passenger</Text>
                            <Text style={{ color: t.text }} className="text-xs font-black uppercase" numberOfLines={1}>
                                {getPaxName(item)}
                            </Text>
                        </View>
                        <View className="items-end">
                            <Text style={{ color: t.textMuted }} className="text-[8px] font-black uppercase tracking-widest mb-0.5">PNR</Text>
                            <Text style={{ color: '#1D4171' }} className="font-black text-xs uppercase tracking-wider font-mono bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-sm">
                                {item.pnr || item.providerReference || 'N/A'}
                            </Text>
                        </View>
                    </View>

                    <View className="h-px bg-slate-100 my-3" />

                    <View className="flex-row justify-between items-end">
                        <View>
                            <Text style={{ color: t.textMuted }} className="text-[8px] font-black uppercase tracking-widest mb-0.5">Cancelled Date</Text>
                            <Text style={{ color: t.text }} className="text-xs font-bold">
                                {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                        <View className="items-end">
                            <Text style={{ color: t.textMuted }} className="text-[8px] font-black uppercase tracking-widest mb-0.5">Refunded Amount</Text>
                            <Text style={{ color: '#1D4171' }} className="text-base font-black">
                                ₹{(item.refundAmount || 0).toLocaleString()}
                            </Text>
                            <Text style={{ color: t.textMuted }} className="text-[9px] font-bold line-through">
                                ₹{(item.totalCost || 0).toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="light" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Brand Header Banner */}
                <View style={{ backgroundColor: '#1D4171' }} className="pt-6 pb-12 px-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
                    <View className="flex-row items-center justify-between mb-6">
                        <TouchableOpacity 
                            onPress={() => navigation.goBack()} 
                            className="w-11 h-11 bg-white/10 rounded-2xl items-center justify-center border border-white/20 border-b-4 border-b-white/30 active:scale-95"
                        >
                            <Ionicons name="chevron-back" size={20} color="#fff" />
                        </TouchableOpacity>
                        <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest">Secure Terminal</Text>
                        <View className="w-11 h-11" />
                    </View>
                    <Text className="text-white text-3xl font-black mb-1">My Refunds</Text>
                    <Text className="text-white/50 text-[9px] font-black uppercase tracking-widest">Status of Cancellation & Refunds</Text>
                    
                    {/* Search Field */}
                    <View className="mt-6 flex-row gap-3">
                        <View className="flex-1 bg-white/10 rounded-2xl flex-row items-center px-4 h-12 border border-white/20">
                            <Ionicons name="search" size={16} color="rgba(255,255,255,0.6)" />
                            <TextInput 
                                value={bookingId}
                                onChangeText={setBookingId}
                                placeholder="Search Booking ID or PNR..."
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                onSubmitEditing={handleSearchSubmit}
                                className="flex-1 ml-2 text-white font-bold text-xs"
                            />
                        </View>
                        <TouchableOpacity 
                            onPress={handleSearchSubmit}
                            style={{ backgroundColor: '#F07E21' }}
                            className="px-5 py-3 rounded-2xl active:scale-95 shadow-sm items-center justify-center"
                        >
                            <Text className="text-white font-black text-xs uppercase">SUBMIT</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Horizontal Category Tab Bar */}
                <View className="-mt-6 px-4 mb-4">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="flex-row gap-2 pb-2">
                            {categories.map((cat) => (
                                <TouchableOpacity 
                                    key={cat.id} 
                                    onPress={() => setActiveTab(cat.id)}
                                    style={{ 
                                        backgroundColor: activeTab === cat.id ? '#fff' : '#1e293b',
                                        borderColor: activeTab === cat.id ? '#cbd5e1' : '#334155'
                                    }}
                                    className={`flex-row items-center gap-2.5 px-6 py-3.5 rounded-2xl shadow-sm border border-b-4 active:scale-95 ${activeTab === cat.id ? 'border-b-slate-300' : 'border-b-slate-800'}`}
                                >
                                    <Ionicons 
                                        name={cat.icon} 
                                        size={14} 
                                        color={activeTab === cat.id ? '#F07E21' : '#94a3b8'} 
                                    />
                                    <Text className={`text-[10px] font-black uppercase tracking-wider ${activeTab === cat.id ? 'text-[#1D4171]' : 'text-slate-300'}`}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Refunds List container */}
                {loading && !refreshing ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#F07E21" />
                        <Text style={{ color: t.textMuted }} className="mt-4 font-black uppercase text-[9px] tracking-widest">Loading Refund Claims...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={refunds}
                        renderItem={renderRefundCard}
                        keyExtractor={item => item._id}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 60 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#F07E21']} tintColor="#F07E21" />
                        }
                        ListEmptyComponent={
                            <View className="py-20 items-center opacity-30">
                                <Ionicons name="folder-open-outline" size={60} color="#cbd5e1" />
                                <Text style={{ color: t.text }} className="mt-4 font-black uppercase text-xs tracking-widest">No refunds found in {activeTab}</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
