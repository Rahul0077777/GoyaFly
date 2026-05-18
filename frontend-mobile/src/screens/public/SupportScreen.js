import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';

export default function SupportScreen({ navigation }) {
    const t = useThemeColors();
    const [form, setForm] = useState({ name: '', id: '', message: '' });

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-4 py-4 flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3"><Text className="text-2xl">←</Text></TouchableOpacity>
                    <View className="bg-green-50 p-3 rounded-2xl mr-3"><Text className="text-2xl">🎧</Text></View>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black">Support</Text>
                        <Text style={{ color: t.textMuted }} className="font-bold uppercase text-[9px]">24/7 Help Center</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    {/* Quick Contact */}
                    <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-6 rounded-3xl border border-gray-100 shadow-sm mb-4">
                        <Text className="text-[#48A0D4] font-black text-xs uppercase mb-4">⏱️ Average Response Time</Text>
                        <Text className="text-[#1D4171] text-4xl font-black mb-6">4m 12s</Text>
                        <View style={{ backgroundColor: t.input }} className="p-4 rounded-2xl mb-3 flex-row items-center">
                            <Text className="text-lg mr-3">📞</Text>
                            <Text className="text-gray-900 font-bold text-sm">1800-ZAYA-FLY</Text>
                        </View>
                        <View style={{ backgroundColor: t.input }} className="p-4 rounded-2xl flex-row items-center">
                            <Text className="text-lg mr-3">📧</Text>
                            <Text className="text-gray-900 font-bold text-sm">support@zayafly.com</Text>
                        </View>
                    </View>

                    {/* Support Form */}
                    <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-6 rounded-3xl border border-gray-100 shadow-sm mb-10">
                        <Text style={{ color: t.text }} className="font-black text-lg mb-6">📝 Submit a Ticket</Text>

                        <View className="mb-4">
                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase mb-2 ml-1">Your Name</Text>
                            <TextInput
                                style={{ backgroundColor: t.input }} className="rounded-xl px-4 py-3 font-bold text-gray-800 text-sm border border-gray-100"
                                placeholder="Full Name"
                                placeholderTextColor="#9ca3af"
                                value={form.name}
                                onChangeText={(t) => setForm({...form, name: t})}
                            />
                        </View>

                        <View className="mb-4">
                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase mb-2 ml-1">Agent ID</Text>
                            <TextInput
                                style={{ backgroundColor: t.input }} className="rounded-xl px-4 py-3 font-bold text-gray-800 text-sm border border-gray-100"
                                placeholder="ZF-8821"
                                placeholderTextColor="#9ca3af"
                                value={form.id}
                                onChangeText={(t) => setForm({...form, id: t})}
                            />
                        </View>

                        <View className="mb-6">
                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase mb-2 ml-1">Message</Text>
                            <TextInput
                                style={{ backgroundColor: t.input }} className="rounded-xl px-4 py-3 font-bold text-gray-800 text-sm border border-gray-100 min-h-[120px]"
                                placeholder="Describe your issue..."
                                placeholderTextColor="#9ca3af"
                                multiline textAlignVertical="top"
                                value={form.message}
                                onChangeText={(t) => setForm({...form, message: t})}
                            />
                        </View>

                        <TouchableOpacity className="active:scale-95">
                            <LinearGradient colors={['#F07E21', '#ff9844']} style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}>
                                <Text className="text-white font-black text-sm uppercase">Submit Ticket</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
