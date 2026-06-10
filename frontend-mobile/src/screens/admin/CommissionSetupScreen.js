import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, 
    TextInput, ActivityIndicator, Modal, FlatList,
    KeyboardAvoidingView, Platform
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';

const domesticAirlines = [
    { code: 'ALL', name: 'All Domestic Airlines' },
    { code: '6E', name: 'Indigo (6E)' }, { code: 'SG', name: 'Spicejet (SG)' },
    { code: 'AI', name: 'Air India (AI)' }, { code: 'IX', name: 'Air India Express (IX)' },
    { code: 'QP', name: 'Akasa Air (QP)' }, { code: 'UK', name: 'Vistara (UK)' },
];

const internationalAirlines = [
    { code: 'ALL', name: 'All International Airlines' },
    { code: 'AI', name: 'Air India (AI)' }, { code: '6E', name: 'IndiGo (6E)' },
    { code: 'SV', name: 'Saudi Air (SV)' }, { code: 'FZ', name: 'Fly Dubai (FZ)' },
    { code: 'G9', name: 'Air Arabia (G9)' }, { code: 'EK', name: 'Emirates (EK)' },
    { code: 'QR', name: 'Qatar Airways (QR)' }, { code: 'EY', name: 'Etihad Airways (EY)' },
    { code: 'TK', name: 'Turkish Airlines (TK)' }, { code: 'BA', name: 'British Airways (BA)' },
    { code: 'SQ', name: 'Singapore Airlines (SQ)' },
];

const refundTypes = ['All', 'Non-Refundable', 'Refundable', 'P Refundable', 'Refundable & P Refundable'];

