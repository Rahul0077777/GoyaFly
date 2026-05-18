import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { toast } from 'react-toastify';

const KycStatusCheck = () => {
    const navigate = useNavigate();
    const agentInfo = JSON.parse(localStorage.getItem('agentInfo') || '{}');
    const [loading, setLoading] = useState(false);
    const [kycFiles, setKycFiles] = useState({
        aadharFront: null, aadharBack: null, panCard: null, shopDoc: null
    });
    const [shopDocCategory, setShopDocCategory] = useState('Visiting Card');

    const handleLogout = () => {
        authService.agentLogout();
        navigate('/login');
    };

    const handleFileUpload = (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 100 * 1024) {
            toast.error('File too large! Max 100KB allowed.');
            e.target.value = '';
            return;
        }

        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            toast.error('Only JPG and PNG files allowed!');
            e.target.value = '';
            return;
        }

        setKycFiles(prev => ({ ...prev, [field]: file }));
    };

    const handleResubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!kycFiles.aadharFront || !kycFiles.aadharBack || !kycFiles.panCard || !kycFiles.shopDoc) {
            toast.error('All 4 KYC documents are mandatory!');
            setLoading(false);
            return;
        }

        try {
            const data = new FormData();
            data.append('shopDocCategory', shopDocCategory);
            Object.keys(kycFiles).forEach(key => data.append(key, kycFiles[key]));

            // Reuse the registration logic but maybe a different endpoint for re-submission if needed.
            // For now, let's assume we use the profile update or a new kyc-resubmit endpoint.
            // I'll add a kycResubmit endpoint in authService.
            await authService.agentKycResubmit(data);
            
            toast.success('KYC Re-submitted! Please wait for approval.');
            
            // Log them out or update status
            const updatedInfo = { ...agentInfo, kycStatus: 'PENDING', kycRejectReason: null };
            localStorage.setItem('agentInfo', JSON.stringify(updatedInfo));
            window.location.reload(); 
        } catch (err) {
            toast.error(err.response?.data?.message || 'Re-submission failed.');
        } finally {
            setLoading(false);
        }
    };

    if (agentInfo.kycStatus === 'PENDING') {
        return (
            <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-blue-50 text-[#1D4171] rounded-full flex items-center justify-center text-4xl mx-auto mb-8 animate-pulse">
                        ⏳
                    </div>
                    <h2 className="text-2xl font-black text-[#1D4171] uppercase tracking-tight mb-4 italic">Verification in Progress</h2>
                    <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                        Our administrative team is currently reviewing your documents. This process usually takes 1-2 business hours.
                    </p>
                    <div className="space-y-4">
                        <button onClick={handleLogout} className="w-full py-4 border-2 border-gray-100 text-gray-400 font-bold rounded-2xl hover:bg-gray-50 transition-all uppercase text-xs tracking-widest">
                            Exit Portal
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (agentInfo.kycStatus === 'REJECTED') {
        return (
            <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center p-6">
                <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100 flex flex-col md:flex-row">
                    {/* Reason Side */}
                    <div className="w-full md:w-5/12 bg-red-500 p-10 text-white flex flex-col justify-center">
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-6 leading-none">Verification <br />Rejected</h2>
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 mb-8">
                            <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Admin Feedback</p>
                            <p className="text-sm font-bold leading-relaxed">{agentInfo.kycRejectReason || 'One or more documents were invalid.'}</p>
                        </div>
                        <button onClick={handleLogout} className="text-white/60 font-bold text-xs uppercase tracking-widest hover:text-white transition-all text-left">➔ Logout</button>
                    </div>

                    {/* Resubmit Form */}
                    <div className="flex-1 p-10">
                        <h3 className="text-xl font-black text-[#1D4171] uppercase tracking-tight mb-6 italic">Re-upload Documents</h3>
                        <form onSubmit={handleResubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Aadhar Front</label>
                                    <input type="file" required accept=".jpg,.jpeg,.png" onChange={e => handleFileUpload(e, 'aadharFront')} className="text-[10px]" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Aadhar Back</label>
                                    <input type="file" required accept=".jpg,.jpeg,.png" onChange={e => handleFileUpload(e, 'aadharBack')} className="text-[10px]" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">PAN Card</label>
                                    <input type="file" required accept=".jpg,.jpeg,.png" onChange={e => handleFileUpload(e, 'panCard')} className="text-[10px]" />
                                </div>
                                <div className="pt-2 border-t border-gray-100">
                                    <select className="w-full bg-gray-50 border-0 rounded-xl px-4 py-2 text-xs font-bold mb-2" value={shopDocCategory} onChange={e => setShopDocCategory(e.target.value)}>
                                        <option>Visiting Card</option>
                                        <option>CSC ID</option>
                                        <option>Shop Image</option>
                                    </select>
                                    <input type="file" required accept=".jpg,.jpeg,.png" onChange={e => handleFileUpload(e, 'shopDoc')} className="text-[10px]" />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-4 bg-[#F07E21] text-white font-black rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 uppercase text-xs tracking-widest mt-4">
                                {loading ? 'Uploading...' : 'Submit Documents'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default KycStatusCheck;
