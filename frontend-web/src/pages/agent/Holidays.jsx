import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { holidayService } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const DubaiIcon = () => (
    <svg viewBox="0 0 100 100" className="w-40 h-40">
        <circle cx="70" cy="30" r="12" fill="#FFC107" />
        <path d="M40 80 Q 40 50 35 40 M40 80 Q 40 60 45 55 M40 80 Q 40 70 35 65" stroke="#2D6A4F" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M50 80 Q 50 50 55 45 M50 80 Q 50 65 45 70" stroke="#2D6A4F" strokeWidth="6" fill="none" strokeLinecap="round" />
        <rect x="25" y="80" width="50" height="4" rx="2" fill="#E9C46A" />
    </svg>
);

const MaldivesIcon = () => (
    <svg viewBox="0 0 100 100" className="w-40 h-40">
        <path d="M20 80 Q 50 75 80 80" stroke="#FFD166" strokeWidth="4" fill="none" />
        <path d="M50 80 L 50 50" stroke="#8D6E63" strokeWidth="4" />
        <path d="M50 50 Q 80 40 70 20 M50 50 Q 30 40 40 20 M50 50 Q 100 60 80 70 M50 50 Q 0 60 20 70" stroke="#06D6A0" strokeWidth="6" fill="none" />
    </svg>
);

const RajasthanIcon = () => (
    <svg viewBox="0 0 100 100" className="w-40 h-40">
        <rect x="20" y="50" width="20" height="30" fill="#EF476F" />
        <rect x="60" y="50" width="20" height="30" fill="#EF476F" />
        <rect x="35" y="40" width="30" height="40" fill="#EF476F" />
        <path d="M20 50 L 30 40 L 40 50 M60 50 L 70 40 L 80 50 M35 40 L 50 30 L 65 40" stroke="white" strokeWidth="2" fill="none" />
        <rect x="45" y="65" width="10" height="15" fill="#073B4C" />
    </svg>
);

