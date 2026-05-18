import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';

export default function Navbar() {
    const navigation = useNavigation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const insets = useSafeAreaInsets();
    const { colorScheme, toggleTheme } = useAppTheme();
    const isDark = colorScheme === 'dark';

    const menuItems = [
        { name: 'Home', icon: '🏠', path: 'Home' },
        { name: 'About', icon: 'ℹ️', path: 'About' },
        { name: 'Support', icon: '🎧', path: 'Support' },
        { name: 'Agent Login', icon: '🔐', path: 'Login' },
        { name: 'Admin Login', icon: '👑', path: 'AdminLogin' },
        { name: 'Register', icon: '📝', path: 'AgentRegister' },
    ];

    return (
        <View style={{ paddingTop: insets.top, backgroundColor: isDark ? '#0f172a' : '#fff', borderBottomWidth: 1, borderBottomColor: isDark ? '#1e293b' : '#f3f4f6' }} className="z-50 shadow-sm">
            <View className="px-4 py-3 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => navigation.navigate('Home')} className="flex-row items-center">
                    <View style={{ backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 }}>
                        <Image
                            source={require('../../assets/goyafly_logo.png')}
                            style={{ height: 50, width: 170, resizeMode: 'contain' }}
                        />
                    </View>
                </TouchableOpacity>

                <View className="flex-row items-center">
                    {/* Theme Toggle */}
                    <TouchableOpacity
                        onPress={toggleTheme}
                        style={{ backgroundColor: isDark ? '#1e293b' : '#f3f4f6' }}
                        className="w-11 h-11 items-center justify-center rounded-2xl border border-slate-200 border-b-4 border-slate-300 mr-2 active:scale-95 shadow-sm"
                    >
                        <Text className="text-base">{isDark ? '☀️' : '🌙'}</Text>
                    </TouchableOpacity>

                    {/* Menu */}
                    <TouchableOpacity
                        onPress={() => setIsMenuOpen(true)}
                        style={{ backgroundColor: isDark ? '#1e293b' : '#f3f4f6' }}
                        className="w-11 h-11 items-center justify-center rounded-2xl border border-slate-200 border-b-4 border-slate-300 active:scale-95 shadow-sm"
                    >
                        <Text className="text-base">☰</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Slide-in Menu */}
            <Modal visible={isMenuOpen} animationType="slide" transparent={true} onRequestClose={() => setIsMenuOpen(false)}>
                <View className="flex-1 bg-black/30">
                    <TouchableOpacity className="absolute w-full h-full" onPress={() => setIsMenuOpen(false)} />
                    <View style={{ backgroundColor: isDark ? '#0f172a' : '#fff', borderLeftColor: isDark ? '#1e293b' : '#f3f4f6' }} className="absolute right-0 top-0 w-[80%] h-full shadow-2xl border-l px-6 pt-16 pb-8">
                        <View className="flex-row justify-between items-center mb-8">
                            <View>
                                <Text style={{ color: isDark ? '#f1f5f9' : '#111827' }} className="text-2xl font-black">Menu</Text>
                                <Text style={{ color: isDark ? '#64748b' : '#9ca3af' }} className="text-[9px] font-bold uppercase">Quick Navigation</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsMenuOpen(false)} style={{ backgroundColor: isDark ? '#1e293b' : '#f3f4f6' }} className="w-11 h-11 items-center justify-center rounded-2xl border border-slate-200 border-b-4 border-slate-300 active:scale-95 shadow-sm">
                                <Text className="text-lg">✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {menuItems.map((item, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => { setIsMenuOpen(false); navigation.navigate(item.path); }}
                                    style={{ borderBottomColor: isDark ? '#1e293b' : '#f9fafb' }}
                                    className="flex-row items-center py-4 border-b"
                                >
                                    <View style={{ backgroundColor: isDark ? '#1e293b' : '#f9fafb' }} className="w-10 h-10 rounded-xl items-center justify-center mr-4">
                                        <Text className="text-lg">{item.icon}</Text>
                                    </View>
                                    <Text style={{ color: isDark ? '#e2e8f0' : '#111827' }} className="font-bold text-sm">{item.name}</Text>
                                </TouchableOpacity>
                            ))}

                            {/* Theme Toggle in Menu */}
                            <TouchableOpacity
                                onPress={toggleTheme}
                                style={{ borderBottomColor: isDark ? '#1e293b' : '#f9fafb' }}
                                className="flex-row items-center py-4 border-b"
                            >
                                <View style={{ backgroundColor: isDark ? '#1e293b' : '#f9fafb' }} className="w-10 h-10 rounded-xl items-center justify-center mr-4">
                                    <Text className="text-lg">{isDark ? '☀️' : '🌙'}</Text>
                                </View>
                                <Text style={{ color: isDark ? '#e2e8f0' : '#111827' }} className="font-bold text-sm">{isDark ? 'Light Mode' : 'Dark Mode'}</Text>
                            </TouchableOpacity>

                            <View style={{ backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: isDark ? '#334155' : '#dbeafe' }} className="mt-8 p-5 rounded-2xl border">
                                <Text style={{ color: isDark ? '#93c5fd' : '#1D4171' }} className="font-medium text-xs leading-5">
                                    Trusted by 10,000+ agents globally. Secure, verified, and high-margin travel distribution.
                                </Text>
                            </View>
                        </ScrollView>

                        <View className="mt-auto items-center pt-4">
                            <Text style={{ color: isDark ? '#475569' : '#9ca3af' }} className="font-bold text-[9px] uppercase">Goyafly v2.0</Text>
                            <Text style={{ color: isDark ? '#334155' : '#d1d5db' }} className="text-[7px] font-medium uppercase mt-1">© 2026 Goyafly Technologies</Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
