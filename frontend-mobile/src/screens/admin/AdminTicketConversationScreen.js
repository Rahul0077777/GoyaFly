import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, ScrollView, TextInput, TouchableOpacity, 
    ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';

export default function AdminTicketConversationScreen({ navigation, route }) {
    const t = useThemeColors();
    const { ticket } = route.params;
    const [localTicket, setLocalTicket] = useState(ticket);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const scrollViewRef = useRef();

    const fetchTicketDetails = async () => {
        try {
            const res = await adminService.adminGetAllTickets();
            if (res.success) {
                const found = res.data.find(tk => tk._id === ticket._id);
                setLocalTicket(found);
            }
        } catch (e) { console.error(e); }
    };

    const handleSend = async (newStatus = null) => {
        if (!message.trim() && !newStatus) return;
        setSending(true);
        try {
            const res = await adminService.adminReplyTicket(localTicket._id, { 
                message: message.trim() || `Status updated to ${newStatus}`, 
                status: newStatus || localTicket.status 
            });
            if (res.success) {
                setLocalTicket(res.data);
                setMessage('');
                if (newStatus) Toast.show({ type: 'success', text1: 'Success', text2: `Ticket marked as ${newStatus}` });
                fetchTicketDetails();
            }
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to send reply' });
        } finally {
            setSending(false);
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
                    <View className="flex-1 pr-2">
                        <Text style={{ color: t.text }} className="text-xl font-black tracking-wide mb-0.5" numberOfLines={1}>{localTicket.subject}</Text>
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{localTicket.agentId?.agencyName} • {localTicket.status}</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => handleSend('RESOLVED')}
                        className="bg-emerald-600 px-4 py-3 rounded-xl border border-emerald-600 border-b-4 border-b-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95"
                    >
                        <Text className="text-white font-black text-[10px] uppercase tracking-widest">Resolve</Text>
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <ScrollView 
                        ref={scrollViewRef}
                        className="flex-1 px-5 pt-4" 
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    >
                        {localTicket.messages.map((msg, idx) => {
                            const isMe = msg.senderModel === 'Admin';
                            return (
                                <View key={idx} className={`mb-6 max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                    <View 
                                        style={{ backgroundColor: isMe ? '#1D4171' : '#fff', borderBottomRightRadius: isMe ? 4 : 28, borderBottomLeftRadius: isMe ? 28 : 4 }}
                                        className={`p-5 rounded-[1.8rem] shadow-md border ${isMe ? 'border-[#1D4171] border-b-4 border-b-[#11294a]' : 'border-slate-100 border-b-4 border-b-slate-200'}`}
                                    >
                                        <Text style={{ color: isMe ? '#fff' : t.text }} className="text-sm font-bold leading-6 tracking-wide">{msg.message}</Text>
                                    </View>
                                    <View className="flex-row items-center mt-2 ml-1 mr-1">
                                        <Text className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                            {isMe ? 'Me (Admin)' : localTicket.agentId?.agentName} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                        <View className="h-10" />
                    </ScrollView>

                    {/* Input Area */}
                    <View className="p-5 bg-white border-t border-slate-100 shadow-2xl">
                        <View className="flex-row items-center bg-slate-50 rounded-3xl px-6 py-2 border border-slate-200 shadow-inner">
                            <TextInput
                                placeholder="Admin Reply..."
                                value={message} onChangeText={setMessage}
                                placeholderTextColor="#9ca3af"
                                multiline className="flex-1 text-sm font-black text-slate-900 py-3.5 pr-2"
                            />
                            <TouchableOpacity 
                                onPress={() => handleSend()} disabled={sending || !message.trim()}
                                className={`ml-3 w-12 h-12 rounded-2xl items-center justify-center border ${sending || !message.trim() ? 'bg-slate-200 border-slate-200 border-b-4 border-b-slate-300' : 'bg-[#1D4171] border-[#1D4171] border-b-4 border-b-[#11294a] shadow-lg shadow-blue-900/20 active:scale-scale-95'}`}
                            >
                                {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
