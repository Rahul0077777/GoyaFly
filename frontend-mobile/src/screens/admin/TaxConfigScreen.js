import React, { useState, useEffect } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, 
    TextInput, ActivityIndicator, Modal, KeyboardAvoidingView, Platform 
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';

export default function TaxConfigScreen({ navigation }) {
    const t = useThemeColors();
    const [taxes, setTaxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        rate: '',
        type: 'Percentage',
        applyTo: 'Commission'
    });

    useEffect(() => {
        fetchTaxes();
    }, []);

    const fetchTaxes = async () => {
        setLoading(true);
        try {
            const res = await adminService.getTaxes();
            if (res.success) setTaxes(res.data);
        } catch (err) {
            console.error('Fetch taxes error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (tax = null) => {
        if (tax) {
            setEditingTax(tax);
            setFormData({
                name: tax.name,
                rate: tax.rate.toString(),
                type: tax.type,
                applyTo: tax.applyTo
            });
        } else {
            setEditingTax(null);
            setFormData({
                name: '',
                rate: '',
                type: 'Percentage',
                applyTo: 'Commission'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.rate) {
            return Toast.show({ type: 'info', text1: 'Error', text2: 'Please fill in all fields' });
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                rate: parseFloat(formData.rate)
            };

            let res;
            if (editingTax) {
                res = await adminService.updateTax(editingTax._id, payload);
            } else {
                res = await adminService.createTax(payload);
            }

            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Tax configuration updated' });
                setIsModalOpen(false);
                fetchTaxes();
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Failed to save tax rule' });
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save configuration' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id, name) => {
        const { Alert } = require('react-native');
        Alert.alert('Delete Tax', `Remove "${name}" rule?`, [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive', 
                onPress: async () => {
                    try {
                        const res = await adminService.deleteTax(id);
                        if (res.success) {
                            Toast.show({ type: 'success', text1: 'Deleted', text2: 'Tax rule removed.' });
                            fetchTaxes();
                        }
                    } catch (err) {
                        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete tax rule' });
                    }
                } 
            },
        ]);
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
                        <View className="bg-emerald-50 w-12 h-12 rounded-2xl items-center justify-center border border-emerald-100 shadow-sm mr-3.5">
                            <Ionicons name="calculator" size={24} color="#059669" />
                        </View>
                        <View>
                            <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">Fiscal Engine</Text>
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Tax & Compliance Setup</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => handleOpenModal()} className="bg-[#F07E21] px-5 py-3.5 rounded-2xl border border-[#F07E21] border-b-4 border-b-[#D96B18] shadow-lg shadow-orange-500/30 active:scale-95">
                        <Text className="text-white font-black text-[10px] uppercase tracking-wider">+ New Rule</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#F07E21" size="large" />
                    </View>
                ) : (
                    <ScrollView className="flex-1 px-5 pt-2" showsVerticalScrollIndicator={false}>
                        {taxes.map((tx) => (
                            <View key={tx._id} style={{ backgroundColor: t.card, elevation: 8 }}
                                className="p-7 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 mb-6 shadow-2xl shadow-slate-300/40">
                                <View className="flex-row justify-between items-start mb-6 pb-4 border-b border-slate-100">
                                    <View className="flex-1 pr-3">
                                        <Text style={{ color: t.text }} className="text-xl font-black tracking-wide mb-2">{tx.name}</Text>
                                        <View className="flex-row items-center">
                                            <View className="bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                                                <Text className="text-slate-700 text-[10px] font-black uppercase tracking-widest">{tx.applyTo} BASE</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View className="flex-row gap-3">
                                        <TouchableOpacity onPress={() => handleOpenModal(tx)} className="w-12 h-12 bg-slate-900 rounded-2xl items-center justify-center border border-slate-900 border-b-4 border-b-slate-800 shadow-md active:scale-95">
                                            <Ionicons name="create" size={18} color="#FFF" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(tx._id, tx.name)} className="w-12 h-12 bg-rose-50 rounded-2xl items-center justify-center border border-rose-100 border-b-4 border-b-rose-200 shadow-sm active:scale-95">
                                            <Ionicons name="trash" size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View className="flex-row justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{tx.type} RATE</Text>
                                    <Text className="text-3xl font-black text-slate-900 tracking-tight">
                                        {tx.type === 'Flat' ? '₹' : ''}{tx.rate}{tx.type === 'Percentage' ? '%' : ''}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        {/* Legal Compliance Banner */}
                        <View className="bg-amber-50 border-2 border-dashed border-amber-200 p-7 rounded-[2.5rem] mt-2 mb-10 flex-row items-center shadow-inner">
                            <Text className="text-4xl mr-5">⚖️</Text>
                            <View className="flex-1">
                                <Text className="text-amber-900 font-black text-base tracking-wide mb-1">Legal Compliance Notice</Text>
                                <Text className="text-amber-800 font-bold text-xs leading-5">
                                    Tax changes apply to <Text className="italic underline font-black">new bookings</Text> only. Auditing history is preserved.
                                </Text>
                            </View>
                        </View>
                        <View className="h-10" />
                    </ScrollView>
                )}
            </SafeAreaView>

            {/* Modal */}
            <Modal visible={isModalOpen} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/60 justify-end">
                    <View style={{ elevation: 24 }} className="bg-white rounded-t-[3.5rem] p-8 pb-12 shadow-2xl border-t border-slate-100">
                        <View className="flex-row justify-between items-center mb-8 pb-4 border-b border-slate-100">
                            <View>
                                <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide uppercase">
                                    {editingTax ? 'Edit Fiscal Rule' : 'New Fiscal Rule'}
                                </Text>
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Global compliance setup</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm">
                                <Ionicons name="close" size={22} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="space-y-6 pb-2">
                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Rule Name</Text>
                                    <TextInput 
                                        placeholder="e.g., Service GST" 
                                        value={formData.name} 
                                        onChangeText={v => setFormData({...formData, name: v})}
                                        placeholderTextColor="#9ca3af"
                                        className="bg-slate-50 p-5 rounded-2xl font-black text-slate-900 text-base border border-slate-100 shadow-inner" 
                                    />
                                </View>

                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Rate / Value</Text>
                                        <TextInput 
                                            placeholder="0.00" 
                                            keyboardType="numeric" 
                                            value={formData.rate} 
                                            onChangeText={v => setFormData({...formData, rate: v})}
                                            placeholderTextColor="#9ca3af"
                                            className="bg-slate-50 p-5 rounded-2xl font-black text-slate-900 text-base border border-slate-100 shadow-inner" 
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Logic Type</Text>
                                        <View className="flex-row bg-slate-50 rounded-2xl p-1.5 border border-slate-100 shadow-inner">
                                            {['Percentage', 'Flat'].map(type => (
                                                <TouchableOpacity key={type} onPress={() => setFormData({...formData, type})}
                                                    className={`flex-1 py-3.5 rounded-xl items-center justify-center ${formData.type === type ? 'bg-white shadow-md border border-slate-100' : ''}`}>
                                                    <Text className={`text-xs font-black tracking-wider ${formData.type === type ? 'text-slate-900' : 'text-slate-400'}`}>
                                                        {type === 'Percentage' ? '%' : '₹'}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Calculation Base</Text>
                                    <View className="flex-row flex-wrap gap-3 mb-6">
                                        {['Commission', 'Gross Fare', 'Transaction'].map(base => (
                                            <TouchableOpacity key={base} onPress={() => setFormData({...formData, applyTo: base})}
                                                className={`px-5 py-4 rounded-2xl border active:scale-95 ${formData.applyTo === base ? 'bg-slate-900 border-slate-900 border-b-4 border-b-slate-800 shadow-md' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                                                <Text className={`text-xs font-black uppercase tracking-wider ${formData.applyTo === base ? 'text-white' : 'text-slate-400'}`}>{base}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <TouchableOpacity 
                                    onPress={handleSave} 
                                    disabled={saving}
                                    className="bg-[#F07E21] py-5 rounded-2xl items-center border border-[#F07E21] border-b-[6px] border-b-[#D96B18] shadow-xl shadow-orange-500/30 active:scale-95 mt-2 mb-4"
                                >
                                    {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black text-xs uppercase tracking-widest">Update Global Config</Text>}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
