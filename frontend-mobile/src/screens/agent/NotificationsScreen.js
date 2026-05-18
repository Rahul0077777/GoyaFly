import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { agentService } from '../../services/api';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';

export default function NotificationsScreen({ navigation }) {
    const t = useThemeColors();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await agentService.getNotifications();
            if (res.success) setNotifications(res.data);
        } catch (error) {
            console.error('Fetch Notifications Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    const handleMarkAsRead = async (id) => {
        try {
            const res = await agentService.markNotificationRead(id);
            if (res.success) {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id) => {
        try {
            await agentService.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (e) { console.error(e); }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            onPress={() => !item.isRead && handleMarkAsRead(item._id)}
            style={{ backgroundColor: item.isRead ? t.card : '#f0f9ff', elevation: 6 }}
            className={`mx-4 mb-4 p-6 rounded-[2.5rem] border border-b-[8px] shadow-xl flex-row items-center active:scale-95 ${!item.isRead ? 'border-blue-200 border-b-blue-300 shadow-blue-500/20' : 'border-slate-100 border-b-slate-200 shadow-slate-300/30'}`}
        >
            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${item.isRead ? 'bg-gray-50' : 'bg-blue-100'}`}>
                <Ionicons name={item.icon || 'notifications'} size={24} color={item.isRead ? '#94a3b8' : '#48A0D4'} />
            </View>
            <View className="flex-1 mr-2">
                <View className="flex-row justify-between items-center mb-1">
                    <Text className={`text-sm font-black ${item.isRead ? 'text-gray-600' : 'text-blue-900'}`}>{item.title}</Text>
                    <Text className="text-[9px] font-bold text-gray-400 uppercase">{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text className={`text-[11px] leading-5 ${item.isRead ? 'text-gray-400' : 'text-blue-700 font-medium'}`}>{item.message}</Text>
            </View>
            {item.isRead && (
                <TouchableOpacity 
                    onPress={() => handleDelete(item._id)}
                    className="w-10 h-10 bg-red-50 border border-red-100 border-b-4 border-red-200 rounded-2xl items-center justify-center ml-2 shadow-sm active:scale-95"
                >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 py-6 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="w-11 h-11 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 shadow-sm mr-4 active:scale-95">
                            <Ionicons name="chevron-back" size={20} color="#000" />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ color: t.text }} className="text-3xl font-black">Notifications</Text>
                            <Text style={{ color: t.textMuted }} className="font-bold uppercase text-[9px] mt-1">Live Updates & Alerts</Text>
                        </View>
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#F07E21" /></View>
                ) : (
                    <FlatList
                        data={notifications}
                        renderItem={renderItem}
                        keyExtractor={item => item._id}
                        onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
                        refreshing={refreshing}
                        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
                        ListEmptyComponent={
                            <View className="py-24 items-center">
                                <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-6">
                                    <Ionicons name="notifications-off-outline" size={40} color="#cbd5e1" />
                                </View>
                                <Text className="font-black text-slate-300 uppercase text-xs">Inbox is quiet</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
