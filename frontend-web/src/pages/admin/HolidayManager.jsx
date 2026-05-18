import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ALL_DESTINATIONS = [
    // India (30)
    { name: 'Goa', country: 'India', emoji: '🏖️' },
    { name: 'Rajasthan', country: 'India', emoji: '🏰' },
    { name: 'Kerala', country: 'India', emoji: '🌴' },
    { name: 'Kashmir', country: 'India', emoji: '🏔️' },
    { name: 'Manali', country: 'India', emoji: '⛰️' },
    { name: 'Shimla', country: 'India', emoji: '🌲' },
    { name: 'Ladakh', country: 'India', emoji: '🏔️' },
    { name: 'Andaman', country: 'India', emoji: '🏝️' },
    { name: 'Darjeeling', country: 'India', emoji: '🍵' },
    { name: 'Rishikesh', country: 'India', emoji: '🧘' },
    { name: 'Varanasi', country: 'India', emoji: '🛕' },
    { name: 'Udaipur', country: 'India', emoji: '🏰' },
    { name: 'Jaipur', country: 'India', emoji: '🏰' },
    { name: 'Ooty', country: 'India', emoji: '🌿' },
    { name: 'Munnar', country: 'India', emoji: '🍃' },
    { name: 'Leh', country: 'India', emoji: '🏔️' },
    { name: 'Coorg', country: 'India', emoji: '☕' },
    { name: 'Meghalaya', country: 'India', emoji: '🌧️' },
    { name: 'Agra', country: 'India', emoji: '🕌' },
    { name: 'Delhi', country: 'India', emoji: '🏛️' },
    { name: 'Mumbai', country: 'India', emoji: '🏙️' },
    { name: 'Kolkata', country: 'India', emoji: '🌉' },
    { name: 'Bangalore', country: 'India', emoji: '💻' },
    { name: 'Hyderabad', country: 'India', emoji: '🏰' },
    { name: 'Chennai', country: 'India', emoji: '🛕' },
    { name: 'Amritsar', country: 'India', emoji: '🛕' },
    { name: 'Jodhpur', country: 'India', emoji: '🏰' },
    { name: 'Mysore', country: 'India', emoji: '🏰' },
    { name: 'Kodaikanal', country: 'India', emoji: '🌿' },
    { name: 'Alleppey', country: 'India', emoji: '🚣' },
    { name: 'Gangtok', country: 'India', emoji: '⛰️' },
    { name: 'Nainital', country: 'India', emoji: '🏞️' },
    { name: 'Mussoorie', country: 'India', emoji: '⛰️' },
    { name: 'Auli', country: 'India', emoji: '🎿' },
    { name: 'Hampi', country: 'India', emoji: '🏛️' },
    { name: 'Rann of Kutch', country: 'India', emoji: '🏜️' },
    { name: 'Lonavala', country: 'India', emoji: '⛰️' },
    { name: 'Mahabaleshwar', country: 'India', emoji: '🌿' },
    { name: 'Mount Abu', country: 'India', emoji: '⛰️' },
    { name: 'Pondicherry', country: 'India', emoji: '🏖️' },
    // Middle East (10)
    { name: 'Dubai', country: 'UAE', emoji: '🏙️' },
    { name: 'Abu Dhabi', country: 'UAE', emoji: '🕌' },
    { name: 'Sharjah', country: 'UAE', emoji: '🏛️' },
    { name: 'Muscat', country: 'Oman', emoji: '🏜️' },
    { name: 'Doha', country: 'Qatar', emoji: '🏟️' },
    { name: 'Riyadh', country: 'Saudi Arabia', emoji: '🕋' },
    { name: 'Jeddah', country: 'Saudi Arabia', emoji: '🕌' },
    { name: 'Mecca', country: 'Saudi Arabia', emoji: '🕋' },
    { name: 'Medina', country: 'Saudi Arabia', emoji: '🕌' },
    { name: 'Bahrain', country: 'Bahrain', emoji: '🏝️' },
    { name: 'Kuwait City', country: 'Kuwait', emoji: '🏙️' },
    { name: 'Amman', country: 'Jordan', emoji: '🏛️' },
    { name: 'Petra', country: 'Jordan', emoji: '🏜️' },
    { name: 'Beirut', country: 'Lebanon', emoji: '🏙️' },
    // Southeast Asia (20)
    { name: 'Bali', country: 'Indonesia', emoji: '🌺' },
    { name: 'Jakarta', country: 'Indonesia', emoji: '🏙️' },
    { name: 'Bangkok', country: 'Thailand', emoji: '🏙️' },
    { name: 'Phuket', country: 'Thailand', emoji: '🏖️' },
    { name: 'Chiang Mai', country: 'Thailand', emoji: '🛕' },
    { name: 'Krabi', country: 'Thailand', emoji: '🏖️' },
    { name: 'Pattaya', country: 'Thailand', emoji: '🏖️' },
    { name: 'Koh Samui', country: 'Thailand', emoji: '🏝️' },
    { name: 'Singapore', country: 'Singapore', emoji: '🦁' },
    { name: 'Kuala Lumpur', country: 'Malaysia', emoji: '🏙️' },
    { name: 'Langkawi', country: 'Malaysia', emoji: '🏝️' },
    { name: 'Penang', country: 'Malaysia', emoji: '🏖️' },
    { name: 'Hanoi', country: 'Vietnam', emoji: '🚣' },
    { name: 'Ho Chi Minh', country: 'Vietnam', emoji: '🏙️' },
    { name: 'Da Nang', country: 'Vietnam', emoji: '🏖️' },
    { name: 'Siem Reap', country: 'Cambodia', emoji: '🛕' },
    { name: 'Phnom Penh', country: 'Cambodia', emoji: '🏛️' },
    { name: 'Manila', country: 'Philippines', emoji: '🏙️' },
    { name: 'Boracay', country: 'Philippines', emoji: '🏝️' },
    { name: 'Cebu', country: 'Philippines', emoji: '🏖️' },
    { name: 'Vientiane', country: 'Laos', emoji: '🛕' },
    { name: 'Luang Prabang', country: 'Laos', emoji: '🛕' },
    { name: 'Yangon', country: 'Myanmar', emoji: '🛕' },
    // Islands (12)
    { name: 'Maldives', country: 'Maldives', emoji: '🏝️' },
    { name: 'Mauritius', country: 'Mauritius', emoji: '🌊' },
    { name: 'Seychelles', country: 'Seychelles', emoji: '🐚' },
    { name: 'Sri Lanka', country: 'Sri Lanka', emoji: '🍃' },
    { name: 'Colombo', country: 'Sri Lanka', emoji: '🏙️' },
    { name: 'Kandy', country: 'Sri Lanka', emoji: '🛕' },
    { name: 'Fiji', country: 'Fiji', emoji: '🌴' },
    { name: 'Hawaii', country: 'USA', emoji: '🌺' },
    { name: 'Zanzibar', country: 'Tanzania', emoji: '🏝️' },
    { name: 'Madagascar', country: 'Madagascar', emoji: '🦎' },
    { name: 'Bora Bora', country: 'French Polynesia', emoji: '🏝️' },
    { name: 'Tahiti', country: 'French Polynesia', emoji: '🌺' },
    // Europe (50)
    { name: 'Paris', country: 'France', emoji: '🗼' },
    { name: 'Nice', country: 'France', emoji: '🏖️' },
    { name: 'Lyon', country: 'France', emoji: '🏛️' },
    { name: 'London', country: 'UK', emoji: '🎡' },
    { name: 'Edinburgh', country: 'UK', emoji: '🏰' },
    { name: 'Manchester', country: 'UK', emoji: '⚽' },
    { name: 'Zurich', country: 'Switzerland', emoji: '🏔️' },
    { name: 'Geneva', country: 'Switzerland', emoji: '⛲' },
    { name: 'Interlaken', country: 'Switzerland', emoji: '🏔️' },
    { name: 'Lucerne', country: 'Switzerland', emoji: '🏞️' },
    { name: 'Rome', country: 'Italy', emoji: '🏛️' },
    { name: 'Venice', country: 'Italy', emoji: '🚣' },
    { name: 'Florence', country: 'Italy', emoji: '🎨' },
    { name: 'Milan', country: 'Italy', emoji: '👗' },
    { name: 'Amalfi Coast', country: 'Italy', emoji: '🏖️' },
    { name: 'Barcelona', country: 'Spain', emoji: '⚽' },
    { name: 'Madrid', country: 'Spain', emoji: '🏛️' },
    { name: 'Ibiza', country: 'Spain', emoji: '🎶' },
    { name: 'Seville', country: 'Spain', emoji: '💃' },
    { name: 'Athens', country: 'Greece', emoji: '🏛️' },
    { name: 'Santorini', country: 'Greece', emoji: '🌅' },
    { name: 'Mykonos', country: 'Greece', emoji: '🏖️' },
    { name: 'Crete', country: 'Greece', emoji: '🏝️' },
    { name: 'Amsterdam', country: 'Netherlands', emoji: '🌷' },
    { name: 'Reykjavik', country: 'Iceland', emoji: '🧊' },
    { name: 'Oslo', country: 'Norway', emoji: '🌌' },
    { name: 'Bergen', country: 'Norway', emoji: '🏔️' },
    { name: 'Stockholm', country: 'Sweden', emoji: '🏙️' },
    { name: 'Copenhagen', country: 'Denmark', emoji: '🧜' },
    { name: 'Helsinki', country: 'Finland', emoji: '❄️' },
    { name: 'Istanbul', country: 'Turkey', emoji: '🕌' },
    { name: 'Cappadocia', country: 'Turkey', emoji: '🎈' },
    { name: 'Antalya', country: 'Turkey', emoji: '🏖️' },
    { name: 'Prague', country: 'Czech Republic', emoji: '🏰' },
    { name: 'Vienna', country: 'Austria', emoji: '🎵' },
    { name: 'Salzburg', country: 'Austria', emoji: '🎶' },
    { name: 'Lisbon', country: 'Portugal', emoji: '🏄' },
    { name: 'Porto', country: 'Portugal', emoji: '🍷' },
    { name: 'Dubrovnik', country: 'Croatia', emoji: '🏖️' },
    { name: 'Split', country: 'Croatia', emoji: '🏛️' },
    { name: 'Berlin', country: 'Germany', emoji: '🏛️' },
    { name: 'Munich', country: 'Germany', emoji: '🍺' },
    { name: 'Budapest', country: 'Hungary', emoji: '♨️' },
    { name: 'Warsaw', country: 'Poland', emoji: '🏛️' },
    { name: 'Krakow', country: 'Poland', emoji: '🏰' },
    { name: 'Brussels', country: 'Belgium', emoji: '🧇' },
    { name: 'Dublin', country: 'Ireland', emoji: '☘️' },
    { name: 'Monaco', country: 'Monaco', emoji: '🎰' },
    { name: 'Malta', country: 'Malta', emoji: '🏛️' },
    { name: 'Tallinn', country: 'Estonia', emoji: '🏰' },
    // Americas (30)
    { name: 'New York', country: 'USA', emoji: '🗽' },
    { name: 'Los Angeles', country: 'USA', emoji: '🎬' },
    { name: 'San Francisco', country: 'USA', emoji: '🌉' },
    { name: 'Las Vegas', country: 'USA', emoji: '🎰' },
    { name: 'Miami', country: 'USA', emoji: '🏖️' },
    { name: 'Orlando', country: 'USA', emoji: '🎢' },
    { name: 'Chicago', country: 'USA', emoji: '🏙️' },
    { name: 'Washington DC', country: 'USA', emoji: '🏛️' },
    { name: 'Boston', country: 'USA', emoji: '🏛️' },
    { name: 'Seattle', country: 'USA', emoji: '☕' },
    { name: 'Toronto', country: 'Canada', emoji: '🍁' },
    { name: 'Vancouver', country: 'Canada', emoji: '🏔️' },
    { name: 'Montreal', country: 'Canada', emoji: '🎭' },
    { name: 'Niagara Falls', country: 'Canada', emoji: '💧' },
    { name: 'Banff', country: 'Canada', emoji: '🏔️' },
    { name: 'Cancun', country: 'Mexico', emoji: '🏖️' },
    { name: 'Mexico City', country: 'Mexico', emoji: '🌮' },
    { name: 'Tulum', country: 'Mexico', emoji: '🏛️' },
    { name: 'Rio de Janeiro', country: 'Brazil', emoji: '🎉' },
    { name: 'Sao Paulo', country: 'Brazil', emoji: '🏙️' },
    { name: 'Buenos Aires', country: 'Argentina', emoji: '💃' },
    { name: 'Lima', country: 'Peru', emoji: '🏛️' },
    { name: 'Cusco', country: 'Peru', emoji: '🏔️' },
    { name: 'Machu Picchu', country: 'Peru', emoji: '🏔️' },
    { name: 'Bogota', country: 'Colombia', emoji: '🏙️' },
    { name: 'Cartagena', country: 'Colombia', emoji: '🏖️' },
    { name: 'Santiago', country: 'Chile', emoji: '🏔️' },
    { name: 'Havana', country: 'Cuba', emoji: '🚗' },
    { name: 'San Jose', country: 'Costa Rica', emoji: '🦜' },
    { name: 'Jamaica', country: 'Jamaica', emoji: '🏝️' },
    // Africa (20)
    { name: 'Cairo', country: 'Egypt', emoji: '🏛️' },
    { name: 'Luxor', country: 'Egypt', emoji: '🏛️' },
    { name: 'Sharm El Sheikh', country: 'Egypt', emoji: '🏖️' },
    { name: 'Cape Town', country: 'South Africa', emoji: '🏔️' },
    { name: 'Johannesburg', country: 'South Africa', emoji: '🏙️' },
    { name: 'Kruger Park', country: 'South Africa', emoji: '🦁' },
    { name: 'Nairobi', country: 'Kenya', emoji: '🦒' },
    { name: 'Masai Mara', country: 'Kenya', emoji: '🦁' },
    { name: 'Serengeti', country: 'Tanzania', emoji: '🦁' },
    { name: 'Kilimanjaro', country: 'Tanzania', emoji: '🏔️' },
    { name: 'Marrakech', country: 'Morocco', emoji: '🕌' },
    { name: 'Casablanca', country: 'Morocco', emoji: '🏙️' },
    { name: 'Fez', country: 'Morocco', emoji: '🏛️' },
    { name: 'Victoria Falls', country: 'Zimbabwe', emoji: '💧' },
    { name: 'Accra', country: 'Ghana', emoji: '🏖️' },
    { name: 'Lagos', country: 'Nigeria', emoji: '🏙️' },
    { name: 'Addis Ababa', country: 'Ethiopia', emoji: '🏛️' },
    { name: 'Tunis', country: 'Tunisia', emoji: '🏛️' },
    { name: 'Windhoek', country: 'Namibia', emoji: '🏜️' },
    { name: 'Kigali', country: 'Rwanda', emoji: '🏔️' },
    // East Asia (18)
    { name: 'Tokyo', country: 'Japan', emoji: '🗼' },
    { name: 'Kyoto', country: 'Japan', emoji: '🛕' },
    { name: 'Osaka', country: 'Japan', emoji: '🏯' },
    { name: 'Hokkaido', country: 'Japan', emoji: '❄️' },
    { name: 'Seoul', country: 'South Korea', emoji: '🎎' },
    { name: 'Busan', country: 'South Korea', emoji: '🏖️' },
    { name: 'Jeju Island', country: 'South Korea', emoji: '🏝️' },
    { name: 'Beijing', country: 'China', emoji: '🏯' },
    { name: 'Shanghai', country: 'China', emoji: '🏙️' },
    { name: 'Hong Kong', country: 'China', emoji: '🌃' },
    { name: 'Macau', country: 'China', emoji: '🎰' },
    { name: 'Taipei', country: 'Taiwan', emoji: '🏙️' },
    { name: 'Ulaanbaatar', country: 'Mongolia', emoji: '🏜️' },
    // Central Asia (5)
    { name: 'Tashkent', country: 'Uzbekistan', emoji: '🕌' },
    { name: 'Samarkand', country: 'Uzbekistan', emoji: '🏛️' },
    { name: 'Almaty', country: 'Kazakhstan', emoji: '🏔️' },
    { name: 'Tbilisi', country: 'Georgia', emoji: '🏔️' },
    { name: 'Baku', country: 'Azerbaijan', emoji: '🔥' },
    // Nepal & Bhutan (5)
    { name: 'Kathmandu', country: 'Nepal', emoji: '🏔️' },
    { name: 'Pokhara', country: 'Nepal', emoji: '🏞️' },
    { name: 'Everest Base Camp', country: 'Nepal', emoji: '🏔️' },
    { name: 'Thimphu', country: 'Bhutan', emoji: '🏔️' },
    { name: 'Paro', country: 'Bhutan', emoji: '🛕' },
    // Oceania (8)
    { name: 'Sydney', country: 'Australia', emoji: '🦘' },
    { name: 'Melbourne', country: 'Australia', emoji: '🏙️' },
    { name: 'Gold Coast', country: 'Australia', emoji: '🏖️' },
    { name: 'Great Barrier Reef', country: 'Australia', emoji: '🐠' },
    { name: 'Perth', country: 'Australia', emoji: '🌅' },
    { name: 'Auckland', country: 'New Zealand', emoji: '🥝' },
    { name: 'Queenstown', country: 'New Zealand', emoji: '🏔️' },
    { name: 'Rotorua', country: 'New Zealand', emoji: '♨️' },
];

