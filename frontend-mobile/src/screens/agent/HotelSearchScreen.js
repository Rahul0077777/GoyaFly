import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Local Asset
const hotelRoomImg = require('../../../assets/hotel_room.png');

// 100% Exact dummy hotels from Web HotelSearch.jsx
const DUMMY_HOTELS = [
    { id: 'H1', name: 'The Grand Palace', city: 'Mumbai', location: 'Andheri East, Mumbai', rating: 4, price: 10000, taxes: 1800, fees: 200, image: hotelRoomImg, stars: '⭐⭐⭐⭐' },
    { id: 'H2', name: 'Taj Sea View', city: 'Mumbai', location: 'Colaba, Mumbai', rating: 5, price: 25000, taxes: 4500, fees: 500, image: hotelRoomImg, stars: '⭐⭐⭐⭐⭐' },
    { id: 'H3', name: 'Trident Nariman Point', city: 'Mumbai', location: 'Nariman Point, Mumbai', rating: 5, price: 18000, taxes: 3200, fees: 400, image: hotelRoomImg, stars: '⭐⭐⭐⭐⭐' },
    { id: 'H4', name: 'Novotel Juhu Beach', city: 'Mumbai', location: 'Juhu, Mumbai', rating: 4, price: 12000, taxes: 2100, fees: 300, image: hotelRoomImg, stars: '⭐⭐⭐⭐' },
    { id: 'H5', name: 'ITC Maratha', city: 'Mumbai', location: 'Sahar, Mumbai', rating: 5, price: 15000, taxes: 2700, fees: 400, image: hotelRoomImg, stars: '⭐⭐⭐⭐⭐' },
    { id: 'H6', name: 'Radisson Blu', city: 'Delhi', location: 'Dwarka, New Delhi', rating: 4, price: 8000, taxes: 1400, fees: 200, image: hotelRoomImg, stars: '⭐⭐⭐⭐' },
    { id: 'H7', name: 'Leela Palace', city: 'Delhi', location: 'Chanakyapuri, New Delhi', rating: 5, price: 28000, taxes: 5000, fees: 600, image: hotelRoomImg, stars: '⭐⭐⭐⭐⭐' },
    { id: 'H8', name: 'JW Marriott', city: 'Bangalore', location: 'Vittal Mallya Road, Bangalore', rating: 5, price: 16000, taxes: 2800, fees: 400, image: hotelRoomImg, stars: '⭐⭐⭐⭐⭐' },
    { id: 'H9', name: 'Hyatt Centric', city: 'Bangalore', location: 'MG Road, Bangalore', rating: 4, price: 9500, taxes: 1700, fees: 250, image: hotelRoomImg, stars: '⭐⭐⭐⭐' },
    { id: 'H10', name: 'Holiday Inn', city: 'Chennai', location: 'OMR IT Expressway, Chennai', rating: 4, price: 6500, taxes: 1100, fees: 150, image: hotelRoomImg, stars: '⭐⭐⭐⭐' },
];

