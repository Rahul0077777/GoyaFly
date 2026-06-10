import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, TextInput,
    ActivityIndicator, Modal
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { bookingService, agentService, walletService } from '../../services/api';
import GoyaflyLoader from '../../components/GoyaflyLoader';
import { useThemeColors } from '../../utils/themeColors';
import { Ionicons } from '@expo/vector-icons';

// Step Indicator (3-step wizard: Travellers → Add-ons → Review)
const StepIndicator = ({ step }) => (
    <View className="flex-row items-center justify-center mb-6 px-6">
        {[
            { num: 1, label: 'Travellers' },
            { num: 2, label: 'Add-ons' },
            { num: 3, label: 'Review' }
        ].map((s, idx) => (
            <View key={s.num} className="flex-row items-center flex-1 justify-center">
                <View className="items-center">
                    <View className={`w-10 h-10 rounded-2xl items-center justify-center border ${step >= s.num ? 'bg-[#F07E21] border-[#F07E21] border-b-4 border-[#D96B18] shadow-sm' : 'bg-white border-slate-100 border-b-4 border-slate-200 shadow-sm'}`}>
                        <Text className={`font-black text-xs ${step >= s.num ? 'text-white' : 'text-slate-400'}`}>{s.num}</Text>
                    </View>
                    <Text className={`text-[9px] mt-1.5 font-black uppercase tracking-wider ${step >= s.num ? 'text-[#F07E21]' : 'text-slate-400'}`}>
                        {s.label}
                    </Text>
                </View>
                {s.num < 3 && (
                    <View className={`h-1.5 flex-1 mx-2 mb-4 rounded-full ${step > s.num ? 'bg-[#F07E21]' : 'bg-slate-200'}`} />
                )}
            </View>
        ))}
    </View>
);

const SectionHeader = ({ title, accent = '#F07E21' }) => (
    <View className="flex-row items-center mb-5 mt-2">
        <View style={{ backgroundColor: accent }} className="w-1.5 h-6 rounded-full mr-3 shadow-sm" />
        <Text className="text-lg font-black text-slate-900 tracking-wide">{title}</Text>
    </View>
);

const Field = ({ label, value, onChangeText, keyboardType, placeholder, autoCapitalize }) => (
    <View className="mb-4">
        <Text className="text-slate-400 text-[10px] font-black uppercase ml-1 mb-1.5 tracking-widest">
            {label}
        </Text>
        <TextInput
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            placeholder={placeholder}
            className="bg-slate-50 rounded-2xl px-5 py-4 font-black text-slate-900 text-sm border border-slate-100 shadow-inner"
            placeholderTextColor="#9ca3af"
        />
    </View>
);

// FTD Date Format: YYYY-MM-DD -> DD-MM-YYYY
const formatDateFTD = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('-') && dateStr.indexOf('-') === 4) {
        const [y, m, d] = dateStr.split('-');
        return `${d}-${m}-${y}`;
    }
    return dateStr;
};

const TITLE_OPTIONS = {
    ADT: ['Mr', 'Mrs', 'Ms'],
    CHD: ['Mstr', 'Miss'],
    INF: ['Mstr', 'Miss'],
};

const PTYPE_MAP = { ADT: 'A', CHD: 'C', INF: 'I', A: 'A', C: 'C', I: 'I' };

