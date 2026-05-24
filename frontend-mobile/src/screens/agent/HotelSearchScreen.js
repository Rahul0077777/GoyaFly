import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';
import { Ionicons } from '@expo/vector-icons';

export default function HotelSearchScreen({ navigation }) {
    const t = useThemeColors();
    const [city, setCity] = useState('Mumbai');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [rooms, setRooms] = useState(1);
    const [adults, setAdults] = useState(1);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = () => {
        setIsSearching(true);
        setTimeout(() => {
            setIsSearching(false);
            navigation.navigate('HotelResults', {
                city,
                checkIn,
                checkOut,
                rooms,
                adults
            });
        }, 1200);
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f4f7fe' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-5 py-4 flex-row items-center bg-white border-b border-slate-100 shadow-sm">
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 shadow-sm mr-4 active:scale-95"
                    >
                        <Ionicons name="chevron-back" size={22} color="#1D4171" />
                    </TouchableOpacity>
                    <View className="flex-row items-center gap-3">
                        <View className="bg-blue-50 p-2.5 rounded-2xl shadow-sm">
                            <Text className="text-xl">🏨</Text>
                        </View>
                        <View>
                            <Text className="text-xl font-black text-slate-900">Hotel Search</Text>
                            <Text className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-0.5">Global Premium Inventory</Text>
                        </View>
                    </View>
                </View>

                <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
                    {/* Search Form Card */}
                    <View className="bg-white p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl relative overflow-hidden mb-8" style={{ elevation: 8 }}>
                        <View className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16" />

                        {/* Destination */}
                        <View className="mb-5">
                            <Text className="text-slate-400 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">Destination City</Text>
                            <TextInput
                                value={city}
                                onChangeText={setCity}
                                placeholder="e.g. Mumbai, Delhi"
                                className="bg-slate-50 rounded-2xl px-5 py-4 font-black text-slate-900 text-sm border border-slate-100 shadow-inner"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        {/* Check-in & Check-out Dates */}
                        <View className="flex-row gap-4 mb-5">
                            <View className="flex-1">
                                <Text className="text-slate-400 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">Check In</Text>
                                <TextInput
                                    value={checkIn}
                                    onChangeText={setCheckIn}
                                    placeholder="YYYY-MM-DD"
                                    className="bg-slate-50 rounded-2xl px-4 py-4 font-black text-slate-900 text-sm text-center border border-slate-100 shadow-inner"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-400 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">Check Out</Text>
                                <TextInput
                                    value={checkOut}
                                    onChangeText={setCheckOut}
                                    placeholder="YYYY-MM-DD"
                                    className="bg-slate-50 rounded-2xl px-4 py-4 font-black text-slate-900 text-sm text-center border border-slate-100 shadow-inner"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </View>

                        {/* Rooms & Guests */}
                        <View className="mb-6">
                            <Text className="text-slate-400 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">Rooms & Guests</Text>
                            <View className="flex-row gap-3">
                                <View className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 flex-row justify-between items-center px-4 py-3 shadow-inner">
                                    <View>
                                        <Text className="text-[8px] font-black text-slate-400 uppercase">Rooms</Text>
                                        <Text className="text-xs font-black text-slate-800">{rooms}</Text>
                                    </View>
                                    <View className="flex-row gap-1">
                                        <TouchableOpacity onPress={() => rooms > 1 && setRooms(rooms - 1)} className="w-6 h-6 bg-white border border-slate-200 rounded-lg items-center justify-center"><Text className="font-bold text-xs">-</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => setRooms(rooms + 1)} className="w-6 h-6 bg-white border border-slate-200 rounded-lg items-center justify-center"><Text className="font-bold text-xs">+</Text></TouchableOpacity>
                                    </View>
                                </View>
                                <View className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 flex-row justify-between items-center px-4 py-3 shadow-inner">
                                    <View>
                                        <Text className="text-[8px] font-black text-slate-400 uppercase">Adults</Text>
                                        <Text className="text-xs font-black text-slate-800">{adults}</Text>
                                    </View>
                                    <View className="flex-row gap-1">
                                        <TouchableOpacity onPress={() => adults > 1 && setAdults(adults - 1)} className="w-6 h-6 bg-white border border-slate-200 rounded-lg items-center justify-center"><Text className="font-bold text-xs">-</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => setAdults(adults + 1)} className="w-6 h-6 bg-white border border-slate-200 rounded-lg items-center justify-center"><Text className="font-bold text-xs">+</Text></TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Search Button */}
                        <TouchableOpacity
                            onPress={handleSearch}
                            disabled={isSearching}
                            className="active:scale-95"
                        >
                            <View
                                style={{ paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: '#1D4171', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, overflow: 'hidden' }}
                                className="rounded-2xl border border-b-[6px] border-[#0f2444] relative"
                            >
                                <LinearGradient
                                    colors={['#1D4171', '#15305B']}
                                    start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                                    style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                                />
                                {isSearching ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white font-black text-sm uppercase tracking-widest relative z-10">
                                        Search Hotels →
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Featured Section Info */}
                    <View className="px-2">
                        <Text className="text-sm font-black text-slate-900 border-l-4 border-[#1D4171] pl-3 py-0.5 mb-4">Why Book With Us?</Text>
                        
                        {[
                            { title: 'Best Price Guaranteed', desc: 'Find lower prices elsewhere? We match it and give you more commission.', icon: '🏷️' },
                            { title: 'Worldwide Premium Properties', desc: 'Over 500,000+ luxury hotels, corporate suites and resorts at your fingertips.', icon: '🌍' },
                            { title: '24/7 Agency Care', desc: 'Dedicated booking operators to support changes, check-ins and invoicing.', icon: '🎧' }
                        ].map((item, i) => (
                            <View key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 border-b-4 border-slate-200 shadow-sm mb-4 flex-row items-center">
                                <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-4">
                                    <Text className="text-lg">{item.icon}</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="font-black text-slate-800 text-sm mb-1">{item.title}</Text>
                                    <Text className="text-slate-400 text-[10px] font-bold leading-4">{item.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
