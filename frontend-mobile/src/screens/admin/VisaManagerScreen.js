import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert, TextInput, Modal, Switch, Image, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminService, BASE_URL } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COMMON_COUNTRIES = [
    { name: 'UAE', emoji: '🇦🇪' }, { name: 'Singapore', emoji: '🇸🇬' }, { name: 'Thailand', emoji: '🇹🇭' },
    { name: 'Malaysia', emoji: '🇲🇾' }, { name: 'USA', emoji: '🇺🇸' }, { name: 'UK', emoji: '🇬🇧' },
    { name: 'Canada', emoji: '🇨🇦' }, { name: 'Australia', emoji: '🇦🇺' }, { name: 'New Zealand', emoji: '🇳🇿' },
    { name: 'Schengen', emoji: '🇪🇺' }, { name: 'Vietnam', emoji: '🇻🇳' }, { name: 'Indonesia', emoji: '🇮🇩' },
    { name: 'Sri Lanka', emoji: '🇱🇰' }, { name: 'Japan', emoji: '🇯🇵' }, { name: 'South Korea', emoji: '🇰🇷' },
    { name: 'China', emoji: '🇨🇳' }, { name: 'Turkey', emoji: '🇹🇷' }, { name: 'Egypt', emoji: '🇪🇬' },
    { name: 'South Africa', emoji: '🇿🇦' }
];

const VISA_TYPES = ['Tourist', 'Business', 'Student', 'Work', 'E-Visa', 'Arrival'];

