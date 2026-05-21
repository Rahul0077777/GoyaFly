import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { holidayService } from '../../services/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Holidays = () => {
    const navigate = useNavigate();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState('Dubai');
    const [travelDate, setTravelDate] = useState('Select Dates');
    const [expandedCards, setExpandedCards] = useState({});

    const toggleExpand = (id) => {
        setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const stripHtml = (html) => {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const categories = [
        { id: 1, name: 'Beach Holidays', desc: 'Sun, Sand & Sea', emoji: '🏝️', icon: '🏖️' },
        { id: 2, name: 'Hill Stations', desc: 'Mountains & Views', emoji: '⛰️', icon: '🏔️' },
        { id: 3, name: 'City Breaks', desc: 'Explore Cities', emoji: '🏙️', icon: '🏢' },
        { id: 4, name: 'Spiritual Tours', desc: 'Peace & Serenity', emoji: '🕉️', icon: '✨' },
        { id: 5, name: 'Adventure Trips', desc: 'Thrill & Explore', emoji: '🎒', icon: '🧗' }
    ];

    const benefits = [
        { icon: '🛡️', title: '100% Secure', desc: 'Safe & trusted bookings' },
        { icon: '💰', title: 'Best Price Guarantee', desc: 'Get the lowest prices always' },
        { icon: '☎️', title: '24/7 Support', desc: 'We are just a call away' },
        { icon: '✨', title: 'Handpicked Experiences', desc: 'Curated with care' }
    ];

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const res = await holidayService.getPackages();
            if (res.success) {
                setPackages(res.data);
            }
        } catch (err) {
            console.error('Failed to load holiday packages');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
    };

    return (
        <div className="w-full min-h-screen bg-white overflow-x-hidden">
            {/* Hero Section with Background Image */}
            <div className="relative w-full h-60 xs:h-72 sm:h-80 md:h-96 lg:h-96 bg-gradient-to-r from-[#1D4171] to-[#2D5A96] overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 opacity-60">
                    <img
                        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop"
                        alt="Hero"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#1D4171]/90 to-[#2D5A96]/70"></div>

                {/* Content */}
                <div className="relative max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center py-4 sm:py-0">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-0">
                        <div className="flex-1 w-full">
                            <p className="text-[10px] xs:text-xs sm:text-sm font-bold text-blue-200 uppercase tracking-wider mb-2 xs:mb-3">DASHBOARD / HOLIDAYS</p>
                            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-white mb-2 xs:mb-3 leading-tight">
                                Holiday<br />Plans
                            </h1>
                            <p className="text-xs xs:text-sm sm:text-base text-blue-100 font-bold mb-1 xs:mb-2">
                                CURATED GLOBAL EXPERIENCES
                            </p>
                            <p className="text-xs xs:text-sm sm:text-base text-blue-100 font-bold">
                                DESIGNED FOR YOUR ELITE TRAVELERS
                            </p>
                        </div>

                        {/* Airplane Icon */}
                        <div className="hidden xl:flex items-center justify-center text-7xl xs:text-8xl md:text-9xl opacity-30 flex-shrink-0">
                            ✈️
                        </div>
                    </div>
                </div>

                {/* Balloon Decoration */}
                <div className="absolute top-4 xs:top-6 sm:top-10 right-3 xs:right-6 sm:right-10 text-4xl xs:text-5xl sm:text-6xl opacity-40">🎈</div>
            </div>

            {/* Search Bar Section */}
            <div className="relative px-2 xs:px-3 sm:px-6 lg:px-8 -mt-12 xs:-mt-16 sm:-mt-20 md:-mt-24 mb-8 xs:mb-10 sm:mb-12 md:mb-16">
                <div className="max-w-6xl mx-auto">
                    <form onSubmit={handleSearch} className="bg-[#1D4171] rounded-2xl xs:rounded-3xl p-3 xs:p-5 sm:p-6 md:p-8 shadow-2xl border border-[#2D5A96]">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 md:gap-6">
                            {/* Location */}
                            <div>
                                <label className="block text-[10px] xs:text-xs font-bold text-blue-200 mb-1.5 xs:mb-2 uppercase tracking-wider">
                                    📍 Where do you want to go?
                                </label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full px-3 xs:px-4 py-2 xs:py-3 bg-white/10 border border-blue-400/50 rounded-xl xs:rounded-2xl text-white font-bold placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-[#F07E21] text-xs xs:text-sm sm:text-base"
                                />
                            </div>

                            {/* Travel Date */}
                            <div>
                                <label className="block text-[10px] xs:text-xs font-bold text-blue-200 mb-1.5 xs:mb-2 uppercase tracking-wider">
                                    📅 Travel Date
                                </label>
                                <input
                                    type="text"
                                    value={travelDate}
                                    onChange={(e) => setTravelDate(e.target.value)}
                                    className="w-full px-3 xs:px-4 py-2 xs:py-3 bg-white/10 border border-blue-400/50 rounded-xl xs:rounded-2xl text-white font-bold placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-[#F07E21] text-xs xs:text-sm sm:text-base"
                                />
                            </div>

                            {/* Search Button */}
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    className="w-full px-3 xs:px-5 sm:px-6 py-2 xs:py-2.5 sm:py-3 bg-[#F07E21] hover:bg-[#d96d1a] text-white font-black rounded-xl xs:rounded-2xl text-[11px] xs:text-xs sm:text-base tracking-wider shadow-lg shadow-orange-500/50 border-b-4 border-[#D96B18] active:scale-95 transition-all uppercase"
                                >
                                    🔍 Search Destination
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Categories Section */}
            <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-6 lg:px-8 mb-10 xs:mb-12 sm:mb-16 md:mb-20">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 xs:gap-3 sm:gap-4 md:gap-5">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className="group flex flex-col items-center p-2 xs:p-3 sm:p-4 md:p-5 bg-white rounded-2xl xs:rounded-3xl shadow-md hover:shadow-lg transition-all border border-slate-100 hover:border-[#F07E21]"
                        >
                            <div className="text-2xl xs:text-3xl sm:text-4xl mb-1.5 xs:mb-2 transform group-hover:scale-110 transition-transform">{cat.icon}</div>
                            <p className="text-[10px] xs:text-xs sm:text-sm font-black text-[#1D4171] text-center leading-tight line-clamp-2">{cat.name}</p>
                            <p className="text-[8px] xs:text-[10px] sm:text-xs text-slate-500 mt-0.5 xs:mt-1 hidden xs:block">{cat.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Popular Destinations */}
            <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-6 lg:px-8 mb-10 xs:mb-12 sm:mb-16 md:mb-24">
                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-3 xs:gap-0 mb-6 xs:mb-8">
                    <h2 className="text-xl xs:text-2xl sm:text-3xl font-black text-[#1D4171]">Popular Destinations</h2>
                    <button className="text-xs xs:text-sm font-black text-[#F07E21] hover:text-[#d96d1a] uppercase tracking-wider self-start xs:self-auto">View All →</button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12 xs:py-16">
                        <div className="w-10 xs:w-12 h-10 xs:h-12 border-4 border-[#1D4171] border-t-[#F07E21] rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6">
                        {packages.slice(0, 4).map((p, idx) => {
                            const destinations = ['Dubai', 'Bali', 'Switzerland', 'Thailand'];
                            const priceList = [28999, 34999, 79999, 22999];
                            const durationList = [4, 5, 7, 4];

                            return (
                                <div key={p._id || p.id} className="group bg-white rounded-2xl xs:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-slate-100 hover:border-[#F07E21]">
                                    <div className="relative h-40 xs:h-48 bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
                                        <img
                                            src={`https://images.unsplash.com/photo-${
                                                idx === 0 ? '1518684867497-a173f69fba75' :
                                                idx === 1 ? '1537225228614-b95b9b9ad18c' :
                                                idx === 2 ? '1506905925346-21bda4d32df4' :
                                                '1559827260-dc66d52bef19'
                                            }?w=400&h=300&fit=crop`}
                                            alt={destinations[idx]}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute top-2 xs:top-3 right-2 xs:right-3 bg-[#F07E21] text-white text-[10px] xs:text-xs font-black px-2 xs:px-3 py-1 rounded-full">
                                            {durationList[idx]}D/{Math.ceil(durationList[idx] / 2)}N
                                        </div>
                                        {idx === 0 && <div className="absolute top-2 xs:top-3 left-2 xs:left-3 bg-blue-500 text-white text-[10px] xs:text-xs font-black px-2 xs:px-3 py-1 rounded-full">🔥 Popular</div>}
                                        {idx === 1 && <div className="absolute top-2 xs:top-3 left-2 xs:left-3 bg-green-500 text-white text-[10px] xs:text-xs font-black px-2 xs:px-3 py-1 rounded-full">🌴 Beach</div>}
                                        {idx === 2 && <div className="absolute top-2 xs:top-3 left-2 xs:left-3 bg-purple-500 text-white text-[10px] xs:text-xs font-black px-2 xs:px-3 py-1 rounded-full">❄️ Snowy</div>}
                                        {idx === 3 && <div className="absolute top-2 xs:top-3 left-2 xs:left-3 bg-orange-500 text-white text-[10px] xs:text-xs font-black px-2 xs:px-3 py-1 rounded-full">🏛️ Sacred</div>}
                                    </div>

                                    <div className="p-3 xs:p-4 sm:p-5">
                                        <h3 className="text-base xs:text-lg sm:text-xl font-black text-[#1D4171] mb-1">{destinations[idx]}</h3>
                                        <p className="text-[10px] xs:text-xs text-slate-500 mb-2 xs:mb-3">Starting from</p>
                                        <p className="text-xl xs:text-2xl sm:text-3xl font-black text-[#1D4171]">₹{priceList[idx].toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Why Book With GoyaFly */}
            <div className="bg-gradient-to-r from-[#1D4171] to-[#2D5A96] py-10 xs:py-12 sm:py-16 md:py-20 mb-8 xs:mb-10 sm:mb-12 md:mb-16">
                <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-6 lg:px-8">
                    <h2 className="text-xl xs:text-2xl sm:text-3xl font-black text-white text-center mb-8 xs:mb-10 sm:mb-12 md:mb-16">Why book with GoyaFly Holidays?</h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
                        {benefits.map((benefit, idx) => (
                            <div key={idx} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl xs:rounded-3xl p-3 xs:p-5 sm:p-6 md:p-8 text-center hover:bg-white/20 transition-all">
                                <div className="text-4xl xs:text-5xl sm:text-6xl mb-2 xs:mb-3 sm:mb-4">{benefit.icon}</div>
                                <h3 className="text-xs xs:text-sm sm:text-lg font-black text-white mb-1 xs:mb-2">{benefit.title}</h3>
                                <p className="text-[10px] xs:text-xs sm:text-sm text-blue-100 font-bold">{benefit.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* All Packages Grid */}
            <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-6 lg:px-8 pb-12 xs:pb-16 sm:pb-20 md:pb-24">
                <h2 className="text-xl xs:text-2xl sm:text-3xl font-black text-[#1D4171] mb-6 xs:mb-8 sm:mb-10">All Holiday Packages</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6 md:gap-8">
                    {packages.map(p => {
                        const cleanDesc = stripHtml(p.description) || `Experience the ultimate luxury getaway with our curated ${p.title} package.`;
                        return (
                            <div key={p._id || p.id} className="bg-white rounded-2xl xs:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-slate-100 group flex flex-col h-full">
                                <div className="h-40 xs:h-48 sm:h-56 bg-slate-100 overflow-hidden relative">
                                    {p.images && p.images.length > 0 ? (
                                        <img src={`${API_BASE}${p.images[0]}`} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-5xl xs:text-6xl sm:text-7xl bg-gradient-to-br from-blue-200 to-purple-200">🏝️</div>
                                    )}
                                </div>

                                <div className="p-3 xs:p-4 sm:p-5 md:p-6 flex flex-col flex-1">
                                    <h3 className="text-base xs:text-lg sm:text-xl font-black text-[#1D4171] mb-2">{p.title}</h3>

                                    <p className={`text-[10px] xs:text-xs sm:text-sm text-slate-600 mb-2 xs:mb-3 font-medium ${expandedCards[p._id || p.id] ? '' : 'line-clamp-2'}`}>
                                        {cleanDesc}
                                    </p>
                                    {p.description && (
                                        <button
                                            onClick={() => toggleExpand(p._id || p.id)}
                                            className="text-[9px] xs:text-xs font-black text-[#F07E21] hover:text-[#d96d1a] mb-2 xs:mb-3 uppercase tracking-wider"
                                        >
                                            {expandedCards[p._id || p.id] ? 'Show Less ▲' : 'Show More ▼'}
                                        </button>
                                    )}

                                    <div className="flex flex-wrap gap-1.5 xs:gap-2 mb-3 xs:mb-4">
                                        {p.highlights?.slice(0, 3).map(h => (
                                            <span key={h} className="text-[8px] xs:text-[9px] font-black uppercase text-slate-600 bg-slate-100 px-2 xs:px-3 py-0.5 xs:py-1 rounded-full">{h}</span>
                                        ))}
                                    </div>

                                    <div className="mt-auto pt-3 xs:pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 xs:gap-3">
                                        <div>
                                            <p className="text-[9px] xs:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 xs:mb-1">Starting from</p>
                                            <p className="text-xl xs:text-2xl font-black text-[#1D4171]">₹{p.price.toLocaleString('en-IN')}</p>
                                        </div>
                                        <button
                                            onClick={() => navigate('/agent/checkout-service', { state: { service: 'HOLIDAY', item: p } })}
                                            className="w-full sm:w-auto px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-2.5 md:py-3 bg-[#F07E21] hover:bg-[#d96d1a] text-white font-black rounded-lg xs:rounded-xl text-[10px] xs:text-xs sm:text-xs tracking-widest shadow-lg shadow-orange-500/25 border-b-2 xs:border-b-4 border-[#D96B18] active:scale-95 transition-all uppercase"
                                        >
                                            BOOK TRIP
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {packages.length === 0 && !loading && (
                    <div className="text-center py-12 xs:py-16 sm:py-20">
                        <div className="text-5xl xs:text-6xl sm:text-7xl mb-3 xs:mb-4">🏜️</div>
                        <h3 className="text-lg xs:text-xl sm:text-2xl font-black text-[#1D4171] mb-2">No packages found</h3>
                        <p className="text-xs xs:text-sm text-slate-500">Check back soon for more exciting destinations!</p>
                    </div>
                )}
            </div>

            {/* Floating Chat Button */}
            <button className="fixed bottom-4 xs:bottom-5 sm:bottom-6 right-4 xs:right-5 sm:right-6 w-14 xs:w-16 h-14 xs:h-16 bg-gradient-to-r from-[#F07E21] to-[#f59e0b] rounded-full shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center text-2xl xs:text-3xl hover:scale-110 active:scale-95 z-50">
                💬
            </button>
        </div>
    );
};

export default Holidays;
