import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';

export default function BusTrainSearchScreen({ navigation }) {
    const t = useThemeColors();
    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-4 py-4 flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                        <Text className="text-2xl">←</Text>
                    </TouchableOpacity>
                    <View className="bg-green-50 p-3 rounded-2xl mr-3">
                        <Text className="text-2xl">🚌</Text>
                    </View>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black">Bus & Trains</Text>
                        <Text style={{ color: t.textMuted }} className="font-bold uppercase text-[9px]">Surface transport</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-6 rounded-3xl shadow-2xl border border-gray-100 mb-6">
                        <View className="mb-4">
                            <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase mb-2 ml-1">📍 From</Text>
                            <TextInput
                                placeholder="Enter origin city"
                                style={{ backgroundColor: t.input }} className="rounded-2xl px-5 py-4 font-bold text-gray-800 text-sm border border-gray-100"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                        <View className="mb-4">
                            <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase mb-2 ml-1">📍 To</Text>
                            <TextInput
                                placeholder="Enter destination city"
                                style={{ backgroundColor: t.input }} className="rounded-2xl px-5 py-4 font-bold text-gray-800 text-sm border border-gray-100"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                        <View className="mb-4">
                            <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase mb-2 ml-1">📅 Travel Date</Text>
                            <View style={{ backgroundColor: t.input }} className="rounded-2xl px-5 py-4 border border-gray-100">
                                <Text className="font-bold text-gray-800 text-sm">Select Date</Text>
                            </View>
                        </View>

                        <TouchableOpacity className="mt-2 active:scale-95">
                            <LinearGradient
                                colors={['#F07E21', '#ff9844']}
                                style={{ paddingVertical: 20, borderRadius: 16, alignItems: 'center' }}
                            >
                                <Text className="text-white font-black text-base uppercase">SEARCH</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View className="bg-green-50 border border-green-200 p-5 rounded-2xl mb-10">
                        <Text className="text-green-900 font-black text-sm mb-1">🚆 Rail Integration</Text>
                        <Text className="text-green-700 font-medium text-xs leading-5">
                            IRCTC and private bus APIs are being integrated. Check back soon for live availability.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
