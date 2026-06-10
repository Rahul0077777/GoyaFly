import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Image, ImageBackground, RefreshControl, Dimensions, Platform, Modal, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../utils/themeColors';
import { holidayService, BASE_URL } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GLOBAL_CITIES } from '../../constants/globalCities';
import { INDIAN_DISTRICTS } from '../../constants/indianDistricts';

const ALL_DESTINATIONS = [...GLOBAL_CITIES, ...INDIAN_DISTRICTS];

const { width } = Dimensions.get('window');

const CATEGORIES = [
    { id: 1, name: 'Beach Holidays', desc: 'Sun, Sand & Sea', icon: '🏖️' },
    { id: 2, name: 'Hill Stations', desc: 'Mountains & Views', icon: '🏔️' },
    { id: 3, name: 'City Breaks', desc: 'Explore Cities', icon: '🏙️' },
    { id: 4, name: 'Spiritual', desc: 'Peace & Serenity', icon: '🕉️' },
    { id: 5, name: 'Adventure', desc: 'Thrill & Explore', icon: '🎒' }
];

const BENEFITS = [
    { icon: '🛡️', title: '100% Secure', desc: 'Safe & trusted bookings' },
    { icon: '💰', title: 'Best Price Guarantee', desc: 'Get the lowest prices always' },
    { icon: '☎️', title: '24/7 Support', desc: 'We are just a call away' },
    { icon: '✨', title: 'Handpicked Experiences', desc: 'Curated with care' }
];



