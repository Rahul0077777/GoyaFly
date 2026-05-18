import React, { useState, useEffect } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, 
    TextInput, ActivityIndicator, StyleSheet, Image 
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { otbService } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';
import RazorpayGatewayModal from '../../components/RazorpayGatewayModal';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from 'react-native';

const AIRLINE_GROUPS = {
    'SpiceJet': { rate: 650, group: 'A' },
    'IndiGo': { rate: 650, group: 'A' },
    'Air India': { rate: 650, group: 'A' },
    'Air India Express': { rate: 650, group: 'A' },
    'Air Arabia': { rate: 550, group: 'B' },
    'flydubai': { rate: 550, group: 'B' },
    'Gulf Air': { rate: 1000, group: 'C' },
    'SalamAir': { rate: 1000, group: 'C' },
    'Oman Air': { rate: 1000, group: 'C' }
};

const DESTINATIONS = {
    'Dubai': { surcharge: 0 },
    'Sharjah': { surcharge: 0 },
    'Abu Dhabi': { surcharge: 0 },
    'Kuwait': { surcharge: 250 },
    'Bahrain': { surcharge: 250 },
    'Oman': { surcharge: 250 },
    'Qatar': { surcharge: 250 },
    'Saudi Arabia': { surcharge: 250 }
};

