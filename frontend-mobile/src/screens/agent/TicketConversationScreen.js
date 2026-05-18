import React, { useState, useEffect, useRef } from 'react';
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
import GoyaflyLoader from '../../components/GoyaflyLoader';

export default function TicketConversationScreen({ navigation, route }) {
    const t = useThemeColors();
    const { ticketId, subject } = route.params;
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const scrollViewRef = useRef();

    const fetchTicketDetails = async () => {
        try {
            // Re-using getTickets and filtering for simplicity, 
            // but ideally we'd have getTicketById
            const res = await agentService.getTickets();
            if (res.success) {
                const found = res.data.find(tk => tk._id === ticketId);
                setTicket(found);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicketDetails();
    }, []);

    const handleSend = async () => {
        if (!message.trim()) return;
        setSending(true);
        try {
            const res = await agentService.addTicketMessage(ticketId, message);
            if (res.success) {
                setTicket(res.data);
                setMessage('');
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            }
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to send message' });
        } finally {
            setSending(false);
        }
    };

    if (loading) return <GoyaflyLoader />;
    if (!ticket) return null;

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style={t.statusBar} />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-6 py-4 flex-row items-center border-b border-gray-100 bg-white shadow-sm">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-11 h-11 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 shadow-sm mr-4 active:scale-95">
                        <Ionicons name="arrow-back" size={20} color={t.text} />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text style={{ color: t.text }} className="text-lg font-black" numberOfLines={1}>{subject}</Text>
                        <View className="flex-row items-center">
                            <View className={`w-2 h-2 rounded-full mr-2 ${ticket.status === 'RESOLVED' ? 'bg-green-500' : 'bg-[#F07E21]'}`} />
                            <Text className="text-[10px] font-black text-gray-400 uppercase">{ticket.status}</Text>
                        </View>
                    </View>
                </View>

                {/* Conversation List */}
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <ScrollView 
                        ref={scrollViewRef}
                        className="flex-1 px-5 pt-6" 
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    >
                        {ticket.messages.map((msg, idx) => {
                            const isMe = msg.senderModel === 'Agent';
                            return (
                                <View 
                                    key={idx} 
                                    className={`mb-6 max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                                >
                                    <View 
                                        style={{ 
                                            backgroundColor: isMe ? '#1D4171' : t.card,
                                            borderBottomRightRadius: isMe ? 4 : 24,
                                            borderBottomLeftRadius: isMe ? 24 : 4,
                                            elevation: 4
                                        }}
                                        className="p-5 rounded-[1.5rem] shadow-md border border-slate-100 border-b-[6px] border-slate-200"
                                    >
                                        <Text 
                                            style={{ color: isMe ? '#fff' : t.text }} 
                                            className="text-[13px] font-medium leading-5"
                                        >
                                            {msg.message}
                                        </Text>
                                    </View>
                                    <Text className="text-[9px] text-gray-400 font-bold mt-2 uppercase">
                                        {isMe ? 'You' : 'ZayaFly Support'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            );
                        })}
                        <View className="h-10" />
                    </ScrollView>

                    {/* Input Area */}
                    <View className="p-6 bg-white border-t border-gray-100 shadow-2xl">
                        <View className="flex-row items-center bg-slate-50 rounded-[2rem] px-6 py-2 border border-slate-100 shadow-inner">
                            <TextInput
                                placeholder="Type your reply..."
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                maxHeight={100}
                                className="flex-1 text-sm font-bold text-gray-800 py-3"
                            />
                            <TouchableOpacity 
                                onPress={handleSend}
                                disabled={sending || !message.trim()}
                                className={`ml-4 w-11 h-11 rounded-2xl items-center justify-center active:scale-95 border ${sending || !message.trim() ? 'bg-slate-200 border-slate-300 border-b-4' : 'bg-[#F07E21] border-[#F07E21] border-b-4 border-[#c76014] shadow-lg shadow-orange-500/30'}`}
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
