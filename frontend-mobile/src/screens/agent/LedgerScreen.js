import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { walletService } from '../../services/api';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';

export default function LedgerScreen({ navigation }) {
    const t = useThemeColors();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await walletService.getLedger();
                if (res.success) setTransactions(res.data);
            } catch (err) {
                console.error('Failed to fetch ledger', err);
            } finally { setLoading(false); }
        };
        fetchTransactions();
    }, []);

    const filteredTransactions = transactions; // Logic for tabs could be added here

    return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Simplified Header */}
                <View className="px-6 pt-6 pb-4 flex-row items-center">
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        className="w-11 h-11 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 shadow-sm mr-4 active:scale-95"
                    >
                        <Ionicons name="chevron-back" size={22} color="#1D4171" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-slate-400 text-[10px] font-black uppercase mb-0.5">Audit Trail</Text>
                        <Text className="text-2xl font-black text-slate-900">Account <Text className="text-[#1D4171]">Ledger</Text></Text>
                    </View>
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    
                    {/* Simplified Balance View */}
                    <View className="px-6 mt-4 mb-8">
                        <View className="bg-white p-8 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40" style={{ elevation: 8 }}>
                            <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Current Ledger Balance</Text>
                            <Text className="text-4xl font-black text-slate-900">
                                ₹{transactions[0]?.balanceAfter?.toLocaleString() || '0.00'}
                            </Text>
                        </View>
                    </View>

                    {/* Filter Tabs - Minimal */}
                    <View className="px-6 mb-8 flex-row gap-3">
                        {['All', 'Credits', 'Debits'].map((tab) => (
                            <TouchableOpacity 
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                className={`px-5 py-2.5 rounded-full border active:scale-95 ${activeTab === tab ? 'bg-[#1D4171] border-[#1D4171] border-b-4 border-[#11294a] shadow-md shadow-blue-900/20' : 'bg-white border-slate-100 border-b-4 border-slate-200 shadow-sm'}`}
                            >
                                <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === tab ? 'text-white' : 'text-slate-400'}`}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Transaction List - Simplified */}
                    <View className="px-6 mb-12">
                        <View className="bg-white rounded-[2.5rem] p-6 border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40" style={{ elevation: 8 }}>
                            {loading ? (
                                <ActivityIndicator size="large" color="#1D4171" className="py-10" />
                            ) : transactions.length === 0 ? (
                                <View className="py-10 items-center">
                                    <Ionicons name="journal-outline" size={40} color="#e2e8f0" />
                                    <Text className="mt-4 font-black text-slate-300 uppercase text-[10px]">No transaction history</Text>
                                </View>
                            ) : (
                                transactions.map((t, index) => (
                                    <View key={t._id} className={`py-5 flex-row items-center justify-between ${index !== transactions.length - 1 ? 'border-b border-slate-50' : ''}`}>
                                        <View className="flex-row items-center flex-1">
                                            <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${t.amount < 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                                                <Ionicons name={t.amount < 0 ? 'arrow-down' : 'arrow-up'} size={18} color={t.amount < 0 ? '#ef4444' : '#10b981'} />
                                            </View>
                                            <View className="flex-1 pr-2">
                                                <Text className="font-black text-sm text-slate-800" numberOfLines={1}>{t.description}</Text>
                                                <Text className="text-[9px] font-bold text-slate-400 uppercase">{new Date(t.createdAt).toLocaleDateString()} • {t.type}</Text>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <Text className={`font-black text-sm ${t.amount < 0 ? 'text-slate-800' : 'text-green-600'}`}>
                                                {t.amount < 0 ? '-' : '+'} ₹{Math.abs(t.amount).toLocaleString()}
                                            </Text>
                                            <Text className="text-[8px] font-black text-slate-300 mt-1 uppercase">Bal: ₹{t.balanceAfter?.toLocaleString()}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>

                    <View className="h-10" />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
