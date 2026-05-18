import React, { useState, useEffect, useMemo } from 'react';
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
    { code: '9I', name: 'Alliance Air (9I)' }, { code: 'S5', name: 'Star Air (S5)' },
    { code: 'S9', name: 'FlyBig (S9)' }, { code: 'I7', name: 'IndiaOne Air (I7)' },
    { code: 'ZO', name: 'Zoom Air (ZO)' },
];

const internationalAirlines = [
    { code: 'ALL', name: 'All International Airlines' },
    { code: 'AI', name: 'Air India (AI)' }, { code: '6E', name: 'IndiGo (6E)' },
    { code: 'SG', name: 'SpiceJet (SG)' }, { code: 'IX', name: 'Air India Express (IX)' },
    { code: 'QP', name: 'Akasa Air (QP)' }, { code: 'SV', name: 'Saudi Air (SV)' },
    { code: 'FZ', name: 'Fly Dubai (FZ)' }, { code: 'G9', name: 'Air Arabia (G9)' },
    { code: 'EK', name: 'Emirates (EK)' }, { code: 'QR', name: 'Qatar Airways (QR)' },
    { code: 'EY', name: 'Etihad Airways (EY)' }, { code: 'UK', name: 'Vistara (UK)' },
    { code: 'JP', name: 'Adria Airways (JP)' }, { code: 'A3', name: 'Aegean Airlines (A3)' },
    { code: 'EI', name: 'Aer Lingus (EI)' }, { code: 'SU', name: 'Aeroflot (SU)' },
    { code: 'AR', name: 'Aerolineas Argentinas (AR)' }, { code: 'AM', name: 'Aeromexico (AM)' },
    { code: 'ZA', name: 'Aeromexico Connect (ZA)' }, { code: 'AH', name: 'Air Algerie (AH)' },
    { code: 'KC', name: 'Air Astana (KC)' }, { code: 'UU', name: 'Air Austral (UU)' },
    { code: 'BT', name: 'Air Baltic (BT)' }, { code: 'BX', name: 'Air Busan (BX)' },
    { code: 'AC', name: 'Air Canada (AC)' }, { code: 'TX', name: 'Air Caraibes (TX)' },
    { code: 'CA', name: 'Air China (CA)' }, { code: 'UX', name: 'Air Europa (UX)' },
    { code: 'AF', name: 'Air France (AF)' }, { code: 'MD', name: 'Air Madagascar (MD)' },
    { code: 'KM', name: 'Air Malta (KM)' }, { code: 'MK', name: 'Air Mauritius (MK)' },
    { code: 'NM', name: 'Air Mountain (NM)' }, { code: 'NZ', name: 'Air New Zealand (NZ)' },
    { code: 'PX', name: 'Air Niugini (PX)' }, { code: 'JU', name: 'Air Serbia (JU)' },
    { code: 'TN', name: 'Air Tahiti Nui (TN)' }, { code: 'TS', name: 'Air Transat (TS)' },
    { code: 'UM', name: 'Air Zimbabwe (UM)' }, { code: 'AK', name: 'AirAsia (AK)' },
    { code: 'D7', name: 'AirAsia X (D7)' }, { code: 'SB', name: 'Aircalin (SB)' },
    { code: 'AS', name: 'Alaska Airlines (AS)' }, { code: 'AZ', name: 'Alitalia (AZ)' },
    { code: 'NH', name: 'ANA - All Nippon Airways (NH)' }, { code: 'AA', name: 'American Airlines (AA)' },
    { code: 'OZ', name: 'Asiana Airlines (OZ)' }, { code: 'OS', name: 'Austrian Airlines (OS)' },
    { code: 'AV', name: 'Avianca (AV)' }, { code: 'PG', name: 'Bangkok Airways (PG)' },
    { code: 'BA', name: 'British Airways (BA)' }, { code: 'SN', name: 'Brussels Airlines (SN)' },
    { code: 'CX', name: 'Cathay Pacific (CX)' }, { code: 'CI', name: 'China Airlines (CI)' },
    { code: 'MU', name: 'China Eastern (MU)' }, { code: 'CZ', name: 'China Southern (CZ)' },
    { code: 'CO', name: 'Continental Airlines (CO)' }, { code: 'OU', name: 'Croatia Airlines (OU)' },
    { code: 'CU', name: 'Cubana de Aviacion (CU)' }, { code: 'CY', name: 'Cyprus Airways (CY)' },
    { code: 'OK', name: 'Czech Airlines (OK)' }, { code: 'DL', name: 'Delta Air Lines (DL)' },
    { code: 'KA', name: 'Dragonair (KA)' }, { code: 'MS', name: 'EgyptAir (MS)' },
    { code: 'LY', name: 'EL AL Israel Airlines (LY)' }, { code: 'ET', name: 'Ethiopian Airlines (ET)' },
    { code: 'BR', name: 'EVA Air (BR)' }, { code: 'FJ', name: 'Fiji Airways (FJ)' },
    { code: 'AY', name: 'Finnair (AY)' }, { code: 'GA', name: 'Garuda Indonesia (GA)' },
    { code: 'GF', name: 'Gulf Air (GF)' }, { code: 'HU', name: 'Hainan Airlines (HU)' },
    { code: 'HA', name: 'Hawaiian Airlines (HA)' }, { code: 'IB', name: 'Iberia (IB)' },
    { code: 'FI', name: 'Icelandair (FI)' }, { code: 'IR', name: 'Iran Air (IR)' },
    { code: 'JL', name: 'Japan Airlines (JL)' }, { code: '9W', name: 'Jet Airways (9W)' },
    { code: 'B6', name: 'JetBlue Airways (B6)' }, { code: 'KL', name: 'KLM (KL)' },
    { code: 'KE', name: 'Korean Air (KE)' }, { code: 'KU', name: 'Kuwait Airways (KU)' },
    { code: 'LA', name: 'LATAM Airlines (LA)' }, { code: 'LO', name: 'LOT Polish Airlines (LO)' },
    { code: 'LH', name: 'Lufthansa (LH)' }, { code: 'MH', name: 'Malaysia Airlines (MH)' },
    { code: 'ME', name: 'Middle East Airlines (ME)' }, { code: 'WY', name: 'Oman Air (WY)' },
    { code: 'PK', name: 'Pakistan International (PK)' }, { code: 'PR', name: 'Philippine Airlines (PR)' },
    { code: 'QF', name: 'Qantas Airways (QF)' }, { code: 'AT', name: 'Royal Air Maroc (AT)' },
    { code: 'RJ', name: 'Royal Jordanian (RJ)' }, { code: 'SK', name: 'SAS (SK)' },
    { code: 'SQ', name: 'Singapore Airlines (SQ)' }, { code: 'SA', name: 'South African Airways (SA)' },
    { code: 'WN', name: 'Southwest Airlines (WN)' }, { code: 'LX', name: 'SWISS (LX)' },
    { code: 'TP', name: 'TAP Air Portugal (TP)' }, { code: 'TG', name: 'Thai Airways (TG)' },
    { code: 'TK', name: 'Turkish Airlines (TK)' }, { code: 'UA', name: 'United Airlines (UA)' },
    { code: 'VN', name: 'Vietnam Airlines (VN)' }, { code: 'VS', name: 'Virgin Atlantic (VS)' },
    { code: 'VA', name: 'Virgin Australia (VA)' }, { code: 'VY', name: 'Vueling Airlines (VY)' },
    { code: 'WS', name: 'WestJet (WS)' }, { code: 'WF', name: 'Wideroe (WF)' },
    { code: 'XY', name: 'Flynas (XY)' }, { code: 'B3', name: 'Tashi Air (B3)' },
    { code: 'KB', name: 'Druk Air (KB)' }, { code: 'RA', name: 'Nepal Airlines (RA)' },
    { code: 'H9', name: 'Himalaya Airlines (H9)' }, { code: 'BG', name: 'Biman Bangladesh (BG)' },
    { code: 'BS', name: 'US-Bangla Airlines (BS)' }, { code: 'UL', name: 'SriLankan Airlines (UL)' },
    { code: 'M8', name: 'SkyJet (M8)' }, { code: 'DV', name: 'SCAT Airlines (DV)' },
    { code: 'HY', name: 'Uzbekistan Airways (HY)' }, { code: 'T5', name: 'Turkmenistan Airlines (T5)' },
    { code: '4J', name: 'FlyArna (4J)' }, { code: '6R', name: 'Alrosa (6R)' },
];

