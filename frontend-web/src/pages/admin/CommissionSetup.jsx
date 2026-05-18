import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import { IoAddCircleOutline, IoTrashOutline, IoPricetagOutline, IoAirplaneOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';

const AdminMarkup = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeServiceType, setActiveServiceType] = useState('DOMESTIC_FLIGHT');
    const [formData, setFormData] = useState({
        serviceType: 'DOMESTIC_FLIGHT',
        airline: 'ALL',
        refundType: 'All',
        markupType: 'Fixed',
        markupValue: 0,
        priority: 0
    });

    const domesticAirlines = [
        { code: 'ALL', name: 'All Domestic Airlines' },
        { code: '6E', name: 'Indigo (6E)' },
        { code: 'SG', name: 'Spicejet (SG)' },
        { code: 'AI', name: 'Air India (AI)' },
        { code: 'IX', name: 'Air India Express (IX)' },
        { code: 'QP', name: 'Akasa Air (QP)' },
        { code: 'UK', name: 'Vistara (UK)' },
        { code: '9I', name: 'Alliance Air (9I)' },
        { code: 'S5', name: 'Star Air (S5)' },
        { code: 'S9', name: 'FlyBig (S9)' },
        { code: 'I7', name: 'IndiaOne Air (I7)' },
        { code: 'ZO', name: 'Zoom Air (ZO)' },
    ];

    const internationalAirlines = [
        { code: 'ALL', name: 'All International Airlines' },
        // --- PRIORITY TOP ---
        { code: 'AI', name: 'Air India (AI)' },
        { code: '6E', name: 'IndiGo (6E)' },
        { code: 'SG', name: 'SpiceJet (SG)' },
        { code: 'IX', name: 'Air India Express (IX)' },
        { code: 'QP', name: 'Akasa Air (QP)' },
        { code: 'SV', name: 'Saudi Air (SV)' },
        { code: 'FZ', name: 'Fly Dubai (FZ)' },
        { code: 'G9', name: 'Air Arabia (G9)' },
        { code: 'EK', name: 'Emirates (EK)' },
        { code: 'QR', name: 'Qatar Airways (QR)' },
        { code: 'EY', name: 'Etihad Airways (EY)' },
        { code: 'UK', name: 'Vistara (UK)' },
        
        // --- GLOBAL MAJOR CARRIERS (ALPHABETICAL) ---
        { code: 'JP', name: 'Adria Airways (JP)' },
        { code: 'A3', name: 'Aegean Airlines (A3)' },
        { code: 'EI', name: 'Aer Lingus (EI)' },
        { code: 'SU', name: 'Aeroflot (SU)' },
        { code: 'AR', name: 'Aerolineas Argentinas (AR)' },
        { code: 'AM', name: 'Aeromexico (AM)' },
        { code: 'ZA', name: 'Aeromexico Connect (ZA)' },
        { code: 'AH', name: 'Air Algerie (AH)' },
        { code: 'KC', name: 'Air Astana (KC)' },
        { code: 'UU', name: 'Air Austral (UU)' },
        { code: 'BT', name: 'Air Baltic (BT)' },
        { code: 'BX', name: 'Air Busan (BX)' },
        { code: 'AC', name: 'Air Canada (AC)' },
        { code: 'TX', name: 'Air Caraibes (TX)' },
        { code: 'CA', name: 'Air China (CA)' },
        { code: 'UX', name: 'Air Europa (UX)' },
        { code: 'AF', name: 'Air France (AF)' },
        { code: 'AI', name: 'Air India (AI)' },
        { code: 'MD', name: 'Air Madagascar (MD)' },
        { code: 'KM', name: 'Air Malta (KM)' },
        { code: 'MK', name: 'Air Mauritius (MK)' },
        { code: 'NM', name: 'Air Mountain (NM)' },
        { code: 'NZ', name: 'Air New Zealand (NZ)' },
        { code: 'PX', name: 'Air Niugini (PX)' },
        { code: 'JU', name: 'Air Serbia (JU)' },
        { code: 'TN', name: 'Air Tahiti Nui (TN)' },
        { code: 'TS', name: 'Air Transat (TS)' },
        { code: 'UM', name: 'Air Zimbabwe (UM)' },
        { code: 'AK', name: 'AirAsia (AK)' },
        { code: 'D7', name: 'AirAsia X (D7)' },
        { code: 'SB', name: 'Aircalin (SB)' },
        { code: 'AS', name: 'Alaska Airlines (AS)' },
        { code: 'AZ', name: 'Alitalia (AZ)' },
        { code: 'NH', name: 'ANA - All Nippon Airways (NH)' },
        { code: 'AA', name: 'American Airlines (AA)' },
        { code: 'OZ', name: 'Asiana Airlines (OZ)' },
        { code: 'OS', name: 'Austrian Airlines (OS)' },
        { code: 'AV', name: 'Avianca (AV)' },
        { code: 'PG', name: 'Bangkok Airways (PG)' },
        { code: 'BA', name: 'British Airways (BA)' },
        { code: 'SN', name: 'Brussels Airlines (SN)' },
        { code: 'CX', name: 'Cathay Pacific (CX)' },
        { code: 'CI', name: 'China Airlines (CI)' },
        { code: 'MU', name: 'China Eastern (MU)' },
        { code: 'CZ', name: 'China Southern (CZ)' },
        { code: 'CO', name: 'Continental Airlines (CO)' },
        { code: 'OU', name: 'Croatia Airlines (OU)' },
        { code: 'CU', name: 'Cubana de Aviacion (CU)' },
        { code: 'CY', name: 'Cyprus Airways (CY)' },
        { code: 'OK', name: 'Czech Airlines (OK)' },
        { code: 'DL', name: 'Delta Air Lines (DL)' },
        { code: 'KA', name: 'Dragonair (KA)' },
        { code: 'MS', name: 'EgyptAir (MS)' },
        { code: 'EL', name: 'EL AL Israel Airlines (LY)' },
        { code: 'EK', name: 'Emirates (EK)' },
        { code: 'ET', name: 'Ethiopian Airlines (ET)' },
        { code: 'EY', name: 'Etihad Airways (EY)' },
        { code: 'BR', name: 'EVA Air (BR)' },
        { code: 'FJ', name: 'Fiji Airways (FJ)' },
        { code: 'AY', name: 'Finnair (AY)' },
        { code: 'GA', name: 'Garuda Indonesia (GA)' },
        { code: 'GF', name: 'Gulf Air (GF)' },
        { code: 'HU', name: 'Hainan Airlines (HU)' },
        { code: 'HA', name: 'Hawaiian Airlines (HA)' },
        { code: 'IB', name: 'Iberia (IB)' },
        { code: 'FI', name: 'Icelandair (FI)' },
        { code: 'IR', name: 'Iran Air (IR)' },
        { code: 'JL', name: 'Japan Airlines (JL)' },
        { code: '9W', name: 'Jet Airways (9W)' },
        { code: 'B6', name: 'JetBlue Airways (B6)' },
        { code: 'KL', name: 'KLM (KL)' },
        { code: 'KE', name: 'Korean Air (KE)' },
        { code: 'KU', name: 'Kuwait Airways (KU)' },
        { code: 'LA', name: 'LATAM Airlines (LA)' },
        { code: 'LO', name: 'LOT Polish Airlines (LO)' },
        { code: 'LH', name: 'Lufthansa (LH)' },
        { code: 'MH', name: 'Malaysia Airlines (MH)' },
        { code: 'ME', name: 'Middle East Airlines (ME)' },
        { code: 'WY', name: 'Oman Air (WY)' },
        { code: 'PK', name: 'Pakistan International (PK)' },
        { code: 'PR', name: 'Philippine Airlines (PR)' },
        { code: 'QF', name: 'Qantas Airways (QF)' },
        { code: 'QR', name: 'Qatar Airways (QR)' },
        { code: 'AT', name: 'Royal Air Maroc (AT)' },
        { code: 'RJ', name: 'Royal Jordanian (RJ)' },
        { code: 'SK', name: 'SAS (SK)' },
        { code: 'SV', name: 'Saudia (SV)' },
        { code: 'SQ', name: 'Singapore Airlines (SQ)' },
        { code: 'SA', name: 'South African Airways (SA)' },
        { code: 'WN', name: 'Southwest Airlines (WN)' },
        { code: 'LX', name: 'SWISS (LX)' },
        { code: 'TP', name: 'TAP Air Portugal (TP)' },
        { code: 'TG', name: 'Thai Airways (TG)' },
        { code: 'TK', name: 'Turkish Airlines (TK)' },
        { code: 'UA', name: 'United Airlines (UA)' },
        { code: 'VN', name: 'Vietnam Airlines (VN)' },
        { code: 'VS', name: 'Virgin Atlantic (VS)' },
        { code: 'VA', name: 'Virgin Australia (VA)' },
        { code: 'VY', name: 'Vueling Airlines (VY)' },
        { code: 'WS', name: 'WestJet (WS)' },
        { code: 'WF', name: 'Wideroe (WF)' },
        { code: 'XY', name: 'Flynas (XY)' },
        { code: 'IX', name: 'Air India Express (IX)' },
        { code: 'B3', name: 'Tashi Air (B3)' },
        { code: 'KB', name: 'Druk Air (KB)' },
        { code: 'RA', name: 'Nepal Airlines (RA)' },
        { code: 'H9', name: 'Himalaya Airlines (H9)' },
        { code: 'BG', name: 'Biman Bangladesh (BG)' },
        { code: 'BS', name: 'US-Bangla Airlines (BS)' },
        { code: 'UL', name: 'SriLankan Airlines (UL)' },
        { code: 'M8', name: 'SkyJet (M8)' },
        { code: 'DV', name: 'SCAT Airlines (DV)' },
        { code: 'HY', name: 'Uzbekistan Airways (HY)' },
        { code: 'T5', name: 'Turkmenistan Airlines (T5)' },
        { code: '4J', name: 'FlyArna (4J)' },
        { code: '6R', name: 'Alrosa (6R)' },
        { code: '8D', name: 'Astrakhan Airlines (8D)' },
        { code: '9U', name: 'Air Moldova (9U)' },
        { code: 'A9', name: 'Georgian Airways (A9)' },
        { code: 'B2', name: 'Belavia (B2)' },
        { code: 'BT', name: 'AirBaltic (BT)' },
        { code: 'FB', name: 'Bulgaria Air (FB)' },
        { code: 'JU', name: 'Air Serbia (JU)' },
        { code: 'KM', name: 'Air Malta (KM)' },
        { code: 'LG', name: 'Luxair (LG)' },
        { code: 'OU', name: 'Croatia Airlines (OU)' },
        { code: 'PS', name: 'Ukraine International (PS)' },
        { code: 'RO', name: 'Tarom (RO)' },
        { code: 'YM', name: 'Montenegro Airlines (YM)' },
    ];

    const currentAirlines = activeServiceType === 'DOMESTIC_FLIGHT' ? domesticAirlines : internationalAirlines;


    const refundTypes = ['All', 'Non-Refundable', 'Refundable', 'P Refundable', 'Refundable & P Refundable'];

    const fetchRules = async () => {
        try {
            setLoading(true);
            const res = await adminService.getMarkups();
            if (res.success) setRules(res.data);
        } catch (err) {
            console.error('Failed to fetch markup rules', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const finalData = {
                ...formData,
                serviceType: activeServiceType,
                markupValue: Number(formData.markupValue) || 0,
                priority: formData.airline === 'ALL' ? 0 : 10
            };
            
            const res = await adminService.updateMarkup(finalData);
            if (res.success) {
                toast.success(res.message || 'Markup rule updated successfully');
                setIsModalOpen(false);
                fetchRules();
            } else {
                toast.error(res.message || 'Failed to save markup rule');
            }
        } catch (err) {
            console.error('FULL_SAVE_ERROR_OBJECT:', err);
            console.error('ERROR_RESPONSE_DATA:', err.response?.data);
            toast.error(err.response?.data?.message || 'Failed to save markup rule');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this rule?')) return;
        try {
            const res = await adminService.deleteMarkup(id);
            if (res.success) {
                toast.success('Rule deleted');
                fetchRules();
            }
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    return (
        <div className="w-full space-y-10 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-1">Admin Markup</h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest pl-1">Pricing & Yield Management</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1 shadow-inner">
                        <button 
                            onClick={() => setActiveServiceType('DOMESTIC_FLIGHT')}
                            className={`px-6 py-3 rounded-xl font-black text-[11px] tracking-widest transition-all duration-300 ${activeServiceType === 'DOMESTIC_FLIGHT' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            DOMESTIC
                        </button>
                        <button 
                            onClick={() => setActiveServiceType('INTERNATIONAL_FLIGHT')}
                            className={`px-6 py-3 rounded-xl font-black text-[11px] tracking-widest transition-all duration-300 ${activeServiceType === 'INTERNATIONAL_FLIGHT' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            INTERNATIONAL
                        </button>
                    </div>

                    <button 
                        onClick={() => {
                            setFormData({
                                serviceType: activeServiceType,
                                airline: 'ALL',
                                refundType: 'All',
                                markupType: 'Fixed',
                                markupValue: 0,
                                priority: 0
                            });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-black rounded-2xl shadow-2xl hover:bg-primary-600 hover:scale-[1.02] active:scale-95 transition-all text-xs tracking-widest justify-center"
                    >
                        <IoAddCircleOutline size={20} />
                        CREATE {activeServiceType === 'DOMESTIC_FLIGHT' ? 'DOMESTIC' : 'INTL'} RULE
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-20 text-center font-black text-gray-300 italic text-xl">Accessing Revenue Engine...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {rules.filter(r => r.serviceType === activeServiceType).map((rule) => (
                        <div key={rule._id} className="bg-white p-safe rounded-2xl md:rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col justify-between card-hover min-h-[220px]">
                            <div className="flex justify-between items-start mb-6 md:mb-10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <IoAirplaneOutline className="text-primary-500" />
                                        <h3 className="text-lg md:text-xl font-black text-gray-900">
                                            {currentAirlines.find(a => a.code === rule.airline)?.name || rule.airline}
                                        </h3>
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-6">
                                        Ticket Type: <span className={rule.refundType === 'Non-Refundable' ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>{rule.refundType}</span>
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleDelete(rule._id)}
                                    className="p-3 text-gray-300 hover:text-rose-500 transition-all font-black text-sm">✎</button>
                            </div>
                            
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Markup Charge</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-gray-900 leading-none">
                                            {rule.markupType === 'Fixed' ? `₹${rule.markupValue}` : `${rule.markupValue}%`}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase italic">/ Ticket</span>
                                    </div>
                                </div>
                                
                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm ${rule.priority > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {rule.priority > 0 ? 'Priority Rule' : 'Global Rule'}
                                </div>
                            </div>
                            
                            <div className="mt-6 md:mt-10 p-4 bg-gray-50 rounded-2xl flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span>STATUS</span>
                                <span className="text-emerald-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    ACTIVE
                                </span>
                            </div>
                        </div>
                    ))}

                    {rules.filter(r => r.serviceType === activeServiceType).length === 0 && (
                        <div className="col-span-full py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 italic font-bold">
                            <IoAirplaneOutline size={64} className="mb-6 opacity-10" />
                            No {activeServiceType === 'DOMESTIC_FLIGHT' ? 'Domestic' : 'International'} markup rules found.
                        </div>
                    )}
                </div>
            )}

            <div className="bg-primary-600 p-safe rounded-2xl md:rounded-[2.5rem] text-white shadow-2xl shadow-primary-600/20 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
                    <div className="text-center md:text-left">
                        <h3 className="text-xl md:text-2xl font-black mb-1 md:mb-2">Bulk Markup Update</h3>
                        <p className="text-blue-100 font-bold text-sm md:text-base">Apply global changes across all flight rules for peak season.</p>
                    </div>
                    <button className="w-full md:w-auto px-safe py-3 md:py-5 bg-white text-primary-600 font-black rounded-xl md:rounded-2xl shadow-xl hover:scale-105 transition-all outline-none text-xs md:text-sm">PROCEED TO BULK EDIT</button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">Edit Admin Markup</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configure pricing parameters</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-sm text-gray-400 font-bold hover:text-gray-900 transition-colors">✕</button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Airline</label>
                                    <select 
                                        value={formData.airline}
                                        onChange={e => setFormData({...formData, airline: e.target.value})}
                                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm"
                                    >
                                        {currentAirlines.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ticket Type</label>
                                    <select 
                                        value={formData.refundType}
                                        onChange={e => setFormData({...formData, refundType: e.target.value})}
                                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm"
                                    >
                                        {refundTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Markup Type</label>
                                    <div className="flex gap-2">
                                        {['Fixed', 'Percentage'].map(t => (
                                            <button 
                                                key={t}
                                                type="button"
                                                onClick={() => setFormData({...formData, markupType: t})}
                                                className={`flex-1 py-4 rounded-xl font-bold text-xs transition-all ${formData.markupType === t ? 'bg-primary-500 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}
                                            >
                                                {t.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Value ({formData.markupType === 'Fixed' ? '₹' : '%'})</label>
                                    <input 
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.markupValue}
                                        onChange={e => setFormData({...formData, markupValue: parseFloat(e.target.value)})}
                                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-black text-xl shadow-inner" 
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="bg-orange-50 p-6 rounded-2xl flex gap-4 items-start border border-orange-100">
                                <IoShieldCheckmarkOutline className="text-orange-500 text-2xl flex-shrink-0" />
                                <p className="text-[11px] text-orange-900 font-medium leading-relaxed">
                                    This markup will be applied automatically during flight search. Agents will see the final marked-up price as the actual fare.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-5 bg-gray-100 text-gray-500 font-black rounded-2xl transition-all text-xs tracking-widest uppercase">
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-5 bg-gray-900 text-white font-black rounded-2xl transition-all text-xs tracking-widest uppercase shadow-xl shadow-gray-200">
                                    Save Rule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMarkup;
