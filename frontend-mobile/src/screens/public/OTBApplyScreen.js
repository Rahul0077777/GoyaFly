import React, { useState, useEffect } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, 
    TextInput, ActivityIndicator, Image, Modal 
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { otbService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

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
    const [loading, setLoading] = useState(false);
    const [feeCalculated, setFeeCalculated] = useState(false);
    const [airlineGroups, setAirlineGroups] = useState([]);
    const [isUrgent, setIsUrgent] = useState(false);

    const [formData, setFormData] = useState({
        airline: '',
        noOfAdults: '1',
        noOfChildren: '0',
        noOfInfants: '0',
        travelDetails: {
            destination: 'Dubai',
            dateOfTravel: '',
            pnr: '',
            contactNo: '',
            email: ''
        },
        passengers: [{ paxType: 'Adult', title: 'Mr', gender: 'Male', firstName: '', lastName: '' }],
        documents: {
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

    const [showAirlineModal, setShowAirlineModal] = useState(false);
    const [showDestModal, setShowDestModal] = useState(false);

    // Fetch dynamic pricing from backend
    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const res = await otbService.getPricing();
                if (res.success) {
                    setAirlineGroups(res.data);
                }
            } catch (err) {
                console.error("Failed to load airline pricing on mobile", err);
            }
        };
        fetchPricing();
    }, []);

    // Sync passengers list based on count selections
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
                newPassengers.push({ paxType: type, title: 'Mr', gender: 'Male', firstName: '', lastName: '' });
            }
        } else if (newPassengers.length > totalPax) {
            newPassengers.splice(totalPax);
        }
        setFormData(prev => ({ ...prev, passengers: newPassengers }));
    }, [formData.noOfAdults, formData.noOfChildren, formData.noOfInfants]);

    // Automatically recalculate fees
    useEffect(() => {
        const adults = parseInt(formData.noOfAdults) || 0;
        const children = parseInt(formData.noOfChildren) || 0;
        const infants = parseInt(formData.noOfInfants) || 0;
        const totalPax = adults + children + infants;

        if (!formData.airline) {
            setFormData(prev => ({
                ...prev,
                fees: { airlineFee: 0, surcharge: 0, urgentSurcharge: 0, otbFee: 0, handlingFee: 0, igst: 0, totalFare: 0 }
            }));
            setFeeCalculated(false);
            return;
        }

        const airlineData = airlineGroups.find(a => a.airline === formData.airline);
        const destData = DESTINATIONS[formData.travelDetails.destination] || { surcharge: 0 };

        if (!airlineData) return;

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
    }, [formData.airline, formData.travelDetails.destination, formData.noOfAdults, formData.noOfChildren, formData.noOfInfants, isUrgent, airlineGroups]);

    const handleClear = () => {
        setFormData(prev => ({
            ...prev,
            airline: '',
            noOfAdults: '1',
            noOfChildren: '0',
            noOfInfants: '0',
            travelDetails: {
                destination: 'Dubai',
                dateOfTravel: '',
                pnr: '',
                contactNo: '',
                email: ''
            },
            passengers: [{ paxType: 'Adult', title: 'Mr', gender: 'Male', firstName: '', lastName: '' }],
            documents: {
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
        }));
        setIsUrgent(false);
        setFeeCalculated(false);
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

    const handlePassengerChange = (index, field, value) => {
        const updatedPassengers = [...formData.passengers];
        updatedPassengers[index][field] = value;
        setFormData(prev => ({ ...prev, passengers: updatedPassengers }));
    };

    const handleTravelDetailChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            travelDetails: {
                ...prev.travelDetails,
                [field]: value
            }
        }));
    };

    const handleSubmit = async () => {
        if (!feeCalculated) {
            Toast.show({ type: 'info', text1: 'Fee Required', text2: 'Please configure pricing options first.' });
            return;
        }

        if (!formData.airline || !formData.travelDetails.pnr) {
            Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please fill in Airline and PNR.' });
            return;
        }

        if (!formData.documents.visaCopy || !formData.documents.onwardTicket) {
            Toast.show({ type: 'error', text1: 'Missing Documents', text2: 'Visa Copy and Onward Ticket are mandatory.' });
            return;
        }

        for (let i = 0; i < formData.passengers.length; i++) {
            const pax = formData.passengers[i];
            if (!pax.firstName.trim() || !pax.lastName.trim()) {
                Toast.show({ type: 'error', text1: 'Missing Passenger Info', text2: `Please fill names for Passenger ${i + 1}.` });
                return;
            }
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('airline', formData.airline);
            data.append('noOfAdults', formData.noOfAdults);
            data.append('noOfChildren', formData.noOfChildren);
            data.append('noOfInfants', formData.noOfInfants);
            data.append('travelDetails', JSON.stringify(formData.travelDetails));
            data.append('passengers', JSON.stringify(formData.passengers));
            data.append('fees', JSON.stringify(formData.fees));
            data.append('isUrgent', isUrgent);

            // React Native format for file attachments
            if (formData.documents.visaCopy) {
                data.append('visaCopy', {
                    uri: formData.documents.visaCopy.uri,
                    name: formData.documents.visaCopy.name,
                    type: formData.documents.visaCopy.type
                });
            }
            if (formData.documents.onwardTicket) {
                data.append('onwardTicket', {
                    uri: formData.documents.onwardTicket.uri,
                    name: formData.documents.onwardTicket.name,
                    type: formData.documents.onwardTicket.type
                });
            }
            if (formData.documents.returnTicket) {
                data.append('returnTicket', {
                    uri: formData.documents.returnTicket.uri,
                    name: formData.documents.returnTicket.name,
                    type: formData.documents.returnTicket.type
                });
            }

            const res = await otbService.apply(data);
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Submitted', text2: res.message || 'Application submitted successfully! Paid via wallet.' });
                navigation.navigate('MainApp');
            }
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Application failed. Low wallet balance.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F4F7FE' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-5 py-4 flex-row items-center bg-white border-b border-slate-100 shadow-sm">
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 shadow-sm mr-4 active:scale-95"
                    >
                        <Ionicons name="chevron-back" size={22} color="#1A56DB" />
                    </TouchableOpacity>
                    <View className="flex-row items-center gap-3">
                        <View className="bg-blue-50 p-2.5 rounded-2xl shadow-sm">
                            <Ionicons name="document-text" size={20} color="#1A56DB" />
                        </View>
                        <View>
                            <Text className="text-lg font-black text-slate-900">Apply OTB</Text>
                            <Text className="text-slate-400 font-bold uppercase text-[8px] tracking-widest mt-0.5">Airline Clearance Submission</Text>
                        </View>
                    </View>
                </View>

                <ScrollView className="flex-1 px-4 mt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    
                    {/* Working Hours Info Box */}
                    <View className="bg-blue-50 border border-blue-100 p-4 rounded-[1.5rem] mb-6 flex-row items-start gap-3">
                        <View className="bg-white/80 p-2 rounded-xl">
                            <Text className="text-base">⚡</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-[#1A56DB] font-black text-[10px] uppercase tracking-wider mb-0.5">
                                Mon-Sat: 10AM-10PM • Sunday Emergency Active
                            </Text>
                            <Text className="text-slate-500 text-[9px] font-medium leading-4">
                                Dynamic pricing automatically matches rates per destination (Oman, Qatar surcharge ₹250 applies).
                            </Text>
                        </View>
                    </View>

                    {/* Section: OTB Setup Form Card */}
                    <View className="bg-white p-6 rounded-[2rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-xl mb-6 relative overflow-hidden">
                        <Text className="text-slate-400 text-[9px] font-black uppercase ml-1 mb-2 tracking-widest">Destination</Text>
                        <TouchableOpacity 
                            onPress={() => setShowDestModal(true)}
                            className="bg-slate-50 rounded-2xl flex-row items-center mb-5 px-4 py-4 border border-slate-100 shadow-inner"
                        >
                            <Ionicons name="location" size={18} color="#FF9F43" />
                            <Text className={`flex-1 ml-3 font-bold ${formData.travelDetails.destination ? 'text-slate-800' : 'text-slate-400'}`}>
                                {formData.travelDetails.destination || "Select Destination"}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                        </TouchableOpacity>

                        <Text className="text-slate-400 text-[9px] font-black uppercase ml-1 mb-2 tracking-widest">OTB Airline</Text>
                        <TouchableOpacity 
                            onPress={() => setShowAirlineModal(true)}
                            className="bg-slate-50 rounded-2xl flex-row items-center mb-5 px-4 py-4 border border-slate-100 shadow-inner"
                        >
                            <Ionicons name="airplane" size={18} color="#1A56DB" />
                            <Text className={`flex-1 ml-3 font-bold ${formData.airline ? 'text-slate-800' : 'text-slate-400'}`}>
                                {formData.airline || "Select Airline"}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                        </TouchableOpacity>

                        {/* Counts grid */}
                        <View className="flex-row justify-between mb-6">
                            <View className="w-[30%]">
                                <Text className="text-slate-400 text-[8px] font-black uppercase text-center mb-2 tracking-widest">Adults</Text>
                                <TextInput keyboardType="numeric" className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center font-bold text-slate-800" value={formData.noOfAdults} onChangeText={v => setFormData(prev => ({...prev, noOfAdults: v}))} />
                            </View>
                            <View className="w-[30%]">
                                <Text className="text-slate-400 text-[8px] font-black uppercase text-center mb-2 tracking-widest">Child</Text>
                                <TextInput keyboardType="numeric" className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center font-bold text-slate-800" value={formData.noOfChildren} onChangeText={v => setFormData(prev => ({...prev, noOfChildren: v}))} />
                            </View>
                            <View className="w-[30%]">
                                <Text className="text-slate-400 text-[8px] font-black uppercase text-center mb-2 tracking-widest">Infant</Text>
                                <TextInput keyboardType="numeric" className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center font-bold text-slate-800" value={formData.noOfInfants} onChangeText={v => setFormData(prev => ({...prev, noOfInfants: v}))} />
                            </View>
                        </View>

                        {/* Urgent Processing Toggle */}
                        <View className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex-row items-center justify-between">
                            <View className="flex-1 mr-4">
                                <Text className="text-[#FF9F43] font-black text-xs uppercase mb-1">Urgent Processing (+₹300)</Text>
                                <Text className="text-[9px] text-orange-600 font-bold leading-3">Clearance in 15 mins instead of 4 hours. Applies per passenger.</Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => setIsUrgent(!isUrgent)}
                                className={`w-12 h-7 rounded-full p-0.5 justify-center ${isUrgent ? 'bg-[#FF9F43]' : 'bg-slate-200'}`}
                            >
                                <View className={`w-5 h-5 rounded-full bg-white shadow-sm ${isUrgent ? 'self-end' : 'self-start'}`} />
                            </TouchableOpacity>
                        </View>

                        {/* Reset button */}
                        <TouchableOpacity onPress={handleClear} className="mt-6 py-3 rounded-xl border border-slate-200 bg-slate-50 items-center justify-center active:scale-95">
                            <Text className="text-slate-500 font-black text-[10px] tracking-widest uppercase">Reset Form</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Section: Support Document Uploads */}
                    <View className="bg-white p-6 rounded-[2rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-xl mb-6">
                        <View className="flex-row items-center mb-5">
                            <View className="w-1.5 h-6 bg-[#1A56DB] rounded-full mr-3" />
                            <Text className="text-base font-black text-slate-900">Document Upload</Text>
                        </View>

                        {[
                            { label: 'Visa Copy', key: 'visaCopy', required: true },
                            { label: 'Onward Ticket Copy', key: 'onwardTicket', required: true },
                            { label: 'Return Ticket Copy', key: 'returnTicket', required: false }
                        ].map((doc) => (
                            <TouchableOpacity 
                                key={doc.key} 
                                onPress={() => pickDocument(doc.key)}
                                className={`mb-4 p-4 rounded-2xl border-2 border-dashed flex-row items-center justify-between ${formData.documents[doc.key] ? 'border-green-400 bg-green-50/50' : 'border-slate-200 bg-slate-50/50'}`}
                            >
                                <View className="flex-row items-center flex-1 pr-2">
                                    <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${formData.documents[doc.key] ? 'bg-green-100' : 'bg-slate-100'}`}>
                                        <Ionicons name={formData.documents[doc.key] ? "checkmark-circle" : "cloud-upload"} size={16} color={formData.documents[doc.key] ? "#10b981" : "#64748b"} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className={`text-xs font-bold ${formData.documents[doc.key] ? 'text-green-700' : 'text-slate-600'}`}>{doc.label} {doc.required && <Text className="text-red-500">*</Text>}</Text>
                                        <Text className="text-[9px] text-slate-400 font-bold truncate">{formData.documents[doc.key] ? formData.documents[doc.key].name : 'Click to Upload'}</Text>
                                    </View>
                                </View>
                                {formData.documents[doc.key] && <Ionicons name="checkmark" size={18} color="#10b981" />}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Section: Travel Details */}
                    <View className="bg-white p-6 rounded-[2rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-xl mb-6">
                        <View className="flex-row items-center mb-5">
                            <View className="w-1.5 h-6 bg-[#FF9F43] rounded-full mr-3" />
                            <Text className="text-base font-black text-slate-900">Travel Details</Text>
                        </View>
                        
                        <Text className="text-slate-500 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">Date of Travel *</Text>
                        <TextInput placeholder="YYYY-MM-DD" className="bg-white border border-slate-200 p-4 rounded-2xl font-bold mb-4 text-slate-800 text-sm" value={formData.travelDetails.dateOfTravel} onChangeText={v => handleTravelDetailChange('dateOfTravel', v)} />

                        <Text className="text-slate-500 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">Airline PNR *</Text>
                        <TextInput placeholder="Enter PNR" autoCapitalize="characters" className="bg-white border border-slate-200 p-4 rounded-2xl font-bold mb-4 text-slate-800 text-sm" value={formData.travelDetails.pnr} onChangeText={v => handleTravelDetailChange('pnr', v)} />

                        <Text className="text-slate-500 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">Contact No *</Text>
                        <TextInput placeholder="Contact Mobile" keyboardType="phone-pad" className="bg-white border border-slate-200 p-4 rounded-2xl font-bold mb-4 text-slate-800 text-sm" value={formData.travelDetails.contactNo} onChangeText={v => handleTravelDetailChange('contactNo', v)} />

                        <Text className="text-slate-500 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">Email ID *</Text>
                        <TextInput placeholder="Email Address" keyboardType="email-address" autoCapitalize="none" className="bg-white border border-slate-200 p-4 rounded-2xl font-bold text-slate-800 text-sm" value={formData.travelDetails.email} onChangeText={v => handleTravelDetailChange('email', v.toLowerCase())} />
                    </View>

                    {/* Section: Passengers */}
                    {formData.passengers.map((pax, idx) => (
                        <View key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-xl mb-6 relative overflow-hidden">
                            <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1A56DB]" />
                            <Text className="text-[10px] font-black text-[#1A56DB] uppercase mb-4 tracking-widest">Passenger {idx + 1} ({pax.paxType})</Text>
                            
                            <Text className="text-slate-500 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">Title</Text>
                            <TextInput placeholder="Mr, Ms, etc." className="bg-white border border-slate-200 p-3 rounded-xl font-bold text-slate-800 mb-4 text-sm" value={pax.title} onChangeText={v => handlePassengerChange(idx, 'title', v)} />

                            <Text className="text-slate-500 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">First Name *</Text>
                            <TextInput placeholder="Given name" className="bg-white border border-slate-200 p-3 rounded-xl font-bold text-slate-800 mb-4 text-sm" value={pax.firstName} onChangeText={v => handlePassengerChange(idx, 'firstName', v)} />

                            <Text className="text-slate-500 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">Last Name *</Text>
                            <TextInput placeholder="Surname" className="bg-white border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-sm" value={pax.lastName} onChangeText={v => handlePassengerChange(idx, 'lastName', v)} />
                        </View>
                    ))}

                    {/* Section: Fare details & Wallet Payment */}
                    {feeCalculated && (
                        <View className="bg-white rounded-[2rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-xl overflow-hidden mb-10">
                            
                            {/* Fare breakdown side */}
                            <View className="p-6">
                                <Text className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 mb-4 uppercase tracking-wider">Fare Details</Text>
                                <View className="space-y-3">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-xs font-bold text-slate-500">Airline Fee</Text>
                                        <Text className="text-xs font-black text-slate-800">₹{formData.fees.airlineFee.toLocaleString('en-IN')}</Text>
                                    </View>
                                    {formData.fees.surcharge > 0 && (
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-xs font-bold text-[#FF9F43]">Regional Surcharge</Text>
                                            <Text className="text-xs font-black text-[#FF9F43]">₹{formData.fees.surcharge.toLocaleString('en-IN')}</Text>
                                        </View>
                                    )}
                                    {formData.fees.urgentSurcharge > 0 && (
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-xs font-bold text-red-500">Urgent Surcharge</Text>
                                            <Text className="text-xs font-black text-red-500">₹{formData.fees.urgentSurcharge.toLocaleString('en-IN')}</Text>
                                        </View>
                                    )}
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-xs font-bold text-slate-500">IGST (18%)</Text>
                                        <Text className="text-xs font-black text-slate-800">₹{formData.fees.igst.toLocaleString('en-IN')}</Text>
                                    </View>
                                </View>
                                <View className="bg-[#1A56DB] p-4 rounded-xl flex-row justify-between items-center mt-6">
                                    <Text className="text-white text-xs font-black uppercase tracking-wider">Total Fare</Text>
                                    <Text className="text-white text-lg font-black">₹{formData.fees.totalFare.toLocaleString('en-IN')}</Text>
                                </View>
                            </View>

                            {/* Wallet Authorization Side */}
                            <View className="bg-slate-50 p-6 border-t border-slate-100">
                                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Payment Method</Text>
                                
                                <View className="bg-white p-4 rounded-2xl border border-slate-100 flex-row items-center gap-3.5 mb-6">
                                    <Text className="text-xl">💳</Text>
                                    <View className="flex-1">
                                        <Text className="text-[#0B1A42] text-[10px] font-black uppercase tracking-wider">Agency Wallet</Text>
                                        <Text className="text-slate-400 text-[8px] font-bold leading-3">Funds will be deducted directly from credits upon submission.</Text>
                                    </View>
                                </View>

                                <TouchableOpacity 
                                    onPress={handleSubmit} 
                                    disabled={loading}
                                    className="bg-[#0B3A5A] py-5 rounded-2xl items-center border border-b-[6px] border-[#071d2d] active:scale-95 shadow-md shadow-blue-900/10"
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : (
                                        <Text className="text-white font-black text-xs uppercase tracking-widest">
                                            PAY & SUBMIT VIA WALLET
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                        </View>
                    )}

                </ScrollView>
            </SafeAreaView>

            {/* Airline Picker Modal */}
            <Modal visible={showAirlineModal} transparent animationType="slide">
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-[3rem] p-8 pb-12">
                        <Text className="text-lg font-black text-[#1A56DB] mb-6 text-center uppercase tracking-wider">Select Airline</Text>
                        <ScrollView className="max-h-[350]">
                            {airlineGroups.map((air) => (
                                <TouchableOpacity 
                                    key={air._id}
                                    onPress={() => {
                                        setFormData(prev => ({...prev, airline: air.airline}));
                                        setShowAirlineModal(false);
                                    }}
                                    className="p-4 border-b border-slate-100 flex-row justify-between items-center"
                                >
                                    <Text className="font-bold text-slate-800">{air.airline}</Text>
                                    <Text className="text-[10px] font-black text-[#FF9F43] bg-orange-50 px-2 py-0.5 rounded">₹{air.rate}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity onPress={() => setShowAirlineModal(false)} className="mt-6 p-4 items-center">
                            <Text className="text-slate-400 font-black text-xs tracking-widest">CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Destination Picker Modal */}
            <Modal visible={showDestModal} transparent animationType="slide">
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-[3rem] p-8 pb-12">
                        <Text className="text-lg font-black text-[#FF9F43] mb-6 text-center uppercase tracking-wider">Select Destination</Text>
                        {Object.keys(DESTINATIONS).map((dest) => (
                            <TouchableOpacity 
                                key={dest}
                                onPress={() => {
                                    setFormData(prev => ({...prev, travelDetails: {...prev.travelDetails, destination: dest}}));
                                    setShowDestModal(false);
                                }}
                                className="p-5 border-b border-slate-100 flex-row justify-between items-center"
                            >
                                <Text className="font-bold text-slate-800">{dest}</Text>
                                {DESTINATIONS[dest].surcharge > 0 && (
                                    <View className="bg-red-50 px-2 py-0.5 rounded">
                                        <Text className="text-[8px] font-black text-red-600">+₹{DESTINATIONS[dest].surcharge} PAX</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => setShowDestModal(false)} className="mt-6 p-4 items-center">
                            <Text className="text-slate-400 font-black text-xs tracking-widest">CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
