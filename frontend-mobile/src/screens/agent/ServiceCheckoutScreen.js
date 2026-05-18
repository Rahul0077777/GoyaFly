import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../utils/themeColors';
import { bookingService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ServiceCheckoutScreen({ navigation, route }) {
    const { service, item } = route.params || {};
    const t = useThemeColors();

    const [loading, setLoading] = useState(false);
    const [travelDate, setTravelDate] = useState('');
    const [paxCount, setPaxCount] = useState({ adults: 1, children: 0 });
    const [notes, setNotes] = useState('');
    const [paxDetails, setPaxDetails] = useState({
        leadName: '',
        mobile: '',
        email: ''
    });

    useEffect(() => {
        if (!service || !item) {
            navigation.goBack();
            return;
        }

        const loadAgentData = async () => {
            const agentInfoStr = await AsyncStorage.getItem('agentInfo');
            if (agentInfoStr) {
                const info = JSON.parse(agentInfoStr);
                setPaxDetails(prev => ({
                    ...prev,
                    mobile: info.mobileNumber || '',
                    email: info.emailAddress || ''
                }));
            }
        };
        loadAgentData();
    }, [service, item]);

    const handleSubmit = async () => {
        if (!travelDate || !paxDetails.leadName || !paxDetails.mobile || !paxDetails.email) {
            Toast.show({ type: 'info', text1: 'Missing Information', text2: 'Please fill all mandatory fields.' });
            return;
        }

        setLoading(true);
        try {
            const res = await bookingService.createServiceRequest({
                serviceType: service,
                item,
                travelDate,
                paxCount,
                paxDetails,
                notes
            });

            if (res.success) {
                Toast.show({ type: 'success', text1: 'Request Submitted', text2: 'Our team will contact you shortly.' });
                navigation.navigate('MainApp'); // Or booking history
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || err.message });
        } finally {
            setLoading(false);
        }
    };

    if (!service || !item) return null;

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="light" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    {/* Hero Header */}
                    <View className="bg-slate-900 pt-20 pb-24 px-8 rounded-b-[4rem]">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6 w-10 h-10 bg-white/10 rounded-xl items-center justify-center">
                            <Ionicons name="chevron-back" size={20} color="#fff" />
                        </TouchableOpacity>
                        <View className="flex-row items-center gap-3 mb-2">
                            <View className="bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/30">
                                <Text className="text-orange-400 font-black text-[9px] uppercase tracking-widest">{service} REQUEST</Text>
                            </View>
                        </View>
                        <Text className="text-white text-3xl font-black mb-1">{item.title || item.country || item.provider}</Text>
                        <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest opacity-80">{item.days || item.type || 'Custom Plan'}</Text>
                    </View>

                    {/* Summary Card */}
                    <View className="px-6 -mt-12">
                        <View style={{ backgroundColor: t.card }} className="rounded-[2.5rem] shadow-2xl p-8 border border-gray-50 mb-8">
                            <View className="flex-row justify-between items-center bg-slate-50 p-6 rounded-3xl mb-6">
                                <View>
                                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Cost</Text>
                                    <Text style={{ color: t.text }} className="text-2xl font-black">
                                        ₹{((item.price || 0) * (paxCount.adults || 1)).toLocaleString('en-IN')}
                                    </Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</Text>
                                    <Text className="text-orange-500 font-black text-xs uppercase">PENDING REVIEW</Text>
                                </View>
                            </View>

                            <View className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                <Text className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1 italic">Notice</Text>
                                <Text className="text-amber-800 text-[10px] font-bold leading-4">No funds will be deducted yet. Our operators will confirm availability before final booking.</Text>
                            </View>
                        </View>

                        {/* Form */}
                        <View className="space-y-8 pb-20">
                            {/* Trip Dates */}
                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">Planned Travel Date *</Text>
                                <View className="bg-white border border-slate-100 rounded-3xl px-6 py-4 flex-row items-center">
                                    <Ionicons name="calendar-outline" size={20} color="#94a3b8" />
                                    <TextInput 
                                        placeholder="YYYY-MM-DD" value={travelDate} onChangeText={setTravelDate}
                                        className="flex-1 ml-4 font-black text-slate-800"
                                    />
                                </View>
                            </View>

                            {/* Pax Count */}
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">Adults</Text>
                                    <View className="bg-white border border-slate-100 rounded-3xl px-6 py-4">
                                        <TextInput 
                                            keyboardType="numeric" value={String(paxCount.adults)} 
                                            onChangeText={v => setPaxCount({...paxCount, adults: parseInt(v) || 0})}
                                            className="font-black text-slate-800 text-center"
                                        />
                                    </View>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">Children</Text>
                                    <View className="bg-white border border-slate-100 rounded-3xl px-6 py-4">
                                        <TextInput 
                                            keyboardType="numeric" value={String(paxCount.children)} 
                                            onChangeText={v => setPaxCount({...paxCount, children: parseInt(v) || 0})}
                                            className="font-black text-slate-800 text-center"
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Lead Pax */}
                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">Lead Passenger Name *</Text>
                                <View className="bg-white border border-slate-100 rounded-3xl px-6 py-5">
                                    <TextInput 
                                        placeholder="FULL NAME AS PER PASSPORT" value={paxDetails.leadName} 
                                        onChangeText={v => setPaxDetails({...paxDetails, leadName: v})}
                                        className="font-black text-slate-800 uppercase"
                                    />
                                </View>
                            </View>

                            {/* Contact */}
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">Mobile *</Text>
                                    <View className="bg-white border border-slate-100 rounded-3xl px-6 py-4">
                                        <TextInput 
                                            keyboardType="phone-pad" value={paxDetails.mobile} 
                                            onChangeText={v => setPaxDetails({...paxDetails, mobile: v})}
                                            className="font-black text-slate-800"
                                        />
                                    </View>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">Email *</Text>
                                    <View className="bg-white border border-slate-100 rounded-3xl px-6 py-4">
                                        <TextInput 
                                            keyboardType="email-address" value={paxDetails.email} 
                                            onChangeText={v => setPaxDetails({...paxDetails, email: v})}
                                            className="font-bold text-slate-800 text-[10px]"
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Notes */}
                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">Special Requirements / Notes</Text>
                                <View className="bg-white border border-slate-100 rounded-[2rem] px-6 py-5">
                                    <TextInput 
                                        multiline numberOfLines={4} placeholder="Any specific requests or questions..."
                                        value={notes} onChangeText={setNotes}
                                        className="font-bold text-slate-600 text-sm h-32"
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>

                            {/* Submit */}
                            <TouchableOpacity 
                                onPress={handleSubmit} disabled={loading}
                                className="bg-slate-900 py-6 rounded-[2rem] items-center shadow-2xl active:scale-[0.98]"
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : (
                                    <Text className="text-white font-black uppercase tracking-widest">Submit Booking Request →</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
