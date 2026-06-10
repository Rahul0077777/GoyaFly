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
        minBookingAmount: '',
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
                minBookingAmount: offer.minBookingAmount ? offer.minBookingAmount.toString() : '',
                maxDiscountAmount: offer.maxDiscountAmount ? offer.maxDiscountAmount.toString() : '',
                validUntil: offer.validUntil ? offer.validUntil.split('T')[0] : '',
                isActive: offer.isActive
            });
        } else {
            setEditingOffer(null);
            setFormData({
                code: '',
                discountType: 'FLAT',
                discountValue: '',
                minBookingAmount: '',
                maxDiscountAmount: '',
                validUntil: '',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.code || !formData.discountValue || !formData.validUntil) {
            return Toast.show({ type: 'info', text1: 'Error', text2: 'Please fill in Code, Value and Expiry' });
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                discountValue: parseFloat(formData.discountValue),
                minBookingAmount: formData.minBookingAmount ? parseFloat(formData.minBookingAmount) : 0,
                maxDiscountAmount: formData.maxDiscountAmount && formData.discountType === 'PERCENTAGE' ? parseFloat(formData.maxDiscountAmount) : undefined
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
                        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 active:scale-95 shadow-sm mr-3">
                            <Ionicons name="arrow-back" size={20} color="#0f172a" />
                        </TouchableOpacity>
                        <View className="bg-orange-50 w-10 h-10 rounded-xl items-center justify-center border border-orange-100 shadow-sm mr-3">
                            <Ionicons name="pricetag" size={20} color="#F07E21" />
                        </View>
                        <View>
                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Offers & Coupons</Text>
                            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-0.5">Promotion Engine</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => handleOpenModal()} className="bg-slate-900 px-4 py-2.5 rounded-lg shadow-md active:scale-95">
                        <Text className="text-white font-black text-[9px] uppercase tracking-wider">+ ADD OFFER</Text>
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
                                        className={`p-6 rounded-3xl border border-slate-100 border-b-[8px] border-slate-200 mb-6 shadow-xl shadow-slate-200/50 ${!isActive ? 'opacity-60' : ''}`}>
                                <View className="flex-row justify-between items-start mb-5 pb-4 border-b border-slate-100">
                                            <View className="flex-1 pr-2">
                                                <View className={`px-2.5 py-1 rounded-md border mb-1.5 shadow-sm self-start ${isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                                    <Text className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-800' : 'text-slate-500'}`}>{status}</Text>
                                                </View>
                                                <Text style={{ color: t.text }} className="text-xl font-black tracking-wide" numberOfLines={1} adjustsFontSizeToFit>{o.code}</Text>
                                            </View>
                                            <View className="flex-row gap-2 mt-1">
                                                <TouchableOpacity onPress={() => handleOpenModal(o)} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm">
                                                    <Ionicons name="settings" size={14} color="#0f172a" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDelete(o._id)} className="bg-rose-50 p-2.5 rounded-xl border border-rose-100 border-b-4 border-rose-200 active:scale-95 shadow-sm">
                                                    <Ionicons name="trash" size={14} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View className="flex-row flex-wrap justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-100 shadow-sm gap-y-2">
                                            <View className="mr-2">
                                                <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Discount</Text>
                                                <Text className="text-[#F07E21] font-black text-xl tracking-tight">
                                                    {o.discountType === 'FLAT' ? '₹' : ''}{o.discountValue}{o.discountType === 'PERCENTAGE' ? '%' : ''}
                                                </Text>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Expires On</Text>
                                                <Text className="text-slate-800 font-black text-xs mt-0.5">{new Date(o.validUntil).toLocaleDateString()}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}

                        {/* Marketing Engine Footer */}
                        <View className="bg-slate-900 p-8 rounded-[2.5rem] mt-2 mb-10 shadow-2xl relative overflow-hidden" style={{ elevation: 12 }}>
                            <View className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-12 -mt-12 blur-xl" />
                            <View className="flex-row items-center mb-6 z-10">
                                <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center mr-5 rotate-12 shadow-lg shadow-white/10">
                                    <Ionicons name="megaphone" size={28} color="#F07E21" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white font-black text-xl tracking-wide">Master Marketing Engine</Text>
                                    <Text className="text-slate-400 font-bold text-[10px] mt-1 leading-snug">Schedule push notifications & emails to your entire agent network.</Text>
                                </View>
                            </View>
                            <TouchableOpacity className="bg-white py-4 rounded-xl items-center active:scale-95 shadow-md">
                                <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest">Launch Blast</Text>
                            </TouchableOpacity>
                        </View>
                        <View className="h-10" />
                    </ScrollView>
                )}
            </SafeAreaView>

            {/* Campaign Form Modal */}
            <Modal visible={isModalOpen} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-[2.5rem] shadow-2xl border-t border-slate-100 max-h-[90%]">
                        <View className="p-6 border-b border-slate-100 flex-row justify-between items-center bg-slate-50/50 rounded-t-[2.5rem]">
                            <View>
                                <Text className="text-xl font-black text-[#0f172a] uppercase tracking-wide">
                                    {editingOffer ? 'Edit Offer' : 'New Offer'}
                                </Text>
                                <Text className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">Promotion Details</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)} className="w-10 h-10 bg-white rounded-xl items-center justify-center border border-slate-100 active:scale-95 shadow-sm">
                                <Ionicons name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} className="p-6">
                            <View className="space-y-4 pb-10">
                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Coupon Code</Text>
                                    <TextInput 
                                        placeholder="e.g. SUMMER25" 
                                        autoCapitalize="characters"
                                        value={formData.code} 
                                        onChangeText={v => setFormData({ ...formData, code: v.toUpperCase() })}
                                        className="bg-slate-50 px-5 py-4 rounded-xl text-lg font-black text-slate-900 border border-slate-100" 
                                    />
                                </View>

                                <View className="flex-col gap-4">
                                    <View>
                                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Type</Text>
                                        <View className="flex-row bg-slate-50 rounded-xl p-1 border border-slate-100">
                                            {['FLAT', 'PERCENTAGE'].map(type => {
                                                const active = formData.discountType === type;
                                                return (
                                                    <TouchableOpacity key={type} onPress={() => setFormData({ ...formData, discountType: type, maxDiscountAmount: type === 'FLAT' ? '' : formData.maxDiscountAmount })}
                                                        className={`flex-1 py-3.5 rounded-lg items-center ${active ? 'bg-white shadow-sm border border-slate-100' : ''}`}>
                                                        <Text className={`text-[10px] font-black tracking-widest ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                                                            {type === 'FLAT' ? 'FLAT (₹)' : 'PERCENT (%)'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                    <View>
                                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Discount Value</Text>
                                        <TextInput 
                                            placeholder="0" keyboardType="numeric" 
                                            value={formData.discountValue} 
                                            onChangeText={v => setFormData({ ...formData, discountValue: v })}
                                            className="bg-slate-50 px-5 py-4 rounded-xl text-base font-black text-slate-900 border border-slate-100" 
                                        />
                                    </View>
                                </View>

                                <View className="flex-row gap-3">
                                    <View className="flex-1">
                                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Min. Booking</Text>
                                        <TextInput 
                                            placeholder="0" keyboardType="numeric" 
                                            value={formData.minBookingAmount} 
                                            onChangeText={v => setFormData({ ...formData, minBookingAmount: v })}
                                            className="bg-slate-50 px-4 py-4 rounded-xl text-sm font-black text-slate-900 border border-slate-100" 
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Max Cap</Text>
                                        <TextInput 
                                            placeholder="None" keyboardType="numeric" 
                                            value={formData.maxDiscountAmount} 
                                            onChangeText={v => setFormData({ ...formData, maxDiscountAmount: v })}
                                            editable={formData.discountType === 'PERCENTAGE'}
                                            className={`px-4 py-4 rounded-xl text-sm font-black text-slate-900 border border-slate-100 ${formData.discountType === 'FLAT' ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`} 
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Expiry Date (YYYY-MM-DD)</Text>
                                    <TextInput 
                                        placeholder="2024-12-31" 
                                        value={formData.validUntil} 
                                        onChangeText={v => setFormData({ ...formData, validUntil: v })}
                                        className="bg-slate-50 px-5 py-4 rounded-xl text-sm font-black text-slate-900 border border-slate-100" 
                                    />
                                </View>

                                <View className="flex-row justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2">
                                    <View>
                                        <Text className="font-black text-slate-800 text-sm tracking-wide mb-0.5">Active Status</Text>
                                        <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Enable usage</Text>
                                    </View>
                                    <Switch 
                                        value={formData.isActive} 
                                        onValueChange={v => setFormData({ ...formData, isActive: v })}
                                        trackColor={{ false: '#cbd5e1', true: '#10b981' }}
                                    />
                                </View>

                                <TouchableOpacity 
                                    onPress={handleSave} 
                                    disabled={saving}
                                    className="bg-slate-900 py-4 rounded-xl items-center shadow-lg active:scale-95 mt-4"
                                >
                                    {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black uppercase text-xs tracking-widest">Publish Campaign</Text>}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
