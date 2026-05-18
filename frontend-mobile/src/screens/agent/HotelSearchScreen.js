import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';

export default function HotelSearchScreen({ navigation }) {
    const t = useThemeColors();
    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-4 py-4 flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                        <Text className="text-2xl">←</Text>
                    </TouchableOpacity>
                    <View className="bg-orange-50 p-3 rounded-2xl mr-3">
                        <Text className="text-2xl">🏨</Text>
                    </View>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black">Hotel Search</Text>
                        <Text style={{ color: t.textMuted }} className="font-bold uppercase text-[9px]">Global inventory</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="p-6 rounded-3xl shadow-2xl border border-gray-100 relative overflow-hidden mb-6">
                        <View className="absolute top-0 right-0 w-28 h-28 bg-orange-50 rounded-full -mr-10 -mt-10" />

                        <View className="mb-4">
                            <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase mb-2 ml-1">📍 Destination</Text>
                            <TextInput
                                placeholder="City, Area, or Landmark"
                                style={{ backgroundColor: t.input }} className="rounded-2xl px-5 py-4 font-bold text-gray-800 text-sm border border-gray-100"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        <View className="flex-row justify-between mb-4">
                            <View className="flex-1 mr-3">
                                <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase mb-2 ml-1">📅 Check In</Text>
                                <View style={{ backgroundColor: t.input }} className="rounded-2xl px-5 py-4 border border-gray-100">
                                    <Text className="font-bold text-gray-800 text-sm">Select Date</Text>
                                </View>
                            </View>
                            <View className="flex-1 ml-3">
                                <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase mb-2 ml-1">📅 Check Out</Text>
                                <View style={{ backgroundColor: t.input }} className="rounded-2xl px-5 py-4 border border-gray-100">
                                    <Text className="font-bold text-gray-800 text-sm">Select Date</Text>
                                </View>
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase mb-2 ml-1">👥 Guests & Rooms</Text>
                            <View style={{ backgroundColor: t.input }} className="rounded-2xl px-5 py-4 border border-gray-100">
                                <Text className="font-bold text-gray-800 text-sm">2 Adults, 1 Room</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('HotelResults', {})}
                            className="mt-2 active:scale-95"
                        >
                            <LinearGradient
                                colors={['#F07E21', '#ff9844']}
                                style={{ paddingVertical: 20, borderRadius: 16, alignItems: 'center' }}
                            >
                                <Text className="text-white font-black text-base uppercase">SEARCH HOTELS</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
