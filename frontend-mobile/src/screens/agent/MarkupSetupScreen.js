import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';
import { agentService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function MarkupSetupScreen({ navigation }) {
    const t = useThemeColors();
    const [markups, setMarkups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchMarkups = useCallback(async () => {
        try {
            const res = await agentService.getMarkups();
            if (res.success) {
                // Backend usually returns an object or array. 
                // Web uses: { flightDomestic, flightInternational, hotel, bus, train }
                const d = res.data || {};
                setMarkups([
                    { key: 'flightDomestic',      label: 'Domestic Flights',      type: d.flightDomestic?.type || 'Flat',       value: String(d.flightDomestic?.value || 0),      icon: '✈️' },
                    { key: 'flightInternational', label: 'International Flights', type: d.flightInternational?.type || 'Flat',  value: String(d.flightInternational?.value || 0), icon: '🌍' },
                    { key: 'hotel',               label: 'Hotels',                type: d.hotel?.type || 'Percentage',          value: String(d.hotel?.value || 0),               icon: '🏨' },
                    { key: 'bus',                 label: 'Buses',                 type: d.bus?.type || 'Flat',                  value: String(d.bus?.value || 0),                 icon: '🚌' },
                    { key: 'train',               label: 'Trains',                type: d.test?.type || 'Flat',                 value: String(d.train?.value || 0),               icon: '🚆' }
                ]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchMarkups(); }, [fetchMarkups]);

    const handleSave = async (item) => {
        setSaving(true);
        try {
            const payload = {
                [item.key]: {
                    type: item.type,
                    value: Number(item.value)
                }
            };
            const res = await agentService.updateMarkup(payload);
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Markup Saved', text2: `${item.label} markup updated.` });
            }
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to sync markup with server.' });
        } finally {
            setSaving(false);
        }
    };

    const toggleType = (idx) => {
        const copy = [...markups];
        copy[idx].type = copy[idx].type === 'Flat' ? 'Percentage' : 'Flat';
        setMarkups(copy);
    };

    if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator color={t.secondary} /></View>;

    return (
        <View style={{ flex: 1, backgroundColor: t.isDark ? '#0f172a' : '#f8fafc' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-6 py-6 flex-row items-center border-b border-gray-100 bg-white">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 w-10 h-10 bg-gray-50 rounded-xl items-center justify-center">
                        <Ionicons name="chevron-back" size={20} color="#000" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-2xl font-black text-slate-900">Profit Margins</Text>
                        <Text className="text-slate-400 text-[9px] font-black uppercase">Synchronized Agent Markups</Text>
                    </View>
                </View>

                <ScrollView 
                    className="flex-1 px-6" 
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchMarkups();}} />}
                >
                    <View className="mt-8">
                        {markups.map((m, idx) => (
                            <View key={m.key} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 mb-6 group">
                                <View className="flex-row justify-between items-start mb-6">
                                    <View className="flex-row items-center gap-4">
                                        <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center">
                                            <Text className="text-2xl">{m.icon}</Text>
                                        </View>
                                        <View>
                                            <Text style={{ color: t.text }} className="text-lg font-black leading-tight">{m.label}</Text>
                                            <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase mt-1">Direct Profit Add-on</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => toggleType(idx)} className={`px-4 py-2 rounded-xl ${m.type === 'Flat' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                                        <Text className={`text-[9px] font-black uppercase ${m.type === 'Flat' ? 'text-blue-600' : 'text-purple-600'}`}>{m.type}</Text>
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-row gap-4 items-center">
                                    <View className="flex-1 bg-gray-50 rounded-[1.5rem] px-8 py-5 flex-row items-center relative border border-gray-50">
                                        <Text className="text-slate-300 font-black text-xl mr-2">{m.type === 'Flat' ? '₹' : '%'}</Text>
                                        <TextInput
                                            keyboardType="numeric"
                                            value={m.value}
                                            onChangeText={(v) => {
                                                const copy = [...markups];
                                                copy[idx].value = v;
                                                setMarkups(copy);
                                            }}
                                            className="flex-1 font-black text-2xl"
                                            style={{ color: t.text }}
                                            placeholder="0"
                                        />
                                    </View>
                                    <TouchableOpacity 
                                        onPress={() => handleSave(m)} disabled={saving}
                                        style={{ backgroundColor: t.primary }}
                                        className="h-16 w-16 rounded-[1.5rem] items-center justify-center shadow-lg"
                                    >
                                        {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark" size={24} color="#fff" />}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] mb-20 flex-row gap-6">
                        <View className="w-12 h-12 bg-amber-100 rounded-full items-center justify-center">
                            <Ionicons name="warning" size={24} color="#b45309" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-amber-900 font-black text-sm mb-1 uppercase">Financial Warning</Text>
                            <Text className="text-amber-800 text-[11px] font-bold leading-5 opacity-70">
                                Markup settings are synchronized globally 🌎. Changes made here will instantly affect your search results on both web and mobile platforms.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
