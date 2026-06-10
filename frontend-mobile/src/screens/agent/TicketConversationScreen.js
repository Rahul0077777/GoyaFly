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
            const res = await agentService.getTickets();
            if (res.success) {
                const found = res.data.find(tk => (tk._id || tk.id) === ticketId);
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
            const res = await agentService.addTicketMessage(ticketId, message.trim());
            if (res.success) {
                setTicket(res.data);
                setMessage('');
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Failed to send message' });
            }
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to send message' });
        } finally {
            setSending(false);
        }
    };

    if (loading) return <GoyaflyLoader />;
    if (!ticket) {
        return (
            <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: t.text }} className="font-bold">Ticket not found.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 bg-[#1D4171] px-5 py-2.5 rounded-xl">
                    <Text className="text-white font-bold">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const status = (ticket.status || 'OPEN').toUpperCase();
    const isResolved = status === 'RESOLVED' || status === 'CLOSED';

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style={t.statusBar} />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Dynamic Header */}
                <View 
                    style={{ backgroundColor: t.card, borderBottomColor: t.cardBorder }} 
                    className="px-6 py-4 flex-row items-center border-b shadow-sm"
                >
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={{ backgroundColor: t.card, borderColor: t.cardBorder }}
                        className="w-11 h-11 rounded-2xl items-center justify-center border border-b-4 shadow-sm mr-4 active:scale-95"
                    >
                        <Ionicons name="arrow-back" size={20} color={t.text} />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text style={{ color: t.text }} className="text-base font-black" numberOfLines={1}>
                            {subject}
                        </Text>
                        <View className="flex-row items-center mt-0.5">
                            <View className={`w-2 h-2 rounded-full mr-2 ${isResolved ? 'bg-green-500' : 'bg-orange-500'}`} />
                            <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase tracking-wider">
                                {status}
                            </Text>
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
                            const bubbleBg = isMe 
                                ? '#1D4171' 
                                : (t.isDark ? '#334155' : '#F1F5F9');
                            const bubbleText = isMe ? '#ffffff' : t.text;
                            
                            return (
                                <View 
                                    key={idx} 
                                    className={`mb-6 max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                                >
                                    <View 
                                        style={{ 
                                            backgroundColor: bubbleBg,
                                            borderBottomRightRadius: isMe ? 4 : 20,
                                            borderBottomLeftRadius: isMe ? 20 : 4,
                                            elevation: 1
                                        }}
                                        className="p-4.5 rounded-[1.5rem] shadow-sm"
                                    >
                                        <Text 
                                            style={{ color: bubbleText }} 
                                            className="text-[13px] font-semibold leading-5"
                                        >
                                            {msg.message}
                                        </Text>
                                    </View>
                                    <Text style={{ color: t.textMuted }} className="text-[8px] font-bold mt-2 uppercase tracking-wide">
                                        {isMe ? 'You' : 'GoyaFly Support'} • {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            );
                        })}
                        <View className="h-10" />
                    </ScrollView>

                    {/* Input Reply Area */}
                    <View 
                        style={{ backgroundColor: t.card, borderTopColor: t.cardBorder }} 
                        className="p-5 border-t shadow-lg"
                    >
                        <View 
                            style={{ backgroundColor: t.isDark ? '#1e293b' : '#F8FAFC', borderColor: t.cardBorder }} 
                            className="flex-row items-center rounded-[2rem] px-5 py-1.5 border"
                        >
                            <TextInput
                                placeholder="Type your reply here..."
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                maxHeight={100}
                                style={{ color: t.text }}
                                className="flex-1 text-sm font-semibold py-2.5"
                                placeholderTextColor="#A0AEC0"
                            />
                            <TouchableOpacity 
                                onPress={handleSend}
                                disabled={sending || !message.trim()}
                                style={{ 
                                    backgroundColor: sending || !message.trim() ? (t.isDark ? '#334155' : '#E2E8F0') : '#F07E21',
                                    borderColor: sending || !message.trim() ? (t.isDark ? '#334155' : '#E2E8F0') : '#F07E21',
                                }}
                                className="ml-3 w-10 h-10 rounded-2xl items-center justify-center border border-b-4 border-b-[#c76014] active:scale-95"
                            >
                                {sending ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Ionicons name="send" size={16} color={sending || !message.trim() ? '#A0AEC0' : '#fff'} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
