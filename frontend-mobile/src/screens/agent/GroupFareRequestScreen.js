import React, { useState, useEffect } from 'react';
import { 
    View, Text, ScrollView, TextInput, TouchableOpacity, 
    ActivityIndicator, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { agentService, bookingService, authService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';

const InputField = ({ label, value, onChangeText, placeholder, keyboardType, multiline, readOnly, t }) => (
    <View className="mb-5">
        <Text className="text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">{label}</Text>
        <TextInput 
            value={value} onChangeText={onChangeText} placeholder={placeholder} 
            keyboardType={keyboardType} multiline={multiline} editable={!readOnly}
            className={`bg-gray-50 px-6 py-4 rounded-2xl font-bold text-sm ${readOnly ? 'text-gray-400' : 'text-gray-900'} border border-gray-100`}
            style={multiline && { height: 100, textAlignVertical: 'top' }}
        />
    </View>
);

export default function GroupFareRequestScreen({ navigation }) {
    const t = useThemeColors();
    const [submitting, setSubmitting] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    
    const [form, setForm] = useState({
        agentEmail: '',
        agentId: '',
        mobileNumber: '',
        purpose: 'Adhoc',
        journey: 'One Way',
        fromCity: '',
        toCity: '',
        departureDate: '',
        returnDate: '',
        noOfAdult: '',
        noOfChildren: '',
        noOfInfants: '',
        expectedFare: '',
        onwardFlightDetails: '',
        returnFlightDetails: '',
        remark: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await authService.getProfile();
                if (res.success) {
                    setForm(prev => ({
                        ...prev,
                        agentEmail: res.data.email || '',
                        agentId: res.data.agentId || res.data._id || '',
                        mobileNumber: res.data.mobile || '',
                    }));
                }
            } catch (err) { console.error(err); }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async () => {
        if (!form.fromCity || !form.toCity || !form.departureDate || !form.noOfAdult) {
            return Toast.show({ type: 'info', text1: 'Missing Info', text2: 'Please fill mandatory fields (From/To, Date, Pax).' });
        }

        setSubmitting(true);
        try {
            const res = await bookingService.submitGroupFare(form);
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Group Fare Request Submitted Successfully!' });
                navigation.goBack();
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Submission failed. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    {/* Header */}
                    <View className="px-6 py-4 flex-row items-center border-b border-gray-100 bg-white">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 w-10 h-10 bg-gray-50 rounded-xl items-center justify-center">
                            <Ionicons name="chevron-back" size={20} color="#000" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-xl font-black text-slate-900">Group Fare Request</Text>
                            <Text className="text-slate-400 text-[9px] font-black uppercase">Bulk Quote System</Text>
                        </View>
                    </View>

                    <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                        <View className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 mb-10">
                            <Text className="text-lg font-black text-slate-900 mb-8 border-b border-gray-50 pb-4">Request Details</Text>
                            
                            <InputField label="Agent Email" value={form.agentEmail} readOnly t={t} />
                            <InputField label="Agent ID" value={form.agentId} readOnly t={t} />
                            <InputField label="Mobile Number" value={form.mobileNumber} onChangeText={v => setForm({...form, mobileNumber: v})} placeholder="Enter mobile" t={t} />
                            
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Journey</Text>
                                    <View className="flex-row bg-gray-50 rounded-2xl p-1 mb-5">
                                        {['One Way', 'Round Trip'].map(j => (
                                            <TouchableOpacity key={j} onPress={() => setForm({...form, journey: j})}
                                                className={`flex-1 py-3 rounded-xl items-center ${form.journey === j ? 'bg-white shadow-sm' : ''}`}>
                                                <Text className={`text-[10px] font-black ${form.journey === j ? 'text-slate-900' : 'text-gray-400'}`}>{j}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            <View className="flex-row gap-4">
                                <View className="flex-1"><InputField label="From City" value={form.fromCity} onChangeText={v => setForm({...form, fromCity: v})} placeholder="Origin" t={t} /></View>
                                <View className="flex-1"><InputField label="To City" value={form.toCity} onChangeText={v => setForm({...form, toCity: v})} placeholder="Dest" t={t} /></View>
                            </View>

                            <View className="flex-row gap-4">
                                <View className="flex-1"><InputField label="Departure" value={form.departureDate} onChangeText={v => setForm({...form, departureDate: v})} placeholder="YYYY-MM-DD" t={t} /></View>
                                {form.journey === 'Round Trip' && <View className="flex-1"><InputField label="Return" value={form.returnDate} onChangeText={v => setForm({...form, returnDate: v})} placeholder="YYYY-MM-DD" t={t} /></View>}
                            </View>

                            <View className="flex-row gap-2">
                                <View className="flex-1"><InputField label="Adults" value={form.noOfAdult} onChangeText={v => setForm({...form, noOfAdult: v})} keyboardType="numeric" placeholder="0" t={t} /></View>
                                <View className="flex-1"><InputField label="Children" value={form.noOfChildren} onChangeText={v => setForm({...form, noOfChildren: v})} keyboardType="numeric" placeholder="0" t={t} /></View>
                                <View className="flex-1"><InputField label="Infants" value={form.noOfInfants} onChangeText={v => setForm({...form, noOfInfants: v})} keyboardType="numeric" placeholder="0" t={t} /></View>
                            </View>

                            <InputField label="Expected Fare (Per Pax)" value={form.expectedFare} onChangeText={v => setForm({...form, expectedFare: v})} placeholder="e.g. 15000" t={t} />
                            <InputField label="Additional Remarks" value={form.remark} onChangeText={v => setForm({...form, remark: v})} multiline placeholder="Specific flight numbers, etc." t={t} />

                            <TouchableOpacity onPress={() => setShowTerms(true)} className="mb-8">
                                <Text className="text-blue-500 font-bold text-[10px] uppercase underline text-center">View Terms & Conditions</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleSubmit} disabled={submitting} className="bg-orange-500 py-6 rounded-[2rem] items-center shadow-xl shadow-orange-200">
                                {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black uppercase">Submit Quote Request</Text>}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Terms Modal */}
            <Modal visible={showTerms} animationType="slide" transparent>
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-[3rem] p-8 h-[60%] shadow-2xl">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-black text-slate-900">Terms & Conditions</Text>
                            <TouchableOpacity onPress={() => setShowTerms(false)}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text className="text-gray-500 font-bold text-xs leading-6">
                                • Group Fares are provided by Airlines and may take 2-4 hours to process.{"\n"}
                                • Most airline group desks operate only on business days.{"\n"}
                                • Fares are subject to immediate closure and confirmation.{"\n"}
                                • 100% Advance payment is mandatory once confirmed.{"\n"}
                                • ADM if raised by airline will be charged to agency.
                            </Text>
                        </ScrollView>
                        <TouchableOpacity onPress={() => setShowTerms(false)} className="bg-slate-900 py-5 rounded-2xl mt-6">
                            <Text className="text-white text-center font-black uppercase text-[10px]">Close Window</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