export default function HotelSearchScreen({ navigation }) {
    const [city, setCity] = useState('Mumbai');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [rooms, setRooms] = useState(1);
    const [adults, setAdults] = useState(1);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = () => {
        setIsSearching(true);
        setHasSearched(false);
        setTimeout(() => {
            setIsSearching(false);
            setHasSearched(true);
        }, 1200);
    };

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

    const displayedHotels = hasSearched
        ? DUMMY_HOTELS.filter(h => h.city.toLowerCase() === city.toLowerCase() || city.trim() === '')
        : DUMMY_HOTELS;

    return (
        <View style={{ flex: 1, backgroundColor: '#F4F7FE' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-5 py-4 flex-row items-center bg-white border-b border-slate-100 shadow-sm">
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 shadow-sm mr-4 active:scale-95"
                    >
                        <Ionicons name="chevron-back" size={22} color="#1A56DB" />
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

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Search Form Card */}
                    <View className="bg-white p-6 mx-5 mt-5 rounded-[2rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-xl relative overflow-hidden mb-8" style={{ elevation: 8 }}>
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
                                        <TouchableOpacity onPress={() => rooms > 1 && setRooms(rooms - 1)} className="w-6 h-6 bg-white border border-slate-200 rounded-lg items-center justify-center active:scale-95"><Text className="font-bold text-xs">-</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => setRooms(rooms + 1)} className="w-6 h-6 bg-white border border-slate-200 rounded-lg items-center justify-center active:scale-95"><Text className="font-bold text-xs">+</Text></TouchableOpacity>
                                    </View>
                                </View>
                                <View className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 flex-row justify-between items-center px-4 py-3 shadow-inner">
                                    <View>
                                        <Text className="text-[8px] font-black text-slate-400 uppercase">Adults</Text>
                                        <Text className="text-xs font-black text-slate-800">{adults}</Text>
                                    </View>
                                    <View className="flex-row gap-1">
                                        <TouchableOpacity onPress={() => adults > 1 && setAdults(adults - 1)} className="w-6 h-6 bg-white border border-slate-200 rounded-lg items-center justify-center active:scale-95"><Text className="font-bold text-xs">-</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => setAdults(adults + 1)} className="w-6 h-6 bg-white border border-slate-200 rounded-lg items-center justify-center active:scale-95"><Text className="font-bold text-xs">+</Text></TouchableOpacity>
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
                                className="bg-[#1A56DB] rounded-2xl py-4 items-center border border-b-[6px] border-[#103a9c] shadow-lg shadow-blue-500/20"
                            >
                                {isSearching ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white font-black text-sm uppercase tracking-widest">
                                        SEARCH HOTELS
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Inline Loading Spinner */}
                    {isSearching && (
                        <View className="py-20 flex-col items-center justify-center">
                            <ActivityIndicator size="large" color="#1A56DB" className="mb-4" />
                            <Text className="font-black text-slate-400 uppercase tracking-widest text-xs">Finding best deals...</Text>
                        </View>
                    )}

                    {/* Results Section */}
                    {!isSearching && (
                        <View className="mt-2">
                            <Text className="text-lg font-black text-slate-900 border-l-4 border-[#1A56DB] pl-3 py-0.5 mb-6 mx-5">
                                {hasSearched ? `Found ${displayedHotels.length} hotels in ${city}` : 'Featured Hotels'}
                            </Text>

                            {displayedHotels.length > 0 ? (
                                displayedHotels.map(hotel => (
                                    <View 
                                        key={hotel.id}
                                        style={{ backgroundColor: '#fff' }} 
                                        className="mx-5 mb-6 rounded-[2rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-lg overflow-hidden"
                                    >
                                        {/* Image & Badges */}
                                        <View className="h-48 overflow-hidden relative">
                                            <Image source={hotel.image} className="w-full h-full" resizeMode="cover" />
                                            <View className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full shadow-sm">
                                                <Text className="text-[10px] font-black text-slate-800">{hotel.stars}</Text>
                                            </View>
                                            <View className="absolute top-3 right-3 bg-red-500 px-3 py-1 rounded-full shadow-sm">
                                                <Text className="text-white text-[8px] font-black uppercase tracking-wider">Exclusive Deal</Text>
                                            </View>
                                        </View>

                                        {/* Details */}
                                        <View className="p-6">
                                            <Text className="text-lg font-black text-slate-900 leading-tight mb-1" numberOfLines={1}>
                                                {hotel.name}
                                            </Text>
                                            <Text className="text-xs text-slate-400 font-bold mb-4">
                                                📍 {hotel.location}
                                            </Text>

                                            {/* Footer Price + Action */}
                                            <View className="flex-row justify-between items-end pt-4 border-t border-slate-50">
                                                <View className="flex-1">
                                                    <Text className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-0.5">Starting From</Text>
                                                    <Text className="text-2xl font-black text-[#1A56DB] leading-none">₹{hotel.price.toLocaleString('en-IN')}</Text>
                                                    <Text className="text-slate-400 text-[8px] font-bold mt-1">+ ₹{hotel.taxes} taxes</Text>
                                                </View>
                                                
                                                <TouchableOpacity
                                                    onPress={() => handleBook(hotel)}
                                                    className="px-6 py-3 bg-[#FF9F43] rounded-xl border border-b-4 border-[#d67b22] active:scale-95 shadow-md shadow-orange-500/10"
                                                >
                                                    <Text className="text-white font-black text-[10px] uppercase tracking-wider">
                                                        Book Now
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View className="mx-5 py-20 items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                                    <Text className="text-5xl mb-4 opacity-50">🏨</Text>
                                    <Text className="text-base font-black text-slate-800">No hotels found in {city}</Text>
                                    <Text className="text-xs text-slate-400 text-center font-bold mt-2 leading-5 px-6">
                                        Try searching for Mumbai, Delhi, or Bangalore.
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
