import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';

const PromotionManager = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        color: 'bg-primary-600',
        active: true
    });

    const [isContentModalOpen, setIsContentModalOpen] = useState(false);
    const [contentData, setContentData] = useState({
        homepageHeroTitle: '',
        homepageHeroSubtitle: '',
        seoMetaTitle: '',
        seoMetaDescription: '',
        termsUrl: '',
        privacyUrl: ''
    });
    const [savingContent, setSavingContent] = useState(false);

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const res = await adminService.getPromotions();
            if (res.success) setBanners(res.data);
        } catch (err) {
            console.error('Failed to fetch promotions', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenContentEditor = async () => {
        try {
            const res = await adminService.getSettings();
            if (res && res.success) {
                setContentData({
                    homepageHeroTitle: res.data.homepageHeroTitle || 'Discover the World with Goyafly',
                    homepageHeroSubtitle: res.data.homepageHeroSubtitle || 'Your premium B2B travel portal for instant flight bookings, holidays, and visa processing.',
                    seoMetaTitle: res.data.seoMetaTitle || 'Goyafly B2B Travel Portal | Best Flight Fares & Fixed Departures',
                    seoMetaDescription: res.data.seoMetaDescription || 'Book guaranteed fixed departure seats, international holiday packages, and seamless visa processing with Goyafly.',
                    termsUrl: res.data.termsUrl || 'https://goyafly.com/terms',
                    privacyUrl: res.data.privacyUrl || 'https://goyafly.com/privacy'
                });
            }
            setIsContentModalOpen(true);
        } catch (err) {
            toast.error('Failed to load content settings');
        }
    };

    const handleSaveContent = async (e) => {
        e.preventDefault();
        setSavingContent(true);
        try {
            await adminService.updateSettings(contentData);
            toast.success('Homepage text & content updated successfully!');
            setIsContentModalOpen(false);
        } catch (err) {
            toast.error('Failed to save content settings');
        } finally {
            setSavingContent(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await adminService.updatePromotion(selectedId, formData);
            } else {
                await adminService.createPromotion(formData);
            }
            setIsModalOpen(false);
            fetchPromotions();
            resetForm();
        } catch (err) {
            toast.error('Action failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this promotion?')) return;
        try {
            await adminService.deletePromotion(id);
            fetchPromotions();
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const handleToggleActive = async (banner) => {
        try {
            await adminService.updatePromotion(banner._id, { active: !banner.active });
            fetchPromotions();
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const handleEdit = (banner) => {
        setEditMode(true);
        setSelectedId(banner._id);
        setFormData({
            title: banner.title,
            subtitle: banner.subtitle,
            description: banner.description || '',
            color: banner.color,
            active: banner.active
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            subtitle: '',
            description: '',
            color: 'bg-primary-600',
            active: true
        });
        setEditMode(false);
        setSelectedId(null);
    };

    return (
        <div className="w-full space-y-10 animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Display & Promotions</h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Public Branding & Banners</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl hover:bg-primary-500 transition-all text-xs tracking-widest">+ ADD NEW CAMPAIGN</button>
            </div>

            {loading ? (
                <div className="p-20 text-center font-black text-gray-300 italic">Loading Promotions...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {banners.map(b => (
                        <div key={b._id} className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col group card-hover">
                            <div className={`h-48 ${b.color} p-10 relative overflow-hidden`}>
                                 <div className="relative z-10">
                                    <h3 className="text-2xl font-black text-white mb-2">{b.title}</h3>
                                    <p className="text-white/70 font-bold text-sm">{b.subtitle}</p>
                                 </div>
                                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            </div>
                            <div className="p-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
                                <div className="flex flex-col gap-1">
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${b.active ? 'text-green-600' : 'text-gray-400'}`}>
                                        {b.active ? 'LIVE ON HOMEPAGE' : 'INACTIVE / DRAFT'}
                                    </span>
                                    <div className="flex gap-2">
                                        <button className="text-[10px] font-black text-gray-400 hover:text-primary-500 underline">Preview</button>
                                        <button 
                                            onClick={() => handleEdit(b)}
                                            className="text-[10px] font-black text-gray-400 hover:text-primary-500 underline">Settings</button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                    <div 
                                        onClick={() => handleToggleActive(b)}
                                        className={`w-14 h-8 rounded-full p-1 transition-all flex items-center shadow-inner cursor-pointer ${b.active ? 'bg-green-500' : 'bg-gray-200'}`}>
                                        <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-all transform ${b.active ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(b._id)}
                                        className="p-3 bg-gray-50 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-xl transition-all">🗑️</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">{editMode ? 'Edit Campaign' : 'New Campaign'}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configure banner display</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Campaign Title</label>
                                <input 
                                    type="text" 
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm" 
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtitle / Offer Text</label>
                                <input 
                                    type="text" 
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm" 
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Banner Color</label>
                                    <select 
                                        value={formData.color}
                                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm">
                                        <option value="bg-primary-600">Goya Blue</option>
                                        <option value="bg-secondary-500">Orange Flare</option>
                                        <option value="bg-gray-800">Deep Space</option>
                                        <option value="bg-purple-600">Royal Purple</option>
                                        <option value="bg-rose-500">Rose Pink</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initial Status</label>
                                    <select 
                                        value={formData.active}
                                        onChange={(e) => setFormData({...formData, active: e.target.value === 'true'})}
                                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm">
                                        <option value="true">Live</option>
                                        <option value="false">Draft</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl text-xs tracking-widest">CANCEL</button>
                                <button type="submit" className="flex-1 py-4 bg-gray-900 text-white font-black rounded-2xl text-xs tracking-widest hover:bg-primary-500">
                                    {editMode ? 'SAVE CHANGES' : 'PUBLISH CAMPAIGN'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-gray-50 border-4 border-dashed border-gray-200 p-12 rounded-[3.5rem] flex flex-col items-center justify-center text-center opacity-70 hover:opacity-100 transition-opacity">
                <span className="text-4xl mb-6">📢</span>
                <h4 className="text-xl font-black text-gray-900 mb-2">Homepage Text & Content</h4>
                <p className="text-sm font-bold text-gray-400 max-w-md border-b border-gray-200 pb-2 mb-4">You can also manage the static text, SEO descriptions, and policy links directly from this console.</p>
                <button 
                    onClick={handleOpenContentEditor}
                    className="px-6 py-3 bg-primary-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-md">Launch Content Editor</button>
            </div>

            {/* Content Editor Modal */}
            {isContentModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
                            <div>
                                <h3 className="text-2xl font-black">Homepage Text & SEO Content</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configure static text and meta tags</p>
                            </div>
                            <button onClick={() => setIsContentModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">✕</button>
                        </div>
                        <form onSubmit={handleSaveContent} className="p-8 space-y-6 overflow-y-auto flex-1">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Homepage Hero Title</label>
                                <input 
                                    type="text" 
                                    value={contentData.homepageHeroTitle}
                                    onChange={(e) => setContentData({...contentData, homepageHeroTitle: e.target.value})}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm" 
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Homepage Hero Subtitle</label>
                                <textarea 
                                    rows="2"
                                    value={contentData.homepageHeroSubtitle}
                                    onChange={(e) => setContentData({...contentData, homepageHeroSubtitle: e.target.value})}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm" 
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SEO Meta Title</label>
                                <input 
                                    type="text" 
                                    value={contentData.seoMetaTitle}
                                    onChange={(e) => setContentData({...contentData, seoMetaTitle: e.target.value})}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm" 
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SEO Meta Description</label>
                                <textarea 
                                    rows="3"
                                    value={contentData.seoMetaDescription}
                                    onChange={(e) => setContentData({...contentData, seoMetaDescription: e.target.value})}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm" 
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Terms of Service URL</label>
                                    <input 
                                        type="text" 
                                        value={contentData.termsUrl}
                                        onChange={(e) => setContentData({...contentData, termsUrl: e.target.value})}
                                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Privacy Policy URL</label>
                                    <input 
                                        type="text" 
                                        value={contentData.privacyUrl}
                                        onChange={(e) => setContentData({...contentData, privacyUrl: e.target.value})}
                                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm" 
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsContentModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl text-xs tracking-widest hover:bg-gray-200 transition-all">CANCEL</button>
                                <button type="submit" disabled={savingContent} className="flex-1 py-4 bg-primary-500 text-white font-black rounded-2xl text-xs tracking-widest hover:bg-primary-600 transition-all shadow-lg disabled:opacity-50">
                                    {savingContent ? 'SAVING...' : 'SAVE CONTENT & SEO'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromotionManager;
