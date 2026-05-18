import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, 
    ActivityIndicator, RefreshControl, Modal, TextInput, Switch,
    KeyboardAvoidingView, Platform
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';

export default function PromotionManagerScreen({ navigation }) {
    const t = useThemeColors();
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Form State
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        color: '#1D4171',
        active: true
    });

    const fetchPromotions = useCallback(async () => {
        try {
            const res = await adminService.getPromotions();
            if (res.success) setBanners(res.data);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

    const handleOpenModal = (banner = null) => {
        if (banner) {
            setEditingId(banner._id);
            setFormData({
                title: banner.title,
                subtitle: banner.subtitle,
                description: banner.description || '',
                color: banner.color || '#1D4171',
                active: banner.active
            });
        } else {
            setEditingId(null);
            setFormData({
                title: '',
                subtitle: '',
                description: '',
                color: '#1D4171',
                active: true
            });
        }
        setIsEditModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.subtitle) return Toast.show({ type: 'info', text1: 'Error', text2: 'Title and Subtitle are required' });
        
        setSaving(true);
        try {
            let res;
            if (editingId) {
                res = await adminService.updatePromotion(editingId, formData);
            } else {
                res = await adminService.createPromotion(formData);
            }
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Promotion updated successfully!' });
                setIsEditModalOpen(false);
                fetchPromotions();
            }
        } catch (err) { Toast.show({ type: 'error', text1: 'Error', text2: 'Save failed' }); }
        finally { setSaving(false); }
    };

    const handleDelete = (id) => {
        const { Alert } = require('react-native');
        Alert.alert('Delete Campaign', 'Remove this promotion from homepage?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                const res = await adminService.deletePromotion(id);
                if (res.success) {
                    Toast.show({ type: 'success', text1: 'Deleted', text2: 'Promotion removed.' });
                    fetchPromotions();
                }
            }}
        ]);
    };

    const toggleStatus = async (banner) => {
        await adminService.updatePromotion(banner._id, { active: !banner.active });
        fetchPromotions();
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-5 py-5 flex-row items-center justify-between border-b border-slate-100 mb-2">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm mr-3.5">
                            <Ionicons name="arrow-back" size={22} color="#0f172a" />
                        </TouchableOpacity>
                        <View className="bg-purple-50 w-12 h-12 rounded-2xl items-center justify-center border border-purple-100 shadow-sm mr-3.5">
                            <Ionicons name="megaphone" size={24} color="#9333ea" />
                        </View>
                        <View>
                            <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">Promotion Hub</Text>
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Homepage Branding</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => handleOpenModal()} className="bg-[#F07E21] px-5 py-3.5 rounded-2xl border border-[#F07E21] border-b-4 border-b-[#D96B18] shadow-lg shadow-orange-500/30 active:scale-95">
                        <Text className="text-white font-black text-[10px] uppercase tracking-wider">+ Campaign</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center"><ActivityIndicator color="#F07E21" size="large" /></View>
                ) : (
                    <ScrollView 
                        className="flex-1 px-5 pt-2" 
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchPromotions();}} tintColor="#F07E21" />}
                    >
                        {banners.map(b => (
                            <View key={b._id} style={{ backgroundColor: t.card, elevation: 8 }}
                                className="rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-6 overflow-hidden">
                                
                                {/* Banner Visual */}
                                <View style={{ backgroundColor: b.color || '#1D4171', padding: 28, position: 'relative' }}>
                                    <View className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                                    <Text className="text-2xl font-black text-white mb-1.5 tracking-wide">{b.title}</Text>
                                    <Text className="text-white/80 font-bold text-xs tracking-wider">{b.subtitle}</Text>
                                </View>

                                {/* Controls */}
                                <View className="p-6 flex-row justify-between items-center bg-white">
                                    <View>
                                        <Text className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${b.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {b.active ? 'LIVE ON HOMEPAGE' : 'INACTIVE / DRAFT'}
                                        </Text>
                                        <TouchableOpacity onPress={() => handleOpenModal(b)} className="flex-row items-center">
                                            <Ionicons name="create-outline" size={14} color="#1D4171" />
                                            <Text className="text-xs font-black text-[#1D4171] ml-1 tracking-wide">Edit Settings</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View className="flex-row items-center gap-4">
                                        <Switch value={b.active} onValueChange={() => toggleStatus(b)} trackColor={{ false: '#e2e8f0', true: '#059669' }} />
                                        <TouchableOpacity onPress={() => handleDelete(b._id)} className="w-12 h-12 bg-rose-50 rounded-2xl items-center justify-center border border-rose-100 border-b-4 border-b-rose-200 shadow-sm active:scale-95">
                                            <Ionicons name="trash" size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                        <View className="h-10" />
                    </ScrollView>
                )}
            </SafeAreaView>

            {/* Editor Modal */}
            <Modal visible={isEditModalOpen} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/60 justify-end">
                    <View style={{ elevation: 24 }} className="bg-white rounded-t-[3.5rem] p-8 pb-12 shadow-2xl border-t border-slate-100">
                        <View className="flex-row justify-between items-center mb-8 pb-4 border-b border-slate-100">
                            <View>
                                <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide uppercase">{editingId ? 'Edit Banner' : 'New Banner'}</Text>
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Homepage promotional banner</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsEditModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm">
                                <Ionicons name="close" size={22} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="space-y-6 pb-2">
                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Main Heading</Text>
                                    <TextInput 
                                        placeholder="e.g. Summer Holiday Sale" value={formData.title} onChangeText={v => setFormData({...formData, title: v})}
                                        placeholderTextColor="#9ca3af"
                                        className="bg-slate-50 p-5 rounded-2xl font-black text-slate-900 text-base border border-slate-100 shadow-inner" 
                                    />
                                </View>

                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Offer Subtitle</Text>
                                    <TextInput 
                                        placeholder="e.g. Save up to ₹5000 on flights" value={formData.subtitle} onChangeText={v => setFormData({...formData, subtitle: v})}
                                        placeholderTextColor="#9ca3af"
                                        className="bg-slate-50 p-5 rounded-2xl font-black text-slate-900 text-base border border-slate-100 shadow-inner" 
                                    />
                                </View>

                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Banner Color Palette</Text>
                                    <View className="flex-row gap-3 mb-6">
                                        {['#1D4171', '#F07E21', '#0f172a', '#7c3aed', '#db2777'].map(c => (
                                            <TouchableOpacity key={c} onPress={() => setFormData({...formData, color: c})}
                                                style={{ backgroundColor: c }} className={`w-12 h-12 rounded-2xl border-4 active:scale-95 shadow-md ${formData.color === c ? 'border-white shadow-xl' : 'border-transparent'}`} />
                                        ))}
                                    </View>
                                </View>

                                <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-[#F07E21] py-5 rounded-2xl items-center border border-[#F07E21] border-b-[6px] border-b-[#D96B18] shadow-xl shadow-orange-500/30 active:scale-95 mb-4">
                                    {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black text-xs uppercase tracking-widest">Publish to Platform</Text>}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