export default function CommissionSetupScreen({ navigation }) {
    const t = useThemeColors();
    const [activeService, setActiveService] = useState('DOMESTIC_FLIGHT');
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        airline: 'ALL',
        refundType: 'All',
        markupType: 'Fixed',
        markupValue: ''
    });

    const [showAirlinePicker, setShowAirlinePicker] = useState(false);
    const [airlineSearch, setAirlineSearch] = useState('');

    useEffect(() => { fetchRules(); }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await adminService.getMarkups();
            if (res.success) setRules(res.data);
        } catch (err) { console.error('Fetch error:', err); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!formData.markupValue) return Toast.show({ type: 'info', text1: 'Error', text2: 'Please enter a markup value' });
        setSaving(true);
        try {
            const finalData = {
                ...formData,
                serviceType: activeService,
                markupValue: parseFloat(formData.markupValue),
                priority: formData.airline === 'ALL' ? 0 : 10
            };
            const res = await adminService.updateMarkup(finalData);
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Markup rule saved' });
                setShowAddModal(false);
                fetchRules();
                setFormData({ airline: 'ALL', refundType: 'All', markupType: 'Fixed', markupValue: '' });
            } else { Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Failed to save' }); }
        } catch (err) { Toast.show({ type: 'error', text1: 'Error', text2: 'Something went wrong' }); }
        finally { setSaving(false); }
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

    const currentAirlineList = activeService === 'DOMESTIC_FLIGHT' ? domesticAirlines : internationalAirlines;
    const filteredRules = rules.filter(r => r.serviceType === activeService);
    const selectedAirlineName = currentAirlineList.find(a => a.code === formData.airline)?.name || 'Select Airline';

    const renderRuleCard = (rule) => (
        <View key={rule._id} style={{ backgroundColor: t.card, elevation: 8 }} 
            className="p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 mb-6 shadow-2xl shadow-slate-300/40">
            <View className="flex-row justify-between items-start mb-4 pb-4 border-b border-slate-100">
                <View className="flex-1 pr-2">
                    <Text style={{ color: t.text }} className="font-black text-xl tracking-wide mb-1">
                        {currentAirlineList.find(a => a.code === rule.airline)?.name || rule.airline}
                    </Text>
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{rule.refundType} • {activeService.replace('_', ' ')}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(rule._id)} className="bg-rose-50 p-3.5 rounded-2xl border border-rose-100 shadow-sm active:scale-95">
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>
            <View className="flex-row justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                <View>
                    <Text className="text-slate-400 text-[9px] font-black uppercase mb-1 tracking-widest">Markup Charge</Text>
                    <Text className="text-[#F07E21] font-black text-2xl tracking-tight">
                        {rule.markupType === 'Fixed' ? '₹' : ''}{rule.markupValue}{rule.markupType === 'Percentage' ? '%' : ''}
                    </Text>
                </View>
                {rule.priority > 0 && (
                    <View className="bg-orange-50 px-3.5 py-1.5 rounded-xl border border-orange-200 shadow-sm">
                        <Text className="text-[#F07E21] text-[9px] font-black uppercase tracking-widest">Priority Match</Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-5 py-5 flex-row items-center justify-between border-b border-slate-100 mb-2">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm mr-3.5">
                            <Ionicons name="arrow-back" size={22} color="#0f172a" />
                        </TouchableOpacity>
                        <View className="bg-orange-50 w-12 h-12 rounded-2xl items-center justify-center border border-orange-100 shadow-sm mr-3.5">
                            <Ionicons name="pricetags" size={24} color="#F07E21" />
                        </View>
                        <View>
                            <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">Markup Engine</Text>
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Global Price Control</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => setShowAddModal(true)} className="bg-[#F07E21] px-5 py-3.5 rounded-2xl border border-[#F07E21] border-b-4 border-b-[#D96B18] shadow-lg shadow-orange-500/30 active:scale-95">
                        <Text className="text-white font-black text-[10px] uppercase tracking-wider">+ New Rule</Text>
                    </TouchableOpacity>
                </View>

                <View className="flex-row px-5 py-2 mb-4 gap-3">
                    {['DOMESTIC_FLIGHT', 'INTERNATIONAL_FLIGHT'].map((s) => {
                        const active = activeService === s;
                        return (
                            <TouchableOpacity key={s} onPress={() => setActiveService(s)}
                                className={`flex-1 py-4 items-center rounded-2xl border border-b-4 active:scale-95 shadow-sm ${active ? 'bg-[#F07E21] border-[#F07E21] border-b-[#D96B18] shadow-orange-500/20' : 'bg-white border-slate-100 border-b-slate-200'}`}>
                                <Text className={`font-black text-[10px] uppercase tracking-widest ${active ? 'text-white' : 'text-slate-400'}`}>
                                    {s.replace('_FLIGHT', '')}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#F07E21" size="large" />
                    </View>
                ) : (
                    <ScrollView className="flex-1 px-5 pt-1" showsVerticalScrollIndicator={false}>
                        {filteredRules.length === 0 ? (
                            <View className="py-24 items-center">
                                <Ionicons name="pricetags-outline" size={64} color="#cbd5e1" className="mb-4" />
                                <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Active Rules</Text>
                                <Text className="text-slate-400 font-bold text-xs">Create a new rule to manage markups.</Text>
                            </View>
                        ) : filteredRules.map(renderRuleCard)}
                        <View className="h-20" />
                    </ScrollView>
                )}
            </SafeAreaView>

            <Modal visible={showAddModal} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-[3rem] p-8 pb-12 border-t border-slate-100 shadow-2xl" style={{ elevation: 24 }}>
                        <View className="flex-row justify-between items-center mb-8 border-b border-slate-100 pb-4">
                            <Text className="text-2xl font-black text-[#1D4171] uppercase tracking-wide">Add Pricing Rule</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm">
                                <Ionicons name="close" size={22} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Carrier</Text>
                        <TouchableOpacity onPress={() => setShowAirlinePicker(true)} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6 flex-row justify-between items-center shadow-sm active:scale-95">
                            <Text className="font-black text-slate-800 text-base tracking-wide">{selectedAirlineName}</Text>
                            <Ionicons name="chevron-down" size={20} color="#64748b" />
                        </TouchableOpacity>

                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Refund Type</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6 pb-2">
                            {['All', 'Refundable', 'Non-Refundable', 'P Refundable'].map(type => (
                                <TouchableOpacity key={type} onPress={() => setFormData({...formData, refundType: type})}
                                    className={`px-5 py-3 rounded-xl border border-b-4 mr-2.5 active:scale-95 shadow-sm ${formData.refundType === type ? 'bg-[#1D4171] border-[#15305B] border-b-[#0f2342]' : 'bg-white border-slate-100 border-b-slate-200'}`}>
                                    <Text className={`text-[10px] font-black uppercase tracking-widest ${formData.refundType === type ? 'text-white' : 'text-slate-400'}`}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Logic</Text>
                        <View className="flex-row gap-3 mb-6">
                            {['Fixed', 'Percentage'].map(type => (
                                <TouchableOpacity key={type} onPress={() => setFormData({...formData, markupType: type})}
                                    className={`flex-1 py-4 rounded-xl border border-b-4 items-center active:scale-95 shadow-sm ${formData.markupType === type ? 'bg-[#1D4171] border-[#15305B] border-b-[#0f2342]' : 'bg-white border-slate-100 border-b-slate-200'}`}>
                                    <Text className={`text-[10px] font-black uppercase tracking-widest ${formData.markupType === type ? 'text-white' : 'text-slate-400'}`}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Amount</Text>
                        <TextInput 
                            placeholder="0.00" keyboardType="numeric" value={formData.markupValue} 
                            onChangeText={v => setFormData({...formData, markupValue: v})}
                            placeholderTextColor="#9ca3af"
                            className="bg-slate-50 px-6 py-5 rounded-2xl text-2xl font-black text-[#F07E21] border border-slate-100 mb-8 shadow-inner" 
                        />

                        <TouchableOpacity onPress={handleSave} className="bg-[#F07E21] py-5 rounded-2xl items-center border border-[#F07E21] border-b-[6px] border-b-[#D96B18] shadow-xl shadow-orange-500/30 active:scale-95">
                            {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black uppercase text-xs tracking-widest">Activate Rule</Text>}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={showAirlinePicker} animationType="fade" transparent>
                <View className="flex-1 bg-black/60 items-center justify-center p-5">
                    <View className="bg-white w-full rounded-[3rem] p-8 h-[80%] border border-slate-100 shadow-2xl" style={{ elevation: 24 }}>
                        <View className="flex-row justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <Text className="text-xl font-black text-[#1D4171] uppercase tracking-wide">Select Airline</Text>
                            <TouchableOpacity onPress={() => setShowAirlinePicker(false)} className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm">
                                <Ionicons name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <TextInput 
                            placeholder="Search airline..." value={airlineSearch} onChangeText={setAirlineSearch}
                            placeholderTextColor="#9ca3af"
                            className="bg-slate-50 px-5 py-4 rounded-2xl mb-4 border border-slate-100 font-black text-sm text-slate-800 shadow-inner"
                        />
                        <FlatList 
                            data={currentAirlineList.filter(a => a.name.toLowerCase().includes(airlineSearch.toLowerCase()) || a.code.toLowerCase().includes(airlineSearch.toLowerCase()))}
                            keyExtractor={item => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    onPress={() => { setFormData({...formData, airline: item.code}); setShowAirlinePicker(false); setAirlineSearch(''); }}
                                    className="py-4 border-b border-slate-50 flex-row justify-between items-center active:opacity-70 px-2"
                                >
                                    <View>
                                        <Text className="font-black text-slate-800 text-sm tracking-wide">{item.name}</Text>
                                        <Text className="text-[10px] font-black text-slate-400 mt-0.5 tracking-widest">{item.code}</Text>
                                    </View>
                                    <Ionicons name="airplane" size={18} color="#cbd5e1" />
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
