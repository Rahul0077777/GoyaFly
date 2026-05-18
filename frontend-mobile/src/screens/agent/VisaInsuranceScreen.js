import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../utils/themeColors';
import { visaService, BASE_URL } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function VisaInsuranceScreen({ navigation }) {
    const t = useThemeColors();
    const [activeTab, setActiveTab] = useState('VISA'); // VISA or INSURANCE
    const [visas, setVisas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedVisa, setSelectedVisa] = useState(null); // For requirements check

    const fetchVisas = useCallback(async (query = '') => {
        try {
            const res = await visaService.getPackages(query);
            if (res.success) {
                setVisas(res.data);
            }
        } catch (err) {
            console.error('Failed to load visas', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'VISA') {
            fetchVisas();
        } else {
            setLoading(false);
        }
    }, [activeTab, fetchVisas]);

    const handleSearch = () => {
        setLoading(true);
        fetchVisas(search);
    };

    const insurancePlans = [
        { id: 1, provider: 'TATA AIG', title: 'Travel Guard Plus', coverage: 'Global', price: 999, icon: '🛡️', color: '#1d4171' },
        { id: 2, provider: 'HDFC ERGO', title: 'Explorer Plan', coverage: 'Schengen Special', price: 1250, icon: '✈️', color: '#f07e21' },
        { id: 3, provider: 'Reliance', title: 'Smart Travel', coverage: 'Asia/Pacific', price: 450, icon: '🌏', color: '#48a0d4' },
    ];

    const renderVisaTab = () => (
        <View className="px-6">
            {/* Search */}
            <View style={{ backgroundColor: t.card }} className="border border-gray-100 rounded-[2rem] px-6 py-2 flex-row items-center shadow-xl shadow-slate-200/50 mb-8">
                <Ionicons name="search" size={20} color={t.primary} />
                <TextInput
                    placeholder="Search country (e.g. Russia, UAE)..."
                    placeholderTextColor="#9ca3af"
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={handleSearch}
                    className="flex-1 text-gray-900 font-bold text-sm h-14 ml-3"
                />
            </View>

            {loading ? (
                <View className="py-20 items-center">
                    <ActivityIndicator color={t.primary} size="large" />
                    <Text className="mt-4 text-gray-400 font-bold uppercase text-[10px] tracking-widest">Accessing Visa Database...</Text>
                </View>
            ) : visas.length === 0 ? (
                <View className="py-20 items-center opacity-50">
                    <Text className="text-6xl mb-4">🛂</Text>
                    <Text className="font-black text-gray-400 uppercase text-xs tracking-widest">No visa plans found</Text>
                </View>
            ) : (
                visas.map((v) => (
                    <View key={v._id} style={{ backgroundColor: t.card }} className="rounded-[2.5rem] border border-gray-50 shadow-xl p-8 mb-6">
                        <View className="flex-row justify-between items-start mb-6">
                            <View className="flex-row items-center gap-4">
                                <View className="w-14 h-14 bg-slate-50 rounded-2xl items-center justify-center overflow-hidden">
                                    {v.images?.[0] ? (
                                        <Image source={{ uri: `${BASE_URL}${v.images[0]}` }} className="w-full h-full object-cover" />
                                    ) : (
                                        <Text className="text-3xl">{v.flag || '🌏'}</Text>
                                    )}
                                </View>
                                <View>
                                    <Text style={{ color: t.text }} className="text-xl font-black">{v.country}</Text>
                                    <Text className="text-emerald-500 font-black text-[9px] uppercase tracking-widest">{v.type || 'E-VISA'}</Text>
                                </View>
                            </View>
                            <View className="items-end">
                                <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Fee Starts</Text>
                                <Text style={{ color: t.text }} className="text-xl font-black">₹{v.price}</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-2 mb-6">
                            <TouchableOpacity 
                                onPress={() => setSelectedVisa(selectedVisa?._id === v._id ? null : v)}
                                className="flex-1 bg-slate-50 py-4 rounded-xl items-center border border-slate-100"
                            >
                                <Text className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    {selectedVisa?._id === v._id ? 'Hide Documents' : 'Check Requirements'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => navigation.navigate('ServiceCheckout', { service: 'VISA', item: v })}
                                className="flex-1 bg-slate-900 py-4 rounded-xl items-center shadow-lg"
                            >
                                <Text className="text-[10px] font-black uppercase text-white tracking-widest">Apply Now</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedVisa?._id === v._id && (
                            <View className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 animate-fade-in">
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Mandatory Documents:</Text>
                                {v.requirements?.map((req, idx) => (
                                    <View key={idx} className="flex-row items-center gap-3 mb-2">
                                        <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                                        <Text className="text-xs font-bold text-slate-600">{req}</Text>
                                    </View>
                                ))}
                                {(!v.requirements || v.requirements.length === 0) && (
                                    <Text className="text-xs italic text-gray-400">Standard documents apply. Contact support for details.</Text>
                                )}
                            </View>
                        )}
                    </View>
                ))
            )}
        </View>
    );

    const renderInsuranceTab = () => (
        <View className="px-6">
            <View className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 mb-8 flex-row items-center gap-4">
                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
                    <Ionicons name="shield-checkmark" size={24} color="#1d4171" />
                </View>
                <View className="flex-1">
                    <Text className="text-blue-900 font-black text-sm uppercase">Secure Travel</Text>
                    <Text className="text-blue-800 text-[10px] font-bold opacity-70">Protect your clients with premium insurance coverage from top providers.</Text>
                </View>
            </View>

            {insurancePlans.map((plan) => (
                <TouchableOpacity 
                    key={plan.id}
                    onPress={() => navigation.navigate('ServiceCheckout', { service: 'INSURANCE', item: plan })}
                    style={{ backgroundColor: t.card }} 
                    className="rounded-[2.5rem] border border-gray-50 shadow-xl p-8 mb-6 active:scale-[0.98]"
                >
                    <View className="flex-row justify-between items-center mb-6">
                        <View className="flex-row items-center gap-4">
                            <View style={{ backgroundColor: `${plan.color}10` }} className="w-14 h-14 rounded-2xl items-center justify-center">
                                <Text className="text-3xl">{plan.icon}</Text>
                            </View>
                            <View>
                                <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-0.5">{plan.provider}</Text>
                                <Text style={{ color: t.text }} className="text-lg font-black">{plan.title}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </View>

                    <View className="flex-row justify-between items-end border-t border-gray-50 pt-6">
                        <View>
                            <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Coverage Scope</Text>
                            <Text className="text-slate-600 font-bold text-xs">{plan.coverage}</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Premium</Text>
                            <Text style={{ color: t.text }} className="text-2xl font-black">₹{plan.price}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-6 py-4 flex-row items-center bg-white">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 w-10 h-10 bg-gray-50 rounded-xl items-center justify-center">
                        <Ionicons name="chevron-back" size={20} color="#000" />
                    </TouchableOpacity>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black">Travel Services</Text>
                        <Text style={{ color: t.textMuted }} className="font-bold uppercase text-[9px]">Ancillary Support</Text>
                    </View>
                </View>

                {/* Tab Switcher */}
                <View className="flex-row px-6 mb-8 mt-2 bg-white">
                    {['VISA', 'INSURANCE'].map((tab) => (
                        <TouchableOpacity 
                            key={tab} 
                            onPress={() => setActiveTab(tab)}
                            className={`flex-1 py-4 items-center border-b-2 ${activeTab === tab ? 'border-[#1D4171]' : 'border-gray-50'}`}
                        >
                            <Text className={`font-black text-[11px] tracking-[0.2em] uppercase ${activeTab === tab ? 'text-[#1D4171]' : 'text-gray-300'}`}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView 
                    className="flex-1" 
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); if(activeTab === 'VISA') fetchVisas(search); else setRefreshing(false);}} />}
                >
                    {activeTab === 'VISA' ? renderVisaTab() : renderInsuranceTab()}
                    <View className="h-10" />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
