import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authService } from '../../services/api';
import { getValidationError } from '../../utils/validation';
import goyaflyLogo from '../../assets/goyafly_logo.png';

const AgentRegister = () => {
    const [formData, setFormData] = useState({
        agentName: '', agencyName: '', emailAddress: '', password: '', mobileNumber: '', address: '', gstNumber: '',
        shopDocCategory: 'Visiting Card'
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [kycFiles, setKycFiles] = useState({
        aadharFront: null, aadharBack: null, panCard: null, shopDoc: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const navigate = useNavigate();

    // Simulated Live Activity for Trust (Professional)
    const [livePartner, setLivePartner] = useState({ name: 'Rahul S.', city: 'Mumbai', time: '2 mins ago' });

    useEffect(() => {
        const partners = [
            { name: 'Priya K.', city: 'Delhi', time: 'Just now' },
            { name: 'Vikram A.', city: 'Bangalore', time: '5 mins ago' },
            { name: 'Anis R.', city: 'Kolkata', time: '1 min ago' }
        ];
        let i = 0;
        const interval = setInterval(() => {
            setLivePartner(partners[i]);
            i = (i + 1) % partners.length;
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    const handleFileUpload = (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        // Strict 100KB Limit
        if (file.size > 100 * 1024) {
            toast.error('File too large! Max 100KB allowed.');
            e.target.value = ''; // Reset input
            return;
        }

        // JPG/PNG check
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            toast.error('Only JPG and PNG files allowed!');
            e.target.value = '';
            return;
        }

        setKycFiles(prev => ({ ...prev, [field]: file }));
    };

    const validateStep1 = () => {
        const errors = {};
        const emailErr = getValidationError('emailAddress', formData.emailAddress);
        const mobileErr = getValidationError('mobileNumber', formData.mobileNumber);
        
        if (emailErr) errors.emailAddress = emailErr;
        if (mobileErr) errors.mobileNumber = mobileErr;
        if (!formData.agentName) errors.agentName = 'Name is required.';
        if (!formData.agencyName) errors.agencyName = 'Agency name is required.';

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep2 = () => {
        const errors = {};
        const passErr = getValidationError('password', formData.password);
        const gstErr = getValidationError('gstNumber', formData.gstNumber);
        
        if (passErr) errors.password = passErr;
        if (gstErr) errors.gstNumber = gstErr;
        if (!formData.address) errors.address = 'Address is required.';

        setFieldErrors(prev => ({ ...prev, ...errors }));
        return Object.keys(errors).length === 0;
    };

    const handleNextStep = () => {
        if (validateStep1()) {
            setStep(2);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!validateStep2()) {
            setLoading(false);
            return;
        }

        if (!kycFiles.aadharFront || !kycFiles.aadharBack || !kycFiles.panCard || !kycFiles.shopDoc) {
            setError('All 4 KYC documents are mandatory!');
            setLoading(false);
            return;
        }

        try {
            const data = new FormData();
            // Append all base fields
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            // Append files
            Object.keys(kycFiles).forEach(key => data.append(key, kycFiles[key]));

            await authService.agentRegister(data);
            toast.success('Registration request sent!');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    const benefits = [
        { title: 'Global Inventory', desc: 'Direct access to 500+ airlines and 1M+ hotels.', icon: '✈️' },
        { title: 'Instant Settlement', desc: 'Your commissions are settled instantly in your wallet.', icon: '💳' },
        { title: '24/7 Priority Support', desc: 'Dedicated helpdesk for your urgent booking needs.', icon: '🛡️' },
        { title: 'Zero Hidden Fees', desc: 'Transparent pricing with the industry\'s best net-fares.', icon: '💰' }
    ];

    return (
        <div className="min-h-screen w-full bg-white flex items-stretch overflow-hidden font-sans">
            {/* Left Brand Panel */}
            <div className="hidden md:flex md:w-[380px] lg:w-[480px] xl:w-[580px] bg-[#1D4171] relative overflow-hidden flex-col justify-between p-8 lg:p-14 text-white border-r border-white/5 shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-400/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>

                <div className="relative z-10">
                    <Link to="/" className="inline-block mb-10 lg:mb-14">
                        <div className="bg-white rounded-2xl px-4 py-2.5 shadow-2xl border border-white/40">
                            <img src={goyaflyLogo} alt="GoyaFly.com" className="h-14 lg:h-16 w-auto object-contain" style={{ maxWidth: '220px' }} />
                        </div>
                    </Link>

                    <h2 className="text-[2.5rem] lg:text-[3.5rem] xl:text-[4.5rem] font-black mb-6 lg:mb-10 tracking-tight leading-[1.1] animate-slide-up uppercase text-white">
                        Scaling <br />
                        <span className="text-[#F07E21]">Business</span> <br />
                        Worldwide
                    </h2>

                    <p className="text-white font-bold text-base lg:text-xl leading-relaxed mb-10 lg:mb-16 animate-fade-in opacity-90 max-w-md italic border-l-4 border-[#48A0D4] pl-6">
                        "Empowering travel professionals with India's most advanced B2B ecosystem for instant GDS ticketing and worldwide inventory."
                    </p>

                    <div className="space-y-8 lg:space-y-12 animate-slide-up">
                        {benefits.map((b, i) => (
                            <div key={i} className="flex gap-6 group">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-3xl border border-white/10 group-hover:bg-[#48A0D4] smooth-transition shadow-lg">
                                    {b.icon}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black text-[11px] lg:text-xs uppercase tracking-[0.4em] text-[#48A0D4] mb-1 group-hover:text-white transition-colors">
                                        {b.title}
                                    </h4>
                                    <p className="text-white text-xs lg:text-sm leading-snug font-medium opacity-80">
                                        {b.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom: Live Activity & Marquee */}
                <div className="relative z-10 mt-auto pt-10">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-full bg-[#48A0D4]/20 flex items-center justify-center text-xl">✅</div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#48A0D4]">Recent Verified Agent</p>
                            <p className="text-sm font-extrabold text-white">{livePartner.name} <span className="text-white/40 font-bold ml-1 italic">{livePartner.city}</span></p>
                        </div>
                    </div>
                    <div className="overflow-hidden border-t border-white/10 pt-6">
                        <div className="flex animate-marquee whitespace-nowrap gap-12 text-[10px] font-black tracking-[0.4em] uppercase text-white/30">
                            <span>🚀 GOYAFLY.COM: THE FUTURE OF B2B TRAVEL</span>
                            <span>💎 INSTANT SETTLEMENTS & KYC</span>
                            <span>🌍 WORLDWIDE HOTEL CLOUD</span>
                            <span>🚀 GOYAFLY.COM: THE FUTURE OF B2B TRAVEL</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="flex-1 overflow-y-auto bg-white flex flex-col items-center">
                <div className="w-full max-w-2xl px-6 py-10 md:px-12 lg:px-16 h-full flex flex-col">

                    {/* Mobile Logo */}
                    <div className="md:hidden flex justify-center mb-8">
                        <Link to="/">
                            <div className="bg-white rounded-2xl px-4 py-2.5 shadow-lg border border-gray-100">
                                <img src={goyaflyLogo} alt="GoyaFly.com" className="h-12 w-auto object-contain" style={{ maxWidth: '180px' }} />
                            </div>
                        </Link>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center justify-between mb-12 relative">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 -z-10"></div>
                        <div className="absolute top-1/2 left-0 h-1 bg-[#48A0D4] -translate-y-1/2 -z-10 smooth-transition" style={{ width: step === 1 ? '50%' : '100%' }}></div>
                        <div className="flex flex-col items-center gap-3">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 flex items-center justify-center font-black text-sm smooth-transition shadow-xl ${step >= 1 ? 'bg-[#1D4171] border-white text-white' : 'bg-white border-gray-100 text-gray-400'}`}>1</div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 1 ? 'text-[#1D4171]' : 'text-gray-400'}`}>Agency Profile</span>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 flex items-center justify-center font-black text-sm smooth-transition shadow-xl ${step === 2 ? 'bg-[#F07E21] border-white text-white' : 'bg-white border-gray-100 text-gray-400'}`}>2</div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${step === 2 ? 'text-[#F07E21]' : 'text-gray-400'}`}>Verification</span>
                        </div>
                    </div>

                    {/* Step Heading */}
                    <div className="mb-10 text-center">
                        <h3 className="text-3xl font-black text-[#1D4171] tracking-tight mb-2 uppercase italic leading-none">
                            {step === 1 ? 'Join the Network' : 'Final Step'}
                        </h3>
                        <p className="text-gray-400 font-bold text-sm tracking-wide">
                            {step === 1 ? 'Tell us about your travel agency profile.' : 'Complete your KYC for GDS activation.'}
                        </p>
                    </div>


                    <form onSubmit={handleSubmit} className="space-y-6">
                        {step === 1 ? (
                            <div className="space-y-6 animate-slide-left">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 group">
                                        <label className="text-[10px] font-black text-[#1D4171] uppercase tracking-widest ml-1 italic group-focus-within:text-[#F07E21] smooth-transition block">👤 Full Name</label>
                                        <input required className={`input-premium border-2 h-14 ${fieldErrors.agentName ? 'border-red-500' : ''}`} placeholder="Enter your name" onChange={e => setFormData({ ...formData, agentName: e.target.value })} />
                                        {fieldErrors.agentName && <p className="text-[9px] font-black text-red-500 uppercase ml-1">{fieldErrors.agentName}</p>}
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-[10px] font-black text-[#1D4171] uppercase tracking-widest ml-1 italic group-focus-within:text-[#F07E21] smooth-transition block">🏢 Agency Name</label>
                                        <input required className={`input-premium border-2 h-14 ${fieldErrors.agencyName ? 'border-red-500' : ''}`} placeholder="Agency legal name" onChange={e => setFormData({ ...formData, agencyName: e.target.value })} />
                                        {fieldErrors.agencyName && <p className="text-[9px] font-black text-red-500 uppercase ml-1">{fieldErrors.agencyName}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 group">
                                        <label className="text-[10px] font-black text-[#1D4171] uppercase tracking-widest ml-1 italic group-focus-within:text-[#F07E21] smooth-transition block">📧 Business Email</label>
                                        <input type="email" required className={`input-premium border-2 h-14 ${fieldErrors.emailAddress ? 'border-red-500' : ''}`} placeholder="corporate@agency.com" onChange={e => setFormData({ ...formData, emailAddress: e.target.value })} />
                                        {fieldErrors.emailAddress && <p className="text-[9px] font-black text-red-500 uppercase ml-1">{fieldErrors.emailAddress}</p>}
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-[10px] font-black text-[#1D4171] uppercase tracking-widest ml-1 italic group-focus-within:text-[#F07E21] smooth-transition block">📱 Mobile Number</label>
                                        <input required className={`input-premium border-2 h-14 ${fieldErrors.mobileNumber ? 'border-red-500' : ''}`} placeholder="+91 00000 00000" onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })} />
                                        {fieldErrors.mobileNumber && <p className="text-[9px] font-black text-red-500 uppercase ml-1">{fieldErrors.mobileNumber}</p>}
                                    </div>
                                </div>
                                <div className="pt-8 text-center sm:text-right">
                                    <button type="button" onClick={handleNextStep} className="w-full sm:w-auto px-12 py-5 bg-[#1D4171] hover:bg-black text-white font-black rounded-2xl shadow-2xl transition-all transform hover:scale-[1.05] active:scale-95 text-sm tracking-[0.2em] uppercase">
                                        Continue ➔
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-slide-left">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-[#1D4171] uppercase tracking-widest ml-1 italic block">📍 Headquarters Address</label>
                                    <input required className="input-premium border-2 h-14" placeholder="Full business location address" onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                </div>

                                {/* Mandatory KYC Uploads */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-3xl border-2 border-dashed border-gray-100">
                                    <div className="col-span-full">
                                        <h4 className="text-[11px] font-black text-[#1D4171] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <span className="text-xl">📸</span> Mandatory KYC Documents (Max 100KB each, JPG/PNG)
                                        </h4>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 block">Aadhar Front *</label>
                                        <input type="file" required accept=".jpg,.jpeg,.png" className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-[#1D4171] file:text-white hover:file:bg-black cursor-pointer" 
                                            onChange={(e) => handleFileUpload(e, 'aadharFront')} />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 block">Aadhar Back *</label>
                                        <input type="file" required accept=".jpg,.jpeg,.png" className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-[#1D4171] file:text-white hover:file:bg-black cursor-pointer" 
                                            onChange={(e) => handleFileUpload(e, 'aadharBack')} />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 block">PAN Card *</label>
                                        <input type="file" required accept=".jpg,.jpeg,.png" className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-[#1D4171] file:text-white hover:file:bg-black cursor-pointer" 
                                            onChange={(e) => handleFileUpload(e, 'panCard')} />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 block">Business Proof Type *</label>
                                            <select 
                                                className="input-premium border-2 w-full appearance-none cursor-pointer" 
                                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231D4171'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1rem' }}
                                                onChange={e => setFormData({ ...formData, shopDocCategory: e.target.value })}
                                            >
                                                <option value="Visiting Card">Visiting Card</option>
                                                <option value="CSC ID">CSC ID</option>
                                                <option value="Shop Image">Shop Image</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#F07E21] uppercase tracking-widest ml-1 block italic underline underline-offset-4">Attach {formData.shopDocCategory} *</label>
                                            <input type="file" required accept=".jpg,.jpeg,.png" className="w-full text-xs file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-[#F07E21] file:text-white hover:file:bg-black cursor-pointer bg-orange-50/50 rounded-2xl p-3 border-2 border-dashed border-orange-100" 
                                                onChange={(e) => handleFileUpload(e, 'shopDoc')} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 group">
                                        <label className="text-[10px] font-black text-[#1D4171] uppercase tracking-widest ml-1 italic block">🏷️ GSTIN (Optional)</label>
                                        <input className={`input-premium border-2 h-14 ${fieldErrors.gstNumber ? 'border-red-500' : ''}`} placeholder="Enter GST Number" onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} />
                                        {fieldErrors.gstNumber && <p className="text-[9px] font-black text-red-500 uppercase ml-1">{fieldErrors.gstNumber}</p>}
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-[10px] font-black text-[#1D4171] uppercase tracking-widest ml-1 italic block">🔐 Set Access Password</label>
                                        <input type="password" required className={`input-premium border-2 h-14 ${fieldErrors.password ? 'border-red-500' : ''}`} placeholder="••••••••" onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                        {fieldErrors.password && <p className="text-[9px] font-black text-red-500 uppercase ml-1">{fieldErrors.password}</p>}
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 animate-bounce-in">
                                        <span className="text-xl">⚠️</span>
                                        <p className="text-red-700 text-xs font-black">{error}</p>
                                    </div>
                                )}

                                <div className="pt-8 flex flex-col sm:flex-row gap-4">
                                    <button type="button" onClick={() => setStep(1)} className="order-2 sm:order-1 flex-1 py-5 border-2 border-gray-100 hover:bg-gray-50 text-gray-400 font-black rounded-2xl transition-all uppercase text-xs tracking-widest">
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="order-1 sm:order-2 flex-[2] py-5 bg-[#F07E21] hover:bg-[#d96c13] text-white font-black rounded-2xl shadow-xl hover:shadow-[#F07E21]/40 transition-all transform hover:scale-[1.05] active:scale-95 text-xs tracking-[0.2em] uppercase disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : 'Complete Register'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-gray-50 text-center">
                    <p className="text-gray-300 text-[9px] mb-8 font-black uppercase tracking-[0.4em]">
                        Global GDS Access Portal • Goyafly.com Security
                    </p>
                    <Link to="/login" className="inline-flex items-center gap-4 group">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#1D4171] smooth-transition">Member?</span>
                        <span className="text-sm font-black text-[#1D4171] group-hover:underline">Sign In Now</span>
                        <span className="text-[#F07E21] group-hover:translate-x-2 smooth-transition">➔</span>
                    </Link>
                </div>
                </div>
            </div>
        </div>
    );
};

export default AgentRegister;
