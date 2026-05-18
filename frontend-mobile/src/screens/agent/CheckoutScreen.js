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

// ─────────────────────────────────────────────────────────────
// Step Indicator (3-step wizard: Travellers → Add-ons → Review)
// ─────────────────────────────────────────────────────────────
const StepIndicator = ({ step }) => (
    <View className="flex-row items-center justify-center mb-6 px-6">
        {[
            { num: 1, label: 'Travellers' },
            { num: 2, label: 'Add-ons' },
            { num: 3, label: 'Review' }
        ].map((s, idx) => (
            <React.Fragment key={s.num}>
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
            </React.Fragment>
        ))}
    </View>
);

const SectionHeader = ({ title, accent = '#F07E21' }) => (
    <View className="flex-row items-center mb-5 mt-2">
        <View style={{ backgroundColor: accent }} className="w-1.5 h-6 rounded-full mr-3 shadow-sm" />
        <Text className="text-lg font-black text-slate-900 tracking-wide">{title}</Text>
    </View>
);

const Field = ({ label, value, onChangeText, keyboardType, placeholder, autoCapitalize, t }) => (
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

// ─────────────────────────────────────────────────────────────
// FTD API date format helper: YYYY-MM-DD  →  DD-MM-YYYY
// ─────────────────────────────────────────────────────────────
const formatDateFTD = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('-') && dateStr.indexOf('-') === 4) {
        const [y, m, d] = dateStr.split('-');
        return `${d}-${m}-${y}`;
    }
    return dateStr; // already DD-MM-YYYY
};

// ─────────────────────────────────────────────────────────────
// Title options per pax type (FTD Section 8)
// ─────────────────────────────────────────────────────────────
const TITLE_OPTIONS = {
    ADT: ['Mr', 'Mrs', 'Ms'],
    CHD: ['Mstr', 'Miss'],
    INF: ['Mstr', 'Miss'],
};

// ─────────────────────────────────────────────────────────────
// pType map: ADT→A, CHD→C, INF→I  (FTD Section 8 required)
// ─────────────────────────────────────────────────────────────
const PTYPE_MAP = { ADT: 'A', CHD: 'C', INF: 'I', A: 'A', C: 'C', I: 'I' };

