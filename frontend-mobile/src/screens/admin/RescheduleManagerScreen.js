import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
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
    const [statusFilter, setStatusFilter] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReq, setSelectedReq] = useState(null);
    const [airlinePenalty, setAirlinePenalty] = useState('');
    const [fareDifference, setFareDifference] = useState('');
    const [adminMarkup, setAdminMarkup] = useState('150');
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchReschedules = async () => {
        try {
            const res = await adminService.getReschedules(1, 50, statusFilter);
            if (res.success) setReschedules(res.data);
        } catch (error) {
            console.error("Reschedule Manager Fetch Error", error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load reschedules.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchReschedules();
    }, [statusFilter]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchReschedules();
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
                            fetchReschedules();
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
                            fetchReschedules();
                        }
                    } catch (error) {
                        Toast.show({ type: 'error', text1: 'Error', text2: 'Action failed.' });
                        setLoading(false);
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

    const getStatusStyle = (status) => {
        if (status === 'PROCESSED') return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
        if (status === 'ACCEPTED') return 'bg-blue-50 text-blue-700 border border-blue-100';
        if (status === 'QUOTE_PROVIDED') return 'bg-purple-50 text-purple-700 border border-purple-100';
        if (status === 'PENDING_QUOTE') return 'bg-amber-50 text-amber-700 border border-amber-100';
        return 'bg-slate-50 text-slate-700 border border-slate-200';
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
                        <Ionicons name="calendar" size={24} color="#F07E21" />
                    </View>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">Reschedule Manager</Text>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Reissue Requests</Text>
                    </View>
                </View>

                {/* Filters */}
                <View className="px-5 mb-2">
                    <View className="flex-row bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                        {['', 'PENDING_QUOTE', 'ACCEPTED', 'PROCESSED'].map((filter) => (
                            <TouchableOpacity 
                                key={filter}
                                onPress={() => setStatusFilter(filter)}
                                className={`flex-1 py-3 items-center rounded-xl ${statusFilter === filter ? 'bg-white shadow-md border border-slate-100' : ''}`}
                            >
                                <Text className={`font-black text-[9px] uppercase tracking-wider ${statusFilter === filter ? 'text-slate-900' : 'text-slate-400'}`}>
                                    {filter.replace('_', ' ') || 'ALL'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <ScrollView 
                    className="flex-1 px-5 pt-2"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F07E21" />}
                >
                    {reschedules.length === 0 ? (
                        <View className="py-24 items-center">
                            <Ionicons name="calendar-clear-outline" size={64} color="#cbd5e1" className="mb-4" />
                            <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Reschedule Requests</Text>
                            <Text className="text-slate-400 font-bold text-xs">All flight modification requests have been handled.</Text>
                        </View>
                    ) : (
                        reschedules.map(req => (
                            <View key={req._id} style={{ backgroundColor: t.card, elevation: 8 }} className="p-7 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 mb-6 shadow-2xl shadow-slate-300/40">
                                <View className="flex-row justify-between items-start mb-6 pb-4 border-b border-slate-100">
                                    <View className="bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-100 shadow-sm">
                                        <Text className="text-[#1D4171] font-black text-[10px] uppercase tracking-widest">PNR: {req.bookingId?.pnr || 'N/A'}</Text>
                                    </View>
                                    <Text className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider ${getStatusStyle(req.status)}`}>
                                        {req.status.replace('_', ' ')}
                                    </Text>
                                </View>
                                
                                <View className="mb-6">
                                    <Text className="text-xl font-black text-[#F07E21] mb-1 tracking-wide">New Date: {req.newTravelDate}</Text>
                                    <Text className="text-slate-400 text-xs font-black uppercase tracking-wide">
                                        Agent: {req.agentId?.agencyName || 'Agent'}
                                    </Text>
                                </View>

                                <View className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner mb-6">
                                    <Text className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Flight Preference</Text>
                                    <Text className="font-black text-slate-900 text-sm tracking-wide">{req.flightDetails || 'Any available flight'}</Text>
                                </View>

                                {req.status === 'PENDING_QUOTE' && (
                                    <TouchableOpacity 
                                        onPress={() => openQuoteModal(req)}
                                        className="bg-[#F07E21] py-4 rounded-2xl items-center border border-[#F07E21] border-b-4 border-b-[#D96B18] shadow-lg shadow-orange-500/30 active:scale-95"
                                    >
                                        <Text className="text-white font-black text-xs uppercase tracking-widest">Send Quotation ➔</Text>
                                    </TouchableOpacity>
                                )}

                                {req.status === 'ACCEPTED' && (
                                    <TouchableOpacity 
                                        onPress={() => handleMarkReissued(req._id)}
                                        className="bg-emerald-600 py-4 rounded-2xl items-center border border-emerald-600 border-b-4 border-b-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-95"
                                    >
                                        <Text className="text-white font-black text-xs uppercase tracking-widest">Mark as Reissued</Text>
                                    </TouchableOpacity>
                                )}
                                
                                {req.quoteDetails && (
                                    <View className="mt-4 pt-4 border-t border-slate-100 flex-row justify-between items-center">
                                        <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Total Quoted:</Text>
                                        <Text className="text-slate-900 font-black text-sm tracking-tight">₹{req.quoteDetails.totalAmount?.toLocaleString()}</Text>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                    <View className="h-10" />
                </ScrollView>
            </SafeAreaView>

            {/* Quote Modal */}
            <Modal visible={isModalOpen} animationType="slide" transparent={true}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/60 justify-end">
                    <View style={{ elevation: 24 }} className="bg-white rounded-t-[3.5rem] p-8 pb-12 shadow-2xl border-t border-slate-100">
                        <View className="flex-row justify-between items-center mb-8 pb-4 border-b border-slate-100">
                            <View>
                                <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide uppercase">Reschedule Quote</Text>
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Provide fee breakdown</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm">
                                <Ionicons name="close" size={22} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="space-y-6 pb-2">
                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Airline Penalty (₹)</Text>
                                    <TextInput 
                                        value={airlinePenalty}
                                        onChangeText={setAirlinePenalty}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor="#9ca3af"
                                        className="bg-slate-50 p-5 rounded-2xl font-black text-slate-900 text-base border border-slate-100 shadow-inner"
                                    />
                                </View>

                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Fare Difference (₹)</Text>
                                    <TextInput 
                                        value={fareDifference}
                                        onChangeText={setFareDifference}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor="#9ca3af"
                                        className="bg-slate-50 p-5 rounded-2xl font-black text-slate-900 text-base border border-slate-100 shadow-inner"
                                    />
                                </View>

                                <View>
                                    <Text className="text-[10px] font-black text-[#F07E21] uppercase mb-2 ml-1 tracking-widest">Admin Markup (₹)</Text>
                                    <TextInput 
                                        value={adminMarkup}
                                        onChangeText={setAdminMarkup}
                                        keyboardType="numeric"
                                        placeholder="150"
                                        placeholderTextColor="#fb923c"
                                        className="bg-orange-50 p-5 rounded-2xl font-black text-[#F07E21] text-base border border-orange-100 shadow-inner"
                                    />
                                </View>

                                <View className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner mt-2 mb-6 flex-row justify-between items-center">
                                    <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Total Quotation</Text>
                                    <Text className="text-slate-900 font-black text-xl tracking-tight">₹{Number(airlinePenalty || 0) + Number(fareDifference || 0) + Number(adminMarkup || 0)}</Text>
                                </View>

                                <TouchableOpacity 
                                    onPress={handleSendQuote}
                                    disabled={isProcessing}
                                    className="bg-[#F07E21] py-5 rounded-2xl items-center border border-[#F07E21] border-b-[6px] border-b-[#D96B18] shadow-xl shadow-orange-500/30 active:scale-95 mb-4"
                                >
                                    <Text className="text-white font-black text-xs uppercase tracking-widest">Send Quote to Agent</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
