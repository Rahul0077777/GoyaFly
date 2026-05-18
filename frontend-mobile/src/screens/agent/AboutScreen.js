import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';

export default function AboutScreen({ navigation }) {
    const t = useThemeColors();

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style={t.statusBar} />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-gray-50">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-11 h-11 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 shadow-sm active:scale-95">
                        <Ionicons name="close" size={24} color={t.text} />
                    </TouchableOpacity>
                    <Text style={{ color: t.text }} className="text-xl font-black uppercase">About ZayaFly</Text>
                    <View className="w-10" />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    {/* Hero Section */}
                    <View style={{ backgroundColor: '#1D4171' }} className="py-16 px-8 items-center">
                        <Text className="text-white text-4xl font-black mb-4">Travel Reimagined.</Text>
                        <Text className="text-gray-400 text-center text-sm leading-6">Empowering travel agents with the most advanced GDS flight booking solution in the market.</Text>
                    </View>

                    <View className="px-8 -mt-8">
                        <View style={{ elevation: 8 }} className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-300/40 border border-slate-100 border-b-[8px] border-slate-200">
                            <Text className="text-[#F07E21] font-black text-[10px] uppercase mb-4 tracking-widest">Our Mission</Text>
                            <Text className="text-gray-800 text-lg font-bold leading-8 mb-8">
                                ZayaFly is a leading B2B travel portal providing agents with access to real-time seat availability and wholesale pricing across 700+ airlines globally. 
                            </Text>

                            <View className="space-y-6">
                                {[
                                    { title: 'Global Reach', desc: 'Direct GDS connections to LCC and Full Service carriers across 190 countries.', icon: '🌐' },
                                    { title: 'Best-in-Class Support', desc: 'Dedicated support team ready to assist with cancellations, re-issues and complex itineraries.', icon: '🤝' },
                                    { title: 'Transparent Pricing', desc: 'No hidden fees. Full control over markups and service charges for your agency.', icon: '💎' }
                                ].map((item, idx) => (
                                    <View key={idx} className="flex-row items-start">
                                        <View className="w-12 h-12 rounded-2xl bg-gray-50 items-center justify-center mr-5">
                                            <Text className="text-xl">{item.icon}</Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[#1D4171] font-black text-sm mb-1">{item.title}</Text>
                                            <Text className="text-gray-400 text-xs leading-5 font-medium">{item.desc}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    <View className="p-8 mb-20">
                        <Text className="text-gray-300 text-[10px] font-black uppercase text-center">Version 2.5.0 • © 2026 ZayaFly Travel Group Ltd.</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