export default function VisaManagerScreen({ navigation }) {
    const t = useThemeColors();
    const [activeTab, setActiveTab] = useState('VISA'); // 'VISA' | 'INSURANCE'
    
    const [visaPackages, setVisaPackages] = useState([]);
    const [insurancePackages, setInsurancePackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPkg, setEditingPkg] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    const defaultVisaFormData = {
        title: '', country: '', visaType: 'Tourist', processingTime: '', price: '', documentsRequired: '', description: '', isActive: true
    };
    const defaultInsuranceFormData = {
        provider: '', plan: '', price: '', cover: '', features: '', isActive: true
    };

    const [formData, setFormData] = useState(defaultVisaFormData);

    const fetchPackages = async () => {
        try {
            if (activeTab === 'VISA') {
                const res = await adminService.getVisaPackages();
                if (res.success) setVisaPackages(res.data);
            } else {
                const res = await adminService.getInsurancePackages();
                if (res.success) setInsurancePackages(res.data);
            }
        } catch (error) {
            console.error("Manager Fetch Error", error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load packages.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, [activeTab]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPackages();
    };
    
    const handlePickImages = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'image/*',
                multiple: true,
                copyToCacheDirectory: true
            });
            if (!result.canceled) {
                if (selectedFiles.length + existingImages.length + result.assets.length > 5) {
                    return Toast.show({ type: 'error', text1: 'Limit Exceeded', text2: 'Maximum 5 images allowed' });
                }
                setSelectedFiles(prev => [...prev, ...result.assets]);
            }
        } catch (err) {
            console.log("Picker Error", err);
        }
    };

    const handleOpenModal = (pkg = null) => {
        if (pkg) {
            setEditingPkg(pkg);
            if (activeTab === 'VISA') {
                setFormData({
                    title: pkg.title,
                    country: pkg.country || '',
                    visaType: pkg.visaType || 'Tourist',
                    processingTime: pkg.processingTime || '',
                    price: String(pkg.price),
                    documentsRequired: (pkg.documentsRequired || []).join(', '),
                    description: pkg.description || '',
                    isActive: pkg.isActive !== false
                });
            } else {
                setFormData({
                    provider: pkg.provider,
                    plan: pkg.plan,
                    price: String(pkg.price),
                    cover: pkg.cover || '',
                    features: (pkg.features || []).join(', '),
                    isActive: pkg.isActive !== false
                });
            }
            setExistingImages(pkg.images || []);
        } else {
            setEditingPkg(null);
            setFormData(activeTab === 'VISA' ? defaultVisaFormData : defaultInsuranceFormData);
            setExistingImages([]);
        }
        setSelectedFiles([]);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (activeTab === 'VISA') {
                if (!formData.title || !formData.country || !formData.price) {
                    return Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill all required visa fields' });
                }
            } else {
                if (!formData.provider || !formData.plan || !formData.price || !formData.cover) {
                    return Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill all required insurance fields' });
                }
            }

            const fd = new FormData();
            Object.keys(formData).forEach(key => fd.append(key, formData[key]));
            fd.append('existingImages', JSON.stringify(existingImages));

            selectedFiles.forEach(file => {
                fd.append('images', {
                    uri: file.uri,
                    type: file.mimeType || 'image/jpeg',
                    name: file.name || `image_${Date.now()}.jpg`
                });
            });

            if (activeTab === 'VISA') {
                if (editingPkg) {
                    await adminService.updateVisaPackage(editingPkg._id, fd);
                    Toast.show({ type: 'success', text1: 'Success', text2: 'Visa updated successfully' });
                } else {
                    await adminService.createVisaPackage(fd);
                    Toast.show({ type: 'success', text1: 'Success', text2: 'Visa created successfully' });
                }
            } else {
                if (editingPkg) {
                    await adminService.updateInsurancePackage(editingPkg._id, fd);
                    Toast.show({ type: 'success', text1: 'Success', text2: 'Insurance updated successfully' });
                } else {
                    await adminService.createInsurancePackage(fd);
                    Toast.show({ type: 'success', text1: 'Success', text2: 'Insurance created successfully' });
                }
            }

            setIsModalOpen(false);
            fetchPackages();
        } catch (error) {
            console.error("Save Error", error);
            Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Failed to save' });
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            `Delete ${activeTab === 'VISA' ? 'Visa' : 'Insurance'}`,
            'Are you sure you want to delete this package?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (activeTab === 'VISA') await adminService.deleteVisaPackage(id);
                            else await adminService.deleteInsurancePackage(id);
                            Toast.show({ type: 'success', text1: 'Deleted', text2: 'Package has been deleted' });
                            fetchPackages();
                        } catch (error) {
                            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete package' });
                        }
                    }
                }
            ]
        );
    };

    const toggleStatus = async (pkg) => {
        try {
            const fd = new FormData();
            fd.append('isActive', !pkg.isActive);
            fd.append('existingImages', JSON.stringify(pkg.images || []));
            if (activeTab === 'VISA') await adminService.updateVisaPackage(pkg._id, fd);
            else await adminService.updateInsurancePackage(pkg._id, fd);
            fetchPackages();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update status' });
        }
    };

    const removeNewImage = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const renderPackageCard = (pkg) => {
        const isVisa = activeTab === 'VISA';
        const cardBg = t.isDark ? '#1e293b' : '#ffffff';
        const borderColor = t.isDark ? '#334155' : '#f1f5f9';
        const emoji = isVisa ? (COMMON_COUNTRIES.find(c => c.name === pkg.country)?.emoji || '🌍') : '🛡️';
        
        return (
            <View key={pkg._id} style={{ backgroundColor: cardBg, borderColor, elevation: 2 }} className="rounded-3xl border mb-5 overflow-hidden">
                <View className="h-40 bg-slate-50 relative justify-center items-center">
                    {pkg.images?.length > 0 ? (
                        <Image source={{ uri: `${BASE_URL}${pkg.images[0]}` }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <View style={{ backgroundColor: t.isDark ? 'rgba(29,65,113,0.3)' : '#f1f5f9' }} className="w-20 h-20 rounded-3xl justify-center items-center">
                            <Text className="text-4xl">{emoji}</Text>
                        </View>
                    )}
                    <View className="absolute top-3 right-3 px-3 py-1 bg-black/60 rounded-full">
                        <Text className="text-white text-[10px] font-black uppercase tracking-widest">{pkg.isActive ? 'Active' : 'Inactive'}</Text>
                    </View>
                    <View className="absolute top-3 left-3 px-3 py-1 bg-white/90 rounded-full">
                        <Text className="text-[#1D4171] text-[10px] font-black uppercase tracking-widest">{isVisa ? pkg.country : 'Insurance'}</Text>
                    </View>
                </View>

                <View className="p-5">
                    <Text style={{ color: t.isDark ? '#f1f5f9' : '#1D4171' }} className="text-xl font-black mb-1">
                        {isVisa ? pkg.title : `${pkg.provider} - ${pkg.plan}`}
                    </Text>
                    <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="text-[10px] font-bold uppercase tracking-widest mb-4">
                        {isVisa ? `${pkg.visaType} • ${pkg.processingTime}` : `Max Cover: ${pkg.cover}`}
                    </Text>

                    <View style={{ backgroundColor: t.isDark ? '#0f172a' : '#f8fafc' }} className="p-4 rounded-2xl mb-4 flex-row justify-between items-center">
                        <Text style={{ color: t.isDark ? '#94a3b8' : '#64748b' }} className="text-[10px] font-black uppercase tracking-widest">{isVisa ? 'Agent Price' : 'Price / Day'}</Text>
                        <Text style={{ color: t.isDark ? '#f1f5f9' : '#1D4171' }} className="text-xl font-black">₹{pkg.price}</Text>
                    </View>

                    <View className="flex-row gap-3">
                        <TouchableOpacity onPress={() => toggleStatus(pkg)} style={{ backgroundColor: pkg.isActive ? (t.isDark ? '#451a03' : '#fffbeb') : (t.isDark ? '#064e3b' : '#f0fdf4') }} className="flex-1 py-3 rounded-xl justify-center items-center">
                            <Text style={{ color: pkg.isActive ? '#d97706' : '#16a34a' }} className="text-[10px] font-black uppercase tracking-widest">{pkg.isActive ? 'Deactivate' : 'Activate'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleOpenModal(pkg)} style={{ backgroundColor: t.isDark ? '#334155' : '#1D4171' }} className="flex-1 py-3 rounded-xl justify-center items-center">
                            <Text className="text-white text-[10px] font-black uppercase tracking-widest">Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(pkg._id)} style={{ backgroundColor: t.isDark ? '#7f1d1d' : '#fef2f2' }} className="py-3 px-4 rounded-xl justify-center items-center">
                            <Ionicons name="trash" size={16} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const currentPackages = activeTab === 'VISA' ? visaPackages : insurancePackages;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
            <StatusBar style={t.isDark ? 'light' : 'dark'} />
            
            {/* Header */}
            <View className="px-5 py-4 flex-row justify-between items-center bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-full items-center justify-center mr-3">
                        <Ionicons name="arrow-back" size={20} color={t.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={{ color: t.text }} className="text-xl font-black">Visa & Insurance</Text>
                        <Text style={{ color: t.textMuted }} className="text-[10px] font-bold uppercase tracking-widest">Manage Packages</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => handleOpenModal()} className="bg-[#1D4171] px-4 py-2.5 rounded-xl shadow-md shadow-blue-900/20">
                    <Text className="text-white font-black text-[10px] uppercase tracking-widest">+ ADD NEW</Text>
                </TouchableOpacity>
            </View>

            {/* TAB SWITCHER */}
            <View className="px-5 py-4">
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

            <ScrollView 
                contentContainerStyle={{ padding: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#1D4171" style={{ marginTop: 50 }} />
                ) : currentPackages.length === 0 ? (
                    <View style={{ backgroundColor: t.card, borderColor: t.cardBorder }} className="py-16 items-center border-2 border-dashed rounded-3xl mt-4">
                        <Text className="text-6xl mb-4">{activeTab === 'VISA' ? '🛂' : '🛡️'}</Text>
                        <Text style={{ color: t.textMuted }} className="font-bold text-center text-sm">No {activeTab.toLowerCase()} packages found.</Text>
                    </View>
                ) : (
                    currentPackages.map(pkg => renderPackageCard(pkg))
                )}
            </ScrollView>

            {/* Create/Edit Modal */}
            <Modal visible={isModalOpen} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: t.bg, height: '90%', borderTopLeftRadius: 30, borderTopRightRadius: 30 }} className="shadow-2xl">
                        <View style={{ backgroundColor: t.card, borderBottomColor: t.cardBorder }} className="px-6 py-5 flex-row justify-between items-center border-b border-t-2 border-t-transparent rounded-t-3xl">
                            <View>
                                <Text style={{ color: t.text }} className="text-2xl font-black">{editingPkg ? 'Edit' : 'New'} {activeTab === 'VISA' ? 'Visa' : 'Insurance'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)} style={{ backgroundColor: t.isDark ? '#334155' : '#f1f5f9' }} className="w-10 h-10 rounded-full justify-center items-center">
                                <Ionicons name="close" size={20} color={t.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                            {activeTab === 'VISA' ? (
                                <>
                                    <View className="mb-5">
                                        <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Visa Title *</Text>
                                        <TextInput 
                                            value={formData.title} onChangeText={(text) => setFormData({...formData, title: text})}
                                            style={{ backgroundColor: t.input, color: t.text, borderColor: t.inputBorder }}
                                            className="px-5 py-4 rounded-2xl font-bold border" placeholder="e.g., UAE Tourist Visa" placeholderTextColor={t.placeholder}
                                        />
                                    </View>
                                    <View className="mb-5 flex-row gap-4">
                                        <View className="flex-1">
                                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Country *</Text>
                                            <TextInput 
                                                value={formData.country} onChangeText={(text) => setFormData({...formData, country: text})}
                                                style={{ backgroundColor: t.input, color: t.text, borderColor: t.inputBorder }}
                                                className="px-5 py-4 rounded-2xl font-bold border" placeholder="e.g., UAE" placeholderTextColor={t.placeholder}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Process Time *</Text>
                                            <TextInput 
                                                value={formData.processingTime} onChangeText={(text) => setFormData({...formData, processingTime: text})}
                                                style={{ backgroundColor: t.input, color: t.text, borderColor: t.inputBorder }}
                                                className="px-5 py-4 rounded-2xl font-bold border" placeholder="e.g., 3-5 Days" placeholderTextColor={t.placeholder}
                                            />
                                        </View>
                                    </View>
                                    <View className="mb-5 flex-row gap-4">
                                        <View className="flex-1">
                                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Price (₹) *</Text>
                                            <TextInput 
                                                value={formData.price} onChangeText={(text) => setFormData({...formData, price: text})}
                                                keyboardType="numeric"
                                                style={{ backgroundColor: t.input, color: t.text, borderColor: t.inputBorder }}
                                                className="px-5 py-4 rounded-2xl font-bold border" placeholder="5000" placeholderTextColor={t.placeholder}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Visa Type</Text>
                                            <TextInput 
                                                value={formData.visaType} onChangeText={(text) => setFormData({...formData, visaType: text})}
                                                style={{ backgroundColor: t.input, color: t.text, borderColor: t.inputBorder }}
                                                className="px-5 py-4 rounded-2xl font-bold border" placeholder="Tourist" placeholderTextColor={t.placeholder}
                                            />
                                        </View>
                                    </View>
                                    <View className="mb-5">
                                        <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Documents Required (comma separated)</Text>
                                        <TextInput 
                                            value={formData.documentsRequired} onChangeText={(text) => setFormData({...formData, documentsRequired: text})}
                                            multiline numberOfLines={3}
                                            style={{ backgroundColor: t.input, color: t.text, borderColor: t.inputBorder, height: 80, textAlignVertical: 'top' }}
                                            className="px-5 py-4 rounded-2xl font-bold border" placeholder="Passport, Photo..." placeholderTextColor={t.placeholder}
                                        />
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View className="mb-5 flex-row gap-4">
                                        <View className="flex-1">
                                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Provider *</Text>
                                            <TextInput 
                                                value={formData.provider} onChangeText={(text) => setFormData({...formData, provider: text})}
                                                style={{ backgroundColor: t.input, color: t.text, borderColor: t.inputBorder }}
                                                className="px-5 py-4 rounded-2xl font-bold border" placeholder="e.g., TATA AIG" placeholderTextColor={t.placeholder}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Plan Name *</Text>
                                            <TextInput 
                                                value={formData.plan} onChangeText={(text) => setFormData({...formData, plan: text})}
                                                style={{ backgroundColor: t.input, color: t.text, borderColor: t.inputBorder }}
                                                className="px-5 py-4 rounded-2xl font-bold border" placeholder="e.g., Travel Guard" placeholderTextColor={t.placeholder}
                                            />
                                        </View>
                                    </View>
                                    <View className="mb-5 flex-row gap-4">
                                        <View className="flex-1">
                                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Daily Price (₹) *</Text>
                                            <TextInput 
                                                value={formData.price} onChangeText={(text) => setFormData({...formData, price: text})}
                                                keyboardType="numeric"
                                                style={{ backgroundColor: t.input, color: t.text, borderColor: t.inputBorder }}
                                                className="px-5 py-4 rounded-2xl font-bold border" placeholder="45" placeholderTextColor={t.placeholder}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Max Cover *</Text>
                                            <TextInput 
                                                value={formData.cover} onChangeText={(text) => setFormData({...formData, cover: text})}
                                                style={{ backgroundColor: t.input, color: t.text, borderColor: t.inputBorder }}
                                                className="px-5 py-4 rounded-2xl font-bold border" placeholder="₹50,000" placeholderTextColor={t.placeholder}
                                            />
                                        </View>
                                    </View>
                                    <View className="mb-5">
                                        <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Features (comma separated)</Text>
                                        <TextInput 
                                            value={formData.features} onChangeText={(text) => setFormData({...formData, features: text})}
                                            multiline numberOfLines={3}
                                            style={{ backgroundColor: t.input, color: t.text, borderColor: t.inputBorder, height: 80, textAlignVertical: 'top' }}
                                            className="px-5 py-4 rounded-2xl font-bold border" placeholder="Medical, Baggage..." placeholderTextColor={t.placeholder}
                                        />
                                    </View>
                                </>
                            )}

                            {/* Image Picker */}
                            <View className="mb-6">
                                <Text style={{ color: t.textMuted }} className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Images (Max 5)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-3">
                                    {existingImages.map((img, i) => (
                                        <View key={i} className="relative w-20 h-20 rounded-xl overflow-hidden mr-3">
                                            <Image source={{ uri: `${BASE_URL}${img}` }} className="w-full h-full" />
                                            <TouchableOpacity onPress={() => removeExistingImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full items-center justify-center">
                                                <Ionicons name="close" size={14} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    {selectedFiles.map((file, i) => (
                                        <View key={`new-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden mr-3">
                                            <Image source={{ uri: file.uri }} className="w-full h-full" />
                                            <TouchableOpacity onPress={() => removeNewImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full items-center justify-center">
                                                <Ionicons name="close" size={14} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    {(selectedFiles.length + existingImages.length) < 5 && (
                                        <TouchableOpacity onPress={handlePickImages} style={{ backgroundColor: t.input, borderColor: t.inputBorder }} className="w-20 h-20 rounded-xl border border-dashed justify-center items-center">
                                            <Ionicons name="add" size={24} color={t.textMuted} />
                                        </TouchableOpacity>
                                    )}
                                </ScrollView>
                            </View>

                            <View style={{ backgroundColor: t.input, borderColor: t.inputBorder }} className="p-5 rounded-2xl border flex-row justify-between items-center mb-10">
                                <Text style={{ color: t.text }} className="font-black text-sm">Package is Active</Text>
                                <Switch value={formData.isActive} onValueChange={(val) => setFormData({...formData, isActive: val})} />
                            </View>

                            <TouchableOpacity onPress={handleSave} className="bg-[#1D4171] py-4 rounded-2xl items-center shadow-lg shadow-blue-900/30">
                                <Text className="text-white font-black text-xs uppercase tracking-widest">SAVE PACKAGE</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
