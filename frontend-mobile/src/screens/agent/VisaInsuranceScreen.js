import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Image, Modal, FlatList, Dimensions, Platform, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../utils/themeColors';
import { visaService, insuranceService, BASE_URL } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const POPULAR_COUNTRIES = [
    'UAE (United Arab Emirates)', 'Singapore', 'Thailand', 'Malaysia',
    'Japan', 'USA (United States)', 'UK (United Kingdom)', 'Australia',
    'Canada', 'Schengen (Europe)', 'Sri Lanka', 'Maldives',
    'Indonesia (Bali)', 'Vietnam', 'Turkey', 'Egypt',
];

    // Insurance plans are now fetched dynamically

const WHY_CHOOSE = [
    { icon: '🛡️', title: '100% Compliant', desc: 'We ensure complete document verification & compliance', iconBg: '#eff6ff', textColor: '#1e40af', iconBgDark: '#1e3a8a' },
    { icon: '⚡', title: 'Fast Processing', desc: 'Quick turnaround time for your visa applications', iconBg: '#f0fdf4', textColor: '#166534', iconBgDark: '#064e3b' },
    { icon: '🎧', title: 'Expert Support', desc: 'Our visa experts assist you at every step', iconBg: '#faf5ff', textColor: '#6b21a8', iconBgDark: '#581c87' },
    { icon: '🔒', title: 'Secure & Safe', desc: 'Your data and documents are always protected with us', iconBg: '#fff7ed', textColor: '#9a3412', iconBgDark: '#7c2d12' },
];

const TRUST_FOOTER = [
    { icon: '🛡️', title: 'Trusted by 5000+', sub: 'Travel Agents' },
    { icon: '🌍', title: '150+ Countries', sub: 'Coverage' },
    { icon: '💳', title: 'Transparent Fees', sub: 'No Hidden Charges' },
    { icon: '🎧', title: '24/7 Support', sub: "We're here for you" },
];

