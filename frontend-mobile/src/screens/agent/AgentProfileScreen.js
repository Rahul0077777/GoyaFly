import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView,
    TextInput, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';
import { authService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const Field = ({ label, value, onChangeText, readOnly, multiline, t }) => (
    <View className="mb-6">
        <Text className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 tracking-widest">
            {label}
        </Text>
        <TextInput
            value={value}
            onChangeText={onChangeText}
            editable={!readOnly}
            multiline={multiline}
            placeholderTextColor="#9ca3af"
            className={`bg-slate-50 rounded-2xl px-6 py-5 font-black text-sm border border-slate-100 shadow-inner ${readOnly ? 'text-slate-400 bg-slate-100/60' : 'text-slate-900'}`}
            style={multiline && { height: 100, textAlignVertical: 'top' }}
        />
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
        agentCode: '',
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
                    ownerName:  d.name || '',
                    email:      d.email || '',
                    mobile:     d.mobile || '',
                    city:       d.city || '',
                    gstNumber:  d.gstNumber || '',
                    address:    d.address || '',
                    agentCode:  d.agentCode || '',
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await authService.updateProfile({
                name:        profile.ownerName, // Matches web logic: owners maps to name
                agencyName:  profile.agencyName,
                mobile:      profile.mobile,
                gstNumber:   profile.gstNumber,
                address:     profile.address,
                city:        profile.city,
            });
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Profile changes synchronized.' });
                // Update local storage for immediate UI updates in drawer
                const info = await AsyncStorage.getItem('agentInfo');
                if (info) {
                    const obj = JSON.parse(info);
                    obj.agentName = profile.agencyName;
                    obj.name = profile.ownerName;
                    await AsyncStorage.setItem('agentInfo', JSON.stringify(obj));
                }
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Update failed.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator color="#F07E21" /></View>;

    return (
        <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    
                    {/* Modern 3D Header */}
                    <View className="px-5 pt-5 pb-4 flex-row items-center bg-white border-b border-slate-100 shadow-sm">
                        <TouchableOpacity 
                            onPress={() => navigation.goBack()} 
                            className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 shadow-sm mr-4 active:scale-95"
                        >
                            <Ionicons name="chevron-back" size={22} color="#1D4171" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-2xl font-black text-slate-900 tracking-wide uppercase">Agency Profile</Text>
                            <Text className="text-slate-400 font-black uppercase text-[10px] tracking-widest mt-0.5">Verified Partner Account</Text>
                        </View>
                    </View>

                    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                        
                        {/* High-End Brand Header / Avatar */}
                        <View className="bg-white px-6 py-10 items-center border-b border-slate-100 shadow-sm overflow-hidden mb-6">
                             <View className="w-24 h-24 bg-white rounded-[2.5rem] items-center justify-center border border-slate-100 border-b-8 border-slate-200 shadow-2xl mb-4" style={{ elevation: 8 }}>
                                 <Text className="text-4xl font-black text-[#1D4171]">{(profile.agencyName || 'A').substring(0,1).toUpperCase()}</Text>
                             </View>
                             <Text className="text-2xl font-black text-slate-900 tracking-wide">{profile.agencyName || 'Partner'}</Text>
                             <View className="bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mt-2 shadow-sm">
                                 <Text className="text-blue-700 font-black text-[9px] uppercase tracking-widest">Verified Agency Portal</Text>
                             </View>
                        </View>

                        <View className="px-5 pb-6">
                            <View className="bg-white p-8 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 space-y-2" style={{ elevation: 8 }}>
                                <View className="flex-row items-center mb-6 pb-4 border-b border-slate-50">
                                    <View className="w-1.5 h-8 bg-[#F07E21] rounded-full mr-4 shadow-sm" />
                                    <View>
                                        <Text className="text-xl font-black text-slate-900 uppercase tracking-wide">Identity Settings</Text>
                                        <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-0.5">Global Profile Parity</Text>
                                    </View>
                                </View>

                                <Field label="Agency Entity Name" value={profile.agencyName} onChangeText={v => setProfile({...profile, agencyName: v})} t={t} />
                                <Field label="Agent ID" value={profile.agentCode || 'PENDING'} readOnly t={t} />
                                <Field label="Official Owner Name" value={profile.ownerName}  onChangeText={v => setProfile({...profile, ownerName: v})}  t={t} />
                                <Field label="Authentication Email" value={profile.email} readOnly t={t} />
                                <Field label="GSTIN Registration" value={profile.gstNumber} onChangeText={v => setProfile({...profile, gstNumber: v})} t={t} />
                                <Field label="Direct Contact" value={profile.mobile} onChangeText={v => setProfile({...profile, mobile: v})} t={t} />
                                <Field label="Primary Location (City)" value={profile.city} onChangeText={v => setProfile({...profile, city: v})} t={t} />
                                <Field label="Corporate Address" value={profile.address} onChangeText={v => setProfile({...profile, address: v})} multiline t={t} />

                                <TouchableOpacity 
                                    onPress={handleSave} disabled={saving}
                                    className="bg-[#1D4171] py-6 rounded-2xl items-center border border-[#1D4171] border-b-[6px] border-[#15305B] shadow-xl shadow-blue-900/30 active:scale-95 mt-6"
                                >
                                    {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black uppercase text-sm tracking-widest">Save Profile Changes</Text>}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity 
                                onPress={() => Toast.show({ type: 'info', text1: 'Privacy', text2: 'Your data is secured with AES-256 encryption.' })}
                                className="mt-8 mb-10 items-center active:scale-95"
                            >
                                <View className="flex-row items-center bg-white px-6 py-3.5 rounded-2xl border border-slate-100 border-b-4 border-slate-200 shadow-sm">
                                    <Ionicons name="shield-checkmark" size={16} color="#059669" />
                                    <Text className="ml-2.5 text-slate-600 font-black text-[10px] uppercase tracking-widest">End-to-End Encrypted Sync</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
