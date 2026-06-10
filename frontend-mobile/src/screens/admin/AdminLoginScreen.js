import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const t = useThemeColors();

    const handleLogin = async () => {
        if (!email || !password) return Toast.show({ type: 'info', text1: 'Required', text2: 'Please enter email and password.' });
        setLoading(true);
        try {
            const res = await authService.loginAdmin({ email, password });
            if (res.success) {
                await AsyncStorage.setItem('adminToken', res.data.token);
                await AsyncStorage.setItem('adminInfo', JSON.stringify(res.data));
                navigation.replace('AdminApp');
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Login Failed', text2: error.response?.data?.message || 'Invalid admin credentials.' });
        } finally { setLoading(false); }
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style={t.statusBar} />
            <SafeAreaView className="flex-1">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                        <LinearGradient
                            colors={t.isDark ? ['#7f1d1d', '#dc2626', '#7f1d1d'] : ['#dc2626', '#b91c1c', '#991b1b']}
                            style={{ paddingHorizontal: 32, paddingTop: 64, paddingBottom: 64, alignItems: 'center', overflow: 'hidden' }}
                        >
                            <View className="absolute top-0 left-0 w-80 h-80 bg-white/10 rounded-full -ml-40 -mt-40" />
                            <View className="absolute bottom-0 right-0 w-96 h-96 bg-black/10 rounded-full -mr-48 -mb-48" />
                            <View className="w-20 h-20 bg-white/10 rounded-3xl items-center justify-center mb-6 border border-white/20 shadow-sm">
                                <Ionicons name="shield-checkmark" size={36} color="#FFF" />
                            </View>
                            <Text className="text-white text-3xl font-black text-center tracking-wide">Admin Portal</Text>
                            <Text className="text-red-100/80 text-center text-xs font-black uppercase tracking-widest mt-2 px-6">
                                Secure administrative access • Authorized personnel only
                            </Text>
                        </LinearGradient>

                        <View className="px-5 -mt-10">
                            <View style={{ backgroundColor: t.card, elevation: 12 }} className="p-8 rounded-3xl border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40">
                                <View className="mb-8 border-b border-slate-100 pb-4">
                                    <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">Admin Sign In</Text>
                                    <Text style={{ color: t.textSecondary }} className="font-bold text-xs mt-1">Use super admin credentials to proceed.</Text>
                                </View>

                                <View className="mb-6">
                                    <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase mb-2 ml-1 tracking-widest">Admin Email</Text>
                                    <TextInput
                                        style={{ backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }}
                                        className="w-full rounded-2xl px-5 py-4 font-black text-sm border shadow-inner"
                                        placeholder="admin@zayafly.com"
                                        placeholderTextColor={t.placeholder}
                                        value={email} onChangeText={setEmail} autoCapitalize="none"
                                    />
                                </View>

                                <View className="mb-8">
                                    <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase mb-2 ml-1 tracking-widest">Password</Text>
                                    <View style={{ backgroundColor: t.input, borderColor: t.inputBorder }} className="flex-row items-center rounded-2xl px-5 border shadow-inner">
                                        <TextInput
                                            style={{ color: t.text }}
                                            className="flex-1 py-4 font-black text-sm"
                                            placeholder="••••••••"
                                            placeholderTextColor={t.placeholder}
                                            secureTextEntry={!showPassword}
                                            value={password} onChangeText={setPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                                            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#64748b" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity onPress={handleLogin} disabled={loading} className="bg-[#dc2626] border border-[#dc2626] border-b-[6px] border-b-[#991b1b] py-5 rounded-2xl items-center shadow-xl shadow-red-600/30 active:scale-95 mt-2">
                                    {loading ? <ActivityIndicator color="white" /> : (
                                        <Text className="text-white font-black text-xs uppercase tracking-widest">👑 Admin Access</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="mt-8 items-center pb-8">
                            <TouchableOpacity onPress={() => navigation.replace('Login')} className="flex-row items-center bg-white px-5 py-3 rounded-xl border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm">
                                <Ionicons name="arrow-back" size={16} color="#64748b" className="mr-2" />
                                <Text style={{ color: t.textMuted }} className="font-black text-xs uppercase tracking-widest">Return to Agent Login</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
