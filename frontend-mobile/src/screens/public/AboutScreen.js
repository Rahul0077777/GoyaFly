import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';

export default function AboutScreen({ navigation }) {
    const t = useThemeColors();
    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-4 py-4 flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3"><Text className="text-2xl">←</Text></TouchableOpacity>
                    <View className="bg-blue-50 p-3 rounded-2xl mr-3"><Text className="text-2xl">ℹ️</Text></View>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black">About Us</Text>
                        <Text style={{ color: t.textMuted }} className="font-bold uppercase text-[9px]">Zayafly Technologies</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    {/* Hero Banner */}
                    <LinearGradient
                        colors={['#1D4171', '#48A0D4']}
                        style={{ padding: 32, borderRadius: 24, marginBottom: 24, overflow: 'hidden' }}
                    >
                        <View className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16" />
                        <Text className="text-white text-3xl font-black mb-3">The New{"\n"}Standard.</Text>
                        <Text className="text-blue-100 text-sm font-medium leading-6">
                            Pioneering high-frequency travel distribution for B2B agent networks since 2015.
                        </Text>
                    </LinearGradient>

                    {/* Mission Card */}
                    <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-6 rounded-3xl border border-gray-100 shadow-sm mb-4">
                        <Text className="text-[#1D4171] font-black text-lg mb-3">🎯 Our Mission</Text>
                        <Text className="text-gray-600 text-sm font-medium leading-6 mb-6">
                            To provide a seamless, high-margin B2B platform empowering travel agents with premium inventory and instant ticketing capabilities.
                        </Text>
                        <View className="flex-row justify-around">
                            <View className="items-center">
                                <Text className="text-2xl font-black text-[#1D4171]">10k+</Text>
                                <Text style={{ color: t.textMuted }} className="text-[9px] font-bold uppercase">Agents</Text>
                            </View>
                            <View className="items-center">
                                <Text className="text-2xl font-black text-[#F07E21]">500k+</Text>
                                <Text style={{ color: t.textMuted }} className="text-[9px] font-bold uppercase">Bookings/Yr</Text>
                            </View>
                        </View>
                    </View>

                    {/* Value Cards */}
                    <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-5 rounded-2xl border border-gray-100 shadow-sm mb-3 flex-row items-center">
                        <View className="w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center mr-4">
                            <Text className="text-2xl">🛡️</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-900 font-bold text-sm mb-1">99.9% Uptime</Text>
                            <Text style={{ color: t.textMuted }} className="text-xs font-medium">Enterprise-grade reliability SLA</Text>
                        </View>
                    </View>

                    <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-5 rounded-2xl border border-gray-100 shadow-sm mb-3 flex-row items-center">
                        <View className="w-14 h-14 bg-orange-50 rounded-2xl items-center justify-center mr-4">
                            <Text className="text-2xl">⚡</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-900 font-bold text-sm mb-1">Smart Technology</Text>
                            <Text style={{ color: t.textMuted }} className="text-xs font-medium">AI-powered fare prediction & optimization</Text>
                        </View>
                    </View>

                    {/* CTA */}
                    <TouchableOpacity onPress={() => navigation.navigate('AgentRegister')} className="mt-4 mb-10 active:scale-95">
                        <LinearGradient colors={['#F07E21', '#ff9844']} style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}>
                            <Text className="text-white font-black text-sm uppercase">Join the Network</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
