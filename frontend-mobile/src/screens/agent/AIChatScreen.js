import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    KeyboardAvoidingView, Platform, ActivityIndicator, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';
import { sendMessage } from '../../services/geminiService';

const SUGGESTED = [
    { icon: '✈️', text: 'How do I search for flights?' },
    { icon: '💰', text: 'How do I recharge my wallet?' },
    { icon: '📈', text: 'What is markup setup?' },
    { icon: '🛂', text: 'How to apply for visa assistance?' },
    { icon: '🎟️', text: 'How to raise a support ticket?' },
];

const TypingDot = ({ delay }) => {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, { toValue: -6, duration: 300, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);
    return (
        <Animated.View
            style={{
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: '#818cf8', marginHorizontal: 2,
                transform: [{ translateY: anim }],
            }}
        />
    );
};

export default function AIChatScreen() {
    const { colorScheme } = useAppTheme();
    const isDark = colorScheme === 'dark';
    const flatListRef = useRef(null);

    const [messages, setMessages] = useState([
        { id: '0', role: 'assistant', content: "👋 Hey! I'm Goyafly AI Assistance.\n\nHow can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(true);

    const scrollToBottom = () => {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const handleSend = async (text) => {
        const userText = (text || input).trim();
        if (!userText || isLoading) return;

        setInput('');
        setShowSuggestions(false);
        setError(null);

        const userMsg = { id: Date.now().toString(), role: 'user', content: userText };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        scrollToBottom();

        try {
            const history = messages.filter(m => m.role !== 'system');
            const reply = await sendMessage(history, userText);
            setMessages(prev => [...prev, { id: Date.now().toString() + '_r', role: 'assistant', content: reply }]);
        } catch (err) {
            if (err.message === 'NO_API_KEY') {
                setError('⚠️ Gemini API key not configured. Please add it to app.json extra.geminiApiKey.');
            } else if (err.message === 'RATE_LIMIT') {
                setError('⏳ Rate limit reached. Please wait a minute and try again.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setIsLoading(false);
            scrollToBottom();
        }
    };

    const renderMessage = ({ item }) => {
        const isUser = item.role === 'user';
        return (
            <View style={{ flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-end', marginBottom: 12, paddingHorizontal: 16 }}>
                {!isUser && (
                    <LinearGradient
                        colors={['#48A0D4', '#8b5cf6']}
                        style={{ width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0 }}
                    >
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>✦</Text>
                    </LinearGradient>
                )}
                <View
                    style={{
                        maxWidth: '78%',
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 18,
                        borderBottomRightRadius: isUser ? 4 : 18,
                        borderBottomLeftRadius: isUser ? 18 : 4,
                        backgroundColor: isUser ? '#48A0D4' : (isDark ? '#1e293b' : '#fff'),
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 2,
                    }}
                >
                    <Text style={{ color: isUser ? '#fff' : (isDark ? '#e2e8f0' : '#1e293b'), fontSize: 14, lineHeight: 21 }}>
                        {item.content}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
            {/* Header */}
            <LinearGradient
                colors={['#1d4ed8', '#48A0D4', '#7c3aed']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20, color: '#fff' }}>✦</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>Goyafly AI</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' }} />
                        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600' }}>Smart Travel Assistant</Text>
                    </View>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
                {/* Messages List */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={{ paddingVertical: 16 }}
                    onContentSizeChange={scrollToBottom}
                    ListFooterComponent={() => (
                        <>
                            {isLoading && (
                                <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 12 }}>
                                    <LinearGradient
                                        colors={['#48A0D4', '#8b5cf6']}
                                        style={{ width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 14 }}>✦</Text>
                                    </LinearGradient>
                                    <View style={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', elevation: 1 }}>
                                        <TypingDot delay={0} />
                                        <TypingDot delay={150} />
                                        <TypingDot delay={300} />
                                    </View>
                                </View>
                            )}
                            {error && (
                                <View style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#fecaca' }}>
                                    <Text style={{ color: '#dc2626', fontSize: 12, textAlign: 'center' }}>{error}</Text>
                                </View>
                            )}
                        </>
                    )}
                />

                {/* Suggested Questions */}
                {showSuggestions && messages.length === 1 && (
                    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                        <Text style={{ color: isDark ? '#475569' : '#94a3b8', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                            Quick Questions
                        </Text>
                        {SUGGESTED.map((item, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => handleSend(item.text)}
                                style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 10,
                                    backgroundColor: isDark ? '#1e293b' : '#eff6ff',
                                    borderWidth: 1, borderColor: isDark ? '#334155' : '#bfdbfe',
                                    borderBottomWidth: 4, borderBottomColor: isDark ? '#0f172a' : '#93c5fd',
                                    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
                                    marginBottom: 10,
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                                <Text style={{ color: isDark ? '#93c5fd' : '#1d4ed8', fontSize: 13, fontWeight: '600', flex: 1 }}>
                                    {item.text}
                                </Text>
                                <Text style={{ color: isDark ? '#334155' : '#bfdbfe', fontSize: 14 }}>›</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Input Bar */}
                <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    paddingHorizontal: 16, paddingVertical: 12,
                    backgroundColor: isDark ? '#0f172a' : '#fff',
                    borderTopWidth: 1, borderTopColor: isDark ? '#1e293b' : '#f1f5f9',
                }}>
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="Ask anything about travel..."
                        placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                        multiline
                        style={{
                            flex: 1,
                            backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                            color: isDark ? '#e2e8f0' : '#1e293b',
                            borderRadius: 20,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            fontSize: 14,
                            maxHeight: 100,
                            lineHeight: 20,
                        }}
                        onSubmitEditing={() => handleSend()}
                        returnKeyType="send"
                    />
                    <TouchableOpacity
                        onPress={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        activeOpacity={0.8}
                        style={{ opacity: isLoading || !input.trim() ? 0.4 : 1 }}
                    >
                        <LinearGradient
                            colors={['#48A0D4', '#7c3aed']}
                            style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={{ color: '#fff', fontSize: 18, marginLeft: 2, marginTop: 1 }}>›</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Powered by */}
                <Text style={{ textAlign: 'center', color: isDark ? '#1e293b' : '#e2e8f0', fontSize: 9, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', paddingBottom: 8, backgroundColor: isDark ? '#0f172a' : '#fff' }}>
                    Powered by Google Gemini
                </Text>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
