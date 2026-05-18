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
    { id: 'LOW', label: 'Low', color: '#64748b' },
    { id: 'MEDIUM', label: 'Medium', color: '#f97316' },
    { id: 'HIGH', label: 'High', color: '#ef4444' },
    { id: 'URGENT', label: 'Urgent', color: '#991b1b' }
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
                navigation.goBack();
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
                <View className="px-6 py-4 flex-row items-center border-b border-gray-100 bg-white">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-11 h-11 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 shadow-sm mr-4 active:scale-95">
                        <Ionicons name="close" size={24} color={t.text} />
                    </TouchableOpacity>
                    <Text style={{ color: t.text }} className="text-xl font-black uppercase">New Support Request</Text>
                </View>

                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                    style={{ flex: 1 }}
                >
                    <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                        {/* Category Picker */}
                        <Text className="text-[10px] font-black text-gray-400 uppercase mb-4">Select Category</Text>
                        <View className="flex-row flex-wrap gap-2 mb-8">
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity 
                                    key={cat.id} 
                                    onPress={() => setCategory(cat.id)}
                                    className={`px-5 py-3 rounded-2xl border active:scale-95 ${category === cat.id ? 'bg-[#1D4171] border-[#1D4171] border-b-4 border-[#11294a] shadow-md shadow-blue-900/20' : 'bg-white border-slate-100 border-b-4 border-slate-200 shadow-sm'}`}
                                >
                                    <View className="flex-row items-center">
                                        <Text className="mr-2">{cat.icon}</Text>
                                        <Text className={`text-[10px] font-black uppercase tracking-widest ${category === cat.id ? 'text-white' : 'text-gray-500'}`}>{cat.label}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Priority Picker */}
                        <Text className="text-[10px] font-black text-gray-400 uppercase mb-4">Set Priority</Text>
                        <View className="flex-row gap-2 mb-8">
                            {PRIORITIES.map(p => (
                                <TouchableOpacity 
                                    key={p.id} 
                                    onPress={() => setPriority(p.id)}
                                    className={`flex-1 py-3 rounded-2xl border items-center active:scale-95 ${priority === p.id ? 'bg-[#1D4171] border-[#1D4171] border-b-4 border-[#11294a] shadow-md shadow-blue-900/20' : 'bg-white border-slate-100 border-b-4 border-slate-200 shadow-sm'}`}
                                >
                                    <Text className={`text-[10px] font-black uppercase tracking-widest ${priority === p.id ? 'text-white' : 'text-gray-400'}`}>{p.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Subject */}
                        <Text className="text-[10px] font-black text-gray-400 uppercase mb-4">Subject</Text>
                        <TextInput
                            placeholder="Briefly describe the issue..."
                            value={subject}
                            onChangeText={setSubject}
                            className="bg-slate-50 px-6 py-5 rounded-2xl border border-slate-100 shadow-inner text-sm font-black text-slate-800 mb-8"
                        />

                        {/* Description */}
                        <Text className="text-[10px] font-black text-gray-400 uppercase mb-4">Full Description</Text>
                        <TextInput
                            placeholder="Tell us more about the problem. If it is a booking issue, please include the PNR or Flight ID."
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            className="bg-slate-50 px-6 py-5 rounded-2xl border border-slate-100 shadow-inner text-sm font-medium text-slate-800 h-40 mb-10"
                        />

                        {/* Submit Button */}
                        <TouchableOpacity 
                            onPress={handleSubmit}
                            disabled={loading}
                            className="bg-[#F07E21] mb-20 py-6 rounded-2xl items-center border border-[#F07E21] border-b-[6px] border-[#c76014] shadow-xl shadow-orange-500/30 active:scale-95"
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text className="text-white font-black text-sm uppercase tracking-widest">Submit Support Ticket</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
