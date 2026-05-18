import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';

export default function AboutCompanyScreen({ navigation }) {
    const t = useThemeColors();
    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-4 py-4 flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3"><Text className="text-2xl">←</Text></TouchableOpacity>
                    <View className="bg-purple-50 p-3 rounded-2xl mr-3"><Text className="text-2xl">🏢</Text></View>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black">Zaya Group</Text>
                        <Text style={{ color: t.textMuted }} className="font-bold uppercase text-[9px]">Corporate profile</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    <LinearGradient
                        colors={['#1D4171', '#132c4d']}
                        style={{ padding: 32, borderRadius: 24, marginBottom: 24, overflow: 'hidden' }}
                    >
                        <View className="absolute bottom-0 right-0 w-48 h-48 bg-[#48A0D4]/20 rounded-full -mr-20 -mb-20" />
                        <Text className="text-white text-3xl font-black mb-3">Global{"\n"}Prestige.</Text>
                        <Text className="text-blue-200 text-sm font-medium leading-6">
                            Multinational operations spanning three continents with unified B2B settlement protocols.
                        </Text>
                    </LinearGradient>

                    <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-6 rounded-3xl border border-gray-100 shadow-sm mb-4">
                        <Text className="text-[#48A0D4] font-black text-xs uppercase mb-3">📋 Executive Summary</Text>
                        <Text className="text-gray-600 text-sm font-medium leading-6 mb-6">
                            Zaya Group is a multinational conglomerate specializing in high-frequency travel distribution and liquidity management. We provide the substrate for global B2B transit networks.
                        </Text>
                        <View style={{ backgroundColor: t.input }} className="flex-row justify-around p-4 rounded-2xl">
                            {[
                                { code: 'UAE', label: 'HQ' },
                                { code: 'IND', label: 'Tech Hub' },
                                { code: 'UK', label: 'EU Bridge' },
                            ].map((loc, idx) => (
                                <View key={idx} className="items-center">
                                    <Text className="text-[#1D4171] font-black text-lg">{loc.code}</Text>
                                    <Text style={{ color: t.textMuted }} className="text-[8px] font-bold uppercase">{loc.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View className="bg-orange-50 p-5 rounded-2xl border border-orange-100 mb-10 flex-row items-start">
                        <Text className="text-2xl mr-3">🌍</Text>
                        <View className="flex-1">
                            <Text className="text-[#F07E21] font-black text-xs mb-1">Global Nexus</Text>
                            <Text className="text-gray-600 font-medium text-xs leading-5">
                                Operating across 14 global territories with unified settlement protocols for seamless agent growth.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