export default function OTBApplyScreen({ navigation }) {
    const t = useThemeColors();
    const [loading, setLoading] = useState(false);
    const [feeCalculated, setFeeCalculated] = useState(false);
    
    const [formData, setFormData] = useState({
        airline: '',
        noOfAdults: '1',
        noOfChildren: '0',
        noOfInfants: '0',
        travelDetails: {
            destination: 'Dubai (UAE)',
            dateOfTravel: '',
            pnr: '',
            contactNo: '',
            email: ''
        },
        passengers: [{ paxType: 'Adult', title: 'Mr', firstName: '', lastName: '' }],
        documents: {
            passportCopy: null,
            visaCopy: null,
            onwardTicket: null,
            returnTicket: null
        },
        fees: {
            airlineFee: 0,
            surcharge: 0,
            urgentSurcharge: 0,
            otbFee: 0,
            handlingFee: 0,
            igst: 0,
            totalFare: 0
        }
    });

    const [isUrgent, setIsUrgent] = useState(false);
    const [showAirlineModal, setShowAirlineModal] = useState(false);
    const [showDestModal, setShowDestModal] = useState(false);

    useEffect(() => {
        const adults = parseInt(formData.noOfAdults) || 0;
        const children = parseInt(formData.noOfChildren) || 0;
        const infants = parseInt(formData.noOfInfants) || 0;
        const totalPax = adults + children + infants;
        
        const newPassengers = [...formData.passengers];
        if (newPassengers.length < totalPax) {
            for (let i = newPassengers.length; i < totalPax; i++) {
                let type = 'Adult';
                if (i >= adults && i < (adults + children)) type = 'Child';
                else if (i >= (adults + children)) type = 'Infant';
                newPassengers.push({ paxType: type, title: 'Mr', firstName: '', lastName: '' });
            }
        } else if (newPassengers.length > totalPax) {
            newPassengers.splice(totalPax);
        }
        setFormData(prev => ({ ...prev, passengers: newPassengers }));
    }, [formData.noOfAdults, formData.noOfChildren, formData.noOfInfants]);

    const handleCalculateFee = () => {
        const adults = parseInt(formData.noOfAdults) || 0;
        const children = parseInt(formData.noOfChildren) || 0;
        const infants = parseInt(formData.noOfInfants) || 0;
        const totalPax = adults + children + infants;
        
        if (!formData.airline) return Toast.show({ type: 'info', text1: 'Selection Required', text2: 'Please select an Airline first.' });
        if (!formData.travelDetails.destination) return Toast.show({ type: 'info', text1: 'Selection Required', text2: 'Please select a Destination first.' });

        const airlineData = AIRLINE_GROUPS[formData.airline];
        const destData = DESTINATIONS[formData.travelDetails.destination];

        const baseRate = airlineData.rate;
        const surchargePerPax = destData.surcharge;
        const urgentRate = isUrgent ? 300 : 0;

        const totalAirlineFee = baseRate * totalPax;
        const totalSurcharge = surchargePerPax * totalPax;
        const totalUrgentSurcharge = urgentRate * totalPax;
        const handlingFee = 0; 
        
        const subtotal = totalAirlineFee + totalSurcharge + totalUrgentSurcharge + handlingFee;
        const igst = subtotal * 0.18;
        const totalFare = subtotal + igst;

        setFormData(prev => ({
            ...prev,
            fees: {
                airlineFee: totalAirlineFee,
                surcharge: totalSurcharge,
                urgentSurcharge: totalUrgentSurcharge,
                otbFee: subtotal,
                handlingFee,
                igst: parseFloat(igst.toFixed(2)),
                totalFare: parseFloat(totalFare.toFixed(2))
            }
        }));
        setFeeCalculated(true);
    };

    const pickDocument = async (field) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                setFormData(prev => ({
                    ...prev,
                    documents: {
                        ...prev.documents,
                        [field]: {
                            uri: asset.uri,
                            name: asset.name,
                            type: asset.mimeType || 'application/octet-stream'
                        }
                    }
                }));
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to pick document' });
        }
    };

    const [showGateway, setShowGateway] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [razorpayKey, setRazorpayKey] = useState(null);

    const handleSubmit = async () => {
        if (!feeCalculated) {
            Toast.show({ type: 'info', text1: 'Fee Required', text2: 'Please calculate the fee first.' });
            return;
        }

        // Basic validation
        if (!formData.airline || !formData.travelDetails.pnr) {
            Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please fill in Airline and PNR' });
            return;
        }

        if (!formData.documents.visaCopy || !formData.documents.onwardTicket) {
            Toast.show({ type: 'error', text1: 'Missing Documents', text2: 'Visa Copy and Onward Ticket are mandatory for OTB.' });
            return;
        }

        for (let i = 0; i < formData.passengers.length; i++) {
            const pax = formData.passengers[i];
            if (!pax.firstName || !pax.lastName) {
                Toast.show({ type: 'error', text1: 'Missing Info', text2: `Please fill in first and last name for Passenger ${i + 1}` });
                return;
            }
        }

        setLoading(true);
        try {
            // Build FormData for multipart upload
            const data = new FormData();
            data.append('airline', formData.airline);
            data.append('noOfAdults', formData.noOfAdults);
            data.append('noOfChildren', formData.noOfChildren);
            data.append('noOfInfants', formData.noOfInfants);
            data.append('travelDetails', JSON.stringify(formData.travelDetails));
            data.append('passengers', JSON.stringify(formData.passengers));
            data.append('fees', JSON.stringify(formData.fees));
            data.append('isUrgent', isUrgent);

            // Attach files in the format React Native / Multer expects
            if (formData.documents.passportCopy) data.append('passportCopy', formData.documents.passportCopy);
            if (formData.documents.visaCopy) data.append('visaCopy', formData.documents.visaCopy);
            if (formData.documents.onwardTicket) data.append('onwardTicket', formData.documents.onwardTicket);
            if (formData.documents.returnTicket) data.append('returnTicket', formData.documents.returnTicket);

            const res = await otbService.apply(data);
            if (res.success) {
                setOrderId(res.razorpayOrder.id);
                setRazorpayKey(res.key);
                setShowGateway(true);
            }
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Application failed' });
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = async (paymentData) => {
        setShowGateway(false);
        setLoading(true);
        try {
            const res = await otbService.verifyPayment(paymentData);
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: `OTB Application Submitted! Receipt: ${res.receiptNumber}` });
                navigation.navigate('OTBStatus'); 
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Payment verification failed. Please contact support.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    
                    {/* Header */}
                    <View className="flex-row items-center mt-6 mb-8">
                        <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-lg border border-gray-100 mr-4">
                            <Ionicons name="document-text" size={24} color="#1D4171" />
                        </View>
                        <View>
                            <Text style={{ color: t.text }} className="text-2xl font-black">Apply OTB</Text>
                            <Text style={{ color: t.textMuted, letterSpacing: 1 }} className="text-[10px] font-black uppercase">Airline Clearance Submission</Text>
                        </View>
                    </View>

                    {/* Pricing Info Banner */}
                    <View className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6">
                        <View className="flex-row items-center mb-1">
                            <Ionicons name="time" size={14} color="#1D4171" className="mr-2" />
                            <Text className="text-[#1D4171] font-black text-[10px] uppercase">
                                Working Hours: 10:00 AM – 10:00 PM (Mon-Sat)
                            </Text>
                        </View>
                        <Text className="text-gray-500 text-[9px] font-medium leading-4">
                            ⚡ Sunday processing available for selected airlines in urgent cases only. GST 18% extra applicable on all rates.
                        </Text>
                    </View>

                    {/* Section: Airline & Pax Counts */}
                    <View style={{ backgroundColor: t.card, elevation: 8 }} className="p-7 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-6">
                        <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase ml-1 mb-3">Target Airline</Text>
                        <TouchableOpacity 
                            onPress={() => setShowAirlineModal(true)}
                            className="bg-gray-50 rounded-2xl flex-row items-center mb-5 px-4 py-4"
                        >
                            <Ionicons name="airplane" size={18} color="#1D4171" />
                            <Text className={`flex-1 ml-3 font-bold ${formData.airline ? 'text-gray-900' : 'text-gray-400'}`}>
                                {formData.airline || "Select Airline"}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                        </TouchableOpacity>

                        <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase ml-1 mb-3">Destination City</Text>
                        <TouchableOpacity 
                            onPress={() => setShowDestModal(true)}
                            className="bg-gray-50 rounded-2xl flex-row items-center mb-5 px-4 py-4"
                        >
                            <Ionicons name="location" size={18} color="#F07E21" />
                            <Text className={`flex-1 ml-3 font-bold ${formData.travelDetails.destination ? 'text-gray-900' : 'text-gray-400'}`}>
                                {formData.travelDetails.destination || "Select Destination"}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                        </TouchableOpacity>

                        <View className="flex-row justify-between">
                            <View className="w-[30%]">
                                <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase text-center mb-2">Adults</Text>
                                <TextInput keyboardType="numeric" className="bg-gray-50 p-3 rounded-xl text-center font-bold" value={formData.noOfAdults} onChangeText={v => setFormData(prev => ({...prev, noOfAdults: v}))} />
                            </View>
                            <View className="w-[30%]">
                                <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase text-center mb-2">Child</Text>
                                <TextInput keyboardType="numeric" className="bg-gray-50 p-3 rounded-xl text-center font-bold" value={formData.noOfChildren} onChangeText={v => setFormData(prev => ({...prev, noOfChildren: v}))} />
                            </View>
                            <View className="w-[30%]">
                                <Text style={{ color: t.textMuted }} className="text-[9px] font-black uppercase text-center mb-2">Infant</Text>
                                <TextInput keyboardType="numeric" className="bg-gray-50 p-3 rounded-xl text-center font-bold" value={formData.noOfInfants} onChangeText={v => setFormData(prev => ({...prev, noOfInfants: v}))} />
                            </View>
                        </View>

                        {/* Priority Toggle */}
                        <View className="mt-8 flex-row items-center justify-between bg-blue-50/50 p-4 rounded-2xl border border-blue-50">
                            <View className="flex-1 mr-4">
                                <View className="flex-row items-center mb-1">
                                    <Text className="text-[#1D4171] font-black text-sm uppercase">Urgent Processing</Text>
                                    <View className="bg-orange-500 px-2 py-0.5 rounded-full ml-2">
                                        <Text className="text-white text-[8px] font-black uppercase">15 Min</Text>
                                    </View>
                                </View>
                                <Text className="text-[9px] text-gray-500 font-bold leading-3">Clearance in 15 mins instead of 4 hours. Extra ₹300 per passenger applies.</Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => {
                                    setIsUrgent(!isUrgent);
                                    setFeeCalculated(false);
                                }}
                                className={`w-14 h-8 rounded-full p-1 ${isUrgent ? 'bg-orange-500' : 'bg-slate-200'}`}
                            >
                                <View className={`w-6 h-6 rounded-full bg-white shadow-sm ${isUrgent ? 'ml-6' : 'ml-0'}`} />
                            </TouchableOpacity>
                        </View>
                        
                        <TouchableOpacity onPress={handleCalculateFee} className="bg-[#1D4171] mt-6 py-5 rounded-2xl items-center border border-[#1D4171] border-b-[6px] border-b-[#11294a] shadow-xl shadow-blue-900/20 active:scale-95">
                            <Text className="text-white font-black uppercase text-xs tracking-widest">Calculate OTB Fare</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Section: Document Uploads */}
                    <View style={{ backgroundColor: t.card, elevation: 8 }} className="p-7 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-6">
                        <View className="flex-row items-center mb-6">
                            <View className="w-1 h-6 bg-blue-500 rounded-full mr-3" />
                            <Text style={{ color: t.text }} className="text-base font-black">Support Documents</Text>
                        </View>

                        {[
                            { label: 'Visa Copy', key: 'visaCopy', required: true },
                            { label: 'Onward Ticket', key: 'onwardTicket', required: true },
                            { label: 'Passport Copy', key: 'passportCopy', required: false },
                            { label: 'Return Ticket', key: 'returnTicket', required: false }
                        ].map((doc) => (
                            <TouchableOpacity 
                                key={doc.key} 
                                onPress={() => pickDocument(doc.key)}
                                className={`mb-4 p-4 rounded-2xl border-2 border-dashed flex-row items-center justify-between ${formData.documents[doc.key] ? 'border-green-400 bg-green-50/50' : 'border-slate-100 bg-slate-50/50'}`}
                            >
                                <View className="flex-row items-center">
                                    <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${formData.documents[doc.key] ? 'bg-green-100' : 'bg-slate-200'}`}>
                                        <Ionicons name={formData.documents[doc.key] ? "checkmark-circle" : "cloud-upload"} size={16} color={formData.documents[doc.key] ? "#10b981" : "#64748b"} />
                                    </View>
                                    <View>
                                        <Text className={`text-sm font-bold ${formData.documents[doc.key] ? 'text-green-700' : 'text-slate-600'}`}>{doc.label} {doc.required && <Text className="text-red-500">*</Text>}</Text>
                                        <Text className="text-[10px] text-slate-400 font-medium">{formData.documents[doc.key] ? formData.documents[doc.key].name : 'Click to Upload'}</Text>
                                    </View>
                                </View>
                                {formData.documents[doc.key] && <Ionicons name="checkmark" size={20} color="#10b981" />}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Section: Travel Info */}
                    <View style={{ backgroundColor: t.card, elevation: 8 }} className="p-7 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-6">
                         <View className="flex-row items-center mb-5">
                            <View className="w-1 h-6 bg-[#F07E21] rounded-full mr-3" />
                            <Text style={{ color: t.text }} className="text-base font-black">Travel Details</Text>
                        </View>
                        <TextInput placeholder="Travel Date (DD/MM/YYYY)" className="bg-gray-50 p-4 rounded-2xl font-bold mb-4" value={formData.travelDetails.dateOfTravel} onChangeText={v => setFormData(prev => ({...prev, travelDetails: {...prev.travelDetails, dateOfTravel: v}}))} />
                        <TextInput placeholder="Airline PNR" autoCapitalize="characters" className="bg-gray-50 p-4 rounded-2xl font-bold mb-4" value={formData.travelDetails.pnr} onChangeText={v => setFormData(prev => ({...prev, travelDetails: {...prev.travelDetails, pnr: v}}))} />
                        <TextInput placeholder="Contact Mobile" keyboardType="phone-pad" className="bg-gray-50 p-4 rounded-2xl font-bold mb-4" value={formData.travelDetails.contactNo} onChangeText={v => setFormData(prev => ({...prev, travelDetails: {...prev.travelDetails, contactNo: v}}))} />
                        <TextInput placeholder="Email Address" keyboardType="email-address" className="bg-gray-50 p-4 rounded-2xl font-bold" value={formData.travelDetails.email} onChangeText={v => setFormData(prev => ({...prev, travelDetails: {...prev.travelDetails, email: v.toLowerCase()}}))} />
                    </View>

                    {/* Section: Passengers */}
                    {formData.passengers.map((pax, idx) => (
                         <View key={idx} style={{ backgroundColor: t.card, elevation: 8 }} className="p-7 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-6">
                            <Text className="text-[10px] font-black text-primary-500 uppercase mb-4">Passenger {idx + 1} ({pax.paxType})</Text>
                            <View className="flex-row gap-2 mb-4">
                                <TextInput placeholder="Title" className="bg-gray-50 p-3 rounded-xl font-bold w-16 text-center" value={pax.title} onChangeText={v => {
                                    setFormData(prev => {
                                        const newPax = prev.passengers.map((p, i) => i === idx ? { ...p, title: v } : p);
                                        return { ...prev, passengers: newPax };
                                    });
                                }} />
                                <TextInput placeholder="First Name" className="bg-gray-50 p-3 rounded-xl font-bold flex-1 px-4" value={pax.firstName} onChangeText={v => {
                                    setFormData(prev => {
                                        const newPax = prev.passengers.map((p, i) => i === idx ? { ...p, firstName: v } : p);
                                        return { ...prev, passengers: newPax };
                                    });
                                }} />
                                <TextInput placeholder="Last Name" className="bg-gray-50 p-3 rounded-xl font-bold flex-1 px-4" value={pax.lastName} onChangeText={v => {
                                    setFormData(prev => {
                                        const newPax = prev.passengers.map((p, i) => i === idx ? { ...p, lastName: v } : p);
                                        return { ...prev, passengers: newPax };
                                    });
                                }} />
                            </View>
                        </View>
                    ))}

                    {/* Section: Fee Summary */}
                    {feeCalculated && (
                        <View style={{ backgroundColor: t.card, elevation: 8 }} className="p-7 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-10 overflow-hidden relative">
                            <LinearGradient colors={['#F07E21', '#FF9F50']} style={{ position: 'absolute', top: 0, right: 0, paddingHorizontal: 16, paddingVertical: 4, borderBottomLeftRadius: 20 }}>
                                <Text className="text-white font-black text-[8px] uppercase">Secure Payment Required</Text>
                            </LinearGradient>
                            <Text className="text-lg font-black text-gray-900 mb-6 mt-2">Fare Breakdown</Text>
                            <View className="space-y-3 mb-6">
                                <View className="flex-row justify-between mb-2">
                                    <Text className="text-gray-400 font-bold">Airline Fee ({parseInt(formData.noOfAdults) + parseInt(formData.noOfChildren) + parseInt(formData.noOfInfants)} Pax)</Text>
                                    <Text className="font-black">₹{formData.fees.airlineFee.toFixed(2)}</Text>
                                </View>
                                {formData.fees.surcharge > 0 && (
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-gray-400 font-bold text-[10px]">Regional Surcharge (+₹250)</Text>
                                        <Text className="font-black text-[#F07E21]">₹{formData.fees.surcharge.toFixed(2)}</Text>
                                    </View>
                                )}
                                {formData.fees.urgentSurcharge > 0 && (
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-gray-400 font-bold text-[10px]">Urgent Processing (+₹300)</Text>
                                        <Text className="font-black text-orange-600">₹{formData.fees.urgentSurcharge.toFixed(2)}</Text>
                                    </View>
                                )}
                                <View className="flex-row justify-between mb-2"><Text className="text-[#1D4171] font-bold">IGST (18%)</Text><Text className="font-black text-[#1D4171]">₹{formData.fees.igst.toFixed(2)}</Text></View>
                            </View>
                            <View className="h-[1px] bg-gray-100 w-full mb-6" />
                            <View className="flex-row justify-between items-center bg-gray-50 p-4 rounded-2xl">
                                <Text className="text-sm font-black text-gray-400 uppercase">Total Payable</Text>
                                <Text className="text-2xl font-black text-[#1D4171]">₹{formData.fees.totalFare.toFixed(2)}</Text>
                            </View>

                            <TouchableOpacity onPress={handleSubmit} disabled={loading} className="bg-[#1D4171] mt-8 py-5 rounded-2xl items-center border border-[#1D4171] border-b-[6px] border-b-[#11294a] shadow-xl shadow-blue-900/20 active:scale-95">
                                {loading ? <ActivityIndicator color="#fff" /> : (
                                    <Text style={{ letterSpacing: 2 }} className="text-white font-black text-sm uppercase">Pay & Submit</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                    <View className="h-10" />
                </ScrollView>
            </SafeAreaView>

            <RazorpayGatewayModal 
                visible={showGateway} 
                amount={formData.fees.totalFare}
                orderId={orderId}
                razorpayKey={razorpayKey}
                onPaymentSuccess={handlePaymentSuccess} 
                onCancel={() => setShowGateway(false)} 
            />

            {/* Airline Selector Modal */}
            <Modal visible={showAirlineModal} transparent animationType="slide">
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-[3rem] p-8 pb-12">
                        <Text className="text-xl font-black text-[#1D4171] mb-6 text-center uppercase">Select Airline</Text>
                        <ScrollView className="max-h-[350]">
                            {Object.keys(AIRLINE_GROUPS).map((air) => (
                                <TouchableOpacity 
                                    key={air}
                                    onPress={() => {
                                        setFormData(prev => ({...prev, airline: air}));
                                        setShowAirlineModal(false);
                                        setFeeCalculated(false);
                                    }}
                                    className="p-4 border-b border-gray-50 flex-row justify-between items-center"
                                >
                                    <Text className="font-bold text-gray-700">{air}</Text>
                                    <Text className="text-[10px] font-black text-[#F07E21] bg-orange-50 px-2 py-0.5 rounded">₹{AIRLINE_GROUPS[air].rate}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity onPress={() => setShowAirlineModal(false)} className="mt-6 p-4 items-center">
                            <Text className="text-gray-400 font-black text-xs">CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Destination Selector Modal */}
            <Modal visible={showDestModal} transparent animationType="slide">
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-[3rem] p-8 pb-12">
                        <Text className="text-xl font-black text-[#F07E21] mb-6 text-center uppercase">Select Destination</Text>
                        {Object.keys(DESTINATIONS).map((dest) => (
                            <TouchableOpacity 
                                key={dest}
                                onPress={() => {
                                    setFormData(prev => ({...prev, travelDetails: {...prev.travelDetails, destination: dest}}));
                                    setShowDestModal(false);
                                    setFeeCalculated(false);
                                }}
                                className="p-5 border-b border-gray-50 flex-row justify-between items-center"
                            >
                                <Text className="font-bold text-gray-700">{dest}</Text>
                                {DESTINATIONS[dest].surcharge > 0 && (
                                    <View className="bg-red-50 px-2 py-0.5 rounded">
                                        <Text className="text-[8px] font-black text-red-600">+₹{DESTINATIONS[dest].surcharge} PAX</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => setShowDestModal(false)} className="mt-6 p-4 items-center">
                            <Text className="text-gray-400 font-black text-xs">CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
