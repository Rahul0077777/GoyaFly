import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';

const MOCK_HOTELS = [
    { id: '1', name: 'The Taj Mahal Palace', location: 'Colaba, Mumbai', rating: 5, price: 18500, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80', type: 'Luxury' },
    { id: '2', name: 'Oberoi Trident', location: 'Nariman Point, Mumbai', rating: 5, price: 12400, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', type: 'Premium' },
    { id: '3', name: 'Novotel Juhu', location: 'Juhu Beach, Mumbai', rating: 4, price: 8900, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80', type: 'Business' },
    { id: '4', name: 'Ibis Airport', location: 'Vile Parle, Mumbai', rating: 3, price: 4500, image: 'https://images.unsplash.com/photo-1551882547-ff43c63faf76?auto=format&fit=crop&w=800&q=80', type: 'Budget' },
];

export default function HotelResultsScreen({ navigation, route }) {
    const t = useThemeColors();
    const { destination = 'Mumbai' } = route.params || {};
    const [hotels] = useState(MOCK_HOTELS);

    const renderHotelItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('Checkout', { item, type: 'HOTEL' })}
            style={{ backgroundColor: t.card }} className="mx-4 mb-4 rounded-2xl shadow-lg border border-gray-100 overflow-hidden active:scale-[0.98]"
        >
            <Image source={{ uri: item.image }} className="w-full h-44" resizeMode="cover" />
            <View className="p-5">
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 pr-4">
                        <Text style={{ color: t.text }} className="text-lg font-black" numberOfLines={1}>{item.name}</Text>
                        <View className="flex-row items-center mt-1">
                            <Text className="text-sm mr-1">📍</Text>
                            <Text className="text-xs font-bold text-gray-400">{item.location}</Text>
                        </View>
                    </View>
                    <View className="items-end">
                        <Text style={{ color: t.textMuted }} className="text-[9px] font-bold uppercase mb-1">Per Night</Text>
                        <Text className="text-xl font-black text-[#1D4171]">₹{item.price.toLocaleString()}</Text>
                    </View>
                </View>
                <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <View className="flex-row items-center">
                        <View className="flex-row mr-3">
                            {[...Array(item.rating)].map((_, i) => (
                                <Text key={i} className="text-xs">⭐</Text>
                            ))}
                        </View>
                        <View className="bg-blue-50 px-2 py-1 rounded-lg">
                            <Text className="text-[9px] font-black text-blue-600 uppercase">{item.type}</Text>
                        </View>
                    </View>
                    <TouchableOpacity className="bg-[#F07E21] px-4 py-2 rounded-xl active:scale-95">
                        <Text className="text-white font-black text-[10px] uppercase">Book</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-4 py-4 flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                        <Text className="text-2xl">←</Text>
                    </TouchableOpacity>
                    <View className="bg-orange-50 p-2 rounded-xl mr-3">
                        <Text className="text-lg">🏨</Text>
                    </View>
                    <View>
                        <Text style={{ color: t.text }} className="text-xl font-black">Hotels in {destination}</Text>
                        <Text style={{ color: t.textMuted }} className="text-[9px] font-bold uppercase">{hotels.length} properties available</Text>
                    </View>
                </View>

                <FlatList
                    data={hotels}
                    renderItem={renderHotelItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>
        </View>
    );
}
