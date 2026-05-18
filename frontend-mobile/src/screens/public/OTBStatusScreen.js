import React, { useState } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, 
    TextInput, ActivityIndicator 
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { otbService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';

export default function OTBStatusScreen() {
    const t = useThemeColors();
    const [receiptNumber, setReceiptNumber] = useState('');
    const [contactNo, setContactNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusData, setStatusData] = useState(null);

    const handleCheckStatus = async () => {
        if (!receiptNumber || !contactNo) {
            Toast.show({ type: 'info', text1: 'Missing Info', text2: 'Please provide both Receipt Number and Mobile No.' });
            return;
        }
        setLoading(true);
        setStatusData(null);
        try {
            const res = await otbService.getStatus(receiptNumber, contactNo);
            if (res.success) {
                setStatusData(res.otbRequest);
            } else {
                Toast.show({ type: 'error', text1: 'Not Found', text2: 'Application details could not be found.' });
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Unable to fetch status. Please check your connection.' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return '#22c55e';
            case 'REJECTED': return '#ef4444';
            case 'PROCESSING': return '#48A0D4';
            default: return '#f59e0b';
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    
                    {/* Header */}
                    <View className="items-center mt-12 mb-10">
                        <View className="w-20 h-20 bg-white rounded-[2rem] items-center justify-center shadow-2xl border border-gray-100 mb-6">
                            <Text className="text-4xl">🔍</Text>
                        </View>
                        <Text style={{ color: t.text }} className="text-3xl font-black">Track OTB</Text>
                        <Text style={{ color: t.textMuted, letterSpacing: 4 }} className="text-[10px] font-black uppercase mt-2">Instant Status Check</Text>
                    </View>

                    {/* Search Form */}
                    <View style={{ backgroundColor: t.card, elevation: 8 }} className="p-8 rounded-[3rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-10 relative overflow-hidden">
                         <View className="absolute top-0 left-0 w-full h-1.5 bg-[#F07E21]" />
                         
                         <View className="mb-6">
                            <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase ml-4 mb-2">Receipt Number</Text>
                            <TextInput 
                                placeholder="ZAYA-OTB-XXXX"
                                className="bg-gray-50 p-5 rounded-2xl font-black text-lg text-center border border-slate-100 shadow-inner"
                                value={receiptNumber}
                                onChangeText={v => setReceiptNumber(v.toUpperCase())}
                            />
                         </View>

                         <View className="mb-8">
                            <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase ml-4 mb-2">Registered Mobile</Text>
                            <TextInput 
                                placeholder="Your Contact Number"
                                keyboardType="phone-pad"
                                className="bg-gray-50 p-5 rounded-2xl font-black text-lg text-center border border-slate-100 shadow-inner"
                                value={contactNo}
                                onChangeText={setContactNo}
                            />
                         </View>

                         <TouchableOpacity onPress={handleCheckStatus} disabled={loading} className="bg-[#1D4171] py-5 rounded-2xl items-center border border-[#1D4171] border-b-[6px] border-b-[#11294a] shadow-xl shadow-blue-900/20 active:scale-95">
                            {loading ? <ActivityIndicator color="#fff" /> : (
                                <Text className="text-white font-black text-sm uppercase text-center tracking-widest">Fetch Status</Text>
                            )}
                         </TouchableOpacity>
                    </View>

                    {/* Result Card */}
                    {statusData && (
                        <View style={{ backgroundColor: t.card, elevation: 8 }} className="p-8 rounded-[3rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-10 animate-fade-in">
                            <View className="flex-row justify-between items-center mb-10">
                                <View>
                                    <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase mb-1">Status</Text>
                                    <View style={{ backgroundColor: getStatusColor(statusData.status) + '20', borderColor: getStatusColor(statusData.status) + '40' }} className="px-4 py-2 rounded-xl border">
                                        <Text style={{ color: getStatusColor(statusData.status) }} className="font-black uppercase text-xs">{statusData.status}</Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase mb-1">Airline</Text>
                                    <Text style={{ color: t.text }} className="text-xl font-black">{statusData.airline}</Text>
                                </View>
                            </View>

                            <View className="grid grid-cols-2 gap-y-8 mb-10">
                                <View>
                                    <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase mb-1">PNR</Text>
                                    <Text style={{ color: t.text }} className="text-base font-black">{statusData.travelDetails.pnr}</Text>
                                </View>
                                <View className="items-end">
                                    <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase mb-1">Destination</Text>
                                    <Text style={{ color: t.text }} className="text-base font-black">{statusData.travelDetails.destination}</Text>
                                </View>
                                <View>
                                    <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase mb-1">Travel Date</Text>
                                    <Text style={{ color: t.text }} className="text-base font-black">{new Date(statusData.travelDetails.dateOfTravel).toLocaleDateString()}</Text>
                                </View>
                                <View className="items-end">
                                    <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase mb-1">Payment</Text>
                                    <Text className={`text-base font-black ${statusData.paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-500'}`}>{statusData.paymentStatus}</Text>
                                </View>
                            </View>

                            {statusData.adminNotes && (
                                <View className="bg-blue-50 p-5 rounded-2xl border border-blue-100 mb-4">
                                    <Text className="text-blue-900 font-bold italic leading-relaxed">"{statusData.adminNotes}"</Text>
                                </View>
                            )}
                        </View>
                    )}
                    <View className="h-20" />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
