import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert, TextInput, Modal, Switch, Image, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminService, BASE_URL } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

const ALL_DESTINATIONS = [
    { name: 'Goa', country: 'India', emoji: '🏖️' }, { name: 'Rajasthan', country: 'India', emoji: '🏰' }, { name: 'Kerala', country: 'India', emoji: '🌴' },
    { name: 'Kashmir', country: 'India', emoji: '🏔️' }, { name: 'Manali', country: 'India', emoji: '⛰️' }, { name: 'Shimla', country: 'India', emoji: '🌲' },
    { name: 'Ladakh', country: 'India', emoji: '🏔️' }, { name: 'Andaman', country: 'India', emoji: '🏝️' }, { name: 'Dubai', country: 'UAE', emoji: '🏙️' },
    { name: 'Bali', country: 'Indonesia', emoji: '🌺' }, { name: 'Bangkok', country: 'Thailand', emoji: '🏙️' }, { name: 'Singapore', country: 'Singapore', emoji: '🦁' },
    { name: 'Maldives', country: 'Maldives', emoji: '🏝️' }, { name: 'Paris', country: 'France', emoji: '🗼' }, { name: 'London', country: 'UK', emoji: '🎡' },
    { name: 'Switzerland', country: 'Switzerland', emoji: '🏔️' }, { name: 'Rome', country: 'Italy', emoji: '🏛️' }, { name: 'New York', country: 'USA', emoji: '🗽' },
    { name: 'Sydney', country: 'Australia', emoji: '🦘' }, { name: 'Tokyo', country: 'Japan', emoji: '🗼' }, { name: 'Sri Lanka', country: 'Sri Lanka', emoji: '🍃' }
];

const CATEGORIES = ['Luxury', 'Budget', 'Premium', 'Honeymoon', 'Family', 'Adventure', 'Pilgrimage'];

