import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert, TextInput, Modal, Switch, Linking } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminService, otbService, BASE_URL } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function OTBManagerScreen({ navigation }) {
    const t = useThemeColors();
    const [activeTab, setActiveTab] = useState('PASSENGER'); // PASSENGER, AGENT, PRICING
    
    const [requests, setRequests] = useState([]);
    const [agentRequests, setAgentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Passenger Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [newStatus, setNewStatus] = useState('');

    // Pricing State
    const [pricingList, setPricingList] = useState([]);
    const [pricingLoading, setPricingLoading] = useState(false);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [editingPricing, setEditingPricing] = useState(null);
    const [pricingFormData, setPricingFormData] = useState({
        airline: '', rate: '', group: 'A', isActive: true
    });

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem('adminToken');
            if (!token) {
                Toast.show({ type: 'error', text1: 'Unauthorized', text2: 'Please login as admin.' });
                navigation.goBack();
                return;
            }

            const res = await adminService.getAllOtbRequests();
            if (res.success) setRequests(res.data);
            
            const agentRes = await adminService.getOtbAgentRequests();
            if (agentRes.success) setAgentRequests(agentRes.data);
        } catch (error) {
            console.error("OTB Manager Fetch Error", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchPricing = async () => {
        try {
            setPricingLoading(true);
            const res = await otbService.getPricing(true);
            if (res.success) setPricingList(res.data);
        } catch (err) {
            console.error('Failed to fetch pricing', err);
        } finally {
            setPricingLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activeTab === 'PRICING' && pricingList.length === 0) {
            fetchPricing();
        }
    }, [activeTab]);

    const onRefresh = () => {
        setRefreshing(true);
        if (activeTab === 'PRICING') fetchPricing();
        else fetchData();
    };

    const openRequestModal = (req) => {
        setSelectedRequest(req);
        setNewStatus(req.status);
        setAdminNotes(req.adminNotes || '');
    };

    const handleUpdateStatus = async () => {
        if (!selectedRequest) return;
        setUpdating(true);
        try {
            const res = await adminService.updateOtbStatus(selectedRequest._id, { 
                status: newStatus, 
                adminNotes 
            });
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Status updated and notification sent!' });
                setSelectedRequest(null);
                fetchData();
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update status' });
        } finally {
            setUpdating(false);
        }
    };

    const handleApproveAgent = async (agentId, status) => {
        Alert.alert("Confirm OTB Access", `Set agent status to ${status}?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Confirm", onPress: async () => {
                setLoading(true);
                try {
                    const res = await adminService.approveOtbAgentAccess(agentId, { isGranted: status === 'APPROVED' });
                    if (res.success) {
                        Toast.show({ type: 'success', text1: 'Success', text2: `Agent OTB access ${status.toLowerCase()}ed!` });
                        fetchData();
                    }
                } catch (err) {
                    Toast.show({ type: 'error', text1: 'Error', text2: 'Action failed.' });
                    setLoading(false);
                }
            }}
        ]);
    };

    // --- Pricing Logic ---
    const handleOpenPricingModal = (item = null) => {
        if (item) {
            setEditingPricing(item);
            setPricingFormData({
                airline: item.airline,
                rate: String(item.rate),
                group: item.group || 'A',
                isActive: item.isActive
            });
        } else {
            setEditingPricing(null);
            setPricingFormData({
                airline: '', rate: '', group: 'A', isActive: true
            });
        }
        setShowPricingModal(true);
    };

    const handleSavePricing = async () => {
        if (!pricingFormData.airline || !pricingFormData.rate) {
            return Toast.show({ type: 'error', text1: 'Error', text2: 'Airline and rate are required' });
        }
        setUpdating(true);
        try {
            if (editingPricing) {
                await otbService.updatePricing(editingPricing._id, pricingFormData);
                Toast.show({ type: 'success', text1: 'Success', text2: 'Pricing updated' });
            } else {
                await otbService.createPricing(pricingFormData);
                Toast.show({ type: 'success', text1: 'Success', text2: 'Pricing added' });
            }
            setShowPricingModal(false);
            fetchPricing();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || 'Failed to save pricing' });
        } finally {
            setUpdating(false);
        }
    };

    const handleDeletePricing = (id) => {
        Alert.alert("Delete Pricing?", "Are you sure you want to delete this airline configuration?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                setPricingLoading(true);
                try {
                    await otbService.deletePricing(id);
                    Toast.show({ type: 'success', text1: 'Success', text2: 'Pricing deleted' });
                    fetchPricing();
                } catch (err) {
                    Toast.show({ type: 'error', text1: 'Error', text2: 'Delete failed.' });
                    setPricingLoading(false);
                }
            }}
        ]);
    };

    const filteredRequests = requests.filter(r => {
        const matchesSearch = 
            (r.receiptNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (r.travelDetails?.pnr?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (r.travelDetails?.contactNo || '').includes(searchTerm);
        
        const matchesStatus = statusFilter === '' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const openDocument = (url) => {
        const fullUrl = `${BASE_URL.replace('/api', '')}${url}`;
        Linking.openURL(fullUrl).catch(err => {
            console.error("Failed to open URL:", err);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Could not open document' });
        });
    };

    if (loading && !refreshing) {
        return (
            <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#48A0D4" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="mx-4 mt-2 mb-4 p-4 flex-row items-center bg-white rounded-3xl border border-slate-100 border-b-[6px] border-b-slate-200 shadow-xl shadow-slate-300/40">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-200 active:scale-95 mr-3">
                        <Ionicons name="arrow-back" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="bg-sky-50 w-12 h-12 rounded-2xl items-center justify-center border border-sky-100 shadow-sm mr-3">
                        <Ionicons name="airplane" size={24} color="#48A0D4" />
                    </View>
                    <View className="flex-1 pr-1">
                        <Text style={{ color: t.text }} className="text-xl sm:text-2xl font-black tracking-wide" numberOfLines={1} adjustsFontSizeToFit>OTB Control Center</Text>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5" numberOfLines={1}>Global OK TO BOARD Management</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View className="px-4 mb-2">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row bg-slate-100 p-1.5 rounded-3xl border border-slate-200 shadow-inner">
                        <TouchableOpacity 
                            onPress={() => setActiveTab('PASSENGER')}
                            className={`px-6 py-3 items-center rounded-xl mr-1 ${activeTab === 'PASSENGER' ? 'bg-white shadow-md border border-slate-100' : ''}`}
                        >
                            <Text className={`font-black text-[10px] uppercase tracking-widest ${activeTab === 'PASSENGER' ? 'text-[#1D4171]' : 'text-slate-400'}`}>
                                Passengers ({requests.length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setActiveTab('AGENT')}
                            className={`px-6 py-3 items-center rounded-xl mr-1 ${activeTab === 'AGENT' ? 'bg-white shadow-md border border-slate-100' : ''}`}
                        >
                            <Text className={`font-black text-[10px] uppercase tracking-widest ${activeTab === 'AGENT' ? 'text-[#1D4171]' : 'text-slate-400'}`}>
                                Agent Access ({agentRequests.length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setActiveTab('PRICING')}
                            className={`px-6 py-3 items-center rounded-xl ${activeTab === 'PRICING' ? 'bg-white shadow-md border border-slate-100' : ''}`}
                        >
                            <Text className={`font-black text-[10px] uppercase tracking-widest ${activeTab === 'PRICING' ? 'text-[#1D4171]' : 'text-slate-400'}`}>
                                Airline Pricing
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                <ScrollView 
                    className="flex-1 pt-2"
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#48A0D4" />}
                >
                    {activeTab === 'PASSENGER' ? (
                        <View className="px-4">
                            {/* Filters */}
                            <View className="mb-4 space-y-3">
                                <View className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-row items-center px-4">
                                    <Ionicons name="search" size={20} color="#94a3b8" />
                                    <TextInput 
                                        value={searchTerm} onChangeText={setSearchTerm}
                                        placeholder="Search by PNR, Receipt, Mobile..."
                                        placeholderTextColor="#94a3b8"
                                        className="flex-1 py-4 px-3 font-bold text-slate-800 text-sm"
                                    />
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                    {['', 'PENDING', 'PROCESSING', 'APPROVED', 'REJECTED'].map(s => (
                                        <TouchableOpacity 
                                            key={s} onPress={() => setStatusFilter(s)}
                                            className={`px-4 py-2 rounded-xl mr-2 border ${statusFilter === s ? 'bg-[#1D4171] border-[#15305B]' : 'bg-white border-slate-100'}`}
                                        >
                                            <Text className={`font-black text-[9px] uppercase tracking-widest ${statusFilter === s ? 'text-white' : 'text-slate-400'}`}>{s || 'ALL'}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {filteredRequests.length === 0 ? (
                                <View className="py-24 items-center">
                                    <Ionicons name="airplane-outline" size={64} color="#cbd5e1" className="mb-4" />
                                    <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Requests Found</Text>
                                    <Text className="text-slate-400 font-bold text-xs">Try adjusting your filters.</Text>
                                </View>
                            ) : (
                                filteredRequests.map(req => (
                                    <View key={req._id} style={{ backgroundColor: t.card, elevation: 8 }} className="p-6 rounded-3xl border border-slate-100 border-b-[8px] border-slate-200 mb-6 shadow-2xl shadow-slate-300/40">
                                        <View className="flex-row justify-between items-start mb-6 pb-4 border-b border-slate-100">
                                            <View className="bg-sky-50 px-3.5 py-1.5 rounded-xl border border-sky-100 shadow-sm flex-row items-center gap-1.5">
                                                <Ionicons name="ticket" size={12} color="#0284c7" />
                                                <Text className="text-sky-700 font-black text-[10px] uppercase tracking-widest">PNR: {req.travelDetails?.pnr}</Text>
                                            </View>
                                            <View className="flex-row items-center gap-2">
                                                {req.isUrgent && (
                                                    <View className="bg-orange-500 px-2.5 py-1 rounded-full flex-row items-center">
                                                        <Ionicons name="flash" size={10} color="#FFF" />
                                                        <Text className="text-white font-black text-[9px] ml-1 uppercase">Urgent</Text>
                                                    </View>
                                                )}
                                                <Text className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                                                    req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                                                    req.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 
                                                    req.status === 'PROCESSING' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                }`}>{req.status}</Text>
                                            </View>
                                        </View>
                                        
                                        <Text style={{ color: t.text }} className="text-xl font-black mb-1 tracking-wide">{req.airline}</Text>
                                        <Text className="text-slate-400 text-[10px] font-black uppercase mb-6 tracking-widest">
                                            {req.passengers?.[0]?.firstName} {req.passengers?.[0]?.lastName} {req.passengers?.length > 1 ? `+ ${req.passengers.length - 1} more` : ''} • {req.receiptNumber}
                                        </Text>

                                        <TouchableOpacity 
                                            onPress={() => openRequestModal(req)}
                                            className="w-full bg-[#1D4171] py-4 rounded-2xl items-center border border-[#15305B] border-b-4 border-b-[#0f2342] shadow-xl shadow-blue-900/20 active:scale-95"
                                        >
                                            <Text className="text-white font-black text-xs uppercase tracking-widest">Review & Update</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </View>
                    ) : activeTab === 'AGENT' ? (
                        <View className="px-4">
                            {agentRequests.length === 0 ? (
                                <View className="py-24 items-center">
                                    <Ionicons name="shield-checkmark-outline" size={64} color="#cbd5e1" className="mb-4" />
                                    <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Pending Requests</Text>
                                    <Text className="text-slate-400 font-bold text-xs">Agent OTB access requests are fully up to date.</Text>
                                </View>
                            ) : (
                                agentRequests.map(agent => (
                                    <View key={agent._id} style={{ backgroundColor: t.card, elevation: 8 }} className="p-7 rounded-3xl border border-slate-100 border-b-[8px] border-slate-200 mb-6 shadow-2xl shadow-slate-300/40">
                                        <View className="flex-row items-center mb-6 pb-4 border-b border-slate-100">
                                            <View className="w-14 h-14 bg-slate-900 rounded-2xl items-center justify-center mr-4 border border-black shadow-md">
                                                <Text className="text-white font-black text-2xl">{agent.agentName?.charAt(0)}</Text>
                                            </View>
                                            <View className="flex-1">
                                                <Text style={{ color: t.text }} className="text-xl font-black tracking-wide mb-1">{agent.agentName}</Text>
                                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{agent.agencyName || 'INDIVIDUAL AGENT'}</Text>
                                            </View>
                                        </View>
                                        
                                        <View className="flex-row justify-between mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
                                            <View>
                                                <Text className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Balance</Text>
                                                <Text className="font-black text-slate-900 text-lg tracking-tight">₹{agent.walletBalance?.toLocaleString()}</Text>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Status</Text>
                                                <Text className="font-black text-[#F07E21] text-xs uppercase tracking-wider">{agent.otbAccessStatus}</Text>
                                            </View>
                                        </View>

                                        <View className="flex-row gap-3">
                                            <TouchableOpacity 
                                                onPress={() => handleApproveAgent(agent._id, 'APPROVED')}
                                                className="flex-1 bg-emerald-600 py-4 rounded-2xl items-center border border-emerald-600 border-b-4 border-b-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-95"
                                            >
                                                <Text className="text-white font-black text-xs uppercase tracking-widest">Approve</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                onPress={() => handleApproveAgent(agent._id, 'REJECTED')}
                                                className="flex-[0.6] bg-rose-50 py-4 rounded-2xl items-center border border-rose-100 border-b-4 border-b-rose-200 shadow-sm active:scale-95"
                                            >
                                                <Text className="text-rose-600 font-black text-xs uppercase tracking-widest">Reject</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    ) : (
                        <View className="px-4">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-slate-500 font-black text-xs uppercase tracking-widest ml-2">Configured Airlines</Text>
                                <TouchableOpacity 
                                    onPress={() => handleOpenPricingModal()}
                                    className="bg-[#1D4171] px-4 py-2.5 rounded-xl border border-[#15305B] border-b-4 border-b-[#0f2342] shadow-md active:scale-95"
                                >
                                    <Text className="text-white font-black text-[9px] uppercase tracking-widest">+ Add Airline</Text>
                                </TouchableOpacity>
                            </View>
                            
                            {pricingLoading ? (
                                <View className="py-24 items-center">
                                    <ActivityIndicator size="large" color="#1D4171" />
                                </View>
                            ) : pricingList.length === 0 ? (
                                <View className="py-24 items-center">
                                    <Ionicons name="cash-outline" size={64} color="#cbd5e1" className="mb-4" />
                                    <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Pricing Data</Text>
                                    <Text className="text-slate-400 font-bold text-xs">Add an airline to configure dynamic OTB fees.</Text>
                                </View>
                            ) : (
                                pricingList.map(item => (
                                    <View key={item._id} style={{ backgroundColor: t.card, elevation: 6 }} className="p-5 rounded-3xl border border-slate-100 border-b-[6px] border-slate-200 mb-4 shadow-xl shadow-slate-200/50 flex-row items-center justify-between">
                                        <View className="flex-1 pr-4">
                                            <View className="flex-row items-center gap-2 mb-1">
                                                <Text style={{ color: t.text }} className="text-lg font-black tracking-wide leading-tight">{item.airline}</Text>
                                                {!item.isActive && <Text className="bg-slate-100 text-slate-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Inactive</Text>}
                                            </View>
                                            <Text className="font-black text-sky-600 text-xl tracking-tight mt-1">₹{item.rate}</Text>
                                        </View>
                                        <View className="flex-row gap-2">
                                            <TouchableOpacity 
                                                onPress={() => handleOpenPricingModal(item)}
                                                className="w-12 h-12 bg-slate-50 rounded-xl items-center justify-center border border-slate-200 shadow-sm active:scale-95"
                                            >
                                                <Ionicons name="pencil" size={18} color="#475569" />
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                onPress={() => handleDeletePricing(item._id)}
                                                className="w-12 h-12 bg-rose-50 rounded-xl items-center justify-center border border-rose-200 shadow-sm active:scale-95"
                                            >
                                                <Ionicons name="trash" size={18} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                    <View className="h-10" />
                </ScrollView>
            </SafeAreaView>

            {/* Passenger Review Modal */}
            <Modal visible={!!selectedRequest} animationType="slide" transparent={false}>
                <SafeAreaView className="flex-1 bg-white">
                    <View className="px-5 py-5 flex-row justify-between items-center border-b border-slate-100 shadow-sm">
                        <View>
                            <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">Review Request</Text>
                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedRequest?.receiptNumber}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedRequest(null)} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm">
                            <Ionicons name="close" size={22} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {selectedRequest && (
                        <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
                            {/* Alert for Urgent */}
                            {selectedRequest.isUrgent && (
                                <View className="bg-orange-50 p-4 rounded-2xl border border-orange-200 mb-6 flex-row items-center gap-3">
                                    <Ionicons name="flash" size={24} color="#f97316" />
                                    <View className="flex-1">
                                        <Text className="font-black text-orange-700 text-sm">URGENT APPLICATION</Text>
                                        <Text className="text-orange-600 font-bold text-xs">Customer requires processing within 15 mins.</Text>
                                    </View>
                                </View>
                            )}

                            {/* Fee Breakdown */}
                            <View className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-900/30 mb-8 border border-slate-800">
                                <Text className="text-white/60 font-black text-[10px] uppercase tracking-widest mb-4">Fee Breakdown</Text>
                                <View className="space-y-3">
                                    <View className="flex-row justify-between">
                                        <Text className="text-white/80 font-bold text-xs">Base Fee ({selectedRequest.airline})</Text>
                                        <Text className="text-white font-black text-sm">₹{selectedRequest.fees.airlineFee?.toFixed(2)}</Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-white/80 font-bold text-xs">Regional Surcharge</Text>
                                        <Text className="text-white font-black text-sm">₹{selectedRequest.fees.surcharge?.toFixed(2)}</Text>
                                    </View>
                                    {selectedRequest.isUrgent && (
                                        <View className="flex-row justify-between">
                                            <Text className="text-orange-400 font-bold text-xs">Urgent Processing</Text>
                                            <Text className="text-orange-400 font-black text-sm">₹{selectedRequest.fees.urgentSurcharge?.toFixed(2)}</Text>
                                        </View>
                                    )}
                                    <View className="flex-row justify-between pb-3 border-b border-white/10">
                                        <Text className="text-white/80 font-bold text-xs">IGST (18%)</Text>
                                        <Text className="text-white font-black text-sm">₹{selectedRequest.fees.igst?.toFixed(2)}</Text>
                                    </View>
                                    <View className="flex-row justify-between pt-1">
                                        <Text className="text-white font-black text-sm uppercase tracking-wider">Total Amount</Text>
                                        <Text className="text-[#48A0D4] font-black text-2xl tracking-tight">₹{selectedRequest.fees.totalFare?.toFixed(2)}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Documents */}
                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Passenger Documents</Text>
                            <View className="flex-row flex-wrap justify-between mb-8">
                                {Object.keys(selectedRequest.documents || {}).length === 0 ? (
                                    <View className="w-full bg-rose-50 p-4 rounded-2xl border border-rose-100">
                                        <Text className="text-rose-600 font-bold text-xs text-center">No documents uploaded.</Text>
                                    </View>
                                ) : (
                                    Object.entries(selectedRequest.documents).map(([key, value]) => {
                                        const fileName = value.split('/').pop() || `${key}.pdf`;
                                        return (
                                            <TouchableOpacity 
                                                key={key} 
                                                onPress={() => openDocument(value)}
                                                className="w-[48%] bg-slate-50 p-4 rounded-2xl border border-slate-200 border-b-[4px] shadow-sm mb-4 active:scale-95"
                                            >
                                                <Ionicons name="document-text" size={24} color="#64748b" className="mb-2" />
                                                <Text className="font-black text-[9px] text-slate-500 uppercase tracking-widest mb-1" numberOfLines={1}>{key.replace(/([A-Z])/g, ' $1')}</Text>
                                                <Text className="font-bold text-slate-900 text-[10px]" numberOfLines={1}>{fileName}</Text>
                                            </TouchableOpacity>
                                        )
                                    })
                                )}
                            </View>

                            {/* Status Update */}
                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Update Processing</Text>
                            <View className="space-y-4 mb-10">
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                                    {['PENDING', 'PROCESSING', 'APPROVED', 'REJECTED'].map(s => (
                                        <TouchableOpacity 
                                            key={s} onPress={() => setNewStatus(s)}
                                            className={`px-5 py-3.5 rounded-xl mr-2 border-b-4 active:scale-95 shadow-sm ${
                                                newStatus === s ? 
                                                    (s === 'APPROVED' ? 'bg-emerald-600 border-emerald-700' : 
                                                    s === 'REJECTED' ? 'bg-rose-600 border-rose-700' : 'bg-blue-600 border-blue-700') 
                                                : 'bg-white border-slate-100 border-b-slate-200'
                                            }`}
                                        >
                                            <Text className={`font-black text-[10px] uppercase tracking-widest ${newStatus === s ? 'text-white' : 'text-slate-400'}`}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Admin Remarks / Notes</Text>
                                    <TextInput 
                                        value={adminNotes} onChangeText={setAdminNotes}
                                        multiline placeholderTextColor="#9ca3af" placeholder="Notes for the customer..."
                                        className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-sm h-32 shadow-inner"
                                    />
                                </View>
                            </View>
                            
                            <TouchableOpacity 
                                onPress={handleUpdateStatus} disabled={updating}
                                className="bg-[#1D4171] py-5 rounded-2xl items-center border border-[#1D4171] border-b-[6px] border-b-[#0f2342] shadow-xl shadow-blue-900/30 active:scale-95 mb-10"
                            >
                                <Text className="text-white font-black text-xs uppercase tracking-widest">{updating ? 'Syncing...' : 'Update & Notify'}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </SafeAreaView>
            </Modal>

            {/* Pricing Modal */}
            <Modal visible={showPricingModal} animationType="fade" transparent={true}>
                <View className="flex-1 justify-center bg-black/60 p-5">
                    <View style={{ backgroundColor: t.card, elevation: 24 }} className="rounded-3xl border border-slate-100 shadow-2xl p-7 bg-white">
                        <View className="flex-row justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">{editingPricing ? 'Edit Pricing' : 'Add Airline'}</Text>
                            <TouchableOpacity onPress={() => setShowPricingModal(false)} className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 active:scale-95 shadow-sm">
                                <Ionicons name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-5">
                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Airline Name *</Text>
                                <TextInput 
                                    value={pricingFormData.airline} onChangeText={t => setPricingFormData({...pricingFormData, airline: t})}
                                    placeholderTextColor="#9ca3af" placeholder="e.g. SpiceJet"
                                    className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-base shadow-inner"
                                />
                            </View>
                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Base Rate (₹) *</Text>
                                <TextInput 
                                    value={pricingFormData.rate} onChangeText={t => setPricingFormData({...pricingFormData, rate: t})}
                                    keyboardType="numeric" placeholderTextColor="#9ca3af" placeholder="650"
                                    className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-base shadow-inner"
                                />
                            </View>
                            <View className="flex-row items-center justify-between bg-slate-50 p-5 rounded-2xl border border-slate-100 mt-2 shadow-sm">
                                <View>
                                    <Text className="font-black text-slate-800 text-sm tracking-wide mb-0.5">Active</Text>
                                    <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Visible to agents</Text>
                                </View>
                                <Switch 
                                    value={pricingFormData.isActive} onValueChange={v => setPricingFormData({...pricingFormData, isActive: v})}
                                    trackColor={{ false: "#cbd5e1", true: "#48A0D4" }} thumbColor="#FFF"
                                />
                            </View>
                        </View>

                        <TouchableOpacity 
                            onPress={handleSavePricing} disabled={updating}
                            className="bg-slate-900 py-4 rounded-2xl items-center border border-slate-900 border-b-4 border-b-slate-950 shadow-xl shadow-slate-900/30 active:scale-95 mt-8"
                        >
                            <Text className="text-white font-black text-xs uppercase tracking-widest">{updating ? 'Saving...' : 'Save Pricing'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
