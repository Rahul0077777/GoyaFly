import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicService } from '../../services/api';
import heroBg from '../../assets/hero_bg.png';

const Home = () => {
    const [searchType, setSearchType] = useState('Flights');
    const [promotions, setPromotions] = useState([]);
    const [promoLoading, setPromoLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPromos = async () => {
            try {
                const res = await publicService.getPromotions();
                if (res.success) {
                    setPromotions(res.data.filter(p => p.active));
                }
            } catch (err) {
                console.error('Failed to fetch promotions', err);
            } finally {
                setPromoLoading(false);
            }
        };
        fetchPromos();
    }, []);

    const services = [
        { name: 'Flights', icon: '✈️' },
        { name: 'Hotels', icon: '🏨' },
        { name: 'Buses', icon: '🚌' },
        { name: 'Trains', icon: '🚆' },
        { name: 'Visa', icon: '📄' },
        { name: 'Insurance', icon: '🛡️' }
    ];

    return (
        <div className="w-full flex flex-col font-sans bg-white">
            {/* Hero Section - Premium Cinematic BG */}
            <div 
                className="relative pt-20 sm:pt-24 md:pt-32 pb-16 sm:pb-24 md:pb-32 px-4 sm:px-6 overflow-hidden bg-[#1D4171]"
                style={{ 
                    backgroundImage: `linear-gradient(rgba(29, 65, 113, 0.85), rgba(29, 65, 113, 0.7)), url(${heroBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            >
                
                {/* Stats Ticker - Fixed Position to Prevent Overlap */}
                <div className="absolute top-0 left-0 w-full bg-black/40 backdrop-blur-md py-3 border-b border-white/10 z-30">
                    <div className="flex animate-marquee whitespace-nowrap gap-16 text-[10px] md:text-[12px] font-black text-[#48A0D4] uppercase tracking-[0.3em]">
                        <span>🚀 15,000+ GLOBAL AGENTS</span>
                        <span>💎 500+ DIRECT AIRLINES</span>
                        <span>🏨 1M+ WORLDWIDE HOTELS</span>
                        <span>⚡ INSTANT WALLET SETTLEMENTS</span>
                        <span>🌍 24/7 PRIORITY SUPPORT</span>
                        <span>🚀 15,000+ GLOBAL AGENTS</span>
                    </div>
                </div>

                {/* Animated Background Depth */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-2xl rounded-full border border-white/20 mb-8 md:mb-12 animate-fade-in shadow-2xl">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F07E21] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F07E21]"></span>
                        </span>
                        <span className="text-[10px] md:text-sm font-black text-white uppercase tracking-[0.4em]">GOYAFLY.COM V2.5 TERMINAL</span>
                    </div>

                    {/* Fixed Line Height to Prevent Overlap */}
                    <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 sm:mb-8 tracking-tighter text-shadow-lg animate-slide-up leading-tight md:leading-[1.1]">
                        Elevating <br className="md:hidden" />
                        <span className="text-[#F07E21] relative inline-block">
                           Business
                           <div className="absolute -bottom-2 left-0 w-full h-2 bg-[#F07E21]/30 rounded-full"></div>
                        </span>
                        <br />
                        For Travel Pros
                    </h1>

                    <div className="max-w-4xl mx-auto mb-10 sm:mb-16 md:mb-20 animate-fade-in px-4">
                        <p className="text-base sm:text-xl md:text-2xl text-blue-50 font-bold leading-relaxed mb-6 drop-shadow-md">
                            The ultimate B2B platform for Flights, Hotels, and more. Get unparalleled rates and maximize your agency profits.
                        </p>
                        <div className="w-24 h-1.5 bg-gradient-to-r from-transparent via-[#F07E21] to-transparent mx-auto mb-8"></div>
                        <p className="text-xs md:text-base text-blue-200/90 font-medium leading-relaxed tracking-wide italic max-w-2xl mx-auto border-l-2 border-[#48A0D4] pl-6">
                            "Connecting you to a resilient, GDS-integrated ecosystem that turns complex bookings into instant success stories."
                        </p>
                    </div>

                    {/* Booking Widget */}
                    <div className="max-w-6xl mx-auto glass-panel rounded-2xl md:rounded-[2.5rem] p-2 animate-scale-in relative z-20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-white/20">
                        {/* Tabs */}
                        <div className="flex bg-white/10 backdrop-blur-3xl rounded-xl md:rounded-[2rem] p-2 gap-2 overflow-x-auto scroll-thin justify-start md:justify-center border border-white/10">
                            {services.map((s) => (
                                <button
                                    key={s.name}
                                    onClick={() => setSearchType(s.name)}
                                    className={`flex-shrink-0 md:flex-none min-w-[100px] md:min-w-[150px] flex flex-col items-center justify-center gap-2 py-3 md:py-5 px-4 md:px-8 rounded-xl md:rounded-[1.5rem] font-black smooth-transition relative group ${
                                        searchType === s.name 
                                        ? 'bg-[#F07E21] text-white shadow-2xl scale-100' 
                                        : 'bg-transparent text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <span className="text-xl md:text-3xl">{s.icon}</span>
                                    <span className="text-[10px] md:text-xs whitespace-nowrap uppercase tracking-widest">{s.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Search Form Area */}
                        <div className="bg-white rounded-xl md:rounded-[2.2rem] p-6 md:p-12 shadow-inner mt-2">
                            {searchType === 'Flights' ? (
                                <div className="space-y-6 md:space-y-10">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-8 items-end">
                                        <div className="lg:col-span-3 text-left group">
                                            <label className="block text-[10px] font-black text-black mb-3 uppercase tracking-widest italic ml-1">✈️ Departure City</label>
                                            <input type="text" defaultValue="New Delhi (DEL)" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-[#1D4171] focus:bg-white smooth-transition font-bold text-sm text-black outline-none" />
                                        </div>
                                        <div className="hidden lg:flex lg:col-span-1 justify-center items-center">
                                            <button className="w-12 h-12 bg-[#1D4171] rounded-full flex items-center justify-center shadow-xl text-white hover:scale-110 hover:rotate-180 smooth-transition z-20 -mx-6">
                                                ⇄
                                            </button>
                                        </div>
                                        <div className="lg:col-span-3 text-left group">
                                            <label className="block text-[10px] font-black text-black mb-3 uppercase tracking-widest italic ml-1">📍 Destination City</label>
                                            <input type="text" defaultValue="Mumbai (BOM)" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-[#1D4171] focus:bg-white smooth-transition font-bold text-sm text-black outline-none" />
                                        </div>
                                        <div className="lg:col-span-3 text-left group">
                                            <label className="block text-[10px] font-black text-black mb-3 uppercase tracking-widest italic ml-1">📅 Travel Date</label>
                                            <input type="date" min={new Date().toLocaleDateString('en-CA')} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-[#1D4171] focus:bg-white smooth-transition font-bold text-sm text-black outline-none" />
                                        </div>
                                        <div className="lg:col-span-2">
                                            <button 
                                                onClick={() => navigate('/login')}
                                                className="w-full h-14 md:h-16 bg-[#F07E21] hover:bg-[#d96c13] text-white font-black text-sm md:text-base rounded-2xl shadow-2xl transition-all transform hover:scale-[1.05] active:scale-95 flex items-center justify-center gap-3 tracking-[0.2em]"
                                            >
                                                SEARCH
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <span className="text-7xl block mb-6">⚙️</span>
                                    <p className="text-xl text-black font-black uppercase tracking-widest">Integrating {searchType} Gateway</p>
                                    <p className="text-gray-400 font-bold mt-2">Connecting global supply chains for your agency.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Promotions - Deep Blue Accents */}
            {!promoLoading && promotions.length > 0 && (
                <div className="max-w-7xl mx-auto px-6 w-full mt-20 mb-24 relative z-30">
                    <div className="max-w-4xl mb-16 animate-fade-in">
                        <div className="flex items-start gap-6">
                            <div className="w-2 h-20 bg-[#1D4171] rounded-full"></div>
                            <p className="text-[#000000] font-black text-xl md:text-3xl tracking-tight leading-tight">
                                <span className="text-[#F07E21] font-black tracking-[0.4em] block text-xs uppercase mb-3">GLOBAL NETWORK OVERVIEW</span>
                                India's most resilient B2B ecosystem. Instant net-fares, 
                                worldwide GDS connectivity, and a robust wallet system.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
                        <div className="w-full lg:w-4/5">
                            <h2 className="text-3xl md:text-6xl font-black text-black tracking-tighter leading-none mb-6 uppercase italic">
                                Flash <span className="text-[#F07E21]">Net-Fares</span>
                            </h2>
                            <div className="bg-[#1D4171] py-4 px-10 rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-6 overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 animate-pulse"></div>
                                <span className="text-xs font-black text-[#F07E21] uppercase tracking-[0.4em] whitespace-nowrap z-10">LIVE OFFERS:</span>
                                <div className="w-0.5 h-8 bg-white/20 z-10"></div>
                                <div className="flex animate-marquee whitespace-nowrap gap-16 text-white font-black uppercase italic tracking-wider z-10">
                                    <span>🔥 SME MEGAPROMO: 500OFF ON DOMESTIC • BOOK NOW</span>
                                    <span>💸 ZERO LCC CONVENIENCE FEES FOR VERIFIED AGENTS</span>
                                    <span>⭐ EXCLUSIVE 10% OFF ON GLOBAL HOTEL NET-FARES</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-8 overflow-x-auto pb-12 pt-4 no-scrollbar scroll-smooth snap-x">
                        {promotions.map((p) => (
                            <div 
                                key={p._id} 
                                className={`flex-shrink-0 w-[320px] md:w-[500px] rounded-[3rem] overflow-hidden shadow-2xl relative group snap-center transform transition-all duration-700 bg-[#1D4171]`}
                            >
                                <div className="p-10 md:p-14 relative z-10 flex flex-col justify-between items-start text-white h-full">
                                    <div className="w-full">
                                        <div className="flex justify-between items-center mb-10">
                                            <span className="bg-white/10 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-white/20">🔥 FLASH OFFER</span>
                                            <div className="text-4xl">✈️</div>
                                        </div>
                                        <h3 className="text-3xl md:text-5xl font-black mb-4 leading-none tracking-tighter uppercase">{p.title}</h3>
                                        <p className="text-blue-100 font-bold text-sm md:text-lg mb-10 opacity-80 leading-relaxed">{p.subtitle}</p>
                                    </div>
                                    <Link to="/register" className="px-10 py-5 bg-[#F07E21] text-white font-black rounded-2xl text-xs tracking-widest uppercase shadow-2xl hover:bg-white hover:text-black transition-all transform active:scale-95">
                                        GET DEAL ➔
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Features Info - #1D4171 Context */}
            <div className="max-w-7xl mx-auto px-6 w-full -mt-20 relative z-20 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 group hover:bg-[#1D4171] smooth-transition text-left">
                        <div className="text-5xl mb-6 group-hover:scale-110 smooth-transition">⚡</div>
                        <h3 className="text-2xl font-black mb-4 text-black group-hover:text-[#F07E21] uppercase tracking-tighter">Instant Ticketing</h3>
                        <p className="text-gray-500 font-bold group-hover:text-blue-100 opacity-80 leading-relaxed">Book and issue GDS tickets in seconds with 24/7 technical precision.</p>
                    </div>
                    <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 group hover:bg-[#1D4171] smooth-transition text-left">
                        <div className="text-5xl mb-6 group-hover:scale-110 smooth-transition">💰</div>
                        <h3 className="text-2xl font-black mb-4 text-black group-hover:text-[#F07E21] uppercase tracking-tighter">Maximum Profits</h3>
                        <p className="text-gray-500 font-bold group-hover:text-blue-100 opacity-80 leading-relaxed">Direct API connectivity ensures the industry's lowest net-fares for you.</p>
                    </div>
                    <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 group hover:bg-[#1D4171] smooth-transition text-left">
                        <div className="text-5xl mb-6 group-hover:scale-110 smooth-transition">🛡️</div>
                        <h3 className="text-2xl font-black mb-4 text-black group-hover:text-[#F07E21] uppercase tracking-tighter">Priority Support</h3>
                        <p className="text-gray-500 font-bold group-hover:text-blue-100 opacity-80 leading-relaxed">Dedicated account managers and technical helpdesk at your service.</p>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-[#1D4171] py-24 md:py-40 px-6 relative overflow-hidden text-center border-t border-white/5">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#48A0D4]/10 rounded-full blur-[100px] -mr-64 -mt-64"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#F07E21]/5 rounded-full blur-[80px] -ml-48 -mb-48"></div>
                <div className="max-w-5xl mx-auto relative z-10">
                    <h2 className="text-4xl md:text-7xl font-black mb-8 text-white tracking-tighter uppercase leading-none italic">
                        Ready to Join the <br />
                        <span className="text-[#F07E21]">GDS Evolution?</span>
                    </h2>
                    <p className="text-blue-100 text-lg md:text-2xl mb-12 max-w-2xl mx-auto font-bold opacity-80">Join 15,000+ partners scaling with Goyafly.com infrastructure.</p>
                    <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                        <Link to="/register" className="w-full sm:w-auto px-12 py-6 bg-gradient-to-r from-[#F07E21] to-[#FF9F43] text-white font-black text-lg rounded-2xl shadow-2xl hover:shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest relative overflow-hidden group">
                            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                            <span className="relative">🚀 REGISTER NOW ➔</span>
                        </Link>
                        <Link to="/login" className="w-full sm:w-auto px-12 py-6 bg-gradient-to-r from-[#F07E21] to-[#FF9F43] text-white font-black text-lg rounded-2xl shadow-2xl hover:shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest relative overflow-hidden group">
                            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                            <span className="relative">🔐 AGENT LOGIN ➔</span>
                        </Link>
                        <Link to="/admin/login" className="w-full sm:w-auto px-12 py-6 bg-gradient-to-r from-[#F07E21] to-[#FF9F43] text-white font-black text-lg rounded-2xl shadow-2xl hover:shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest relative overflow-hidden group">
                            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                            <span className="relative">👑 ADMIN LOGIN ➔</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;