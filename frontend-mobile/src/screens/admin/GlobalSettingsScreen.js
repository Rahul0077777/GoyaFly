import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';
import { adminService } from '../../services/api';

export default function GlobalSettingsScreen({ navigation }) {
    const t = useThemeColors();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [markupValue, setMarkupValue] = useState('0');

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await adminService.getGlobalSettings();
            if (res.success) {
                setSettings(res.data);
                setMarkupValue(String(res.data.defaultRefundMarkup || 0));
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load global settings' });
            }
        } catch (err) {
            console.error('Failed to fetch settings', err);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Could not connect to settings service' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleToggleMaintenance = async () => {
        const nextMode = !settings?.maintenanceMode;
        const msg = nextMode
            ? 'Enable Maintenance Mode? All agent bookings will be suspended across all platforms.'
            : 'Switch platform back to LIVE mode? Agents will be able to make bookings.';

        Alert.alert(
            nextMode ? 'Enable Maintenance?' : 'Go LIVE?',
            msg,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: nextMode ? 'Enable' : 'Go Live', onPress: async () => {
                    try {
                        setUpdating(true);
                        const res = await adminService.updateGlobalSettings({ maintenanceMode: nextMode });
                        if (res.success) {
                            setSettings(res.data);
                            Toast.show({ type: 'success', text1: 'Success', text2: `Platform mode set to ${nextMode ? 'MAINTENANCE' : 'LIVE'}` });
                        }
                    } catch (err) {
                        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update maintenance mode' });
                    } finally {
                        setUpdating(false);
                    }
                }},
            ]
        );
    };

    const handleToggleService = async (serviceField, displayName) => {
        const nextValue = !settings?.[serviceField];
        try {
            setUpdating(true);
            const res = await adminService.updateGlobalSettings({ [serviceField]: nextValue });
            if (res.success) {
                setSettings(res.data);
                Toast.show({ type: 'success', text1: 'Success', text2: `${displayName} has been ${nextValue ? 'enabled' : 'disabled'}` });
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: `Failed to update ${displayName}` });
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveMarkup = async () => {
        const numVal = Number(markupValue);
        if (isNaN(numVal) || numVal < 0) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a valid positive number' });
            return;
        }
        try {
            setUpdating(true);
            const res = await adminService.updateGlobalSettings({ defaultRefundMarkup: numVal });
            if (res.success) {
                setSettings(res.data);
                Toast.show({ type: 'success', text1: 'Success', text2: 'Refund markup saved successfully' });
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save refund markup' });
        } finally {
            setUpdating(false);
        }
    };

    const handleRegenerateKeys = () => {
        Alert.alert('Regenerate API Keys', 'This will invalidate all current API tokens. Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Regenerate', style: 'destructive', onPress: async () => {
                try {
                    setUpdating(true);
                    const newToken = 'SECURE_' + Math.random().toString(36).substring(2).toUpperCase() + '_' + Date.now();
                    const res = await adminService.updateGlobalSettings({ 
                        apiKeys: { ...settings?.apiKeys, 'Master Token': newToken } 
                    });
                    if (res.success) {
                        setSettings(res.data);
                        Toast.show({ type: 'success', text1: 'Regenerated', text2: 'New Master API Token generated.' });
                    }
                } catch (err) {
                    Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to regenerate tokens' });
                } finally {
                    setUpdating(false);
                }
            } },
        ]);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={t.primary} />
                <Text style={{ color: t.textMuted }} className="mt-5 font-black uppercase text-[10px] tracking-widest">Syncing with Governance Layer...</Text>
            </View>
        );
    }

    const apiStatuses = settings?.apiStatuses || {};
    const apiKeys = settings?.apiKeys || {};
    const maintenance = settings?.maintenanceMode || false;

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

                {updating && (
                    <View className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center">
                        <View className="bg-slate-900 px-6 py-4 rounded-full shadow-2xl flex-row items-center">
                            <ActivityIndicator size="small" color="#fff" className="mr-3" />
                            <Text className="text-white font-black text-[10px] uppercase tracking-widest">Applying Changes...</Text>
                        </View>
                    </View>
                )}

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
                            <TouchableOpacity onPress={handleToggleMaintenance}
                                style={{ backgroundColor: maintenance ? '#dc2626' : '#22c55e', width: 56, height: 32, borderRadius: 16, justifyContent: 'center', paddingHorizontal: 4 }} className="shadow-md active:scale-95">
                                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', transform: [{ translateX: maintenance ? 24 : 0 }] }} className="shadow-sm" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-slate-400 text-xs font-bold leading-5 mb-6">
                            Switching to Maintenance Mode will instantly suspend all agent booking capabilities across web and mobile platforms.
                        </Text>

                        <TouchableOpacity onPress={handleToggleMaintenance}
                            className={`w-full py-4 rounded-2xl items-center border border-b-4 shadow-md active:scale-95 ${maintenance ? 'bg-emerald-600 border-emerald-600 border-b-emerald-700 shadow-emerald-500/20' : 'bg-slate-900 border-slate-900 border-b-slate-800 shadow-slate-900/20'}`}>
                            <Text className="text-white font-black text-xs uppercase tracking-widest">
                                {maintenance ? 'Restore Live Operations' : 'Enable Maintenance Mode'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Default Refund Markup */}
                    <View style={{ backgroundColor: t.card, elevation: 8 }}
                        className="rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-7 mb-6">
                        <View className="flex-row items-center justify-between mb-1">
                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Refund Markup</Text>
                            <Ionicons name="cash" size={24} color="#f59e0b" />
                        </View>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Default Cancellation markup (₹)</Text>

                        <View className="mb-4">
                            <TextInput
                                style={{ fontSize: 20, fontWeight: 'bold', color: t.text }}
                                value={markupValue}
                                onChangeText={setMarkupValue}
                                keyboardType="numeric"
                                placeholder="Enter markup in ₹"
                                className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black shadow-inner"
                            />
                        </View>
                        <Text className="text-slate-400 text-xs font-bold leading-5 mb-6">
                            This deduction will be subtracted automatically from cancellation refunds before crediting the agent wallet.
                        </Text>

                        <TouchableOpacity onPress={handleSaveMarkup}
                            className="w-full py-4 rounded-2xl items-center bg-amber-500 border border-amber-500 border-b-amber-600 shadow-amber-500/20 shadow-md active:scale-95">
                            <Text className="text-white font-black text-xs uppercase tracking-widest">Save Markup</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Service Toggles */}
                    <View style={{ backgroundColor: t.card, elevation: 8 }}
                        className="rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-7 mb-6">
                        <View className="flex-row items-center justify-between mb-1">
                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Service Toggles</Text>
                            <Ionicons name="toggle" size={24} color="#a855f7" />
                        </View>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Enable / Disable Specific Features</Text>

                        {/* OTB Toggle */}
                        <View className="flex-row justify-between items-center py-4 border-b border-slate-100">
                            <View className="flex-1 pr-2">
                                <Text style={{ color: t.text }} className="font-black text-sm tracking-wide">OTB Service</Text>
                                <Text className="text-[10px] font-bold text-slate-400">Ok To Board requests for agents</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleToggleService('otbServiceActive', 'OTB Service')}
                                style={{ backgroundColor: settings?.otbServiceActive ? '#22c55e' : '#ef4444', width: 56, height: 32, borderRadius: 16, justifyContent: 'center', paddingHorizontal: 4 }} className="shadow-md active:scale-95">
                                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', transform: [{ translateX: settings?.otbServiceActive ? 24 : 0 }] }} className="shadow-sm" />
                            </TouchableOpacity>
                        </View>

                        {/* Fixed Departure Toggle */}
                        <View className="flex-row justify-between items-center py-4">
                            <View className="flex-1 pr-2">
                                <Text style={{ color: t.text }} className="font-black text-sm tracking-wide">Fixed Departure</Text>
                                <Text className="text-[10px] font-bold text-slate-400">Group flight departure search & book</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleToggleService('fixedDepartureServiceActive', 'Fixed Departure')}
                                style={{ backgroundColor: settings?.fixedDepartureServiceActive ? '#22c55e' : '#ef4444', width: 56, height: 32, borderRadius: 16, justifyContent: 'center', paddingHorizontal: 4 }} className="shadow-md active:scale-95">
                                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', transform: [{ translateX: settings?.fixedDepartureServiceActive ? 24 : 0 }] }} className="shadow-sm" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* API Connectivity */}
                    <View style={{ backgroundColor: t.card, elevation: 8 }}
                        className="rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-7 mb-6">
                        <View className="flex-row items-center justify-between mb-1">
                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">API Connectivity</Text>
                            <Ionicons name="pulse" size={24} color="#3b82f6" />
                        </View>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Service Integration Health</Text>

                        {Object.entries(apiStatuses).map(([name, status], i, arr) => {
                            const isOnline = status === 'Online';
                            const statusColor = isOnline ? '#22c55e' : '#f97316';
                            return (
                                <View key={name}
                                    style={{ borderBottomWidth: i !== arr.length - 1 ? 1 : 0, borderBottomColor: t.isDark ? '#1e293b' : '#f1f5f9' }}
                                    className="flex-row justify-between items-center py-4 px-2">
                                    <View className="flex-row items-center flex-1 pr-2">
                                        <View className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 items-center justify-center mr-3 shadow-inner">
                                            <Ionicons name="globe" size={16} color="#0f172a" />
                                        </View>
                                        <Text style={{ color: t.text }} className="font-black text-sm tracking-wide">{name}</Text>
                                    </View>
                                    <View className="flex-row items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                                        <View style={{ backgroundColor: statusColor, width: 8, height: 8, borderRadius: 4 }} className="mr-2" />
                                        <Text style={{ color: statusColor }} className="text-[10px] font-black uppercase tracking-wider">{status}</Text>
                                    </View>
                                </View>
                            );
                        })}
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
                                {apiKeys['Master Token'] || 'NO_TOKEN_DEFINED'}
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