const HolidayManager = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPkg, setEditingPkg] = useState(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);
    const [destSearch, setDestSearch] = useState('');
    const [showDestDropdown, setShowDestDropdown] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        pkgId: '',
        days: '',
        price: '',
        highlights: '',
        destination: '',
        description: '',
        iconType: 'GENERIC',
        category: 'Luxury',
        isActive: true
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    const filteredDests = destSearch.length > 0
        ? ALL_DESTINATIONS.filter(d => d.name.toLowerCase().includes(destSearch.toLowerCase()) || d.country.toLowerCase().includes(destSearch.toLowerCase()))
        : ALL_DESTINATIONS;

    const fetchPackages = async () => {
        try {
            setLoading(true);
            const res = await adminService.getHolidayPackages();
            if (res.success) setPackages(res.data);
        } catch (err) {
            console.error('Failed to fetch packages', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const handleOpenModal = (pkg = null) => {
        if (pkg) {
            setEditingPkg(pkg);
            setFormData({
                title: pkg.title,
                pkgId: pkg.pkgId,
                days: pkg.days,
                price: pkg.price,
                highlights: (pkg.highlights || []).join(', '),
                destination: pkg.destination || '',
                description: pkg.description || '',
                iconType: pkg.iconType || 'GENERIC',
                category: pkg.category || 'Luxury',
                isActive: pkg.isActive !== false
            });
            setDestSearch(pkg.destination || '');
            setExistingImages(pkg.images || []);
        } else {
            setEditingPkg(null);
            setFormData({
                title: '',
                pkgId: '',
                days: '',
                price: '',
                highlights: '',
                destination: '',
                description: '',
                iconType: 'GENERIC',
                category: 'Luxury',
                isActive: true
            });
            setDestSearch('');
            setExistingImages([]);
        }
        setSelectedFiles([]);
        setPreviewUrls([]);
        setIsModalOpen(true);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + selectedFiles.length + existingImages.length > 10) {
            toast.warn('Maximum 10 images allowed');
            return;
        }
        setSelectedFiles(prev => [...prev, ...files]);
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setPreviewUrls(prev => [...prev, ...newPreviews]);
    };

    const removeNewImage = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const removeExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('title', formData.title);
            fd.append('pkgId', formData.pkgId);
            fd.append('days', formData.days);
            fd.append('price', formData.price);
            fd.append('highlights', formData.highlights);
            fd.append('destination', formData.destination);
            fd.append('description', formData.description);
            fd.append('iconType', formData.iconType);
            fd.append('category', formData.category);
            fd.append('isActive', formData.isActive);
            
            // Append existing images (for update)
            if (editingPkg) {
                fd.append('existingImages', JSON.stringify(existingImages));
            }
            
            // Append new image files
            selectedFiles.forEach(file => {
                fd.append('images', file);
            });

            if (editingPkg) {
                await adminService.updateHolidayPackage(editingPkg._id, fd);
                toast.success('Package updated!');
            } else {
                await adminService.createHolidayPackage(fd);
                toast.success('Package created!');
            }
            setIsModalOpen(false);
            fetchPackages();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save package');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this holiday package?')) return;
        try {
            await adminService.deleteHolidayPackage(id);
            toast.success('Package deleted');
            fetchPackages();
        } catch (err) {
            toast.error('Failed to delete package');
        }
    };

    const handleToggleActive = async (pkg) => {
        try {
            const fd = new FormData();
            fd.append('isActive', !pkg.isActive);
            fd.append('existingImages', JSON.stringify(pkg.images || []));
            await adminService.updateHolidayPackage(pkg._id, fd);
            fetchPackages();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const getDestEmoji = (pkg) => {
        const dest = ALL_DESTINATIONS.find(d => d.name === pkg.destination);
        return dest ? dest.emoji : '🌴';
    };

    return (
        <div className="w-full space-y-10 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1 sm:mb-2">Holiday Packages</h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Create & manage curated travel experiences for agents</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white font-black rounded-lg md:rounded-2xl shadow-xl shadow-gray-900/20 active:scale-95 transition-all outline-none text-xs tracking-widest">
                    + ADD PACKAGE
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Packages', value: packages.length, icon: '📦', color: 'from-blue-500 to-blue-600' },
                    { label: 'Active', value: packages.filter(p => p.isActive).length, icon: '✅', color: 'from-green-500 to-green-600' },
                    { label: 'Inactive', value: packages.filter(p => !p.isActive).length, icon: '⏸️', color: 'from-gray-400 to-gray-500' },
                    { label: 'Avg. Price', value: packages.length ? `₹${Math.round(packages.reduce((s,p)=>s+p.price,0)/packages.length).toLocaleString()}` : '₹0', icon: '💰', color: 'from-amber-500 to-orange-500' }
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center text-lg`}>{s.icon}</div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Package Grid */}
            {loading ? (
                <div className="p-20 text-center font-black text-gray-300 italic text-xl">Loading holiday packages...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {packages.map(pkg => (
                        <div key={pkg._id} className={`bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border-2 transition-all card-hover overflow-hidden ${pkg.isActive ? 'border-gray-100' : 'border-gray-50 opacity-60'}`}>
                            {/* Card Header — Image or Icon */}
                            <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100/50 relative overflow-hidden">
                                {pkg.images && pkg.images.length > 0 ? (
                                    <img 
                                        src={`${API_BASE}${pkg.images[0]}`} 
                                        alt={pkg.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-6xl">{getDestEmoji(pkg)}</span>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md ${pkg.isActive ? 'bg-green-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
                                        {pkg.isActive ? 'Live' : 'Draft'}
                                    </span>
                                </div>
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/90 text-blue-600 backdrop-blur-md">{pkg.pkgId}</span>
                                </div>
                                {pkg.images && pkg.images.length > 1 && (
                                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[9px] font-black px-2 py-1 rounded-full backdrop-blur-sm">
                                        +{pkg.images.length - 1} photos
                                    </div>
                                )}
                            </div>

                            {/* Card Body */}
                            <div className="p-6 md:p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-black text-gray-900 leading-tight mb-1">{pkg.title}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{pkg.destination ? `${pkg.destination} • ` : ''}{pkg.category} • {pkg.days}</p>
                                    </div>
                                </div>

                                {/* Highlights */}
                                <div className="flex flex-wrap gap-1.5 mb-6">
                                    {(pkg.highlights || []).slice(0, 4).map(h => (
                                        <span key={h} className="text-[9px] font-black uppercase text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full tracking-wider border border-gray-100">{h}</span>
                                    ))}
                                    {(pkg.highlights || []).length > 4 && (
                                        <span className="text-[9px] font-black text-gray-300 px-2 py-1">+{pkg.highlights.length - 4} more</span>
                                    )}
                                </div>

                                {/* Price */}
                                <div className="bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-200 flex justify-between items-center mb-6">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agent Price</span>
                                    <span className="text-xl font-black text-gray-900">₹{pkg.price?.toLocaleString('en-IN')}</span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleToggleActive(pkg)}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pkg.isActive ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                                        {pkg.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button 
                                        onClick={() => handleOpenModal(pkg)}
                                        className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all">
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(pkg._id)}
                                        className="py-3 px-4 bg-red-50 text-red-500 rounded-xl text-sm hover:bg-red-100 transition-all">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {packages.length === 0 && (
                        <div className="col-span-1 md:col-span-3 p-20 text-center bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100">
                            <div className="text-6xl mb-4">🏖️</div>
                            <p className="text-gray-400 font-bold italic">No holiday packages found. Create your first package to get started!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Info Banner */}
            <div className="bg-gray-900 p-10 rounded-2xl md:rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-6 md:gap-10 shadow-3xl shadow-gray-950/40 relative overflow-hidden">
                <div className="relative z-10 max-w-lg text-center md:text-left">
                    <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-4">Holiday Package Engine</h3>
                    <p className="text-gray-400 font-bold leading-relaxed mb-4 md:mb-6 text-sm md:text-base">Create curated travel packages with images & flexible pricing. Agents see these on their Holiday page and can book directly.</p>
                    <button onClick={() => handleOpenModal()} className="px-8 py-3 bg-white text-gray-900 font-black rounded-xl text-xs tracking-widest hover:bg-primary-500 hover:text-white transition-all">CREATE PACKAGE</button>
                </div>
                <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 bg-primary-500 rounded-2xl md:rounded-3xl rotate-12 flex items-center justify-center text-4xl md:text-5xl shrink-0 mt-6 md:mt-0 shadow-2xl shadow-primary-500/20">🌍</div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up">
                        <div className="p-8 md:p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black text-gray-900">{editingPkg ? 'Edit Package' : 'New Package'}</h3>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configure holiday experience</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-sm text-gray-400 font-bold">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 md:p-10 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                            {/* Package Title */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Package Title *</label>
                                <input 
                                    type="text" 
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="w-full px-8 py-5 bg-gray-50 rounded-[1.5rem] border-0 focus:ring-4 focus:ring-primary-500/10 font-black text-lg transition-all outline-none" 
                                    placeholder="e.g., Royal Rajasthan Heritage Tour"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Package ID *</label>
                                    <input 
                                        type="text" 
                                        value={formData.pkgId}
                                        onChange={(e) => setFormData({...formData, pkgId: e.target.value.toUpperCase()})}
                                        className="w-full px-6 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-sm outline-none" 
                                        placeholder="PK-001"
                                        required
                                        disabled={!!editingPkg}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Duration *</label>
                                    <input 
                                        type="text" 
                                        value={formData.days}
                                        onChange={(e) => setFormData({...formData, days: e.target.value})}
                                        className="w-full px-6 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-sm outline-none" 
                                        placeholder="4N/5D"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Agent Price (₹) *</label>
                                    <input 
                                        type="number" 
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                        className="w-full px-6 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-lg outline-none" 
                                        placeholder="25000"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Category</label>
                                    <select 
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        className="w-full px-6 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-sm outline-none">
                                        <option value="Luxury">Luxury</option>
                                        <option value="Budget">Budget</option>
                                        <option value="Premium">Premium</option>
                                        <option value="Honeymoon">Honeymoon</option>
                                        <option value="Family">Family</option>
                                        <option value="Adventure">Adventure</option>
                                        <option value="Pilgrimage">Pilgrimage</option>
                                    </select>
                                </div>
                            </div>

                            {/* Destination Search */}
                            <div className="space-y-2 relative">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Destination *</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                                    <input
                                        type="text"
                                        value={destSearch}
                                        onChange={(e) => { setDestSearch(e.target.value); setShowDestDropdown(true); }}
                                        onFocus={() => setShowDestDropdown(true)}
                                        className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-sm outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
                                        placeholder="Search: Dubai, Bali, Paris, Kashmir..."
                                    />
                                    {formData.destination && (
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">✓ {formData.destination}</span>
                                    )}
                                </div>
                                {showDestDropdown && (
                                    <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-52 overflow-y-auto no-scrollbar">
                                        {filteredDests.length === 0 ? (
                                            <div className="p-4 text-center text-gray-300 text-sm font-bold">No destinations found</div>
                                        ) : (
                                            filteredDests.map(d => (
                                                <button
                                                    key={d.name}
                                                    type="button"
                                                    onClick={() => { setFormData({...formData, destination: d.name, iconType: d.name.toUpperCase()}); setDestSearch(d.name); setShowDestDropdown(false); }}
                                                    className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-primary-50 transition-colors text-left ${formData.destination === d.name ? 'bg-primary-50' : ''}`}
                                                >
                                                    <span className="text-xl">{d.emoji}</span>
                                                    <div className="flex-1">
                                                        <span className="font-black text-sm text-gray-900">{d.name}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold ml-2">{d.country}</span>
                                                    </div>
                                                    {formData.destination === d.name && <span className="text-green-500 font-black text-xs">✓</span>}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Package Images (up to 10)</label>
                                
                                {/* Existing Images */}
                                {existingImages.length > 0 && (
                                    <div className="grid grid-cols-4 gap-3">
                                        {existingImages.map((img, i) => (
                                            <div key={i} className="relative group rounded-xl overflow-hidden h-20 bg-gray-100">
                                                <img src={`${API_BASE}${img}`} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingImage(i)}
                                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    ✕
                                                </button>
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-[8px] text-white text-center py-0.5 font-bold">Saved</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* New Image Previews */}
                                {previewUrls.length > 0 && (
                                    <div className="grid grid-cols-4 gap-3">
                                        {previewUrls.map((url, i) => (
                                            <div key={i} className="relative group rounded-xl overflow-hidden h-20 bg-gray-100">
                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewImage(i)}
                                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    ✕
                                                </button>
                                                <div className="absolute bottom-0 left-0 right-0 bg-green-500/80 text-[8px] text-white text-center py-0.5 font-bold">New</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Upload Button */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={selectedFiles.length + existingImages.length >= 10}
                                    className="w-full py-5 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-black text-xs uppercase tracking-widest hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    <span className="text-xl">📸</span>
                                    {selectedFiles.length + existingImages.length > 0 
                                        ? `Add More (${selectedFiles.length + existingImages.length}/10)`
                                        : 'Upload Package Images'
                                    }
                                </button>
                                <p className="text-[10px] text-gray-300 font-bold ml-2">JPG, PNG, WebP • Max 5MB each • First image is the cover photo</p>
                            </div>

                            {/* Highlights */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Highlights (comma separated)</label>
                                <textarea 
                                    value={formData.highlights}
                                    onChange={(e) => setFormData({...formData, highlights: e.target.value})}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-[1.5rem] border-0 font-bold text-sm outline-none resize-none h-24" 
                                    placeholder="Desert Safari, City Tour, 5-Star Hotel, Burj Khalifa"
                                />
                            </div>

                            {/* Description Editor */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Package Description / Itinerary</label>
                                <div className="bg-white rounded-[1.5rem] overflow-hidden border border-gray-100">
                                    <ReactQuill 
                                        theme="snow" 
                                        value={formData.description} 
                                        onChange={(content) => setFormData({...formData, description: content})} 
                                        className="h-48 pb-10"
                                        modules={{
                                            toolbar: [
                                                [{ 'header': [1, 2, 3, false] }],
                                                ['bold', 'italic', 'underline', 'strike'],
                                                [{'list': 'ordered'}, {'list': 'bullet'}],
                                                ['link'],
                                                ['clean']
                                            ]
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-[1.5rem]">
                                <input 
                                    type="checkbox" 
                                    id="pkgActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                    className="w-6 h-6 rounded-md text-primary-500 focus:ring-primary-500"
                                />
                                <label htmlFor="pkgActive" className="text-sm font-black text-gray-900">Package is live & visible to agents</label>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-6 pt-6">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-5 bg-gray-100 text-gray-500 font-black rounded-2xl transition-all text-xs tracking-widest uppercase">
                                    Discard
                                </button>
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-5 bg-gray-900 text-white font-black rounded-2xl transition-all text-xs tracking-widest shadow-2xl shadow-gray-200 uppercase disabled:opacity-60 flex items-center justify-center gap-2">
                                    {saving ? (
                                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                                    ) : (
                                        editingPkg ? 'Update Package' : 'Create Package'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HolidayManager;
