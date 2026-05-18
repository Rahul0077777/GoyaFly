import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert, TextInput, Modal } from 'react-native';
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
    const [statusFilter, setStatusFilter] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [airlineRefundAmount, setAirlineRefundAmount] = useState('');
    const [adminDeduction, setAdminDeduction] = useState('0');
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchRefunds = async () => {
        try {
            const res = await adminService.getRefunds(1, 50, statusFilter);
            if (res.success) setRefunds(res.data);
        } catch (error) {
            console.error("Refund Manager Fetch Error", error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load refunds.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRefunds();
    }, [statusFilter]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRefunds();
    };

    const openProcessModal = (refund) => {
        setSelectedRefund(refund);
        setAirlineRefundAmount(String(refund.totalCost || ''));
        setAdminDeduction('0'); // Default or fetch from global settings if needed
        setIsModalOpen(true);
    };

    const handleProcessRefund = async (actionType = 'PROCESS') => {
        const airlineAmt = Number(airlineRefundAmount);
        const adminDed = Number(adminDeduction);

        if (actionType === 'PROCESS') {
            if (isNaN(airlineAmt) || isNaN(adminDed)) {
                return Toast.show({ type: 'error', text1: 'Error', text2: 'Enter valid amounts.' });
            }
            if (airlineAmt - adminDed < 0) {
                return Toast.show({ type: 'error', text1: 'Error', text2: 'Final refund cannot be negative.' });
            }
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
                            fetchRefunds();
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

    if (loading && !refreshing) {
        return (
            <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#F07E21" />
            </View>
        );
    }

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

                {/* Filters */}
                <View className="flex-row px-5 py-2 mb-2">
                    {['', 'PENDING', 'PROCESSED', 'REJECTED'].map((filter) => {
                        const active = statusFilter === filter;
                        return (
                            <TouchableOpacity 
                                key={filter}
                                onPress={() => setStatusFilter(filter)}
                                className={`flex-1 py-3 items-center rounded-xl mx-1 border border-b-4 active:scale-95 shadow-sm ${active ? 'bg-[#1D4171] border-[#15305B] border-b-[#0f2342]' : 'bg-white border-slate-100 border-b-slate-200'}`}
                            >
                                <Text className={`font-black text-[9px] uppercase tracking-widest ${active ? 'text-white' : 'text-slate-400'}`}>
                                    {filter || 'ALL'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <ScrollView 
                    className="flex-1 px-5 pt-2"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F07E21" />}
                >
                    {refunds.length === 0 ? (
                        <View className="py-20 items-center">
                            <Ionicons name="cash-outline" size={64} color="#cbd5e1" className="mb-4" />
                            <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Refund Requests</Text>
                            <Text style={{ color: t.textMuted }} className="font-bold text-xs">Everything is up to date.</Text>
                        </View>
                    ) : (
                        refunds.map(refund => (
                            <View key={refund._id} style={{ backgroundColor: t.card, elevation: 8 }} className="p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 mb-6 shadow-2xl shadow-slate-300/40">
                                <View className="flex-row justify-between items-start mb-4 pb-4 border-b border-slate-100">
                                    <View className="bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-100 shadow-sm flex-1 mr-2">
                                        <Text className="text-blue-800 font-black text-[10px] uppercase tracking-wider" numberOfLines={1}>REF: {refund.providerReference || 'N/A'}</Text>
                                    </View>
                                    <View className={`px-3.5 py-1.5 rounded-xl border shadow-sm ${
                                        refund.status === 'PROCESSED' ? 'bg-emerald-50 border-emerald-200' : 
                                        refund.status === 'REJECTED' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
                                    }`}>
                                        <Text className={`text-[9px] font-black uppercase tracking-widest ${
                                            refund.status === 'PROCESSED' ? 'text-emerald-800' : 
                                            refund.status === 'REJECTED' ? 'text-rose-800' : 'text-amber-800'
                                        }`}>{refund.status}</Text>
                                    </View>
                                </View>
                                
                                <View className="mb-5">
                                    <Text style={{ color: t.text }} className="text-xl font-black tracking-wide mb-1">{refund.airline || 'Unknown Airline'}</Text>
                                    <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest">
                                        PNR: {refund.pnr} • Agent: {refund.agentName}
                                    </Text>
                                </View>

                                <View className="flex-row justify-between mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    <View className="flex-1 pr-2">
                                        <Text className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Booking Amount</Text>
                                        <Text className="font-black text-slate-900 text-lg tracking-tight">₹{refund.totalCost?.toLocaleString()}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Request Date</Text>
                                        <Text className="font-black text-slate-600 text-xs mt-0.5">{new Date(refund.createdAt).toLocaleDateString()}</Text>
                                    </View>
                                </View>

                                {refund.status === 'PENDING' && (
                                    <TouchableOpacity 
                                        onPress={() => openProcessModal(refund)}
                                        className="bg-[#F07E21] py-5 rounded-2xl items-center border border-[#F07E21] border-b-[6px] border-b-[#D96B18] shadow-xl shadow-orange-500/30 active:scale-95"
                                    >
                                        <Text className="text-white font-black text-xs uppercase tracking-widest">Process Refund ➔</Text>
                                    </TouchableOpacity>
                                )}
                                
                                {refund.status === 'PROCESSED' && (
                                    <View className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex-row justify-between items-center shadow-sm">
                                        <Text className="text-emerald-800 font-black text-xs uppercase tracking-wider">Refunded Amount:</Text>
                                        <Text className="text-emerald-900 font-black text-base tracking-tight">₹{refund.refundAmount?.toLocaleString()}</Text>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                    <View className="h-10" />
                </ScrollView>
            </SafeAreaView>

            {/* Process Modal */}
            <Modal visible={isModalOpen} animationType="slide" transparent={true}>
                <View className="flex-1 justify-end bg-black/60">
                    <View style={{ backgroundColor: t.card, elevation: 24 }} className="p-8 pb-12 rounded-t-[3rem] border-t border-slate-100 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-8 border-b border-slate-100 pb-4">
                            <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">Process Refund</Text>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm">
                                <Ionicons name="close" size={22} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-6">
                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Airline Refund Amount (₹)</Text>
                                <TextInput 
                                    value={airlineRefundAmount}
                                    onChangeText={setAirlineRefundAmount}
                                    keyboardType="numeric"
                                    placeholder="e.g. 5000"
                                    placeholderTextColor="#9ca3af"
                                    className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-lg shadow-inner"
                                />
                            </View>

                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Admin Deduction (₹)</Text>
                                <TextInput 
                                    value={adminDeduction}
                                    onChangeText={setAdminDeduction}
                                    keyboardType="numeric"
                                    placeholder="e.g. 250"
                                    placeholderTextColor="#9ca3af"
                                    className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-lg shadow-inner"
                                />
                            </View>

                            <View className="bg-orange-50 p-5 rounded-2xl border border-orange-200 mb-6 shadow-sm">
                                <Text className="text-[#F07E21] font-black text-sm tracking-wide">Final Agent Credit: <Text className="text-slate-900 tracking-tight">₹{Number(airlineRefundAmount || 0) - Number(adminDeduction || 0)}</Text></Text>
                            </View>

                            <View className="flex-row gap-4">
                                <TouchableOpacity 
                                    onPress={() => handleProcessRefund('PROCESS')}
                                    disabled={isProcessing}
                                    className="flex-[2] bg-emerald-600 py-5 rounded-2xl items-center border border-emerald-600 border-b-[6px] border-b-emerald-800 shadow-xl shadow-emerald-700/30 active:scale-95"
                                >
                                    <Text className="text-white font-black text-xs uppercase tracking-widest">Approve & Credit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => handleProcessRefund('REJECT')}
                                    disabled={isProcessing}
                                    className="flex-1 bg-white border border-slate-100 border-b-[6px] border-slate-200 py-5 rounded-2xl items-center active:scale-95 shadow-sm"
                                >
                                    <Text className="text-rose-600 font-black text-xs uppercase tracking-widest">Reject</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