const Holidays = () => {
    const navigate = useNavigate();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
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

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async (query = '') => {
        setLoading(true);
        try {
            const res = await holidayService.getPackages(query);
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
        fetchPackages(search);
    };

    const getIcon = (iconType) => {
        switch (iconType) {
            case 'DUBAI': return <DubaiIcon />;
            case 'MALDIVES': return <MaldivesIcon />;
            case 'RAJASTHAN': return <RajasthanIcon />;
            default: return <div className="text-6xl">🌴</div>;
        }
    };

    return (
        <div className="flex-1 bg-[#f8fafc] min-h-[calc(100vh-64px)] pb-20 w-full min-w-0 overflow-x-hidden">
            <PageHeader 
                title="Holiday Plans" 
                subtitle="Curated global experiences designed for your elite travelers"
                icon="🌍"
                breadcrumbs={[{ label: 'Holidays' }]}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-14 sm:-mt-28 relative z-20 mb-12 sm:mb-16">
                {/* Sleek Modern Search Bar in Goyafly Navy & Orange */}
                <form onSubmit={handleSearch} className="bg-[#1D4171] border border-[#122a4a] shadow-2xl shadow-blue-950/50 rounded-2xl sm:rounded-full p-3 sm:py-2.5 sm:px-6 flex flex-col sm:flex-row items-center gap-3 w-full transition-all hover:shadow-blue-950/70">
                    <div className="flex items-center gap-2 sm:gap-3 w-full flex-1 px-2 sm:pl-2 min-w-0">
                        <span className="text-[#F07E21] text-lg sm:text-xl flex items-center flex-shrink-0">🔍</span>
                        <input 
                            type="text" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search destinations (e.g. Bali, London, Tokyo)..." 
                            className="w-full bg-transparent border-none text-xs sm:text-base text-white font-bold placeholder:text-blue-200/70 outline-none focus:ring-0 py-2 sm:py-2.5 truncate" 
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full sm:w-auto bg-gradient-to-r from-[#F07E21] to-[#f59e0b] sm:from-[#F07E21] sm:to-[#F07E21] hover:from-[#d96d1a] hover:to-[#d96d1a] text-white text-xs sm:text-sm font-black px-6 sm:px-8 py-3.5 rounded-xl sm:rounded-full shadow-xl sm:shadow-lg shadow-orange-500/40 sm:shadow-orange-500/30 border-b-4 border-[#D96B18] active:scale-95 transition-all flex items-center justify-center gap-2 flex-shrink-0 tracking-wider uppercase"
                    >
                        <span className="sm:hidden text-sm">✨</span>
                        <span>Search Destination</span>
                    </button>
                </form>
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none hidden sm:block"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/10 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none hidden sm:block"></div>
            </div>

            {/* Packages Grid in Ultra-Premium White with Goyafly Navy & Orange Accents */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 w-full min-w-0">
                {packages.map(p => {
                    const cleanDesc = stripHtml(p.description) || `Experience the ultimate luxury getaway with our curated ${p.title}. Enjoy premium 5-star accommodations, guided sightseeing tours, exclusive private transfers, and daily gourmet meals designed for elite travelers seeking unforgettable memories.`;
                    return (
                        <div key={p._id || p.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(29,65,113,0.15)] border border-slate-100 group card-hover flex flex-col h-full transform transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_30px_70px_rgba(29,65,113,0.25)] w-full min-w-0">
                            <div className="h-44 sm:h-48 bg-slate-50 relative overflow-hidden flex-shrink-0">
                                {p.images && p.images.length > 0 ? (
                                    <img src={`${API_BASE}${p.images[0]}`} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center p-8 sm:p-12 transition-all duration-700 group-hover:bg-slate-100/80">
                                        <div className="transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-700">
                                            {getIcon(p.iconType)}
                                        </div>
                                    </div>
                                )}
                                {p.images && p.images.length > 1 && (
                                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-black px-3 py-1 rounded-full backdrop-blur-sm">📷 {p.images.length} photos</div>
                                )}
                            </div>
                            <div className="p-4 sm:p-5 md:p-6 flex flex-col flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-3 gap-2">
                                    <h3 className="text-lg sm:text-xl font-black text-[#1D4171] leading-tight group-hover:text-[#F07E21] transition-colors truncate">{p.title}</h3>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <span className="p-2 bg-[#1D4171]/10 text-[#1D4171] rounded-xl font-black text-[10px] sm:text-xs leading-none border border-[#1D4171]/20 shadow-sm">{p.days}</span>
                                    </div>
                                </div>
                                
                                {/* Interactive Description Block */}
                                <div className="mb-4">
                                    <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed font-medium transition-all duration-300 ${expandedCards[p._id || p.id] ? '' : 'line-clamp-2'}`}>
                                        {cleanDesc}
                                    </p>
                                    <button 
                                        type="button" 
                                        onClick={() => toggleExpand(p._id || p.id)}
                                        className="text-[10px] sm:text-xs font-black text-[#F07E21] hover:text-[#d96d1a] mt-1.5 uppercase tracking-wider flex items-center gap-1 transition-colors focus:outline-none"
                                    >
                                        <span>{expandedCards[p._id || p.id] ? 'Show Less' : 'Show More'}</span>
                                        <span>{expandedCards[p._id || p.id] ? '▲' : '▼'}</span>
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5">
                                    {p.highlights.map(h => (
                                        <span key={h} className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 bg-slate-50 px-3 py-1 rounded-full tracking-widest border border-slate-100 hover:border-[#1D4171]/30 hover:bg-[#1D4171]/5 hover:text-[#1D4171] transition-all">{h}</span>
                                    ))}
                                </div>

                                <div className="mt-auto pt-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 sm:gap-0 bg-slate-50/50 p-4 sm:p-5 md:p-6 -mx-4 sm:-mx-5 md:-mx-6 -mb-4 sm:-mb-5 md:-mb-6">
                                    <div className="flex sm:flex-col justify-between sm:justify-start items-center sm:items-start">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest sm:mb-1">Agent Net Fare</p>
                                        <p className="text-xl sm:text-2xl font-black text-[#1D4171] leading-none">₹{p.price.toLocaleString('en-IN')}</p>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/agent/checkout-service', { state: { service: 'HOLIDAY', item: p } })}
                                        className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-[#F07E21] hover:bg-[#d96d1a] text-white font-black rounded-xl sm:rounded-2xl text-[10px] sm:text-xs tracking-widest shadow-lg shadow-orange-500/25 border-b-4 border-[#D96B18] active:scale-95 transition-all text-center uppercase flex items-center justify-center gap-2"
                                    >
                                        <span>BOOK TRIP</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Loading exotic destinations...</p>
                </div>
            )}

            {!loading && packages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in px-4">
                    <div className="text-5xl sm:text-6xl mb-6">🏜️</div>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">No destinations found</h3>
                    <p className="text-gray-400 font-bold uppercase text-xs tracking-widest max-w-md mx-auto">Try searching for something else like "Dubai" or "Maldives"</p>
                </div>
            )}
        </div>
    );
};

export default Holidays;
