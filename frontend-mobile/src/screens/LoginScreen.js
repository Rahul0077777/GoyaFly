import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../utils/themeColors';

import Toast from 'react-native-toast-message';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const t = useThemeColors();

    const handleLogin = async () => {
        if (!email || !password) {
            Toast.show({
                type: 'info',
                text1: 'Missing Info',
                text2: 'Please provide both email and password.'
            });
            return;
        }
        setLoading(true);
        try {
            const res = await authService.loginAgent({ email, password });
            if (res.success) {
                const agentData = res.data;
                await AsyncStorage.setItem('agentToken', agentData.token);
                await AsyncStorage.setItem('agentInfo', JSON.stringify(agentData));
                
                if (agentData.kycStatus === 'PENDING' || agentData.kycStatus === 'REJECTED') {
                    navigation.replace('KycStatus');
                } else {
                    navigation.replace('MainApp');
                }
            }
        } catch (error) {
            console.error('Mobile Login Debug:', error);
            const msg = error.response?.data?.message || 'Invalid credentials. Please check your email and password.';
            const isBlocked = error.response?.status === 403;

            Toast.show({
                type: isBlocked ? 'error' : 'info',
                text1: isBlocked ? 'Account Blocked' : 'Login Failed',
                text2: msg,
                visibilityTime: 5000
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style={t.statusBar} />
            <SafeAreaView className="flex-1">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                        <LinearGradient
                            colors={t.isDark ? ['#0f172a', '#1D4171', '#0f172a'] : ['#1D4171', '#17365e', '#132c4d']}
                            style={{ paddingHorizontal: 32, paddingTop: 64, paddingBottom: 48, alignItems: 'center', overflow: 'hidden' }}
                        >
                            <View className="absolute top-0 left-0 w-80 h-80 bg-white/10 rounded-full -ml-40 -mt-40" />
                            <View className="absolute bottom-0 right-0 w-96 h-96 bg-[#F07E21]/10 rounded-full -mr-48 -mb-48" />
                            <View className="w-20 h-20 bg-white/10 rounded-3xl items-center justify-center mb-6 border border-white/20">
                                <Text className="text-white font-black text-3xl">ZF</Text>
                            </View>
                            <Text className="text-white text-3xl font-black text-center">Welcome Back</Text>
                            <Text className="text-blue-100/70 text-center text-sm font-medium mt-3 px-6 leading-6">
                                Access your B2B travel platform and manage your bookings effortlessly.
                            </Text>
                            <View className="flex-row items-center mt-6 px-5 py-2 bg-white/10 rounded-full border border-white/20">
                                <View className="w-2 h-2 rounded-full bg-green-400" />
                                <Text className="text-white text-[10px] font-black uppercase ml-2">System Online & Secure</Text>
                            </View>
                        </LinearGradient>

                        <View className="px-6 -mt-6">
                            <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-8 rounded-3xl border shadow-2xl">
                                <View className="mb-8">
                                    <Text style={{ color: t.text }} className="text-2xl font-black">Partner Login</Text>
                                    <Text style={{ color: t.textSecondary }} className="font-medium text-sm mt-1">Sign in with your Email or Mobile Number.</Text>
                                </View>

                                <View className="mb-5">
                                    <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase mb-2 ml-1">📧 Email or Mobile</Text>
                                    <TextInput
                                        style={{ backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }}
                                        className="w-full rounded-2xl px-5 py-4 font-bold text-sm border"
                                        placeholder="agent@zayafly.com or 99999..."
                                        placeholderTextColor={t.placeholder}
                                        value={email} onChangeText={setEmail}
                                        autoCapitalize="none"
                                    />
                                </View>

                                <View className="mb-6">
                                    <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase mb-2 ml-1">🔐 Password</Text>
                                    <View style={{ backgroundColor: t.input, borderColor: t.inputBorder }} className="flex-row items-center rounded-2xl px-5 border">
                                        <TextInput
                                            style={{ color: t.text }}
                                            className="flex-1 py-4 font-bold text-sm"
                                            placeholder="••••••••"
                                            placeholderTextColor={t.placeholder}
                                            secureTextEntry={!showPassword}
                                            value={password} onChangeText={setPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Text className="text-lg">{showPassword ? '🙈' : '👁️'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity onPress={handleLogin} disabled={loading} className="active:scale-95 mt-2">
                                    <LinearGradient
                                        colors={['#F07E21', '#ea580c']}
                                        start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                                        style={{ paddingVertical: 20, borderRadius: 16, alignItems: 'center' }}
                                    >
                                        {loading ? <ActivityIndicator color="white" /> : (
                                            <Text className="text-white font-black text-base uppercase">🔐 Secure Login</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="mt-8 items-center px-6 pb-8">
                            <Text style={{ color: t.textSecondary }} className="font-medium text-sm mb-4">New to Zayafly?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('AgentRegister')}>
                                <Text className="text-[#F07E21] font-black text-xs uppercase">Register as Partner →</Text>
                            </TouchableOpacity>

                            <View className="flex-row items-center w-full my-6">
                                <View style={{ backgroundColor: t.divider }} className="flex-1 h-[1px]" />
                                <Text style={{ color: t.textMuted }} className="mx-4 font-bold text-xs">OR</Text>
                                <View style={{ backgroundColor: t.divider }} className="flex-1 h-[1px]" />
                            </View>

                            <TouchableOpacity
                                style={{ backgroundColor: t.card, borderColor: t.cardBorder }}
                                className="flex-row items-center px-8 py-4 rounded-2xl border w-full justify-center shadow-sm"
                                onPress={() => navigation.replace('AdminLogin')}
                            >
                                <Text className="text-lg mr-3">👑</Text>
                                <Text style={{ color: t.textSecondary }} className="font-black text-xs uppercase">Admin Login</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