export default function CommissionSetupScreen({ navigation }) {
    const t = useThemeColors();
    const [activeTab, setActiveTab] = useState('GLOBAL'); // 'GLOBAL' | 'AGENT'
    const [activeService, setActiveService] = useState('DOMESTIC_FLIGHT');
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Global Form States
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        airline: 'ALL', refundType: 'All', markupType: 'Fixed', markupValue: ''
    });
    const [showAirlinePicker, setShowAirlinePicker] = useState(false);
    const [airlineSearch, setAirlineSearch] = useState('');

    // Agent Specific States
    const [agentSearchQuery, setAgentSearchQuery] = useState('');
    const [agentSearchResults, setAgentSearchResults] = useState([]);
    const [isSearchingAgent, setIsSearchingAgent] = useState(false);
    const [selectedAgents, setSelectedAgents] = useState([]);
    const searchTimeoutRef = useRef(null);
    const [isSavingAgentMarkup, setIsSavingAgentMarkup] = useState(false);
    const [agentFormData, setAgentFormData] = useState({
        airline: 'ALL', refundType: 'All', markupType: 'Fixed', markupValue: ''
    });

    useEffect(() => { fetchRules(); }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await adminService.getMarkups();
            if (res.success) setRules(res.data);
        } catch (err) { console.error('Fetch error:', err); }
        finally { setLoading(false); }
    };

    const handleDelete = (id) => {
        const { Alert } = require('react-native');
        Alert.alert('Delete Rule', 'Are you sure you want to remove this markup?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                try {
                    const res = await adminService.deleteMarkup(id);
                    if (res.success) {
                        Toast.show({ type: 'success', text1: 'Deleted', text2: 'Markup rule removed.' });
                        fetchRules();
                    }
                } catch (err) { Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete' }); }
            }}
        ]);
    };

    // --- Global Save ---
    const handleSaveGlobal = async () => {
        if (!formData.markupValue) return Toast.show({ type: 'info', text1: 'Error', text2: 'Please enter a markup value' });
        setSaving(true);
        try {
            const finalData = {
                ...formData,
                serviceType: activeService,
                markupValue: parseFloat(formData.markupValue),
                priority: formData.airline === 'ALL' ? 0 : 10,
                targetAgentCode: 'ALL'
            };
            const res = await adminService.updateMarkup(finalData);
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Global Markup rule saved' });
                setShowAddModal(false);
                fetchRules();
                setFormData({ airline: 'ALL', refundType: 'All', markupType: 'Fixed', markupValue: '' });
            } else { Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Failed to save' }); }
        } catch (err) { Toast.show({ type: 'error', text1: 'Error', text2: 'Something went wrong' }); }
        finally { setSaving(false); }
    };

    // --- Agent Search ---
    const handleAgentSearch = (query) => {
        setAgentSearchQuery(query);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (!query.trim()) { setAgentSearchResults([]); return; }
        
        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearchingAgent(true);
            try {
                const res = await adminService.searchAgentByCode(query);
                if (res.success) setAgentSearchResults(res.data || []);
            } catch (err) { console.error(err); }
            finally { setIsSearchingAgent(false); }
        }, 500);
    };

    const toggleAgent = (agent) => {
        if (!agent.agentCode) return Toast.show({ type: 'error', text1: 'KYC Pending', text2: 'Agent has no code yet' });
        if (selectedAgents.find(a => a._id === agent._id)) {
            setSelectedAgents(prev => prev.filter(a => a._id !== agent._id));
        } else {
            setSelectedAgents(prev => [...prev, agent]);
        }
        setAgentSearchQuery('');
        setAgentSearchResults([]);
    };

    // --- Agent Save ---
    const handleSaveAgent = async () => {
        if (selectedAgents.length === 0) return Toast.show({ type: 'error', text1: 'Error', text2: 'Select at least one agent' });
        if (!agentFormData.markupValue) return Toast.show({ type: 'error', text1: 'Error', text2: 'Enter markup value' });

        setIsSavingAgentMarkup(true);
        let successCount = 0;
        let failCount = 0;

        for (const agent of selectedAgents) {
            try {
                const finalData = {
                    ...agentFormData,
                    serviceType: activeService,
                    markupValue: parseFloat(agentFormData.markupValue),
                    priority: 100,
                    targetAgentCode: agent.agentCode
                };
                const res = await adminService.updateMarkup(finalData);
                if (res.success) successCount++;
                else failCount++;
            } catch (err) { failCount++; }
        }

        setIsSavingAgentMarkup(false);
        if (successCount > 0) Toast.show({ type: 'success', text1: 'Success', text2: `Saved for ${successCount} agent(s)` });
        if (failCount > 0) Toast.show({ type: 'error', text1: 'Warning', text2: `Failed for ${failCount} agent(s)` });
        
        fetchRules();
        setAgentFormData({ airline: 'ALL', refundType: 'All', markupType: 'Fixed', markupValue: '' });
        setSelectedAgents([]);
    };

    const currentAirlineList = activeService === 'DOMESTIC_FLIGHT' ? domesticAirlines : internationalAirlines;
    const globalRules = rules.filter(r => (!r.targetAgentCode || r.targetAgentCode === 'ALL') && r.serviceType === activeService);
    const agentSpecificRules = rules.filter(r => (r.targetAgentCode && r.targetAgentCode !== 'ALL') && r.serviceType === activeService);

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-5 py-4 flex-row items-center justify-between border-b border-slate-100 mb-2 bg-white z-10 shadow-sm">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 active:scale-95 mr-3">
                            <Ionicons name="arrow-back" size={20} color="#0f172a" />
                        </TouchableOpacity>
                        <View className="bg-orange-50 w-10 h-10 rounded-xl items-center justify-center border border-orange-100 shadow-sm mr-3">
                            <Ionicons name="pricetags" size={20} color="#F07E21" />
                        </View>
                        <View>
                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide">Admin Markup</Text>
                            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-0.5">Pricing & Yield Engine</Text>
                        </View>
                    </View>
                </View>

                {/* Service Selector (Domestic / Intl) */}
                <View className="flex-row px-5 py-2 mb-2 gap-3">
                    {['DOMESTIC_FLIGHT', 'INTERNATIONAL_FLIGHT'].map((s) => {
                        const active = activeService === s;
                        return (
                            <TouchableOpacity key={s} onPress={() => setActiveService(s)}
                                className={`flex-1 py-3 items-center rounded-xl border border-b-4 active:scale-95 shadow-sm ${active ? 'bg-[#F07E21] border-[#F07E21] border-b-[#D96B18] shadow-orange-500/20' : 'bg-white border-slate-100 border-b-slate-200'}`}>
                                <Text className={`font-black text-[9px] uppercase tracking-widest ${active ? 'text-white' : 'text-slate-400'}`}>
                                    {s.replace('_FLIGHT', '')}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Tabs (Global / Agent) */}
                <View className="flex-row px-5 mb-4 border-b border-slate-200">
                    <TouchableOpacity onPress={() => setActiveTab('GLOBAL')} className={`flex-1 py-4 items-center border-b-2 ${activeTab === 'GLOBAL' ? 'border-[#1D4171]' : 'border-transparent'}`}>
                        <Text className={`font-black text-xs uppercase tracking-widest ${activeTab === 'GLOBAL' ? 'text-[#1D4171]' : 'text-slate-400'}`}>Global Rules</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('AGENT')} className={`flex-1 py-4 items-center border-b-2 ${activeTab === 'AGENT' ? 'border-[#8b5cf6]' : 'border-transparent'}`}>
                        <Text className={`font-black text-xs uppercase tracking-widest ${activeTab === 'AGENT' ? 'text-[#8b5cf6]' : 'text-slate-400'}`}>Agent Specific</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color={activeTab === 'GLOBAL' ? '#1D4171' : '#8b5cf6'} size="large" />
                    </View>
                ) : (
                    <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {activeTab === 'GLOBAL' ? (
                            <>
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="text-xs font-black text-slate-800 uppercase tracking-widest">Active Global Rules</Text>
                                    <TouchableOpacity onPress={() => setShowAddModal(true)} className="bg-[#1D4171] px-4 py-2 rounded-lg border border-[#15305B] border-b-4 border-b-[#0f2342] shadow-sm active:scale-95">
                                        <Text className="text-white font-black text-[9px] uppercase tracking-wider">+ Add Global</Text>
                                    </TouchableOpacity>
                                </View>
                                {globalRules.length === 0 ? (
                                    <View className="py-20 items-center">
                                        <Ionicons name="earth" size={48} color="#cbd5e1" className="mb-4" />
                                        <Text className="font-black text-lg text-slate-400">No Global Rules</Text>
                                    </View>
                                ) : (
                                    globalRules.map(rule => (
                                        <View key={rule._id} style={{ backgroundColor: t.card }} className="p-5 rounded-2xl border border-slate-100 border-b-[6px] border-b-slate-200 mb-5 shadow-lg shadow-slate-200/50">
                                            <View className="flex-row justify-between items-start mb-3">
                                                <View className="flex-1 pr-2">
                                                    <Text className="font-black text-lg text-slate-800 tracking-wide mb-1">
                                                        {currentAirlineList.find(a => a.code === rule.airline)?.name || rule.airline}
                                                    </Text>
                                                    <View className="flex-row gap-2">
                                                        <View className="bg-slate-100 px-2 py-1 rounded-md"><Text className="text-[9px] font-black text-slate-500 uppercase">{rule.refundType}</Text></View>
                                                        {rule.priority > 0 && <View className="bg-orange-50 px-2 py-1 rounded-md border border-orange-100"><Text className="text-[9px] font-black text-orange-600 uppercase">Priority</Text></View>}
                                                    </View>
                                                </View>
                                                <TouchableOpacity onPress={() => handleDelete(rule._id)} className="bg-rose-50 p-2.5 rounded-xl border border-rose-100 active:scale-95">
                                                    <Ionicons name="trash" size={16} color="#e11d48" />
                                                </TouchableOpacity>
                                            </View>
                                            <View className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-row justify-between items-center">
                                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Markup Amount</Text>
                                                <Text className="text-xl font-black text-[#1D4171]">{rule.markupType === 'Fixed' ? '₹' : ''}{rule.markupValue}{rule.markupType === 'Percentage' ? '%' : ''}</Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </>
                        ) : (
                            <>
                                {/* AGENT SPECIFIC TAB */}
                                <View className="mb-6">
                                    <Text className="text-xs font-black text-purple-700 uppercase tracking-widest mb-2">Search Agent</Text>
                                    <View className="relative z-50">
                                        <View className="flex-row items-center bg-white rounded-2xl border-2 border-purple-100 shadow-sm px-4 h-14">
                                            <Ionicons name="search" size={20} color="#c084fc" />
                                            <TextInput 
                                                placeholder="Code, Name, or Email..."
                                                placeholderTextColor="#94a3b8"
                                                value={agentSearchQuery}
                                                onChangeText={handleAgentSearch}
                                                className="flex-1 ml-3 font-bold text-slate-800 h-full"
                                            />
                                            {isSearchingAgent && <ActivityIndicator size="small" color="#a855f7" />}
                                        </View>
                                        {/* Dropdown Results */}
                                        {agentSearchResults.length > 0 && (
                                            <View className="absolute top-16 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-purple-100 max-h-64 overflow-hidden z-50">
                                                <ScrollView keyboardShouldPersistTaps="handled">
                                                    {agentSearchResults.map(agent => (
                                                        <TouchableOpacity 
                                                            key={agent._id} onPress={() => toggleAgent(agent)}
                                                            className="px-5 py-4 border-b border-purple-50 flex-row items-center"
                                                        >
                                                            <View className="w-8 h-8 bg-purple-100 rounded-lg items-center justify-center mr-3">
                                                                <Text className="font-black text-purple-600">{(agent.agencyName || '?')[0].toUpperCase()}</Text>
                                                            </View>
                                                            <View className="flex-1">
                                                                <Text className="font-bold text-slate-800">{agent.agencyName}</Text>
                                                                <Text className="text-[10px] font-bold text-slate-400">{agent.agentCode || 'NO CODE'} • {agent.emailAddress}</Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Selected Agents Chips */}
                                {selectedAgents.length > 0 && (
                                    <View className="mb-6">
                                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selected Agents ({selectedAgents.length})</Text>
                                        <View className="flex-row flex-wrap gap-2">
                                            {selectedAgents.map(agent => (
                                                <View key={agent._id} className="bg-purple-100 border border-purple-200 rounded-lg px-3 py-1.5 flex-row items-center">
                                                    <Text className="text-xs font-black text-purple-800 mr-2">{agent.agentCode}</Text>
                                                    <TouchableOpacity onPress={() => toggleAgent(agent)}>
                                                        <Ionicons name="close-circle" size={16} color="#9333ea" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                            <TouchableOpacity onPress={() => setSelectedAgents([])} className="px-3 py-1.5 flex-row items-center">
                                                <Text className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Clear All</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                {/* Agent Form */}
                                {selectedAgents.length > 0 && (
                                    <View className="bg-purple-50 p-5 rounded-3xl border border-purple-100 mb-8 shadow-sm z-10">
                                        <Text className="text-[10px] font-black text-purple-400 uppercase mb-1 ml-1 tracking-widest">Airline</Text>
                                        <TouchableOpacity onPress={() => { setShowAddModal(false); setShowAirlinePicker(true); }} className="bg-white p-4 rounded-xl border border-purple-100 mb-4 flex-row justify-between items-center shadow-sm">
                                            <Text className="font-black text-slate-800 text-sm tracking-wide">{currentAirlineList.find(a => a.code === agentFormData.airline)?.name || 'Select Airline'}</Text>
                                            <Ionicons name="chevron-down" size={16} color="#c084fc" />
                                        </TouchableOpacity>

                                        <Text className="text-[10px] font-black text-purple-400 uppercase mb-1 ml-1 tracking-widest">Ticket Type</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
                                            {refundTypes.map(type => (
                                                <TouchableOpacity key={type} onPress={() => setAgentFormData({...agentFormData, refundType: type})}
                                                    className={`px-4 py-2.5 rounded-lg border mr-2 active:scale-95 ${agentFormData.refundType === type ? 'bg-purple-600 border-purple-700' : 'bg-white border-purple-100'}`}>
                                                    <Text className={`text-[10px] font-black uppercase tracking-widest ${agentFormData.refundType === type ? 'text-white' : 'text-slate-500'}`}>{type}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>

                                        <View className="flex-row gap-3 mb-4">
                                            <View className="flex-1">
                                                <Text className="text-[10px] font-black text-purple-400 uppercase mb-1 ml-1 tracking-widest">Logic</Text>
                                            <View className="flex-row gap-1 bg-white p-1 rounded-xl border border-purple-100">
                                            {['Fixed', 'Percentage'].map(type => (
                                                <TouchableOpacity key={type} onPress={() => setAgentFormData({...agentFormData, markupType: type})}
                                                    className={`flex-1 py-3 rounded-lg items-center justify-center ${agentFormData.markupType === type ? 'bg-purple-100' : 'bg-transparent'}`}>
                                                    <Text className={`text-[9px] font-black uppercase tracking-widest ${agentFormData.markupType === type ? 'text-purple-700' : 'text-slate-400'}`} adjustsFontSizeToFit numberOfLines={1}>{type === 'Percentage' ? 'Percent' : type}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>            </View>
                                            <View className="flex-1">
                                                <Text className="text-[10px] font-black text-purple-400 uppercase mb-1 ml-1 tracking-widest">Amount</Text>
                                                <TextInput 
                                                    placeholder="0.00" keyboardType="numeric" value={agentFormData.markupValue} 
                                                    onChangeText={v => setAgentFormData({...agentFormData, markupValue: v})}
                                                    className="bg-white px-4 py-3 rounded-xl text-lg font-black text-purple-700 border border-purple-100 shadow-inner" 
                                                />
                                            </View>
                                        </View>

                                        <TouchableOpacity onPress={handleSaveAgent} disabled={isSavingAgentMarkup} className="bg-purple-600 py-4 rounded-xl items-center border-b-4 border-b-purple-800 shadow-lg shadow-purple-500/30 active:scale-95">
                                            {isSavingAgentMarkup ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black uppercase text-xs tracking-widest">Apply to {selectedAgents.length} Agents</Text>}
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Active Agent Rules */}
                                <View className="mb-8">
                                    <Text className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3">Active Agent Rules ({agentSpecificRules.length})</Text>
                                    {agentSpecificRules.length === 0 ? (
                                        <View className="py-10 items-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                            <Text className="font-bold text-sm text-slate-400">No agent specific rules.</Text>
                                        </View>
                                    ) : (
                                        agentSpecificRules.map(rule => (
                                            <View key={rule._id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-3 flex-row items-center">
                                                <View className="w-10 h-10 bg-purple-50 rounded-xl items-center justify-center mr-3">
                                                    <Ionicons name="person" size={16} color="#9333ea" />
                                                </View>
                                                <View className="flex-1 pr-2">
                                                    <View className="flex-row flex-wrap items-center gap-1.5 mb-1">
                                                        <View className="bg-purple-600 px-1.5 py-0.5 rounded"><Text className="text-white font-black text-[9px] uppercase">{rule.targetAgentCode}</Text></View>
                                                        <Text className="font-black text-xs text-slate-800 flex-1" numberOfLines={2}>{currentAirlineList.find(a => a.code === rule.airline)?.name || rule.airline}</Text>
                                                    </View>
                                                    <Text className="text-[9px] font-bold text-slate-400">{rule.refundType}</Text>
                                                </View>
                                                <View className="items-end mr-3">
                                                    <Text className="font-black text-base text-purple-700">{rule.markupType === 'Fixed' ? '₹' : ''}{rule.markupValue}{rule.markupType === 'Percentage' ? '%' : ''}</Text>
                                                </View>
                                                <TouchableOpacity onPress={() => handleDelete(rule._id)} className="p-2">
                                                    <Ionicons name="trash" size={18} color="#cbd5e1" />
                                                </TouchableOpacity>
                                            </View>
                                        ))
                                    )}
                                </View>
                            </>
                        )}
                        <View className="h-10" />
                    </ScrollView>
                )}
            </SafeAreaView>

            {/* Global Rule Add Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-3xl p-6 pb-10 border-t border-slate-100 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <Text className="text-xl font-black text-[#1D4171] uppercase tracking-wide">Global Markup Rule</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)} className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 active:scale-95">
                                <Ionicons name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Airline</Text>
                        <TouchableOpacity onPress={() => { setShowAddModal(false); setShowAirlinePicker(true); }} className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 flex-row justify-between items-center">
                            <Text className="font-black text-slate-800 text-sm">{currentAirlineList.find(a => a.code === formData.airline)?.name || 'ALL'}</Text>
                            <Ionicons name="chevron-down" size={16} color="#64748b" />
                        </TouchableOpacity>

                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Refund Type</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-5 pb-2">
                            {refundTypes.map(type => (
                                <TouchableOpacity key={type} onPress={() => setFormData({...formData, refundType: type})}
                                    className={`px-4 py-2.5 rounded-lg border mr-2 active:scale-95 ${formData.refundType === type ? 'bg-[#1D4171] border-[#15305B]' : 'bg-white border-slate-200'}`}>
                                    <Text className={`text-[10px] font-black uppercase tracking-widest ${formData.refundType === type ? 'text-white' : 'text-slate-500'}`}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View className="flex-row gap-3 mb-6">
                            <View className="flex-1">
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Logic</Text>
                                <View className="flex-row gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                    {['Fixed', 'Percentage'].map(type => (
                                        <TouchableOpacity key={type} onPress={() => setFormData({...formData, markupType: type})}
                                            className={`flex-1 py-3 rounded-lg items-center ${formData.markupType === type ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
                                            <Text className={`text-[10px] font-black uppercase tracking-widest ${formData.markupType === type ? 'text-[#1D4171]' : 'text-slate-400'}`}>{type}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                            <View className="flex-[0.8]">
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Amount</Text>
                                <TextInput 
                                    placeholder="0" keyboardType="numeric" value={formData.markupValue} 
                                    onChangeText={v => setFormData({...formData, markupValue: v})}
                                    className="bg-slate-50 px-4 py-3.5 rounded-xl text-xl font-black text-[#1D4171] border border-slate-100 shadow-inner" 
                                />
                            </View>
                        </View>

                        <TouchableOpacity onPress={handleSaveGlobal} className="bg-[#1D4171] py-4 rounded-xl items-center border-b-4 border-b-[#0f2342] shadow-xl shadow-blue-900/30 active:scale-95">
                            {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black uppercase text-xs tracking-widest">Save Global Rule</Text>}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Airline Picker Modal */}
            <Modal visible={showAirlinePicker} animationType="fade" transparent>
                <View className="flex-1 bg-black/60 items-center justify-center p-5">
                    <View className="bg-white w-full rounded-3xl p-6 h-[75%] border border-slate-100 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-4 border-b border-slate-100 pb-3">
                            <Text className="text-lg font-black text-slate-800 uppercase tracking-wide">Select Airline</Text>
                            <TouchableOpacity onPress={() => { setShowAirlinePicker(false); activeTab === 'GLOBAL' ? setShowAddModal(true) : null; }} className="w-8 h-8 bg-slate-50 rounded-xl items-center justify-center">
                                <Ionicons name="close" size={18} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <TextInput 
                            placeholder="Search airline..." value={airlineSearch} onChangeText={setAirlineSearch}
                            className="bg-slate-50 px-4 py-3 rounded-xl mb-4 border border-slate-100 font-bold text-sm text-slate-800"
                        />
                        <FlatList 
                            data={currentAirlineList.filter(a => a.name.toLowerCase().includes(airlineSearch.toLowerCase()) || a.code.toLowerCase().includes(airlineSearch.toLowerCase()))}
                            keyExtractor={item => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    onPress={() => { 
                                        if (activeTab === 'GLOBAL') setFormData({...formData, airline: item.code});
                                        else setAgentFormData({...agentFormData, airline: item.code});
                                        setShowAirlinePicker(false); 
                                        setAirlineSearch('');
                                        if (activeTab === 'GLOBAL') setShowAddModal(true);
                                    }}
                                    className="py-3 border-b border-slate-50 flex-row justify-between items-center active:opacity-70"
                                >
                                    <View>
                                        <Text className="font-bold text-slate-800 text-sm">{item.name}</Text>
                                        <Text className="text-[10px] font-black text-slate-400 mt-0.5">{item.code}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}
