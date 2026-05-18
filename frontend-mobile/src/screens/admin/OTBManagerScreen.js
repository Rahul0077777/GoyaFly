import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function OTBManagerScreen({ navigation }) {
    const t = useThemeColors();
    const [activeTab, setActiveTab] = useState('PASSENGER'); // PASSENGER, AGENT
    const [requests, setRequests] = useState([]);
    const [agentRequests, setAgentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleUpdateStatus = async (id, status) => {
        Alert.alert("Verify Action", `Are you sure you want to set this status to ${status}?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Confirm", onPress: async () => {
                setLoading(true);
                try {
                    const res = await adminService.updateOtbStatus(id, { status });
                    if (res.success) {
                        Toast.show({ type: 'success', text1: 'Success', text2: 'Status updated!' });
                        fetchData();
                    }
                } catch (err) {
                    Toast.show({ type: 'error', text1: 'Error', text2: 'Update failed.' });
                    setLoading(false);
                }
            }}
        ]);
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
                    <View className="bg-amber-50 w-12 h-12 rounded-2xl items-center justify-center border border-amber-100 shadow-sm mr-3.5">
                        <Ionicons name="shield-checkmark" size={24} color="#d97706" />
                    </View>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">OTB Control Center</Text>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Request Management</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View className="px-5 mb-2">
                    <View className="flex-row bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                        <TouchableOpacity 
                            onPress={() => setActiveTab('PASSENGER')}
                            className={`flex-1 py-3.5 items-center rounded-xl ${activeTab === 'PASSENGER' ? 'bg-white shadow-md border border-slate-100' : ''}`}
                        >
                            <Text className={`font-black text-xs uppercase tracking-wider ${activeTab === 'PASSENGER' ? 'text-slate-900' : 'text-slate-400'}`}>
                                Passengers ({requests.length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setActiveTab('AGENT')}
                            className={`flex-1 py-3.5 items-center rounded-xl ${activeTab === 'AGENT' ? 'bg-white shadow-md border border-slate-100' : ''}`}
                        >
                            <Text className={`font-black text-xs uppercase tracking-wider ${activeTab === 'AGENT' ? 'text-slate-900' : 'text-slate-400'}`}>
                                Agent Access ({agentRequests.length})
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView 
                    className="flex-1 px-5 pt-2"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F07E21" />}
                >
                    {activeTab === 'PASSENGER' ? (
                        requests.length === 0 ? (
                            <View className="py-24 items-center">
                                <Ionicons name="mail-open-outline" size={64} color="#cbd5e1" className="mb-4" />
                                <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Passenger Requests</Text>
                                <Text className="text-slate-400 font-bold text-xs">All OK to Board requests have been processed.</Text>
                            </View>
                        ) : (
                            requests.map(req => (
                                <View key={req._id} style={{ backgroundColor: t.card, elevation: 8 }} className="p-7 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 mb-6 shadow-2xl shadow-slate-300/40">
                                    <View className="flex-row justify-between items-start mb-6 pb-4 border-b border-slate-100">
                                        <View className="bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-100 shadow-sm">
                                            <Text className="text-[#1D4171] font-black text-[10px] uppercase tracking-widest">PNR: {req.travelDetails?.pnr}</Text>
                                        </View>
                                        <Text className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                                            req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                                            req.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                        }`}>{req.status}</Text>
                                    </View>
                                    
                                    <Text style={{ color: t.text }} className="text-xl font-black mb-1 tracking-wide">{req.airline}</Text>
                                    <Text className="text-slate-400 text-xs font-black uppercase mb-6 tracking-wide">
                                        {req.passengers?.[0]?.firstName} {req.passengers?.[0]?.lastName} {req.passengers?.length > 1 ? `+ ${req.passengers.length - 1} more` : ''}
                                    </Text>

                                    {req.status === 'PENDING' && (
                                        <View className="flex-row gap-3">
                                            <TouchableOpacity 
                                                onPress={() => handleUpdateStatus(req._id, 'APPROVED')}
                                                className="flex-1 bg-emerald-600 py-4 rounded-2xl items-center border border-emerald-600 border-b-4 border-b-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-95"
                                            >
                                                <Text className="text-white font-black text-xs uppercase tracking-widest">Approve</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                onPress={() => handleUpdateStatus(req._id, 'REJECTED')}
                                                className="flex-1 bg-rose-50 py-4 rounded-2xl items-center border border-rose-100 border-b-4 border-b-rose-200 shadow-sm active:scale-95"
                                            >
                                                <Text className="text-rose-600 font-black text-xs uppercase tracking-widest">Reject</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            ))
                        )
                    ) : (
                        agentRequests.length === 0 ? (
                            <View className="py-24 items-center">
                                <Ionicons name="shield-checkmark-outline" size={64} color="#cbd5e1" className="mb-4" />
                                <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Pending Agent Requests</Text>
                                <Text className="text-slate-400 font-bold text-xs">Agent OTB access requests are fully up to date.</Text>
                            </View>
                        ) : (
                            agentRequests.map(agent => (
                                <View key={agent._id} style={{ backgroundColor: t.card, elevation: 8 }} className="p-7 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 mb-6 shadow-2xl shadow-slate-300/40">
                                    <View className="flex-row items-center mb-6 pb-4 border-b border-slate-100">
                                        <View className="w-14 h-14 bg-[#1D4171] rounded-2xl items-center justify-center mr-4 border border-blue-900 shadow-md">
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
                                            <Text className="text-white font-black text-xs uppercase tracking-widest">Activate</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            onPress={() => handleApproveAgent(agent._id, 'REJECTED')}
                                            className="flex-1 bg-rose-50 py-4 rounded-2xl items-center border border-rose-100 border-b-4 border-b-rose-200 shadow-sm active:scale-95"
                                        >
                                            <Text className="text-rose-600 font-black text-xs uppercase tracking-widest">Reject</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )
                    )}
                    <View className="h-10" />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
