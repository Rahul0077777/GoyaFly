import React, { useState, useEffect } from 'react';
import { authService } from '../../services/api';
import { toast } from 'react-toastify';
import { 
    FaUser, FaBuilding, FaEnvelope, FaFileInvoice, FaPhone, 
    FaMapMarkerAlt, FaMap, FaSave, FaLock, FaShieldAlt,
    FaCheckCircle, FaHeadset, FaUserTie, FaChartBar, FaIdCard, FaAward
} from 'react-icons/fa';

const AgentProfile = () => {
    const [profile, setProfile] = useState({
        agencyName: '',
        ownerName: '',
        email: '',
        mobile: '',
        city: '',
        gstNumber: '',
        address: '',
        logo: null
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await authService.getProfile();
            if (res.success) {
                setProfile({
                    agencyName: res.data.agencyName || '',
                    ownerName: res.data.agentName || res.data.name || '',
                    email: res.data.emailAddress || res.data.email || '',
                    mobile: res.data.mobileNumber || res.data.mobile || '',
                    city: res.data.city || '',
                    gstNumber: res.data.gstNumber || '',
                    address: res.data.address || '',
                    logo: res.data.logo || null
                });
            }
        } catch (err) {
            console.error('Failed to fetch profile', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await authService.updateProfile({
                agentName: profile.ownerName,
                agencyName: profile.agencyName,
                mobileNumber: profile.mobile,
                gstNumber: profile.gstNumber,
                address: profile.address,
                city: profile.city
            });
            if (res.success) {
                toast.success('Profile updated successfully!');
            }
        } catch (err) {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-black text-slate-300 italic">Loading Profile...</div>;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in px-4 py-6 md:py-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-xl md:text-2xl text-blue-600 shrink-0">
                    <FaUser />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-[#1D4171]">Agency Profile</h2>
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] mt-0.5">Portal Identity & Security</p>
                </div>
            </div>

            {/* Top Blue Line Accent */}
            <div className="w-full h-1 bg-blue-600 rounded-t-full"></div>

            {/* Agency Info Card */}
            <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start md:justify-between gap-6 -mt-6 rounded-t-none">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-50 rounded-2xl flex items-center justify-center text-4xl md:text-5xl font-black text-blue-600 shrink-0 shadow-inner">
                        {profile.logo ? (
                            <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${profile.logo}`} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                            profile.agencyName.substring(0,1).toUpperCase()
                        )}
                    </div>
                    <div className="pt-2">
                        <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2">{profile.agencyName || 'Agency Name'}</h3>
                        <div className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-max mx-auto md:mx-0 flex items-center gap-1.5 mb-4 border border-emerald-100">
                            <FaCheckCircle /> Verified Partner
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-[11px] md:text-xs font-bold text-slate-500">
                            <span className="flex items-center gap-2"><FaEnvelope className="text-slate-400" /> {profile.email}</span>
                            <span className="hidden sm:block text-slate-300">|</span>
                            <span className="flex items-center gap-2"><FaPhone className="text-slate-400" /> {profile.mobile}</span>
                        </div>
                    </div>
                </div>
                
                <div className="w-full md:w-auto pt-2 md:pt-4">
                    <a 
                        href={`mailto:admin@goyafly.com?subject=Agency Logo Update Request - ${profile.agencyName}`}
                        className="w-full md:w-auto flex flex-col items-center justify-center px-6 py-3 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors rounded-xl gap-1 group active:scale-95"
                    >
                        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest group-hover:scale-105 transition-transform"><FaEnvelope /> Contact Admin</span>
                        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">To Update Logo</span>
                    </a>
                </div>
            </div>

            {/* Password Protection */}
            <div className="bg-[#1D4171] p-5 md:p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex gap-4 md:gap-5 items-center relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl text-blue-300 shrink-0 border border-white/10 shadow-inner">
                        <FaShieldAlt />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Account Security</p>
                        <h4 className="text-sm md:text-base font-black mb-1">Password Protection</h4>
                        <p className="text-[10px] md:text-[11px] text-slate-300 font-medium max-w-[250px] leading-relaxed">Keep your account secure with a strong password.</p>
                    </div>
                </div>
                <button className="w-full md:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl text-[10px] tracking-widest transition-all border border-white/20 flex items-center justify-center gap-2 relative z-10 active:scale-95">
                    <FaLock /> CHANGE PASSWORD <span className="ml-1 text-slate-400">&gt;</span>
                </button>
            </div>

            {/* General Information Form */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-sm md:text-base font-black text-slate-800 flex items-center gap-2.5 mb-6 md:mb-8 pb-4 border-b border-slate-50">
                    <span className="text-orange-500 text-lg"><FaIdCard /></span>
                    General Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Agency Name</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><FaBuilding /></span>
                            <input type="text" value={profile.agencyName} onChange={e=>setProfile({...profile, agencyName: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3.5 font-bold text-xs md:text-sm text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Agency Owner</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><FaUser /></span>
                            <input type="text" value={profile.ownerName} onChange={e=>setProfile({...profile, ownerName: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3.5 font-bold text-xs md:text-sm text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Email</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><FaEnvelope /></span>
                            <input type="email" value={profile.email} readOnly className="w-full bg-slate-100/50 border border-slate-100 rounded-xl pl-11 pr-4 py-3.5 font-bold text-xs md:text-sm text-slate-500 cursor-not-allowed outline-none" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">GST Number</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><FaFileInvoice /></span>
                            <input type="text" value={profile.gstNumber} onChange={e=>setProfile({...profile, gstNumber: e.target.value})} placeholder="Enter GST Number" className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3.5 font-bold text-xs md:text-sm text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><FaPhone /></span>
                            <input type="text" value={profile.mobile} onChange={e=>setProfile({...profile, mobile: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3.5 font-bold text-xs md:text-sm text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Location City</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><FaMapMarkerAlt /></span>
                            <input type="text" value={profile.city} onChange={e=>setProfile({...profile, city: e.target.value})} placeholder="Enter City" className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3.5 font-bold text-xs md:text-sm text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all" />
                        </div>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
                        <div className="relative">
                            <span className="absolute left-4 top-4 text-slate-400"><FaMap /></span>
                            <textarea 
                                value={profile.address} 
                                onChange={e=>setProfile({...profile, address: e.target.value})}
                                placeholder="Enter full address"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3.5 font-bold text-xs md:text-sm text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all h-24 resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 md:mt-8">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-[11px] tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <FaSave className="text-sm" />
                        {saving ? 'SAVING...' : 'SAVE PROFILE CHANGES'}
                    </button>
                </div>
            </div>

            {/* Profile Benefits */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-sm md:text-base font-black text-slate-800 flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-50">
                    <span className="text-orange-500 text-lg"><FaAward /></span>
                    Profile Benefits
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center text-lg"><FaCheckCircle /></div>
                        <h4 className="text-[10px] md:text-[11px] font-black text-slate-800 leading-tight">Verified Partner</h4>
                        <p className="text-[9px] font-bold text-slate-400 leading-snug">Trusted & verified travel agency</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center text-lg"><FaHeadset /></div>
                        <h4 className="text-[10px] md:text-[11px] font-black text-slate-800 leading-tight">Priority Support</h4>
                        <p className="text-[9px] font-bold text-slate-400 leading-snug">Get faster response from our team</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-lg"><FaUserTie /></div>
                        <h4 className="text-[10px] md:text-[11px] font-black text-slate-800 leading-tight">Dedicated Manager</h4>
                        <p className="text-[9px] font-bold text-slate-400 leading-snug">Personalized support for your business</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center text-lg"><FaChartBar /></div>
                        <h4 className="text-[10px] md:text-[11px] font-black text-slate-800 leading-tight">Better Insights</h4>
                        <p className="text-[9px] font-bold text-slate-400 leading-snug">Track performance & bookings</p>
                    </div>
                </div>
            </div>

            {/* Secure Footer */}
            <div className="bg-[#f0f5fa] rounded-3xl p-5 md:p-6 flex items-center justify-between gap-4 border border-blue-100/50 cursor-pointer hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white text-blue-500 rounded-full flex items-center justify-center text-lg shrink-0 shadow-sm border border-blue-100">
                        <FaShieldAlt />
                    </div>
                    <div>
                        <h4 className="text-[11px] md:text-xs font-black text-blue-900 tracking-wide">Your account is secure</h4>
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-500 mt-0.5 max-w-[280px] md:max-w-none">We use industry-standard security to keep your data safe and protected.</p>
                    </div>
                </div>
                <span className="text-blue-400 font-black">&gt;</span>
            </div>
        </div>
    );
};

export default AgentProfile;