const DobPicker = ({ value, onChange }) => {
    const parts = (value || '').split('-');
    const year  = parts[0] || '';
    const month = parts[1] || '';
    const day   = parts[2] || '';

    const update = (y, m, d) => {
        const padded = `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        onChange(padded);
    };

    return (
        <View className="flex-row gap-2">
            <View className="flex-1">
                <Text className="text-slate-400 text-[10px] font-black uppercase ml-1 mb-1.5 tracking-widest">DD</Text>
                <TextInput
                    value={day}
                    onChangeText={v => update(year, month, v.replace(/\D/g, '').slice(0, 2))}
                    keyboardType="number-pad"
                    placeholder="DD"
                    maxLength={2}
                    className="bg-slate-50 rounded-2xl px-4 py-4 font-black text-slate-900 text-center border border-slate-100 shadow-inner"
                    placeholderTextColor="#9ca3af"
                />
            </View>
            <View className="flex-1">
                <Text className="text-slate-400 text-[10px] font-black uppercase ml-1 mb-1.5 tracking-widest">MM</Text>
                <TextInput
                    value={month}
                    onChangeText={v => update(year, v.replace(/\D/g, '').slice(0, 2), day)}
                    keyboardType="number-pad"
                    placeholder="MM"
                    maxLength={2}
                    className="bg-slate-50 rounded-2xl px-4 py-4 font-black text-slate-900 text-center border border-slate-100 shadow-inner"
                    placeholderTextColor="#9ca3af"
                />
            </View>
            <View className="flex-1">
                <Text className="text-slate-400 text-[10px] font-black uppercase ml-1 mb-1.5 tracking-widest">YYYY</Text>
                <TextInput
                    value={year}
                    onChangeText={v => update(v.replace(/\D/g, '').slice(0, 4), month, day)}
                    keyboardType="number-pad"
                    placeholder="YYYY"
                    maxLength={4}
                    className="bg-slate-50 rounded-2xl px-4 py-4 font-black text-slate-900 text-center border border-slate-100 shadow-inner"
                    placeholderTextColor="#9ca3af"
                />
            </View>
        </View>
    );
};

export default function CheckoutDomesticScreen({ navigation, routeParams }) {
    const t = useThemeColors();
    const { bookingData, paxBreakdown } = routeParams || {};

    const [step, setStep]     = useState(1);
    const [mobile, setMobile] = useState('');
    const [email, setEmail]   = useState('');

    const [passengersList, setPassengersList] = useState(() => {
        const list = [];
        for (let i = 0; i < (paxBreakdown?.adt || 1); i++)
            list.push({ type: 'ADT', pType: 'A', title: 'Mr',   firstName: '', lastName: '', dob: '1990-01-01' });
        for (let i = 0; i < (paxBreakdown?.chd || 0); i++)
            list.push({ type: 'CHD', pType: 'C', title: 'Mstr', firstName: '', lastName: '', dob: '2015-06-01' });
        for (let i = 0; i < (paxBreakdown?.inf || 0); i++)
            list.push({ type: 'INF', pType: 'I', title: 'Miss', firstName: '', lastName: '', dob: '2024-01-01' });
        return list;
    });

    const updatePax = (idx, field, val) => {
        const l = [...passengersList];
        l[idx] = { ...l[idx], [field]: val };
        setPassengersList(l);
    };

    const [isBooking, setIsBooking]       = useState(false);
    const [agentBalance, setAgentBalance] = useState(0);
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [agreed, setAgreed]             = useState(false);

    // GST
    const [showGst, setShowGst] = useState(false);
    const [gst, setGst]         = useState({ number: '', company: '', email: '', mobile: '', address: '' });
    const [pan, setPan]         = useState('');

    // SSR (Step 2)
    const [loadingSSR, setLoadingSSR]     = useState(false);
    const [seatMap, setSeatMap]           = useState(null);
    const [selectedSeats, setSelectedSeats] = useState({});
    const [selectedMeals, setSelectedMeals] = useState({});
    const [selectedBaggage, setSelectedBaggage] = useState({});
    const [showSeatMapModal, setShowSeatMapModal] = useState(false);
    const [activePaxIdxForSeat, setActivePaxIdxForSeat] = useState(0);
    const [mealPickerVisible, setMealPickerVisible] = useState(false);
    const [baggagePickerVisible, setBaggagePickerVisible] = useState(false);
    const [activePaxIdxForSSR, setActivePaxIdxForSSR] = useState(0);

    const validationFlags = bookingData?.details?.validationFlags || {};
    const finalPrice   = bookingData?.markupPrice || bookingData?.baseFare || 0;
    const netfare      = bookingData?.baseFare    || bookingData?.details?.netfare || 0;

    const availableMeals = bookingData?.details?.ssrInfo?.Meal || 
                           bookingData?.details?.ssrInfo?.Onward?.Meal || 
                           bookingData?.details?.ssrInfo?.onward?.Meal || [];
    const availableBaggage = bookingData?.details?.ssrInfo?.Baggage || 
                             bookingData?.details?.ssrInfo?.Bagg || 
                             bookingData?.details?.ssrInfo?.Onward?.Baggage || 
                             bookingData?.details?.ssrInfo?.Onward?.Bagg || 
                             bookingData?.details?.ssrInfo?.onward?.Baggage || 
                             bookingData?.details?.ssrInfo?.onward?.Bagg || [];

    const mealOptions = [
        { label: 'No Preference (Free)', value: '' },
        ...availableMeals.map(m => ({
            label: `${m.desc || m.mealDesc || m.code} (+₹${m.amount || m.mealAmt || 0})`,
            value: m.code || m.mealID
        }))
    ];

    const baggageOptions = [
        { label: 'No Extra Baggage', value: '' },
        ...availableBaggage.map(b => ({
            label: `${b.desc || b.baggDesc || b.code} (+₹${b.amount || b.baggAmt || 0})`,
            value: b.code || b.baggID
        }))
    ];

    const normalizeSeats = (data) => {
        if (!data) return [];
        let seatsArray = [];
        if (Array.isArray(data)) seatsArray = data;
        else if (data.FlightSeat?.Onward?.[0]?.SeatMap) seatsArray = data.FlightSeat.Onward[0].SeatMap;
        else if (data.FlightSeat?.Onward?.[0]?.seatMap) seatsArray = data.FlightSeat.Onward[0].seatMap;
        else if (data.seats && Array.isArray(data.seats)) seatsArray = data.seats;
        else if (data.Seats && Array.isArray(data.Seats)) seatsArray = data.Seats;
        
        return seatsArray.map(s => {
            if (typeof s === 'string') return { code: s, amount: 0, status: 'available' };
            const code = s.code || s.seatNo || s.seatID || s.seatName;
            return {
                ...s,
                code,
                seatNo: code,
                amount: parseFloat(s.amount || s.seatAmount || s.seatAmt || 0),
                status: (s.status === 'unavailable' || s.isBooked === true || s.isBooked === 'true' || s.isBooked === '1' || s.seatAvailable === false) ? 'unavailable' : 'available'
            };
        });
    };

    const seatsListNormalized = normalizeSeats(seatMap);

    const seatCost = Object.values(selectedSeats).reduce((sum, seatCode) => {
        if (!seatCode) return sum;
        const seatObj = seatsListNormalized.find(s => s.code === seatCode);
        return sum + (seatObj?.amount || 0);
    }, 0);

    const mealCost = Object.values(selectedMeals).reduce((sum, mealCode) => {
        if (!mealCode) return sum;
        const mealObj = availableMeals.find(m => (m.code || m.mealID) === mealCode);
        return sum + parseFloat(mealObj?.amount || mealObj?.mealAmt || 0);
    }, 0);

    const baggageCost = Object.values(selectedBaggage).reduce((sum, bagCode) => {
        if (!bagCode) return sum;
        const bagObj = availableBaggage.find(b => (b.code || b.baggID) === bagCode);
        return sum + parseFloat(bagObj?.amount || bagObj?.baggAmt || 0);
    }, 0);

    const totalSsrCost = seatCost + mealCost + baggageCost;
    const requiredBalance = finalPrice + totalSsrCost;

    useEffect(() => {
        (async () => {
            try {
                const res = await walletService.getBalance();
                if (res.success) { setAgentBalance(res.balance); return; }
            } catch {}
            try {
                const r = await agentService.getDashboardStats();
                if (r.success) setAgentBalance(r.data.walletBalance || 0);
            } catch {}
            finally { setLoadingBalance(false); }
        })();
    }, []);

    const handleSeatSelect = (seat, paxIdx) => {
        setSelectedSeats(prev => {
            const newSeats = { ...prev };
            for (const key in newSeats) {
                if (newSeats[key] === seat.code) delete newSeats[key];
            }
            newSeats[paxIdx] = seat.code;
            return newSeats;
        });
    };

    const handleProceedToAddons = async () => {
        if (!mobile || !email)
            return Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter mobile number and email address.' });
        if (mobile.length < 10)
            return Toast.show({ type: 'error', text1: 'Invalid', text2: 'Please enter a valid 10-digit mobile number.' });
        if (!email.includes('@'))
            return Toast.show({ type: 'error', text1: 'Invalid', text2: 'Please enter a valid email address.' });

        for (let i = 0; i < passengersList.length; i++) {
            const p = passengersList[i];
            if (!p.firstName.trim() || !p.lastName.trim())
                return Toast.show({ type: 'error', text1: 'Required', text2: `Please enter name for Passenger ${i + 1}.` });

            if (p.type !== 'ADT' && (!p.dob || p.dob.split('-').some(x => x === '' || x === '0000' || x === '00')))
                return Toast.show({ type: 'error', text1: 'Required', text2: `Please enter a valid date of birth for Passenger ${i + 1}.` });

            if (p.type !== 'ADT') {
                const birthDate = new Date(p.dob);
                const travelDate = new Date(bookingData?.details?.date || new Date());
                let age = travelDate.getFullYear() - birthDate.getFullYear();
                const m = travelDate.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && travelDate.getDate() < birthDate.getDate())) age--;

                if (p.type === 'CHD' && (age < 2 || age > 12))
                    return Toast.show({ type: 'error', text1: 'Invalid Age', text2: `Passenger ${i + 1} is listed as Child but age is ${age}. (Required: 2-12 years)` });
                if (p.type === 'INF' && age >= 2)
                    return Toast.show({ type: 'error', text1: 'Invalid Age', text2: `Passenger ${i + 1} is listed as Infant but age is ${age}. (Required: < 2 years)` });
            }

            if (p.type === 'CHD' && !['Mstr', 'Miss'].includes(p.title))
                return Toast.show({ type: 'error', text1: 'Invalid Title', text2: `Child passenger ${i + 1} must have title Mstr or Miss.` });
            if (p.type === 'INF' && !['Mstr', 'Miss'].includes(p.title))
                return Toast.show({ type: 'error', text1: 'Invalid Title', text2: `Infant passenger ${i + 1} must have title Mstr or Miss.` });
        }

        if ((validationFlags.pan_mandatory === 1 || validationFlags.isPanMandatory === 1) && !pan)
            return Toast.show({ type: 'error', text1: 'PAN Required', text2: 'PAN number is mandatory for this fare.' });

        setStep(2);
        setLoadingSSR(true);
        try {
            const res = await bookingService.ftdGetSeats(
                bookingData.details?.flightID,
                bookingData.details?.refID,
                passengersList.map(p => ({
                    title: p.title,
                    fName: p.firstName || 'PAXNAME',
                    lName: p.lastName  || 'BOOKING',
                    pType: PTYPE_MAP[p.type] || 'A',
                }))
            );
            if (res.success) setSeatMap(res.data);
        } catch (err) {
            console.warn('SSR seat fetch error', err?.message);
        } finally { setLoadingSSR(false); }
    };

    const handleBook = async () => {
        if (!agreed) return Toast.show({ type: 'info', text1: 'Required', text2: 'Please accept the price rules to continue.' });

        if (!loadingBalance && agentBalance < requiredBalance) {
            return Toast.show({
                type: 'error',
                text1: 'Insufficient Balance',
                text2: `You need ₹${requiredBalance.toLocaleString()} but have ₹${agentBalance.toLocaleString()}. Please top up.`,
                visibilityTime: 6000
            });
        }

        setIsBooking(true);
        try {
            const passengerData = passengersList.map((p, idx) => {
                const pType  = PTYPE_MAP[p.pType] || PTYPE_MAP[p.type] || 'A';
                const gender = (['Mr', 'Mstr', 'Master'].includes(p.title)) ? 'M' : 'F';

                const paxObj = {
                    title:  p.title,
                    fName:  p.firstName.toUpperCase().trim(),
                    lName:  p.lastName.toUpperCase().trim(),
                    pType,
                    gender,
                    dob:    formatDateFTD(p.dob || '01-01-1990'),
                    ppNo:   '',
                    ppIss:  '',
                    ppExp:  '',
                    ppNat:  'IN',
                };

                const selectedSeatCode = selectedSeats[idx];
                const selectedMealCode = selectedMeals[idx];
                const selectedBagCode = selectedBaggage[idx];
                
                if (selectedSeatCode || selectedMealCode || selectedBagCode) {
                    const seatObj = seatsListNormalized.find(s => s.code === selectedSeatCode);
                    const mealObj = availableMeals.find(m => (m.code || m.mealID) === selectedMealCode);
                    const bagObj = availableBaggage.find(b => (b.code || b.baggID) === selectedBagCode);

                    paxObj.Baggage = {
                        Onward: {
                            ...(selectedSeatCode ? { 
                                seat_no: selectedSeatCode, 
                                seat_amount: String(seatObj?.amount || '0') 
                            } : {}),
                            ...(selectedMealCode ? { 
                                meal: selectedMealCode, 
                                meal_amount: String(mealObj?.amount || mealObj?.mealAmt || '0') 
                            } : {}),
                            ...(selectedBagCode ? {
                                baggage: selectedBagCode,
                                baggage_amount: String(bagObj?.amount || bagObj?.baggAmt || '0')
                            } : {})
                        }
                    };
                }

                return paxObj;
            });

            const flightID = bookingData.details?.flightID || bookingData.flightID;
            const refID    = bookingData.details?.refID    || bookingData.refID;
            const mrd = mobile.startsWith('+') ? mobile : `+91${mobile}`;

            const payload = {
                flightID,
                refID,
                passenger:       passengerData,
                mobile,
                mrd,
                email,
                gst:          (validationFlags.gstInd === 1 || gst.number) ? gst : undefined,
                gstind:       (validationFlags.gstInd === 1 || gst.number) ? 1 : 0,
                first_pax_pan_no: pan || undefined,
                netfare,
                paymentMethod: 'WALLET',
            };

            const res = await bookingService.ftdBookFlight(payload);

            if (res.success) {
                navigation.replace('BookingSuccess', { booking: res.data });
            } else {
                Toast.show({ type: 'error', text1: 'Booking Failed', text2: res.message || 'Could not complete booking. Please try again.' });
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || err.message || 'Failed to book. Contact administrator.' });
        } finally { setIsBooking(false); }
    };

    if (isBooking) return <GoyaflyLoader visible={true} />;

    return (
        <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>

                {/* Header */}
                <View className="px-5 pt-5 pb-4 flex-row items-center bg-white border-b border-slate-100 shadow-sm">
                    <TouchableOpacity
                        onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}
                        className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 shadow-sm mr-4 active:scale-95"
                    >
                        <Ionicons name="chevron-back" size={22} color="#1D4171" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-2xl font-black text-slate-900">Checkout</Text>
                        <Text className="text-slate-400 font-black uppercase text-[10px] tracking-widest mt-0.5">
                            {bookingData?.from} → {bookingData?.to}
                        </Text>
                    </View>
                </View>

                <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
                    <StepIndicator step={step} />

                    {/* STEP 1 */}
                    {step === 1 && (
                        <View>
                            {passengersList.map((p, idx) => (
                                <View
                                    key={idx}
                                    className="bg-white p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-6"
                                    style={{ elevation: 8 }}
                                >
                                    <SectionHeader
                                        title={`Passenger ${idx + 1}${idx === 0 ? ' (Lead)' : ''} — ${p.type}`}
                                        accent={p.type === 'ADT' ? '#1D4171' : p.type === 'CHD' ? '#F07E21' : '#059669'}
                                    />

                                    {/* Title Selector */}
                                    <View className="mb-4">
                                        <Text className="text-slate-400 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">
                                            Title *
                                        </Text>
                                        <View className="flex-row gap-2">
                                            {(TITLE_OPTIONS[p.type] || ['Mr', 'Mrs', 'Ms']).map(opt => (
                                                <TouchableOpacity
                                                    key={opt}
                                                    onPress={() => updatePax(idx, 'title', opt)}
                                                    className={`flex-1 py-3 rounded-xl border items-center active:scale-95 ${p.title === opt ? 'bg-[#1D4171] border-[#1D4171] border-b-4 border-[#15305B]' : 'bg-white border-slate-100 border-b-4 border-slate-200'}`}
                                                >
                                                    <Text className={`font-black text-xs tracking-wider ${p.title === opt ? 'text-white' : 'text-slate-600'}`}>
                                                        {opt}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    {/* First Name */}
                                    <Field
                                        label="First / Middle Name *"
                                        value={p.firstName}
                                        onChangeText={v => updatePax(idx, 'firstName', v)}
                                        autoCapitalize="characters"
                                        placeholder="Given Name"
                                    />

                                    {/* Last Name */}
                                    <Field
                                        label="Last Name / Surname *"
                                        value={p.lastName}
                                        onChangeText={v => updatePax(idx, 'lastName', v)}
                                        autoCapitalize="characters"
                                        placeholder="Surname"
                                    />

                                    {/* DOB (Only for CHD and INF in Domestic, or if explicitly requested) */}
                                    {p.type !== 'ADT' && (
                                        <View className="mb-4">
                                            <Text className="text-slate-400 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">
                                                Date of Birth * (DD-MM-YYYY)
                                            </Text>
                                            <DobPicker
                                                value={p.dob}
                                                onChange={v => updatePax(idx, 'dob', v)}
                                            />
                                        </View>
                                    )}

                                    {/* PAN */}
                                    {idx === 0 && (validationFlags.pan_mandatory === 1 || validationFlags.isPanMandatory === 1) && (
                                        <View className="border-t border-slate-100 pt-4 mt-2">
                                            <Field
                                                label="PAN Number (Mandatory) *"
                                                value={pan}
                                                onChangeText={v => setPan(v.toUpperCase())}
                                                autoCapitalize="characters"
                                                placeholder="ABCDE1234F"
                                            />
                                        </View>
                                    )}
                                </View>
                            ))}

                            {/* Contact Details */}
                            <View className="bg-white p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-6" style={{ elevation: 8 }}>
                                <SectionHeader title="Booking Notifications" accent="#F07E21" />
                                <View className="flex-row gap-3 mb-4">
                                    <View className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 justify-center shadow-inner">
                                        <Text className="font-black text-slate-400 text-xs">🇮🇳 +91</Text>
                                    </View>
                                    <View className="flex-1">
                                        <TextInput
                                            value={mobile}
                                            onChangeText={v => setMobile(v.replace(/[^0-9]/g, '').slice(0, 10))}
                                            placeholder="Mobile Number *"
                                            keyboardType="phone-pad"
                                            className="bg-slate-50 p-4 rounded-2xl font-black text-slate-900 text-sm border border-slate-100 shadow-inner"
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>
                                </View>
                                <Field
                                    label="Email Address *"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholder="ticket@example.com"
                                />
                            </View>

                            {/* GST Details */}
                            <View className="bg-white p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-6" style={{ elevation: 8 }}>
                                <SectionHeader title="GST Details (Optional)" accent="#10b981" />
                                <TouchableOpacity
                                    onPress={() => setShowGst(!showGst)}
                                    className="flex-row items-center py-2"
                                >
                                    <View className={`w-6 h-6 rounded-xl border items-center justify-center mr-3 shadow-sm ${showGst ? 'bg-[#1D4171] border-[#1D4171]' : 'bg-slate-50 border-slate-200'}`}>
                                        {showGst && <Ionicons name="checkmark" size={16} color="#fff" />}
                                    </View>
                                    <Text className="font-black text-xs text-slate-600 uppercase tracking-wider">Add GST</Text>
                                </TouchableOpacity>
                                {(showGst || gst.number) && (
                                    <View className="pt-4 border-t border-slate-100 mt-2">
                                        <Field label="GSTIN Number" value={gst.number}
                                            onChangeText={v => setGst({ ...gst, number: v.toUpperCase() })}
                                            autoCapitalize="characters" placeholder="07AAAAA0000A1Z5" />
                                        <Field label="Company Name" value={gst.company}
                                            onChangeText={v => setGst({ ...gst, company: v })}
                                            placeholder="Registered Agency Name" />
                                        <Field label="GST Email" value={gst.email}
                                            onChangeText={v => setGst({ ...gst, email: v })}
                                            keyboardType="email-address" autoCapitalize="none"
                                            placeholder="tax@agency.com" />
                                        <Field label="GST Mobile" value={gst.mobile}
                                            onChangeText={v => setGst({ ...gst, mobile: v })}
                                            keyboardType="phone-pad" placeholder="10 digits" />
                                        <Field label="GST Address" value={gst.address}
                                            onChangeText={v => setGst({ ...gst, address: v })}
                                            placeholder="Billing Address" />
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <View>
                            {loadingSSR ? (
                                <View className="bg-white p-16 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl mb-6 items-center">
                                    <ActivityIndicator size="large" color="#F07E21" className="mb-4" />
                                    <Text className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                        Fetching GDS Seat Maps & Meals...
                                    </Text>
                                </View>
                            ) : (
                                <View>
                                    <View className="bg-blue-50 border border-blue-100 border-b-4 border-b-blue-200 p-4 rounded-2xl mb-6 shadow-sm">
                                        <Text className="text-blue-700 font-black text-[10px] uppercase tracking-wider leading-relaxed">
                                            ℹ️ Seat, Meal, and Baggage selection is optional. Charges are added to final price.
                                        </Text>
                                    </View>

                                    {passengersList.map((p, idx) => (
                                        <View
                                            key={idx}
                                            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-6"
                                            style={{ elevation: 8 }}
                                        >
                                            <SectionHeader title={`${p.firstName || 'Passenger'} ${p.lastName || (idx + 1)}`} accent="#1D4171" />

                                            {/* Seat Map Selector */}
                                            <View className="mb-6">
                                                <Text className="text-slate-400 text-[10px] font-black uppercase mb-3 tracking-widest">
                                                    Select Cabin Seat (Optional)
                                                </Text>
                                                {selectedSeats[idx] ? (
                                                    <View className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex-row justify-between items-center shadow-inner">
                                                        <Text className="font-black text-emerald-800 text-sm">
                                                            Seat Selected: {selectedSeats[idx]} (Charge: +₹{seatsListNormalized.find(s => s.code === selectedSeats[idx])?.amount || 0})
                                                        </Text>
                                                        <TouchableOpacity onPress={() => setSelectedSeats(prev => { const n = { ...prev }; delete n[idx]; return n; })}>
                                                            <Ionicons name="close-circle" size={22} color="#047857" />
                                                        </TouchableOpacity>
                                                    </View>
                                                ) : (
                                                    <TouchableOpacity
                                                        onPress={() => { setActivePaxIdxForSeat(idx); setShowSeatMapModal(true); }}
                                                        className="w-full border-2 border-slate-200 border-dashed rounded-2xl py-4 items-center justify-center active:scale-95"
                                                    >
                                                        <Text className="font-black text-slate-500 text-xs uppercase tracking-widest">
                                                            + Select Seat
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>

                                            {/* Meal Selection */}
                                            <View className="mb-6">
                                                <Text className="text-slate-400 text-[10px] font-black uppercase mb-3 tracking-widest">
                                                    Meal Option (Optional)
                                                </Text>
                                                <TouchableOpacity
                                                    onPress={() => { setActivePaxIdxForSSR(idx); setMealPickerVisible(true); }}
                                                    className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 flex-row justify-between items-center shadow-inner active:scale-95"
                                                >
                                                    <Text className="font-black text-slate-800 text-sm">
                                                        {selectedMeals[idx]
                                                            ? (availableMeals.find(m => (m.code || m.mealID) === selectedMeals[idx])?.desc || selectedMeals[idx])
                                                            : 'No Preference (Free)'}
                                                    </Text>
                                                    <Ionicons name="chevron-down" size={18} color="#9ca3af" />
                                                </TouchableOpacity>
                                            </View>

                                            {/* Baggage Selection */}
                                            {availableBaggage.length > 0 && (
                                                <View className="mb-2">
                                                    <Text className="text-slate-400 text-[10px] font-black uppercase mb-3 tracking-widest">
                                                        Extra Baggage (Optional)
                                                    </Text>
                                                    <TouchableOpacity
                                                        onPress={() => { setActivePaxIdxForSSR(idx); setBaggagePickerVisible(true); }}
                                                        className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 flex-row justify-between items-center shadow-inner active:scale-95"
                                                    >
                                                        <Text className="font-black text-slate-800 text-sm">
                                                            {selectedBaggage[idx]
                                                                ? (availableBaggage.find(b => (b.code || b.baggID) === selectedBaggage[idx])?.desc || selectedBaggage[idx])
                                                                : 'No Extra Baggage'}
                                                        </Text>
                                                        <Ionicons name="chevron-down" size={18} color="#9ca3af" />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                        <View>
                            <View className="bg-emerald-50 border border-emerald-100 border-b-4 border-b-emerald-200 p-5 rounded-2xl mb-6 flex-row items-center gap-3 shadow-sm">
                                <Text className="text-2xl">✅</Text>
                                <View className="flex-1">
                                    <Text className="text-emerald-800 font-black text-xs uppercase tracking-wider mb-0.5">
                                        Booking Price Verified & Secured
                                    </Text>
                                    <Text className="text-emerald-600 font-bold text-[10px]">
                                        This price is held for your agency session.
                                    </Text>
                                </View>
                            </View>

                            {/* Price Summary */}
                            <View className="p-8 rounded-[2.5rem] shadow-2xl mb-6 overflow-hidden border border-blue-400/20" style={{ backgroundColor: '#1D4171', elevation: 12 }}>
                                <LinearGradient 
                                    colors={['#1D4171', '#15305B']} 
                                    start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                                    style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                                />
                                <View className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 shadow-inner" />
                                <Text className="text-[10px] font-black uppercase tracking-widest text-blue-200/60 mb-1.5">
                                    Total Amount
                                </Text>
                                <Text className="text-4xl font-black text-white mb-6" numberOfLines={1} adjustsFontSizeToFit={true}>
                                    ₹{requiredBalance.toLocaleString()}
                                </Text>

                                {totalSsrCost > 0 && (
                                    <View className="mb-6 bg-white/10 p-4 rounded-2xl border border-white/10">
                                        <View className="flex-row justify-between mb-2">
                                            <Text className="text-white/60 text-xs font-bold uppercase">Flight Base</Text>
                                            <Text className="text-white text-xs font-black">₹{finalPrice.toLocaleString()}</Text>
                                        </View>
                                        {seatCost > 0 && (
                                            <View className="flex-row justify-between mb-2">
                                                <Text className="text-white/60 text-xs font-bold uppercase">Seats Fee</Text>
                                                <Text className="text-white text-xs font-black">₹{seatCost.toLocaleString()}</Text>
                                            </View>
                                        )}
                                        {mealCost > 0 && (
                                            <View className="flex-row justify-between mb-2">
                                                <Text className="text-white/60 text-xs font-bold uppercase">Meals Fee</Text>
                                                <Text className="text-white text-xs font-black">₹{mealCost.toLocaleString()}</Text>
                                            </View>
                                        )}
                                        {baggageCost > 0 && (
                                            <View className="flex-row justify-between">
                                                <Text className="text-white/60 text-xs font-bold uppercase">Baggage Fee</Text>
                                                <Text className="text-white text-xs font-black">₹{baggageCost.toLocaleString()}</Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                <View className="flex-row justify-between items-center border-t border-white/10 pt-4">
                                    <Text className="text-white font-bold opacity-70 text-xs">Wallet Balance</Text>
                                    <Text className={`font-black text-lg tracking-wider ${loadingBalance ? 'text-white/50' : agentBalance < requiredBalance ? 'text-red-300' : 'text-emerald-300'}`}>
                                        {loadingBalance ? '...' : `₹${agentBalance.toLocaleString()}`}
                                    </Text>
                                </View>
                                {!loadingBalance && agentBalance < requiredBalance && (
                                    <View className="bg-red-500/20 border border-red-400/30 border-b-4 border-b-red-500/40 p-4 rounded-2xl mt-4 shadow-sm">
                                        <Text className="text-red-200 font-black text-[10px] uppercase tracking-wider mb-2 leading-relaxed">
                                            ⚠️ Insufficient Balance. Need ₹{(requiredBalance - agentBalance).toLocaleString()} more.
                                        </Text>
                                        <TouchableOpacity onPress={() => navigation.navigate('Wallet')} className="bg-white/10 py-3 rounded-xl items-center border border-white/20 active:scale-95">
                                            <Text className="text-white font-black text-xs uppercase tracking-wider">
                                                Top up Wallet →
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {/* Flight Summary */}
                            <View className="bg-white p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-6" style={{ elevation: 8 }}>
                                <SectionHeader title="Flight Summary" accent="#1D4171" />
                                {[
                                    ['Flight',     `${bookingData?.details?.airline || ''} · ${bookingData?.details?.flightNumber || ''}`],
                                    ['Route',      `${bookingData?.from} → ${bookingData?.to}`],
                                    ['Date',       bookingData?.details?.date || ''],
                                    ['Departure',  bookingData?.details?.departureTime || ''],
                                    ['Arrival',    bookingData?.details?.arrivalTime || ''],
                                    ['Passengers', `${passengersList.length} Traveller(s)`],
                                ].map(([label, val]) => val ? (
                                    <View key={label} className="flex-row justify-between py-3 border-b border-slate-50">
                                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                                            {label}
                                        </Text>
                                        <Text className="text-xs font-black text-slate-800 tracking-wide">{val}</Text>
                                    </View>
                                ) : null)}
                            </View>

                            {/* Passenger Review */}
                            <View className="bg-white p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-6" style={{ elevation: 8 }}>
                                <SectionHeader title="Passenger Review" accent="#F07E21" />
                                {passengersList.map((p, idx) => (
                                    <View key={idx} className="py-3 border-b border-slate-50">
                                        <View className="flex-row justify-between items-center mb-1">
                                            <Text className="font-black text-slate-800 text-xs tracking-wide">
                                                {p.title} {p.firstName} {p.lastName}
                                            </Text>
                                            <View className={`px-2.5 py-1 rounded-lg border ${p.type === 'ADT' ? 'bg-blue-50 border-blue-100 text-blue-700' : p.type === 'CHD' ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                                                <Text className="font-black text-[9px] uppercase tracking-wider">{p.type}</Text>
                                            </View>
                                        </View>
                                        <Text className="text-slate-500 text-[10px] font-bold leading-relaxed">
                                            DOB: {formatDateFTD(p.dob) || '—'}
                                            {selectedSeats[idx] ? ` · Seat: ${selectedSeats[idx]}` : ''}
                                            {selectedMeals[idx] ? ` · Meal: ${selectedMeals[idx]}` : ''}
                                            {selectedBaggage[idx] ? ` · Baggage: ${selectedBaggage[idx]}` : ''}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Agreement */}
                            <TouchableOpacity
                                onPress={() => setAgreed(!agreed)}
                                className="flex-row items-center bg-white p-5 rounded-2xl border border-slate-100 border-b-4 border-slate-200 shadow-sm mb-8 active:scale-95"
                            >
                                <View className={`w-6 h-6 rounded-xl border items-center justify-center mr-3 shadow-sm ${agreed ? 'bg-[#F07E21] border-[#F07E21]' : 'bg-slate-50 border-slate-200'}`}>
                                    {agreed && <Ionicons name="checkmark" size={16} color="#fff" />}
                                </View>
                                <Text className="text-xs font-bold text-slate-600 flex-1 leading-relaxed">
                                    I agree to the Price Rules, GDS ticketing policies of the airline and FTD Travel, and confirm all passenger details are correct as per Passport/ID.
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <View className="h-10" />
                </ScrollView>

                {/* Bottom CTA Bar */}
                <View className="p-5 bg-white border-t border-slate-100 shadow-2xl">
                    {step === 1 && (
                        <TouchableOpacity onPress={handleProceedToAddons} className="active:scale-95">
                            <View
                                style={{ paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: '#1D4171', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, overflow: 'hidden' }}
                                className="rounded-2xl border border-b-[6px] border-[#0f2444] relative"
                            >
                                <LinearGradient
                                    colors={['#1D4171', '#15305B']}
                                    start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                                    style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                                />
                                <Text className="text-white font-black text-sm uppercase tracking-widest relative z-10">
                                    Next: Select Add-ons →
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    {step === 2 && (
                        <TouchableOpacity onPress={() => setStep(3)} className="active:scale-95">
                            <View
                                style={{ paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: '#1D4171', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, overflow: 'hidden' }}
                                className="rounded-2xl border border-b-[6px] border-[#0f2444] relative"
                            >
                                <LinearGradient
                                    colors={['#1D4171', '#15305B']}
                                    start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                                    style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                                />
                                <Text className="text-white font-black text-sm uppercase tracking-widest relative z-10">
                                    Next: Review & Pay →
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    {step === 3 && (
                        <TouchableOpacity
                            onPress={handleBook}
                            disabled={!agreed || (!loadingBalance && agentBalance < requiredBalance)}
                            className="active:scale-95"
                        >
                            <View
                                style={{ paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: '#059669', shadowOffset: { width: 0, height: 8 }, shadowOpacity: agreed ? 0.3 : 0, shadowRadius: 16, elevation: agreed ? 8 : 0, overflow: 'hidden' }}
                                className={`rounded-2xl border border-b-[6px] relative ${agreed && (loadingBalance || agentBalance >= requiredBalance) ? 'border-[#036247]' : 'border-slate-400'}`}
                            >
                                <LinearGradient
                                    colors={
                                        agreed && (loadingBalance || agentBalance >= requiredBalance)
                                            ? ['#059669', '#047857']
                                            : ['#cbd5e1', '#94a3b8']
                                    }
                                    start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                                    style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                                />
                                <Text className="text-white font-black text-sm uppercase tracking-widest relative z-10">
                                    {!agreed
                                        ? 'Accept Policies to Confirm'
                                        : `Confirm & Pay ₹${requiredBalance.toLocaleString()}`}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>

            {/* Visual Airplane Seat Selection Modal */}
            <SeatMapModal
                visible={showSeatMapModal}
                onClose={() => setShowSeatMapModal(false)}
                seatMapData={seatMap}
                passengers={passengersList}
                selectedSeats={selectedSeats}
                activePaxIdx={activePaxIdxForSeat}
                onSeatSelect={handleSeatSelect}
            />

            {/* Meal Option bottom sheet */}
            <BottomSheetPicker
                visible={mealPickerVisible}
                onClose={() => setMealPickerVisible(false)}
                title="Select Meal Option"
                options={mealOptions}
                selectedValue={selectedMeals[activePaxIdxForSSR] || ''}
                onSelect={(val) => setSelectedMeals(prev => ({ ...prev, [activePaxIdxForSSR]: val }))}
            />

            {/* Baggage Option bottom sheet */}
            <BottomSheetPicker
                visible={baggagePickerVisible}
                onClose={() => setBaggagePickerVisible(false)}
                title="Select Extra Baggage"
                options={baggageOptions}
                selectedValue={selectedBaggage[activePaxIdxForSSR] || ''}
                onSelect={(val) => setSelectedBaggage(prev => ({ ...prev, [activePaxIdxForSSR]: val }))}
            />
        </View>
    );
}

const BottomSheetPicker = ({ visible, onClose, title, options, selectedValue, onSelect }) => (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
        <View className="flex-1 justify-end bg-black/50">
            <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
            <View className="bg-white rounded-t-[2.5rem] p-6 max-h-[70%] border border-slate-100 shadow-2xl">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-xl font-black text-slate-800 uppercase tracking-tight">{title}</Text>
                    <TouchableOpacity onPress={onClose} className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
                        <Ionicons name="close" size={20} color="#1D4171" />
                    </TouchableOpacity>
                </View>
                <ScrollView className="mb-4" showsVerticalScrollIndicator={false}>
                    {options.map((opt) => {
                        const isSelected = selectedValue === opt.value;
                        return (
                            <TouchableOpacity
                                key={opt.value}
                                onPress={() => { onSelect(opt.value); onClose(); }}
                                className={`flex-row justify-between items-center p-4 mb-3 rounded-2xl border transition-all ${isSelected ? 'bg-slate-50 border-emerald-500' : 'bg-white border-slate-100'}`}
                            >
                                <Text className={`font-black text-sm ${isSelected ? 'text-emerald-700' : 'text-slate-700'}`}>{opt.label}</Text>
                                {isSelected && <Ionicons name="checkmark-circle" size={20} color="#10b981" />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </View>
    </Modal>
);

const SeatMapModal = ({ visible, onClose, seatMapData, passengers, selectedSeats, activePaxIdx, onSeatSelect }) => {
    const normalizeSeats = (data) => {
        if (!data) return [];
        let seatsArray = [];
        if (Array.isArray(data)) seatsArray = data;
        else if (data.FlightSeat?.Onward?.[0]?.SeatMap) seatsArray = data.FlightSeat.Onward[0].SeatMap;
        else if (data.FlightSeat?.Onward?.[0]?.seatMap) seatsArray = data.FlightSeat.Onward[0].seatMap;
        else if (data.seats && Array.isArray(data.seats)) seatsArray = data.seats;
        else if (data.Seats && Array.isArray(data.Seats)) seatsArray = data.Seats;
        
        return seatsArray.map(s => {
            if (typeof s === 'string') return { code: s, amount: 0, status: 'available' };
            const code = s.code || s.seatNo || s.seatID || s.seatName;
            return {
                ...s,
                code,
                seatNo: code,
                amount: parseFloat(s.amount || s.seatAmount || s.seatAmt || 0),
                status: (s.status === 'unavailable' || s.isBooked === true || s.isBooked === 'true' || s.isBooked === '1' || s.seatAvailable === false) ? 'unavailable' : 'available'
            };
        });
    };

    const seatsList = normalizeSeats(seatMapData);
    const rows = {};
    seatsList.forEach(seat => {
        if (!seat.code) return;
        const rowNum = seat.code.match(/\d+/)?.[0] || '1';
        if (!rows[rowNum]) rows[rowNum] = [];
        rows[rowNum].push(seat);
    });

    const getSelectedPaxIndex = (seatCode) => {
        for (const [paxIdx, code] of Object.entries(selectedSeats)) {
            if (code === seatCode) return parseInt(paxIdx);
        }
        return -1;
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
            <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
                <View className="px-5 py-4 flex-row items-center justify-between bg-white border-b border-slate-100 shadow-sm">
                    <View>
                        <Text className="text-xl font-black text-slate-800">Select Seat</Text>
                        <Text className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-0.5">
                            Passenger {activePaxIdx + 1}: {passengers[activePaxIdx]?.firstName || 'PAX'}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onClose} className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center active:scale-95">
                        <Ionicons name="close" size={20} color="#1D4171" />
                    </TouchableOpacity>
                </View>

                <View className="flex-1 flex-row">
                    <View className="w-1/3 border-r border-slate-200 bg-white p-4">
                        <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Travellers</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {passengers.map((p, idx) => {
                                const isAssigned = selectedSeats[idx];
                                const isActive = activePaxIdx === idx;
                                return (
                                    <View
                                        key={idx}
                                        className={`p-3 rounded-xl border mb-3 ${isActive ? 'bg-[#1D4171] border-[#1D4171] border-b-4 border-[#15305B]' : isAssigned ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
                                    >
                                        <Text className={`font-black text-xs uppercase ${isActive ? 'text-white' : 'text-slate-700'}`} numberOfLines={1}>
                                            {p.firstName || `Pax ${idx + 1}`}
                                        </Text>
                                        <Text className={`text-[8px] font-bold uppercase mt-1 ${isActive ? 'text-blue-200' : isAssigned ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {isAssigned ? `Seat ${isAssigned}` : 'No Seat'}
                                        </Text>
                                    </View>
                                );
                            })}
                        </ScrollView>
                        
                        <View className="mt-4 pt-4 border-t border-slate-200">
                            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Legend</Text>
                            <View className="gap-2.5">
                                <View className="flex-row items-center"><View className="w-4 h-4 rounded bg-white border border-slate-300 mr-2" /><Text className="text-[9px] font-bold text-slate-600 uppercase">Avail</Text></View>
                                <View className="flex-row items-center"><View className="w-4 h-4 rounded bg-emerald-500 border border-emerald-600 mr-2" /><Text className="text-[9px] font-bold text-slate-600 uppercase">Selected</Text></View>
                                <View className="flex-row items-center"><View className="w-4 h-4 rounded bg-slate-200 border border-slate-300 opacity-50 mr-2" /><Text className="text-[9px] font-bold text-slate-600 uppercase">Occupied</Text></View>
                                <View className="flex-row items-center"><View className="w-4 h-4 rounded bg-blue-50 border border-blue-200 mr-2 items-center justify-center"><Text className="text-[6px] font-black text-blue-600">₹</Text></View><Text className="text-[9px] font-bold text-slate-600 uppercase">Paid</Text></View>
                            </View>
                        </View>
                    </View>

                    <View className="w-2/3 p-4 items-center justify-center bg-slate-100">
                        <ScrollView className="w-full" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                            <View className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm relative w-full">
                                <View className="items-center gap-3">
                                    {Object.keys(rows).sort((a,b) => parseInt(a)-parseInt(b)).map(rowNum => (
                                        <View key={rowNum} className="flex-row justify-between items-center w-full">
                                            <View className="flex-row gap-1.5 w-[42%] justify-end">
                                                {rows[rowNum].filter(s => ['A','B','C'].some(ltr => s.code.includes(ltr))).map(seat => {
                                                    const paxIdx = getSelectedPaxIndex(seat.code);
                                                    const isSelected = paxIdx !== -1;
                                                    const isUnavailable = seat.status === 'unavailable';
                                                    const hasPrice = seat.amount > 0;
                                                    
                                                    return (
                                                        <TouchableOpacity
                                                            key={seat.code}
                                                            disabled={isUnavailable}
                                                            onPress={() => onSeatSelect(seat, activePaxIdx)}
                                                            className={`relative w-8 h-8 rounded-lg items-center justify-center border
                                                                ${isUnavailable ? 'bg-slate-200 border-slate-300 opacity-50' : 
                                                                  isSelected ? 'bg-emerald-500 border-emerald-600' : 
                                                                  hasPrice ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}
                                                        >
                                                            <Text className={`text-[9px] font-black
                                                                ${isUnavailable ? 'text-slate-400' : 
                                                                  isSelected ? 'text-white' : 
                                                                  hasPrice ? 'text-blue-700' : 'text-slate-600'}`}>
                                                                {isSelected ? (paxIdx + 1) : seat.code.replace(/\d+/,'')}
                                                            </Text>
                                                            {!isSelected && hasPrice && !isUnavailable && (
                                                                <View className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full items-center justify-center">
                                                                    <Text className="text-[5px] text-white font-black">₹</Text>
                                                                </View>
                                                            )}
                                                        </TouchableOpacity>
                                                    )
                                                })}
                                            </View>
                                            
                                            <View className="w-[16%] items-center">
                                                <Text className="text-[9px] font-black text-slate-300">{rowNum}</Text>
                                            </View>

                                            <View className="flex-row gap-1.5 w-[42%] justify-start">
                                                {rows[rowNum].filter(s => ['D','E','F'].some(ltr => s.code.includes(ltr))).map(seat => {
                                                    const paxIdx = getSelectedPaxIndex(seat.code);
                                                    const isSelected = paxIdx !== -1;
                                                    const isUnavailable = seat.status === 'unavailable';
                                                    const hasPrice = seat.amount > 0;
                                                    
                                                    return (
                                                        <TouchableOpacity
                                                            key={seat.code}
                                                            disabled={isUnavailable}
                                                            onPress={() => onSeatSelect(seat, activePaxIdx)}
                                                            className={`relative w-8 h-8 rounded-lg items-center justify-center border
                                                                ${isUnavailable ? 'bg-slate-200 border-slate-300 opacity-50' : 
                                                                  isSelected ? 'bg-emerald-500 border-emerald-600' : 
                                                                  hasPrice ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}
                                                        >
                                                            <Text className={`text-[9px] font-black
                                                                ${isUnavailable ? 'text-slate-400' : 
                                                                  isSelected ? 'text-white' : 
                                                                  hasPrice ? 'text-blue-700' : 'text-slate-600'}`}>
                                                                {isSelected ? (paxIdx + 1) : seat.code.replace(/\d+/,'')}
                                                            </Text>
                                                            {!isSelected && hasPrice && !isUnavailable && (
                                                                <View className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full items-center justify-center">
                                                                    <Text className="text-[5px] text-white font-black">₹</Text>
                                                                </View>
                                                            )}
                                                        </TouchableOpacity>
                                                    )
                                                })}
                                            </View>
                                        </View>
                                    ))}
                                    {seatsList.length === 0 && (
                                        <View className="py-10 items-center">
                                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No seats available</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>

                <View className="p-4 bg-white border-t border-slate-100 flex-row justify-end">
                    <TouchableOpacity onPress={onClose} className="px-8 py-4 bg-[#1D4171] rounded-2xl active:scale-95">
                        <Text className="text-white font-black text-xs uppercase tracking-widest">Done</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};
