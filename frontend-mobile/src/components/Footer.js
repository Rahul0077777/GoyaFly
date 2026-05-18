import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../context/ThemeContext';

export default function Footer() {
    const { colorScheme } = useAppTheme();
    const isDark = colorScheme === 'dark';

    return (
        <View style={{ backgroundColor: isDark ? '#0f172a' : '#fff', borderTopWidth: 1, borderTopColor: isDark ? '#1e293b' : '#f3f4f6' }} className="px-6 py-10">
            <View className="items-center mb-6">
                <View style={{ backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 20, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 6, marginBottom: 16 }}>
                    <Image
                        source={require('../../assets/goyafly_logo.png')}
                        style={{ height: 70, width: 240, resizeMode: 'contain' }}
                    />
                </View>
                <View className="w-12 h-1 bg-[#F07E21] rounded-full" />
            </View>

            <Text style={{ color: isDark ? '#94a3b8' : '#6b7280' }} className="text-center text-xs font-medium leading-6 mb-6 px-4">
                India's premier B2B travel platform. Empowering partners with cutting-edge inventory distribution and secure wallet management.
            </Text>

            <View className="flex-row justify-center space-x-4 mb-8">
                {['📘', '🐦', '💼', '📸'].map((icon, idx) => (
                    <TouchableOpacity key={idx} style={{ backgroundColor: isDark ? '#1e293b' : '#f3f4f6' }} className="w-11 h-11 items-center justify-center rounded-2xl border border-slate-200 border-b-4 border-slate-300 mx-1 active:scale-95 shadow-sm">
                        <Text className="text-base">{icon}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={{ borderTopColor: isDark ? '#1e293b' : '#f3f4f6' }} className="pt-6 border-t items-center">
                <Text style={{ color: isDark ? '#475569' : '#9ca3af' }} className="text-[9px] font-bold uppercase text-center mb-1">
                    © 2026 GOYAFLY TECHNOLOGIES
                </Text>
                <View className="flex-row items-center">
                    <View className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
                    <Text style={{ color: isDark ? '#334155' : '#d1d5db' }} className="text-[8px] font-bold uppercase">
                        Secure Verified Network
                    </Text>
                </View>
            </View>
        </View>
    );
}
