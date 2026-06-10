import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView,
    TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Linking, Alert
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';
import { authService, BASE_URL } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const Field = ({ label, value, onChangeText, readOnly, multiline, icon, placeholder }) => (
    <View className="mb-4">
        <Text className="text-[9px] font-black text-slate-400 uppercase ml-1 mb-1.5" style={{ letterSpacing: 1.5 }}>
            {label}
        </Text>
        <View className={`flex-row items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-1 shadow-inner ${readOnly ? 'bg-slate-100/50' : 'focus:border-blue-500'}`}>
            <Ionicons name={icon} size={16} color="#94a3b8" style={{ marginRight: 10 }} />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                editable={!readOnly}
                multiline={multiline}
                placeholder={placeholder}
                placeholderTextColor="#cbd5e1"
                className={`flex-1 py-2 font-bold text-xs ${readOnly ? 'text-slate-400' : 'text-slate-700'}`}
                style={multiline && { height: 70, textAlignVertical: 'top', paddingTop: 8 }}
            />
        </View>
    </View>
);

export default function AgentProfileScreen({ navigation }) {
    const t = useThemeColors();
    const [profile, setProfile] = useState({
        agencyName: '',
        ownerName: '',
        email: '',
        mobile: '',
        city: '',
        gstNumber: '',
        address: '',
        logo: null
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        try {
            const res = await authService.getProfile();
            if (res.success) {
                const d = res.data;
                setProfile({
                    agencyName: d.agencyName || '',
                    ownerName:  d.agentName || d.name || '',
                    email:      d.emailAddress || d.email || '',
                    mobile:     d.mobileNumber || d.mobile || '',
                    city:       d.city || '',
                    gstNumber:  d.gstNumber || '',
                    address:    d.address || '',
                    logo:       d.logo || null
                });
            }
        } catch (e) {
            console.error('Failed to load profile in mobile screen', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await authService.updateProfile({
                agentName:    profile.ownerName, // Maps to backend property
                agencyName:   profile.agencyName,
                mobileNumber: profile.mobile,    // Maps to backend property
                gstNumber:    profile.gstNumber,
                address:      profile.address,
                city:         profile.city,
            });
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Profile updated successfully!' });
                // Update local storage for immediate UI updates in drawer
                const info = await AsyncStorage.getItem('agentInfo');
                if (info) {
                    const obj = JSON.parse(info);
                    obj.agencyName = profile.agencyName;
                    obj.agentName = profile.agencyName;
                    obj.name = profile.ownerName;
                    await AsyncStorage.setItem('agentInfo', JSON.stringify(obj));
                }
            }
        } catch (err) {
            console.error('Failed to save profile changes', err);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    const handleContactAdmin = () => {
        const email = 'admin@goyafly.com';
        const subject = `Agency Logo Update Request - ${profile.agencyName}`;
        const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
        Linking.openURL(mailtoUrl).catch((err) => {
            console.error('Failed to open mail client', err);
            Alert.alert('Email Error', `Could not open mail client. Please email admin@goyafly.com directly with the subject: ${subject}`);
        });
    };

    const handleChangePassword = () => {
        Alert.alert(
            'Account Security',
            'Password modification is protected. Please contact admin@goyafly.com or use the security configurations on the web agent portal to update your login credentials.',
            [{ text: 'Close', style: 'cancel' }]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50">
                <ActivityIndicator size="large" color="#1D4171" />
                <Text className="text-slate-400 font-bold text-xs mt-3">Loading Profile...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    
                    {/* Header */}
                    <View className="px-5 pt-3 pb-3 flex-row items-center bg-white border-b border-slate-100 shadow-sm">
                        <TouchableOpacity 
                            onPress={() => navigation.goBack()} 
                            className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 active:scale-95"
                        >
                            <Ionicons name="chevron-back" size={20} color="#1D4171" />
                        </TouchableOpacity>
                        <View className="ml-4">
                            <Text className="text-lg font-black text-slate-800 uppercase" style={{ letterSpacing: 0.5 }}>Agency Profile</Text>
                            <Text className="text-slate-400 font-black uppercase text-[8px] mt-0.5" style={{ letterSpacing: 1.5 }}>Portal Identity & Security</Text>
                        </View>
                    </View>

                    {/* Top Blue Accent Line */}
                    <View className="w-full h-1 bg-[#1D4171]" />

                    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                        
                        {/* Agency Info Card */}
                        <View className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mx-4 mt-4 flex-col items-center">
                            <View className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden">
                                {profile.logo ? (
                                    <Image 
                                        source={{ uri: profile.logo.startsWith('http') ? profile.logo : `${BASE_URL}${profile.logo}` }} 
                                        className="w-full h-full p-2" 
                                        resizeMode="contain" 
                                    />
                                ) : (
                                    <Text className="text-3xl font-black text-blue-600">{(profile.agencyName || 'P').substring(0,1).toUpperCase()}</Text>
                                )}
                            </View>
                            
                            <Text className="text-lg font-black text-slate-800 mt-3 text-center">{profile.agencyName || 'Agency Name'}</Text>
                            
                            <View className="bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex-row items-center mt-2 gap-1.5">
                                <Ionicons name="checkmark-circle" size={12} color="#059669" />
                                <Text className="text-emerald-600 text-[9px] font-black uppercase" style={{ letterSpacing: 1.2 }}>Verified Partner</Text>
                            </View>
                            
                            <View className="flex-row flex-wrap justify-center items-center mt-4 gap-x-4 gap-y-1 text-center">
                                <View className="flex-row items-center gap-1.5">
                                    <Ionicons name="mail" size={12} color="#94a3b8" />
                                    <Text className="text-[11px] font-bold text-slate-500">{profile.email}</Text>
                                </View>
                                <View className="flex-row items-center gap-1.5">
                                    <Ionicons name="call" size={12} color="#94a3b8" />
                                    <Text className="text-[11px] font-bold text-slate-500">{profile.mobile}</Text>
                                </View>
                            </View>
                            
                            {/* Contact Admin to Update Logo */}
                            <TouchableOpacity 
                                onPress={handleContactAdmin}
                                className="w-full mt-5 bg-blue-50 border border-blue-100 rounded-xl py-3 items-center justify-center active:scale-95"
                            >
                                <View className="flex-row items-center gap-1.5">
                                    <Ionicons name="mail-outline" size={14} color="#2563eb" />
                                    <Text className="text-blue-600 text-[10px] font-black uppercase" style={{ letterSpacing: 1.2 }}>Contact Admin</Text>
                                </View>
                                <Text className="text-[8px] font-bold text-blue-400 uppercase mt-0.5" style={{ letterSpacing: 1.0 }}>To Update Logo</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Password Protection Card */}
                        <View className="bg-[#1D4171] p-5 rounded-3xl mx-4 mt-4 shadow-md relative overflow-hidden">
                            <View className="flex-row items-center gap-4">
                                <View className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                                    <Ionicons name="shield-checkmark" size={18} color="#93c5fd" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[8px] font-black uppercase text-slate-400 mb-0.5" style={{ letterSpacing: 1.2 }}>Account Security</Text>
                                    <Text className="text-sm font-black text-white mb-0.5">Password Protection</Text>
                                    <Text className="text-[10px] text-slate-300 font-medium leading-normal">Keep your account secure with a strong password.</Text>
                                </View>
                            </View>
                            <TouchableOpacity 
                                onPress={handleChangePassword}
                                className="w-full mt-4 py-3 bg-white/10 rounded-xl border border-white/20 flex-row items-center justify-center gap-1.5 active:scale-95"
                            >
                                <Ionicons name="lock-closed" size={12} color="#fff" />
                                <Text className="text-white font-black text-[9px] uppercase" style={{ letterSpacing: 1.2 }}>Change Password</Text>
                                <Text className="text-slate-400 ml-1 text-[9px] font-black">&gt;</Text>
                            </TouchableOpacity>
                        </View>

                        {/* General Information Form */}
                        <View className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mx-4 mt-4">
                            <View className="flex-row items-center gap-2 mb-5 pb-3 border-b border-slate-50">
                                <Ionicons name="card" size={18} color="#f97316" />
                                <Text className="text-sm font-black text-slate-800">General Information</Text>
                            </View>
                            
                            <Field 
                                label="Agency Name" 
                                value={profile.agencyName} 
                                onChangeText={v => setProfile({...profile, agencyName: v})} 
                                icon="business-outline" 
                                placeholder="Enter Agency Name"
                            />
                            <Field 
                                label="Agency Owner" 
                                value={profile.ownerName} 
                                onChangeText={v => setProfile({...profile, ownerName: v})} 
                                icon="person-outline" 
                                placeholder="Enter Owner Name"
                            />
                            <Field 
                                label="Official Email" 
                                value={profile.email} 
                                readOnly 
                                icon="mail-outline" 
                                placeholder="Official Email"
                            />
                            <Field 
                                label="GST Number" 
                                value={profile.gstNumber} 
                                onChangeText={v => setProfile({...profile, gstNumber: v})} 
                                icon="receipt-outline" 
                                placeholder="Enter GST Number"
                            />
                            <Field 
                                label="Contact Phone" 
                                value={profile.mobile} 
                                onChangeText={v => setProfile({...profile, mobile: v})} 
                                icon="call-outline" 
                                placeholder="Enter Mobile Number"
                            />
                            <Field 
                                label="Location City" 
                                value={profile.city} 
                                onChangeText={v => setProfile({...profile, city: v})} 
                                icon="location-outline" 
                                placeholder="Enter City"
                            />
                            <Field 
                                label="Physical Address" 
                                value={profile.address} 
                                onChangeText={v => setProfile({...profile, address: v})} 
                                multiline 
                                icon="map-outline" 
                                placeholder="Enter Physical Address"
                            />
                            
                            <TouchableOpacity 
                                onPress={handleSave} 
                                disabled={saving}
                                className="w-full mt-4 py-4 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 items-center justify-center flex-row gap-2 disabled:opacity-50"
                            >
                                <Ionicons name="save" size={14} color="#fff" />
                                <Text className="text-white font-black text-[10px] uppercase" style={{ letterSpacing: 1.2 }}>
                                    {saving ? 'Saving...' : 'Save Profile Changes'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Profile Benefits */}
                        <View className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mx-4 mt-4">
                            <View className="flex-row items-center gap-2 mb-5 pb-3 border-b border-slate-50">
                                <Ionicons name="ribbon" size={18} color="#f97316" />
                                <Text className="text-sm font-black text-slate-800">Profile Benefits</Text>
                            </View>
                            
                            <View className="flex-row flex-wrap justify-between">
                                {/* Card 1 */}
                                <View className="w-[48%] mb-4 flex-col gap-1">
                                    <View className="w-8 h-8 bg-emerald-50 rounded-lg items-center justify-center">
                                        <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                                    </View>
                                    <Text className="text-[10px] font-black text-slate-800 mt-1">Verified Partner</Text>
                                    <Text className="text-[9px] font-bold text-slate-400 leading-normal">Trusted & verified travel agency</Text>
                                </View>
                                
                                {/* Card 2 */}
                                <View className="w-[48%] mb-4 flex-col gap-1">
                                    <View className="w-8 h-8 bg-orange-50 rounded-lg items-center justify-center">
                                        <Ionicons name="headset" size={18} color="#f97316" />
                                    </View>
                                    <Text className="text-[10px] font-black text-slate-800 mt-1">Priority Support</Text>
                                    <Text className="text-[9px] font-bold text-slate-400 leading-normal">Get faster response from our team</Text>
                                </View>
                                
                                {/* Card 3 */}
                                <View className="w-[48%] mb-4 flex-col gap-1">
                                    <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center">
                                        <Ionicons name="people" size={18} color="#3b82f6" />
                                    </View>
                                    <Text className="text-[10px] font-black text-slate-800 mt-1">Dedicated Manager</Text>
                                    <Text className="text-[9px] font-bold text-slate-400 leading-normal">Personalized support for your business</Text>
                                </View>
                                
                                {/* Card 4 */}
                                <View className="w-[48%] mb-4 flex-col gap-1">
                                    <View className="w-8 h-8 bg-purple-50 rounded-lg items-center justify-center">
                                        <Ionicons name="bar-chart" size={18} color="#a855f7" />
                                    </View>
                                    <Text className="text-[10px] font-black text-slate-800 mt-1">Better Insights</Text>
                                    <Text className="text-[9px] font-bold text-slate-400 leading-normal">Track performance & bookings</Text>
                                </View>
                            </View>
                        </View>

                        {/* Secure Footer */}
                        <TouchableOpacity 
                            onPress={() => Toast.show({ type: 'info', text1: 'Privacy', text2: 'Your data is secured with AES-256 encryption.' })}
                            className="bg-[#f0f5fa] rounded-3xl p-4 mx-4 mt-4 mb-8 flex-row items-center justify-between border border-blue-100/50 active:scale-95"
                        >
                            <View className="flex-row items-center gap-3 flex-1 mr-2">
                                <View className="w-8 h-8 bg-white rounded-full items-center justify-center border border-blue-100 shadow-sm">
                                    <Ionicons name="shield-checkmark" size={16} color="#3b82f6" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[10px] font-black text-blue-900" style={{ letterSpacing: 0.5 }}>Your account is secure</Text>
                                    <Text className="text-[9px] font-bold text-slate-500 mt-0.5 leading-normal" numberOfLines={2}>
                                        We use industry-standard security to keep your data safe and protected.
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={14} color="#60a5fa" />
                        </TouchableOpacity>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
