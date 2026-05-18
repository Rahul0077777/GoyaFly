import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../services/api';
import Toast from 'react-native-toast-message';
import { useThemeColors } from '../../utils/themeColors';
import { LinearGradient } from 'expo-linear-gradient';

export default function KycStatusScreen({ navigation }) {
    const t = useThemeColors();
    const [loading, setLoading] = useState(false);
    const [agentInfo, setAgentInfo] = useState(null);
    const [kycFiles, setKycFiles] = useState({
        aadharFront: null, aadharBack: null, panCard: null, shopDoc: null
    });
    const [shopDocCategory, setShopDocCategory] = useState('Visiting Card');

    React.useEffect(() => {
        loadAgentInfo();
    }, []);

    const loadAgentInfo = async () => {
        const info = await AsyncStorage.getItem('agentInfo');
        if (info) setAgentInfo(JSON.parse(info));
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('agentToken');
        await AsyncStorage.removeItem('agentInfo');
        navigation.replace('Auth');
    };

    const pickDocument = async (field) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/jpeg', 'image/png'],
            });

            if (result.canceled) return;
            const file = result.assets[0];

            if (file.size > 100 * 1024) {
                return Toast.show({ type: 'error', text1: 'File Too Large', text2: 'Max 100KB allowed.' });
            }

            setKycFiles(prev => ({ ...prev, [field]: file }));
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Selection failed.' });
        }
    };

    const handleResubmit = async () => {
        if (!kycFiles.aadharFront || !kycFiles.aadharBack || !kycFiles.panCard || !kycFiles.shopDoc) {
            return Toast.show({ type: 'error', text1: 'Action Required', text2: 'All 4 documents must be re-uploaded.' });
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('shopDocCategory', shopDocCategory);

            const appendFile = (field, file) => {
                data.append(field, {
                    uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
                    type: file.mimeType || 'image/jpeg',
                    name: file.name
                });
            };

            appendFile('aadharFront', kycFiles.aadharFront);
            appendFile('aadharBack', kycFiles.aadharBack);
            appendFile('panCard', kycFiles.panCard);
            appendFile('shopDoc', kycFiles.shopDoc);

            await authService.agentKycResubmit(data);
            
            Toast.show({ type: 'success', text1: 'Submitted', text2: 'Review process started.' });
            
            // Update local state to show pending
            const newInfo = { ...agentInfo, kycStatus: 'PENDING', kycRejectReason: null };
            await AsyncStorage.setItem('agentInfo', JSON.stringify(newInfo));
            setAgentInfo(newInfo);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed', text2: 'Upload error. Try again.' });
        } finally {
            setLoading(false);
        }
    };

    if (!agentInfo) return null;

    if (agentInfo.kycStatus === 'PENDING') {
        return (
            <View style={{ flex: 1, backgroundColor: t.bg }}>
                <SafeAreaView className="flex-1 items-center justify-center px-8">
                    <View className="w-24 h-24 bg-[#1D4171]/10 rounded-full items-center justify-center mb-8">
                        <Text className="text-4xl animate-pulse">⏳</Text>
                    </View>
                    <Text style={{ color: t.text }} className="text-2xl font-black text-center uppercase italic">Review in Progress</Text>
                    <Text style={{ color: t.textSecondary }} className="text-center mt-4 mb-8 leading-6 font-medium">
                        Our compliance team is verifying your credentials. This usually takes less than 2 hours during business hours.
                    </Text>

                    <View className="w-full bg-slate-50 p-7 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-10">
                        <Text className="text-[9px] font-black text-slate-400 uppercase mb-4 text-center tracking-widest">Registration Details</Text>
                        <View className="flex-row justify-between mb-3">
                            <Text className="text-slate-400 text-[10px] font-bold uppercase">Login ID</Text>
                            <Text className="text-slate-900 text-[11px] font-black">{agentInfo.emailAddress}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-slate-400 text-[10px] font-bold uppercase">Mobile</Text>
                            <Text className="text-slate-900 text-[11px] font-black">+91 {agentInfo.mobileNumber}</Text>
                        </View>
                    </View>

                    <TouchableOpacity onPress={handleLogout} className="w-full bg-white py-5 rounded-2xl items-center border border-slate-100 border-b-[6px] border-slate-200 shadow-xl active:scale-95">
                        <Text style={{ color: t.textMuted }} className="font-black uppercase text-xs tracking-widest">Exit Session</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </View>
        );
    }

    if (agentInfo.kycStatus === 'REJECTED') {
        return (
            <View style={{ flex: 1, backgroundColor: t.bg }}>
                <SafeAreaView className="flex-1">
                    <ScrollView className="flex-1 p-6">
                        <View className="bg-red-500 p-8 rounded-[2.5rem] border border-red-500 border-b-[8px] border-red-700 shadow-2xl shadow-red-900/30 mb-6">
                            <Text className="text-white text-3xl font-black uppercase italic">Action Needed</Text>
                            <View className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20">
                                <Text className="text-white/60 text-[8px] font-black uppercase mb-1">Rejection Reason</Text>
                                <Text className="text-white font-bold text-sm leading-5">{agentInfo.kycRejectReason || 'Documents invalid.'}</Text>
                            </View>
                        </View>

                        <Text style={{ color: t.text }} className="text-lg font-black uppercase italic mb-4 ml-2">Re-upload Documents</Text>
                        
                        <View className="grid grid-cols-2 gap-4 flex-row flex-wrap mb-8">
                            {[
                                { key: 'aadharFront', label: 'Aadhar Front' },
                                { key: 'aadharBack', label: 'Aadhar Back' },
                                { key: 'panCard', label: 'PAN Card' }
                            ].map(doc => (
                                <TouchableOpacity 
                                    key={doc.key}
                                    onPress={() => pickDocument(doc.key)}
                                    className={`flex-1 min-w-[140px] p-5 rounded-[1.5rem] border-2 border-dashed ${kycFiles[doc.key] ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 shadow-sm'}`}
                                >
                                    <View className="flex-row justify-between items-start">
                                        <Text className="text-2xl">{kycFiles[doc.key] ? '✅' : '📄'}</Text>
                                        <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase">{doc.label}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}

                            <View className="w-full bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-slate-300/40 border border-slate-100 border-b-[8px] border-slate-200 overflow-hidden">
                                <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase mb-3 tracking-widest">Proof Type</Text>
                                <View className="flex-row gap-2 mb-4">
                                    {['Visiting Card', 'CSC ID', 'Shop Image'].map(cat => (
                                        <TouchableOpacity 
                                            key={cat}
                                            onPress={() => setShopDocCategory(cat)}
                                            className={`px-3 py-2 rounded-lg ${shopDocCategory === cat ? 'bg-[#1D4171]' : 'bg-gray-50 border border-gray-100'}`}
                                        >
                                            <Text className={`text-[7px] font-black uppercase ${shopDocCategory === cat ? 'text-white' : 'text-gray-400'}`}>{cat}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TouchableOpacity onPress={() => pickDocument('shopDoc')} className={`py-4 rounded-xl items-center ${kycFiles.shopDoc ? 'bg-green-100' : 'bg-[#F07E21]'}`}>
                                    <Text className="text-white font-black text-[10px]">
                                        {kycFiles.shopDoc ? '✅ ATTACHED' : '⬆️ UPLOAD PROOF'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity onPress={handleResubmit} disabled={loading} className="bg-[#1D4171] mb-12 py-5 rounded-2xl items-center border border-[#1D4171] border-b-[6px] border-b-[#11294a] shadow-xl shadow-blue-900/20 active:scale-95">
                            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black uppercase tracking-widest">Submit for Review</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </View>
        );
    }

    return null;
}
