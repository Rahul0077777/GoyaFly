import React, { useState } from 'react';
import { 
    View, Text, ScrollView, TextInput, TouchableOpacity, 
    ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { agentService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';

const CATEGORIES = [
    { id: 'TECHNICAL', label: 'Technical Issue', icon: '⚙️' },
    { id: 'BILLING', label: 'Billing/Refund', icon: '💰' },
    { id: 'BOOKING', label: 'Booking Help', icon: '✈️' },
    { id: 'CANCELLATION', label: 'Cancellation', icon: '✕' },
    { id: 'OTHER', label: 'Other Support', icon: '💬' }
];

const PRIORITIES = [
    { id: 'LOW', label: 'Low', color: '#64748b', activeBg: '#f1f5f9', activeText: '#475569' },
    { id: 'MEDIUM', label: 'Medium', color: '#f97316', activeBg: '#ffedd5', activeText: '#c2410c' },
    { id: 'HIGH', label: 'High', color: '#ef4444', activeBg: '#fee2e2', activeText: '#b91c1c' },
    { id: 'URGENT', label: 'Urgent', color: '#991b1b', activeBg: '#fecaca', activeText: '#7f1d1d' }
];

export default function NewTicketScreen({ navigation }) {
    const t = useThemeColors();
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('TECHNICAL');
    const [priority, setPriority] = useState('MEDIUM');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!subject.trim() || !message.trim()) {
            return Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill in both subject and description.' });
        }

        setLoading(true);
        try {
            const res = await agentService.createTicket({
                subject: subject.trim(),
                category,
                priority,
                initialMessage: message.trim()
            });

            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Ticket created successfully.' });
                // We go back and refresh the list
                navigation.goBack();
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Failed to create ticket.' });
            }
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to create ticket. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style={t.statusBar} />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-6 py-4 flex-row items-center border-b border-slate-100 bg-white">
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={{ backgroundColor: t.card, borderColor: t.cardBorder }}
                        className="w-11 h-11 rounded-2xl items-center justify-center border border-b-4 shadow-sm mr-4 active:scale-95"
                    >
                        <Ionicons name="close" size={22} color={t.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={{ color: t.text }} className="text-lg font-black uppercase tracking-wide">New Support Request</Text>
                        <Text style={{ color: t.textMuted }} className="font-bold text-[9px] uppercase tracking-widest">Submit a ticket to admin</Text>
                    </View>
                </View>

                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                    style={{ flex: 1 }}
                >
                    <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                        {/* Category Picker */}
                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest ml-1">Select Category</Text>
                        <View className="flex-row flex-wrap gap-2 mb-6">
                            {CATEGORIES.map(cat => {
                                const isSelected = category === cat.id;
                                return (
                                    <TouchableOpacity 
                                        key={cat.id} 
                                        onPress={() => setCategory(cat.id)}
                                        style={{ 
                                            backgroundColor: isSelected ? '#1D4171' : '#F8FAFC',
                                            borderColor: isSelected ? '#1D4171' : '#E2E8F0',
                                        }}
                                        className="px-4 py-3.5 rounded-2xl border active:scale-95 flex-row items-center"
                                    >
                                        <Text className="mr-2 text-sm">{cat.icon}</Text>
                                        <Text 
                                            style={{ color: isSelected ? '#fff' : '#64748b' }}
                                            className="text-[10px] font-black uppercase tracking-wider"
                                        >
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Priority Picker */}
                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest ml-1">Set Priority</Text>
                        <View className="flex-row gap-2 mb-6">
                            {PRIORITIES.map(p => {
                                const isSelected = priority === p.id;
                                return (
                                    <TouchableOpacity 
                                        key={p.id} 
                                        onPress={() => setPriority(p.id)}
                                        style={{ 
                                            backgroundColor: isSelected ? p.activeBg : '#F8FAFC',
                                            borderColor: isSelected ? p.color : '#E2E8F0',
                                        }}
                                        className="flex-1 py-3.5 rounded-2xl border items-center active:scale-95"
                                    >
                                        <Text 
                                            style={{ color: isSelected ? p.activeText : '#64748b' }}
                                            className="text-[10px] font-black uppercase tracking-wider"
                                        >
                                            {p.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Subject */}
                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Subject</Text>
                        <TextInput
                            placeholder="Briefly describe the issue..."
                            value={subject}
                            onChangeText={setSubject}
                            style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}
                            className="px-5 py-4.5 rounded-2xl border text-sm font-semibold text-slate-800 mb-6 shadow-sm"
                            placeholderTextColor="#A0AEC0"
                        />

                        {/* Description */}
                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Full Description</Text>
                        <TextInput
                            placeholder="Provide a detailed description of your issue. Include PNR or Booking ID if applicable."
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', height: 160 }}
                            className="px-5 py-4.5 rounded-2xl border text-sm font-medium text-slate-800 mb-8 shadow-sm"
                            placeholderTextColor="#A0AEC0"
                        />

                        {/* Submit Button */}
                        <TouchableOpacity 
                            onPress={handleSubmit}
                            disabled={loading}
                            style={{ backgroundColor: '#0B1A42', borderColor: '#0B1A42' }}
                            className="mb-20 py-5 rounded-2xl items-center border border-b-4 border-b-[#060e24] shadow-lg active:scale-95"
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text className="text-white font-black text-xs uppercase tracking-widest">SUBMIT TICKET</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