export default function VisaInsuranceScreen({ navigation }) {
    const t = useThemeColors();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    const [activeTab, setActiveTab] = useState('VISA');
    const [visas, setVisas] = useState([]);
    const [insurancePlans, setInsurancePlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Country Selector State
    const [country, setCountry] = useState('');
    const [selectedCountryLabel, setSelectedCountryLabel] = useState('UAE (United Arab Emirates)');
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const [showRequirements, setShowRequirements] = useState(false);
    const [activeVisa, setActiveVisa] = useState(null);

    const filteredCountries = useMemo(() => {
        if (!countrySearch) return POPULAR_COUNTRIES;
        return POPULAR_COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()));
    }, [countrySearch]);

    const fetchVisas = useCallback(async () => {
        try {
            const res = await visaService.getPackages('');
            if (res.success) {
                setVisas(res.data.filter(v => v.isActive));
            }
            const insRes = await insuranceService.getPackages('');
            if (insRes.success) {
                setInsurancePlans(insRes.data.filter(i => i.isActive));
            }
        } catch (err) {
            console.error('Failed to load visas', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchVisas();
    }, [fetchVisas]);

    const handleCountrySelect = (c) => {
        setSelectedCountryLabel(c);
        setCountry(c.split(' (')[0]);
        setShowCountryModal(false);
        setCountrySearch('');
        setShowRequirements(false);
    };

    const handleCheckRequirements = () => {
        const query = country || selectedCountryLabel.split(' (')[0];
        const foundVisa = visas.find(v => v.country.toLowerCase() === query.toLowerCase());
        setActiveVisa(foundVisa || null);
        setShowRequirements(true);
    };

    const handleApply = (item, type) => {
        navigation.navigate('ServiceCheckout', {
            service: type.toUpperCase(),
            item: { ...item, title: type === 'visa' ? item.title : `${item.provider} Insurance` }
        });
    };

    const renderTrustFooter = () => {
        const iconBg = activeTab === 'VISA' 
            ? (t.isDark ? '#1e3a8a' : '#eff6ff') 
            : (t.isDark ? '#7c2d12' : '#fff7ed');
        return (
            <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="rounded-3xl p-5 border shadow-sm mt-2 w-full">
                <View className="flex-row flex-wrap justify-between">
                    {TRUST_FOOTER.map((item, idx) => (
                        <View key={idx} style={{ width: isTablet ? '24%' : '48%' }} className="mb-4 flex-row items-center">
                            <View style={{ backgroundColor: iconBg }} className="w-10 h-10 rounded-xl flex items-center justify-center mr-3">
                                <Text className="text-xl">{item.icon}</Text>
                            </View>
                            <View className="flex-1">
                                <Text style={{ color: t.isDark ? '#f1f5f9' : '#1D4171' }} className="font-black text-[10px] leading-tight mb-0.5">{item.title}</Text>
                                <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="text-[9px] font-bold">{item.sub}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderSkeleton = () => (
        <View className="flex-col gap-4">
            {[1, 2, 3].map(i => (
                <View key={i} style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="rounded-3xl p-5 border shadow-sm flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <View style={{ backgroundColor: t.isDark ? '#334155' : '#f1f5f9' }} className="w-12 h-12 rounded-2xl mr-4" />
                        <View className="flex-1">
                            <View style={{ backgroundColor: t.isDark ? '#334155' : '#f1f5f9' }} className="h-4 w-32 rounded-md mb-2" />
                            <View style={{ backgroundColor: t.isDark ? '#334155' : '#f1f5f9' }} className="h-3 w-20 rounded-md" />
                        </View>
                    </View>
                    <View style={{ backgroundColor: t.isDark ? '#334155' : '#f1f5f9' }} className="w-20 h-9 rounded-xl" />
                </View>
            ))}
        </View>
    );

    const renderVisaTab = () => (
        <View className="px-5">
            {/* ── COUNTRY SEARCH BOX ── */}
            <View className="bg-[#1D4171] rounded-3xl p-5 shadow-2xl shadow-blue-900/40 mb-6 border-b-4 border-[#122a4a]">
                <Text className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-3">
                    📍 Where do you need a visa for?
                </Text>
                
                <TouchableOpacity
                    onPress={() => setShowCountryModal(true)}
                    className="flex-row items-center justify-between bg-white/10 border border-white/20 rounded-2xl px-5 py-4 mb-4 active:bg-white/20"
                >
                    <Text className="text-white font-black text-sm">{selectedCountryLabel}</Text>
                    <Ionicons name="chevron-down" size={18} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleCheckRequirements}
                    className="bg-[#F07E21] py-4 px-5 rounded-2xl flex-row items-center justify-between shadow-lg shadow-orange-500/30 border-b-4 border-[#c46215] active:scale-[0.98]"
                >
                    <View className="flex-row items-center">
                        <Ionicons name="document-text" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text className="text-white font-black text-xs tracking-widest uppercase">Check Requirements</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* ── REQUIREMENTS RESULT ── */}
            {showRequirements && (
                <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="rounded-3xl border shadow-md p-6 mb-6">
                    <View style={{ borderBottomColor: t.isDark ? '#334155' : '#f1f5f9' }} className="flex-row justify-between items-center mb-5 border-b pb-3">
                        <Text style={{ color: t.isDark ? '#f1f5f9' : '#1D4171' }} className="font-black text-sm">
                            📋 Requirements for {country || selectedCountryLabel.split(' (')[0]}
                        </Text>
                        <TouchableOpacity onPress={() => setShowRequirements(false)}>
                            <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="font-black text-[10px] uppercase tracking-widest">Close</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {activeVisa && activeVisa.documentsRequired?.length > 0 ? (
                        <View className="flex-row flex-wrap justify-between">
                            {activeVisa.documentsRequired.map((req, idx) => (
                                <View 
                                    key={idx} 
                                    style={{ 
                                        width: isTablet ? '48%' : '100%', 
                                        marginBottom: 12,
                                        backgroundColor: t.isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(219, 234, 254, 0.5)',
                                        borderColor: t.isDark ? '#334155' : '#bfdbfe'
                                    }} 
                                    className="flex-row items-center p-3.5 rounded-xl border"
                                >
                                    <View style={{ backgroundColor: t.isDark ? '#3b82f6' : '#1D4171' }} className="w-5 h-5 rounded-full flex items-center justify-center mr-3">
                                        <Ionicons name="checkmark" size={12} color="#fff" />
                                    </View>
                                    <Text style={{ color: t.isDark ? '#93c5fd' : '#1D4171' }} className="text-xs font-bold flex-1">{req}</Text>
                                </View>
                            ))}
                        </View>
                    ) : activeVisa ? (
                        <Text style={{ color: t.isDark ? '#cbd5e1' : '#64748b' }} className="text-sm font-bold italic">No specific documents listed. Standard identity documents apply.</Text>
                    ) : (
                        <View style={{ flexDirection: isTablet ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: t.isDark ? '#1e293b' : '#f8fafc' }} className="rounded-2xl p-5">
                            {/* Custom Vector Sheet illustration */}
                            <View 
                                style={{ marginBottom: isTablet ? 0 : 16, marginRight: isTablet ? 20 : 0 }} 
                                className="w-16 h-16 justify-center items-center"
                            >
                                <View style={{ width: 38, height: 48, borderRadius: 4, backgroundColor: t.isDark ? '#475569' : '#cbd5e1', padding: 4 }}>
                                    <View style={{ width: '100%', height: '100%', borderRadius: 2, backgroundColor: t.isDark ? '#0f172a' : '#fff', padding: 4 }}>
                                        <View style={{ width: '80%', height: 2, backgroundColor: t.isDark ? '#475569' : '#cbd5e1', marginBottom: 4 }} />
                                        <View style={{ width: '60%', height: 2, backgroundColor: t.isDark ? '#475569' : '#cbd5e1', marginBottom: 4 }} />
                                        <View style={{ width: '70%', height: 2, backgroundColor: t.isDark ? '#475569' : '#cbd5e1' }} />
                                    </View>
                                </View>
                                <View style={{ position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#1D4171', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: t.isDark ? '#1e293b' : '#fff' }}>
                                    <Ionicons name="checkmark" size={12} color="#fff" />
                                </View>
                            </View>
                            
                            <View style={{ alignItems: isTablet ? 'flex-start' : 'center' }} className="flex-1">
                                <Text style={{ color: t.isDark ? '#f1f5f9' : '#1D4171', textAlign: isTablet ? 'left' : 'center' }} className="font-black text-sm mb-1">
                                    No active visa package found for "{country || selectedCountryLabel.split(' (')[0]}".
                                </Text>
                                <Text style={{ textAlign: isTablet ? 'left' : 'center', color: t.isDark ? '#94a3b8' : '#64748b' }} className="text-[10px] font-bold mb-4">
                                    Please check the spelling or explore other destination options.
                                </Text>
                                
                                <TouchableOpacity
                                    onPress={() => { setShowRequirements(false); handleCountrySelect('UAE (United Arab Emirates)'); }}
                                    className="bg-[#1D4171] px-5 py-3 rounded-xl"
                                >
                                    <Text className="text-white font-black text-[9px] uppercase tracking-widest text-center">Explore Other Destinations</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            )}

            {/* ── WHY CHOOSE GOYAFLY ── */}
            <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="rounded-3xl border shadow-sm p-6 mb-6">
                <Text style={{ color: t.isDark ? '#f1f5f9' : '#1D4171' }} className="font-black text-lg mb-5">Why Choose GoyaFly?</Text>
                <View className="flex-row flex-wrap justify-between">
                    {WHY_CHOOSE.map((item, idx) => (
                        <View 
                            key={idx} 
                            style={{ 
                                width: isTablet ? '23%' : '48%',
                                backgroundColor: t.isDark ? '#1e293b' : '#f9fafb',
                                borderColor: t.cardBorder
                            }} 
                            className="mb-4 p-4 rounded-2xl items-center border"
                        >
                            <View style={{ backgroundColor: t.isDark ? item.iconBgDark : item.iconBg }} className="w-12 h-12 rounded-xl items-center justify-center mb-3 shadow-sm">
                                <Text className="text-2xl">{item.icon}</Text>
                            </View>
                            <Text style={{ color: t.isDark ? '#f1f5f9' : '#1D4171' }} className="font-black text-[11px] text-center mb-1.5">{item.title}</Text>
                            <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="text-[9px] font-bold text-center leading-relaxed">{item.desc}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* ── VISA PACKAGES GRID ── */}
            <View className="mb-6">
                <Text style={{ color: t.isDark ? '#f1f5f9' : '#1D4171' }} className="font-black text-xl mb-5">Popular Packages</Text>
                {loading ? (
                    renderSkeleton()
                ) : visas.length === 0 ? (
                    <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="py-10 border-2 border-dashed items-center rounded-3xl">
                        <Text className="text-5xl mb-3">🛂</Text>
                        <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="font-bold italic text-xs">No active visa packages available at the moment.</Text>
                    </View>
                ) : (
                    <View className="flex-row flex-wrap justify-between">
                        {visas.map(v => (
                            <TouchableOpacity 
                                key={v._id} 
                                onPress={() => handleApply(v, 'visa')}
                                style={{ backgroundColor: t.card, borderColor: t.cardBorder, width: isTablet ? '48%' : '100%' }} 
                                className="rounded-3xl overflow-hidden shadow-md border mb-5 active:scale-[0.98]"
                            >
                                <View style={{ backgroundColor: t.isDark ? '#1e293b' : '#f8fafc' }} className="h-44 justify-center items-center relative">
                                    {v.images?.length > 0 ? (
                                        <Image source={{ uri: `${BASE_URL}${v.images[0]}` }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <View style={{ backgroundColor: t.isDark ? 'rgba(29,65,113,0.3)' : '#1D4171/10' }} className="w-16 h-16 rounded-2xl items-center justify-center">
                                            <Text style={{ color: t.isDark ? '#93c5fd' : '#1D4171' }} className="text-3xl font-black">{v.country?.charAt(0).toUpperCase() || 'V'}</Text>
                                        </View>
                                    )}
                                    <View style={{ backgroundColor: t.isDark ? '#1e3a8a' : '#1D4171' }} className="absolute top-4 right-4 px-3 py-1 rounded-full">
                                        <Text className="text-[9px] font-black text-white tracking-widest uppercase">{v.visaType || v.type || 'E-VISA'}</Text>
                                    </View>
                                </View>
                                <View className="p-5">
                                    <Text style={{ color: t.isDark ? '#f1f5f9' : '#1D4171' }} className="font-black text-lg mb-1">{v.title}</Text>
                                    <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="text-[10px] font-bold uppercase tracking-widest mb-5">⏱ {v.processingTime}</Text>
                                    
                                    <View style={{ borderTopColor: t.isDark ? '#334155' : '#f1f5f9' }} className="flex-row items-center justify-between pt-4 border-t">
                                        <View>
                                            <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="text-[9px] font-black uppercase tracking-widest mb-1">Agent Cost</Text>
                                            <Text style={{ color: t.isDark ? '#f1f5f9' : '#1D4171' }} className="text-2xl font-black leading-none">₹{v.price?.toLocaleString('en-IN')}</Text>
                                        </View>
                                        <View className="px-5 py-3 bg-[#F07E21] rounded-xl border-b-2 border-[#c46215] shadow-md shadow-orange-500/30">
                                            <Text className="text-white font-black text-[10px] tracking-widest uppercase">APPLY NOW</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {renderTrustFooter()}
        </View>
    );

    const renderInsuranceTab = () => (
        <View className="px-5 flex-row flex-wrap justify-between">
            {insurancePlans.length === 0 && !loading && (
                <View style={{ backgroundColor: t.card, borderColor: t.cardBorder, width: '100%' }} className="py-10 border-2 border-dashed items-center rounded-3xl">
                    <Text className="text-5xl mb-3">🛡️</Text>
                    <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="font-bold italic text-xs">No active insurance packages available.</Text>
                </View>
            )}
            {insurancePlans.map(p => (
                <TouchableOpacity 
                    key={p._id || p.id}
                    onPress={() => handleApply(p, 'insurance')}
                    style={{ backgroundColor: t.card, borderColor: t.cardBorder, width: isTablet ? '48%' : '100%' }}
                    className="rounded-3xl border shadow-md p-6 mb-5 overflow-hidden active:scale-[0.98]"
                >
                    {/* Background blob decoration */}
                    <View style={{ backgroundColor: t.isDark ? '#7c2d12' : '#orange-50', opacity: t.isDark ? 0.15 : 0.5 }} className="absolute -top-10 -right-10 w-40 h-40 rounded-full" />
                    
                    <View className="flex-row items-center gap-4 mb-5 relative z-10">
                        {p.images && p.images.length > 0 ? (
                            <Image source={{ uri: `${BASE_URL}${p.images[0]}` }} className="w-16 h-16 rounded-2xl" resizeMode="cover" />
                        ) : (
                            <View style={{ backgroundColor: t.isDark ? 'rgba(29,65,113,0.3)' : '#1D4171/10' }} className="w-16 h-16 rounded-2xl flex items-center justify-center">
                                <Text className="text-3xl">🛡️</Text>
                            </View>
                        )}
                        <View className="flex-1">
                            <Text style={{ color: t.isDark ? '#f1f5f9' : '#1D4171' }} className="text-xl font-black">{p.provider}</Text>
                            <Text className="text-xs text-slate-400 font-bold uppercase tracking-widest">{p.plan}</Text>
                        </View>
                    </View>

                    <View className="space-y-2 mb-6 relative z-10 flex-col gap-2">
                        {p.features.map((f, idx) => (
                            <View key={idx} className="flex-row items-center gap-2">
                                <View style={{ backgroundColor: t.isDark ? '#064e3b' : '#dcfce7' }} className="w-5 h-5 rounded-full flex items-center justify-center">
                                    <Ionicons name="checkmark" size={12} color={t.isDark ? '#4ade80' : '#16a34a'} />
                                </View>
                                <Text style={{ color: t.isDark ? '#cbd5e1' : '#475569' }} className="text-xs font-bold">{f}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={{ borderTopColor: t.isDark ? '#334155' : '#f1f5f9' }} className="flex-row items-end justify-between pt-5 border-t relative z-10">
                        <View>
                            <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="text-[10px] font-black uppercase tracking-widest mb-1">Max Cover</Text>
                            <Text style={{ color: t.isDark ? '#f1f5f9' : '#1D4171' }} className="text-xl font-black leading-none">{p.cover}</Text>
                        </View>
                        <View className="items-end">
                            <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="text-[10px] font-black uppercase tracking-widest mb-1">Starting at</Text>
                            <Text className="text-2xl font-black text-[#F07E21] leading-none">₹{p.price}<Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="text-xs font-bold">/day</Text></Text>
                        </View>
                    </View>
                    
                    <View className="w-full mt-5 py-4 bg-[#F07E21] items-center rounded-xl border-b-4 border-[#c46215] shadow-md shadow-orange-500/30">
                        <Text className="text-white font-black text-[10px] tracking-widest uppercase">SELECT PLAN</Text>
                    </View>
                </TouchableOpacity>
            ))}

            {renderTrustFooter()}
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: Platform.OS === 'ios' ? 44 : 24 }}>
            <StatusBar style={t.isDark ? 'light' : 'dark'} />
            
            <ScrollView 
                className="flex-1" 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); if(activeTab === 'VISA') fetchVisas(); else setRefreshing(false);}} />}
            >
                {/* ── HERO BANNER ── */}
                <View className="px-5 pt-4 pb-6">
                    <View style={{ backgroundColor: t.card, borderColor: t.cardBorder, minHeight: 160, justifyContent: 'center' }} className="relative rounded-3xl overflow-hidden shadow-lg border">
                        {/* Blue left accent */}
                        <LinearGradient
                            colors={['#1D4171', '#2d6cc0']}
                            className="absolute left-0 top-0 bottom-0 w-2 z-10"
                            style={{ borderTopLeftRadius: 24, borderBottomLeftRadius: 24 }}
                        />
                        
                        {/* Text content area */}
                        <View className="relative z-10 p-6 pl-8">
                            <View className="flex-row items-center gap-3 mb-2">
                                <View className="w-12 h-12 bg-[#1D4171] rounded-2xl items-center justify-center shadow-lg shadow-blue-900/30">
                                    <Ionicons name="shield-checkmark" size={24} color="#fff" />
                                </View>
                                <View>
                                    <Text style={{ color: t.isDark ? '#f1f5f9' : '#1D4171' }} className="text-3xl font-black leading-tight">
                                        Visa & <Text className="text-[#F07E21]">Insurance</Text>
                                    </Text>
                                    <Text style={{ color: t.isDark ? '#94a3b8' : '#94a3b8' }} className="font-bold uppercase text-[9px] tracking-widest mt-1">
                                        Global Travel Compliance & Protection
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Background decorations simulating cityscape/passport/plane */}
                        <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%', overflow: 'hidden' }} pointerEvents="none">
                            {/* Sky gradient background */}
                            <LinearGradient
                                colors={t.isDark ? ['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.3)'] : ['rgba(219, 234, 254, 0.45)', 'rgba(248, 250, 252, 0.1)']}
                                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, left: 0 }}
                            />
                            {/* Skyline towers */}
                            <View style={{ position: 'absolute', right: 110, bottom: 0, width: 8, height: 50, borderRadius: 2, backgroundColor: t.isDark ? '#475569' : '#cbd5e1', opacity: 0.6 }} />
                            <View style={{ position: 'absolute', right: 98, bottom: 0, width: 10, height: 75, borderRadius: 2, backgroundColor: t.isDark ? '#334155' : '#94a3b8', opacity: 0.55 }} />
                            <View style={{ position: 'absolute', right: 86, bottom: 0, width: 8, height: 65, borderRadius: 2, backgroundColor: t.isDark ? '#475569' : '#cbd5e1', opacity: 0.7 }} />
                            <View style={{ position: 'absolute', right: 74, bottom: 0, width: 12, height: 85, borderRadius: 3, backgroundColor: t.isDark ? '#334155' : '#64748b', opacity: 0.45 }} />
                            <View style={{ position: 'absolute', right: 62, bottom: 0, width: 10, height: 78, borderRadius: 2, backgroundColor: t.isDark ? '#475569' : '#94a3b8', opacity: 0.55 }} />
                            <View style={{ position: 'absolute', right: 46, bottom: 0, width: 14, height: 95, borderRadius: 3, backgroundColor: t.isDark ? '#334155' : '#475569', opacity: 0.4 }} />
                            <View style={{ position: 'absolute', right: 34, bottom: 0, width: 11, height: 85, borderRadius: 2, backgroundColor: t.isDark ? '#475569' : '#94a3b8', opacity: 0.45 }} />
                            <View style={{ position: 'absolute', right: 24, bottom: 0, width: 8, height: 70, borderRadius: 2, backgroundColor: t.isDark ? '#334155' : '#cbd5e1', opacity: 0.5 }} />
                            <View style={{ position: 'absolute', right: 8, bottom: 0, width: 14, height: 100, borderRadius: 3, backgroundColor: t.isDark ? '#1e293b' : '#475569', opacity: 0.35 }} />
                            
                            {/* Windows */}
                            <View style={{ position: 'absolute', right: 78, bottom: 72, width: 2, height: 2, borderRadius: 0.5, backgroundColor: '#F07E21', opacity: 0.7 }} />
                            <View style={{ position: 'absolute', right: 50, bottom: 80, width: 2, height: 2, borderRadius: 0.5, backgroundColor: '#F07E21', opacity: 0.8 }} />
                            <View style={{ position: 'absolute', right: 54, bottom: 80, width: 2, height: 2, borderRadius: 0.5, backgroundColor: '#F07E21', opacity: 0.5 }} />
                            <View style={{ position: 'absolute', right: 14, bottom: 85, width: 2, height: 2, borderRadius: 0.5, backgroundColor: '#F07E21', opacity: 0.6 }} />

                            {/* Passport illustration */}
                            <View style={{
                                position: 'absolute',
                                right: 58,
                                top: 30,
                                width: 30,
                                height: 42,
                                borderRadius: 4,
                                backgroundColor: '#1D4171',
                                transform: [{ rotate: '8deg' }],
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.15)',
                                padding: 2,
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.2,
                                shadowRadius: 1,
                                elevation: 2,
                            }}>
                                <Text style={{ fontSize: 9 }}>🌐</Text>
                                <Text style={{ fontSize: 4, fontWeight: '900', color: '#fff', letterSpacing: 0.3, marginTop: 1, textAlign: 'center' }}>PASSPORT</Text>
                                <View style={{ width: '80%', height: 1, backgroundColor: 'rgba(255, 255, 255, 0.25)', marginTop: 2 }} />
                            </View>

                            {/* Airplane */}
                            <View style={{
                                position: 'absolute',
                                right: 14,
                                top: 15,
                                transform: [{ rotate: '-12deg' }],
                            }}>
                                <Ionicons name="airplane" size={18} color="#fff" style={{ opacity: 0.95 }} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── TAB SWITCHER ── */}
                <View className="px-5 mb-6">
                    <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="rounded-2xl border shadow-sm p-1.5 flex-row">
                        <TouchableOpacity
                            onPress={() => setActiveTab('VISA')}
                            className={`flex-1 flex-row items-center justify-center py-4 rounded-xl transition-all ${activeTab === 'VISA' ? 'bg-[#1D4171] shadow-lg shadow-blue-900/20' : 'bg-transparent'}`}
                        >
                            <Ionicons name="document" size={16} color={activeTab === 'VISA' ? '#fff' : '#94a3b8'} style={{ marginRight: 6 }} />
                            <Text className={`font-black text-sm tracking-wider ${activeTab === 'VISA' ? 'text-white' : (t.isDark ? 'text-slate-400' : 'text-slate-500')}`}>VISA</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('INSURANCE')}
                            className={`flex-1 flex-row items-center justify-center py-4 rounded-xl transition-all ${activeTab === 'INSURANCE' ? 'bg-[#F07E21] shadow-lg shadow-orange-500/20' : 'bg-transparent'}`}
                        >
                            <Ionicons name="shield-checkmark" size={16} color={activeTab === 'INSURANCE' ? '#fff' : '#94a3b8'} style={{ marginRight: 6 }} />
                            <Text className={`font-black text-sm tracking-wider ${activeTab === 'INSURANCE' ? 'text-white' : (t.isDark ? 'text-slate-400' : 'text-slate-500')}`}>INSURANCE</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── TAB CONTENT ── */}
                {activeTab === 'VISA' ? renderVisaTab() : renderInsuranceTab()}
                <View className="h-10" />
            </ScrollView>

            {/* ── COUNTRY SELECTION MODAL ── */}
            <Modal visible={showCountryModal} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: t.bg, marginTop: Platform.OS === 'ios' ? 44 : 0 }}>
                    <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: t.divider, backgroundColor: t.card }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <TouchableOpacity onPress={() => setShowCountryModal(false)} style={{ padding: 4 }}>
                                <Ionicons name="close" size={28} color={t.text} />
                            </TouchableOpacity>
                            <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: t.text, marginRight: 32 }}>
                                Select Destination
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.input, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: t.inputBorder }}>
                            <Ionicons name="search" size={20} color={t.textMuted} />
                            <TextInput
                                autoFocus
                                value={countrySearch}
                                onChangeText={setCountrySearch}
                                placeholder="Search country..."
                                placeholderTextColor={t.placeholder}
                                style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16, color: t.text, fontWeight: 'bold' }}
                            />
                            {countrySearch.length > 0 && (
                                <TouchableOpacity onPress={() => setCountrySearch('')}>
                                    <Ionicons name="close-circle" size={20} color={t.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    <FlatList
                        data={filteredCountries}
                        keyExtractor={(item) => item}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ padding: 20 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => handleCountrySelect(item)}
                                style={{ paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: t.divider, flexDirection: 'row', alignItems: 'center' }}
                            >
                                <Text className="text-xl mr-4">📍</Text>
                                <Text style={{ fontSize: 16, fontWeight: '800', color: t.text }}>{item}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <Text style={{ color: t.textMuted, fontSize: 16, fontWeight: 'bold' }}>No countries found</Text>
                            </View>
                        }
                    />
                </View>
            </Modal>
        </View>
    );
}