// ─────────────────────────────────────────────────────────────
// DOB DatePicker (3 TextInputs: DD / MM / YYYY)
// ─────────────────────────────────────────────────────────────
const DobPicker = ({ value, onChange, t }) => {
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

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function CheckoutScreen({ navigation, route }) {
    const t = useThemeColors();
    const { bookingData, passengers, paxBreakdown } = route.params || {};

    const [step, setStep]     = useState(1);
    const [mobile, setMobile] = useState('');
    const [email, setEmail]   = useState('');

    // ── Build passenger list from paxBreakdown (ADT/CHD/INF breakdown)──
    const [passengersList, setPassengersList] = useState(() => {
        const list = [];
        // ADT: adults — dob approx 1990
        for (let i = 0; i < (paxBreakdown?.adt || 1); i++)
            list.push({ type: 'ADT', pType: 'A', title: 'Mr',   firstName: '', lastName: '', dob: '1990-01-01', passportNumber: '', passportIssued: '2020-01-01', passportExpiry: '2030-01-01', passportNat: 'IN' });
        // CHD: children 2-12 — dob approx 2015
        for (let i = 0; i < (paxBreakdown?.chd || 0); i++)
            list.push({ type: 'CHD', pType: 'C', title: 'Mstr', firstName: '', lastName: '', dob: '2015-06-01', passportNumber: '', passportIssued: '2020-01-01', passportExpiry: '2030-01-01', passportNat: 'IN' });
        // INF: infants <2 — dob approx 2024
        for (let i = 0; i < (paxBreakdown?.inf || 0); i++)
            list.push({ type: 'INF', pType: 'I', title: 'Miss', firstName: '', lastName: '', dob: '2024-01-01', passportNumber: '', passportIssued: '2024-01-01', passportExpiry: '2034-01-01', passportNat: 'IN' });
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

    const validationFlags = bookingData?.details?.validationFlags || {};
    const finalPrice   = bookingData?.markupPrice || bookingData?.baseFare || 0;
    const netfare      = bookingData?.baseFare    || bookingData?.details?.netfare || 0;
    const requiredBalance = finalPrice;

    // Fetch wallet balance on mount
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

    // ── Step 1 Validation ─────────────────────────────────────
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

            // DOB validation — required for all passengers
            if (!p.dob || p.dob.split('-').some(x => x === '' || x === '0000' || x === '00'))
                return Toast.show({ type: 'error', text1: 'Required', text2: `Please enter a valid date of birth for Passenger ${i + 1}.` });

            // ── Age Validation (Production Parity) ──
            const birthDate = new Date(p.dob);
            const travelDate = new Date(bookingData?.details?.date || new Date());
            let age = travelDate.getFullYear() - birthDate.getFullYear();
            const m = travelDate.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && travelDate.getDate() < birthDate.getDate())) age--;

            if (p.type === 'CHD' && (age < 2 || age > 12))
                return Toast.show({ type: 'error', text1: 'Invalid Age', text2: `Passenger ${i + 1} is listed as Child but age is ${age}. (Required: 2-12 years)` });
            if (p.type === 'INF' && age >= 2)
                return Toast.show({ type: 'error', text1: 'Invalid Age', text2: `Passenger ${i + 1} is listed as Infant but age is ${age}. (Required: < 2 years)` });

            // International validation
            if (bookingData?.details?.isInternational === true) {
                if (!p.passportNumber || !p.passportNumber.trim())
                    return Toast.show({ type: 'error', text1: 'Required', text2: `Passport Number is required for Passenger ${i + 1}.` });
                if (!p.passportIssued || p.passportIssued.includes('0000'))
                    return Toast.show({ type: 'error', text1: 'Required', text2: `Passport Issued Date is required for Passenger ${i + 1}.` });
                if (!p.passportExpiry || p.passportExpiry.includes('0000'))
                    return Toast.show({ type: 'error', text1: 'Required', text2: `Passport Expiry Date is required for Passenger ${i + 1}.` });
            }

            // Title enforcement for children/infants (FTD Section 8)
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
            // API Section 10: fetch seat map
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

    // ── Book Flight (Step 3) ──────────────────────────────────
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
            // ── Build FTD-compliant passenger array (Section 8 / 9) ──
            const passengerData = passengersList.map((p, idx) => {
                const pType  = PTYPE_MAP[p.pType] || PTYPE_MAP[p.type] || 'A';
                const gender = (['Mr', 'Mstr', 'Master'].includes(p.title)) ? 'M' : 'F';

                const paxObj = {
                    title:  p.title,
                    fName:  p.firstName.toUpperCase().trim(),
                    lName:  p.lastName.toUpperCase().trim(),
                    pType,
                    gender,
                    dob:    formatDateFTD(p.dob || '01-01-1990'), // DD-MM-YYYY
                    // International fields (optional for domestic)
                    ppNo:   p.passportNumber  || '',
                    ppIss:  p.passportIssued  ? formatDateFTD(p.passportIssued)  : '',
                    ppExp:  p.passportExpiry  ? formatDateFTD(p.passportExpiry)  : '',
                    ppNat:  p.passportNat     || 'IN',
                };

                // ── SSR (Section 9): Baggage.Onward structure with dynamic amounts ──
                const selectedSeat = selectedSeats[idx];
                const selectedMeal = selectedMeals[idx];
                if (selectedSeat || selectedMeal) {
                    paxObj.Baggage = {
                        Onward: {
                            ...(selectedSeat ? { 
                                seat_no: selectedSeat.seatNo || selectedSeat.code || selectedSeat, 
                                seat_amount: String(selectedSeat.seatAmount || selectedSeat.amount || '0') 
                            } : {}),
                            ...(selectedMeal ? { 
                                meal: selectedMeal.code || selectedMeal.mealCode || selectedMeal, 
                                meal_amount: String(selectedMeal.mealAmount || selectedMeal.amount || '0') 
                            } : {}),
                        }
                    };
                }

                return paxObj;
            });

            const flightID = bookingData.details?.flightID || bookingData.flightID;
            const refID    = bookingData.details?.refID    || bookingData.refID;

            // mrd = mobile with country code (FTD Section 8: Mandatory)
            const mrd = mobile.startsWith('+') ? mobile : `+91${mobile}`;

            const payload = {
                flightID,
                refID,
                passenger:       passengerData,
                mobile,
                mrd,                                                  // Section 8: mandatory
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

    // ── Parse seat map from Section 10 response ──
    const seatList = (seatMap?.Onward?.row || seatMap?.seats || [])
        .filter(s => !s.isBooked && s.seatAvailable !== false);

    // Meal list from SSR info (Price Check response or fallback)
    const ssrMeals = bookingData?.details?.ssrInfo?.Onward?.Meal ||
                     seatMap?.meals || [];

    return (
        <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>

                {/* Modern 3D Header */}
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

                    {/* ═══════════════════════════════════════════════════
                        STEP 1 – TRAVELLERS + CONTACT + GST
                    ═══════════════════════════════════════════════════ */}
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
                                        t={t}
                                        label="First / Middle Name *"
                                        value={p.firstName}
                                        onChangeText={v => updatePax(idx, 'firstName', v)}
                                        autoCapitalize="characters"
                                        placeholder="Given Name (as on ticket)"
                                    />

                                    {/* Last Name */}
                                    <Field
                                        t={t}
                                        label="Last Name / Surname *"
                                        value={p.lastName}
                                        onChangeText={v => updatePax(idx, 'lastName', v)}
                                        autoCapitalize="characters"
                                        placeholder="Surname"
                                    />

                                    {/* DOB — DD/MM/YYYY picker (FTD Section 8: DD-MM-YYYY) */}
                                    <View className="mb-4">
                                        <Text className="text-slate-400 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">
                                            Date of Birth * (DD-MM-YYYY)
                                            {p.type === 'CHD' ? ' — Child: 2–12 yrs' : ''}
                                            {p.type === 'INF' ? ' — Infant: under 2 yrs' : ''}
                                        </Text>
                                        <DobPicker
                                            value={p.dob}
                                            onChange={v => updatePax(idx, 'dob', v)}
                                            t={t}
                                        />
                                    </View>

                                    {/* PAN — lead passenger only */}
                                    {idx === 0 && (
                                        <View className="border-t border-slate-100 pt-4 mt-2">
                                            <Field
                                                t={t}
                                                label={`PAN Number ${(validationFlags.pan_mandatory === 1 || validationFlags.isPanMandatory === 1) ? '(Mandatory)' : '(Recommended)'}`}
                                                value={pan}
                                                onChangeText={v => setPan(v.toUpperCase())}
                                                autoCapitalize="characters"
                                                placeholder="ABCDE1234F"
                                            />
                                        </View>
                                    )}

                                    {/* Passport Details — Mandatory for International (Section 8) */}
                                    {bookingData?.details?.isInternational === true && (
                                        <View className="border-t border-slate-100 pt-6 mt-4">
                                            <Text className="text-[#1D4171] text-[10px] font-black uppercase mb-4 tracking-widest">
                                                🛂 Passport Details (Mandatory)
                                            </Text>
                                            <Field
                                                t={t}
                                                label="Passport Number *"
                                                value={p.passportNumber}
                                                onChangeText={v => updatePax(idx, 'passportNumber', v.toUpperCase())}
                                                autoCapitalize="characters"
                                                placeholder="L1234567"
                                            />
                                            <View className="mb-4">
                                                <Text className="text-slate-400 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">
                                                    Passport Issued Date *
                                                </Text>
                                                <DobPicker
                                                    value={p.passportIssued}
                                                    onChange={v => updatePax(idx, 'passportIssued', v)}
                                                    t={t}
                                                />
                                            </View>
                                            <View className="mb-4">
                                                <Text className="text-slate-400 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">
                                                    Passport Expiry Date *
                                                </Text>
                                                <DobPicker
                                                    value={p.passportExpiry}
                                                    onChange={v => updatePax(idx, 'passportExpiry', v)}
                                                    t={t}
                                                />
                                            </View>
                                            <Text className="text-slate-400 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest">
                                                Nationality *
                                            </Text>
                                            <View className="flex-row gap-2 mb-4">
                                                {['IN', 'US', 'AE', 'UK'].map(nat => (
                                                    <TouchableOpacity
                                                        key={nat}
                                                        onPress={() => updatePax(idx, 'passportNat', nat)}
                                                        className={`flex-1 py-3 rounded-xl border items-center active:scale-95 ${p.passportNat === nat ? 'bg-[#1D4171] border-[#1D4171] border-b-4 border-[#15305B]' : 'bg-white border-slate-100 border-b-4 border-slate-200'}`}
                                                    >
                                                        <Text className={`font-black text-xs tracking-wider ${p.passportNat === nat ? 'text-white' : 'text-slate-600'}`}>{nat}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            ))}

                            {/* 3D Contact Details */}
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
                                    t={t}
                                    label="Email Address *"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholder="ticket@example.com"
                                />
                            </View>

                            {/* 3D GST Details */}
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
                                        <Field t={t} label="GSTIN Number" value={gst.number}
                                            onChangeText={v => setGst({ ...gst, number: v.toUpperCase() })}
                                            autoCapitalize="characters" placeholder="07AAAAA0000A1Z5" />
                                        <Field t={t} label="Company Name" value={gst.company}
                                            onChangeText={v => setGst({ ...gst, company: v })}
                                            placeholder="Registered Agency Name" />
                                        <Field t={t} label="GST Email" value={gst.email}
                                            onChangeText={v => setGst({ ...gst, email: v })}
                                            keyboardType="email-address" autoCapitalize="none"
                                            placeholder="tax@agency.com" />
                                        <Field t={t} label="GST Mobile" value={gst.mobile}
                                            onChangeText={v => setGst({ ...gst, mobile: v })}
                                            keyboardType="phone-pad" placeholder="10 digits" />
                                        <Field t={t} label="GST Address" value={gst.address}
                                            onChangeText={v => setGst({ ...gst, address: v })}
                                            placeholder="Billing Address" />
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* ═══════════════════════════════════════════════════
                        STEP 2 – ADD-ONS (Seat / Meal SSR)
                    ═══════════════════════════════════════════════════ */}
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
                                            ℹ️ Seat & Meal selection is optional. Charges are added to final price.
                                        </Text>
                                    </View>

                                    {passengersList.map((p, idx) => (
                                        <View
                                            key={idx}
                                            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-6"
                                            style={{ elevation: 8 }}
                                        >
                                            <View className="flex-row items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                                <View className="w-10 h-10 rounded-2xl bg-[#1D4171] border border-b-4 border-[#15305B] items-center justify-center shadow-sm">
                                                    <Text className="text-white font-black text-xs">{idx + 1}</Text>
                                                </View>
                                                <Text className="font-black text-slate-900 uppercase text-sm flex-1">
                                                    {p.title} {p.firstName || 'PAX'} {p.lastName}
                                                </Text>
                                                <View className={`px-3 py-1.5 rounded-xl border ${p.type === 'ADT' ? 'bg-blue-50 border-blue-100' : p.type === 'CHD' ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                                                    <Text className={`text-[9px] font-black uppercase tracking-wider ${p.type === 'ADT' ? 'text-blue-700' : p.type === 'CHD' ? 'text-orange-700' : 'text-green-700'}`}>
                                                        {p.type}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Seat Selection */}
                                            <Text className="text-slate-400 text-[10px] font-black uppercase mb-3 tracking-widest">
                                                Preferred Seat (Optional)
                                            </Text>
                                            {seatList.length > 0 ? (
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 pb-2">
                                                    <View className="flex-row gap-2.5">
                                                        <TouchableOpacity
                                                            onPress={() => setSelectedSeats(prev => ({ ...prev, [idx]: null }))}
                                                            className={`w-16 py-3.5 rounded-2xl border items-center active:scale-95 ${!selectedSeats[idx] ? 'bg-slate-800 border-slate-800 border-b-4 border-slate-900 shadow-sm' : 'bg-white border-slate-100 border-b-4 border-slate-200 shadow-sm'}`}
                                                        >
                                                            <Text className={`font-black text-xs tracking-wider ${!selectedSeats[idx] ? 'text-white' : 'text-slate-500'}`}>
                                                                None
                                                            </Text>
                                                        </TouchableOpacity>
                                                        {seatList.map(seat => (
                                                            <TouchableOpacity
                                                                key={seat.seatNo}
                                                                onPress={() => setSelectedSeats(prev => ({ ...prev, [idx]: seat }))}
                                                                className={`w-16 py-3.5 rounded-2xl border items-center active:scale-95 ${selectedSeats[idx]?.seatNo === seat.seatNo ? 'bg-[#1D4171] border-[#1D4171] border-b-4 border-[#15305B] shadow-sm' : 'bg-white border-slate-100 border-b-4 border-slate-200 shadow-sm'}`}
                                                            >
                                                                <Text className={`font-black text-xs tracking-wider ${selectedSeats[idx]?.seatNo === seat.seatNo ? 'text-white' : 'text-slate-600'}`}>
                                                                    {seat.seatNo}
                                                                </Text>
                                                                {(seat.seatAmount || seat.amount) > 0 && (
                                                                    <Text className={`text-[8px] font-bold mt-1 tracking-wider ${selectedSeats[idx]?.seatNo === seat.seatNo ? 'text-blue-200' : 'text-slate-400'}`}>₹{seat.seatAmount || seat.amount}</Text>
                                                                )}
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
                                                </ScrollView>
                                            ) : (
                                                <View className="bg-slate-50 rounded-2xl p-4 mb-6 items-center border border-slate-100 shadow-inner">
                                                    <Text className="text-slate-400 font-bold text-xs tracking-wider">
                                                        Seat map not available for this flight.
                                                    </Text>
                                                </View>
                                            )}

                                            {/* Meal Selection */}
                                            <Text className="text-slate-400 text-[10px] font-black uppercase mb-3 tracking-widest">
                                                Meal Option (Optional)
                                            </Text>
                                            <View className="flex-row flex-wrap gap-2.5">
                                                {[{ code: '', name: 'No Preference' }, ...ssrMeals].map(meal => {
                                                    const mealCode = meal.code ?? meal.mealCode ?? '';
                                                    const mealName = meal.name ?? meal.mealDesc ?? mealCode;
                                                    const mealAmount = meal.mealAmount ?? meal.amount ?? 0;
                                                    const isSelected = selectedMeals[idx]?.code === mealCode ||
                                                                       (!selectedMeals[idx] && !mealCode);
                                                    return (
                                                        <TouchableOpacity
                                                            key={mealCode || 'none'}
                                                            onPress={() => setSelectedMeals(prev => ({ ...prev, [idx]: meal }))}
                                                            className={`px-4 py-3 rounded-2xl border active:scale-95 ${isSelected ? 'bg-[#F07E21] border-[#F07E21] border-b-4 border-[#D96B18] shadow-sm' : 'bg-white border-slate-100 border-b-4 border-slate-200 shadow-sm'}`}
                                                        >
                                                            <View className="items-center">
                                                                <Text className={`font-black text-xs tracking-wider ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                                                                    {mealName}
                                                                </Text>
                                                                {mealAmount > 0 && (
                                                                    <Text className={`text-[9px] font-bold mt-0.5 tracking-wider ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>₹{mealAmount}</Text>
                                                                )}
                                                            </View>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* ═══════════════════════════════════════════════════
                        STEP 3 – REVIEW & PAY
                    ═══════════════════════════════════════════════════ */}
                    {step === 3 && (
                        <View>
                            {/* Verified Banner */}
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

                            {/* Premium 3D Price Summary */}
                            <View className="p-8 rounded-[2.5rem] shadow-2xl mb-6 overflow-hidden border border-blue-400/20" style={{ backgroundColor: '#1D4171', elevation: 12 }}>
                                <LinearGradient 
                                    colors={['#1D4171', '#15305B']} 
                                    start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                                    className="absolute inset-0"
                                />
                                <View className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 shadow-inner" />
                                <Text className="text-[10px] font-black uppercase tracking-widest text-blue-200/60 mb-1.5">
                                    Total Amount
                                </Text>
                                <Text className="text-4xl font-black text-white mb-6">
                                    ₹{finalPrice.toLocaleString()}
                                </Text>
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

                            {/* Flight Summary - 3D Card */}
                            <View className="bg-white p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 shadow-2xl shadow-slate-300/40 mb-6" style={{ elevation: 8 }}>
                                <SectionHeader title="Flight Summary" accent="#1D4171" />
                                {[
                                    ['Flight',     `${bookingData?.details?.airline || ''} · ${bookingData?.details?.flightNumber || ''}`],
                                    ['Route',      `${bookingData?.from} → ${bookingData?.to}`],
                                    ['Date',       bookingData?.details?.date || ''],
                                    ['Departure',  bookingData?.details?.departureTime || ''],
                                    ['Arrival',    bookingData?.details?.arrivalTime || ''],
                                    ['Passengers', `${passengersList.length} Traveller(s)`],
                                    ['Baggage',    bookingData?.details?.baggage?.checkin || '15 KG'],
                                ].map(([label, val]) => val ? (
                                    <View key={label} className="flex-row justify-between py-3 border-b border-slate-50">
                                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                                            {label}
                                        </Text>
                                        <Text className="text-xs font-black text-slate-800 tracking-wide">{val}</Text>
                                    </View>
                                ) : null)}
                            </View>

                            {/* Passenger Review - 3D Card */}
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
                                            {selectedSeats[idx] ? ` · Seat: ${selectedSeats[idx]?.seatNo || selectedSeats[idx]?.code || typeof selectedSeats[idx] === 'string' ? selectedSeats[idx] : ''}` : ''}
                                            {selectedMeals[idx] ? ` · Meal: ${selectedMeals[idx]?.name || selectedMeals[idx]?.mealDesc || selectedMeals[idx]?.code || typeof selectedMeals[idx] === 'string' ? selectedMeals[idx] : ''}` : ''}
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
                            <LinearGradient
                                colors={['#1D4171', '#15305B']}
                                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                                style={{ paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: '#1D4171', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}
                                className="rounded-2xl border border-b-[6px] border-[#0f2444]"
                            >
                                <Text className="text-white font-black text-sm uppercase tracking-widest">
                                    Next: Select Add-ons →
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                    {step === 2 && (
                        <TouchableOpacity onPress={() => setStep(3)} className="active:scale-95">
                            <LinearGradient
                                colors={['#1D4171', '#15305B']}
                                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                                style={{ paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: '#1D4171', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}
                                className="rounded-2xl border border-b-[6px] border-[#0f2444]"
                            >
                                <Text className="text-white font-black text-sm uppercase tracking-widest">
                                    Next: Review & Pay →
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                    {step === 3 && (
                        <TouchableOpacity
                            onPress={handleBook}
                            disabled={!agreed || (!loadingBalance && agentBalance < requiredBalance)}
                            className="active:scale-95"
                        >
                            <LinearGradient
                                colors={
                                    agreed && (loadingBalance || agentBalance >= requiredBalance)
                                        ? ['#059669', '#047857']
                                        : ['#cbd5e1', '#94a3b8']
                                }
                                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                                style={{ paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: '#059669', shadowOffset: { width: 0, height: 8 }, shadowOpacity: agreed ? 0.3 : 0, shadowRadius: 16, elevation: agreed ? 8 : 0 }}
                                className={`rounded-2xl border border-b-[6px] ${agreed && (loadingBalance || agentBalance >= requiredBalance) ? 'border-[#036247]' : 'border-slate-400'}`}
                            >
                                <Text className="text-white font-black text-sm uppercase tracking-widest">
                                    {!agreed
                                        ? 'Accept Policies to Confirm'
                                        : `Confirm & Pay ₹${finalPrice.toLocaleString()}`}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}
