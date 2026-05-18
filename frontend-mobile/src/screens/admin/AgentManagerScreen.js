import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, ScrollView, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminService } from '../../services/api';
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

    const handleKycApprove = async (agentId) => {
        Alert.alert('Approve KYC?', 'Grant this agent full access?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Approve', onPress: async () => {
                    try {
                        const res = await adminService.updateKyc(agentId);
                        if (res.success) { Toast.show({ type: 'success', text1: 'Success', text2: 'Agent KYC approved!' }); handleRefresh(); }
                        else Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Failed to approve agent.' });
                    } catch { Toast.show({ type: 'error', text1: 'Error', text2: 'KYC approval failed.' }); }
                }
            }
        ]);
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
            className="mx-5 mb-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 overflow-hidden">
            {/* Top row */}
            <View className="p-6 flex-row items-center border-b border-slate-100">
                <View className="w-14 h-14 bg-[#1D4171] rounded-2xl items-center justify-center mr-4 border border-blue-900 shadow-sm">
                    <Text className="text-white font-black text-2xl tracking-wider">{item.agentName?.charAt(0) || 'A'}</Text>
                </View>
                <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-2 mb-1">
                        <Text style={{ color: t.text }} className="font-black text-lg tracking-wide" numberOfLines={1}>{item.agentName}</Text>
                        <View className="bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 shadow-sm">
                            <Text className="text-white text-[9px] font-black tracking-widest">{item.agentCode || 'PENDING'}</Text>
                        </View>
                    </View>
                    <Text style={{ color: t.textMuted }} className="text-[10px] font-bold uppercase tracking-wider">{item.agencyName} • {item.emailAddress}</Text>
                </View>
                <View className="items-end">
                    <Text style={{ color: t.text }} className="font-black text-xl tracking-tight">₹{item.walletBalance?.toLocaleString() ?? '0'}</Text>
                    <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest mt-0.5">Wallet</Text>
                </View>
            </View>

            {/* Bottom action row */}
            <View style={{ backgroundColor: t.isDark ? '#0f172a' : '#f8fafc' }}
                className="px-6 py-4 flex-row justify-between items-center">
                <View className="flex-row items-center bg-white px-3.5 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                    <View style={{ backgroundColor: item.isKycVerified ? '#10b981' : '#f59e0b' }} className="w-2 h-2 rounded-full mr-2" />
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${item.isKycVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {item.isKycVerified ? 'KYC Verified' : 'KYC Pending'}
                    </Text>
                </View>
                <View className="flex-row items-center gap-2.5">
                    {!item.isKycVerified
                        ? <TouchableOpacity onPress={() => handleKycApprove(item._id)}
                            className="bg-emerald-600 px-4 py-2.5 rounded-xl border-b-4 border-emerald-800 active:scale-95 shadow-sm">
                            <Text className="text-white font-black text-[10px] uppercase tracking-wider">Approve KYC</Text>
                        </TouchableOpacity>
                        : <View className="bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 shadow-sm">
                            <Text className="text-emerald-800 font-black text-[10px] uppercase tracking-wider">✓ Approved</Text>
                        </View>
                    }
                    <TouchableOpacity onPress={() => { setSelectedAgent(item); setShowWalletModal(true); }}
                        className="bg-purple-600 px-4 py-2.5 rounded-xl border-b-4 border-purple-800 active:scale-95 shadow-sm">
                        <Text className="text-white font-black text-[10px] uppercase tracking-wider">Adjust Wallet</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('AgentEditor', { agent: item })}
                        className="bg-white p-2.5 rounded-xl border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm items-center justify-center">
                        <Ionicons name="settings" size={18} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleToggleBlock(item)}
                        className={`p-2.5 rounded-xl border border-b-4 active:scale-95 shadow-sm items-center justify-center ${item.isBlocked ? 'bg-emerald-50 border-emerald-200 border-b-emerald-300' : 'bg-rose-50 border-rose-200 border-b-rose-300'}`}>
                        <Ionicons name={item.isBlocked ? 'lock-open' : 'lock-closed'} size={18} color={item.isBlocked ? '#10b981' : '#ef4444'} />
                    </TouchableOpacity>
                </View>
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
                        <View className="bg-white rounded-t-[3rem] p-8 pb-12 border-t border-slate-100 shadow-2xl" style={{ elevation: 24 }}>
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
            </SafeAreaView>
        </View>
    );
}
