import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '../../context/ThemeContext';

export default function HomeScreen({ navigation }) {
    const [searchType, setSearchType] = useState('Flights');
    const { colorScheme } = useAppTheme();
    const isDark = colorScheme === 'dark';

    const services = [
        { name: 'Flights', icon: '✈️' },
        { name: 'Hotels', icon: '🏨' },
        { name: 'Buses', icon: '🚌' },
        { name: 'Trains', icon: '🚆' },
        { name: 'Visa', icon: '📄' },
        { name: 'Insurance', icon: '🛡️' }
    ];

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f4f7fe' }}>
            <StatusBar style={isDark ? 'light' : 'light'} />
            <Navbar />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* ═══ HERO SECTION ═══ */}
                <View className="relative overflow-hidden">
                    <LinearGradient
                        colors={isDark ? ['#0f172a', '#1D4171', '#0f172a'] : ['#1D4171', '#17365e', '#132c4d']}
                        style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 176 }}
                    >
                        <View className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#F07E21]/15 rounded-full -mr-[200px] -mt-[200px]" />
                        <View className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-[#48A0D4]/20 rounded-full -ml-[175px] -mb-[175px]" />
                        <View className="absolute top-1/2 right-1/4 w-[200px] h-[200px] bg-[#1D4171]/30 rounded-full" />

                        <View className="items-center z-10">
                            <Text className="text-4xl font-black text-white text-center leading-tight mt-2">
                                Experience{'\n'}
                                <Text className="text-[#F07E21]">Limitless</Text> Travel
                            </Text>
                            <Text className="text-[#48A0D4] text-center text-sm font-medium mt-5 px-4 leading-6">
                                The ultimate B2B platform for Flights, Hotels, Buses, and Trains. Get unparalleled rates, instant ticketing, and maximum margins.
                            </Text>
                        </View>
                    </LinearGradient>

                    {/* ═══ BOOKING WIDGET ═══ */}
                    <View style={{ backgroundColor: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)', elevation: 8 }} className="mx-4 -mt-32 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 p-3">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row p-1.5 mb-2">
                            {services.map((s) => (
                                <TouchableOpacity
                                    key={s.name}
                                    onPress={() => setSearchType(s.name)}
                                    style={{ borderRadius: 12, backgroundColor: searchType === s.name ? '#1D4171' : 'transparent' }}
                                    className="px-4 py-3 mx-1 items-center flex-row"
                                >
                                    <Text className="text-lg">{s.icon}</Text>
                                    <Text style={{ color: searchType === s.name ? '#fff' : (isDark ? '#94a3b8' : '#4b5563') }} className="ml-2 text-xs font-bold">{s.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: 16 }} className="p-5 shadow-lg">
                            {searchType === 'Flights' ? (
                                <View>
                                    <View className="mb-3">
                                        <Text style={{ color: isDark ? '#64748b' : '#6b7280' }} className="text-[9px] font-black uppercase mb-2 ml-1">✈️ From</Text>
                                        <View style={{ backgroundColor: isDark ? '#0f172a' : '#f9fafb', borderColor: isDark ? '#334155' : '#f3f4f6', borderRadius: 16 }} className="px-5 py-4 border">
                                            <Text style={{ color: isDark ? '#e2e8f0' : '#1f2937' }} className="font-bold text-sm">New Delhi (DEL)</Text>
                                        </View>
                                    </View>
                                    <View className="mb-3">
                                        <Text style={{ color: isDark ? '#64748b' : '#6b7280' }} className="text-[9px] font-black uppercase mb-2 ml-1">📍 To</Text>
                                        <View style={{ backgroundColor: isDark ? '#0f172a' : '#f9fafb', borderColor: isDark ? '#334155' : '#f3f4f6', borderRadius: 16 }} className="px-5 py-4 border">
                                            <Text style={{ color: isDark ? '#e2e8f0' : '#1f2937' }} className="font-bold text-sm">Mumbai (BOM)</Text>
                                        </View>
                                    </View>
                                    <View className="mb-4">
                                        <Text style={{ color: isDark ? '#64748b' : '#6b7280' }} className="text-[9px] font-black uppercase mb-2 ml-1">📅 Date</Text>
                                        <View style={{ backgroundColor: isDark ? '#0f172a' : '#f9fafb', borderColor: isDark ? '#334155' : '#f3f4f6', borderRadius: 16 }} className="px-5 py-4 border">
                                            <Text style={{ color: isDark ? '#e2e8f0' : '#1f2937' }} className="font-bold text-sm">Select Date</Text>
                                        </View>
                                    </View>

                                    <View style={{ borderTopColor: isDark ? '#334155' : '#f3f4f6' }} className="flex-row mb-4 border-t pt-4">
                                        <View className="flex-row items-center mr-6">
                                            <View className="w-4 h-4 rounded-full border-[5px] border-[#F07E21] mr-2" />
                                            <Text style={{ color: isDark ? '#94a3b8' : '#4b5563' }} className="text-sm font-bold">One Way</Text>
                                        </View>
                                        <View className="flex-row items-center">
                                            <View style={{ borderColor: isDark ? '#475569' : '#d1d5db' }} className="w-4 h-4 rounded-full border-2 mr-2" />
                                            <Text style={{ color: isDark ? '#94a3b8' : '#4b5563' }} className="text-sm font-bold">Round Trip</Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity onPress={() => navigation.navigate('Login')} className="bg-[#F07E21] py-5 rounded-2xl items-center flex-row justify-center border border-[#F07E21] border-b-[6px] border-b-[#D96B18] shadow-xl shadow-orange-500/30 active:scale-95">
                                        <Text className="text-white font-black text-sm uppercase tracking-widest">SEARCH</Text>
                                        <Text className="text-white font-black text-sm ml-2">→</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View className="py-12 items-center">
                                    <Text className="text-5xl mb-4">🚀</Text>
                                    <Text style={{ color: isDark ? '#94a3b8' : '#6b7280' }} className="text-lg font-bold">{searchType} coming soon!</Text>
                                    <Text style={{ color: isDark ? '#64748b' : '#9ca3af' }} className="text-sm mt-1">Explore flights now or check back later.</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* ═══ FEATURES SECTION ═══ */}
                <View className="px-4 mt-8 mb-6">
                    {[
                        { title: 'Instant Ticketing', desc: 'Book and issue tickets instantly using your integrated B2B wallet. 24/7 availability with zero delays.', icon: '⚡', gradient: ['#1D4171', '#17365e'] },
                        { title: 'Highest Margins', desc: 'Maximize profit with direct airline APIs and exclusive hotel supplier rates. Industry-leading commissions.', icon: '💰', gradient: ['#F07E21', '#ff9844'] },
                        { title: '24/7 Support', desc: 'Dedicated account managers and round-the-clock technical helpdesk exclusively for our partners.', icon: '🛡️', gradient: ['#48A0D4', '#22c55e'] },
                    ].map((item, idx) => (
                        <View key={idx} style={{ backgroundColor: isDark ? '#1e293b' : '#fff', elevation: 8 }} className="p-7 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 mb-6 relative overflow-hidden shadow-2xl shadow-slate-300/40">
                            <View style={{ backgroundColor: isDark ? '#0f172a' : '#f9fafb' }} className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-12 -mt-12" />
                            <LinearGradient
                                colors={item.gradient}
                                style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
                            >
                                <Text className="text-2xl">{item.icon}</Text>
                            </LinearGradient>
                            <Text style={{ color: isDark ? '#f1f5f9' : '#111827' }} className="text-xl font-black mb-2">{item.title}</Text>
                            <Text style={{ color: isDark ? '#94a3b8' : '#4b5563' }} className="text-sm font-medium leading-6">{item.desc}</Text>
                        </View>
                    ))}
                </View>

                {/* ═══ CTA SECTION ═══ */}
                <LinearGradient
                    colors={['#000000', '#1D4171', '#000000']}
                    style={{ paddingHorizontal: 24, paddingVertical: 48 }}
                >
                    <View className="absolute left-0 bottom-0 w-[300px] h-[300px] bg-[#1D4171]/20 rounded-full -ml-32 -mb-32" />
                    <View className="absolute right-0 top-0 w-[250px] h-[250px] bg-[#F07E21]/10 rounded-full -mr-24 -mt-24" />

                    <View className="items-center z-10">
                        <Text className="text-2xl font-black text-white text-center mb-2">Ready to elevate your</Text>
                        <Text className="text-2xl font-black text-[#F07E21] text-center mb-4">Travel Agency?</Text>
                        <Text className="text-[#48A0D4] text-center text-sm font-medium mb-8 px-4">
                            Join thousands of B2B partners who trust Zayafly for bookings and earn maximum commissions.
                        </Text>

                        <TouchableOpacity onPress={() => navigation.navigate('AgentRegister')} className="w-full bg-[#F07E21] py-5 rounded-2xl items-center border border-[#F07E21] border-b-[6px] border-b-[#D96B18] shadow-xl shadow-orange-500/30 active:scale-95 mb-4">
                            <Text className="text-white font-black text-sm uppercase tracking-widest">🚀 Start Registration</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('Login')} className="w-full bg-white py-5 rounded-2xl items-center border border-slate-100 border-b-[6px] border-slate-200 shadow-xl active:scale-95 mb-4">
                            <Text className="text-slate-900 font-black text-sm uppercase tracking-widest">🔐 Agent Login</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('AdminLogin')} className="w-full bg-[#dc2626] py-5 rounded-2xl items-center border border-[#dc2626] border-b-[6px] border-b-[#991b1b] shadow-xl shadow-red-600/30 active:scale-95">
                            <Text className="text-white font-black text-sm uppercase tracking-widest">👑 Admin Login</Text>
                        </TouchableOpacity>

                        <Text className="text-[#48A0D4] text-center text-xs font-medium mt-6">
                            ✅ Free Registration • 🔒 Secure & Verified • ⚡ Instant Activation
                        </Text>
                    </View>
                </LinearGradient>

                <Footer />
            </ScrollView>
        </View>
    );
}
