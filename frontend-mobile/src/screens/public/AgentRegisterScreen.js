import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';

import * as DocumentPicker from 'expo-document-picker';

export default function AgentRegisterScreen({ navigation }) {
    const t = useThemeColors();
    const [formData, setFormData] = useState({
        agentName: '', agencyName: '', emailAddress: '', password: '', mobileNumber: '', address: '',
        gstNumber: '', shopDocCategory: 'Visiting Card'
    });
    const [kycFiles, setKycFiles] = useState({
        aadharFront: null, aadharBack: null, panCard: null, shopDoc: null
    });
    const [loading, setLoading] = useState(false);

    const pickDocument = async (field) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/jpeg', 'image/png'],
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const file = result.assets[0];

            // 100KB Check
            if (file.size > 100 * 1024) {
                return Toast.show({ type: 'error', text1: 'File Too Large', text2: 'Maximum allowed size is 100KB.' });
            }

            setKycFiles(prev => ({ ...prev, [field]: file }));
            Toast.show({ type: 'success', text1: 'Document Selected', text2: `${field} attached.` });
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to pick document.' });
        }
    };

    const handleRegister = async () => {
        const { agentName, agencyName, emailAddress, password, mobileNumber, address } = formData;
        
        if (!agentName || !agencyName || !emailAddress || !password || !mobileNumber || !address) {
            return Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill all required profile fields.' });
        }

        if (!kycFiles.aadharFront || !kycFiles.aadharBack || !kycFiles.panCard || !kycFiles.shopDoc) {
            return Toast.show({ type: 'error', text1: 'Missing Documents', text2: 'All 4 KYC documents are mandatory.' });
        }

        setLoading(true);
        try {
            const data = new FormData();
            
            // Text fields
            Object.keys(formData).forEach(key => data.append(key, formData[key]));

            // Files
            const appendFile = (field, file) => {
                if (!file) return;
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

            const res = await authService.agentRegister(data);
            
            Toast.show({ type: 'success', text1: 'Success', text2: 'KYC documents submitted for review.' });
            navigation.goBack();
        } catch (error) {
            const msg = error.response?.data?.message || 'Registration failed.';
            Toast.show({ type: 'error', text1: 'Error', text2: msg });
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { label: 'Your Full Name', key: 'agentName', placeholder: 'John Doe', icon: '👤' },
        { label: 'Legal Agency Name', key: 'agencyName', placeholder: 'Skyline Travels Pvt Ltd', icon: '🏢' },
        { label: 'Official Email', key: 'emailAddress', placeholder: 'name@agency.com', icon: '📧', keyboard: 'email-address' },
        { label: 'Mobile Number', key: 'mobileNumber', placeholder: '10-digit mobile number', icon: '📱', keyboard: 'phone-pad' },
        { label: 'Full Legal Address', key: 'address', placeholder: '123 Corporate Park, New Delhi', icon: '📍' },
        { label: 'GSTIN (Optional)', key: 'gstNumber', placeholder: 'Enter GST number', icon: '🏷️' },
        { label: 'Account Password', key: 'password', placeholder: '••••••••', icon: '🔐', secure: true },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View className="px-6 pt-6 pb-4">
                            <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
                                <Text className="text-2xl">←</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Main Card */}
                        <View className="px-4">
                            <View style={{ backgroundColor: t.card, elevation: 8 }} className="rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 overflow-hidden relative">
                                {/* Decorative blob */}
                                <View className="absolute top-0 right-0 w-64 h-64 bg-[#1D4171]/5 rounded-full -mr-32 -mt-32" />
                                
                                <View className="p-6 relative z-10">
                                    {/* Logo + Title */}
                                    <View className="items-center mb-8">
                                        <LinearGradient
                                            colors={['#1D4171', '#17365e']}
                                            style={{ width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
                                        >
                                            <Text className="text-white font-black text-2xl">ZF</Text>
                                        </LinearGradient>
                                        <Text style={{ color: t.text }} className="text-2xl font-black text-center">
                                            Join <Text className="text-[#F07E21]">Zayafly</Text> Network
                                        </Text>
                                        <Text style={{ color: t.textSecondary }} className="font-medium text-sm mt-2 text-center px-4">
                                            Start your travel agency journey today with the world's most advanced B2B inventory.
                                        </Text>
                                    </View>

                                    {/* Form Fields */}
                                    {fields.map((field, idx) => (
                                        <View key={field.key} className={idx > 0 ? "mt-4" : ""}>
                                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase mb-2 ml-1">
                                                {field.icon} {field.label}
                                            </Text>
                                            <TextInput
                                                style={{ backgroundColor: t.input }} className="w-full rounded-2xl px-5 py-4 font-black text-slate-800 text-sm border border-slate-100 shadow-inner"
                                                placeholder={field.placeholder}
                                                placeholderTextColor="#9ca3af"
                                                secureTextEntry={field.secure}
                                                keyboardType={field.keyboard || 'default'}
                                                autoCapitalize={field.key === 'emailAddress' ? 'none' : 'words'}
                                                value={formData[field.key]}
                                                onChangeText={(val) => setFormData({...formData, [field.key]: val})}
                                            />
                                        </View>
                                    ))}

                                    {/* KYC Section */}
                                    <View className="mt-8 pt-8 border-t border-gray-100">
                                        <Text style={{ color: t.text }} className="text-lg font-black uppercase italic mb-4">📸 KYC Documents</Text>
                                        <Text style={{ color: t.textMuted }} className="text-[10px] font-bold uppercase mb-6">ALL DOCUMENTS MANDATORY (MAX 100KB)</Text>
                                        
                                        <View className="flex-row flex-wrap gap-4">
                                            {[
                                                { key: 'aadharFront', label: 'Aadhar Front' },
                                                { key: 'aadharBack', label: 'Aadhar Back' },
                                                { key: 'panCard', label: 'PAN Card' }
                                            ].map(doc => (
                                                <TouchableOpacity 
                                                    key={doc.key}
                                                    onPress={() => pickDocument(doc.key)}
                                                    className={`flex-1 min-w-[140px] p-4 rounded-2xl border-2 border-dashed ${kycFiles[doc.key] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                                                >
                                                    <Text className="text-xl mb-1">{kycFiles[doc.key] ? '✅' : '📄'}</Text>
                                                    <Text style={{ color: kycFiles[doc.key] ? '#059669' : '#6b7280' }} className="text-[10px] font-black uppercase">{doc.label}</Text>
                                                </TouchableOpacity>
                                            ))}

                                            <View className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200">
                                                <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase mb-2">Professional Proof Type</Text>
                                                <View className="flex-row items-center gap-2 mb-4">
                                                    {['Visiting Card', 'CSC ID', 'Shop Image'].map(cat => (
                                                        <TouchableOpacity 
                                                            key={cat}
                                                            onPress={() => setFormData({...formData, shopDocCategory: cat})}
                                                            className={`px-3 py-2 rounded-lg ${formData.shopDocCategory === cat ? 'bg-[#1D4171]' : 'bg-white border border-gray-200'}`}
                                                        >
                                                            <Text className={`text-[8px] font-black uppercase ${formData.shopDocCategory === cat ? 'text-white' : 'text-gray-500'}`}>{cat}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                                <TouchableOpacity 
                                                    onPress={() => pickDocument('shopDoc')}
                                                    className={`w-full py-4 rounded-xl items-center ${kycFiles.shopDoc ? 'bg-green-100' : 'bg-[#F07E21]'}`}
                                                >
                                                    <Text className="text-white font-black text-[10px] uppercase">
                                                        {kycFiles.shopDoc ? '✅ DOCUMENT ATTACHED' : '⬆️ UPLOAD SHIELD PROOF'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Submit Button */}
                                    <TouchableOpacity 
                                        onPress={handleRegister}
                                        disabled={loading}
                                        className="bg-[#1D4171] mt-8 py-5 rounded-2xl items-center border border-[#1D4171] border-b-[6px] border-b-[#11294a] shadow-xl shadow-blue-900/20 active:scale-95"
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text className="text-white font-black text-sm uppercase tracking-widest">
                                                Complete Agent Registration
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Bottom Link */}
                        <View className="items-center my-8">
                            <TouchableOpacity onPress={() => navigation.navigate('Login')} className="flex-row items-center bg-white px-6 py-4 rounded-2xl border border-slate-100 border-b-4 border-slate-200 shadow-sm active:scale-95">
                                <Text className="text-lg mr-3">👤</Text>
                                <View>
                                    <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase">Already a partner?</Text>
                                    <Text className="text-[#1D4171] font-black text-sm">Sign in to dashboard →</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        <Text style={{ color: t.textMuted }} className="text-center text-[10px] font-bold uppercase pb-6 px-8">
                            By registering, you agree to Zayafly's Partner Service Level Agreements.
                        </Text>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
