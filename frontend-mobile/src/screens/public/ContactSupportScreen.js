import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';

export default function ContactSupportScreen({ navigation }) {
    const t = useThemeColors();
    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-4 py-4 flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3"><Text className="text-2xl">←</Text></TouchableOpacity>
                    <View className="bg-red-50 p-3 rounded-2xl mr-3"><Text className="text-2xl">🆘</Text></View>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black">Contact</Text>
                        <Text style={{ color: t.textMuted }} className="font-bold uppercase text-[9px]">Priority support</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    {/* Phone Card */}
                    <TouchableOpacity style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-6 rounded-3xl border border-gray-100 shadow-sm mb-3 flex-row items-center active:scale-[0.98]">
                        <View className="w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center mr-5">
                            <Text className="text-2xl">📞</Text>
                        </View>
                        <View>
                            <Text className="text-[#1D4171] font-black text-xl">1-800-ZAYA</Text>
                            <Text className="text-[#48A0D4] text-[10px] font-bold uppercase">Global Hotline</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Email Card */}
                    <TouchableOpacity style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-6 rounded-3xl border border-gray-100 shadow-sm mb-6 flex-row items-center active:scale-[0.98]">
                        <View className="w-14 h-14 bg-orange-50 rounded-2xl items-center justify-center mr-5">
                            <Text className="text-2xl">📧</Text>
                        </View>
                        <View>
                            <Text style={{ color: t.text }} className="font-black text-lg">priority@zaya.io</Text>
                            <Text className="text-[#F07E21] text-[10px] font-bold uppercase">Secure Email</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Response Metrics */}
                    <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-6 rounded-3xl border border-gray-100 shadow-sm mb-10">
                        <Text style={{ color: t.text }} className="font-black text-base mb-4">📊 Response Metrics</Text>
                        <View className="flex-row justify-between">
                            <View className="items-center bg-blue-50 px-4 py-3 rounded-2xl flex-1 mr-2">
                                <Text className="text-[#1D4171] font-black text-lg">{'<'} 15s</Text>
                                <Text style={{ color: t.textMuted }} className="text-[8px] font-bold uppercase mt-1">Voice</Text>
                            </View>
                            <View className="items-center bg-orange-50 px-4 py-3 rounded-2xl flex-1 mx-2">
                                <Text className="text-[#F07E21] font-black text-lg">{'<'} 4m</Text>
                                <Text style={{ color: t.textMuted }} className="text-[8px] font-bold uppercase mt-1">Ticket</Text>
                            </View>
                            <View className="items-center bg-green-50 px-4 py-3 rounded-2xl flex-1 ml-2">
                                <Text className="text-green-600 font-black text-lg">Live</Text>
                                <Text style={{ color: t.textMuted }} className="text-[8px] font-bold uppercase mt-1">Status</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
