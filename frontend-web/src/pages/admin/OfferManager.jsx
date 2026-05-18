import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';

const OfferManager = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'FLAT',
        discountValue: '',
        minBookingAmount: 0,
        maxDiscountAmount: '',
        validUntil: '',
        isActive: true
    });

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const res = await adminService.getCoupons();
            if (res.success) setOffers(res.data);
        } catch (err) {
            console.error('Failed to fetch campaigns', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOffers();
    }, []);

    const handleOpenModal = (offer = null) => {
        if (offer) {
            setEditingOffer(offer);
            setFormData({
                code: offer.code,
                discountType: offer.discountType,
                discountValue: offer.discountValue,
                minBookingAmount: offer.minBookingAmount || 0,
                maxDiscountAmount: offer.maxDiscountAmount || '',
                validUntil: offer.validUntil ? new Date(offer.validUntil).toISOString().split('T')[0] : '',
                isActive: offer.isActive
            });
        } else {
            setEditingOffer(null);
            setFormData({
                code: '',
                discountType: 'FLAT',
                discountValue: '',
                minBookingAmount: 0,
                maxDiscountAmount: '',
                validUntil: '',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingOffer) {
                await adminService.updateCoupon(editingOffer._id, formData);
            } else {
                await adminService.createCoupon(formData);
            }
            setIsModalOpen(false);
            fetchOffers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save campaign');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this campaign?')) return;
        try {
            await adminService.deleteCoupon(id);
            fetchOffers();
        } catch (err) {
            toast.error('Failed to delete campaign');
        }
    };

    const getStatus = (o) => {
        if (!o.isActive) return 'Disabled';
        if (new Date(o.validUntil) < new Date()) return 'Expired';
        return 'Active';
    };

    return (
        <div className="w-full space-y-10 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1 sm:mb-2">Campaign Manager</h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Promotion & Loyalty Engine</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white font-black rounded-lg md:rounded-2xl shadow-xl shadow-gray-900/20 active:scale-95 transition-all outline-none text-xs tracking-widest">
                    CREATE CAMPAIGN
                </button>
            </div>

            {loading ? (
                <div className="p-20 text-center font-black text-gray-300 italic text-xl">Accessing Marketing Vault...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {offers.map(o => {
                        const status = getStatus(o);
                        return (
                            <div key={o._id} className={`bg-white p-safe rounded-2xl md:rounded-[2.5rem] shadow-2xl border-2 transition-all card-hover ${status === 'Active' ? 'border-primary-100' : 'border-gray-50 opacity-60'}`}>
                                <div className="flex justify-between items-start mb-6 md:mb-8">
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{status}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenModal(o)} className="text-gray-300 hover:text-primary-500 transition-colors">⚙️</button>
                                        <button onClick={() => handleDelete(o._id)} className="text-gray-300 hover:text-red-500 transition-colors text-xs">🗑️</button>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2 truncate" title={o.code}>{o.code}</h3>
                                <p className="text-3xl font-black text-primary-500 mb-8">{o.discountType === 'FLAT' ? '₹' : ''}{o.discountValue}{o.discountType === 'PERCENTAGE' ? '%' : ''}</p>
                                <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-4 rounded-2xl flex justify-between items-center group-hover:border-primary-200 transition-colors">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">EXPIRES:</span>
                                    <span className="font-black text-gray-900 text-xs">{new Date(o.validUntil).toLocaleDateString()}</span>
                                </div>
                            </div>
                        );
                    })}
                    {offers.length === 0 && (
                        <div className="col-span-1 md:col-span-3 p-20 text-center bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100">
                             <p className="text-gray-400 font-bold italic">No active campaigns found. Start your first promotion today!</p>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-gray-900 p-10 rounded-2xl md:rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-6 md:gap-10 shadow-3xl shadow-gray-950/40 relative overflow-hidden">
                <div className="relative z-10 max-w-lg text-center md:text-left">
                    <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-4">Master Marketing Engine</h3>
                    <p className="text-gray-400 font-bold leading-relaxed mb-4 md:mb-6 text-sm md:text-base">Schedule notifications, emails, and SMS alerts to your entire agent network from a single dashboard.</p>
                    <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                        <button className="px-8 py-3 bg-white text-gray-900 font-black rounded-xl text-xs tracking-widest hover:bg-primary-500 hover:text-white transition-all">SCHEDULE BLAST</button>
                        <button className="px-8 py-3 border border-gray-700 font-black rounded-xl text-xs tracking-widest hover:bg-gray-800 transition-all">VIEW LOGS</button>
                    </div>
                </div>
                <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 bg-primary-500 rounded-2xl md:rounded-3xl rotate-12 flex items-center justify-center text-4xl md:text-5xl shrink-0 mt-6 md:mt-0 shadow-2xl shadow-primary-500/20">📢</div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900">{editingOffer ? 'Edit Campaign' : 'New Campaign'}</h3>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configure promotion mechanics</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-sm text-gray-400 font-bold">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Coupon Code</label>
                                <input 
                                    type="text" 
                                    value={formData.code}
                                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                    className="w-full px-8 py-5 bg-gray-50 rounded-[1.5rem] border-0 focus:ring-4 focus:ring-primary-500/10 font-black text-2xl transition-all" 
                                    placeholder="e.g., WINTER20"
                                    required
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Type</label>
                                    <select 
                                        value={formData.discountType}
                                        onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                                        className="w-full px-6 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-sm"
                                    >
                                        <option value="FLAT">Flat Discount (₹)</option>
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Value</label>
                                    <input 
                                        type="number" 
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({...formData, discountValue: parseFloat(e.target.value)})}
                                        className="w-full px-6 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-lg" 
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Min. Booking</label>
                                    <input 
                                        type="number" 
                                        value={formData.minBookingAmount}
                                        onChange={(e) => setFormData({...formData, minBookingAmount: parseFloat(e.target.value)})}
                                        className="w-full px-6 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-lg text-gray-500" 
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Max Cap (Percent)</label>
                                    <input 
                                        type="number" 
                                        value={formData.maxDiscountAmount}
                                        onChange={(e) => setFormData({...formData, maxDiscountAmount: parseFloat(e.target.value)})}
                                        className="w-full px-6 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-lg text-gray-500" 
                                        placeholder="None"
                                        disabled={formData.discountType === 'FLAT'}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2">Expiry Date</label>
                                <input 
                                    type="date" 
                                    value={formData.validUntil}
                                    onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                                    className="w-full px-8 py-5 bg-gray-50 rounded-[1.5rem] border-0 font-black text-lg" 
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-[1.5rem]">
                                <input 
                                    type="checkbox" 
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                    className="w-6 h-6 rounded-md text-primary-500 focus:ring-primary-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-black text-gray-900">Campaign is currently active</label>
                            </div>

                            <div className="flex gap-6 pt-6">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-5 bg-gray-100 text-gray-500 font-black rounded-2xl transition-all text-xs tracking-widest uppercase">
                                    Discard
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-5 bg-gray-900 text-white font-black rounded-2xl transition-all text-xs tracking-widest shadow-2xl shadow-gray-200 uppercase">
                                    {editingOffer ? 'Update' : 'Launch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfferManager;
