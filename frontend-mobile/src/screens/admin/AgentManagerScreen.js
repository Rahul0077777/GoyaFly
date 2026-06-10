import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, ScrollView, Alert, Image } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminService, BASE_URL } from '../../services/api';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';
import { Ionicons } from '@expo/vector-icons';

export default function AgentManagerScreen({ navigation }) {
    const t = useThemeColors();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [search, setSearch] = useState('');
    
    // Wallet Adjustment State
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [adjAmount, setAdjAmount] = useState('');
    const [adjType, setAdjType] = useState('CREDIT');
    const [adjRemark, setAdjRemark] = useState('');
    const [adjLoading, setAdjLoading] = useState(false);

    // KYC Review State
    const [showKycModal, setShowKycModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [kycLoading, setKycLoading] = useState(false);

    const fetchAgents = useCallback(async (pageNum = 1, isRefresh = false) => {
        try {
            const token = await AsyncStorage.getItem('adminToken');
            if (!token) return;

            if (pageNum === 1 && !isRefresh) setLoading(true);
            const res = await adminService.getAgents(pageNum, 15, search);
            if (res.success) {
                if (pageNum === 1) setAgents(res.data);
                else setAgents(prev => [...prev, ...res.data]);
                setHasMore(res.pagination.page < res.pagination.pages);
            }
        } catch (error) { console.error(error); }
        finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
    }, [search]);

    useEffect(() => {
        const delay = setTimeout(() => { setPage(1); fetchAgents(1, false); }, 500);
        return () => clearTimeout(delay);
    }, [search, fetchAgents]);

    const handleWalletAdjustment = async () => {
        if (!adjAmount || isNaN(adjAmount)) return Toast.show({ type: 'error', text1: 'Invalid', text2: 'Enter valid amount.' });
        setAdjLoading(true);
        try {
            const res = await adminService.adjustAgentWallet(selectedAgent._id, Number(adjAmount), adjType, adjRemark);
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: `Wallet updated. New Balance: ₹${res.data.balance.toLocaleString()}` });
                setShowWalletModal(false);
                setAdjAmount('');
                setAdjRemark('');
                handleRefresh();
            }
        } catch (e) { Toast.show({ type: 'error', text1: 'Error', text2: 'Adjustment failed.' }); }
        finally { setAdjLoading(false); }
    };

    const handleRefresh = () => { setRefreshing(true); setPage(1); fetchAgents(1, true); };
    const handleLoadMore = () => {
        if (!loadingMore && hasMore) { setLoadingMore(true); const np = page + 1; setPage(np); fetchAgents(np, false); }
    };

    const handleKycDecision = async (status) => {
        if (status === 'REJECTED' && !rejectReason) {
            return Toast.show({ type: 'error', text1: 'Error', text2: 'Please provide a reason for rejection.' });
        }
        Alert.alert(
            status === 'APPROVED' ? 'Approve Agent?' : 'Reject Agent?',
            `Are you sure you want to ${status.toLowerCase()} this agent?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm', onPress: async () => {
                        setKycLoading(true);
                        try {
                            const res = await adminService.updateKyc(selectedAgent._id, { status, reason: rejectReason });
                            if (res.success) {
                                Toast.show({ type: 'success', text1: 'Success', text2: res.message || `Agent KYC ${status.toLowerCase()}!` });
                                setShowKycModal(false);
                                setRejectReason('');
                                handleRefresh();
                            } else {
                                Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Failed to update agent KYC.' });
                            }
                        } catch { Toast.show({ type: 'error', text1: 'Error', text2: 'KYC update failed.' }); }
                        finally { setKycLoading(false); }
                    }
                }
            ]
        );
    };
    const handleToggleBlock = async (agent) => {
        const action = agent.isBlocked ? 'unblock' : 'block';
        Alert.alert(`${action.charAt(0).toUpperCase() + action.slice(1)} Agent`, `Are you sure you want to ${action} this partner?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: action.charAt(0).toUpperCase() + action.slice(1), style: agent.isBlocked ? 'default' : 'destructive', onPress: async () => {
                    try {
                        const res = await adminService.toggleBlockAgent(agent._id);
                        if (res.success) { 
                            Toast.show({ type: 'success', text1: 'Success', text2: res.message }); 
                            handleRefresh(); 
                        }
                        else Toast.show({ type: 'error', text1: 'Error', text2: res.message || `Failed to ${action} agent.` });
                    } catch { Toast.show({ type: 'error', text1: 'Error', text2: `${action.charAt(0).toUpperCase() + action.slice(1)} failed.` }); }
                }
            }
        ]);
    };

    const renderAgentItem = ({ item }) => (
        <View style={{ backgroundColor: t.card, elevation: 8 }}
            className="mx-4 mb-6 rounded-3xl border border-slate-100 border-b-[6px] border-slate-200 shadow-xl shadow-slate-300/40 overflow-hidden">
            
            {/* Top row: Identity */}
            <View className="p-5 flex-row items-center border-b border-slate-100">
                <View className="w-16 h-16 bg-slate-900 rounded-2xl items-center justify-center mr-4 border border-slate-800 shadow-sm">
                    <Text className="text-white font-black text-3xl tracking-wider">{item.agentName?.charAt(0) || 'A'}</Text>
                    {item.isBlocked && (
                        <View className="absolute -top-2 -right-2 bg-rose-500 w-6 h-6 rounded-full items-center justify-center border-2 border-white">
                            <Ionicons name="lock-closed" size={12} color="#fff" />
                        </View>
                    )}
                </View>
                <View className="flex-1">
                    <View className="flex-row items-center flex-wrap gap-2 mb-1.5">
                        <Text style={{ color: t.text }} className="font-black text-lg tracking-wide" numberOfLines={1}>{item.agentName}</Text>
                        <View className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            <Text className="text-slate-600 text-[9px] font-black tracking-widest">{item.agentCode || 'PENDING'}</Text>
                        </View>
                    </View>
                    <Text style={{ color: t.textMuted }} className="text-[11px] font-bold uppercase tracking-wider mb-0.5" numberOfLines={1}>{item.agencyName}</Text>
                    <Text style={{ color: t.textMuted }} className="text-[10px] font-semibold" numberOfLines={1}>{item.emailAddress}</Text>
                </View>
            </View>

            {/* Middle row: Stats & Badges */}
            <View className="px-5 py-4 flex-row items-center justify-between bg-slate-50 border-b border-slate-100">
                <View>
                    <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase tracking-widest mb-1">Wallet Balance</Text>
                    <Text style={{ color: t.text }} className="font-black text-xl tracking-tight">₹{item.walletBalance?.toLocaleString() ?? '0'}</Text>
                </View>
                <View className="items-end gap-1.5">
                    <View className={`px-3 py-1.5 rounded-xl border flex-row items-center shadow-sm ${item.isKycVerified ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                        <Ionicons name={item.isKycVerified ? "checkmark-circle" : "time"} size={12} color={item.isKycVerified ? "#10b981" : "#f59e0b"} className="mr-1.5" />
                        <Text className={`text-[9px] font-black uppercase tracking-widest ${item.isKycVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {item.isKycVerified ? 'KYC Verified' : 'KYC Pending'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Bottom action grid */}
            <View className="px-3 py-3 flex-row flex-wrap justify-center bg-white gap-2">
                {!item.isKycVerified && (
                    <TouchableOpacity onPress={() => { setSelectedAgent(item); setShowKycModal(true); setRejectReason(''); }}
                        className="flex-1 min-w-[45%] bg-emerald-600 p-3 rounded-xl border-b-4 border-emerald-800 active:scale-95 shadow-sm flex-row items-center justify-center gap-2">
                        <Ionicons name="document-text" size={16} color="#fff" />
                        <Text className="text-white font-black text-[10px] uppercase tracking-wider">Review KYC</Text>
                    </TouchableOpacity>
                )}
                
                <TouchableOpacity onPress={() => { setSelectedAgent(item); setShowWalletModal(true); }}
                    className="flex-1 min-w-[45%] bg-purple-600 p-3 rounded-xl border-b-4 border-purple-800 active:scale-95 shadow-sm flex-row items-center justify-center gap-2">
                    <Ionicons name="wallet" size={16} color="#fff" />
                    <Text className="text-white font-black text-[10px] uppercase tracking-wider">Adjust Wallet</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('AgentEditor', { agent: item })}
                    className="flex-1 min-w-[45%] bg-slate-100 p-3 rounded-xl border border-slate-200 border-b-4 border-b-slate-300 active:scale-95 shadow-sm flex-row items-center justify-center gap-2">
                    <Ionicons name="settings" size={16} color="#475569" />
                    <Text className="text-slate-700 font-black text-[10px] uppercase tracking-wider">Edit Partner</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleToggleBlock(item)}
                    className={`flex-1 min-w-[45%] p-3 rounded-xl border border-b-4 active:scale-95 shadow-sm flex-row items-center justify-center gap-2 ${item.isBlocked ? 'bg-emerald-50 border-emerald-200 border-b-emerald-300' : 'bg-rose-50 border-rose-200 border-b-rose-300'}`}>
                    <Ionicons name={item.isBlocked ? 'lock-open' : 'lock-closed'} size={16} color={item.isBlocked ? '#10b981' : '#ef4444'} />
                    <Text className={`font-black text-[10px] uppercase tracking-wider ${item.isBlocked ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {item.isBlocked ? 'Unblock' : 'Block'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-5 py-5 flex-row items-center justify-between border-b border-slate-100 mb-2">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm mr-3.5">
                            <Ionicons name="arrow-back" size={22} color="#0f172a" />
                        </TouchableOpacity>
                        <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center border border-blue-100 shadow-sm mr-3.5">
                            <Ionicons name="people" size={24} color="#1D4171" />
                        </View>
                        <View>
                            <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">Agent Manager</Text>
                            <Text style={{ color: t.textMuted }} className="font-black uppercase text-[10px] tracking-widest mt-0.5">Verification hub</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('AgentEditor')}
                        className="bg-slate-900 w-12 h-12 rounded-2xl items-center justify-center border border-slate-800 border-b-4 border-slate-950 active:scale-95 shadow-lg shadow-slate-900/30">
                        <Ionicons name="add" size={26} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View className="px-5 pb-5">
                    <View className="flex-row items-center bg-white px-5 py-4 rounded-2xl border border-slate-100 border-b-4 border-slate-200 shadow-sm">
                        <Ionicons name="search" size={20} color="#64748b" className="mr-3" />
                        <TextInput className="flex-1 text-slate-800 font-black text-sm" placeholder="Search agents..." placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} />
                    </View>
                </View>

                {loading && page === 1 ? (
                    <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#1D4171" /></View>
                ) : (
                    <FlatList
                        data={agents} renderItem={renderAgentItem} keyExtractor={item => item._id}
                        onRefresh={handleRefresh} refreshing={refreshing} onEndReached={handleLoadMore} onEndReachedThreshold={0.5}
                        ListFooterComponent={loadingMore ? <ActivityIndicator className="py-8" color="#F07E21" /> : <View className="h-10" />}
                        ListEmptyComponent={
                            <View className="py-20 items-center">
                                <Ionicons name="people-outline" size={64} color="#cbd5e1" className="mb-4" />
                                <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Agents Found</Text>
                                <Text style={{ color: t.textSecondary }} className="font-bold text-xs">Try a different search query.</Text>
                            </View>
                        }
                    />
                )}

                {/* Wallet Adjustment Modal */}
                <Modal visible={showWalletModal} transparent animationType="slide">
                    <View className="flex-1 bg-black/60 justify-end">
                        <View className="bg-white rounded-t-3xl p-8 pb-12 border-t border-slate-100 shadow-2xl" style={{ elevation: 24 }}>
                             <View className="flex-row justify-between items-center mb-8 border-b border-slate-100 pb-4">
                                <View>
                                    <Text className="text-2xl font-black text-[#1D4171] tracking-wide">Wallet Control</Text>
                                    <Text className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{selectedAgent?.agentName}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowWalletModal(false)} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm">
                                    <Ionicons name="close" size={22} color="#64748b" />
                                </TouchableOpacity>
                             </View>

                             <View className="flex-row gap-4 mb-6">
                                {['CREDIT', 'DEBIT'].map(type => (
                                    <TouchableOpacity key={type} onPress={() => setAdjType(type)} 
                                        className={`flex-1 py-4 rounded-2xl border border-b-4 items-center active:scale-95 shadow-sm ${adjType === type ? (type === 'CREDIT' ? 'bg-emerald-600 border-emerald-600 border-b-emerald-800 shadow-emerald-700/30' : 'bg-rose-600 border-rose-600 border-b-rose-800 shadow-rose-700/30') : 'border-slate-100 border-b-slate-200 bg-slate-50' }`}>
                                        <Text className={`font-black text-xs uppercase tracking-wider ${adjType === type ? 'text-white' : 'text-slate-400'}`}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                             </View>

                             <View className="mb-6">
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Amount (INR)</Text>
                                <TextInput 
                                    keyboardType="numeric" placeholder="0.00" value={adjAmount} onChangeText={setAdjAmount}
                                    placeholderTextColor="#9ca3af"
                                    className="bg-slate-50 rounded-2xl px-6 py-5 font-black text-2xl text-slate-900 border border-slate-100 shadow-inner"
                                />
                             </View>

                             <View className="mb-8">
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Transaction Remark</Text>
                                <TextInput 
                                    placeholder="Enter reason for adjustment..." value={adjRemark} onChangeText={setAdjRemark}
                                    placeholderTextColor="#9ca3af"
                                    className="bg-slate-50 rounded-2xl px-6 py-5 font-black text-sm text-slate-800 border border-slate-100 shadow-inner"
                                />
                             </View>

                             <TouchableOpacity 
                                onPress={handleWalletAdjustment} disabled={adjLoading}
                                className={`py-6 rounded-2xl items-center border border-b-[6px] active:scale-95 shadow-xl ${adjType === 'CREDIT' ? 'bg-emerald-600 border-emerald-600 border-b-emerald-800 shadow-emerald-700/30' : 'bg-rose-600 border-rose-600 border-b-rose-800 shadow-rose-700/30'}`}
                             >
                                {adjLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black uppercase text-sm tracking-widest">{adjType} WALLET NOW</Text>}
                             </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* KYC Review Modal */}
                <Modal visible={showKycModal} transparent animationType="slide">
                    <View className="flex-1 bg-black/80 justify-center items-center px-4">
                        <View className="bg-white rounded-3xl w-full max-h-[90%] overflow-hidden">
                            <View className="p-6 border-b border-slate-100 flex-row justify-between items-center bg-slate-50">
                                <View className="flex-1">
                                    <Text className="text-xl font-black text-slate-900 tracking-wide uppercase italic">Review Documents</Text>
                                    <Text className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">{selectedAgent?.agentName}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowKycModal(false)} className="w-10 h-10 bg-white rounded-xl items-center justify-center border border-slate-100 shadow-sm ml-2">
                                    <Ionicons name="close" size={20} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView className="p-6 bg-slate-50 flex-1">
                                <View className="mb-6 space-y-3">
                                    <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest">1. Aadhar Front</Text>
                                    <View className="w-full aspect-video bg-white rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm">
                                        {selectedAgent?.kycDocuments?.aadharFront ? (
                                            <Image source={{ uri: `${BASE_URL}${selectedAgent.kycDocuments.aadharFront}` }} className="w-full h-full" resizeMode="contain" />
                                        ) : <View className="flex-1 items-center justify-center"><Text className="text-slate-400 font-bold">No Document</Text></View>}
                                    </View>
                                </View>
                                <View className="mb-6 space-y-3">
                                    <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest">2. Aadhar Back</Text>
                                    <View className="w-full aspect-video bg-white rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm">
                                        {selectedAgent?.kycDocuments?.aadharBack ? (
                                            <Image source={{ uri: `${BASE_URL}${selectedAgent.kycDocuments.aadharBack}` }} className="w-full h-full" resizeMode="contain" />
                                        ) : <View className="flex-1 items-center justify-center"><Text className="text-slate-400 font-bold">No Document</Text></View>}
                                    </View>
                                </View>
                                <View className="mb-6 space-y-3">
                                    <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest">3. PAN Card</Text>
                                    <View className="w-full aspect-video bg-white rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm">
                                        {selectedAgent?.kycDocuments?.panCard ? (
                                            <Image source={{ uri: `${BASE_URL}${selectedAgent.kycDocuments.panCard}` }} className="w-full h-full" resizeMode="contain" />
                                        ) : <View className="flex-1 items-center justify-center"><Text className="text-slate-400 font-bold">No Document</Text></View>}
                                    </View>
                                </View>
                                <View className="mb-6 space-y-3">
                                    <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest">4. {selectedAgent?.kycDocuments?.shopDoc?.category || 'Business Proof'}</Text>
                                    <View className="w-full aspect-video bg-white rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm">
                                        {selectedAgent?.kycDocuments?.shopDoc?.url ? (
                                            <Image source={{ uri: `${BASE_URL}${selectedAgent.kycDocuments.shopDoc.url}` }} className="w-full h-full" resizeMode="contain" />
                                        ) : <View className="flex-1 items-center justify-center"><Text className="text-slate-400 font-bold">No Document</Text></View>}
                                    </View>
                                </View>
                            </ScrollView>
                            <View className="p-6 border-t border-slate-100 bg-white">
                                {selectedAgent?.kycStatus === 'APPROVED' ? (
                                    <Text className="text-center font-black text-emerald-500 uppercase tracking-widest">✓ Verified & Approved</Text>
                                ) : (
                                    <View>
                                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Rejection Reason</Text>
                                        <TextInput 
                                            value={rejectReason} onChangeText={setRejectReason} placeholder="Required if rejecting..." placeholderTextColor="#9ca3af"
                                            className="bg-slate-50 p-4 rounded-xl border border-slate-200 focus:border-rose-500 mb-4 h-20 text-slate-800 font-bold shadow-inner" multiline
                                        />
                                        <View className="flex-row gap-4">
                                            <TouchableOpacity 
                                                onPress={() => handleKycDecision('REJECTED')} disabled={kycLoading}
                                                className="flex-1 py-4 bg-rose-50 rounded-xl items-center border border-rose-200 border-b-4 border-b-rose-300 active:scale-95">
                                                <Text className="text-rose-600 font-black text-[10px] uppercase tracking-widest">Reject</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                onPress={() => handleKycDecision('APPROVED')} disabled={kycLoading}
                                                className="flex-[2] py-4 bg-emerald-500 rounded-xl items-center border border-emerald-600 border-b-4 border-b-emerald-700 active:scale-95 shadow-lg shadow-emerald-500/30">
                                                {kycLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-black text-[11px] uppercase tracking-widest">Approve & Verify</Text>}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}
