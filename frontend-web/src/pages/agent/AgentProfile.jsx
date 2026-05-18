import React, { useState, useEffect } from 'react';
import { authService } from '../../services/api';
import { toast } from 'react-toastify';

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

    if (loading) return <div className="p-20 text-center font-black text-gray-300 italic">Loading Profile...</div>;

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 md:space-y-10 animate-fade-in px-3 sm:px-4 md:px-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <span className="text-2xl sm:text-3xl md:text-4xl p-2 sm:p-3 md:p-4 bg-primary-50 rounded-lg sm:rounded-2xl md:rounded-3xl shadow-sm">👤</span>
                <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">Agency Profile</h2>
                    <p className="text-gray-400 font-bold uppercase text-[8px] sm:text-[9px] md:text-[10px] tracking-widest">Portal Identity & Security</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                {/* Left: Logo & Identity */}
                <div className="md:col-span-1 space-y-6 sm:space-y-8">
                    <div className="bg-white p-6 sm:p-8 md:p-10 rounded-lg sm:rounded-2xl md:rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 sm:h-2 bg-primary-500"></div>
                        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gray-50 rounded-lg sm:rounded-xl md:rounded-[2rem] flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-black text-primary-100 mb-4 sm:mb-6 border-4 border-dashed border-gray-100 overflow-hidden">
                            {profile.logo ? (
                                <img src={`http://localhost:5000${profile.logo}`} alt="Agency Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                profile.agencyName.substring(0,1).toUpperCase()
                            )}
                        </div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 mb-1">{profile.agencyName}</h3>
                        <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 sm:mb-6 border-b pb-3 sm:pb-4 w-full">Verified Partner</p>
                        <a 
                            href={`mailto:admin@goyafly.com?subject=Agency Logo Update Request - ${profile.agencyName}&body=Hello Goyafly Admin,%0D%0A%0D%0APlease find attached our official agency logo for updating our portal profile.%0D%0A%0D%0AAgency Name: ${profile.agencyName}%0D%0AOfficial Email: ${profile.email}%0D%0AMobile: ${profile.mobile}%0D%0A%0D%0A[Please attach your logo file before sending]`}
                            className="w-full py-2.5 sm:py-3 md:py-4 bg-primary-50 hover:bg-primary-100 text-primary-600 font-black rounded-lg sm:rounded-lg md:rounded-xl text-[7px] sm:text-[8px] md:text-[9px] tracking-[0.2em] border border-primary-200 uppercase text-center px-2 transition-all block shadow-sm hover:shadow transform hover:scale-[1.02]"
                        >
                            ✉️ Contact Admin to Update Logo
                        </a>
                    </div>

                    <div className="bg-primary-600 p-5 sm:p-6 md:p-8 rounded-lg sm:rounded-xl md:rounded-[2rem] text-white shadow-xl shadow-primary-500/20">
                        <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 sm:mb-4 opacity-60">Account Security</p>
                        <h4 className="text-base sm:text-lg md:text-xl font-black mb-4 sm:mb-6">Password Protection</h4>
                        <button className="w-full py-2.5 sm:py-3 md:py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-lg sm:rounded-lg md:rounded-xl text-[8px] sm:text-[9px] md:text-[10px] transition-all border border-white/20">CHANGE PASSWORD</button>
                    </div>
                </div>

                {/* Right: Detailed Info */}
                <div className="md:col-span-2">
                    <div className="bg-white p-6 sm:p-8 md:p-10 lg:p-12 rounded-lg sm:rounded-2xl md:rounded-3xl lg:rounded-[3.5rem] shadow-2xl border border-gray-100 space-y-6 sm:space-y-8 md:space-y-10">
                        <h3 className="text-base sm:text-lg md:text-xl font-black text-gray-900 flex items-center gap-2 md:gap-3">
                            <span className="w-1 h-6 sm:h-8 bg-secondary-500 rounded-full"></span>
                            General Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                            <div className="space-y-2">
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Agency Name</label>
                                <input type="text" value={profile.agencyName} onChange={e=>setProfile({...profile, agencyName: e.target.value})} className="w-full bg-gray-50 border-0 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 font-bold text-xs sm:text-sm md:text-base text-gray-700 shadow-inner" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Agency Owner</label>
                                <input type="text" value={profile.ownerName} onChange={e=>setProfile({...profile, ownerName: e.target.value})} className="w-full bg-gray-50 border-0 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 font-bold text-xs sm:text-sm md:text-base text-gray-700 shadow-inner" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Email</label>
                                <input type="email" value={profile.email} readOnly className="w-full bg-gray-100 border-0 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 font-bold text-xs sm:text-sm md:text-base text-gray-400 shadow-inner cursor-not-allowed" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GST Number</label>
                                <input type="text" value={profile.gstNumber} onChange={e=>setProfile({...profile, gstNumber: e.target.value})} className="w-full bg-gray-50 border-0 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 font-bold text-xs sm:text-sm md:text-base text-gray-700 shadow-inner" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Phone</label>
                                <input type="text" value={profile.mobile} onChange={e=>setProfile({...profile, mobile: e.target.value})} className="w-full bg-gray-50 border-0 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 font-bold text-xs sm:text-sm md:text-base text-gray-700 shadow-inner" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location City</label>
                                <input type="text" value={profile.city} onChange={e=>setProfile({...profile, city: e.target.value})} className="w-full bg-gray-50 border-0 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 font-bold text-xs sm:text-sm md:text-base text-gray-700 shadow-inner" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Physical Address</label>
                                <textarea 
                                    value={profile.address} 
                                    onChange={e=>setProfile({...profile, address: e.target.value})}
                                    className="w-full bg-gray-50 border-0 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 font-bold text-xs sm:text-sm md:text-base text-gray-700 shadow-inner h-24 sm:h-28 md:h-32"
                                />
                            </div>
                        </div>

                        <div className="pt-6 sm:pt-8 border-t border-gray-50 flex justify-end">
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5 bg-primary-500 text-white font-black rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[2rem] shadow-xl shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm md:text-base tracking-widest disabled:opacity-50"
                            >
                                {saving ? 'SAVING...' : 'SAVE PROFILE CHANGES'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentProfile;
