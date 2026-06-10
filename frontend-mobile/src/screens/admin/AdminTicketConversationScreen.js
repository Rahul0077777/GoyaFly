import React, { useState, useRef } from 'react';
import { 
    View, Text, ScrollView, TextInput, TouchableOpacity, 
    ActivityIndicator, KeyboardAvoidingView, Platform, Linking
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
    const [message, setMessage] = useState('');
    const [replyStatus, setReplyStatus] = useState('PENDING_AGENT');
    const [sending, setSending] = useState(false);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const scrollViewRef = useRef();

    const fetchTicketDetails = async () => {
        try {
            const res = await adminService.adminGetAllTickets();
            if (res.success) {
                const found = res.data.find(tk => tk._id === ticket._id);
                if (found) setLocalTicket(found);
            }
        } catch (e) { console.error(e); }
    };

    const handleSend = async () => {
        if (!message.trim() && replyStatus === localTicket.status) {
            return Toast.show({ type: 'info', text1: 'Empty Message', text2: 'Please write a reply or change the status.' });
        }
        
        setSending(true);
        try {
            const res = await adminService.replyTicket(localTicket._id, message.trim() || 'Status Updated.', replyStatus);
            if (res.success) {
                setLocalTicket(res.data);
                setMessage('');
                Toast.show({ type: 'success', text1: 'Sent', text2: `Reply sent and marked as ${replyStatus.replace('_', ' ')}` });
                fetchTicketDetails();
            }
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to send reply' });
        } finally {
            setSending(false);
        }
    };

    const handleCall = () => {
        if (localTicket.agentId?.mobileNumber) Linking.openURL(`tel:${localTicket.agentId.mobileNumber}`);
    };

    const handleEmail = () => {
        if (localTicket.agentId?.emailAddress) Linking.openURL(`mailto:${localTicket.agentId.emailAddress}?subject=RE: ${localTicket.subject}`);
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-5 py-4 flex-row items-center border-b border-slate-100 mb-2 bg-white z-10 shadow-sm">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm mr-3.5">
                        <Ionicons name="arrow-back" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="flex-1 pr-2">
                        <Text style={{ color: t.text }} className="text-lg font-black tracking-wide mb-0.5" numberOfLines={1}>{localTicket.subject}</Text>
                        <View className="flex-row items-center gap-2">
                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{localTicket._id.substring(0,6)}</Text>
                            <View className={`px-2 py-0.5 rounded-md border ${
                                localTicket.status === 'RESOLVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                localTicket.status === 'PENDING_ADMIN' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-blue-50 border-blue-100 text-blue-700'
                            }`}>
                                <Text className={`text-[8px] font-black uppercase ${
                                    localTicket.status === 'RESOLVED' ? 'text-emerald-700' :
                                    localTicket.status === 'PENDING_ADMIN' ? 'text-amber-700' : 'text-blue-700'
                                }`}>{localTicket.status}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <ScrollView 
                        ref={scrollViewRef}
                        className="flex-1 px-5 pt-2" 
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    >
                        {/* Contact Info Box */}
                        <View className="bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 p-5 rounded-2xl mb-6 shadow-sm">
                            <Text className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1.5">Agent Contact Info</Text>
                            <Text className="text-sm font-black text-slate-800 mb-1">{localTicket.agentId?.agencyName || localTicket.agentId?.agentName}</Text>
                            <View className="flex-row items-center gap-3 mb-4">
                                <Text className="text-[10px] font-black text-slate-600">📞 {localTicket.agentId?.mobileNumber}</Text>
                                <Text className="text-[10px] font-black text-slate-600" numberOfLines={1}>✉️ {localTicket.agentId?.emailAddress}</Text>
                            </View>
                            <View className="flex-row gap-2">
                                <TouchableOpacity onPress={handleCall} className="flex-1 bg-white py-2.5 rounded-xl border border-amber-200 flex-row items-center justify-center gap-1.5 shadow-sm active:scale-95">
                                    <Ionicons name="call" size={14} color="#d97706" />
                                    <Text className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Call</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleEmail} className="flex-1 bg-white py-2.5 rounded-xl border border-amber-200 flex-row items-center justify-center gap-1.5 shadow-sm active:scale-95">
                                    <Ionicons name="mail" size={14} color="#d97706" />
                                    <Text className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Email</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Thread */}
                        {localTicket.messages?.map((msg, idx) => {
                            const isMe = msg.senderModel === 'Admin';
                            return (
                                <View key={idx} className={`mb-6 max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                    <View className="flex-row items-center mb-1.5 ml-1 mr-1 gap-1">
                                        <Text className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                            {isMe ? 'Goyafly Support (You)' : localTicket.agentId?.agentName || 'Agent'}
                                        </Text>
                                        <Text className="text-[8px] text-slate-300 font-bold uppercase">• {new Date(msg.timestamp || localTicket.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                                    </View>
                                    <View 
                                        style={{ borderBottomRightRadius: isMe ? 4 : 24, borderBottomLeftRadius: isMe ? 24 : 4 }}
                                        className={`px-5 py-4 rounded-[1.5rem] shadow-sm border ${
                                            isMe 
                                            ? 'bg-[#1D4171] border-[#1D4171] border-b-4 border-b-[#11294a]' 
                                            : 'bg-white border-slate-100 border-b-4 border-b-slate-200'
                                        }`}
                                    >
                                        <Text style={{ color: isMe ? '#fff' : t.text }} className="text-sm font-bold leading-5 tracking-wide">{msg.message}</Text>
                                    </View>
                                </View>
                            );
                        })}
                        <View className="h-4" />
                    </ScrollView>

                    {/* Input Area */}
                    <View className="bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] px-5 py-4 pb-8">
                        {/* Status Selector */}
                        <View className="flex-row items-center justify-between mb-3 px-1">
                            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Update Ticket Status</Text>
                            <TouchableOpacity 
                                onPress={() => setShowStatusPicker(!showStatusPicker)}
                                className="flex-row items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"
                            >
                                <Text className="text-[10px] font-black text-[#1D4171] uppercase mr-1">{replyStatus.replace('_', ' ')}</Text>
                                <Ionicons name={showStatusPicker ? 'chevron-up' : 'chevron-down'} size={12} color="#1D4171" />
                            </TouchableOpacity>
                        </View>

                        {showStatusPicker && (
                            <View className="bg-slate-50 border border-slate-200 rounded-xl mb-3 overflow-hidden shadow-sm">
                                {['PENDING_AGENT', 'RESOLVED', 'PENDING_ADMIN'].map(s => (
                                    <TouchableOpacity 
                                        key={s} onPress={() => { setReplyStatus(s); setShowStatusPicker(false); }}
                                        className={`px-4 py-3 border-b border-slate-100 flex-row justify-between items-center ${replyStatus === s ? 'bg-blue-50' : 'bg-white'}`}
                                    >
                                        <Text className={`text-xs font-black uppercase tracking-widest ${replyStatus === s ? 'text-[#1D4171]' : 'text-slate-600'}`}>{s.replace('_', ' ')}</Text>
                                        {replyStatus === s && <Ionicons name="checkmark" size={14} color="#1D4171" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <View className="flex-row items-end gap-3">
                            <View className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner px-4 py-1 min-h-[60px]">
                                <TextInput
                                    placeholder="Type your official response..."
                                    value={message} onChangeText={setMessage}
                                    placeholderTextColor="#9ca3af"
                                    multiline
                                    className="text-sm font-black text-slate-900 py-3 leading-5 max-h-32"
                                />
                            </View>
                            <TouchableOpacity 
                                onPress={handleSend} disabled={sending}
                                className={`w-14 h-14 rounded-2xl items-center justify-center border shadow-lg ${
                                    sending ? 'bg-slate-300 border-slate-400' : 'bg-[#F07E21] border-[#d96d1a] border-b-4 border-b-[#b85a12] shadow-orange-500/30 active:scale-95'
                                }`}
                            >
                                {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={20} color="#fff" className="ml-1" />}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
