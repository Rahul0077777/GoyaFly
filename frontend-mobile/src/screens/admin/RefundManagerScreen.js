import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, FlatList, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function RefundManagerScreen({ navigation }) {
    const t = useThemeColors();
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [globalSettings, setGlobalSettings] = useState(null);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [airlineRefundAmount, setAirlineRefundAmount] = useState('');
    const [adminDeduction, setAdminDeduction] = useState('0');
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchGlobalSettings = async () => {
        try {
            const res = await adminService.getGlobalSettings();
            if (res.success) setGlobalSettings(res.data);
        } catch (err) { console.error('Failed to fetch global settings'); }
    };

    const fetchRefunds = useCallback(async (pageNum = 1, isRefresh = false) => {
        try {
            if (pageNum === 1 && !isRefresh) setLoading(true);
            const res = await adminService.getRefunds(pageNum, 50, statusFilter);
            if (res.success) {
                if (pageNum === 1) setRefunds(res.data);
                else setRefunds(prev => [...prev, ...res.data]);
                setHasMore(res.pagination?.page < res.pagination?.pages);
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load refunds.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchGlobalSettings();
    }, []);

    useEffect(() => {
        setPage(1);
        fetchRefunds(1, false);
    }, [statusFilter, fetchRefunds]);

    const handleRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchRefunds(1, true);
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            setLoadingMore(true);
            const np = page + 1;
            setPage(np);
            fetchRefunds(np, false);
        }
    };

    const openProcessModal = (refund) => {
        setSelectedRefund(refund);
        setAirlineRefundAmount(String(refund.totalCost || ''));
        setAdminDeduction(String(globalSettings?.defaultRefundMarkup || '0'));
        setIsModalOpen(true);
    };

    const handleProcessRefund = async (actionType = 'PROCESS') => {
        const airlineAmt = Number(airlineRefundAmount);
        const adminDed = Number(adminDeduction);

        if (actionType === 'PROCESS') {
            if (isNaN(airlineAmt) || isNaN(adminDed)) return Toast.show({ type: 'error', text1: 'Error', text2: 'Enter valid amounts.' });
            if (airlineAmt - adminDed < 0) return Toast.show({ type: 'error', text1: 'Error', text2: 'Final refund cannot be negative.' });
        }

        Alert.alert(
            actionType === 'REJECT' ? "Reject Refund?" : "Confirm Refund?",
            actionType === 'REJECT' ? "This will deny the agent's request." : `Confirming refund of ₹${airlineAmt - adminDed} to agent wallet.`,
            [
                { text: "Cancel", style: "cancel" },
                { text: actionType === 'REJECT' ? "Reject" : "Confirm", onPress: async () => {
                    setIsProcessing(true);
                    try {
                        const res = await adminService.processRefund(selectedRefund._id, airlineAmt, adminDed, actionType);
                        if (res.success) {
                            Toast.show({ type: 'success', text1: 'Success', text2: actionType === 'REJECT' ? 'Refund Rejected' : 'Refund Processed' });
                            setIsModalOpen(false);
                            setPage(1);
                            fetchRefunds(1, false);
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

    const filteredRefunds = refunds.filter(b => {
        const term = search.toLowerCase();
        return (
            b.providerReference?.toLowerCase().includes(term) ||
            b.agentId?.agencyName?.toLowerCase().includes(term) ||
            b.agentName?.toLowerCase().includes(term) ||
            b.pnr?.toLowerCase().includes(term)
        );
    });

    const getStatusStyle = (status) => {
        if (status === 'PROCESSED') return 'bg-emerald-50 border-emerald-200 text-emerald-800';
        if (status === 'PENDING_AIRLINE' || status === 'PENDING') return 'bg-amber-50 border-amber-200 text-amber-800';
        if (status === 'REJECTED' || status === 'FAILED') return 'bg-rose-50 border-rose-200 text-rose-800';
        return 'bg-slate-50 border-slate-200 text-slate-800';
    };

    const renderRefundItem = ({ item }) => {
        const statusStr = item.refundStatus || item.status;
        const styleTokens = getStatusStyle(statusStr).split(' ');
        const bgBorder = styleTokens.slice(0, 2).join(' ');
        const textColor = styleTokens[2];

        return (
            <View style={{ backgroundColor: t.card, elevation: 8 }} className="mx-4 mb-6 rounded-3xl border border-slate-100 border-b-[6px] border-slate-200 shadow-xl shadow-slate-300/40 overflow-hidden">
                {/* Top row: PNR & Airline */}
                <View className="p-5 flex-row items-start justify-between border-b border-slate-100 bg-slate-50/50">
                    <View className="flex-1 pr-2">
                        <Text className="text-xl font-black text-slate-900 tracking-wide mb-1">{item.pnr || item.providerReference}</Text>
                        <Text className="text-[10px] font-black text-[#1D4171] uppercase tracking-widest">{item.airline || 'Unknown Airline'}</Text>
                    </View>
                    <View className={`px-3 py-1.5 rounded-xl border shadow-sm ${bgBorder}`}>
                        <Text className={`text-[9px] font-black uppercase tracking-widest ${textColor}`}>
                            {statusStr?.replace('_', ' ') || 'UNKNOWN'}
                        </Text>
                    </View>
                </View>

                {/* Middle row: Agent & Cost */}
                <View className="p-5 border-b border-slate-100">
                    <View className="flex-row justify-between items-center mb-4">
                        <View className="flex-1 pr-2">
                            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Agent Details</Text>
                            <Text className="font-bold text-slate-700 text-xs" numberOfLines={1}>{item.agentId?.agencyName || item.agentName || 'Unknown Agent'}</Text>
                        </View>
                        <View className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                            <Text className="text-slate-600 font-black text-[9px] uppercase tracking-wider">{item.refundType || 'Non-Refundable'}</Text>
                        </View>
                    </View>

                    <View className="flex-row justify-between items-end bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <View>
                            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Cost</Text>
                            <Text className="font-black text-slate-900 text-lg tracking-tight">₹{item.totalCost?.toLocaleString()}</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Agent Refund</Text>
                            <Text className={`font-black text-base tracking-tight ${statusStr === 'PROCESSED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {statusStr === 'PROCESSED' ? `₹${item.refundAmount?.toLocaleString()}` : '-'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Bottom action row */}
                <View className="px-5 py-4 bg-white flex-row justify-between items-center">
                    <View>
                        <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Requested On</Text>
                        <Text className="font-bold text-slate-600 text-xs">{new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                    
                    {statusStr !== 'PROCESSED' && statusStr !== 'REJECTED' && (
                        <TouchableOpacity onPress={() => openProcessModal(item)}
                            className="bg-[#F07E21] px-5 py-2.5 rounded-xl border-b-4 border-b-[#D96B18] active:scale-95 shadow-sm flex-row items-center gap-2">
                            <Ionicons name="cog" size={14} color="#fff" />
                            <Text className="text-white font-black text-[10px] uppercase tracking-wider">Process</Text>
                        </TouchableOpacity>
                    )}
                    
                    {statusStr === 'REJECTED' && (
                        <Text className="text-[10px] font-bold text-rose-400 italic">No Refund</Text>
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
                <View className="px-5 py-5 flex-row items-center border-b border-slate-100 mb-2">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm mr-3.5">
                        <Ionicons name="arrow-back" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="bg-orange-50 w-12 h-12 rounded-2xl items-center justify-center border border-orange-100 shadow-sm mr-3.5">
                        <Ionicons name="cash" size={24} color="#F07E21" />
                    </View>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">Refund Manager</Text>
                        <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest mt-0.5">GDS Cancellations</Text>
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
                        {[{val: '', label: 'ALL'}, {val: 'PENDING_AIRLINE', label: 'PENDING'}, {val: 'PROCESSED', label: 'PROCESSED'}, {val: 'REJECTED', label: 'REJECTED'}, {val: 'FAILED', label: 'FAILED'}, {val: 'NA', label: 'NA'}].map((filter) => {
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
                        data={filteredRefunds} renderItem={renderRefundItem} keyExtractor={item => item._id}
                        onRefresh={handleRefresh} refreshing={refreshing} onEndReached={handleLoadMore} onEndReachedThreshold={0.5}
                        ListFooterComponent={loadingMore ? <ActivityIndicator className="py-8" color="#F07E21" /> : <View className="h-10" />}
                        ListEmptyComponent={
                            <View className="py-20 items-center">
                                <Ionicons name="cash-outline" size={64} color="#cbd5e1" className="mb-4" />
                                <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Refund Requests</Text>
                                <Text style={{ color: t.textMuted }} className="font-bold text-xs">Everything is up to date.</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>

            {/* Process Modal */}
            <Modal visible={isModalOpen} animationType="slide" transparent={true}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View className="flex-1 justify-end bg-black/60 px-2 pb-2">
                        <View style={{ backgroundColor: t.card, elevation: 24 }} className="p-6 rounded-3xl border border-slate-100 shadow-2xl">
                            <View className="flex-row justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                <View>
                                    <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Process Refund</Text>
                                    <Text className="text-primary-500 font-black text-[10px] uppercase tracking-widest mt-0.5">PNR: {selectedRefund?.pnr}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 shadow-sm">
                                    <Ionicons name="close" size={20} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <View className="flex-row justify-between bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6 shadow-sm">
                                <View>
                                    <Text className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Ticket Cost</Text>
                                    <Text className="text-blue-900 font-black text-lg">₹{selectedRefund?.totalCost?.toLocaleString()}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Refund Type</Text>
                                    <Text className="text-blue-900 font-bold text-sm">{selectedRefund?.refundType}</Text>
                                </View>
                            </View>

                            <View className="space-y-4 mb-6">
                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Airline Refund Amount (₹)</Text>
                                    <TextInput 
                                        value={airlineRefundAmount} onChangeText={setAirlineRefundAmount} keyboardType="numeric" placeholder="e.g. 5000" placeholderTextColor="#9ca3af"
                                        className="bg-slate-50 px-5 py-4 rounded-xl border border-slate-200 font-black text-slate-900 text-lg shadow-inner"
                                    />
                                </View>
                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Admin Deduction (₹)</Text>
                                    <TextInput 
                                        value={adminDeduction} onChangeText={setAdminDeduction} keyboardType="numeric" placeholder="e.g. 250" placeholderTextColor="#9ca3af"
                                        className="bg-white px-5 py-4 rounded-xl border border-rose-200 focus:border-rose-500 font-black text-rose-600 text-lg shadow-inner"
                                    />
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 shadow-sm">
                                <View className="flex-1 pr-2">
                                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Wallet Credit</Text>
                                    <Text className="text-slate-500 font-bold text-[10px]" numberOfLines={1}>To Agent: {selectedRefund?.agentId?.agencyName || selectedRefund?.agentName}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className={`font-black text-2xl tracking-tight ${(Number(airlineRefundAmount || 0) - Number(adminDeduction || 0)) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        ₹{Math.max(0, Number(airlineRefundAmount || 0) - Number(adminDeduction || 0)).toLocaleString()}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row gap-4">
                                <TouchableOpacity onPress={() => handleProcessRefund('REJECT')} disabled={isProcessing}
                                    className="flex-1 bg-rose-50 border border-rose-100 border-b-[4px] border-b-rose-200 py-4 rounded-xl items-center active:scale-95 shadow-sm">
                                    <Text className="text-rose-600 font-black text-[10px] uppercase tracking-widest">Reject</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleProcessRefund('PROCESS')} disabled={isProcessing || (Number(airlineRefundAmount) - Number(adminDeduction)) < 0}
                                    className="flex-[2] bg-emerald-500 border border-emerald-600 border-b-[4px] border-b-emerald-700 py-4 rounded-xl items-center active:scale-95 shadow-lg shadow-emerald-500/30 disabled:opacity-50">
                                    {isProcessing ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-black text-[11px] uppercase tracking-widest">Confirm Credit</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
