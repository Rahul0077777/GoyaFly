import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { otbService } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';
import { Ionicons } from '@expo/vector-icons';

export default function OTBAgentScreen({ navigation }) {
    const t = useThemeColors();
    const [status, setStatus] = useState('NONE'); // NONE, PENDING_APPROVAL, APPROVED, REJECTED
    const [agentData, setAgentData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            setLoading(true);
            const res = await otbService.getAgentStatus();
            if (res.success) {
                setStatus(res.status);
                setAgentData(res.agent);
            }
        } catch (error) {
            console.error("OTB Status Check Error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleWalletPayment = async () => {
        Alert.alert(
            'Confirm Activation',
            'Activate OTB Lifetime Access using ₹9,999 from your wallet?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Activate',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const res = await otbService.activateWithWallet();
                            if (res.success) {
                                Toast.show({ type: 'success', text1: 'Activated', text2: res.message });
                                checkStatus();
                            }
                        } catch (error) {
                            Toast.show({ type: 'error', text1: 'Failed', text2: error.response?.data?.message || 'Wallet payment failed.' });
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#F4F7FE', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1A56DB" />
            </View>
        );
    }

    // Landing Page for NONE or REJECTED
    if (status === 'NONE' || status === 'REJECTED') {
        const balance = agentData?.walletBalance || 0;
        const hasEnoughBalance = balance >= 9999;

        return (
            <View style={{ flex: 1, backgroundColor: '#F4F7FE' }}>
                <StatusBar style="light" />
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    
                    {/* Header Gradient - Safe wrapped for Android */}
                    <View style={{ overflow: 'hidden', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }} className="pt-16 pb-20 px-6 relative bg-[#0B359C]">
                        <LinearGradient
                            colors={['#0B359C', '#0A2670']}
                            start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                        />
                        <View className="flex-row items-center justify-between mb-6 relative z-10">
                            <TouchableOpacity 
                                onPress={() => navigation.goBack()} 
                                className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center border border-white/10 active:scale-95"
                            >
                                <Ionicons name="chevron-back" size={22} color="#fff" />
                            </TouchableOpacity>
                            <View className="bg-[#2D5A9E]/40 border border-white/10 rounded-lg px-3 py-1.5 shadow-inner">
                                <Text className="text-white text-[10px] font-black uppercase tracking-wider">🛡️ Trusted by 5000+ Agents</Text>
                            </View>
                            <View className="w-12" />
                        </View>

                        {status === 'REJECTED' && (
                            <View className="bg-red-500/90 p-4 rounded-2xl mb-6 border border-red-400 flex-row items-center gap-3 relative z-10">
                                <Text className="text-white font-bold text-xs flex-1">
                                    ⚠️ Your previous request was rejected. You can try paying again or contact support.
                                </Text>
                            </View>
                        )}

                        <Text className="text-white text-3xl font-black mb-2 relative z-10 leading-tight">
                            OK to Board{'\n'}
                            <Text className="text-[#FF9F43]">Services</Text>
                        </Text>
                        <Text className="text-blue-100 font-medium text-sm leading-6 mb-8 relative z-10">
                            Unlock the ability to process airline-approved OTB requests for your customers directly through our portal.
                        </Text>

                        {/* Feature Cards Grid */}
                        <View className="flex-row gap-3 relative z-10">
                            {[
                                { icon: '⚡', text: 'Instant\nApplication' },
                                { icon: '🛡️', text: 'Lifetime\nAccess' },
                                { icon: '🎧', text: '24/7 Admin\nSupport' }
                            ].map((feat, idx) => (
                                <View key={idx} className="flex-1 bg-[#0B359C]/40 border border-white/10 rounded-2xl p-3 items-center justify-center shadow-lg">
                                    <View className="w-8 h-8 rounded-full bg-[#1A56DB] items-center justify-center text-white text-sm mb-1.5 shadow-inner">
                                        <Text className="text-white font-bold">{feat.icon}</Text>
                                    </View>
                                    <Text className="text-white text-[9px] font-black text-center leading-3">{feat.text}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Premium Activation Card */}
                    <View className="px-5 mt-6">
                        <View className="bg-white rounded-[2rem] shadow-xl p-6 border border-slate-100 border-b-[8px] border-slate-200 text-center items-center">
                            <View className="bg-blue-50 rounded-full px-3 py-1 mb-4 flex-row items-center gap-1.5">
                                <Text className="text-xs">👑</Text>
                                <Text className="text-[#1A56DB] text-[9px] font-black uppercase tracking-wider">Premium Access</Text>
                            </View>

                            <Text className="text-xl font-black text-[#0B1A42] mb-1.5">Premium Activation</Text>
                            <Text className="text-slate-400 text-xs text-center font-bold px-4 mb-6 leading-4">
                                Activate your account for OTB services with a one-time fee
                            </Text>

                            <View className="h-0.5 w-full border-t border-dashed border-slate-200 mb-6" />

                            <Text className="text-[#1A56DB] text-[9px] font-black uppercase tracking-widest mb-1">Investment Amount</Text>
                            <View className="flex-row items-baseline justify-center gap-1 mb-8">
                                <Text className="text-4xl font-black text-[#0B1A42]">₹9,999</Text>
                                <Text className="text-slate-400 font-bold text-xs">/lifetime</Text>
                            </View>

                            <View className="w-full">
                                {hasEnoughBalance ? (
                                    <>
                                        <TouchableOpacity
                                            onPress={handleWalletPayment}
                                            className="bg-[#FF9F43] py-4.5 rounded-2xl items-center border border-b-4 border-[#d67b22] active:scale-95 shadow-md shadow-orange-500/10"
                                        >
                                            <Text className="text-white font-black text-xs uppercase tracking-wider">
                                                💳 Activate Using Wallet
                                            </Text>
                                        </TouchableOpacity>
                                        <Text className="text-[9px] text-center text-slate-400 font-black uppercase tracking-widest mt-2">
                                            ₹9,999 will be deducted from your agency credits
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('Wallet')}
                                            className="bg-[#FF9F43] py-4.5 rounded-2xl items-center border border-b-4 border-[#d67b22] active:scale-95 shadow-md shadow-orange-500/10"
                                        >
                                            <Text className="text-white font-black text-xs uppercase tracking-wider">
                                                👛 Recharge Wallet To Activate
                                            </Text>
                                        </TouchableOpacity>
                                        <Text className="text-[9px] text-center text-red-500 font-black uppercase tracking-widest mt-2">
                                            Balance too low (Current: ₹{balance.toLocaleString('en-IN')})
                                        </Text>
                                    </>
                                )}
                            </View>

                            <View className="flex-row items-center justify-center gap-1.5 text-slate-500 mt-6 mb-6">
                                <Text className="text-emerald-500">🛡️</Text>
                                <Text className="text-[10px] text-slate-400 font-bold">Secure wallet-to-wallet transfer</Text>
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 flex-row items-center gap-3.5 border border-slate-100">
                                <View className="w-8 h-8 rounded-full bg-[#1A56DB] items-center justify-center text-white shadow-sm">
                                    <Text className="text-white font-black text-xs">★</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[#0B1A42] text-[10px] font-black">100% Secure • Fast Processing</Text>
                                    <Text className="text-slate-400 text-[9px] font-medium leading-3">Join thousands of agents growing their business with us.</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // Awaiting Approval State
    if (status === 'PENDING_APPROVAL') {
        return (
            <View style={{ flex: 1, backgroundColor: '#F4F7FE' }}>
                <SafeAreaView className="flex-1 items-center justify-center px-10">
                    <View className="bg-orange-50 w-24 h-24 rounded-[2rem] items-center justify-center mb-8 border border-orange-100">
                        <Text className="text-5xl">⏳</Text>
                    </View>
                    <Text className="text-2xl font-black text-slate-900 text-center mb-4">Verification In Progress</Text>
                    <Text className="text-slate-500 text-center font-medium leading-6 mb-10 text-sm">
                        Thank you for your payment! Our admin team is currently reviewing your access request. You will be notified once your OTB services are activated.
                    </Text>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        className="border-b border-[#1A56DB] pb-0.5"
                    >
                        <Text className="text-[#1A56DB] font-black uppercase text-xs">Return to Dashboard</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </View>
        );
    }

    // Approved State - Form or redirection
    return (
        <View style={{ flex: 1, backgroundColor: '#F4F7FE' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-4 py-4 flex-row items-center justify-between border-b border-slate-100 bg-white">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
                            <Ionicons name="arrow-back" size={24} color="#1A56DB" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-xl font-black text-slate-900">OTB Portal</Text>
                            <View className="flex-row items-center mt-0.5">
                                <View className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />
                                <Text className="text-green-600 font-black text-[8px] uppercase">Lifetime Access Active</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <ScrollView className="flex-1 p-5">
                    {/* Header Banner - Safe wrapped LinearGradient */}
                    <View style={{ overflow: 'hidden', borderRadius: 24 }} className="bg-[#1A56DB] p-8 mb-8 shadow-md relative">
                        <LinearGradient
                            colors={['#1A56DB', '#153ca8']}
                            start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                        />
                        <Text className="text-white font-black text-2xl mb-2 relative z-10">Apply OTB</Text>
                        <Text className="text-blue-100 font-medium text-xs leading-5 relative z-10">
                            Submit passenger documents for OK TO BOARD clearance. All major airlines supported.
                        </Text>
                    </View>

                    <Text className="text-slate-400 text-center font-bold text-xs italic py-10 leading-5">
                        Please proceed to the mobile application form below to complete passenger detail submissions.
                    </Text>
                    
                    <TouchableOpacity 
                        className="bg-[#1A56DB] py-5 rounded-2xl items-center shadow-xl border border-b-4 border-[#103a9c] active:scale-95"
                        onPress={() => navigation.navigate('OTBApply')}
                    >
                        <Text className="text-white font-black text-sm uppercase tracking-wider">Start Application</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
