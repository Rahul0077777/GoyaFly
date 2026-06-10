import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, FlatList, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function RescheduleManagerScreen({ navigation }) {
    const t = useThemeColors();
    const [reschedules, setReschedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReq, setSelectedReq] = useState(null);
    const [airlinePenalty, setAirlinePenalty] = useState('');
    const [fareDifference, setFareDifference] = useState('');
    const [adminMarkup, setAdminMarkup] = useState('150');
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchReschedules = useCallback(async (pageNum = 1, isRefresh = false) => {
        try {
            if (pageNum === 1 && !isRefresh) setLoading(true);
            const res = await adminService.getReschedules(pageNum, 50, statusFilter);
            if (res.success) {
                if (pageNum === 1) setReschedules(res.data);
                else setReschedules(prev => [...prev, ...res.data]);
                setHasMore(res.pagination?.page < res.pagination?.pages);
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load reschedules.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        setPage(1);
        fetchReschedules(1, false);
    }, [statusFilter, fetchReschedules]);

    const handleRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchReschedules(1, true);
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            setLoadingMore(true);
            const np = page + 1;
            setPage(np);
            fetchReschedules(np, false);
        }
    };

    const openQuoteModal = (req) => {
        setSelectedReq(req);
        setAirlinePenalty('');
        setFareDifference('');
        setAdminMarkup('150');
        setIsModalOpen(true);
    };

    const handleSendQuote = async () => {
        const ap = Number(airlinePenalty);
        const fd = Number(fareDifference);
        const am = Number(adminMarkup);

        if (isNaN(ap) || isNaN(fd) || isNaN(am)) {
            return Toast.show({ type: 'error', text1: 'Error', text2: 'Enter valid amounts.' });
        }

        Alert.alert(
            "Send Quotation?",
            `Total cost to agent: ₹${ap + fd + am}. Proceed?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Send Quote", onPress: async () => {
                    setIsProcessing(true);
                    try {
                        const res = await adminService.provideRescheduleQuote(selectedReq._id, fd, ap, am);
                        if (res.success) {
                            Toast.show({ type: 'success', text1: 'Success', text2: 'Quote sent successfully!' });
                            setIsModalOpen(false);
                            setPage(1);
                            fetchReschedules(1, false);
                        }
                    } catch (error) {
                        Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Action failed.' });
                    } finally {
                        setIsProcessing(false);
                    }
                }}
            ]
        );
    };

    const handleMarkReissued = async (id) => {
        Alert.alert(
            "Confirm Reissue",
            "Have you manually reissued this ticket in the GDS portal?",
            [
                { text: "No", style: "cancel" },
                { text: "Yes, Mark Reissued", onPress: async () => {
                    setLoading(true);
                    try {
                        const res = await adminService.processReschedule(id);
                        if (res.success) {
                            Toast.show({ type: 'success', text1: 'Success', text2: 'Ticket marked as reissued!' });
                            setPage(1);
                            fetchReschedules(1, false);
                        }
                    } catch (error) {
                        Toast.show({ type: 'error', text1: 'Error', text2: 'Action failed.' });
                        setLoading(false);
                    }
                }}
            ]
        );
    };

    const filteredRequests = reschedules.filter(r => {
        const term = search.toLowerCase();
        return (
            r.bookingId?.providerReference?.toLowerCase().includes(term) ||
            r.bookingId?.pnr?.toLowerCase().includes(term) ||
            r.agentId?.agencyName?.toLowerCase().includes(term)
        );
    });

    const getStatusStyle = (status) => {
        if (status === 'PROCESSED') return 'bg-emerald-50 border-emerald-200 text-emerald-800';
        if (status === 'ACCEPTED') return 'bg-blue-50 border-blue-200 text-blue-800';
        if (status === 'QUOTE_PROVIDED') return 'bg-purple-50 border-purple-200 text-purple-800';
        if (status === 'PENDING_QUOTE') return 'bg-amber-50 border-amber-200 text-amber-800';
        if (status === 'REJECTED') return 'bg-rose-50 border-rose-200 text-rose-800';
        return 'bg-slate-50 border-slate-200 text-slate-800';
    };

    const renderRescheduleItem = ({ item }) => {
        const styleTokens = getStatusStyle(item.status).split(' ');
        const bgBorder = styleTokens.slice(0, 2).join(' ');
        const textColor = styleTokens[2];

        return (
            <View style={{ backgroundColor: t.card, elevation: 8 }} className="mx-4 mb-6 rounded-3xl border border-slate-100 border-b-[6px] border-slate-200 shadow-xl shadow-slate-300/40 overflow-hidden">
                {/* Top row: PNR & Status */}
                <View className="p-5 flex-row items-start justify-between border-b border-slate-100 bg-slate-50/50">
                    <View className="flex-1 pr-2">
                        <Text className="text-xl font-black text-slate-900 tracking-wide mb-1">{item.bookingId?.pnr || item.bookingId?.providerReference}</Text>
                        <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest" numberOfLines={1}>Agent: {item.agentId?.agencyName || 'Unknown Agent'}</Text>
                    </View>
                    <View className={`px-3 py-1.5 rounded-xl border shadow-sm ${bgBorder}`}>
                        <Text className={`text-[9px] font-black uppercase tracking-widest ${textColor}`}>
                            {item.status?.replace('_', ' ') || 'UNKNOWN'}
                        </Text>
                    </View>
                </View>

                {/* Middle row: Dates & Flight Detail */}
                <View className="p-5 border-b border-slate-100">
                    <View className="flex-row justify-between items-center mb-4">
                        <View className="flex-1">
                            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Original Date</Text>
                            <Text className="font-bold text-slate-600 text-xs">{new Date(item.bookingId?.travelDate).toLocaleDateString()}</Text>
                        </View>
                        <Ionicons name="arrow-forward" size={16} color="#cbd5e1" className="mx-2" />
                        <View className="flex-1 items-end">
                            <Text className="text-[9px] font-black text-[#F07E21] uppercase tracking-widest mb-1">Requested Date</Text>
                            <Text className="font-black text-slate-900 text-sm tracking-tight">{item.newTravelDate}</Text>
                        </View>
                    </View>

                    <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm flex-row items-center gap-3">
                        <Ionicons name="airplane" size={16} color="#94a3b8" />
                        <Text className="flex-1 text-slate-700 font-bold text-xs leading-relaxed">{item.flightDetails || 'Any available flight'}</Text>
                    </View>
                </View>

                {/* Bottom action row & Quotes */}
                <View className="p-5 bg-white">
                    {item.quoteDetails ? (
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Total Quoted Amount</Text>
                            <Text className="text-slate-900 font-black text-xl tracking-tight">₹{item.quoteDetails.totalAmount?.toLocaleString()}</Text>
                        </View>
                    ) : (
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Requested On</Text>
                            <Text className="text-slate-600 font-bold text-xs">{new Date(item.createdAt).toLocaleDateString()}</Text>
                        </View>
                    )}

                    {item.status === 'PENDING_QUOTE' && (
                        <TouchableOpacity onPress={() => openQuoteModal(item)}
                            className="bg-[#F07E21] py-3.5 rounded-xl items-center border border-[#F07E21] border-b-4 border-b-[#D96B18] shadow-lg shadow-orange-500/30 active:scale-95">
                            <Text className="text-white font-black text-xs uppercase tracking-widest">Send Quotation ➔</Text>
                        </TouchableOpacity>
                    )}

                    {item.status === 'ACCEPTED' && (
                        <TouchableOpacity onPress={() => handleMarkReissued(item._id)}
                            className="bg-emerald-600 py-3.5 rounded-xl items-center border border-emerald-600 border-b-4 border-b-emerald-800 shadow-lg shadow-emerald-700/30 active:scale-95">
                            <Text className="text-white font-black text-xs uppercase tracking-widest">Mark as Reissued</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="mx-4 mt-2 mb-4 p-4 flex-row items-center bg-white rounded-3xl border border-slate-100 border-b-[6px] border-b-slate-200 shadow-xl shadow-slate-300/40">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-200 active:scale-95 mr-3">
                        <Ionicons name="arrow-back" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="bg-orange-50 w-12 h-12 rounded-2xl items-center justify-center border border-orange-100 shadow-sm mr-3">
                        <Ionicons name="calendar" size={24} color="#F07E21" />
                    </View>
                    <View className="flex-1 pr-1">
                        <Text style={{ color: t.text }} className="text-xl sm:text-2xl font-black tracking-wide" numberOfLines={1} adjustsFontSizeToFit>Reschedule Manager</Text>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5" numberOfLines={1}>Reissue Requests</Text>
                    </View>
                </View>

                {/* Search */}
                <View className="px-5 pb-3">
                    <View className="flex-row items-center bg-white px-5 py-4 rounded-2xl border border-slate-100 border-b-4 border-slate-200 shadow-sm">
                        <Ionicons name="search" size={20} color="#64748b" className="mr-3" />
                        <TextInput className="flex-1 text-slate-800 font-black text-sm" placeholder="Search by PNR or Agent..." placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} />
                    </View>
                </View>

                {/* Filters */}
                <View className="flex-row px-4 py-2 mb-2">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[{val: '', label: 'ALL'}, {val: 'PENDING_QUOTE', label: 'PENDING'}, {val: 'QUOTE_PROVIDED', label: 'QUOTE PROVIDED'}, {val: 'ACCEPTED', label: 'PAID & PENDING REISSUE'}, {val: 'PROCESSED', label: 'REISSUED'}].map((filter) => {
                            const active = statusFilter === filter.val;
                            return (
                                <TouchableOpacity key={filter.label} onPress={() => setStatusFilter(filter.val)}
                                    className={`px-4 py-3 items-center rounded-xl mx-1 border border-b-4 active:scale-95 shadow-sm ${active ? 'bg-[#1D4171] border-[#15305B] border-b-[#0f2342]' : 'bg-white border-slate-100 border-b-slate-200'}`}>
                                    <Text className={`font-black text-[9px] uppercase tracking-widest ${active ? 'text-white' : 'text-slate-400'}`}>
                                        {filter.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {loading && page === 1 ? (
                    <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#F07E21" /></View>
                ) : (
                    <FlatList
                        data={filteredRequests} renderItem={renderRescheduleItem} keyExtractor={item => item._id}
                        onRefresh={handleRefresh} refreshing={refreshing} onEndReached={handleLoadMore} onEndReachedThreshold={0.5}
                        ListFooterComponent={loadingMore ? <ActivityIndicator className="py-8" color="#F07E21" /> : <View className="h-10" />}
                        ListEmptyComponent={
                            <View className="py-20 items-center">
                                <Ionicons name="calendar-outline" size={64} color="#cbd5e1" className="mb-4" />
                                <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Reschedule Requests</Text>
                                <Text style={{ color: t.textMuted }} className="font-bold text-xs">All modifications are up to date.</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>

            {/* Quote Modal */}
            <Modal visible={isModalOpen} animationType="slide" transparent={true}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View className="flex-1 justify-end bg-black/60 px-2 pb-2">
                        <View style={{ backgroundColor: t.card, elevation: 24 }} className="p-6 rounded-3xl border border-slate-100 shadow-2xl">
                            <View className="flex-row justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                <View>
                                    <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Provide Quote</Text>
                                    <Text className="text-primary-500 font-black text-[10px] uppercase tracking-widest mt-0.5">PNR: {selectedReq?.bookingId?.pnr}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 shadow-sm">
                                    <Ionicons name="close" size={20} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <View className="flex-row justify-between bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6 shadow-sm">
                                <View>
                                    <Text className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Requested Date</Text>
                                    <Text className="text-blue-900 font-black text-sm">{selectedReq?.newTravelDate}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Pax Count</Text>
                                    <Text className="text-blue-900 font-bold text-sm">{selectedReq?.paxIds?.length || 'All'}</Text>
                                </View>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View className="space-y-4 mb-6">
                                    <View>
                                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Airline Penalty (₹)</Text>
                                        <TextInput 
                                            value={airlinePenalty} onChangeText={setAirlinePenalty} keyboardType="numeric" placeholder="e.g. 1500" placeholderTextColor="#9ca3af"
                                            className="bg-slate-50 px-5 py-4 rounded-xl border border-slate-200 font-black text-slate-900 text-lg shadow-inner"
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Fare Difference (₹)</Text>
                                        <TextInput 
                                            value={fareDifference} onChangeText={setFareDifference} keyboardType="numeric" placeholder="e.g. 500" placeholderTextColor="#9ca3af"
                                            className="bg-slate-50 px-5 py-4 rounded-xl border border-slate-200 font-black text-slate-900 text-lg shadow-inner"
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-[10px] font-black text-[#F07E21] uppercase mb-2 ml-1 tracking-widest">Admin Markup (₹)</Text>
                                        <TextInput 
                                            value={adminMarkup} onChangeText={setAdminMarkup} keyboardType="numeric" placeholder="e.g. 150" placeholderTextColor="#fb923c"
                                            className="bg-orange-50 px-5 py-4 rounded-xl border border-orange-200 focus:border-orange-500 font-black text-[#F07E21] text-lg shadow-inner"
                                        />
                                    </View>
                                </View>

                                <View className="flex-row justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 shadow-sm">
                                    <View className="flex-1 pr-2">
                                        <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Agent Cost</Text>
                                        <Text className="text-slate-500 font-bold text-[10px]" numberOfLines={1}>To be deducted if accepted</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="font-black text-2xl tracking-tight text-slate-900">
                                            ₹{(Number(airlinePenalty || 0) + Number(fareDifference || 0) + Number(adminMarkup || 0)).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity onPress={handleSendQuote} disabled={isProcessing}
                                    className="bg-[#1D4171] py-4 rounded-xl items-center border border-[#1D4171] border-b-[4px] border-b-[#0f2342] active:scale-95 shadow-lg shadow-blue-900/30 disabled:opacity-50">
                                    {isProcessing ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-black text-[11px] uppercase tracking-widest">Send Quotation</Text>}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
