import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';

const API_SERVICES = [
    { name: 'Sabre GDS', status: 'Online', color: '#22c55e', icon: 'airplane' },
    { name: 'Amadeus', status: 'Online', color: '#22c55e', icon: 'globe' },
    { name: 'BusIndia API', status: 'Degraded', color: '#f97316', icon: 'bus' },
    { name: 'Wallet Service', status: 'Online', color: '#22c55e', icon: 'wallet' },
];

export default function GlobalSettingsScreen({ navigation }) {
    const t = useThemeColors();
    const [maintenance, setMaintenance] = useState(false);

    const handleMaintenanceToggle = () => {
        const msg = maintenance
            ? 'Switch platform back to LIVE mode? Agents will be able to make bookings.'
            : 'Enable Maintenance Mode? All agent bookings will be suspended across all platforms.';

        Alert.alert(
            maintenance ? 'Go LIVE?' : 'Enable Maintenance?',
            msg,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: maintenance ? 'Go Live' : 'Enable', onPress: () => {
                    setMaintenance(!maintenance);
                    Toast.show({ type: 'info', text1: 'Platform Mode', text2: `Platform is now ${!maintenance ? 'LIVE' : 'in MAINTENANCE'}` });
                }},
            ]
        );
    };

    const handleRegenerateKeys = () => {
        Alert.alert('Regenerate API Keys', 'This will invalidate all current API tokens. Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Regenerate', style: 'destructive', onPress: () => Toast.show({ type: 'success', text1: 'Regenerated', text2: 'New API keys generated.' }) },
        ]);
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style={t.statusBar} />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-5 py-5 flex-row items-center border-b border-slate-100 mb-2">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm mr-3.5">
                        <Ionicons name="arrow-back" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="bg-slate-100 w-12 h-12 rounded-2xl items-center justify-center border border-slate-200 shadow-sm mr-3.5">
                        <Ionicons name="settings" size={24} color="#475569" />
                    </View>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">System Core Settings</Text>
                        <Text className="text-slate-400 font-black uppercase tracking-widest text-[10px] mt-0.5">Master Control Console</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 px-5 pt-2" showsVerticalScrollIndicator={false}>
                    {/* Platform Mode */}
                    <View style={{ backgroundColor: t.card, elevation: 8 }}
                        className="rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-7 mb-6">
                        <View className="flex-row items-center justify-between mb-1">
                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Platform Mode</Text>
                            <Ionicons name="power" size={24} color={maintenance ? '#ef4444' : '#22c55e'} />
                        </View>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Operational State Control</Text>

                        <View style={{ backgroundColor: maintenance ? '#fef2f2' : '#f0fdf4', borderColor: maintenance ? '#fca5a5' : '#bbf7d0', borderWidth: 1 }}
                            className="flex-row justify-between items-center p-5 rounded-2xl mb-4 shadow-sm">
                            <View className="flex-row items-center flex-1 pr-2">
                                <Ionicons name={maintenance ? "warning" : "checkmark-circle"} size={22} color={maintenance ? '#dc2626' : '#15803d'} className="mr-2" />
                                <Text style={{ color: maintenance ? '#dc2626' : '#15803d' }} className="font-black text-sm tracking-wider">
                                    {maintenance ? 'MAINTENANCE MODE' : 'LIVE / ONLINE'}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={handleMaintenanceToggle}
                                style={{ backgroundColor: maintenance ? '#dc2626' : '#22c55e', width: 56, height: 32, borderRadius: 16, justifyContent: 'center', paddingHorizontal: 4 }} className="shadow-md active:scale-95">
                                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', transform: [{ translateX: maintenance ? 24 : 0 }] }} className="shadow-sm" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-slate-400 text-xs font-bold leading-5 mb-6">
                            Switching to Maintenance Mode will instantly suspend all agent booking capabilities across web and mobile platforms.
                        </Text>

                        <TouchableOpacity onPress={handleMaintenanceToggle}
                            className={`w-full py-4 rounded-2xl items-center border border-b-4 shadow-md active:scale-95 ${maintenance ? 'bg-emerald-600 border-emerald-600 border-b-emerald-700 shadow-emerald-500/20' : 'bg-slate-900 border-slate-900 border-b-slate-800 shadow-slate-900/20'}`}>
                            <Text className="text-white font-black text-xs uppercase tracking-widest">
                                {maintenance ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* API Connectivity */}
                    <View style={{ backgroundColor: t.card, elevation: 8 }}
                        className="rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-7 mb-6">
                        <View className="flex-row items-center justify-between mb-1">
                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">API Connectivity</Text>
                            <Ionicons name="pulse" size={24} color="#3b82f6" />
                        </View>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Service Integration Health</Text>

                        {API_SERVICES.map((s, i) => (
                            <View key={s.name}
                                style={{ borderBottomWidth: i !== API_SERVICES.length - 1 ? 1 : 0, borderBottomColor: t.isDark ? '#1e293b' : '#f1f5f9' }}
                                className="flex-row justify-between items-center py-4 px-2">
                                <View className="flex-row items-center flex-1 pr-2">
                                    <View className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 items-center justify-center mr-3 shadow-inner">
                                        <Ionicons name={s.icon} size={16} color="#0f172a" />
                                    </View>
                                    <Text style={{ color: t.text }} className="font-black text-sm tracking-wide">{s.name}</Text>
                                </View>
                                <View className="flex-row items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                                    <View style={{ backgroundColor: s.color, width: 8, height: 8, borderRadius: 4 }} className="mr-2" />
                                    <Text style={{ color: s.color }} className="text-[10px] font-black uppercase tracking-wider">{s.status}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Master API Tokens */}
                    <View style={{ backgroundColor: t.card, elevation: 8 }}
                        className="rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-7 mb-10">
                        <View className="flex-row items-center justify-between mb-1">
                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Master API Tokens</Text>
                            <Ionicons name="key" size={24} color="#1D4171" />
                        </View>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">System-wide authorization keys</Text>

                        <View className="bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-100 shadow-inner">
                            <Text className="font-mono text-xs font-black text-[#1D4171] tracking-widest text-center">
                                XYZ_SECURE_TOKEN_**********************************
                            </Text>
                        </View>

                        <TouchableOpacity onPress={handleRegenerateKeys}
                            className="bg-[#1D4171] py-5 rounded-2xl items-center border border-[#1D4171] border-b-[6px] border-b-[#11294a] shadow-xl shadow-blue-900/20 active:scale-95">
                            <Text className="text-white font-black text-xs uppercase tracking-widest">Regenerate All Keys</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
