import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../utils/themeColors';
import { adminService } from '../../services/api';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function PromotionEditorScreen({ navigation, route }) {
    const t = useThemeColors();
    const existingPromotion = route.params?.promotion;
    
    const [title, setTitle] = useState(existingPromotion?.title || '');
    const [subtitle, setSubtitle] = useState(existingPromotion?.subtitle || '');
    const [color, setColor] = useState(existingPromotion?.color || '#1D4171');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!title || !subtitle) {
            return Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please provide both title and subtitle.' });
        }

        setLoading(true);
        try {
            const data = { title, subtitle, color, active: existingPromotion ? existingPromotion.active : true };
            let res;
            if (existingPromotion) {
                res = await adminService.updatePromotion(existingPromotion._id, data);
            } else {
                res = await adminService.createPromotion(data);
            }

            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Promotion saved successfully!' });
                navigation.goBack();
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save promotion' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-5 py-5 flex-row items-center border-b border-slate-100 mb-2">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm mr-3.5">
                        <Ionicons name="arrow-back" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="bg-purple-50 w-12 h-12 rounded-2xl items-center justify-center border border-purple-100 shadow-sm mr-3.5">
                        <Ionicons name="create" size={24} color="#9333ea" />
                    </View>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">
                            {existingPromotion ? 'Edit Campaign' : 'New Campaign'}
                        </Text>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Campaign Settings</Text>
                    </View>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
                        <View className="mb-6">
                            <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Banner Title</Text>
                            <TextInput 
                                value={title} onChangeText={setTitle} placeholder="e.g. Summer Sale"
                                placeholderTextColor="#9ca3af"
                                className="bg-slate-50 p-5 rounded-2xl font-black text-slate-900 text-base border border-slate-100 shadow-inner"
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Subtitle / CTA Text</Text>
                            <TextInput 
                                value={subtitle} onChangeText={setSubtitle} placeholder="e.g. Flat 20% Off"
                                placeholderTextColor="#9ca3af"
                                className="bg-slate-50 p-5 rounded-2xl font-black text-slate-900 text-base border border-slate-100 shadow-inner"
                            />
                        </View>

                        <View className="mb-8">
                            <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Theme Color Palette</Text>
                            <View className="flex-row gap-3 mb-4">
                                {['#1D4171', '#F07E21', '#0f172a', '#7c3aed', '#db2777'].map(c => (
                                    <TouchableOpacity key={c} onPress={() => setColor(c)}
                                        style={{ backgroundColor: c }} className={`w-12 h-12 rounded-2xl border-4 active:scale-95 shadow-md ${color === c ? 'border-white shadow-xl' : 'border-transparent'}`} />
                                ))}
                            </View>
                            <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Custom Color Hex</Text>
                            <TextInput 
                                value={color} onChangeText={setColor} placeholder="#1D4171"
                                placeholderTextColor="#9ca3af"
                                className="bg-slate-50 p-5 rounded-2xl font-black text-slate-900 text-base border border-slate-100 shadow-inner mb-2"
                            />
                            <View style={{ backgroundColor: color, elevation: 8 }} className="h-16 mt-2 rounded-2xl border-4 border-white shadow-lg shadow-slate-400/30" />
                        </View>

                        <TouchableOpacity 
                            onPress={handleSave} disabled={loading}
                            className="bg-[#F07E21] py-5 rounded-2xl items-center border border-[#F07E21] border-b-[6px] border-b-[#D96B18] shadow-xl shadow-orange-500/30 active:scale-95 mb-12"
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : (
                                <Text className="text-white font-black text-xs uppercase tracking-widest">
                                    {existingPromotion ? 'Update Banner' : 'Publish Banner'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
