import React, { useState, useEffect } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, 
    TextInput, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Switch
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';

export default function OfferManagerScreen({ navigation }) {
    const t = useThemeColors();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        discountType: 'FLAT',
        discountValue: '',
        minBookingAmount: '0',
        maxDiscountAmount: '',
        validUntil: '',
        isActive: true
    });

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        setLoading(true);
        try {
            const res = await adminService.getCoupons();
            if (res.success) setOffers(res.data);
        } catch (err) {
            console.error('Fetch offers error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (offer = null) => {
        if (offer) {
            setEditingOffer(offer);
            setFormData({
                code: offer.code,
                discountType: offer.discountType,
                discountValue: offer.discountValue.toString(),
                minBookingAmount: (offer.minBookingAmount || 0).toString(),
                maxDiscountAmount: (offer.maxDiscountAmount || '').toString(),
                validUntil: offer.validUntil ? offer.validUntil.split('T')[0] : '',
                isActive: offer.isActive
            });
        } else {
            setEditingOffer(null);
            setFormData({
                code: '',
                discountType: 'FLAT',
                discountValue: '',
                minBookingAmount: '0',
                maxDiscountAmount: '',
                validUntil: '',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.code || !formData.discountValue || !formData.validUntil) {
            return Toast.show({ type: 'info', text1: 'Error', text2: 'Please fill in all mandatory fields (Code, Value, Expiry)' });
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                discountValue: parseFloat(formData.discountValue),
                minBookingAmount: parseFloat(formData.minBookingAmount || 0),
                maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined
            };

            let res;
            if (editingOffer) {
                res = await adminService.updateCoupon(editingOffer._id, payload);
            } else {
                res = await adminService.createCoupon(payload);
            }

            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Campaign updated successfully' });
                setIsModalOpen(false);
                fetchOffers();
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Failed to save campaign' });
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save configuration' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id) => {
        const { Alert } = require('react-native');
        Alert.alert('Delete Campaign', 'Are you sure you want to remove this promo code?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive', 
                onPress: async () => {
                    try {
                        const res = await adminService.deleteCoupon(id);
                        if (res.success) {
                            Toast.show({ type: 'success', text1: 'Deleted', text2: 'Promo code removed.' });
                            fetchOffers();
                        }
                    } catch (err) {
                        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete campaign' });
                    }
                } 
            },
        ]);
    };

    const getStatus = (o) => {
        if (!o.isActive) return 'Disabled';
        if (new Date(o.validUntil) < new Date()) return 'Expired';
        return 'Active';
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
                        <View className="bg-orange-50 w-12 h-12 rounded-2xl items-center justify-center border border-orange-100 shadow-sm mr-3.5">
                            <Ionicons name="megaphone" size={24} color="#F07E21" />
                        </View>
                        <View>
                            <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">Campaign Manager</Text>
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Promotion & Loyalty Engine</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => handleOpenModal()} className="bg-[#F07E21] px-5 py-3.5 rounded-2xl border border-[#F07E21] border-b-4 border-b-[#D96B18] shadow-lg shadow-orange-500/30 active:scale-95">
                        <Text className="text-white font-black text-[10px] uppercase tracking-wider">+ New Offer</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#F07E21" size="large" />
                    </View>
                ) : (
                    <ScrollView className="flex-1 px-5 pt-2" showsVerticalScrollIndicator={false}>
                        {offers.length === 0 ? (
                            <View className="py-24 items-center">
                                <Ionicons name="ticket-outline" size={64} color="#cbd5e1" className="mb-4" />
                                <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Active Campaigns</Text>
                                <Text className="text-slate-400 font-bold text-xs">Create your first promo code campaign.</Text>
                            </View>
                        ) : (
                            offers.map((o) => {
                                const status = getStatus(o);
                                const isActive = status === 'Active';
                                return (
                                    <View key={o._id} style={{ backgroundColor: t.card, elevation: 8 }}
                                        className={`p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 mb-6 shadow-2xl shadow-slate-300/40 ${!isActive ? 'opacity-60' : ''}`}>
                                        <View className="flex-row justify-between items-start mb-6 pb-4 border-b border-slate-100">
                                            <View className="flex-1 pr-2">
                                                <View className={`px-3.5 py-1.5 rounded-xl border mb-2 shadow-sm self-start ${isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                                    <Text className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-800' : 'text-slate-500'}`}>{status}</Text>
                                                </View>
                                                <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">{o.code}</Text>
                                            </View>
                                            <View className="flex-row gap-2.5">
                                                <TouchableOpacity onPress={() => handleOpenModal(o)} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm">
                                                    <Ionicons name="settings" size={18} color="#0f172a" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDelete(o._id)} className="bg-rose-50 p-3.5 rounded-2xl border border-rose-100 border-b-4 border-rose-200 active:scale-95 shadow-sm">
                                                    <Ionicons name="trash" size={18} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View className="flex-row justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            <View>
                                                <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Discount Value</Text>
                                                <Text className="text-[#1D4171] font-black text-3xl tracking-tight">
                                                    {o.discountType === 'FLAT' ? '₹' : ''}{o.discountValue}{o.discountType === 'PERCENTAGE' ? '%' : ''}
                                                </Text>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Expires On</Text>
                                                <Text className="text-slate-800 font-black text-sm mt-0.5">{new Date(o.validUntil).toLocaleDateString()}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}

                        {/* Campaign Engine Footer */}
                        <View className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 border-b-[8px] border-black mt-4 mb-10 shadow-2xl shadow-slate-900/40 relative overflow-hidden" style={{ elevation: 12 }}>
                            <View className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-12 -mt-12" />
                            <View className="flex-row items-center mb-6">
                                <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center mr-5 rotate-12 shadow-md">
                                    <Ionicons name="rocket" size={32} color="#F07E21" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white font-black text-xl tracking-wide">Marketing Hub</Text>
                                    <Text className="text-slate-400 font-bold text-xs mt-1">Schedule notifications & emails</Text>
                                </View>
                            </View>
                            <TouchableOpacity className="bg-white py-4 rounded-2xl items-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-md">
                                <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest">Launch Campaign Blast</Text>
                            </TouchableOpacity>
                        </View>
                        <View className="h-10" />
                    </ScrollView>
                )}
            </SafeAreaView>

            {/* Modal */}
            <Modal visible={isModalOpen} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-[3rem] p-8 pb-12 border-t border-slate-100 shadow-2xl" style={{ elevation: 24 }}>
                        <View className="flex-row justify-between items-center mb-8 border-b border-slate-100 pb-4">
                            <View>
                                <Text className="text-2xl font-black text-[#1D4171] uppercase tracking-wide">
                                    {editingOffer ? 'Edit Campaign' : 'New Campaign'}
                                </Text>
                                <Text className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">Promotion Engineering</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm">
                                <Ionicons name="close" size={22} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Promo Code</Text>
                            <TextInput 
                                placeholder="e.g. WINTER500" 
                                autoCapitalize="characters"
                                value={formData.code} 
                                onChangeText={v => setFormData({ ...formData, code: v.toUpperCase() })}
                                placeholderTextColor="#9ca3af"
                                className="bg-slate-50 px-6 py-5 rounded-2xl text-xl font-black text-slate-900 border border-slate-100 mb-6 shadow-inner" 
                            />

                            <View className="flex-row gap-4 mb-6">
                                <View className="flex-1">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Discount Value</Text>
                                    <TextInput 
                                        placeholder="0.00" keyboardType="numeric" 
                                        value={formData.discountValue} 
                                        onChangeText={v => setFormData({ ...formData, discountValue: v })}
                                        placeholderTextColor="#9ca3af"
                                        className="bg-slate-50 px-6 py-5 rounded-2xl text-lg font-black text-slate-900 border border-slate-100 shadow-inner" 
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Type</Text>
                                    <View className="flex-row bg-slate-50 rounded-2xl p-1 border border-slate-100 shadow-inner">
                                        {['FLAT', 'PERCENTAGE'].map(type => {
                                            const active = formData.discountType === type;
                                            return (
                                                <TouchableOpacity key={type} onPress={() => setFormData({ ...formData, discountType: type })}
                                                    className={`flex-1 py-4 rounded-xl items-center ${active ? 'bg-white shadow-sm border border-slate-100' : ''}`}>
                                                    <Text className={`text-[10px] font-black tracking-widest ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                                                        {type === 'FLAT' ? '₹ CASH' : '% OFF'}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            </View>

                            <View className="flex-row gap-4 mb-8">
                                <View className="flex-1">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Expiry Date (YYYY-MM-DD)</Text>
                                    <TextInput 
                                        placeholder="2024-12-31" 
                                        value={formData.validUntil} 
                                        onChangeText={v => setFormData({ ...formData, validUntil: v })}
                                        placeholderTextColor="#9ca3af"
                                        className="bg-slate-50 px-6 py-5 rounded-2xl text-sm font-black text-slate-900 border border-slate-100 shadow-inner" 
                                    />
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-10 shadow-sm">
                                <View>
                                    <Text className="font-black text-slate-800 text-base tracking-wide mb-0.5">Campaign Active Status</Text>
                                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enable promo code usage</Text>
                                </View>
                                <Switch 
                                    value={formData.isActive} 
                                    onValueChange={v => setFormData({ ...formData, isActive: v })}
                                    trackColor={{ false: '#cbd5e1', true: '#22c55e' }}
                                    thumbColor="#FFF"
                                />
                            </View>

                            <TouchableOpacity 
                                onPress={handleSave} 
                                disabled={saving}
                                className="bg-[#F07E21] py-5 rounded-2xl items-center border border-[#F07E21] border-b-[6px] border-b-[#D96B18] shadow-xl shadow-orange-500/30 active:scale-95 mb-2"
                            >
                                {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black uppercase text-xs tracking-widest">Update Campaign Engine</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
