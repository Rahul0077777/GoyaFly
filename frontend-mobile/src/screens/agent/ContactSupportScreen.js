import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../utils/themeColors';

export default function ContactSupportScreen({ navigation }) {
    const t = useThemeColors();

    const handleCall = () => Linking.openURL('tel:+919999999999');
    const handleEmail = () => Linking.openURL('mailto:support@zayafly.com');

    return (
        <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Modern 3D Header */}
                <View className="px-5 pt-5 pb-4 flex-row items-center bg-white border-b border-slate-100 shadow-sm">
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 shadow-sm mr-4 active:scale-95"
                    >
                        <Ionicons name="chevron-back" size={22} color="#1D4171" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-2xl font-black text-slate-900 tracking-wide uppercase">Support</Text>
                        <Text className="text-slate-400 font-black uppercase text-[10px] tracking-widest mt-0.5">24/7 Agent Helpdesk</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
                    {/* 3D Hero Banner */}
                    <View style={{ backgroundColor: '#1D4171', elevation: 12 }} className="p-8 rounded-[2.5rem] mb-8 items-center border border-blue-400/20 border-b-[8px] border-[#15305B] shadow-2xl relative overflow-hidden">
                        <View className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 shadow-inner" />
                        <View className="w-20 h-20 rounded-3xl bg-white/10 items-center justify-center mb-6 border border-white/20 shadow-inner">
                            <Ionicons name="headset" size={38} color="#fff" />
                        </View>
                        <Text className="text-white text-3xl font-black mb-2 tracking-wide">We're Here to Help</Text>
                        <Text className="text-blue-200 text-center text-xs leading-5 font-bold px-4">Our support team is available 24/7 for booking assistance, reissues, and cancellations.</Text>
                    </View>

                    {/* Quick Contacts - 3D Extruded Cards */}
                    <View className="mb-10">
                        <TouchableOpacity 
                            onPress={handleCall}
                            style={{ elevation: 8 }} 
                            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 active:scale-95 mb-5 flex-row items-center"
                        >
                            <View className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 border-b-4 border-green-200 items-center justify-center mr-5 shadow-sm">
                                <Ionicons name="call" size={24} color="#059669" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-400 font-black text-[10px] uppercase mb-1 tracking-widest">Direct Phone</Text>
                                <Text className="text-slate-800 font-black text-lg tracking-wide">+91 999 999 9999</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={handleEmail}
                            style={{ elevation: 8 }} 
                            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 active:scale-95 mb-5 flex-row items-center"
                        >
                            <View className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 border-b-4 border-blue-200 items-center justify-center mr-5 shadow-sm">
                                <Ionicons name="mail" size={24} color="#0284c7" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-400 font-black text-[10px] uppercase mb-1 tracking-widest">Email Support</Text>
                                <Text className="text-slate-800 font-black text-lg tracking-wide">support@zayafly.com</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Tickets')}
                            style={{ elevation: 8 }} 
                            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 active:scale-95 mb-5 flex-row items-center"
                        >
                            <View className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 border-b-4 border-orange-200 items-center justify-center mr-5 shadow-sm">
                                <Ionicons name="chatbubbles" size={24} color="#F07E21" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-400 font-black text-[10px] uppercase mb-1 tracking-widest">Live Tickets</Text>
                                <Text className="text-slate-800 font-black text-lg tracking-wide">Open a Ticket</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                        </TouchableOpacity>
                    </View>

                    {/* Office Address */}
                    <View className="p-6 bg-slate-200/50 rounded-3xl border border-slate-200 mb-10 shadow-inner">
                        <Text className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Headquarters</Text>
                        <Text className="text-slate-700 font-bold leading-6 text-xs">
                            ZayaFly Travel Group Ltd.{"\n"}
                            Level 5, Aviation House{"\n"}
                            New Delhi, India 110001
                        </Text>
                    </View>

                    <View className="h-20" />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
