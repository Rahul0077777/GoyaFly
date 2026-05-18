import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentGatewayModal({ visible, amount, onPaymentSuccess, onCancel }) {
    const [step, setStep] = useState('methods'); // methods, processing, success
    const [method, setMethod] = useState(null);

    // Reset when modal becomes visible
    useEffect(() => {
        if (visible) setStep('methods');
    }, [visible]);

    const handlePay = (selectedMethod) => {
        setMethod(selectedMethod);
        setStep('processing');
        
        // Simulating the backend Razorpay secure capture logic to prevent native crashing in Expo
        setTimeout(() => {
            setStep('success');
            setTimeout(() => {
                onPaymentSuccess({
                    transactionId: `PAY-${Math.random().toString(36).substring(7).toUpperCase()}`,
                    method: selectedMethod,
                    amount
                });
            }, 1000);
        }, 2000);
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View className="flex-1 bg-slate-900/60 justify-end">
                <View className="bg-white w-full rounded-t-[40px] overflow-hidden">
                    {/* Header */}
                    <View className="px-6 py-6 bg-slate-50 flex-row justify-between items-center border-b border-slate-100">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-primary-600 rounded-xl items-center justify-center mr-3 shadow-sm shadow-primary-500/30">
                                <Ionicons name="shield-checkmark" size={20} color="white" />
                            </View>
                            <Text className="font-black text-slate-900 text-lg">Zayafly Checkout</Text>
                        </View>
                        <TouchableOpacity onPress={onCancel} className="bg-slate-200 p-2 rounded-full">
                            <Ionicons name="close" size={20} color="#475569" />
                        </TouchableOpacity>
                    </View>

                    <View className="px-6 py-8">
                        {step === 'methods' && (
                            <View>
                                <View className="items-center mb-8">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Payable</Text>
                                    <Text className="text-4xl font-black text-slate-900">₹{amount?.toLocaleString()}</Text>
                                </View>

                                <Text className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-4">Select Payment Method</Text>

                                {[
                                    { id: 'upi', name: 'UPI (PhonePe, GPay)', icon: 'phone-portrait-outline', color: '#10b981' },
                                    { id: 'card', name: 'Credit / Debit Card', icon: 'card-outline', color: '#48A0D4' },
                                    { id: 'nb', name: 'Net Banking', icon: 'business-outline', color: '#8b5cf6' }
                                ].map((m) => (
                                    <TouchableOpacity 
                                        key={m.id}
                                        onPress={() => handlePay(m.name)}
                                        className="w-full p-5 bg-white border border-slate-200 rounded-2xl flex-row items-center justify-between mb-3 active:bg-primary-50 active:border-primary-500"
                                    >
                                        <View className="flex-row items-center">
                                            <Ionicons name={m.icon} size={24} color={m.color} className="mr-4" />
                                            <Text className="font-bold text-slate-700 text-base">{m.name}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                                    </TouchableOpacity>
                                ))}

                                <Text className="text-[10px] text-center text-slate-400 font-bold leading-relaxed px-4 mt-6">
                                    Your payment is secured by industry-leading 256-bit encryption. Handled by Zayafly Trust.
                                </Text>
                            </View>
                        )}

                        {step === 'processing' && (
                            <View className="py-12 items-center">
                                <ActivityIndicator size="large" color="#48A0D4" className="mb-6 scale-150" />
                                <Text className="text-xl font-black text-slate-900 mb-2 italic">Securing Payment...</Text>
                                <Text className="text-sm font-bold text-slate-400">Please do not refresh or close app.</Text>
                            </View>
                        )}

                        {step === 'success' && (
                            <View className="py-10 items-center">
                                <View className="w-24 h-24 bg-green-50 rounded-full items-center justify-center shadow-xl shadow-green-500/20 mb-6 border-4 border-green-100">
                                    <Ionicons name="checkmark-circle" size={60} color="#22c55e" />
                                </View>
                                <Text className="text-2xl font-black text-slate-900 mb-2 italic">Payment Success!</Text>
                                <Text className="text-sm font-bold text-slate-500 mb-8">₹{amount?.toLocaleString()} captured via {method}</Text>
                                
                                <View className="bg-slate-50 border border-dashed border-slate-300 p-4 rounded-xl w-full items-center">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">System Auth Code</Text>
                                    <Text className="text-xs font-mono text-slate-700 font-black">ZY-PAY-SUCCESS-002194</Text>
                                </View>
                            </View>
                        )}
                    </View>
                    
                    <View className="pb-10 bg-white" />
                </View>
            </View>
        </Modal>
    );
}
