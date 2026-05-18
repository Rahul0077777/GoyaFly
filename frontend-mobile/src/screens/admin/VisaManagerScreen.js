import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert, TextInput, Modal, Switch, Image } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminService, BASE_URL } from '../../services/api';
import { useThemeColors } from '../../utils/themeColors';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

export default function VisaManagerScreen({ navigation }) {
    const t = useThemeColors();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPkg, setEditingPkg] = useState(null);
    const [formData, setFormData] = useState({
        title: '', country: '', visaType: 'Tourist', processingTime: '', price: '', documentsRequired: '', description: '', isActive: true
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    const fetchPackages = async () => {
        try {
            const res = await adminService.getVisaPackages();
            if (res.success) setPackages(res.data);
        } catch (error) {
            console.error("Visa Manager Fetch Error", error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load visa packages.' });
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
                country: pkg.country || '',
                visaType: pkg.visaType || 'Tourist',
                processingTime: pkg.processingTime || '',
                price: String(pkg.price),
                documentsRequired: (pkg.documentsRequired || []).join(', '),
                description: pkg.description || '',
                isActive: pkg.isActive !== false
            });
            setExistingImages(pkg.images || []);
        } else {
            setEditingPkg(null);
            setFormData({
                title: '', country: '', visaType: 'Tourist', processingTime: '', price: '', documentsRequired: '', description: '', isActive: true
            });
            setExistingImages([]);
        }
        setSelectedFiles([]);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.country || !formData.price) {
            return Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill mandatory fields.' });
        }

        const fd = new FormData();
        fd.append('title', formData.title);
        fd.append('country', formData.country);
        fd.append('visaType', formData.visaType);
        fd.append('processingTime', formData.processingTime);
        fd.append('price', formData.price);
        fd.append('documentsRequired', formData.documentsRequired);
        fd.append('description', formData.description);
        fd.append('isActive', String(formData.isActive));
        
        if (editingPkg) {
            fd.append('existingImages', JSON.stringify(existingImages));
        }

        selectedFiles.forEach((file, index) => {
            fd.append('images', {
                uri: file.uri,
                type: file.mimeType || 'image/jpeg',
                name: file.name || `visa_${index}.jpg`
            });
        });

        try {
            setLoading(true);
            let res;
            if (editingPkg) {
                res = await adminService.updateVisaPackage(editingPkg._id, fd);
            } else {
                res = await adminService.createVisaPackage(fd);
            }
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: `Visa ${editingPkg ? 'updated' : 'created'}!` });
                setIsModalOpen(false);
                fetchPackages();
            }
        } catch (error) {
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
                    const res = await adminService.deleteVisaPackage(id);
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

    if (loading && !refreshing) {
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
                <View className="px-5 py-5 flex-row items-center justify-between border-b border-slate-100 mb-2">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm mr-3.5">
                            <Ionicons name="arrow-back" size={22} color="#0f172a" />
                        </TouchableOpacity>
                        <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center border border-blue-100 shadow-sm mr-3.5">
                            <Ionicons name="card" size={24} color="#1D4171" />
                        </View>
                        <View>
                            <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">Visa Manager</Text>
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Country Base Config</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        onPress={() => handleOpenModal()}
                        className="bg-[#F07E21] px-5 py-3.5 rounded-2xl border border-[#F07E21] border-b-4 border-b-[#D96B18] shadow-lg shadow-orange-500/30 active:scale-95"
                    >
                        <Text className="text-white font-black text-[10px] uppercase tracking-wider">+ New</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    className="flex-1 px-5 pt-2"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F07E21" />}
                >
                    {packages.length === 0 ? (
                        <View className="py-24 items-center">
                            <Ionicons name="document-text-outline" size={64} color="#cbd5e1" className="mb-4" />
                            <Text style={{ color: t.text }} className="font-black text-xl mb-2 tracking-wide">No Visa Packages</Text>
                            <Text className="text-slate-400 font-bold text-xs">Create your first visa package configuration.</Text>
                        </View>
                    ) : (
                        packages.map(pkg => (
                            <View key={pkg._id} style={{ backgroundColor: t.card, elevation: 8 }} className={`p-6 rounded-[2.5rem] border border-slate-100 border-b-[8px] border-slate-200 mb-6 shadow-2xl shadow-slate-300/40 ${!pkg.isActive ? 'opacity-60' : ''}`}>
                                <View className="flex-row justify-between items-start mb-6 pb-4 border-b border-slate-100">
                                    <View className="flex-row items-center flex-1 pr-3">
                                        <View className="w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center mr-4 border border-blue-100 shadow-sm overflow-hidden">
                                            {pkg.images?.[0] ? (
                                                <Image source={{ uri: `${BASE_URL}${pkg.images[0]}` }} className="w-full h-full object-cover" />
                                            ) : (
                                                <Ionicons name="passport" size={28} color="#1D4171" />
                                            )}
                                        </View>
                                        <View className="flex-1">
                                            <Text style={{ color: t.text }} className="text-xl font-black tracking-wide mb-1" numberOfLines={2}>{pkg.title}</Text>
                                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{pkg.country} • {pkg.visaType}</Text>
                                        </View>
                                    </View>
                                    <View className="items-end pl-2">
                                        <Text className="text-[#F07E21] font-black text-xl tracking-tight">₹{pkg.price?.toLocaleString()}</Text>
                                        <Text className="text-[9px] text-slate-400 font-black uppercase tracking-wider mt-0.5">{pkg.processingTime}</Text>
                                    </View>
                                </View>

                                <View className="flex-row gap-3">
                                    <TouchableOpacity 
                                        onPress={() => handleOpenModal(pkg)}
                                        className="flex-1 bg-slate-900 py-4 rounded-2xl items-center border border-slate-900 border-b-4 border-b-slate-800 shadow-md active:scale-95"
                                    >
                                        <Text className="text-white font-black text-xs uppercase tracking-widest">Edit Visa</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => handleDelete(pkg._id)}
                                        className="bg-rose-50 px-5 py-4 rounded-2xl items-center border border-rose-100 border-b-4 border-b-rose-200 shadow-sm active:scale-95 justify-center"
                                    >
                                        <Ionicons name="trash" size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                    <View className="h-10" />
                </ScrollView>
            </SafeAreaView>

            {/* Edit Modal */}
            <Modal visible={isModalOpen} animationType="fade" transparent={true}>
                <View className="flex-1 justify-center bg-black/60 p-5">
                    <View style={{ backgroundColor: t.card, elevation: 24 }} className="rounded-[2.5rem] border border-slate-100 shadow-2xl p-7 max-h-[90%] bg-white">
                        <View className="flex-row justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <Text style={{ color: t.text }} className="text-2xl font-black tracking-wide">{editingPkg ? 'Edit Visa' : 'New Visa'}</Text>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 border-b-4 border-slate-200 active:scale-95 shadow-sm">
                                <Ionicons name="close" size={22} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="space-y-6" showsVerticalScrollIndicator={false}>
                            <View className="space-y-6 pb-2">
                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Package Title *</Text>
                                    <TextInput 
                                        value={formData.title}
                                        onChangeText={text => setFormData({...formData, title: text})}
                                        placeholderTextColor="#9ca3af"
                                        className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-base shadow-inner"
                                        placeholder="e.g. Dubai 30 Days Tourist"
                                    />
                                </View>

                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Country *</Text>
                                        <TextInput 
                                            value={formData.country}
                                            onChangeText={text => setFormData({...formData, country: text})}
                                            placeholderTextColor="#9ca3af"
                                            className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-base shadow-inner"
                                            placeholder="UAE"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Price (₹) *</Text>
                                        <TextInput 
                                            value={formData.price}
                                            onChangeText={text => setFormData({...formData, price: text})}
                                            keyboardType="numeric"
                                            placeholderTextColor="#9ca3af"
                                            className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-base shadow-inner"
                                            placeholder="7500"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Processing Time</Text>
                                    <TextInput 
                                        value={formData.processingTime}
                                        onChangeText={text => setFormData({...formData, processingTime: text})}
                                        placeholderTextColor="#9ca3af"
                                        className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-base shadow-inner"
                                        placeholder="2-3 Working Days"
                                    />
                                </View>

                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Required Docs (Comma separated)</Text>
                                    <TextInput 
                                        value={formData.documentsRequired}
                                        onChangeText={text => setFormData({...formData, documentsRequired: text})}
                                        placeholderTextColor="#9ca3af"
                                        className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-slate-900 text-sm shadow-inner"
                                        placeholder="Passport Copy, Photo, Pan Card"
                                    />
                                </View>

                                <View>
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Reference Images ({selectedFiles.length + existingImages.length}/5)</Text>
                                    <TouchableOpacity 
                                        onPress={handlePickImages}
                                        className="bg-slate-50 p-8 rounded-2xl border-2 border-dashed border-slate-200 items-center active:scale-95 shadow-inner"
                                    >
                                        <Ionicons name="cloud-upload" size={32} color="#94a3b8" className="mb-2" />
                                        <Text className="text-slate-500 font-black text-xs uppercase tracking-widest">Pick Images</Text>
                                    </TouchableOpacity>
                                    
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 pb-2">
                                        {existingImages.map((img, i) => (
                                            <View key={`ex-${i}`} className="mr-3.5 relative shadow-sm">
                                                <Image source={{ uri: `${BASE_URL}${img}` }} className="w-24 h-24 rounded-2xl" />
                                                <TouchableOpacity 
                                                    onPress={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))}
                                                    className="absolute -top-2 -right-2 bg-rose-500 w-7 h-7 rounded-full items-center justify-center border-2 border-white shadow-md active:scale-95"
                                                >
                                                    <Ionicons name="close" size={14} color="#FFF" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                        {selectedFiles.map((file, i) => (
                                            <View key={`new-${i}`} className="mr-3.5 relative shadow-sm">
                                                <Image source={{ uri: file.uri }} className="w-24 h-24 rounded-2xl border-2 border-emerald-500" />
                                                <TouchableOpacity 
                                                    onPress={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                                                    className="absolute -top-2 -right-2 bg-rose-500 w-7 h-7 rounded-full items-center justify-center border-2 border-white shadow-md active:scale-95"
                                                >
                                                    <Ionicons name="close" size={14} color="#FFF" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>

                                <View className="flex-row items-center justify-between bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm mb-4">
                                    <View>
                                        <Text className="font-black text-slate-800 text-base tracking-wide mb-0.5">Active Package</Text>
                                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Make visible to agents</Text>
                                    </View>
                                    <Switch 
                                        value={formData.isActive}
                                        onValueChange={val => setFormData({...formData, isActive: val})}
                                        trackColor={{ false: "#cbd5e1", true: "#F07E21" }}
                                        thumbColor="#FFF"
                                    />
                                </View>

                                <TouchableOpacity 
                                    onPress={handleSave}
                                    className="bg-[#F07E21] py-5 rounded-2xl items-center border border-[#F07E21] border-b-[6px] border-b-[#D96B18] shadow-xl shadow-orange-500/30 active:scale-95 mt-2 mb-2"
                                >
                                    <Text className="text-white font-black text-xs uppercase tracking-widest">{editingPkg ? 'Update' : 'Create'} Package</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
