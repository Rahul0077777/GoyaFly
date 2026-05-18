import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../utils/themeColors';
import { adminService } from '../../services/api';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function AgentEditorScreen({ navigation, route }) {
    const t = useThemeColors();
    const existingAgent = route.params?.agent;
    
    const [formData, setFormData] = useState({
        agentName: existingAgent?.agentName || '',
        agencyName: existingAgent?.agencyName || '',
        mobileNumber: existingAgent?.mobileNumber || '',
        emailAddress: existingAgent?.emailAddress || '',
        password: '',
        address: existingAgent?.address || '',
        gstNumber: existingAgent?.gstNumber || '',
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        const { agentName, agencyName, mobileNumber, emailAddress, password, address } = formData;
        if (!agentName || !agencyName || !mobileNumber || !emailAddress || !address || (!existingAgent && !password)) {
            return Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please fill all required fields.' });
        }

        setLoading(true);
        try {
            let res;
            if (existingAgent) {
                res = await adminService.updateAgent(existingAgent._id, formData);
            } else {
                res = await adminService.createAgent(formData);
            }

            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: `Agent ${existingAgent ? 'updated' : 'created'} successfully!` });
                navigation.goBack();
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Action failed' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'An error occurred. Please try again.' });
        } finally {
            setLoading(false);
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
                    <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center border border-blue-100 shadow-sm mr-3.5">
                        <Ionicons name="person-add" size={22} color="#1D4171" />
                    </View>
                    <View>
                        <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">
                            {existingAgent ? 'Edit Partner' : 'Add New Partner'}
                        </Text>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Agent Account Config</Text>
                    </View>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
                        <InputField label="Agent Name" value={formData.agentName} onChange={(val) => setFormData({...formData, agentName: val})} t={t} placeholder="e.g. Rahul Sharma" />
                        <InputField label="Agency Name" value={formData.agencyName} onChange={(val) => setFormData({...formData, agencyName: val})} t={t} placeholder="e.g. Sharma Travels" />
                        <InputField label="Email Address" value={formData.emailAddress} onChange={(val) => setFormData({...formData, emailAddress: val})} t={t} keyboardType="email-address" placeholder="e.g. rahul@sharmatravels.com" />
                        <InputField label="Mobile Number" value={formData.mobileNumber} onChange={(val) => setFormData({...formData, mobileNumber: val})} t={t} keyboardType="phone-pad" placeholder="e.g. 9876543210" />
                        {!existingAgent && (
                            <InputField label="Password" value={formData.password} onChange={(val) => setFormData({...formData, password: val})} t={t} secureTextEntry placeholder="••••••••" />
                        )}
                        <InputField label="GST Number (Optional)" value={formData.gstNumber} onChange={(val) => setFormData({...formData, gstNumber: val})} t={t} placeholder="e.g. 27AAAAA0000A1Z5" />
                        <InputField label="Office Address" value={formData.address} onChange={(val) => setFormData({...formData, address: val})} t={t} multiline placeholder="Enter full office address" />

                        <TouchableOpacity 
                            onPress={handleSave} disabled={loading}
                            className="bg-[#F07E21] py-5 rounded-2xl items-center border border-[#F07E21] border-b-[6px] border-b-[#D96B18] shadow-xl shadow-orange-500/30 active:scale-95 my-8 mb-16"
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : (
                                <Text className="text-white font-black text-xs uppercase tracking-widest">
                                    {existingAgent ? 'Save Changes' : 'Create Agent Account'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const InputField = ({ label, value, onChange, t, ...props }) => (
    <View className="mb-6">
        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">{label}</Text>
        <TextInput 
            value={value} onChangeText={onChange} 
            className="bg-slate-50 p-5 rounded-2xl font-black text-slate-900 text-base border border-slate-100 shadow-inner"
            placeholderTextColor="#9ca3af"
            {...props}
        />
    </View>
);
