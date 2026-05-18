import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { visaService } from '../../services/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const VisaInsurance = () => {
    const [tab, setTab] = useState('visa');
    const [country, setCountry] = useState('');
    const [showRequirements, setShowRequirements] = useState(false);
    const [visas, setVisas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeVisa, setActiveVisa] = useState(null);
    const navigate = useNavigate();

    // Insurance plans remain hardcoded for now as per plan
    const insurancePlans = [
        { provider: 'TATA AIG', plan: 'Travel Guard', price: 45, cover: '₹50,000' },
        { provider: 'HDFC ERGO', plan: 'ExplorerPlus', price: 30, cover: '₹30,000' }
    ];

    useEffect(() => {
        fetchVisas();
    }, []);

    const fetchVisas = async () => {
        try {
            setLoading(true);
            const res = await visaService.getPackages();
            if (res.success) {
                // Filter only active visas for agents
                setVisas(res.data.filter(v => v.isActive));
            }
        } catch (err) {
            console.error('Failed to fetch visas', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = (item, type) => {
        navigate('/agent/checkout-service', { 
            state: { 
                service: type.toUpperCase(), 
                item: {
                    ...item,
                    title: type === 'visa' ? item.title : `${item.provider} Insurance`
                } 
            } 
        });
    };

    const handleCheckRequirements = () => {
        const foundVisa = visas.find(v => v.country.toLowerCase() === country.toLowerCase());
        if (foundVisa) {
            setActiveVisa(foundVisa);
            setShowRequirements(true);
        } else {
            setActiveVisa(null);
            setShowRequirements(true);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-10 animate-fade-in pb-20">
            {/* Header / Tab Switcher */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white italic">Visa & <span className="text-secondary-400 font-black">Insurance</span></h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Global travel compliance & protection</p>
                </div>
                
                <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-3xl border border-white/10 w-full md:w-80">
                    <button 
                        onClick={() => setTab('visa')}
                        className={`flex-1 py-3 font-black rounded-2xl transition-all text-[10px] tracking-widest ${tab === 'visa' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        VISA
                    </button>
                    <button 
                        onClick={() => setTab('insurance')}
                        className={`flex-1 py-3 font-black rounded-2xl transition-all text-[10px] tracking-widest ${tab === 'insurance' ? 'bg-secondary-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        INSURANCE
                    </button>
                </div>
            </div>

            {tab === 'visa' ? (
                <div className="space-y-12">
                    {/* Sleek Modern Search Bar in Goyafly Navy & Orange */}
                    <div className="bg-[#1D4171] border border-[#122a4a] shadow-2xl shadow-blue-950/50 rounded-2xl sm:rounded-full py-2 sm:py-2.5 px-4 sm:px-6 flex flex-col sm:flex-row items-center gap-3 w-full transition-all hover:shadow-blue-950/70 mb-12">
                        <div className="flex items-center gap-3 w-full flex-1 pl-2">
                            <span className="text-[#F07E21] text-lg sm:text-xl flex items-center">📍</span>
                            <input 
                                type="text" 
                                placeholder="Enter Country Name (e.g. UAE, Singapore, Japan...)" 
                                className="w-full bg-transparent border-none text-sm sm:text-base text-white font-bold placeholder:text-blue-200/70 outline-none focus:ring-0 py-2 sm:py-2.5"
                                value={country} 
                                onChange={e => setCountry(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={handleCheckRequirements}
                            className="w-full sm:w-auto bg-[#F07E21] hover:bg-[#d96d1a] text-white text-xs sm:text-sm font-black px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-full shadow-lg shadow-orange-500/30 border-b-4 border-[#D96B18] active:scale-95 transition-all flex items-center justify-center gap-2 flex-shrink-0 tracking-wider uppercase"
                        >
                            <span>CHECK REQUIREMENTS</span>
                        </button>
                    </div>

                    {showRequirements && (
                        <div className="p-8 bg-primary-50 rounded-[2rem] border border-primary-100 animate-slide-down relative z-10 shadow-lg mb-12">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-black text-primary-900 flex items-center gap-2">
                                    📋 Requirements for {country || 'Selected Country'}
                               </h4>
                                <button onClick={() => setShowRequirements(false)} className="text-primary-400 hover:text-primary-600 font-black text-xs">CLOSE</button>
                            </div>
                            
                            {activeVisa && activeVisa.documentsRequired && activeVisa.documentsRequired.length > 0 ? (
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {activeVisa.documentsRequired.map((req, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-sm font-bold text-primary-700 bg-white p-4 rounded-xl shadow-sm border border-primary-50">
                                            <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-[10px]">✓</span>
                                            {req}
                                        </li>
                                    ))}
                                </ul>
                            ) : activeVisa ? (
                                <p className="text-sm font-bold text-gray-500 italic">No specific documents listed for this visa yet. Standard identity documents apply.</p>
                            ) : (
                                <p className="text-sm font-bold text-red-500 bg-red-50 p-4 rounded-xl">No active visa package found for "{country}". Please check the spelling or explore options below.</p>
                            )}
                        </div>
                    )}
                    
                    {/* Visa Options Grid */}
                    {loading ? (
                        <div className="text-center p-20 text-white/50 font-black italic text-xl animate-pulse">Loading visa packages...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
                            {visas.map(v => (
                                <div key={v._id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(29,65,113,0.15)] border border-slate-100 group card-hover flex flex-col h-full transform transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_30px_70px_rgba(29,65,113,0.25)] w-full min-w-0">
                                    <div className="h-52 sm:h-56 bg-slate-50 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                                        {v.images && v.images.length > 0 ? (
                                            <img src={`${API_BASE}${v.images[0]}`} alt={v.country} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-20 h-20 bg-[#1D4171]/10 text-[#1D4171] rounded-full flex items-center justify-center text-4xl font-black group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700 shadow-inner z-10 relative">
                                                {v.country?.charAt(0).toUpperCase() || 'V'}
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 bg-[#1D4171]/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest text-[#1D4171] border border-[#1D4171]/20 shadow-sm z-10">
                                            {v.visaType}
                                        </div>
                                    </div>
                                    <div className="p-5 sm:p-6 md:p-7 flex flex-col flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-lg sm:text-xl font-black text-[#1D4171] leading-tight group-hover:text-[#F07E21] transition-colors truncate">{v.title}</h4>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-1">
                                            <span>⏱️ {v.processingTime}</span>
                                        </p>

                                        <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 sm:gap-0 bg-slate-50/50 p-5 sm:p-6 md:p-7 -mx-5 sm:-mx-6 md:-mx-7 -mb-5 sm:-mb-6 md:-mb-7">
                                            <div className="flex sm:flex-col justify-between sm:justify-start items-center sm:items-start">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest sm:mb-1">Agent Cost</p>
                                                <p className="text-xl sm:text-2xl font-black text-[#1D4171] leading-none">
                                                    <span className="text-sm mr-1">₹</span>{v.price.toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => handleApply(v, 'visa')}
                                                className="w-full sm:w-auto px-6 py-3 sm:py-3.5 bg-[#F07E21] hover:bg-[#d96d1a] text-white font-black rounded-xl sm:rounded-2xl text-[10px] sm:text-xs tracking-widest shadow-lg shadow-orange-500/25 border-b-4 border-[#D96B18] active:scale-95 transition-all text-center uppercase flex items-center justify-center gap-2"
                                            >
                                                <span>APPLY NOW</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {visas.length === 0 && (
                                <div className="col-span-1 md:col-span-3 p-20 text-center bg-white/5 rounded-[3rem] border border-white/10 text-white/50">
                                    <span className="text-5xl mb-4 block">🛂</span>
                                    <p className="font-bold italic text-lg">No active visa packages available at the moment.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 animate-slide-up">
                    {insurancePlans.map(p => (
                        <div key={p.provider} className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(29,65,113,0.15)] border border-slate-100 group card-hover flex flex-col h-full transform transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_30px_70px_rgba(29,65,113,0.25)] w-full min-w-0 p-6 sm:p-8 md:p-10 relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-500/5 rounded-full -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                            <div className="flex items-center gap-6 sm:gap-8 mb-8 sm:mb-10 relative z-10">
                                <div className="w-20 sm:w-24 h-20 sm:h-24 bg-[#1D4171]/10 text-[#1D4171] rounded-2xl sm:rounded-3xl flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700 shadow-inner flex-shrink-0">🛡️</div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-2xl sm:text-3xl font-black text-[#1D4171] group-hover:text-[#F07E21] transition-colors truncate">{p.provider}</p>
                                    <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">{p.plan}</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-end gap-4 sm:gap-0 mt-auto relative z-10 mb-8 sm:mb-10 pt-6 border-t border-slate-100">
                                <div className="space-y-1 flex sm:flex-col justify-between sm:justify-start items-center sm:items-start">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Cover</p>
                                    <p className="text-xl sm:text-2xl font-black text-[#1D4171]">{p.cover}</p>
                                </div>
                                <div className="text-right flex sm:flex-col justify-between sm:justify-end items-center sm:items-end">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest sm:mb-1">Starting at</p>
                                    <p className="text-3xl sm:text-4xl font-black text-[#F07E21] leading-none">₹{p.price}<span className="text-xs text-slate-400 font-bold ml-1">/day</span></p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleApply(p, 'insurance')}
                                className="w-full py-3.5 sm:py-4 bg-[#F07E21] hover:bg-[#d96d1a] text-white font-black rounded-xl sm:rounded-2xl text-[10px] sm:text-xs tracking-widest shadow-lg shadow-orange-500/25 border-b-4 border-[#D96B18] active:scale-95 transition-all text-center uppercase flex items-center justify-center gap-2 relative z-10"
                            >
                                <span>SELECT PLAN</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VisaInsurance;
