import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { agentService, bookingService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../utils/themeColors';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
    const [balance, setBalance] = useState(0);
    const [stats, setStats] = useState(null);
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [agentName, setAgentName] = useState('Partner');
    const t = useThemeColors();

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem('agentToken');
            if (!token) return navigation.replace('Auth');
            
            const profileStr = await AsyncStorage.getItem('agentInfo');
            if (profileStr) {
                const profileObj = JSON.parse(profileStr);
                setAgentName(profileObj.agentName || profileObj.name || 'Partner');
            }
            
            const statRes = await agentService.getDashboardStats();
            if (statRes.success) { 
                setBalance(statRes.data.walletBalance || 0); 
                setStats(statRes.data); 
            }
            
            const bookRes = await bookingService.getAgentHistory();
            if (bookRes.success) { 
                setRecentBookings(bookRes.data.slice(0, 5)); 
            }
        } catch (error) { 
            console.error('Dashboard Data Error:', error); 
        } finally { 
            setLoading(false); 
            setRefreshing(false); 
        }
    };

    useEffect(() => { fetchData(); }, []);
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const services = [
        { id: 'flight', name: 'Flights', icon: 'airplane', color: '#48A0D4', path: 'Search' },
        { id: 'hotel', name: 'Hotels', icon: 'business', color: '#f59e0b', path: 'HotelSearch' },
        { id: 'bus', name: 'Buses', icon: 'bus', color: '#10b981', path: 'BusSearch' },
        { id: 'visa', name: 'Visa', icon: 'document-text', color: '#ef4444', path: 'VisaInsurance' },
        { id: 'holiday', name: 'Holidays', icon: 'sunny', color: '#06b6d4', path: 'Holidays' },
        { id: 'group', name: 'Groups', icon: 'people', color: '#ec4899', path: 'GroupFareRequest' },
        { id: 'fixed', name: 'Fixed', icon: 'rocket', color: '#1D4171', path: 'FixedDepartureSearch' },
        { id: 'otb', name: 'OTB', icon: 'checkmark-circle', color: '#f97316', path: 'OTB' },
    ];

    if (loading && !refreshing) {
        return (
            <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#F07E21" />
                <Text className="mt-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading Workspace...</Text>
            </View>
        );
    }

    const kycStatus = stats?.kycStatus;

    return (
        <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView
                    className="flex-1" showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F07E21" />}
                >
                    {/* Modern 3D Header */}
                    <View className="px-5 pt-5 pb-4 flex-row justify-between items-center">
                        <View>
                            <Text className="text-slate-400 text-[10px] font-black uppercase mb-0.5 tracking-widest">Welcome Back</Text>
                            <Text className="text-2xl font-black text-slate-900">
                                Hello, <Text className="text-[#F07E21]">{agentName.split(' ')[0]}</Text>
                            </Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Profile')}
                            className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 shadow-sm active:opacity-80"
                        >
                            <Ionicons name="person-outline" size={22} color="#1D4171" />
                        </TouchableOpacity>
                    </View>

                    {/* 3D KYC Alert Container */}
                    {(kycStatus === 'PENDING' || kycStatus === 'REJECTED') && (
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('KycStatus')}
                            className={`mx-5 mb-5 p-4 rounded-2xl flex-row items-center justify-between border border-b-4 shadow-sm active:scale-[0.98] ${
                                kycStatus === 'REJECTED' ? 'bg-red-50 border-red-100 border-b-red-200' : 'bg-orange-50 border-orange-100 border-b-orange-200'
                            }`}
                        >
                            <View className="flex-row items-center">
                                <Ionicons name={kycStatus === 'REJECTED' ? 'alert-circle' : 'time'} size={20} color={kycStatus === 'REJECTED' ? '#ef4444' : '#f59e0b'} />
                                <Text className="ml-3 font-bold text-xs text-slate-700">KYC Status: {kycStatus}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                        </TouchableOpacity>
                    )}

                    {/* Premium 3D Balance Card */}
                    <TouchableOpacity onPress={() => navigation.navigate('Wallet')} className="mx-5 mb-6 active:scale-[0.98]">
                        <LinearGradient 
                            colors={['#1D4171', '#15305B']} 
                            start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                            style={{ padding: 26, borderRadius: 32, shadowColor: '#1D4171', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)' }}
                        >
                            <View className="flex-row justify-between items-start mb-6">
                                <View>
                                    <Text className="text-blue-200/60 text-[10px] font-black uppercase mb-1.5 tracking-widest">Available Balance</Text>
                                    <Text className="text-4xl font-black text-white">₹{balance.toLocaleString('en-IN')}</Text>
                                </View>
                                <View className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center border border-white/20 shadow-inner">
                                    <Ionicons name="wallet-outline" size={24} color="#fff" />
                                </View>
                            </View>
                            <View className="flex-row items-center justify-between pt-2 border-t border-white/10">
                                <View className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                                    <Text className="text-white text-[9px] font-black uppercase tracking-wider">ID: {stats?.agentCode || '...'}</Text>
                                </View>
                                <Text className="text-blue-200 text-[10px] font-black uppercase tracking-wider">Tap to add funds ➔</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Services Grid - 3D Tactile Tiles */}
                    <View className="px-5 mb-6">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-slate-900 text-lg font-black tracking-wide">Main Services</Text>
                            <TouchableOpacity><Text className="text-[#F07E21] text-[10px] font-black uppercase tracking-wider">View All</Text></TouchableOpacity>
                        </View>
                        <View className="flex-row flex-wrap justify-between">
                            {services.map((s) => (
                                <TouchableOpacity
                                    key={s.id}
                                    onPress={() => navigation.navigate(s.path)}
                                    className="w-[22%] items-center mb-4 active:scale-95 transition-all"
                                >
                                    <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center mb-2 border border-slate-100 border-b-4 border-slate-200 shadow-sm" style={{ elevation: 4 }}>
                                        <Ionicons name={s.icon} size={26} color={s.color} />
                                    </View>
                                    <Text className="text-slate-600 font-bold text-[10px] text-center">{s.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Stats Row - 3D Extruded Cards */}
                    <View className="px-5 mb-8 flex-row justify-between">
                        <View className="w-[48%] bg-white p-5 rounded-[2rem] border border-slate-100 border-b-[6px] border-slate-200 shadow-sm" style={{ elevation: 6 }}>
                            <View className="w-11 h-11 bg-blue-50 rounded-2xl items-center justify-center mb-4 border border-blue-100 shadow-sm">
                                <Ionicons name="stats-chart" size={20} color="#48A0D4" />
                            </View>
                            <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Total Sales</Text>
                            <Text className="text-2xl font-black text-slate-900">{stats ? stats.totalBookings : '--'}</Text>
                        </View>
                        <View className="w-[48%] bg-[#F07E21] p-5 rounded-[2rem] border border-orange-400 border-b-[6px] border-[#D96B18] shadow-xl shadow-orange-500/30" style={{ elevation: 6 }}>
                            <View className="w-11 h-11 bg-white/20 rounded-2xl items-center justify-center mb-4 border border-white/20 shadow-inner">
                                <Ionicons name="trending-up" size={20} color="#fff" />
                            </View>
                            <Text className="text-orange-100 text-[9px] font-black uppercase mb-1 tracking-widest">Net Profits</Text>
                            <Text className="text-2xl font-black text-white">₹{stats ? stats.totalCommission.toLocaleString() : '--'}</Text>
                        </View>
                    </View>

                    {/* Recent Activities - 3D Container */}
                    <View className="px-5 mb-8">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-slate-900 text-lg font-black tracking-wide">Recent Activity</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Bookings')} className="flex-row items-center gap-1">
                                <Text className="text-[#1D4171] text-[10px] font-black uppercase tracking-wider">History</Text>
                                <Ionicons name="arrow-forward-circle" size={18} color="#1D4171" />
                            </TouchableOpacity>
                        </View>
                        
                        <View className="bg-white rounded-[2.5rem] p-6 border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-4" style={{ elevation: 8 }}>
                            {recentBookings.length === 0 ? (
                                <View className="py-8 items-center">
                                    <Text className="text-4xl mb-2">📜</Text>
                                    <Text className="text-slate-400 font-bold text-xs uppercase tracking-wider">No recent transactions</Text>
                                </View>
                            ) : (
                                recentBookings.map((b, i) => (
                                    <View key={b._id} className={`py-4 flex-row items-center justify-between ${i !== recentBookings.length - 1 ? 'border-b border-slate-50' : ''}`}>
                                        <View className="flex-row items-center flex-1">
                                            <View className="w-11 h-11 bg-slate-50 rounded-2xl items-center justify-center mr-4 border border-slate-100 shadow-sm">
                                                <Ionicons 
                                                    name={b.serviceType === 'FLIGHT' ? 'airplane' : b.serviceType === 'HOTEL' ? 'business' : 'ticket'} 
                                                    size={20} color="#1D4171" 
                                                />
                                            </View>
                                            <View className="flex-1 pr-2">
                                                <Text className="font-black text-sm text-slate-900 mb-0.5" numberOfLines={1}>{b.serviceType}</Text>
                                                <Text className="text-[10px] font-bold text-slate-400 uppercase">{b.providerReference || 'N/A'}</Text>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <Text className="font-black text-sm text-slate-900">₹{b.totalCost?.toLocaleString()}</Text>
                                            <Text className={`text-[8px] font-black px-2.5 py-1 rounded-lg mt-1 uppercase tracking-wider border ${
                                                b.status === 'CONFIRMED' ? 'text-green-700 bg-green-50 border-green-200' : 'text-orange-700 bg-orange-50 border-orange-200'
                                            }`}>{b.status}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>

                    <View className="h-10" />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
