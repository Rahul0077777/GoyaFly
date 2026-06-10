import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const COMMON_COUNTRIES = [
    { name: 'UAE', emoji: '🇦🇪' }, { name: 'Singapore', emoji: '🇸🇬' }, { name: 'Thailand', emoji: '🇹🇭' },
    { name: 'Malaysia', emoji: '🇲🇾' }, { name: 'USA', emoji: '🇺🇸' }, { name: 'UK', emoji: '🇬🇧' },
    { name: 'Canada', emoji: '🇨🇦' }, { name: 'Australia', emoji: '🇦🇺' }, { name: 'New Zealand', emoji: '🇳🇿' },
    { name: 'Schengen', emoji: '🇪🇺' }, { name: 'Vietnam', emoji: '🇻🇳' }, { name: 'Indonesia', emoji: '🇮🇩' },
    { name: 'Sri Lanka', emoji: '🇱🇰' }, { name: 'Japan', emoji: '🇯🇵' }, { name: 'South Korea', emoji: '🇰🇷' },
    { name: 'China', emoji: '🇨🇳' }, { name: 'Turkey', emoji: '🇹🇷' }, { name: 'Egypt', emoji: '🇪🇬' },
    { name: 'South Africa', emoji: '🇿🇦' }
];

const VisaManager = () => {
    const [tab, setTab] = useState('visa'); // 'visa' | 'insurance'
    
    // Arrays for data
    const [visaPackages, setVisaPackages] = useState([]);
    const [insurancePackages, setInsurancePackages] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPkg, setEditingPkg] = useState(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);
    const [countrySearch, setCountrySearch] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    
    const defaultVisaFormData = {
        title: '', country: '', visaType: 'Tourist', processingTime: '', price: '', documentsRequired: '', description: '', isActive: true
    };
    const defaultInsuranceFormData = {
        provider: '', plan: '', cover: '', price: '', features: '', isActive: true
    };
    
    const [formData, setFormData] = useState(defaultVisaFormData);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    const filteredCountries = countrySearch.length > 0
        ? COMMON_COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
        : COMMON_COUNTRIES;

    const fetchPackages = async () => {
        try {
            setLoading(true);
            if (tab === 'visa') {
                const res = await adminService.getVisaPackages();
                if (res.success) setVisaPackages(res.data);
            } else {
                const res = await adminService.getInsurancePackages();
                if (res.success) setInsurancePackages(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch packages', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, [tab]);

    const handleOpenModal = (pkg = null) => {
        if (pkg) {
            setEditingPkg(pkg);
            if (tab === 'visa') {
                setFormData({
                    title: pkg.title,
                    country: pkg.country || '',
                    visaType: pkg.visaType || 'Tourist',
                    processingTime: pkg.processingTime || '',
                    price: pkg.price,
                    documentsRequired: (pkg.documentsRequired || []).join(', '),
                    description: pkg.description || '',
                    isActive: pkg.isActive !== false
                });
                setCountrySearch(pkg.country || '');
            } else {
                setFormData({
                    provider: pkg.provider,
                    plan: pkg.plan,
                    cover: pkg.cover,
                    price: pkg.price,
                    features: (pkg.features || []).join(', '),
                    isActive: pkg.isActive !== false
                });
            }
            setExistingImages(pkg.images || []);
        } else {
            setEditingPkg(null);
            if (tab === 'visa') {
                setFormData(defaultVisaFormData);
                setCountrySearch('');
            } else {
                setFormData(defaultInsuranceFormData);
            }
            setExistingImages([]);
        }
        setSelectedFiles([]);
        setPreviewUrls([]);
        setIsModalOpen(true);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (selectedFiles.length + existingImages.length + files.length > 5) {
            return toast.error("You can only have up to 5 images in total");
        }
        setSelectedFiles(prev => [...prev, ...files]);
        const urls = files.map(f => URL.createObjectURL(f));
        setPreviewUrls(prev => [...prev, ...urls]);
    };

    const removeNewImage = (index) => {
        const newFiles = [...selectedFiles];
        const newUrls = [...previewUrls];
        newFiles.splice(index, 1);
        URL.revokeObjectURL(newUrls[index]);
        newUrls.splice(index, 1);
        setSelectedFiles(newFiles);
        setPreviewUrls(newUrls);
    };

    const removeExistingImage = (index) => {
        const newExisting = [...existingImages];
        newExisting.splice(index, 1);
        setExistingImages(newExisting);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const fd = new FormData();
            Object.keys(formData).forEach(k => fd.append(k, formData[k]));
            fd.append('existingImages', JSON.stringify(existingImages));
            selectedFiles.forEach(f => fd.append('images', f));

            if (tab === 'visa') {
                if (editingPkg) {
                    await adminService.updateVisaPackage(editingPkg._id, fd);
                    toast.success('Visa updated');
                } else {
                    await adminService.createVisaPackage(fd);
                    toast.success('Visa created');
                }
            } else {
                if (editingPkg) {
                    await adminService.updateInsurancePackage(editingPkg._id, fd);
                    toast.success('Insurance updated');
                } else {
                    await adminService.createInsurancePackage(fd);
                    toast.success('Insurance created');
                }
            }
            setIsModalOpen(false);
            fetchPackages();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete this ${tab === 'visa' ? 'visa' : 'insurance'} package?`)) return;
        try {
            if (tab === 'visa') await adminService.deleteVisaPackage(id);
            else await adminService.deleteInsurancePackage(id);
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
            if (tab === 'visa') await adminService.updateVisaPackage(pkg._id, fd);
            else await adminService.updateInsurancePackage(pkg._id, fd);
            fetchPackages();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const getCountryEmoji = (pkg) => {
        if (tab === 'insurance') return '🛡️';
        const c = COMMON_COUNTRIES.find(d => d.name === pkg.country);
        return c ? c.emoji : '🌍';
    };

    const currentPackages = tab === 'visa' ? visaPackages : insurancePackages;

    return (
        <div className="w-full space-y-10 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1 sm:mb-2">Visa & Insurance</h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Create & manage compliance & protection options</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white font-black rounded-lg md:rounded-2xl shadow-xl shadow-gray-900/20 active:scale-95 transition-all outline-none text-xs tracking-widest uppercase">
                    + ADD {tab === 'visa' ? 'VISA' : 'INSURANCE'}
                </button>
            </div>

            {/* TAB SWITCHER */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-2 w-full max-w-sm">
                <button
                    onClick={() => setTab('visa')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm tracking-wide transition-all ${tab === 'visa' ? 'bg-[#1D4171] text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    🛂 VISA
                </button>
                <button
                    onClick={() => setTab('insurance')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm tracking-wide transition-all ${tab === 'insurance' ? 'bg-[#F07E21] text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    🛡️ INSURANCE
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: `Total ${tab === 'visa' ? 'Visas' : 'Plans'}`, value: currentPackages.length, icon: tab==='visa'?'🛂':'🛡️', color: 'from-blue-500 to-blue-600' },
                    { label: 'Active', value: currentPackages.filter(p => p.isActive).length, icon: '✅', color: 'from-green-500 to-green-600' },
                    { label: 'Inactive', value: currentPackages.filter(p => !p.isActive).length, icon: '⏸️', color: 'from-gray-400 to-gray-500' },
                    { label: 'Avg. Price', value: currentPackages.length ? `₹${Math.round(currentPackages.reduce((s,p)=>s+p.price,0)/currentPackages.length).toLocaleString()}` : '₹0', icon: '💰', color: 'from-secondary-500 to-orange-500' }
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
                <div className="p-20 text-center font-black text-gray-300 italic text-xl">Loading packages...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {currentPackages.map(pkg => (
                        <div key={pkg._id} className={`bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border-2 transition-all card-hover overflow-hidden ${pkg.isActive ? 'border-gray-100' : 'border-gray-50 opacity-60'}`}>
                            {/* Card Header — Image or Icon */}
                            <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100/50 relative overflow-hidden">
                                {pkg.images && pkg.images.length > 0 ? (
                                    <img 
                                        src={`${API_BASE}${pkg.images[0]}`} 
                                        alt={pkg.title || pkg.provider}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-6xl">{getCountryEmoji(pkg)}</span>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md ${pkg.isActive ? 'bg-green-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
                                        {pkg.isActive ? 'Live' : 'Draft'}
                                    </span>
                                </div>
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/90 text-primary-600 backdrop-blur-md">
                                        {tab === 'visa' ? pkg.country : 'Insurance'}
                                    </span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 md:p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-black text-gray-900 leading-tight mb-1">
                                            {tab === 'visa' ? pkg.title : `${pkg.provider} - ${pkg.plan}`}
                                        </h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            {tab === 'visa' ? `${pkg.visaType} • ${pkg.processingTime}` : `Max Cover: ${pkg.cover}`}
                                        </p>
                                    </div>
                                </div>

                                {/* Highlights */}
                                <div className="flex flex-wrap gap-1.5 mb-6">
                                    {tab === 'visa' ? (
                                        <>
                                            {(pkg.documentsRequired || []).slice(0, 3).map(h => (
                                                <span key={h} className="text-[9px] font-black uppercase text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full tracking-wider border border-gray-100">{h}</span>
                                            ))}
                                            {(pkg.documentsRequired || []).length > 3 && (
                                                <span className="text-[9px] font-black text-gray-300 px-2 py-1">+{pkg.documentsRequired.length - 3} more</span>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {(pkg.features || []).slice(0, 3).map(h => (
                                                <span key={h} className="text-[9px] font-black uppercase text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full tracking-wider border border-gray-100">✓ {h}</span>
                                            ))}
                                            {(pkg.features || []).length > 3 && (
                                                <span className="text-[9px] font-black text-gray-300 px-2 py-1">+{pkg.features.length - 3} more</span>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Price */}
                                <div className="bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-200 flex justify-between items-center mb-6">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tab === 'visa' ? 'Agent Price' : 'Starting at'}</span>
                                    <span className="text-xl font-black text-gray-900">₹{pkg.price?.toLocaleString('en-IN')}{tab === 'insurance' && <span className="text-sm">/day</span>}</span>
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
                    {currentPackages.length === 0 && (
                        <div className="col-span-1 md:col-span-3 p-20 text-center bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100">
                            <div className="text-6xl mb-4">{tab === 'visa' ? '🛂' : '🛡️'}</div>
                            <p className="text-gray-400 font-bold italic">No {tab} packages found. Create your first package to get started!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up">
                        <div className="p-8 md:p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black text-gray-900">{editingPkg ? 'Edit' : 'New'} {tab === 'visa' ? 'Visa' : 'Insurance'}</h3>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configure {tab} details</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-sm text-gray-400 font-bold">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 md:p-10 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                            
                            {tab === 'visa' ? (
                                <>
                                    {/* Visa Form */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Visa Title *</label>
                                        <input 
                                            type="text" 
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            className="w-full px-8 py-5 bg-gray-50 rounded-[1.5rem] border-0 focus:ring-4 focus:ring-primary-500/10 font-black text-lg transition-all outline-none" 
                                            placeholder="e.g., UAE 30 Days Tourist Visa"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2 relative">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Country *</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={countrySearch}
                                                    onChange={(e) => { setCountrySearch(e.target.value); setShowCountryDropdown(true); }}
                                                    onFocus={() => setShowCountryDropdown(true)}
                                                    className="w-full px-6 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-sm outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
                                                    placeholder="Search country..."
                                                    required
                                                />
                                                {formData.country && (
                                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-green-500 font-black">✓</span>
                                                )}
                                            </div>
                                            {showCountryDropdown && (
                                                <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-52 overflow-y-auto no-scrollbar">
                                                    {filteredCountries.map(c => (
                                                        <button
                                                            key={c.name}
                                                            type="button"
                                                            onClick={() => { setFormData({...formData, country: c.name}); setCountrySearch(c.name); setShowCountryDropdown(false); }}
                                                            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-primary-50 transition-colors text-left"
                                                        >
                                                            <span className="text-xl">{c.emoji}</span>
                                                            <span className="font-black text-sm text-gray-900">{c.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Processing Time *</label>
                                            <input 
                                                type="text" 
                                                value={formData.processingTime}
                                                onChange={(e) => setFormData({...formData, processingTime: e.target.value})}
                                                className="w-full px-6 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-sm outline-none" 
                                                placeholder="e.g., 3-5 Working Days"
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
                                                placeholder="6500"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Visa Type</label>
                                            <select 
                                                value={formData.visaType}
                                                onChange={(e) => setFormData({...formData, visaType: e.target.value})}
                                                className="w-full px-6 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-sm outline-none">
                                                <option value="Tourist">Tourist</option>
                                                <option value="Business">Business</option>
                                                <option value="Student">Student</option>
                                                <option value="Work">Work</option>
                                                <option value="E-Visa">E-Visa</option>
                                                <option value="Arrival">Arrival</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Documents Required (comma separated)</label>
                                        <textarea 
                                            value={formData.documentsRequired}
                                            onChange={(e) => setFormData({...formData, documentsRequired: e.target.value})}
                                            className="w-full px-6 py-4 bg-gray-50 rounded-[1.5rem] border-0 font-bold text-sm outline-none resize-none h-24" 
                                            placeholder="Passport Front & Back, White Background Photo..."
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Insurance Form */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Provider Name *</label>
                                            <input 
                                                type="text" 
                                                value={formData.provider}
                                                onChange={(e) => setFormData({...formData, provider: e.target.value})}
                                                className="w-full px-6 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-sm outline-none" 
                                                placeholder="e.g., TATA AIG"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Plan Name *</label>
                                            <input 
                                                type="text" 
                                                value={formData.plan}
                                                onChange={(e) => setFormData({...formData, plan: e.target.value})}
                                                className="w-full px-6 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-sm outline-none" 
                                                placeholder="e.g., Travel Guard"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Daily Price (₹) *</label>
                                            <input 
                                                type="number" 
                                                value={formData.price}
                                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                                                className="w-full px-6 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-lg outline-none" 
                                                placeholder="45"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Max Cover *</label>
                                            <input 
                                                type="text" 
                                                value={formData.cover}
                                                onChange={(e) => setFormData({...formData, cover: e.target.value})}
                                                className="w-full px-6 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-sm outline-none" 
                                                placeholder="e.g., ₹50,000"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Features (comma separated)</label>
                                        <textarea 
                                            value={formData.features}
                                            onChange={(e) => setFormData({...formData, features: e.target.value})}
                                            className="w-full px-6 py-4 bg-gray-50 rounded-[1.5rem] border-0 font-bold text-sm outline-none resize-none h-24" 
                                            placeholder="Medical Emergency, Trip Cancellation, Baggage Loss..."
                                        />
                                    </div>
                                </>
                            )}

                            {/* Image Upload (Both) */}
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Reference Images (up to 5)</label>
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
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                    disabled={selectedFiles.length + existingImages.length >= 5}
                                    className="w-full py-5 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-black text-xs uppercase tracking-widest hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/30 transition-all disabled:opacity-40 flex items-center justify-center gap-3"
                                >
                                    <span className="text-xl">📸</span>
                                    {selectedFiles.length + existingImages.length > 0 
                                        ? `Add More (${selectedFiles.length + existingImages.length}/5)`
                                        : 'Upload Images'
                                    }
                                </button>
                            </div>

                            {/* Description Editor (Visa Only) */}
                            {tab === 'visa' && (
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Detailed Info / Notes</label>
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
                                                    ['clean']
                                                ]
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

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
                                    {saving ? 'Saving...' : `Save ${tab === 'visa' ? 'Visa' : 'Insurance'}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisaManager;
