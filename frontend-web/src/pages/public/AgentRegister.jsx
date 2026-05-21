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
                        <div className="bg-white rounded-2xl px-5 py-3 shadow-2xl border border-white/40 flex flex-col items-center justify-center">
                            <div className="flex items-center text-2xl lg:text-3xl font-black font-sans leading-none tracking-tight">
                                <span className="text-[#1D4171]">Goya</span>
                                <span className="text-[#F25C05]">fly</span>
                                <span className="text-[#1D4171] text-base font-bold ml-0.5">.com</span>
                            </div>
                            <span className="text-[7px] font-black text-[#1D4171]/60 uppercase tracking-[0.2em] mt-1 font-sans">Smart ways to travel</span>
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
                        <div className="w-10 h-10 rounded-full bg-[#48A0D4]/20 flex items-center justify-center text-xl">✔️</div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#48A0D4]">Recent Verified Agent</p>
                            <p className="text-sm font-extrabold text-white">{livePartner.name} <span className="text-white/40 font-bold ml-1 italic">{livePartner.city}</span></p>
                        </div>
                    </div>
                    <div className="overflow-hidden border-t border-white/10 pt-6">
                        <div className="flex animate-marquee whitespace-nowrap gap-12 text-[10px] font-black tracking-[0.4em] uppercase text-white/30">
                            <span>🚀 GOYAFLY.COM: THE FUTURE OF B2B TRAVEL</span>
                            <span>💎 INSTANT SETTLEMENTS & KYC</span>
                            <span>🌐 WORLDWIDE HOTEL CLOUD</span>
                            <span>🚀 GOYAFLY.COM: THE FUTURE OF B2B TRAVEL</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Form Panel */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#f2f7fc] via-[#e5f0f9] to-[#f3f8fc] flex flex-col items-center justify-start py-12 px-4 sm:px-6 relative overflow-hidden">
                {/* Background Ambient Glows */}
                <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-blue-200/20 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-orange-100/10 rounded-full blur-[100px] pointer-events-none"></div>
                
                {/* Dotted pattern (top-left) */}
                <div className="absolute top-8 left-8 opacity-25 pointer-events-none hidden lg:block">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="4" cy="4" r="2" fill="#94A3B8" />
                        <circle cx="20" cy="4" r="2" fill="#94A3B8" />
                        <circle cx="36" cy="4" r="2" fill="#94A3B8" />
                        <circle cx="52" cy="4" r="2" fill="#94A3B8" />
                        <circle cx="4" cy="20" r="2" fill="#94A3B8" />
                        <circle cx="20" cy="20" r="2" fill="#94A3B8" />
                        <circle cx="36" cy="20" r="2" fill="#94A3B8" />
                        <circle cx="52" cy="20" r="2" fill="#94A3B8" />
                        <circle cx="4" cy="36" r="2" fill="#94A3B8" />
                        <circle cx="20" cy="36" r="2" fill="#94A3B8" />
                        <circle cx="36" cy="36" r="2" fill="#94A3B8" />
                        <circle cx="52" cy="36" r="2" fill="#94A3B8" />
                        <circle cx="4" cy="52" r="2" fill="#94A3B8" />
                        <circle cx="20" cy="52" r="2" fill="#94A3B8" />
                        <circle cx="36" cy="52" r="2" fill="#94A3B8" />
                        <circle cx="52" cy="52" r="2" fill="#94A3B8" />
                    </svg>
                </div>
                
                {/* Airplane and Flight Trail (top-right) */}
                <div className="absolute top-8 right-8 opacity-30 pointer-events-none hidden lg:block">
                    <svg width="150" height="90" viewBox="0 0 150 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 80C50 65 100 45 130 15" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" />
                        <g transform="translate(130, 15) rotate(-35)">
                            <path d="M12 2C11.5 2 11 2.5 11 3v6l-7 4v2l7-2v4l-2 2v1.5l3.5-1 3.5 1V17l-2-2v-4l7 2v-2l-7-4V3c0-.5-.5-1-1-1z" fill="#0D5AD9" />
                        </g>
                    </svg>
                </div>

                <div className="w-full max-w-xl relative z-10">
                    {/* Logo Header */}
                    <div className="flex flex-col items-center mb-8">
                        <Link to="/" className="mb-2 group">
                            <div className="flex items-center text-3xl font-black font-sans leading-none tracking-tight group-hover:scale-105 transition-transform duration-300">
                                <span className="text-[#0D5AD9]">Goya</span>
                                <span className="text-[#F25C05]">fly</span>
                                <span className="text-[#0D5AD9] text-lg font-black ml-0.5">.com</span>
                            </div>
                        </Link>
                        <p className="text-[10px] font-black text-blue-900/60 uppercase tracking-[0.3em] font-sans">Smart ways to travel</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-between mb-10 px-8 relative">
                        <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-slate-200 -translate-y-1/2 -z-10"></div>
                        <div className="absolute top-1/2 left-8 h-0.5 bg-[#0D5AD9] -translate-y-1/2 -z-10 smooth-transition" style={{ width: step === 1 ? '45%' : '90%' }}></div>
                        
                        <div className="flex flex-col items-center gap-2 z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm smooth-transition shadow-sm ${step >= 1 ? 'bg-[#0D5AD9] text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>1</div>
                            <span className={`text-[9px] font-black uppercase tracking-wider ${step >= 1 ? 'text-[#1D4171]' : 'text-slate-400'}`}>AGENCY PROFILE</span>
                        </div>
                        
                        <div className="flex flex-col items-center gap-2 z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm smooth-transition shadow-sm ${step === 2 ? 'bg-[#0D5AD9] text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>2</div>
                            <span className={`text-[9px] font-black uppercase tracking-wider ${step === 2 ? 'text-[#1D4171]' : 'text-slate-400'}`}>VERIFICATION</span>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-[2rem] border border-blue-100/60 shadow-[0_20px_50px_rgba(10,100,219,0.05)] p-6 sm:p-10">
                        <div className="mb-8 text-center">
                            <h3 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight uppercase italic leading-none">
                                {step === 1 ? 'JOIN THE NETWORK' : 'FINAL STEP'}
                            </h3>
                            <div className="w-10 h-0.5 bg-[#0D5AD9] mx-auto mt-2.5 rounded-full"></div>
                            <p className="text-slate-400 font-bold text-xs sm:text-sm tracking-wide mt-3">
                                {step === 1 ? 'Tell us about your travel agency profile.' : 'Complete your KYC for GDS activation.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {step === 1 ? (
                                <div className="space-y-4 animate-slide-left">
                                    {/* Full Name */}
                                    <div className={`bg-white border rounded-2xl p-3 flex items-center gap-4 transition-all focus-within:border-blue-300 focus-within:shadow-[0_4px_20px_rgba(13,90,217,0.04)] ${fieldErrors.agentName ? 'border-red-300 bg-red-50/10' : 'border-blue-100/80'}`}>
                                        <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-[#0D5AD9] text-base shrink-0">👤</div>
                                        <div className="flex-1 flex flex-col min-w-0">
                                            <label className="text-[9px] font-bold text-[#0D5AD9] uppercase tracking-widest mb-0.5">FULL NAME</label>
                                            <input required className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-800 placeholder-slate-300" placeholder="Enter your name" value={formData.agentName} onChange={e => setFormData({ ...formData, agentName: e.target.value })} />
                                        </div>
                                    </div>
                                    {fieldErrors.agentName && <p className="text-[9px] font-black text-red-500 uppercase ml-4">{fieldErrors.agentName}</p>}

                                    {/* Agency Name */}
                                    <div className={`bg-white border rounded-2xl p-3 flex items-center gap-4 transition-all focus-within:border-blue-300 focus-within:shadow-[0_4px_20px_rgba(13,90,217,0.04)] ${fieldErrors.agencyName ? 'border-red-300 bg-red-50/10' : 'border-blue-100/80'}`}>
                                        <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-[#0D5AD9] text-base shrink-0">🏢</div>
                                        <div className="flex-1 flex flex-col min-w-0">
                                            <label className="text-[9px] font-bold text-[#0D5AD9] uppercase tracking-widest mb-0.5">AGENCY NAME</label>
                                            <input required className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-800 placeholder-slate-300" placeholder="Agency legal name" value={formData.agencyName} onChange={e => setFormData({ ...formData, agencyName: e.target.value })} />
                                        </div>
                                    </div>
                                    {fieldErrors.agencyName && <p className="text-[9px] font-black text-red-500 uppercase ml-4">{fieldErrors.agencyName}</p>}

                                    {/* Business Email */}
                                    <div className={`bg-white border rounded-2xl p-3 flex items-center gap-4 transition-all focus-within:border-blue-300 focus-within:shadow-[0_4px_20px_rgba(13,90,217,0.04)] ${fieldErrors.emailAddress ? 'border-red-300 bg-red-50/10' : 'border-blue-100/80'}`}>
                                        <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-[#0D5AD9] text-base shrink-0">✉️</div>
                                        <div className="flex-1 flex flex-col min-w-0">
                                            <label className="text-[9px] font-bold text-[#0D5AD9] uppercase tracking-widest mb-0.5">BUSINESS EMAIL</label>
                                            <input type="email" required className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-800 placeholder-slate-300" placeholder="corporate@agency.com" value={formData.emailAddress} onChange={e => setFormData({ ...formData, emailAddress: e.target.value })} />
                                        </div>
                                    </div>
                                    {fieldErrors.emailAddress && <p className="text-[9px] font-black text-red-500 uppercase ml-4">{fieldErrors.emailAddress}</p>}

                                    {/* Mobile Number */}
                                    <div className={`bg-white border rounded-2xl p-3 flex items-center gap-4 transition-all focus-within:border-blue-300 focus-within:shadow-[0_4px_20px_rgba(13,90,217,0.04)] ${fieldErrors.mobileNumber ? 'border-red-300 bg-red-50/10' : 'border-blue-100/80'}`}>
                                        <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-[#0D5AD9] text-base shrink-0">📞</div>
                                        <div className="flex-1 flex flex-col min-w-0">
                                            <label className="text-[9px] font-bold text-[#0D5AD9] uppercase tracking-widest mb-0.5">MOBILE NUMBER</label>
                                            <input required className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-800 placeholder-slate-300" placeholder="+91 00000 00000" value={formData.mobileNumber} onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })} />
                                        </div>
                                    </div>
                                    {fieldErrors.mobileNumber && <p className="text-[9px] font-black text-red-500 uppercase ml-4">{fieldErrors.mobileNumber}</p>}

                                    {/* Gradient Continue Button */}
                                    <div className="pt-4">
                                        <button 
                                            type="button" 
                                            onClick={handleNextStep} 
                                            className="w-full h-16 bg-gradient-to-r from-[#0D5AD9] to-[#F25C05] hover:shadow-2xl hover:shadow-[#0D5AD9]/20 text-white font-black rounded-[1.5rem] transition-all transform active:scale-98 text-sm tracking-[0.2em] uppercase flex items-center justify-between pl-8 pr-3 relative overflow-hidden group shadow-lg"
                                        >
                                            <span>CONTINUE →</span>
                                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-all text-sm">✨</div>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-slide-left">
                                    {/* Headquarters Address */}
                                    <div className="bg-white border border-blue-100/80 rounded-2xl p-3 flex items-center gap-4 transition-all focus-within:border-blue-300 focus-within:shadow-[0_4px_20px_rgba(13,90,217,0.04)]">
                                        <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-[#0D5AD9] text-base shrink-0">📍</div>
                                        <div className="flex-1 flex flex-col min-w-0">
                                            <label className="text-[9px] font-bold text-[#0D5AD9] uppercase tracking-widest mb-0.5">HEADQUARTERS ADDRESS</label>
                                            <input required className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-800 placeholder-slate-300" placeholder="Full business location address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Mandatory KYC Uploads section */}
                                    <div className="bg-slate-50/60 p-5 rounded-[2rem] border border-blue-50 space-y-4">
                                        <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.15em] flex items-center gap-2 mb-2">
                                            <span>📸</span> MANDATORY KYC (Max 100KB, JPG/PNG)
                                        </h4>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1.5 bg-white p-3.5 border border-blue-50 rounded-2xl">
                                                <span className="text-[9px] font-bold text-[#0D5AD9] uppercase tracking-widest ml-1">AADHAR FRONT *</span>
                                                <input type="file" required accept=".jpg,.jpeg,.png" className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[9px] file:font-black file:bg-[#0D5AD9] file:text-white hover:file:bg-black cursor-pointer bg-slate-50/50 rounded-xl p-1.5" 
                                                    onChange={(e) => handleFileUpload(e, 'aadharFront')} />
                                            </div>

                                            <div className="flex flex-col gap-1.5 bg-white p-3.5 border border-blue-50 rounded-2xl">
                                                <span className="text-[9px] font-bold text-[#0D5AD9] uppercase tracking-widest ml-1">AADHAR BACK *</span>
                                                <input type="file" required accept=".jpg,.jpeg,.png" className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[9px] file:font-black file:bg-[#0D5AD9] file:text-white hover:file:bg-black cursor-pointer bg-slate-50/50 rounded-xl p-1.5" 
                                                    onChange={(e) => handleFileUpload(e, 'aadharBack')} />
                                            </div>

                                            <div className="flex flex-col gap-1.5 bg-white p-3.5 border border-blue-50 rounded-2xl">
                                                <span className="text-[9px] font-bold text-[#0D5AD9] uppercase tracking-widest ml-1">PAN CARD *</span>
                                                <input type="file" required accept=".jpg,.jpeg,.png" className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[9px] file:font-black file:bg-[#0D5AD9] file:text-white hover:file:bg-black cursor-pointer bg-slate-50/50 rounded-xl p-1.5" 
                                                    onChange={(e) => handleFileUpload(e, 'panCard')} />
                                            </div>

                                            <div className="flex flex-col gap-1.5 bg-white p-3.5 border border-blue-50 rounded-2xl">
                                                <span className="text-[9px] font-bold text-[#0D5AD9] uppercase tracking-widest ml-1">BUSINESS PROOF TYPE *</span>
                                                <select 
                                                    className="w-full bg-slate-50/50 border border-blue-50 rounded-xl p-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-300"
                                                    value={formData.shopDocCategory}
                                                    onChange={e => setFormData({ ...formData, shopDocCategory: e.target.value })}
                                                >
                                                    <option value="Visiting Card">Visiting Card</option>
                                                    <option value="CSC ID">CSC ID</option>
                                                    <option value="Shop Image">Shop Image</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1.5 bg-white p-3.5 border border-orange-100 rounded-2xl">
                                            <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest ml-1 block italic underline">ATTACH {formData.shopDocCategory.toUpperCase()} *</span>
                                            <input type="file" required accept=".jpg,.jpeg,.png" className="w-full text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-black file:bg-orange-500 fill-white hover:file:bg-black cursor-pointer bg-orange-50/20 rounded-xl p-1.5" 
                                                onChange={(e) => handleFileUpload(e, 'shopDoc')} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* GSTIN */}
                                        <div className={`bg-white border rounded-2xl p-3 flex items-center gap-4 transition-all focus-within:border-blue-300 focus-within:shadow-[0_4px_20px_rgba(13,90,217,0.04)] ${fieldErrors.gstNumber ? 'border-red-300' : 'border-blue-100/80'}`}>
                                            <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-[#0D5AD9] text-base shrink-0">🏷️</div>
                                            <div className="flex-1 flex flex-col min-w-0">
                                                <label className="text-[9px] font-bold text-[#0D5AD9] uppercase tracking-widest mb-0.5">GSTIN (OPTIONAL)</label>
                                                <input className="w-full bg-transparent border-none outline-none font-bold text-xs text-slate-800 placeholder-slate-300" placeholder="Enter GST Number" value={formData.gstNumber} onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} />
                                            </div>
                                        </div>

                                        {/* Password */}
                                        <div className={`bg-white border rounded-2xl p-3 flex items-center gap-4 transition-all focus-within:border-blue-300 focus-within:shadow-[0_4px_20px_rgba(13,90,217,0.04)] ${fieldErrors.password ? 'border-red-300' : 'border-blue-100/80'}`}>
                                            <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-[#0D5AD9] text-base shrink-0">🔐</div>
                                            <div className="flex-1 flex flex-col min-w-0">
                                                <label className="text-[9px] font-bold text-[#0D5AD9] uppercase tracking-widest mb-0.5">SET PASSWORD</label>
                                                <input type="password" required className="w-full bg-transparent border-none outline-none font-bold text-xs text-slate-800 placeholder-slate-300" placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                    {fieldErrors.gstNumber && <p className="text-[9px] font-black text-red-500 uppercase ml-4">{fieldErrors.gstNumber}</p>}
                                    {fieldErrors.password && <p className="text-[9px] font-black text-red-500 uppercase ml-4">{fieldErrors.password}</p>}

                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-bounce-in">
                                            <span className="text-xl">⚠️</span>
                                            <p className="text-red-700 text-xs font-black">{error}</p>
                                        </div>
                                    )}

                                    <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                        <button type="button" onClick={() => setStep(1)} className="order-2 sm:order-1 flex-1 h-16 border border-blue-100 hover:bg-slate-50 text-slate-500 font-black rounded-[1.5rem] transition-all uppercase text-xs tracking-widest">
                                            BACK
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="order-1 sm:order-2 flex-[2] h-16 bg-gradient-to-r from-[#0D5AD9] to-[#F25C05] hover:shadow-2xl hover:shadow-[#0D5AD9]/20 text-white font-black rounded-[1.5rem] transition-all transform active:scale-98 text-xs tracking-[0.15em] uppercase disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loading ? 'PROCESSING...' : 'COMPLETE REGISTER'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>

                        {/* Sign In Redirect */}
                        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                            <Link to="/login" className="inline-flex items-center gap-2 group">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Already a Partner?</span>
                                <span className="text-xs font-black text-blue-900 group-hover:underline">Sign In Now</span>
                                <span className="text-orange-500 group-hover:translate-x-1 smooth-transition">➔</span>
                            </Link>
                        </div>
                    </div>

                    {/* Footer Security Badge */}
                    <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-xs font-bold">
                        <span className="text-blue-600 text-sm">🛡️</span>
                        <span>Your information is secure with us</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentRegister;
