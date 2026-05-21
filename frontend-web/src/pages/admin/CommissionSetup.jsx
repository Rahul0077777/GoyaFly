import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import { 
    IoAddCircleOutline, IoTrashOutline,
    IoAirplaneOutline, IoShieldCheckmarkOutline, IoSearchOutline,
    IoPersonOutline, IoCloseOutline, IoCheckmarkCircleOutline,
    IoCheckboxOutline, IoSquareOutline, IoPeopleOutline
} from 'react-icons/io5';

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
        priority: 0,
        targetAgentCode: 'ALL'
    });

    // Multi-Agent Search State
    const [agentSearchQuery, setAgentSearchQuery] = useState('');
    const [agentSearchResults, setAgentSearchResults] = useState([]);
    const [isSearchingAgent, setIsSearchingAgent] = useState(false);
    const [selectedAgents, setSelectedAgents] = useState([]); // Multi-select array
    const [agentMarkupData, setAgentMarkupData] = useState({
        serviceType: 'DOMESTIC_FLIGHT',
        airline: 'ALL',
        refundType: 'All',
        markupType: 'Fixed',
        markupValue: 0,
    });
    const [isSavingAgentMarkup, setIsSavingAgentMarkup] = useState(false);
    const searchTimeoutRef = useRef(null);
    const searchRef = useRef(null);

    const domesticAirlines = [
        { code: 'ALL', name: 'All Domestic Airlines' },
        { code: '6E', name: 'Indigo (6E)' },
        { code: 'SG', name: 'Spicejet (SG)' },
        { code: 'AI', name: 'Air India (AI)' },
        { code: 'IX', name: 'Air India Express (IX)' },
        { code: 'QP', name: 'Akasa Air (QP)' },
        { code: 'UK', name: 'Vistara (UK)' },
    ];

    const internationalAirlines = [
        { code: 'ALL', name: 'All International Airlines' },
        { code: 'AI', name: 'Air India (AI)' },
        { code: '6E', name: 'IndiGo (6E)' },
        { code: 'SV', name: 'Saudi Air (SV)' },
        { code: 'FZ', name: 'Fly Dubai (FZ)' },
        { code: 'G9', name: 'Air Arabia (G9)' },
        { code: 'EK', name: 'Emirates (EK)' },
        { code: 'QR', name: 'Qatar Airways (QR)' },
        { code: 'EY', name: 'Etihad Airways (EY)' },
        { code: 'TK', name: 'Turkish Airlines (TK)' },
        { code: 'BA', name: 'British Airways (BA)' },
        { code: 'SQ', name: 'Singapore Airlines (SQ)' },
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

    useEffect(() => { fetchRules(); }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setAgentSearchResults([]);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
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
                toast.success('Global markup rule saved!');
                setIsModalOpen(false);
                fetchRules();
            } else {
                toast.error(res.message || 'Failed to save markup rule');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save markup rule');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this rule?')) return;
        try {
            const res = await adminService.deleteMarkup(id);
            if (res.success) { toast.success('Rule deleted'); fetchRules(); }
        } catch (err) { toast.error('Delete failed'); }
    };

    // --- Multi-Agent Search ---
    const handleAgentSearch = (query) => {
        setAgentSearchQuery(query);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (!query.trim()) { setAgentSearchResults([]); return; }
        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearchingAgent(true);
            try {
                const res = await adminService.searchAgentByCode(query);
                if (res.success) setAgentSearchResults(res.data || []);
            } catch (err) {
                console.error('Agent search failed', err);
            } finally {
                setIsSearchingAgent(false);
            }
        }, 400);
    };

    const toggleSelectAgent = (agent) => {
        const alreadySelected = selectedAgents.find(a => a._id === agent._id);
        if (alreadySelected) {
            setSelectedAgents(prev => prev.filter(a => a._id !== agent._id));
        } else {
            if (!agent.agentCode) {
                toast.warning(`${agent.agencyName} has no Agent Code (KYC pending). Skipping.`);
                return;
            }
            setSelectedAgents(prev => [...prev, agent]);
        }
    };

    const removeAgent = (agentId) => {
        setSelectedAgents(prev => prev.filter(a => a._id !== agentId));
    };

    // Save markup for ALL selected agents
    const handleSaveAgentMarkup = async (e) => {
        e.preventDefault();
        if (selectedAgents.length === 0) { toast.error('Please select at least one agent.'); return; }
        const validAgents = selectedAgents.filter(a => a.agentCode);
        if (validAgents.length === 0) { toast.error('None of the selected agents have an Agent Code.'); return; }

        setIsSavingAgentMarkup(true);
        let successCount = 0;
        let failCount = 0;

        for (const agent of validAgents) {
            try {
                const finalData = {
                    ...agentMarkupData,
                    markupValue: Number(agentMarkupData.markupValue) || 0,
                    priority: 100,
                    targetAgentCode: agent.agentCode,
                };
                const res = await adminService.updateMarkup(finalData);
                if (res.success) successCount++;
                else failCount++;
            } catch (err) {
                failCount++;
            }
        }

        setIsSavingAgentMarkup(false);
        if (successCount > 0) toast.success(`Markup saved for ${successCount} agent(s)!`);
        if (failCount > 0) toast.error(`Failed for ${failCount} agent(s).`);
        fetchRules();
    };

    const agentSpecificRules = rules.filter(r => r.targetAgentCode && r.targetAgentCode !== 'ALL');
    const globalRules = rules.filter(r => !r.targetAgentCode || r.targetAgentCode === 'ALL');

    return (
        <div className="w-full space-y-6 pb-20">

            {/* ── Hero Banner ── */}
            <div className="relative bg-[#1D4171] rounded-2xl overflow-hidden shadow-2xl shadow-blue-950/40 min-h-[160px] sm:min-h-[200px]">
                {/* Background gradient blob */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-orange-400/10 rounded-full blur-2xl" />
                </div>

                {/* SVG Decorative Art */}
                <div className="absolute right-0 top-0 h-full w-1/2 sm:w-2/5 pointer-events-none select-none overflow-hidden">
                    <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-0 top-0 h-full w-auto opacity-90">
                        {/* City skyline silhouette */}
                        <rect x="270" y="120" width="18" height="80" rx="2" fill="#2d5a9e" opacity="0.7"/>
                        <rect x="290" y="100" width="22" height="100" rx="2" fill="#2d5a9e" opacity="0.6"/>
                        <rect x="314" y="110" width="16" height="90" rx="2" fill="#1a3d6e" opacity="0.8"/>
                        <rect x="332" y="90" width="26" height="110" rx="2" fill="#2d5a9e" opacity="0.7"/>
                        <rect x="360" y="105" width="20" height="95" rx="2" fill="#1a3d6e" opacity="0.6"/>
                        <rect x="382" y="80" width="24" height="120" rx="2" fill="#2d5a9e" opacity="0.7"/>
                        {/* Windows on buildings */}
                        <rect x="293" y="108" width="5" height="4" rx="1" fill="#F07E21" opacity="0.7"/>
                        <rect x="300" y="108" width="5" height="4" rx="1" fill="#F07E21" opacity="0.5"/>
                        <rect x="293" y="118" width="5" height="4" rx="1" fill="#F07E21" opacity="0.4"/>
                        <rect x="335" y="98" width="5" height="4" rx="1" fill="#F07E21" opacity="0.6"/>
                        <rect x="343" y="98" width="5" height="4" rx="1" fill="#F07E21" opacity="0.4"/>
                        <rect x="335" y="108" width="5" height="4" rx="1" fill="#F07E21" opacity="0.5"/>
                        <rect x="385" y="88" width="5" height="4" rx="1" fill="#F07E21" opacity="0.6"/>
                        <rect x="392" y="88" width="5" height="4" rx="1" fill="#F07E21" opacity="0.3"/>

                        {/* Airplane */}
                        <g transform="translate(180, 40) rotate(-15)">
                            <path d="M60 20 L100 30 L60 40 L55 36 L72 30 L55 24 Z" fill="white" opacity="0.95"/>
                            <path d="M60 20 L0 10 L3 30 L60 40 Z" fill="white" opacity="0.9"/>
                            <path d="M55 36 L45 55 L55 52 L65 36 Z" fill="white" opacity="0.8"/>
                            <path d="M20 13 L10 5 L12 18 Z" fill="white" opacity="0.7"/>
                        </g>

                        {/* Flight path dashed trail */}
                        <path d="M50 90 Q180 50 260 70" stroke="white" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.25"/>

                        {/* Price tag floating */}
                        <g transform="translate(200, 130)">
                            <rect x="0" y="0" width="70" height="36" rx="10" fill="#F07E21" opacity="0.9"/>
                            <text x="35" y="23" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" fontFamily="sans-serif">₹ MARKUP</text>
                        </g>

                        {/* Coin stack */}
                        <g transform="translate(105, 100)">
                            <ellipse cx="20" cy="42" rx="20" ry="6" fill="#F07E21" opacity="0.7"/>
                            <rect x="0" y="28" width="40" height="14" rx="2" fill="#F07E21" opacity="0.75"/>
                            <ellipse cx="20" cy="28" rx="20" ry="6" fill="#ffb347" opacity="0.9"/>
                            <ellipse cx="20" cy="16" rx="20" ry="6" fill="#F07E21" opacity="0.65"/>
                            <rect x="0" y="8" width="40" height="8" rx="2" fill="#F07E21" opacity="0.6"/>
                            <ellipse cx="20" cy="8" rx="20" ry="6" fill="#ffb347" opacity="0.85"/>
                            <text x="20" y="12" textAnchor="middle" fill="white" fontSize="8" fontWeight="900" fontFamily="sans-serif">₹</text>
                        </g>

                        {/* Small stars/sparkles */}
                        <circle cx="160" cy="60" r="2.5" fill="white" opacity="0.5"/>
                        <circle cx="240" cy="45" r="1.5" fill="#F07E21" opacity="0.7"/>
                        <circle cx="175" cy="100" r="2" fill="white" opacity="0.4"/>
                        <circle cx="130" cy="80" r="1.5" fill="white" opacity="0.5"/>
                    </svg>
                </div>

                {/* Text Content */}
                <div className="relative z-10 p-5 sm:p-8 flex flex-col justify-between h-full min-h-[160px] sm:min-h-[200px]">
                    <div className="max-w-[60%] sm:max-w-[55%]">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 bg-[#F07E21] rounded-lg flex items-center justify-center flex-shrink-0">
                                <IoAddCircleOutline className="text-white text-base" />
                            </div>
                            <p className="text-blue-200/80 font-black uppercase text-[9px] tracking-[3px]">Admin Panel</p>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                            Admin <span className="text-[#F07E21]">Markup</span>
                        </h2>
                        <p className="text-blue-200/70 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest mt-1.5">
                            Pricing & Yield Management
                        </p>
                        <div className="flex flex-wrap gap-2 mt-4">
                            <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[9px] font-black text-white uppercase tracking-widest backdrop-blur-sm">Global Rules</span>
                            <span className="px-3 py-1 bg-purple-400/20 border border-purple-300/30 rounded-full text-[9px] font-black text-purple-200 uppercase tracking-widest backdrop-blur-sm">Agent-Specific</span>
                        </div>
                    </div>

                    {/* Bottom controls */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-5 sm:mt-4">
                        <div className="bg-white/10 backdrop-blur-sm p-1 rounded-xl flex gap-1 border border-white/15">
                            <button onClick={() => setActiveServiceType('DOMESTIC_FLIGHT')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-black text-[10px] tracking-widest transition-all ${activeServiceType === 'DOMESTIC_FLIGHT' ? 'bg-white text-[#1D4171] shadow-md' : 'text-white/70 hover:text-white'}`}>
                                DOMESTIC
                            </button>
                            <button onClick={() => setActiveServiceType('INTERNATIONAL_FLIGHT')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-black text-[10px] tracking-widest transition-all ${activeServiceType === 'INTERNATIONAL_FLIGHT' ? 'bg-white text-[#1D4171] shadow-md' : 'text-white/70 hover:text-white'}`}>
                                INTERNATIONAL
                            </button>
                        </div>
                        <button onClick={() => { setFormData({ serviceType: activeServiceType, airline: 'ALL', refundType: 'All', markupType: 'Fixed', markupValue: 0, priority: 0, targetAgentCode: 'ALL' }); setIsModalOpen(true); }}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#F07E21] hover:bg-[#d96d1a] text-white font-black rounded-xl text-[10px] tracking-widest active:scale-95 transition-all border-b-2 border-[#c46215] shadow-lg shadow-orange-500/20 flex-shrink-0">
                            <IoAddCircleOutline size={16} /> CREATE RULE
                        </button>
                    </div>
                </div>
            </div>

            {/* ── SPECIFIC AGENT MARKUP ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
                {/* Section Header */}
                <div className="flex items-center gap-3 p-5 sm:p-6 border-b border-gray-100">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <IoPeopleOutline className="text-purple-600 text-lg" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-black text-gray-900">Specific Agent Markup</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select one or multiple agents → set markup → save</p>
                    </div>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                    {/* Search Box */}
                    <div ref={searchRef} className="relative">
                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3.5 border-2 border-transparent focus-within:border-purple-400 transition-all">
                            <IoSearchOutline className="text-gray-400 text-lg flex-shrink-0" />
                            <input
                                type="text"
                                value={agentSearchQuery}
                                onChange={e => handleAgentSearch(e.target.value)}
                                placeholder="Search by Agent Code, Agency Name or Email..."
                                className="flex-1 bg-transparent outline-none font-semibold text-sm text-gray-900 placeholder-gray-400 min-w-0"
                            />
                            {isSearchingAgent && <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                        </div>

                        {/* Dropdown */}
                        {agentSearchResults.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] max-h-64 overflow-y-auto">
                                {agentSearchResults.map(agent => {
                                    const isSelected = selectedAgents.some(a => a._id === agent._id);
                                    return (
                                        <button key={agent._id} onClick={() => toggleSelectAgent(agent)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors text-left border-b border-gray-50 last:border-0 ${isSelected ? 'bg-purple-50' : ''}`}>
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                                                {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                                                {(agent.agencyName || '?')[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 text-sm truncate">{agent.agencyName}</p>
                                                <p className="text-[10px] font-bold text-gray-400 truncate">{agent.agentCode || 'No Code'} · {agent.agentName}</p>
                                            </div>
                                            {!agent.agentCode && (
                                                <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full flex-shrink-0">KYC PENDING</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {agentSearchQuery.length > 1 && !isSearchingAgent && agentSearchResults.length === 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 px-4 py-4 text-center text-sm font-bold text-gray-400">
                                No agents found for "{agentSearchQuery}"
                            </div>
                        )}
                    </div>

                    {/* Selected Agents Chips */}
                    {selectedAgents.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedAgents.map(agent => (
                                <div key={agent._id} className="flex items-center gap-2 bg-purple-100 text-purple-800 rounded-xl px-3 py-1.5 text-xs font-black">
                                    <div className="w-5 h-5 bg-purple-600 rounded-md flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                                        {(agent.agencyName || '?')[0].toUpperCase()}
                                    </div>
                                    <span className="truncate max-w-[100px] sm:max-w-[160px]">{agent.agentCode} – {agent.agencyName}</span>
                                    <button onClick={() => removeAgent(agent._id)} className="text-purple-500 hover:text-purple-900 ml-1 flex-shrink-0">
                                        <IoCloseOutline size={14} />
                                    </button>
                                </div>
                            ))}
                            <button onClick={() => setSelectedAgents([])}
                                className="flex items-center gap-1 text-[10px] font-black text-gray-400 hover:text-rose-500 transition-colors px-2 py-1.5">
                                Clear all
                            </button>
                        </div>
                    )}

                    {/* Markup Form (shown when agents selected) */}
                    {selectedAgents.length > 0 && (
                        <form onSubmit={handleSaveAgentMarkup} className="border-2 border-purple-200 rounded-xl overflow-hidden">
                            {/* Form header */}
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-white font-black text-sm">
                                        Setting markup for {selectedAgents.length} agent{selectedAgents.length > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-purple-200 text-[10px] font-bold mt-0.5">
                                        {selectedAgents.map(a => a.agentCode).join(', ')}
                                    </p>
                                </div>
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-black text-sm">
                                    {selectedAgents.length}
                                </div>
                            </div>

                            <div className="p-4 sm:p-5 space-y-4 bg-white">
                                {/* Row 1: Service + Airline + Refund */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Service Type</label>
                                        <select value={agentMarkupData.serviceType} onChange={e => setAgentMarkupData({...agentMarkupData, serviceType: e.target.value})}
                                            className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-purple-400 font-bold text-sm">
                                            <option value="DOMESTIC_FLIGHT">Domestic Flight</option>
                                            <option value="INTERNATIONAL_FLIGHT">International Flight</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Airline</label>
                                        <select value={agentMarkupData.airline} onChange={e => setAgentMarkupData({...agentMarkupData, airline: e.target.value})}
                                            className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-purple-400 font-bold text-sm">
                                            {(agentMarkupData.serviceType === 'DOMESTIC_FLIGHT' ? domesticAirlines : internationalAirlines).map(a => (
                                                <option key={a.code} value={a.code}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Ticket Type</label>
                                        <select value={agentMarkupData.refundType} onChange={e => setAgentMarkupData({...agentMarkupData, refundType: e.target.value})}
                                            className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-purple-400 font-bold text-sm">
                                            {refundTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Row 2: Type + Value */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Markup Type</label>
                                        <div className="flex gap-2">
                                            {['Fixed', 'Percentage'].map(t => (
                                                <button key={t} type="button" onClick={() => setAgentMarkupData({...agentMarkupData, markupType: t})}
                                                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${agentMarkupData.markupType === t ? 'bg-purple-600 text-white shadow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                                            Value ({agentMarkupData.markupType === 'Fixed' ? '₹' : '%'})
                                        </label>
                                        <input type="number" required min="0"
                                            value={agentMarkupData.markupValue}
                                            onChange={e => setAgentMarkupData({...agentMarkupData, markupValue: parseFloat(e.target.value) || 0})}
                                            className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-purple-400 font-black text-lg"
                                            placeholder="0" />
                                    </div>
                                </div>

                                <button type="submit" disabled={isSavingAgentMarkup}
                                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-xl shadow hover:shadow-lg active:scale-[.98] transition-all text-sm tracking-widest uppercase disabled:opacity-60 flex items-center justify-center gap-2">
                                    {isSavingAgentMarkup ? (
                                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving for {selectedAgents.length} agent(s)...</>
                                    ) : (
                                        <><IoCheckmarkCircleOutline size={18} /> Apply to {selectedAgents.length} Agent{selectedAgents.length > 1 ? 's' : ''}</>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Agent-Specific Rules List */}
                    {agentSpecificRules.length > 0 && (
                        <div className="space-y-2 pt-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Active Agent Rules ({agentSpecificRules.length})
                            </p>
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                {agentSpecificRules.map(rule => (
                                    <div key={rule._id} className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <IoPersonOutline className="text-white text-sm" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="px-2 py-0.5 bg-purple-600 text-white text-[9px] font-black rounded uppercase tracking-wider flex-shrink-0">{rule.targetAgentCode}</span>
                                                <span className="text-xs font-black text-gray-800 truncate">
                                                    {rule.serviceType === 'DOMESTIC_FLIGHT' ? 'Domestic' : 'Intl'} · {rule.airline}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold mt-0.5 truncate">{rule.refundType}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-base font-black text-purple-700">{rule.markupType === 'Fixed' ? `₹${rule.markupValue}` : `${rule.markupValue}%`}</p>
                                        </div>
                                        <button onClick={() => handleDelete(rule._id)}
                                            className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all flex-shrink-0">
                                            <IoTrashOutline size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── GLOBAL RULES ── */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                        <IoAirplaneOutline className="text-gray-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-gray-900">Global Markup Rules</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Applied to all agents</p>
                    </div>
                </div>

                {loading ? (
                    <div className="p-16 text-center font-black text-gray-300 italic">Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {globalRules.filter(r => r.serviceType === activeServiceType).map(rule => (
                            <div key={rule._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between min-h-[170px] hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <IoAirplaneOutline className="text-primary-500 text-sm" />
                                            <h3 className="text-base font-black text-gray-900 leading-tight">
                                                {currentAirlines.find(a => a.code === rule.airline)?.name || rule.airline}
                                            </h3>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-5 mt-0.5">
                                            <span className={rule.refundType === 'Non-Refundable' ? 'text-rose-500' : 'text-emerald-500'}>{rule.refundType}</span>
                                        </p>
                                    </div>
                                    <button onClick={() => handleDelete(rule._id)}
                                        className="w-7 h-7 flex items-center justify-center text-gray-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all flex-shrink-0">
                                        <IoTrashOutline size={14} />
                                    </button>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Markup</p>
                                        <p className="text-2xl font-black text-gray-900">
                                            {rule.markupType === 'Fixed' ? `₹${rule.markupValue}` : `${rule.markupValue}%`}
                                            <span className="text-[10px] font-bold text-gray-400 ml-1">/ ticket</span>
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${rule.priority > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {rule.priority > 0 ? 'Priority' : 'Global'}
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <span>STATUS</span>
                                    <span className="text-emerald-500 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span> ACTIVE
                                    </span>
                                </div>
                            </div>
                        ))}

                        {globalRules.filter(r => r.serviceType === activeServiceType).length === 0 && (
                            <div className="col-span-full py-16 bg-white rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 italic font-bold">
                                <IoAirplaneOutline size={40} className="mb-3 opacity-20" />
                                No {activeServiceType === 'DOMESTIC_FLIGHT' ? 'Domestic' : 'International'} global rules yet.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── GLOBAL MARKUP MODAL ── */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full sm:max-w-lg overflow-hidden">
                        <div className="p-5 sm:p-7 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Create Global Markup</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Applies to all agents</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-5 sm:p-7 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Airline</label>
                                    <select value={formData.airline} onChange={e => setFormData({...formData, airline: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm">
                                        {currentAirlines.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket Type</label>
                                    <select value={formData.refundType} onChange={e => setFormData({...formData, refundType: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm">
                                        {refundTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Markup Type</label>
                                    <div className="flex gap-2">
                                        {['Fixed', 'Percentage'].map(t => (
                                            <button key={t} type="button" onClick={() => setFormData({...formData, markupType: t})}
                                                className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${formData.markupType === t ? 'bg-primary-500 text-white shadow' : 'bg-gray-100 text-gray-400'}`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Value ({formData.markupType === 'Fixed' ? '₹' : '%'})</label>
                                    <input type="number" required min="0" value={formData.markupValue}
                                        onChange={e => setFormData({...formData, markupValue: parseFloat(e.target.value)})}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 font-black text-xl" placeholder="0" />
                                </div>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-xl flex gap-3 items-start border border-orange-100">
                                <IoShieldCheckmarkOutline className="text-orange-500 text-lg flex-shrink-0 mt-0.5" />
                                <p className="text-[11px] text-orange-900 font-medium leading-relaxed">
                                    Global rule applies to all agents. Override per-agent using the section above.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-xl text-xs tracking-widest uppercase">Cancel</button>
                                <button type="submit"
                                    className="flex-1 py-4 bg-gray-900 text-white font-black rounded-xl text-xs tracking-widest uppercase shadow-lg">Save Rule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMarkup;
