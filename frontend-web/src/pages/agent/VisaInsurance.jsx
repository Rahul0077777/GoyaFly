import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { visaService, insuranceService } from '../../services/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const VisaInsurance = () => {
    const [tab, setTab] = useState('visa');
    const [country, setCountry] = useState('');
    const [selectedCountryLabel, setSelectedCountryLabel] = useState('UAE (United Arab Emirates)');
    const [showRequirements, setShowRequirements] = useState(false);
    const [visas, setVisas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeVisa, setActiveVisa] = useState(null);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const navigate = useNavigate();

    const popularCountries = [
        'UAE (United Arab Emirates)', 'Singapore', 'Thailand', 'Malaysia',
        'Japan', 'USA (United States)', 'UK (United Kingdom)', 'Australia',
        'Canada', 'Schengen (Europe)', 'Sri Lanka', 'Maldives',
        'Indonesia (Bali)', 'Vietnam', 'Turkey', 'Egypt',
    ];

    const [insurancePlans, setInsurancePlans] = useState([]);

    const whyChoose = [
        { icon: '🛡️', title: '100% Compliant', desc: 'We ensure complete document verification & compliance', color: '#1D4171' },
        { icon: '⚡', title: 'Fast Processing', desc: 'Quick turnaround time for your visa applications', color: '#22c55e' },
        { icon: '🎧', title: 'Expert Support', desc: 'Our visa experts assist you at every step', color: '#8b5cf6' },
        { icon: '🔒', title: 'Secure & Safe', desc: 'Your data and documents are always protected with us', color: '#F07E21' },
    ];

    useEffect(() => { fetchVisas(); }, []);

    const fetchVisas = async () => {
        try {
            setLoading(true);
            const res = await visaService.getPackages();
            if (res.success) setVisas(res.data.filter(v => v.isActive));
            
            const insRes = await insuranceService.getPackages();
            if (insRes.success) setInsurancePlans(insRes.data.filter(i => i.isActive));
        } catch (err) {
            console.error('Failed to fetch packages', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = (item, type) => {
        navigate('/agent/checkout-service', {
            state: {
                service: type.toUpperCase(),
                item: { ...item, title: type === 'visa' ? item.title : `${item.provider} Insurance` }
            }
        });
    };

    const handleCheckRequirements = () => {
        const query = country || selectedCountryLabel.split(' (')[0];
        const foundVisa = visas.find(v => v.country.toLowerCase() === query.toLowerCase());
        setActiveVisa(foundVisa || null);
        setShowRequirements(true);
    };

    return (
        <div className="w-full flex flex-col gap-5 animate-fade-in pb-20">

            {/* ── HERO BANNER ── */}
            <div className="relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-gray-100 min-h-[140px] sm:min-h-[180px]">
                {/* Blue left accent */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#1D4171] to-[#2d6cc0] rounded-l-3xl" />

                {/* Background SVG cityscape + plane */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-2/5 overflow-hidden pointer-events-none select-none">
                    <svg viewBox="0 0 420 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-0 top-0 h-full w-auto">
                        {/* Sky gradient */}
                        <defs>
                            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.6"/>
                                <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.2"/>
                            </linearGradient>
                        </defs>
                        <rect width="420" height="200" fill="url(#skyGrad)"/>

                        {/* City skyline silhouette */}
                        <rect x="200" y="100" width="15" height="100" rx="2" fill="#cbd5e1" opacity="0.7"/>
                        <rect x="218" y="75" width="20" height="125" rx="2" fill="#94a3b8" opacity="0.6"/>
                        <rect x="240" y="85" width="14" height="115" rx="2" fill="#cbd5e1" opacity="0.8"/>
                        <rect x="256" y="60" width="24" height="140" rx="3" fill="#64748b" opacity="0.5"/>
                        <rect x="282" y="70" width="18" height="130" rx="2" fill="#94a3b8" opacity="0.6"/>
                        <rect x="302" y="50" width="28" height="150" rx="3" fill="#475569" opacity="0.45"/>
                        <rect x="332" y="65" width="22" height="135" rx="2" fill="#94a3b8" opacity="0.5"/>
                        <rect x="356" y="80" width="20" height="120" rx="2" fill="#cbd5e1" opacity="0.6"/>
                        <rect x="378" y="40" width="30" height="160" rx="3" fill="#475569" opacity="0.4"/>
                        {/* Building windows */}
                        <rect x="261" y="70" width="5" height="4" rx="1" fill="#F07E21" opacity="0.6"/>
                        <rect x="269" y="70" width="5" height="4" rx="1" fill="#F07E21" opacity="0.4"/>
                        <rect x="261" y="80" width="5" height="4" rx="1" fill="#F07E21" opacity="0.5"/>
                        <rect x="307" y="58" width="5" height="4" rx="1" fill="#F07E21" opacity="0.7"/>
                        <rect x="315" y="58" width="5" height="4" rx="1" fill="#F07E21" opacity="0.4"/>
                        <rect x="307" y="68" width="5" height="4" rx="1" fill="#F07E21" opacity="0.5"/>
                        <rect x="384" y="48" width="5" height="4" rx="1" fill="#F07E21" opacity="0.6"/>

                        {/* Passport (simple rect with globe icon look) */}
                        <g transform="translate(230, 20) rotate(8)">
                            <rect x="0" y="0" width="60" height="80" rx="6" fill="#1D4171" opacity="0.85"/>
                            <rect x="5" y="5" width="50" height="70" rx="4" fill="#1a3a6b" opacity="0.5"/>
                            <text x="30" y="35" textAnchor="middle" fill="#F07E21" fontSize="18" fontFamily="sans-serif">🌐</text>
                            <text x="30" y="55" textAnchor="middle" fill="white" fontSize="7" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">PASSPORT</text>
                            <rect x="12" y="60" width="36" height="2" rx="1" fill="white" opacity="0.4"/>
                            <rect x="18" y="65" width="24" height="2" rx="1" fill="white" opacity="0.3"/>
                        </g>

                        {/* Airplane */}
                        <g transform="translate(315, 18) rotate(-10)">
                            <path d="M55 18 L95 27 L55 36 L50 32 L66 27 L50 22 Z" fill="white" opacity="0.95"/>
                            <path d="M55 18 L0 8 L3 27 L55 36 Z" fill="#e2e8f0" opacity="0.9"/>
                            <path d="M50 32 L40 50 L50 47 L60 32 Z" fill="white" opacity="0.8"/>
                            <path d="M18 12 L8 4 L10 17 Z" fill="#e2e8f0" opacity="0.7"/>
                        </g>

                        {/* Flight dashed path */}
                        <path d="M140 60 Q240 30 330 30" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.4"/>
                    </svg>
                </div>

                {/* Text Content */}
                <div className="relative z-10 p-5 sm:p-8 pl-7 sm:pl-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-[#1D4171] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/30 flex-shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 sm:w-6 sm:h-6">
                                <path d="M12 2L3 7v5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" fill="#2d6cc0" stroke="white" strokeWidth="1.5"/>
                                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1D4171] leading-tight">
                                Visa & <span className="text-[#F07E21]">Insurance</span>
                            </h1>
                            <p className="text-slate-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-[2px] sm:tracking-widest mt-0.5">
                                Global Travel Compliance & Protection
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TAB SWITCHER ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-2">
                <button
                    onClick={() => setTab('visa')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl font-black text-sm sm:text-base tracking-wide transition-all ${tab === 'visa' ? 'bg-[#1D4171] text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 sm:w-5 sm:h-5">
                        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M3 9h18" stroke="currentColor" strokeWidth="2"/>
                        <path d="M8 4V2M16 4V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    VISA
                </button>
                <button
                    onClick={() => setTab('insurance')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl font-black text-sm sm:text-base tracking-wide transition-all ${tab === 'insurance' ? 'bg-[#F07E21] text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 sm:w-5 sm:h-5">
                        <path d="M12 2L3 7v5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    INSURANCE
                </button>
            </div>

            {tab === 'visa' ? (
                <div className="flex flex-col gap-5">
                    {/* ── COUNTRY SEARCH BOX ── */}
                    <div className="bg-[#1D4171] rounded-2xl p-4 sm:p-5 shadow-2xl shadow-blue-950/40">
                        <p className="text-blue-200/70 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <span className="text-[#F07E21]">📍</span> Where do you need a visa for?
                        </p>

                        {/* Country dropdown selector */}
                        <div className="relative mb-3">
                            <button
                                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                className="w-full flex items-center justify-between bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-black text-sm sm:text-base backdrop-blur-sm"
                            >
                                <span>{selectedCountryLabel}</span>
                                <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 text-white transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`}>
                                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                            {showCountryDropdown && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto border border-gray-100">
                                    {popularCountries.map(c => (
                                        <button key={c} onClick={() => { setSelectedCountryLabel(c); setCountry(c.split(' (')[0]); setShowCountryDropdown(false); setShowRequirements(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 ${selectedCountryLabel === c ? 'text-[#1D4171] bg-blue-50' : 'text-slate-700'}`}>
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleCheckRequirements}
                            className="w-full bg-[#F07E21] hover:bg-[#d96d1a] text-white font-black py-3.5 sm:py-4 rounded-xl text-sm tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 border-b-4 border-[#c46215] active:scale-[.98] transition-all"
                        >
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                                <rect x="3" y="4" width="18" height="16" rx="2" stroke="white" strokeWidth="2"/>
                                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            CHECK REQUIREMENTS
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 ml-auto">
                                <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>

                    {/* ── REQUIREMENTS RESULT ── */}
                    {showRequirements && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 sm:p-6 animate-slide-down">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-black text-[#1D4171] text-base flex items-center gap-2">
                                    📋 Requirements for {country || selectedCountryLabel.split(' (')[0]}
                                </h4>
                                <button onClick={() => setShowRequirements(false)} className="text-gray-400 hover:text-gray-700 font-black text-xs uppercase tracking-widest">CLOSE</button>
                            </div>
                            {activeVisa && activeVisa.documentsRequired?.length > 0 ? (
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {activeVisa.documentsRequired.map((req, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-sm font-bold text-[#1D4171] bg-blue-50 p-3 rounded-xl border border-blue-100">
                                            <span className="w-5 h-5 bg-[#1D4171] text-white rounded-full flex items-center justify-center text-[9px] flex-shrink-0">✓</span>
                                            {req}
                                        </li>
                                    ))}
                                </ul>
                            ) : activeVisa ? (
                                <p className="text-sm font-bold text-gray-500 italic">No specific documents listed. Standard identity documents apply.</p>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 rounded-xl p-4">
                                    {/* Illustration */}
                                    <div className="flex-shrink-0">
                                        <svg viewBox="0 0 80 80" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
                                            <rect x="10" y="15" width="45" height="55" rx="6" fill="#e2e8f0"/>
                                            <rect x="15" y="20" width="35" height="45" rx="4" fill="white"/>
                                            <rect x="20" y="28" width="25" height="3" rx="1.5" fill="#cbd5e1"/>
                                            <rect x="20" y="34" width="20" height="3" rx="1.5" fill="#cbd5e1"/>
                                            <rect x="20" y="40" width="22" height="3" rx="1.5" fill="#cbd5e1"/>
                                            <circle cx="58" cy="58" r="16" fill="#1D4171"/>
                                            <path d="M50 58l5 5 10-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-[#1D4171] text-sm mb-1">No active visa package found for "{country || selectedCountryLabel.split(' (')[0]}".</p>
                                        <p className="text-slate-500 text-xs font-medium">Please check the spelling or explore other destination options.</p>
                                    </div>
                                    <button
                                        onClick={() => { setShowRequirements(false); setSelectedCountryLabel('UAE (United Arab Emirates)'); setCountry(''); }}
                                        className="flex-shrink-0 flex items-center gap-2 bg-[#1D4171] hover:bg-[#163358] text-white font-black text-[10px] uppercase tracking-widest px-4 py-3 rounded-xl transition-all"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="white" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="white" strokeWidth="2"/></svg>
                                        EXPLORE OTHER<br/>DESTINATIONS
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── WHY CHOOSE GOYAFLY ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                        <h3 className="font-black text-[#1D4171] text-base sm:text-lg mb-4">Why Choose GoyaFly for Visa Services?</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            {whyChoose.map((item) => (
                                <div key={item.title} className="flex flex-col items-center text-center p-3 sm:p-4 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl mb-2 bg-white shadow-sm">
                                        {item.icon}
                                    </div>
                                    <p className="font-black text-[#1D4171] text-xs sm:text-sm mb-1">{item.title}</p>
                                    <p className="text-gray-400 text-[10px] sm:text-xs font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── VISA PACKAGES GRID ── */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1,2,3].map(i => (
                                <div key={i} className="bg-white rounded-2xl h-60 animate-pulse border border-gray-100 shadow-sm" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                            {visas.map(v => (
                                <div key={v._id} className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 group hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col">
                                    <div className="h-40 sm:h-44 bg-slate-50 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                                        {v.images?.length > 0 ? (
                                            <img src={`${API_BASE}${v.images[0]}`} alt={v.country} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                                        ) : (
                                            <div className="w-16 h-16 bg-[#1D4171]/10 rounded-2xl flex items-center justify-center text-3xl font-black text-[#1D4171] group-hover:scale-110 transition-transform">
                                                {v.country?.charAt(0).toUpperCase() || 'V'}
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 bg-[#1D4171] px-3 py-1 rounded-full text-[9px] font-black text-white tracking-widest uppercase">
                                            {v.visaType}
                                        </div>
                                    </div>
                                    <div className="p-4 sm:p-5 flex flex-col flex-1">
                                        <h4 className="font-black text-[#1D4171] text-base group-hover:text-[#F07E21] transition-colors mb-1">{v.title}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">⏱ {v.processingTime}</p>
                                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agent Cost</p>
                                                <p className="text-xl font-black text-[#1D4171]"><span className="text-sm">₹</span>{v.price?.toLocaleString('en-IN')}</p>
                                            </div>
                                            <button onClick={() => handleApply(v, 'visa')}
                                                className="px-4 py-2.5 bg-[#F07E21] hover:bg-[#d96d1a] text-white font-black rounded-xl text-[10px] tracking-widest uppercase shadow-md shadow-orange-400/25 border-b-2 border-[#c46215] active:scale-95 transition-all">
                                                APPLY NOW
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {visas.length === 0 && (
                                <div className="col-span-full py-16 bg-white rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 font-bold text-center">
                                    <span className="text-4xl mb-3">🛂</span>
                                    <p className="italic">No active visa packages available at the moment.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TRUST FOOTER BAR ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            {[
                                { icon: '🛡️', title: 'Trusted by 5000+', sub: 'Travel Agents' },
                                { icon: '🌍', title: '150+ Countries', sub: 'Coverage' },
                                { icon: '💳', title: 'Transparent Fees', sub: 'No Hidden Charges' },
                                { icon: '🎧', title: '24/7 Support', sub: "We're here for you" },
                            ].map(item => (
                                <div key={item.title} className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 flex items-center justify-center text-base sm:text-lg flex-shrink-0">{item.icon}</div>
                                    <div>
                                        <p className="font-black text-[#1D4171] text-[11px] sm:text-xs leading-tight">{item.title}</p>
                                        <p className="text-gray-400 text-[10px] font-medium">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* ── INSURANCE TAB ── */
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {insurancePlans.map(p => (
                            <div key={p.provider} className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group relative p-5 sm:p-6">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                                <div className="flex items-center gap-4 mb-5 relative z-10">
                                    {p.images && p.images.length > 0 ? (
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden flex-shrink-0">
                                            <img src={`${API_BASE}${p.images[0]}`} alt={p.provider} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        </div>
                                    ) : (
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#1D4171]/10 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform flex-shrink-0">🛡️</div>
                                    )}
                                    <div>
                                        <p className="text-xl font-black text-[#1D4171] group-hover:text-[#F07E21] transition-colors">{p.provider}</p>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{p.plan}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 mb-5 relative z-10">
                                    {p.features.map(f => (
                                        <div key={f} className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                            <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">✓</span>
                                            {f}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-end justify-between pt-4 border-t border-gray-50 relative z-10">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max Cover</p>
                                        <p className="text-xl font-black text-[#1D4171]">{p.cover}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Starting at</p>
                                        <p className="text-2xl font-black text-[#F07E21]">₹{p.price}<span className="text-xs text-gray-400 font-bold">/day</span></p>
                                    </div>
                                </div>
                                <button onClick={() => handleApply(p, 'insurance')}
                                    className="w-full mt-4 py-3.5 bg-[#F07E21] hover:bg-[#d96d1a] text-white font-black rounded-xl text-xs tracking-widest uppercase shadow-md shadow-orange-400/25 border-b-2 border-[#c46215] active:scale-95 transition-all relative z-10">
                                    SELECT PLAN
                                </button>
                            </div>
                        ))}
                        {insurancePlans.length === 0 && !loading && (
                            <div className="col-span-full py-16 bg-white rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 font-bold text-center">
                                <span className="text-4xl mb-3">🛡️</span>
                                <p className="italic">No active insurance plans available at the moment.</p>
                            </div>
                        )}
                    </div>

                    {/* Trust bar for insurance too */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { icon: '🛡️', title: 'Trusted by 5000+', sub: 'Travel Agents' },
                                { icon: '🌍', title: '150+ Countries', sub: 'Coverage' },
                                { icon: '💳', title: 'Transparent Fees', sub: 'No Hidden Charges' },
                                { icon: '🎧', title: '24/7 Support', sub: "We're here for you" },
                            ].map(item => (
                                <div key={item.title} className="flex items-center gap-2">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-50 flex items-center justify-center text-sm sm:text-base flex-shrink-0">{item.icon}</div>
                                    <div>
                                        <p className="font-black text-[#1D4171] text-[10px] sm:text-xs leading-tight">{item.title}</p>
                                        <p className="text-gray-400 text-[10px] font-medium">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisaInsurance;