export default function HolidaysScreen({ navigation }) {
    const t = useThemeColors();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [location, setLocation] = useState('Dubai');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [expandedCards, setExpandedCards] = useState({});
    
    const [showCityModal, setShowCityModal] = useState(false);
    const [citySearch, setCitySearch] = useState('');

    const filteredCities = useMemo(() => {
        if (!citySearch) return ALL_DESTINATIONS;
        return ALL_DESTINATIONS.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));
    }, [citySearch]);

    const handleCitySelect = (c) => {
        setLocation(c);
        setShowCityModal(false);
        setCitySearch('');
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) setDate(selectedDate);
    };

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
        fetchPackages(location);
    };

    const stripHtml = (html) => {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, '');
    };

    const toggleExpand = (id) => {
        setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="light" />
            <ScrollView 
                className="flex-1" 
                showsVerticalScrollIndicator={false}
                bounces={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchPackages(location);}} />}
            >
                {/* ── HERO SECTION ── */}
                <ImageBackground
                    source={{ uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop' }}
                    style={{ width: '100%', height: 320 }}
                >
                    <LinearGradient
                        colors={['rgba(29,65,113,0.95)', 'rgba(45,90,150,0.7)']}
                        start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                        style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingHorizontal: 20 }}
                    >
                        <View className="flex-row items-center justify-between mb-6">
                            <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center backdrop-blur-md">
                                <Ionicons name="chevron-back" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        
                        <View className="flex-row justify-between items-start">
                            <View className="flex-1 pr-4">
                                <Text className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">Dashboard / Holidays</Text>
                                <Text className="text-4xl font-black text-white mb-2 leading-tight">Holiday{'\n'}Plans</Text>
                                <Text className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Curated Global Experiences</Text>
                                <Text className="text-xs font-bold text-blue-100 uppercase tracking-wider">Designed for your elite travelers</Text>
                            </View>
                            <Text className="text-6xl opacity-30 mt-4">✈️</Text>
                        </View>
                        <Text className="absolute top-16 right-10 text-5xl opacity-40">🎈</Text>
                    </LinearGradient>
                </ImageBackground>

                {/* ── SEAMLESS SEARCH BAR ── */}
                <View className="px-5 -mt-6 mb-8">
                    <TouchableOpacity onPress={() => setShowCityModal(true)} className="mb-3 bg-white rounded-2xl p-4 flex-row items-center shadow-sm border border-slate-100 active:bg-slate-50">
                        <Ionicons name="location" size={20} color="#1D4171" style={{ marginRight: 10 }} />
                        <View className="flex-1">
                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</Text>
                            <Text className="text-[#1D4171] font-bold text-base">{location || 'Select Destination'}</Text>
                        </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} className="mb-4 bg-white rounded-2xl p-4 flex-row items-center shadow-sm border border-slate-100 active:bg-slate-50">
                        <Ionicons name="calendar" size={20} color="#1D4171" style={{ marginRight: 10 }} />
                        <View className="flex-1">
                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Travel Date</Text>
                            <Text className="text-[#1D4171] font-bold text-base">
                                {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                            minimumDate={new Date()}
                        />
                    )}

                    <TouchableOpacity
                        onPress={handleSearch}
                        className="bg-[#1D4171] py-4 rounded-2xl flex-row items-center justify-center shadow-md active:scale-[0.98]"
                    >
                        <Ionicons name="search" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text className="text-white font-black text-xs uppercase tracking-widest">Search Packages</Text>
                    </TouchableOpacity>
                </View>

                {/* ── CATEGORIES ── */}
                <View className="mb-10">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }} className="flex-row">
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity key={cat.id} style={{ backgroundColor: t.card }} className="mr-4 p-4 rounded-3xl items-center justify-center w-28 border border-slate-100 shadow-sm">
                                <Text className="text-4xl mb-3">{cat.icon}</Text>
                                <Text style={{ color: '#1D4171' }} className="text-xs font-black text-center mb-1">{cat.name}</Text>
                                <Text className="text-[9px] text-slate-500 font-bold text-center">{cat.desc}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* ── POPULAR DESTINATIONS ── */}
                <View className="px-5 mb-10">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text style={{ color: '#1D4171' }} className="text-2xl font-black">Popular Destinations</Text>
                        <TouchableOpacity>
                            <Text className="text-[#F07E21] text-xs font-black uppercase tracking-wider">View All</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row overflow-visible">
                        {packages.slice(0, 4).map((p, idx) => (
                            <TouchableOpacity key={p._id || p.id} onPress={() => navigation.navigate('ServiceCheckout', { service: 'HOLIDAY', item: p })} style={{ backgroundColor: t.card }} className="w-56 mr-5 rounded-[2rem] overflow-hidden border border-slate-100 shadow-lg active:scale-[0.98]">
                                <View className="h-32 bg-gray-200">
                                    {p.images && p.images.length > 0 ? (
                                        <Image source={{ uri: `${BASE_URL}${p.images[0]}` }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <View className="w-full h-full items-center justify-center bg-blue-100/50"><Text className="text-4xl">🏝️</Text></View>
                                    )}
                                    {idx === 0 && (
                                        <View style={{ backgroundColor: '#3b82f6' }} className="absolute top-3 left-3 px-3 py-1 rounded-full">
                                            <Text className="text-white text-[9px] font-black uppercase">🔥 Popular</Text>
                                        </View>
                                    )}
                                    {p.days && (
                                        <View className="absolute top-3 right-3 bg-[#F07E21] px-3 py-1 rounded-full">
                                            <Text className="text-white text-[9px] font-black uppercase">{p.days}</Text>
                                        </View>
                                    )}
                                </View>
                                <View className="p-4">
                                    <Text style={{ color: '#1D4171' }} className="text-lg font-black mb-1" numberOfLines={1}>{p.title}</Text>
                                    <Text className="text-[10px] text-slate-500 font-bold uppercase mb-1">Starting from</Text>
                                    <Text style={{ color: '#1D4171' }} className="text-xl font-black">₹{p.price?.toLocaleString('en-IN')}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* ── WHY BOOK WITH GOYAFLY ── */}
                <View className="mb-10">
                    <LinearGradient
                        colors={['#1D4171', '#2D5A96']}
                        start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                        className="py-10 px-5"
                    >
                        <Text className="text-white text-2xl font-black text-center mb-8">Why book with GoyaFly Holidays?</Text>
                        <View className="flex-row flex-wrap justify-between">
                            {BENEFITS.map((benefit, idx) => (
                                <View key={idx} className="w-[48%] mb-4 bg-white/10 rounded-3xl p-5 items-center border border-white/20">
                                    <Text className="text-4xl mb-3">{benefit.icon}</Text>
                                    <Text className="text-white text-sm font-black text-center mb-1">{benefit.title}</Text>
                                    <Text className="text-blue-200 text-[10px] font-bold text-center">{benefit.desc}</Text>
                                </View>
                            ))}
                        </View>
                    </LinearGradient>
                </View>

                {/* ── ALL HOLIDAY PACKAGES ── */}
                <View className="px-5 pb-24">
                    <Text style={{ color: '#1D4171' }} className="text-2xl font-black mb-6">All Holiday Packages</Text>
                    {loading ? (
                        <View className="py-20 items-center justify-center">
                            <ActivityIndicator size="large" color="#1D4171" />
                            <Text className="mt-4 text-gray-400 font-bold uppercase text-[10px] tracking-widest">Finding the perfect getaways...</Text>
                        </View>
                    ) : packages.length === 0 ? (
                        <View className="py-20 items-center justify-center text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <Text className="text-6xl mb-6">🏜️</Text>
                            <Text style={{ color: '#1D4171' }} className="text-xl font-black mb-2">No packages found</Text>
                            <Text style={{ color: t.textMuted }} className="font-bold text-xs text-center">Check back soon for more exciting destinations!</Text>
                        </View>
                    ) : (
                        packages.map((p) => {
                            const cleanDesc = stripHtml(p.description) || `Experience the ultimate luxury getaway with our curated ${p.title} package.`;
                            const isExpanded = expandedCards[p._id || p.id];
                            
                            return (
                                <TouchableOpacity 
                                    key={p._id || p.id} 
                                    onPress={() => navigation.navigate('ServiceCheckout', { service: 'HOLIDAY', item: p })}
                                    style={{ backgroundColor: t.card }} 
                                    className="rounded-[2.5rem] overflow-hidden shadow-lg shadow-slate-200/50 border border-slate-100 mb-6 active:scale-[0.98]"
                                >
                                    <View className="h-56 bg-slate-100 relative">
                                        {p.images && p.images.length > 0 ? (
                                            <Image source={{ uri: `${BASE_URL}${p.images[0]}` }} className="w-full h-full" resizeMode="cover" />
                                        ) : (
                                            <View className="w-full h-full items-center justify-center bg-blue-100/50"><Text className="text-6xl">🏝️</Text></View>
                                        )}
                                        {p.days && (
                                            <View className="absolute bottom-4 left-4 bg-white/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/40">
                                                <Text className="text-white font-black text-[10px] uppercase tracking-widest">{p.days}</Text>
                                            </View>
                                        )}
                                    </View>
                                    
                                    <View className="p-6">
                                        <Text style={{ color: '#1D4171' }} className="text-xl font-black leading-tight mb-2">{p.title}</Text>
                                        <Text numberOfLines={isExpanded ? undefined : 2} className="text-[11px] text-slate-500 font-medium mb-2 leading-relaxed">
                                            {cleanDesc}
                                        </Text>
                                        
                                        {(p.description || cleanDesc.length > 100) && (
                                            <TouchableOpacity onPress={() => toggleExpand(p._id || p.id)} className="mb-4">
                                                <Text className="text-[10px] font-black text-[#F07E21] uppercase tracking-wider">
                                                    {isExpanded ? 'Show Less ▲' : 'Show More ▼'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        <View className="flex-row flex-wrap gap-2 mb-6">
                                            {p.highlights?.slice(0, 3).map((h, idx) => (
                                                <View key={idx} className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                    <Text className="text-[9px] font-black uppercase text-slate-500 tracking-wider">{h}</Text>
                                                </View>
                                            ))}
                                        </View>

                                        <View className="flex-row items-center justify-between pt-5 border-t border-slate-100">
                                            <View>
                                                <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Starting from</Text>
                                                <Text style={{ color: '#1D4171' }} className="text-2xl font-black leading-none">₹{p.price?.toLocaleString('en-IN')}</Text>
                                            </View>
                                            <View className="bg-[#F07E21] px-5 py-3 rounded-xl border-b-4 border-[#D96B18] shadow-md shadow-orange-500/30">
                                                <Text className="text-white font-black text-[10px] tracking-widest uppercase">BOOK TRIP</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* ── CITY SELECTION MODAL ── */}
            <Modal visible={showCityModal} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: t.bg, marginTop: Platform.OS === 'ios' ? 44 : 0 }}>
                    <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: t.divider, backgroundColor: t.card }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', mb: 16 }}>
                            <TouchableOpacity onPress={() => setShowCityModal(false)} style={{ padding: 4 }}>
                                <Ionicons name="close" size={28} color={t.text} />
                            </TouchableOpacity>
                            <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: t.text, marginRight: 32 }}>
                                Select Destination
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.input, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: t.inputBorder, marginTop: 16 }}>
                            <Ionicons name="search" size={20} color={t.textMuted} />
                            <TextInput
                                autoFocus
                                value={citySearch}
                                onChangeText={setCitySearch}
                                placeholder="Search any city worldwide..."
                                placeholderTextColor={t.placeholder}
                                style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16, color: t.text, fontWeight: 'bold' }}
                            />
                            {citySearch.length > 0 && (
                                <TouchableOpacity onPress={() => setCitySearch('')}>
                                    <Ionicons name="close-circle" size={20} color={t.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    <FlatList
                        data={filteredCities}
                        keyExtractor={(item, index) => item + index}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ padding: 20 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => handleCitySelect(item)}
                                style={{ paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: t.divider, flexDirection: 'row', alignItems: 'center' }}
                            >
                                <Text className="text-xl mr-4">📍</Text>
                                <Text style={{ fontSize: 16, fontWeight: '800', color: t.text }}>{item}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <Text style={{ color: t.textMuted, fontSize: 16, fontWeight: 'bold' }}>No cities found</Text>
                            </View>
                        }
                    />
                </View>
            </Modal>
        </View>
    );
}
