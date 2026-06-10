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

// Cross-Platform Color Map (Tailwind Class -> Hex)
const COLOR_MAP = {
    'bg-primary-600': '#1D4171',
    'bg-secondary-500': '#F07E21',
    'bg-gray-800': '#1f2937',
    'bg-purple-600': '#9333ea',
    'bg-rose-500': '#f43f5e'
};

const getHexColor = (colorCode) => {
    if (!colorCode) return '#1D4171';
    if (colorCode.startsWith('#')) return colorCode;
    return COLOR_MAP[colorCode] || '#1D4171';
};

export default function PromotionManagerScreen({ navigation }) {
    const t = useThemeColors();
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Banner Form State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '', subtitle: '', description: '', color: 'bg-primary-600', active: true
    });

    // Content Settings State
    const [isContentModalOpen, setIsContentModalOpen] = useState(false);
    const [savingContent, setSavingContent] = useState(false);
    const [contentData, setContentData] = useState({
        homepageHeroTitle: '', homepageHeroSubtitle: '',
        seoMetaTitle: '', seoMetaDescription: '',
        termsUrl: '', privacyUrl: ''
    });

    const fetchPromotions = useCallback(async () => {
        try {
            const res = await adminService.getPromotions();
            if (res.success) setBanners(res.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

    const handleOpenContentEditor = async () => {
        setIsContentModalOpen(true);
        try {
            const res = await adminService.getSettings();
            if (res && res.success) {
                setContentData({
                    homepageHeroTitle: res.data.homepageHeroTitle || 'Discover the World with Goyafly',
                    homepageHeroSubtitle: res.data.homepageHeroSubtitle || 'Your premium B2B travel portal for instant flight bookings, holidays, and visa processing.',
                    seoMetaTitle: res.data.seoMetaTitle || 'Goyafly B2B Travel Portal | Best Flight Fares & Fixed Departures',
                    seoMetaDescription: res.data.seoMetaDescription || 'Book guaranteed fixed departure seats, international holiday packages, and seamless visa processing with Goyafly.',
                    termsUrl: res.data.termsUrl || 'https://goyafly.com/terms',
                    privacyUrl: res.data.privacyUrl || 'https://goyafly.com/privacy'
                });
            }
        } catch (err) { Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load content settings' }); }
    };

    const handleSaveContent = async () => {
        setSavingContent(true);
        try {
            const res = await adminService.updateSettings(contentData);
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Homepage text & SEO updated!' });
                setIsContentModalOpen(false);
            }
        } catch (err) { Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save settings' }); }
        finally { setSavingContent(false); }
    };

    const handleOpenModal = (banner = null) => {
        if (banner) {
            setEditingId(banner._id);
            setFormData({
                title: banner.title, subtitle: banner.subtitle,
                description: banner.description || '',
                color: banner.color || 'bg-primary-600',
                active: banner.active
            });
        } else {
            setEditingId(null);
            setFormData({ title: '', subtitle: '', description: '', color: 'bg-primary-600', active: true });
        }
        setIsEditModalOpen(true);
    };

    const handleSaveBanner = async () => {
        if (!formData.title || !formData.subtitle) return Toast.show({ type: 'info', text1: 'Error', text2: 'Title and Subtitle required' });
        setSaving(true);
        try {
            const res = editingId 
                ? await adminService.updatePromotion(editingId, formData)
                : await adminService.createPromotion(formData);
                
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Promotion updated!' });
                setIsEditModalOpen(false);
                fetchPromotions();
            }
        } catch (err) { Toast.show({ type: 'error', text1: 'Error', text2: 'Save failed' }); }
        finally { setSaving(false); }
    };

    const handleDelete = (id) => {
        const { Alert } = require('react-native');
        Alert.alert('Delete Campaign', 'Remove this promotion?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                const res = await adminService.deletePromotion(id);
                if (res.success) { Toast.show({ type: 'success', text1: 'Deleted', text2: 'Removed.' }); fetchPromotions(); }
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
                <View className="px-5 py-4 flex-row items-center justify-between border-b border-slate-100 mb-2 bg-white z-10 shadow-sm">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 active:scale-95 mr-3">
                            <Ionicons name="arrow-back" size={20} color="#0f172a" />
                        </TouchableOpacity>
                        <View className="bg-purple-50 w-10 h-10 rounded-xl items-center justify-center border border-purple-100 shadow-sm mr-3">
                            <Ionicons name="megaphone" size={20} color="#9333ea" />
                        </View>
                        <View>
                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Display & Promos</Text>
                            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-0.5">Public Branding</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => handleOpenModal()} className="bg-slate-900 px-4 py-2.5 rounded-lg shadow-md active:scale-95">
                        <Text className="text-white font-black text-[9px] uppercase tracking-wider">+ ADD CAMPAIGN</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center"><ActivityIndicator color="#1D4171" size="large" /></View>
                ) : (
                    <ScrollView 
                        className="flex-1 px-5 pt-2" 
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchPromotions();}} />}
                    >
                        {banners.map(b => (
                            <View key={b._id} style={{ backgroundColor: t.card, elevation: 8 }}
                                className="rounded-3xl border border-slate-100 border-b-[8px] border-slate-200 shadow-xl shadow-slate-200/50 mb-6 overflow-hidden">
                                
                                {/* Banner Visual */}
                                <View style={{ backgroundColor: getHexColor(b.color), padding: 28, position: 'relative' }}>
                                    <View className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl" />
                                    <Text className="text-2xl font-black text-white mb-1.5 tracking-wide">{b.title}</Text>
                                    <Text className="text-white/80 font-bold text-xs tracking-wider">{b.subtitle}</Text>
                                </View>

                                {/* Controls */}
                                <View className="p-5 flex-row justify-between items-center bg-white">
                                    <View className="flex-1 pr-2">
                                        <Text className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${b.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {b.active ? 'LIVE ON HOMEPAGE' : 'INACTIVE / DRAFT'}
                                        </Text>
                                        <TouchableOpacity onPress={() => handleOpenModal(b)} className="flex-row items-center">
                                            <Ionicons name="settings" size={12} color="#94a3b8" />
                                            <Text className="text-[10px] font-black text-slate-400 hover:text-[#1D4171] ml-1 tracking-wide underline">Settings</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View className="flex-row items-center gap-3">
                                        <Switch value={b.active} onValueChange={() => toggleStatus(b)} trackColor={{ false: '#e2e8f0', true: '#10b981' }} />
                                        <TouchableOpacity onPress={() => handleDelete(b._id)} className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 shadow-sm active:scale-95">
                                            <Ionicons name="trash" size={16} color="#94a3b8" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}

                        {/* Homepage Content Editor Launcher */}
                        <TouchableOpacity onPress={handleOpenContentEditor} className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-[2rem] items-center justify-center mt-2 mb-10 active:opacity-70">
                            <Text className="text-3xl mb-3">📢</Text>
                            <Text className="text-base font-black text-slate-800 mb-1">Homepage Text & Content</Text>
                            <Text className="text-[10px] font-bold text-slate-400 text-center px-4 mb-4">Manage static hero text, SEO meta tags, and legal policy links.</Text>
                            <View className="bg-[#1D4171] px-5 py-2.5 rounded-xl shadow-sm">
                                <Text className="text-white font-black text-[9px] uppercase tracking-widest">Launch Content Editor</Text>
                            </View>
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </SafeAreaView>

            {/* Banner Editor Modal */}
            <Modal visible={isEditModalOpen} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/60 justify-end">
                    <View style={{ elevation: 24 }} className="bg-white rounded-t-3xl p-6 shadow-2xl border-t border-slate-100 max-h-[90%]">
                        <View className="flex-row justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <View>
                                <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">{editingId ? 'Edit Campaign' : 'New Campaign'}</Text>
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure banner display</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsEditModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 active:scale-95 shadow-sm">
                                <Ionicons name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="space-y-4 pb-10">
                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Campaign Title</Text>
                                    <TextInput 
                                        placeholder="e.g. Summer Holiday Sale" value={formData.title} onChangeText={v => setFormData({...formData, title: v})}
                                        className="bg-slate-50 p-4 rounded-xl font-bold text-slate-900 text-sm border border-slate-100" 
                                    />
                                </View>
                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Offer Subtitle</Text>
                                    <TextInput 
                                        placeholder="e.g. Save up to ₹5000 on flights" value={formData.subtitle} onChangeText={v => setFormData({...formData, subtitle: v})}
                                        className="bg-slate-50 p-4 rounded-xl font-bold text-slate-900 text-sm border border-slate-100" 
                                    />
                                </View>
                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Banner Color</Text>
                                    <View className="flex-row gap-2 mb-2 flex-wrap">
                                        {Object.keys(COLOR_MAP).map(colorClass => (
                                            <TouchableOpacity key={colorClass} onPress={() => setFormData({...formData, color: colorClass})}
                                                style={{ backgroundColor: COLOR_MAP[colorClass] }} 
                                                className={`w-11 h-11 rounded-xl border-4 active:scale-95 shadow-sm ${formData.color === colorClass ? 'border-white shadow-lg' : 'border-transparent'}`} />
                                        ))}
                                    </View>
                                </View>
                                <View className="flex-row justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <Text className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Initial Status (Live)</Text>
                                    <Switch value={formData.active} onValueChange={v => setFormData({...formData, active: v})} trackColor={{ false: '#e2e8f0', true: '#1D4171' }} />
                                </View>

                                <TouchableOpacity onPress={handleSaveBanner} disabled={saving} className="bg-slate-900 py-4 rounded-xl items-center shadow-lg active:scale-95 mt-2">
                                    {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black text-xs uppercase tracking-widest">{editingId ? 'Save Changes' : 'Publish Campaign'}</Text>}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Content Editor Modal */}
            <Modal visible={isContentModalOpen} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/60 justify-end">
                    <View style={{ elevation: 24 }} className="bg-white rounded-t-3xl shadow-2xl flex-1 mt-12">
                        <View className="p-6 bg-slate-900 rounded-t-3xl flex-row justify-between items-center">
                            <View>
                                <Text className="text-xl font-black text-white tracking-wide">SEO & Content</Text>
                                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Homepage static text configuration</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsContentModalOpen(false)} className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center active:scale-95">
                                <Ionicons name="close" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false} className="p-6">
                            <View className="space-y-5 pb-10">
                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Hero Title</Text>
                                    <TextInput 
                                        value={contentData.homepageHeroTitle} onChangeText={v => setContentData({...contentData, homepageHeroTitle: v})}
                                        className="bg-slate-50 p-4 rounded-xl font-bold text-slate-900 text-sm border border-slate-100" 
                                    />
                                </View>
                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Hero Subtitle</Text>
                                    <TextInput 
                                        multiline numberOfLines={3} style={{ textAlignVertical: 'top' }}
                                        value={contentData.homepageHeroSubtitle} onChangeText={v => setContentData({...contentData, homepageHeroSubtitle: v})}
                                        className="bg-slate-50 p-4 rounded-xl font-bold text-slate-900 text-sm border border-slate-100 min-h-[80px]" 
                                    />
                                </View>
                                <View className="h-px bg-slate-100 my-2" />
                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">SEO Meta Title</Text>
                                    <TextInput 
                                        value={contentData.seoMetaTitle} onChangeText={v => setContentData({...contentData, seoMetaTitle: v})}
                                        className="bg-slate-50 p-4 rounded-xl font-bold text-slate-900 text-sm border border-slate-100" 
                                    />
                                </View>
                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">SEO Meta Description</Text>
                                    <TextInput 
                                        multiline numberOfLines={3} style={{ textAlignVertical: 'top' }}
                                        value={contentData.seoMetaDescription} onChangeText={v => setContentData({...contentData, seoMetaDescription: v})}
                                        className="bg-slate-50 p-4 rounded-xl font-bold text-slate-900 text-sm border border-slate-100 min-h-[80px]" 
                                    />
                                </View>
                                <View className="h-px bg-slate-100 my-2" />
                                <View className="flex-row gap-3">
                                    <View className="flex-1">
                                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Terms URL</Text>
                                        <TextInput 
                                            value={contentData.termsUrl} onChangeText={v => setContentData({...contentData, termsUrl: v})}
                                            className="bg-slate-50 p-3.5 rounded-xl font-bold text-slate-900 text-xs border border-slate-100" 
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Privacy URL</Text>
                                        <TextInput 
                                            value={contentData.privacyUrl} onChangeText={v => setContentData({...contentData, privacyUrl: v})}
                                            className="bg-slate-50 p-3.5 rounded-xl font-bold text-slate-900 text-xs border border-slate-100" 
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity onPress={handleSaveContent} disabled={savingContent} className="bg-[#1D4171] py-4 rounded-xl items-center shadow-lg active:scale-95 mt-4 mb-20 border-b-4 border-b-[#0f2342]">
                                    {savingContent ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black text-xs uppercase tracking-widest">Save Content & SEO</Text>}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
