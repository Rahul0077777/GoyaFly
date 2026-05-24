import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';
import { Ionicons } from '@expo/vector-icons';

// Exact mock list from web HotelSearch.jsx
const DUMMY_HOTELS = [
    { id: 'H1', name: 'The Grand Palace', city: 'Mumbai', location: 'Andheri East, Mumbai', rating: 4, price: 10000, taxes: 1800, fees: 200, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80', stars: '⭐⭐⭐⭐' },
    { id: 'H2', name: 'Taj Sea View', city: 'Mumbai', location: 'Colaba, Mumbai', rating: 5, price: 25000, taxes: 4500, fees: 500, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', stars: '⭐⭐⭐⭐⭐' },
    { id: 'H3', name: 'Trident Nariman Point', city: 'Mumbai', location: 'Nariman Point, Mumbai', rating: 5, price: 18000, taxes: 3200, fees: 400, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80', stars: '⭐⭐⭐⭐⭐' },
    { id: 'H4', name: 'Novotel Juhu Beach', city: 'Mumbai', location: 'Juhu, Mumbai', rating: 4, price: 12000, taxes: 2100, fees: 300, image: 'https://images.unsplash.com/photo-1551882547-ff43c63faf76?auto=format&fit=crop&w=800&q=80', stars: '⭐⭐⭐⭐' },
    { id: 'H5', name: 'ITC Maratha', city: 'Mumbai', location: 'Sahar, Mumbai', rating: 5, price: 15000, taxes: 2700, fees: 400, image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80', stars: '⭐⭐⭐⭐⭐' },
    { id: 'H6', name: 'Radisson Blu', city: 'Delhi', location: 'Dwarka, New Delhi', rating: 4, price: 8000, taxes: 1400, fees: 200, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80', stars: '⭐⭐⭐⭐' },
    { id: 'H7', name: 'Leela Palace', city: 'Delhi', location: 'Chanakyapuri, New Delhi', rating: 5, price: 28000, taxes: 5000, fees: 600, image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80', stars: '⭐⭐⭐⭐⭐' },
    { id: 'H8', name: 'JW Marriott', city: 'Bangalore', location: 'Vittal Mallya Road, Bangalore', rating: 5, price: 16000, taxes: 2800, fees: 400, image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80', stars: '⭐⭐⭐⭐⭐' },
    { id: 'H9', name: 'Hyatt Centric', city: 'Bangalore', location: 'MG Road, Bangalore', rating: 4, price: 9500, taxes: 1700, fees: 250, image: 'https://images.unsplash.com/photo-1529290130-4ca3753253ae?auto=format&fit=crop&w=800&q=80', stars: '⭐⭐⭐⭐' },
    { id: 'H10', name: 'Holiday Inn', city: 'Chennai', location: 'OMR IT Expressway, Chennai', rating: 4, price: 6500, taxes: 1100, fees: 150, image: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=800&q=80', stars: '⭐⭐⭐⭐' },
];

export default function HotelResultsScreen({ navigation, route }) {
    const t = useThemeColors();
    const { city = 'Mumbai', checkIn, checkOut, rooms = 1, adults = 1 } = route.params || {};

    const displayedHotels = city 
        ? DUMMY_HOTELS.filter(h => h.city.toLowerCase() === city.toLowerCase())
        : DUMMY_HOTELS;

    const handleBook = (hotel) => {
        navigation.navigate('HotelCheckout', {
            hotel,
            search: {
                city,
                checkIn,
                checkOut,
                rooms,
                adults
            }
        });
    };

    const renderHotelItem = ({ item }) => (
        <View 
            style={{ backgroundColor: '#fff' }} 
            className="mx-5 mb-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-xl overflow-hidden"
        >
            {/* Image & Stars Badge */}
            <View className="h-48 overflow-hidden relative">
                <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                <View className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full shadow-sm">
                    <Text className="text-[10px] font-black text-slate-800">{item.stars}</Text>
                </View>
                <View className="absolute top-3 right-3 bg-red-500 px-3 py-1 rounded-full shadow-sm">
                    <Text className="text-white text-[8px] font-black uppercase tracking-wider">Exclusive Deal</Text>
                </View>
            </View>

            {/* Hotel Meta info */}
            <View className="p-6">
                <Text className="text-lg font-black text-slate-900 leading-tight mb-1" numberOfLines={1}>
                    {item.name}
                </Text>
                <Text className="text-xs text-slate-400 font-bold mb-4">
                    📍 {item.location}
                </Text>

                {/* Footer Price + Action */}
                <View className="flex-row justify-between items-end pt-4 border-t border-slate-50">
                    <View className="flex-1">
                        <Text className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-0.5">Starting From</Text>
                        <Text className="text-xl font-black text-[#1D4171] leading-none">₹{item.price.toLocaleString('en-IN')}</Text>
                        <Text className="text-slate-400 text-[8px] font-bold mt-1">+ ₹{item.taxes} taxes</Text>
                    </View>
                    
                    <TouchableOpacity
                        onPress={() => handleBook(item)}
                        className="px-5 py-3 bg-[#FF9F43] rounded-xl border border-b-4 border-[#e28329] active:scale-95 shadow-md shadow-orange-500/20"
                    >
                        <Text className="text-white font-black text-[10px] uppercase tracking-wider">
                            Book Now
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

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
                    <View className="flex-1">
                        <Text className="text-lg font-black text-slate-900 leading-tight">Hotels in {city}</Text>
                        <Text className="text-slate-400 font-bold uppercase text-[8px] tracking-widest mt-0.5">{displayedHotels.length} Properties Available</Text>
                    </View>
                </View>

                {displayedHotels.length > 0 ? (
                    <FlatList
                        data={displayedHotels}
                        renderItem={renderHotelItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingTop: 20, paddingBottom: 30 }}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View className="flex-1 items-center justify-center p-8">
                        <Text className="text-5xl mb-4 opacity-50">🏨</Text>
                        <Text className="text-base font-black text-slate-800">No Hotels Found</Text>
                        <Text className="text-xs text-slate-400 text-center font-bold mt-2 leading-5">
                            We couldn't find any premium hotels in "{city}". Try searching for Mumbai, Delhi, or Bangalore.
                        </Text>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}
