import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../utils/themeColors';
import { holidayService, BASE_URL } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


const DubaiIcon = () => (
    <View className="w-20 h-20 items-center justify-center">
        <Text className="text-4xl">🏙️</Text>
    </View>
);

const MaldivesIcon = () => (
    <View className="w-20 h-20 items-center justify-center">
        <Text className="text-4xl">🏝️</Text>
    </View>
);

const RajasthanIcon = () => (
    <View className="w-20 h-20 items-center justify-center">
        <Text className="text-4xl">🏰</Text>
    </View>
);

export default function HolidaysScreen({ navigation }) {
    const t = useThemeColors();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const fetchPackages = useCallback(async (query = '') => {
        try {
            const res = await holidayService.getPackages(query);
            if (res.success) {
                setPackages(res.data);
            }
        } catch (err) {
            console.error('Failed to load holiday packages', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchPackages();
    }, [fetchPackages]);

    const handleSearch = () => {
        setLoading(true);
        fetchPackages(search);
    };

    const getIcon = (iconType) => {
        switch (iconType) {
            case 'DUBAI': return <DubaiIcon />;
            case 'MALDIVES': return <MaldivesIcon />;
            case 'RAJASTHAN': return <RajasthanIcon />;
            default: return <Text className="text-4xl">🌴</Text>;
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-6 py-4 flex-row items-center border-b border-gray-50 bg-white">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 w-10 h-10 bg-gray-50 rounded-xl items-center justify-center">
                        <Ionicons name="chevron-back" size={20} color="#000" />
                    </TouchableOpacity>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black">Holiday Plans</Text>
                        <Text style={{ color: t.textMuted }} className="font-bold uppercase text-[9px]">Curated global experiences</Text>
                    </View>
                </View>

                <ScrollView 
                    className="flex-1" 
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchPackages(search);}} />}
                >
                    {/* Search Bar */}
                    <View className="px-6 mt-6 mb-4">
                        <View style={{ backgroundColor: t.card }} className="border border-gray-100 rounded-[2rem] px-6 py-2 flex-row items-center shadow-xl shadow-slate-200/50">
                            <Ionicons name="search" size={20} color={t.primary} />
                            <TextInput
                                placeholder="Search destinations like Dubai, Bali..."
                                placeholderTextColor="#9ca3af"
                                value={search}
                                onChangeText={setSearch}
                                onSubmitEditing={handleSearch}
                                className="flex-1 text-gray-900 font-bold text-sm h-14 ml-3"
                            />
                        </View>
                    </View>

                    {loading ? (
                        <View className="py-20 items-center justify-center">
                            <ActivityIndicator size="large" color={t.primary} />
                            <Text className="mt-4 text-gray-400 font-bold uppercase text-[10px] tracking-widest">Loading exotic destinations...</Text>
                        </View>
                    ) : packages.length === 0 ? (
                        <View className="py-20 items-center justify-center px-10 text-center">
                            <Text className="text-6xl mb-6">🏜️</Text>
                            <Text style={{ color: t.text }} className="text-xl font-black mb-2">No destinations found</Text>
                            <Text style={{ color: t.textMuted }} className="font-bold uppercase text-xs text-center tracking-widest">Try searching for something else like "Dubai" or "Maldives"</Text>
                        </View>
                    ) : (
                        <View className="px-6 pb-20">
                            {packages.map((p) => (
                                <TouchableOpacity 
                                    key={p._id || p.id} 
                                    onPress={() => navigation.navigate('ServiceCheckout', { service: 'HOLIDAY', item: p })}
                                    style={{ backgroundColor: t.card }} 
                                    className="rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-gray-50 mb-8 active:scale-[0.98]"
                                >
                                    {/* Image/Icon Header */}
                                    <View className="h-56 bg-gray-50 relative">
                                        {p.images && p.images.length > 0 ? (
                                            <Image 
                                                source={{ uri: `${BASE_URL}${p.images[0]}` }} 
                                                className="w-full h-full"
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View className="w-full h-full items-center justify-center">
                                                {getIcon(p.iconType)}
                                            </View>
                                        )}
                                        <LinearGradient
                                            colors={['transparent', 'rgba(0,0,0,0.4)']}
                                            className="absolute bottom-0 left-0 right-0 h-24"
                                        />
                                        <View className="absolute bottom-4 left-6 flex-row items-center gap-2">
                                            <View className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                                                <Text className="text-white font-black text-[10px] uppercase tracking-widest">{p.days}</Text>
                                            </View>
                                        </View>
                                        {p.images && p.images.length > 1 && (
                                            <View className="absolute bottom-4 right-6 bg-black/60 px-3 py-1 rounded-full">
                                                <Text className="text-white text-[9px] font-black tracking-widest">📷 {p.images.length} PHOTOS</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Content */}
                                    <View className="p-8">
                                        <View className="flex-row justify-between items-start mb-4">
                                            <View className="flex-1">
                                                <Text style={{ color: t.text }} className="text-2xl font-black leading-tight mb-1">{p.title}</Text>
                                                <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest">Customizable Expert Plan</Text>
                                            </View>
                                        </View>

                                        {/* Highlights */}
                                        <View className="flex-row flex-wrap gap-2 mb-6">
                                            {p.highlights?.slice(0, 3).map((h, idx) => (
                                                <View key={idx} className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                                    <Text className="text-[9px] font-black uppercase text-gray-400 tracking-wider">{h}</Text>
                                                </View>
                                            ))}
                                        </View>

                                        {/* Price & Action */}
                                        <View className="flex-row items-center justify-between pt-6 border-t border-gray-50">
                                            <View>
                                                <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Agent Net Fare</Text>
                                                <Text style={{ color: t.text }} className="text-3xl font-black leading-none">₹{p.price?.toLocaleString('en-IN')}</Text>
                                            </View>
                                            <View className="bg-slate-900 px-6 py-4 rounded-2xl shadow-lg shadow-slate-300">
                                                <Text className="text-white font-black text-[10px] tracking-widest uppercase">BOOK TRIP</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