export default function HolidayManagerScreen({ navigation }) {
    const t = useThemeColors();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPkg, setEditingPkg] = useState(null);
    const [formData, setFormData] = useState({
        title: '', pkgId: '', days: '', price: '', highlights: '', destination: '', description: '', category: 'Luxury', isActive: true
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    const fetchPackages = async () => {
        try {
            const res = await adminService.getHolidayPackages();
            if (res.success) setPackages(res.data);
        } catch (error) {
            console.error("Holiday Manager Fetch Error", error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load holiday packages.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

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
                if (selectedFiles.length + existingImages.length + result.assets.length > 10) {
                    return Toast.show({ type: 'error', text1: 'Limit Exceeded', text2: 'Maximum 10 images allowed' });
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
            setFormData({
                title: pkg.title,
                pkgId: pkg.pkgId,
                days: pkg.days,
                price: String(pkg.price),
                highlights: (pkg.highlights || []).join(', '),
                destination: pkg.destination || '',
                description: pkg.description || '',
                category: pkg.category || 'Luxury',
                isActive: pkg.isActive !== false
            });
            setExistingImages(pkg.images || []);
        } else {
            setEditingPkg(null);
            setFormData({
                title: '', pkgId: '', days: '', price: '', highlights: '', destination: '', description: '', category: 'Luxury', isActive: true
            });
            setExistingImages([]);
        }
        setSelectedFiles([]);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.pkgId || !formData.price) {
            return Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill mandatory fields.' });
        }

        const fd = new FormData();
        fd.append('title', formData.title);
        fd.append('pkgId', formData.pkgId.toUpperCase());
        fd.append('days', formData.days);
        fd.append('price', formData.price);
        fd.append('highlights', formData.highlights);
        fd.append('destination', formData.destination);
        fd.append('description', formData.description);
        fd.append('category', formData.category);
        fd.append('isActive', String(formData.isActive));
        
        if (editingPkg) {
            fd.append('existingImages', JSON.stringify(existingImages));
        }

        selectedFiles.forEach((file, index) => {
            fd.append('images', {
                uri: file.uri,
                type: file.mimeType || 'image/jpeg',
                name: file.name || `image_${index}.jpg`
            });
        });

        try {
            setLoading(true);
            let res;
            if (editingPkg) {
                res = await adminService.updateHolidayPackage(editingPkg._id, fd);
            } else {
                res = await adminService.createHolidayPackage(fd);
            }

            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: `Package ${editingPkg ? 'updated' : 'created'}!` });
                setIsModalOpen(false);
                fetchPackages();
            }
        } catch (error) {
            console.error("Save Error", error);
            Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Save failed.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert("Delete Package?", "This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                setLoading(true);
                try {
                    const res = await adminService.deleteHolidayPackage(id);
                    if (res.success) {
                        Toast.show({ type: 'success', text1: 'Deleted', text2: 'Package removed.' });
                        fetchPackages();
                    }
                } catch (err) {
                    Toast.show({ type: 'error', text1: 'Error', text2: 'Delete failed.' });
                    setLoading(false);
                }
            }}
        ]);
    };

    const handleToggleActive = async (pkg) => {
        try {
            const fd = new FormData();
            fd.append('isActive', String(!pkg.isActive));
            fd.append('existingImages', JSON.stringify(pkg.images || []));
            await adminService.updateHolidayPackage(pkg._id, fd);
            fetchPackages();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update status' });
        }
    };

    const getDestEmoji = (pkg) => {
        const dest = ALL_DESTINATIONS.find(d => d.name.toLowerCase() === pkg.destination?.toLowerCase());
        return dest ? dest.emoji : '🌴';
    };

    const activeCount = packages.filter(p => p.isActive).length;
    const avgPrice = packages.length ? Math.round(packages.reduce((s, p) => s + p.price, 0) / packages.length) : 0;

    if (loading && !refreshing && packages.length === 0) {
        return (
            <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#F07E21" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="mx-4 mt-2 mb-4 p-4 flex-row items-center bg-white rounded-3xl border border-slate-100 border-b-[6px] border-b-slate-200 shadow-xl shadow-slate-300/40">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-200 active:scale-95 mr-3">
                        <Ionicons name="arrow-back" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="bg-orange-50 w-12 h-12 rounded-2xl items-center justify-center border border-orange-100 shadow-sm mr-3">
                        <Ionicons name="earth" size={24} color="#F07E21" />
                    </View>
                    <View className="flex-1 pr-1">
                        <Text style={{ color: t.text }} className="text-xl sm:text-2xl font-black tracking-wide" numberOfLines={1} adjustsFontSizeToFit>Holiday Manager</Text>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5" numberOfLines={1}>Package Engine</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleOpenModal()} className="bg-slate-900 w-12 h-12 rounded-2xl items-center justify-center border border-slate-800 border-b-4 border-b-slate-950 active:scale-95 shadow-md">
                        <Ionicons name="add" size={26} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    className="flex-1"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F07E21" />}
                >
                    {/* Stats Row */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-4">
                        <View className="bg-white px-5 py-4 rounded-3xl border border-slate-100 border-b-[4px] border-b-slate-200 mr-3 shadow-sm flex-row items-center gap-4">
                            <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center"><Text className="text-lg">📦</Text></View>
                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total</Text>
                                <Text className="text-xl font-black text-slate-900">{packages.length}</Text>
                            </View>
                        </View>
                        <View className="bg-white px-5 py-4 rounded-3xl border border-slate-100 border-b-[4px] border-b-slate-200 mr-3 shadow-sm flex-row items-center gap-4">
                            <View className="w-10 h-10 rounded-xl bg-emerald-100 items-center justify-center"><Text className="text-lg">✅</Text></View>
                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Active</Text>
                                <Text className="text-xl font-black text-slate-900">{activeCount}</Text>
                            </View>
                        </View>
                        <View className="bg-white px-5 py-4 rounded-3xl border border-slate-100 border-b-[4px] border-b-slate-200 mr-3 shadow-sm flex-row items-center gap-4">
                            <View className="w-10 h-10 rounded-xl bg-amber-100 items-center justify-center"><Text className="text-lg">💰</Text></View>
                            <View className="pr-4">
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Avg Price</Text>
                                <Text className="text-xl font-black text-slate-900">₹{avgPrice.toLocaleString()}</Text>
                            </View>
                        </View>
                    </ScrollView>

                    {packages.length === 0 ? (
                        <View className="py-24 items-center px-5">
                            <Ionicons name="images-outline" size={64} color="#cbd5e1" className="mb-4" />
                            <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Holiday Packages</Text>
                            <Text className="text-slate-400 font-bold text-xs">Create your first package to get started.</Text>
                        </View>
                    ) : (
                        <View className="px-4">
                            {packages.map(pkg => (
                                <View key={pkg._id} style={{ backgroundColor: t.card, elevation: 8 }} className={`p-0 rounded-3xl border border-slate-100 border-b-[8px] border-slate-200 mb-6 shadow-2xl shadow-slate-300/40 overflow-hidden ${!pkg.isActive ? 'opacity-60' : ''}`}>
                                    {/* Image Header */}
                                    <View className="h-56 bg-slate-100 relative">
                                        {pkg.images?.[0] ? (
                                            <Image source={{ uri: `${BASE_URL}${pkg.images[0]}` }} className="w-full h-full object-cover" />
                                        ) : (
                                            <View className="flex-1 items-center justify-center bg-slate-50">
                                                <Text style={{ fontSize: 64 }}>{getDestEmoji(pkg)}</Text>
                                            </View>
                                        )}
                                        
                                        {/* Badges */}
                                        <View className="absolute top-4 left-4 bg-white/90 px-3.5 py-1.5 rounded-xl shadow-md backdrop-blur-md">
                                            <Text className="text-[10px] font-black text-blue-600 uppercase tracking-wider">{pkg.pkgId}</Text>
                                        </View>
                                        
                                        <View className={`absolute top-4 right-4 px-3.5 py-1.5 rounded-xl shadow-md backdrop-blur-md ${pkg.isActive ? 'bg-emerald-500/90' : 'bg-slate-500/90'}`}>
                                            <Text className="text-[10px] font-black text-white uppercase tracking-widest">{pkg.isActive ? 'Live' : 'Draft'}</Text>
                                        </View>

                                        {pkg.images?.length > 1 && (
                                            <View className="absolute bottom-3 right-3 bg-black/60 px-2.5 py-1 rounded-xl backdrop-blur-md">
                                                <Text className="text-white text-[9px] font-black tracking-widest">+{pkg.images.length - 1} PHOTOS</Text>
                                            </View>
                                        )}
                                    </View>
                                    
                                    {/* Card Body */}
                                    <View className="p-6">
                                        <View className="flex-row justify-between items-start mb-4">
                                            <View className="flex-1 pr-3">
                                                <Text style={{ color: t.text }} className="text-xl font-black tracking-wide leading-tight mb-1">{pkg.title}</Text>
                                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{pkg.destination ? `${pkg.destination} • ` : ''}{pkg.category} • {pkg.days}</Text>
                                            </View>
                                        </View>

                                        {/* Highlights Preview */}
                                        <View className="flex-row flex-wrap gap-1.5 mb-5">
                                            {(pkg.highlights || []).slice(0, 3).map(h => (
                                                <View key={h} className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                                    <Text className="text-[9px] font-black uppercase tracking-wider text-slate-500">{h}</Text>
                                                </View>
                                            ))}
                                            {(pkg.highlights || []).length > 3 && (
                                                <View className="px-2 py-1">
                                                    <Text className="text-[9px] font-black text-slate-400">+{pkg.highlights.length - 3} more</Text>
                                                </View>
                                            )}
                                        </View>

                                        <View className="bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-200 flex-row justify-between items-center mb-5">
                                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent Price</Text>
                                            <Text className="text-xl font-black text-slate-900 tracking-tight">₹{pkg.price?.toLocaleString()}</Text>
                                        </View>

                                        {/* Actions */}
                                        <View className="flex-row gap-3 mt-1">
                                            <TouchableOpacity 
                                                onPress={() => handleToggleActive(pkg)}
                                                className={`flex-[1.5] py-4 rounded-2xl items-center border shadow-sm active:scale-95 justify-center ${pkg.isActive ? 'bg-amber-50 border-amber-100 border-b-4 border-b-amber-200' : 'bg-emerald-50 border-emerald-100 border-b-4 border-b-emerald-200'}`}
                                            >
                                                <Text className={`font-black text-[10px] uppercase tracking-widest ${pkg.isActive ? 'text-amber-600' : 'text-emerald-600'}`}>{pkg.isActive ? 'Deactivate' : 'Activate'}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                onPress={() => handleOpenModal(pkg)}
                                                className="flex-1 bg-slate-900 py-4 rounded-2xl items-center border border-slate-900 border-b-4 border-b-slate-800 shadow-md active:scale-95"
                                            >
                                                <Text className="text-white font-black text-[10px] uppercase tracking-widest">Edit</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                onPress={() => handleDelete(pkg._id)}
                                                className="bg-rose-50 px-5 py-4 rounded-2xl items-center border border-rose-100 border-b-4 border-b-rose-200 shadow-sm active:scale-95 justify-center"
                                            >
                                                <Ionicons name="trash" size={16} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                    <View className="h-10" />
                </ScrollView>
            </SafeAreaView>

            {/* Edit Modal */}
            <Modal visible={isModalOpen} animationType="slide" transparent={false}>
                <SafeAreaView className="flex-1 bg-white">
                    <View className="px-5 py-5 flex-row justify-between items-center border-b border-slate-100 shadow-sm mb-2">
                        <View>
                            <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">{editingPkg ? 'Edit Package' : 'New Package'}</Text>
                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure holiday experience</Text>
                        </View>
                        <TouchableOpacity onPress={() => setIsModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm">
                            <Ionicons name="close" size={22} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="p-5 space-y-6" showsVerticalScrollIndicator={false}>
                        <View className="space-y-6">
                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Package Title *</Text>
                                <TextInput 
                                    value={formData.title} onChangeText={text => setFormData({...formData, title: text})}
                                    placeholderTextColor="#9ca3af" placeholder="e.g. Goa 4 Nights Luxury"
                                    className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-lg shadow-inner"
                                />
                            </View>

                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Package ID *</Text>
                                    <TextInput 
                                        value={formData.pkgId} onChangeText={text => setFormData({...formData, pkgId: text.toUpperCase()})}
                                        placeholderTextColor="#9ca3af" placeholder="PK-101" editable={!editingPkg}
                                        className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-base shadow-inner"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Price (₹) *</Text>
                                    <TextInput 
                                        value={formData.price} onChangeText={text => setFormData({...formData, price: text})}
                                        keyboardType="numeric" placeholderTextColor="#9ca3af" placeholder="25000"
                                        className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-base shadow-inner"
                                    />
                                </View>
                            </View>

                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Duration *</Text>
                                    <TextInput 
                                        value={formData.days} onChangeText={text => setFormData({...formData, days: text})}
                                        placeholderTextColor="#9ca3af" placeholder="4N/5D"
                                        className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-base shadow-inner"
                                    />
                                </View>
                                <View className="flex-[1.5]">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Destination *</Text>
                                    <TextInput 
                                        value={formData.destination} onChangeText={text => setFormData({...formData, destination: text})}
                                        placeholderTextColor="#9ca3af" placeholder="e.g. Dubai"
                                        className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-base shadow-inner"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Category</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {CATEGORIES.map(cat => (
                                        <TouchableOpacity 
                                            key={cat} onPress={() => setFormData({...formData, category: cat})}
                                            className={`px-4 py-3 mr-2 rounded-xl border border-b-4 active:scale-95 shadow-sm ${formData.category === cat ? 'bg-[#1D4171] border-[#15305B] border-b-[#0f2342]' : 'bg-white border-slate-100 border-b-slate-200'}`}
                                        >
                                            <Text className={`font-black text-[10px] uppercase tracking-widest ${formData.category === cat ? 'text-white' : 'text-slate-400'}`}>{cat}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Images ({selectedFiles.length + existingImages.length}/10)</Text>
                                <TouchableOpacity onPress={handlePickImages} disabled={selectedFiles.length + existingImages.length >= 10}
                                    className="bg-slate-50 py-8 rounded-2xl border-2 border-dashed border-slate-200 items-center active:scale-95 shadow-inner"
                                >
                                    <Ionicons name="cloud-upload" size={32} color="#94a3b8" className="mb-2" />
                                    <Text className="text-slate-500 font-black text-xs uppercase tracking-widest">Pick Photos</Text>
                                </TouchableOpacity>
                                
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 pb-2">
                                    {existingImages.map((img, i) => (
                                        <View key={`ex-${i}`} className="mr-3.5 relative shadow-sm">
                                            <Image source={{ uri: `${BASE_URL}${img}` }} className="w-24 h-24 rounded-2xl" />
                                            <TouchableOpacity onPress={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))}
                                                className="absolute -top-2 -right-2 bg-rose-500 w-7 h-7 rounded-full items-center justify-center border-2 border-white shadow-md active:scale-95">
                                                <Ionicons name="close" size={14} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    {selectedFiles.map((file, i) => (
                                        <View key={`new-${i}`} className="mr-3.5 relative shadow-sm">
                                            <Image source={{ uri: file.uri }} className="w-24 h-24 rounded-2xl border-2 border-emerald-500" />
                                            <TouchableOpacity onPress={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                                                className="absolute -top-2 -right-2 bg-rose-500 w-7 h-7 rounded-full items-center justify-center border-2 border-white shadow-md active:scale-95">
                                                <Ionicons name="close" size={14} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>

                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Highlights (Comma separated)</Text>
                                <TextInput 
                                    value={formData.highlights} onChangeText={text => setFormData({...formData, highlights: text})}
                                    multiline placeholderTextColor="#9ca3af" placeholder="5 Star Hotel, Buffet, Sightseeing"
                                    className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-sm h-28 shadow-inner"
                                />
                            </View>

                            <View>
                                <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Description / Itinerary</Text>
                                <TextInput 
                                    value={formData.description} onChangeText={text => setFormData({...formData, description: text})}
                                    multiline placeholderTextColor="#9ca3af" placeholder="Full details of the tour..."
                                    className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-sm h-40 shadow-inner"
                                />
                            </View>

                            <View className="flex-row items-center justify-between bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-10 shadow-sm">
                                <View>
                                    <Text className="font-black text-slate-800 text-base tracking-wide mb-0.5">Publish Package</Text>
                                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Make visible to agents</Text>
                                </View>
                                <Switch 
                                    value={formData.isActive} onValueChange={val => setFormData({...formData, isActive: val})}
                                    trackColor={{ false: "#cbd5e1", true: "#F07E21" }} thumbColor="#FFF"
                                />
                            </View>
                        </View>
                    </ScrollView>

                    <View className="p-5 border-t border-slate-100 bg-white">
                        <TouchableOpacity 
                            onPress={handleSave} disabled={loading}
                            className="bg-[#F07E21] py-5 rounded-2xl items-center border border-[#F07E21] border-b-[6px] border-b-[#D96B18] shadow-xl shadow-orange-500/30 active:scale-95"
                        >
                            <Text className="text-white font-black text-xs uppercase tracking-widest">{editingPkg ? 'Update' : 'Create'} Package</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </View>
    );
}
