import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { otbService } from '../../services/api';
import RazorpayGatewayModal from '../../components/RazorpayGatewayModal';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';

export default function OTBAgentScreen({ navigation }) {
    const t = useThemeColors();
    const [status, setStatus] = useState('NONE'); // NONE, PENDING_APPROVAL, APPROVED, REJECTED
    const [loading, setLoading] = useState(true);
    const [showGateway, setShowGateway] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [razorpayKey, setRazorpayKey] = useState(null);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await otbService.getAgentStatus();
            if (res.success) {
                setStatus(res.status);
            }
        } catch (error) {
            console.error("OTB Status Check Error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInitialPay = async () => {
        setLoading(true);
        try {
            const res = await otbService.initiateSubscription();
            if (res.success) {
                setOrderId(res.order.id);
                setRazorpayKey(res.key);
                setShowGateway(true);
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to initiate payment. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = async (paymentData) => {
        setShowGateway(false);
        setLoading(true);
        try {
            const res = await otbService.verifySubscription(paymentData);
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Payment verified! Awaiting admin approval.' });
                setStatus('PENDING_APPROVAL');
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Verification failed. Please contact support.' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#F07E21" />
            </View>
        );
    }

    // Landauing Page for NONE or REJECTED
    if (status === 'NONE' || status === 'REJECTED') {
        return (
            <View style={{ flex: 1, backgroundColor: t.bg }}>
                <StatusBar style="dark" />
                <SafeAreaView className="flex-1" edges={['top']}>
                    <View className="px-4 py-4 flex-row items-center">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                            <Text className="text-2xl">←</Text>
                        </TouchableOpacity>
                        <Text style={{ color: t.text }} className="text-2xl font-black">OK To Board</Text>
                    </View>

                    <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }}>
                        <LinearGradient
                            colors={['#17365e', '#132c4d']}
                            style={{ padding: 40, borderRadius: 30, marginBottom: 30, marginTop: 10 }}
                        >
                            <Text className="text-white text-3xl font-black mb-2">Lifetime OTB Access</Text>
                            <Text className="text-blue-200 font-bold mb-6">Unlock priority OK TO BOARD services for all your customers with a one-time fee.</Text>
                            
                            <View className="bg-white/10 p-5 rounded-2xl mb-8 border border-white/10">
                                <Text className="text-white font-black text-2xl">₹999.00</Text>
                                <Text className="text-blue-300 text-[10px] font-bold uppercase">Single Payment • Lifetime Value</Text>
                            </View>

                            <TouchableOpacity onPress={handleInitialPay} className="active:scale-95">
                                <LinearGradient
                                    colors={['#F07E21', '#ff9844']}
                                    style={{ paddingVertical: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#F07E21', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: {height: 5} }}
                                >
                                    <Text className="text-white font-black text-base uppercase">ACTIVATE NOW →</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>

                        <Text style={{ color: t.text }} className="text-xl font-black mb-6 px-2">Why activate OTB?</Text>
                        
                        {[
                            { title: 'Priority Processing', desc: 'Direct access to airline OTB portals with faster turnaround times.', icon: '⚡' },
                            { title: 'Global Coverage', desc: 'Apply OTB for all major international airlines in one place.', icon: '🌍' },
                            { title: 'Live Notifications', desc: 'Get instant app alerts when your passengers are cleared for boarding.', icon: '🔔' }
                        ].map((item, i) => (
                            <View key={i} style={{ backgroundColor: t.card }} className="p-6 rounded-2xl mb-4 border border-gray-100 flex-row items-center">
                                <View className="w-12 h-12 bg-primary-50 rounded-xl items-center justify-center mr-4">
                                    <Text className="text-xl">{item.icon}</Text>
                                </View>
                                <View className="flex-1">
                                    <Text style={{ color: t.text }} className="font-black text-base mb-1">{item.title}</Text>
                                    <Text style={{ color: t.textMuted }} className="text-xs font-medium leading-5">{item.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </SafeAreaView>

                <RazorpayGatewayModal 
                    visible={showGateway} 
                    amount={999}
                    orderId={orderId}
                    razorpayKey={razorpayKey}
                    onPaymentSuccess={handlePaymentSuccess} 
                    onCancel={() => setShowGateway(false)} 
                />
            </View>
        );
    }

    // Awaiting Approval State
    if (status === 'PENDING_APPROVAL') {
        return (
            <View style={{ flex: 1, backgroundColor: t.bg }}>
                <SafeAreaView className="flex-1 items-center justify-center px-10">
                    <View className="bg-orange-50 w-24 h-24 rounded-full items-center justify-center mb-8">
                        <Text className="text-5xl">⏳</Text>
                    </View>
                    <Text style={{ color: t.text }} className="text-2xl font-black text-center mb-4">Verification In Progress</Text>
                    <Text style={{ color: t.textSecondary }} className="text-center font-medium leading-6 mb-10">
                        Thank you for your payment! Our admin team is currently reviewing your access request. You will be notified once your OTB services are activated.
                    </Text>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={{ borderBottomWidth: 1, borderBottomColor: t.primary }}
                    >
                        <Text style={{ color: t.primary }} className="font-black uppercase text-xs">Return to Dashboard</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </View>
        );
    }

    // Approved State - Form or redirection
    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-4 py-4 flex-row items-center justify-between border-b border-gray-50 bg-white">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                            <Text className="text-2xl">←</Text>
                        </TouchableOpacity>
                        <View>
                            <Text style={{ color: t.text }} className="text-xl font-black">OTB Portal</Text>
                            <View className="flex-row items-center">
                                <View className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />
                                <Text className="text-green-600 font-black text-[8px] uppercase">Lifetime Access Active</Text>
                            </View>
                        </View>
                    </View>
                    <View className="bg-primary-50 px-3 py-1.5 rounded-lg">
                         <Text className="text-primary-600 font-black text-[10px]">NEW APP</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 p-5">
                    <View className="bg-blue-600 p-8 rounded-[2.5rem] mb-8 shadow-xl relative overflow-hidden">
                        <Text className="text-white font-black text-2xl mb-2">Apply OTB</Text>
                        <Text className="text-blue-100 font-medium text-xs leading-5">Submit passenger documents for OK TO BOARD clearance. All major airlines supported.</Text>
                    </View>

                    <Text style={{ color: t.textSecondary }} className="text-center font-bold text-xs italic py-10">
                        The full OTB submission form is best experienced on our web portal. Redirecting to mobile form module...
                    </Text>
                    
                    {/* In a real scenario, this would have the full form fields mirrored from web */}
                    <TouchableOpacity 
                        className="bg-primary-600 py-5 rounded-2xl items-center shadow-xl active:scale-95"
                        onPress={() => navigation.navigate('OTBApply')}
                    >
                        <Text className="text-white font-black text-sm uppercase">Start Application</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
