import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Dimensions } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { walletService } from '../../services/api';
import RazorpayGatewayModal from '../../components/RazorpayGatewayModal';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function WalletScreen({ navigation }) {
    const t = useThemeColors();
    const [balance, setBalance] = useState(0);
    const [fdBalance, setFdBalance] = useState(0);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRecharge, setShowRecharge] = useState(false);
    const [amount, setAmount] = useState('5000');
    const [stats, setStats] = useState({ totalSpent: 0, totalCredits: 0 });
    const [showGateway, setShowGateway] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [razorpayKey, setRazorpayKey] = useState(null);
    const [walletType, setWalletType] = useState('MAIN');

    useEffect(() => { loadWalletData(); }, []);

    const loadWalletData = async () => {
        try {
            const balRes = await walletService.getBalance();
            if (balRes?.success) {
                setBalance(balRes.balance || 0);
                setFdBalance(balRes.fdBalance || 0);
            }
            const statsRes = await walletService.getStats();
            if (statsRes?.success) {
                setStats(statsRes.data || { totalSpent: 0, totalCredits: 0, avgBooking: 0, maxRecharge: 0 });
            }

            const histRes = await walletService.getHistory();
            if (histRes?.success) {
                // In mobile api.js, histRes.data is expected to contain either list or structure
                // Let's handle both array and object formats safely
                const txns = Array.isArray(histRes.data) ? histRes.data : (histRes.data?.transactions || []);
                setHistory(txns);
            }
        } catch (error) {
            console.error("Wallet Load Error", error);
        } finally { setLoading(false); }
    };

    const initiatePayment = async () => {
        if (!amount || isNaN(amount) || Number(amount) < 100) {
            return Toast.show({ type: 'info', text1: 'Minimum Amount', text2: 'Minimum recharge is ₹100.' });
        }
        setLoading(true);
        try {
            const res = await walletService.createOrder(Number(amount), 'Any');
            if (res.success && res.data) {
                setOrderId(res.data.id);
                setRazorpayKey(res.data.key || 'rzp_test_SUIH6k4l3JewbV');
                setShowRecharge(false);
                setShowGateway(true);
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to create payment order.' });
        } finally { setLoading(false); }
    };

    const handlePaymentSuccess = async (paymentData) => {
        setShowGateway(false);
        setLoading(true);
        try {
            const res = await walletService.rechargeWallet({
                amount: Number(amount),
                razorpay_order_id: paymentData.razorpay_order_id,
                razorpay_payment_id: paymentData.razorpay_payment_id,
                razorpay_signature: paymentData.razorpay_signature,
                walletType: walletType
            });
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: `₹${amount} added to your ${walletType === 'FIXED_DEPARTURE' ? 'FD' : 'Main'} wallet!` });
                loadWalletData();
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Payment captured but sync failed. Contact support.' });
        } finally { setLoading(false); }
    };

    if (loading && history.length === 0) {
        return (
            <View style={{ flex: 1, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1D4171" />
                <Text className="mt-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading Wallet...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Modern 3D Header */}
                <View className="px-5 pt-5 pb-4 flex-row items-center">
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 shadow-sm mr-4 active:scale-95"
                    >
                        <Ionicons name="chevron-back" size={22} color="#1D4171" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-slate-400 text-[10px] font-black uppercase mb-0.5 tracking-widest">Manage Funds</Text>
                        <Text className="text-2xl font-black text-slate-900">My <Text className="text-[#1D4171]">Wallet</Text></Text>
                    </View>
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    {/* Premium 3D Balance Cards Container */}
                    <View className="px-5 mt-2 mb-6 gap-4">
                        <LinearGradient 
                            colors={['#1D4171', '#15305B']} 
                            start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                            style={{ padding: 28, borderRadius: 36, shadowColor: '#1D4171', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 15 }}
                            className="rounded-[2.5rem] border border-blue-400/20 overflow-hidden"
                        >
                            <View className="flex-row justify-between items-start mb-6">
                                <View>
                                    <Text className="text-blue-200/60 text-[10px] font-black uppercase mb-1.5 tracking-widest">Main Wallet Balance</Text>
                                    <Text className="text-4xl font-black text-white mb-2">₹{balance.toLocaleString('en-IN')}</Text>
                                </View>
                                <View className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center border border-white/20 shadow-inner">
                                    <Ionicons name="wallet-outline" size={24} color="#fff" />
                                </View>
                            </View>
                            
                            <TouchableOpacity 
                                onPress={() => { setWalletType('MAIN'); setShowRecharge(true); }}
                                className="bg-white py-4 rounded-2xl items-center shadow-lg border border-b-4 border-slate-200 active:scale-95"
                            >
                                <Text className="text-[#1D4171] font-black text-xs uppercase tracking-wider">Add to Main Wallet</Text>
                            </TouchableOpacity>
                        </LinearGradient>

                        <LinearGradient 
                            colors={['#059669', '#047857']} 
                            start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                            style={{ padding: 28, borderRadius: 36, shadowColor: '#059669', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 15 }}
                            className="rounded-[2.5rem] border border-emerald-400/20 overflow-hidden"
                        >
                            <View className="flex-row justify-between items-start mb-6">
                                <View>
                                    <Text className="text-emerald-200/60 text-[10px] font-black uppercase mb-1.5 tracking-widest">FD Wallet Balance</Text>
                                    <Text className="text-4xl font-black text-white mb-2">₹{fdBalance.toLocaleString('en-IN')}</Text>
                                </View>
                                <View className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center border border-white/20 shadow-inner">
                                    <Ionicons name="airplane-outline" size={24} color="#fff" />
                                </View>
                            </View>
                            
                            <TouchableOpacity 
                                onPress={() => { setWalletType('FIXED_DEPARTURE'); setShowRecharge(true); }}
                                className="bg-white py-4 rounded-2xl items-center shadow-lg border border-b-4 border-slate-200 active:scale-95"
                            >
                                <Text className="text-[#059669] font-black text-xs uppercase tracking-wider">Add to FD Wallet</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>

                    {/* 3D Recharge Section */}
                    {showRecharge && (
                        <View className="mx-5 mb-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40" style={{ elevation: 8 }}>
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Recharge Amount (₹)</Text>
                                <Text className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${walletType === 'FIXED_DEPARTURE' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {walletType === 'FIXED_DEPARTURE' ? 'FD WALLET' : 'MAIN WALLET'}
                                </Text>
                            </View>
                            <View className="bg-slate-50 rounded-2xl p-4 flex-row items-center border border-slate-100 mb-6 shadow-inner">
                                <Text className="text-slate-400 text-2xl font-black mr-2">₹</Text>
                                <TextInput
                                    className="flex-1 font-black text-2xl text-slate-900"
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                    placeholder="5000"
                                />
                            </View>
                            <View className="flex-row flex-wrap gap-2 mb-6 justify-between">
                                {['1000', '5000', '10000'].map(amt => (
                                    <TouchableOpacity 
                                        key={amt} onPress={() => setAmount(amt)}
                                        className={`flex-1 py-3 rounded-xl border items-center active:scale-95 ${amount === amt ? 'bg-[#1D4171] border-[#1D4171] border-b-4 border-[#15305B]' : 'bg-white border-slate-100 border-b-4 border-slate-200'}`}
                                    >
                                        <Text className={`text-xs font-black tracking-wider ${amount === amt ? 'text-white' : 'text-slate-600'}`}>₹{amt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity onPress={initiatePayment} className="bg-[#10b981] py-5 rounded-2xl items-center border border-emerald-400 border-b-[6px] border-emerald-600 shadow-xl shadow-green-900/20 active:scale-95">
                                <Text className="text-white font-black text-xs uppercase tracking-wider">Pay Securely</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Stats Row - 3D Extruded Cards */}
                    <View className="px-5 mb-8 flex-row justify-between">
                        <View className="w-[48%] bg-white p-5 rounded-[2rem] border border-slate-100 border-b-[6px] border-slate-200 shadow-sm" style={{ elevation: 6 }}>
                            <View className="w-11 h-11 bg-red-50 rounded-2xl items-center justify-center mb-4 border border-red-100 shadow-sm">
                                <Ionicons name="arrow-down" size={20} color="#ef4444" />
                            </View>
                            <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Total Spent</Text>
                            <Text className="text-xl font-black text-slate-900">₹{stats.totalSpent.toLocaleString()}</Text>
                        </View>
                        <View className="w-[48%] bg-white p-5 rounded-[2rem] border border-slate-100 border-b-[6px] border-slate-200 shadow-sm" style={{ elevation: 6 }}>
                            <View className="w-11 h-11 bg-green-50 rounded-2xl items-center justify-center mb-4 border border-green-100 shadow-sm">
                                <Ionicons name="arrow-up" size={20} color="#10b981" />
                            </View>
                            <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Total Credits</Text>
                            <Text className="text-xl font-black text-slate-900">₹{stats.totalCredits.toLocaleString()}</Text>
                        </View>
                    </View>

                    {/* Transaction List - 3D Container */}
                    <View className="px-5 mb-12">
                        <Text className="text-slate-900 text-lg font-black mb-4 tracking-wide">Recent Transactions</Text>
                        <View className="bg-white rounded-[2.5rem] p-6 border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-4" style={{ elevation: 8 }}>
                            {history.length === 0 ? (
                                <View className="py-8 items-center">
                                    <Text className="text-4xl mb-2">💸</Text>
                                    <Text className="text-slate-400 font-bold text-xs uppercase tracking-wider">No transactions found</Text>
                                </View>
                            ) : (
                                history.map((txn, i) => {
                                    const isCredit = txn.transactionType === 'CREDIT' || txn.type === 'credit';
                                    return (
                                        <View key={txn._id || i} className={`py-4 flex-row items-center justify-between ${i !== history.length - 1 ? 'border-b border-slate-50' : ''}`}>
                                            <View className="flex-row items-center flex-1">
                                                <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-4 border ${isCredit ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'} shadow-sm`}>
                                                    <Ionicons name={isCredit ? 'add' : 'remove'} size={20} color={isCredit ? '#10b981' : '#1D4171'} />
                                                </View>
                                                <View className="flex-1 pr-2">
                                                    <Text className="font-black text-sm text-slate-900 mb-0.5" numberOfLines={1}>{txn.description || (isCredit ? 'Recharge' : 'Booking')}</Text>
                                                    <View className="flex-row items-center gap-2">
                                                        <Text className="text-[10px] font-bold text-slate-400 uppercase">{new Date(txn.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                                                        {txn.walletType === 'FIXED_DEPARTURE' && (
                                                            <Text className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-black tracking-widest">FD</Text>
                                                        )}
                                                    </View>
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <Text className={`font-black text-sm ${isCredit ? 'text-green-600' : 'text-slate-900'}`}>
                                                    {isCredit ? '+' : '-'} ₹{Math.abs(txn.amount).toLocaleString()}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    </View>

                    <View className="h-10" />
                </ScrollView>

                <RazorpayGatewayModal 
                    visible={showGateway} 
                    amount={Number(amount) || 0}
                    orderId={orderId}
                    razorpayKey={razorpayKey}
                    onPaymentSuccess={handlePaymentSuccess} 
                    onCancel={() => setShowGateway(false)} 
                />
            </SafeAreaView>
        </View>
    );
}
