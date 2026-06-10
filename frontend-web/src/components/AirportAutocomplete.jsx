import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/api';

export const POPULAR_AIRPORTS = [
    { code: 'DEL', city: 'New Delhi', label: 'Indira Gandhi Intl (DEL)' },
    { code: 'BOM', city: 'Mumbai', label: 'Chhatrapati Shivaji (BOM)' },
    { code: 'DXB', city: 'Dubai', label: 'Dubai Intl (DXB)' },
    { code: 'BLR', city: 'Bengaluru', label: 'Kempegowda Intl (BLR)' },
    { code: 'CCU', city: 'Kolkata', label: 'Netaji Subhash (CCU)' }
];

const AirportAutocomplete = ({ label, codeValue, onChangeCode, onChangeCity }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [airports, setAirports] = useState(POPULAR_AIRPORTS);
    const [loading, setLoading] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState(codeValue);

    useEffect(() => {
        if (!search) { setAirports(POPULAR_AIRPORTS); return; }
        
        // Local filtering
        const localMatch = POPULAR_AIRPORTS.filter(a => 
            a.code.toLowerCase().includes(search.toLowerCase()) || 
            a.city.toLowerCase().includes(search.toLowerCase()) ||
            a.label.toLowerCase().includes(search.toLowerCase())
        );

        if (localMatch.length > 0) {
            setAirports(localMatch);
        } else if (search.length < 2) {
            setAirports(POPULAR_AIRPORTS);
        } else {
            setAirports([]);
        }

        if (search.length < 2) return;

        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await bookingService.searchAirports(search);
                if (res.success) setAirports(res.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }, 500);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        if (codeValue) {
            const found = airports.find(a => a.code === codeValue);
            if (found) {
                setSelectedLabel(`${found.code} - ${found.city}`);
            } else {
                bookingService.searchAirports(codeValue).then(res => {
                    if (res.success && res.data) {
                        const resolved = res.data.find(a => a.code === codeValue);
                        if (resolved) {
                            setAirports(prev => {
                                if (prev.some(x => x.code === resolved.code)) return prev;
                                return [...prev, resolved];
                            });
                            setSelectedLabel(`${resolved.code} - ${resolved.city}`);
                        } else {
                            setSelectedLabel(codeValue);
                        }
                    } else {
                        setSelectedLabel(codeValue);
                    }
                }).catch(() => {
                    setSelectedLabel(codeValue);
                });
            }
        } else {
            setSelectedLabel('');
        }
    }, [codeValue]);

    return (
        <div className="flex-1 relative w-full">
            {label && <span className="text-[10px] font-semibold text-[#999] uppercase tracking-widest block mb-1">{label}</span>}
            <div className={`flex items-center w-full bg-white border ${open ? 'border-[#ff6c00] ring-2 ring-[#ff6c00]/20' : 'border-slate-300'} rounded-xl px-4 py-2.5 transition-all shadow-sm`}>
                <input
                    className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent placeholder-slate-400"
                    value={open ? search : (selectedLabel || codeValue)}
                    onChange={e => { setSearch(e.target.value); setOpen(true); }}
                    onFocus={() => { setSearch(''); setOpen(true); }}
                    onBlur={() => setTimeout(() => setOpen(false), 200)}
                    placeholder="Search city or airport..."
                />
            </div>
            {open && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[260px] bg-white border border-slate-200 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] z-[100] max-h-[300px] overflow-y-auto">
                    {loading && <div className="p-3 text-center text-xs text-[#888]">Searching...</div>}
                    {!loading && airports.map(a => (
                        <div key={a.code}
                            className="px-5 py-3 hover:bg-slate-50 border-b border-slate-100 cursor-pointer flex justify-between items-center transition-colors"
                            onMouseDown={(e) => { 
                                // use onMouseDown to prevent onBlur from firing before onClick
                                e.preventDefault(); 
                                onChangeCode(a.code); 
                                if (onChangeCity) onChangeCity(a.city);
                                setSelectedLabel(`${a.code} - ${a.city}`); 
                                setOpen(false); 
                            }}>
                            <div>
                                <p className="text-sm font-bold text-slate-800">{a.city}</p>
                                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{a.label}{a.country ? ` • ${a.country}` : ''}</p>
                            </div>
                            <span className="bg-orange-50 px-2 py-1 rounded border border-orange-100 text-[#FF8000] font-black text-xs ml-2">{a.code}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AirportAutocomplete;
