import React, { useState, useEffect } from 'react';
import { agentService } from '../../services/api';
import { toast } from 'react-toastify';

const MarkupSetup = () => {
    const [markups, setMarkups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);

    useEffect(() => {
        fetchMarkups();
    }, []);

    const fetchMarkups = async () => {
        try {
            const res = await agentService.getMarkups();
            if (res.success) {
                setMarkups(res.data);
            } else {
                // Fallback for demo if backend isn't ready
                setMarkups([
                    { service: 'Domestic Flights', type: 'Flat', value: 250 },
                    { service: 'International Flights', type: 'Percentage', value: 2.5 },
                    { service: 'Hotels', type: 'Percentage', value: 5.0 },
                    { service: 'Buses', type: 'Flat', value: 50 },
                    { service: 'Trains', type: 'Flat', value: 20 }
                ]);
            }
        } catch (err) {
            console.error('Failed to fetch markups', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (service, value) => {
        setSavingId(service);
        try {
            const res = await agentService.updateMarkup({ service, value });
            if (res.success) {
                toast.success(`${service} markup updated!`);
            }
        } catch (err) {
            toast.error('Failed to update markup');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 md:space-y-10 animate-fade-in px-3 sm:px-4 md:px-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <span className="text-2xl sm:text-3xl md:text-4xl p-2 sm:p-3 md:p-4 bg-orange-50 rounded-lg sm:rounded-2xl md:rounded-3xl shadow-sm">📈</span>
                <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">Markup Management</h2>
                    <p className="text-gray-400 font-bold uppercase text-[8px] sm:text-[9px] md:text-[10px] tracking-widest">Self-defined profit margins</p>
                </div>
            </div>

            {loading ? (
                <div className="p-20 text-center font-black text-gray-300 italic">Loading active margins...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                    {markups.map(m => (
                        <div key={m.service} className="bg-white p-6 sm:p-8 md:p-10 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[2.5rem] shadow-2xl border border-gray-100 card-hover flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-6 sm:mb-8 md:mb-10 gap-3">
                                <div>
                                    <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">{m.service}</h3>
                                    <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Default</p>
                                </div>
                                <span className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1 md:py-1.5 rounded-lg sm:rounded-lg md:rounded-xl text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${m.type === 'Flat' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                    {m.type}
                                </span>
                            </div>

                            <div className="flex items-end justify-between gap-2 sm:gap-3 md:gap-4">
                                <div className="space-y-2 sm:space-y-3 md:space-y-4 flex-1 px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-gray-50 rounded-lg sm:rounded-lg md:rounded-xl shadow-inner relative">
                                    <span className="absolute right-3 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 font-black text-gray-300 text-lg sm:text-xl md:text-2xl">{m.type === 'Flat' ? '₹' : '%'}</span>
                                    <input 
                                        type="number" 
                                        value={m.value} 
                                        onChange={(e) => {
                                            const newValue = parseFloat(e.target.value);
                                            setMarkups(markups.map(item => item.service === m.service ? {...item, value: newValue} : item));
                                        }}
                                        className="w-full bg-transparent border-0 font-black text-xl sm:text-2xl md:text-3xl p-0 focus:ring-0 text-gray-900" 
                                    />
                                </div>
                                <button 
                                    onClick={() => handleSave(m.service, m.value)}
                                    disabled={savingId === m.service}
                                    className="p-2.5 sm:p-3 md:p-4 lg:p-5 bg-primary-500 text-white rounded-lg sm:rounded-lg md:rounded-2xl shadow-xl shadow-primary-500/20 hover:scale-105 transition-all flex-shrink-0 text-base sm:text-lg md:text-xl disabled:opacity-50"
                                >
                                    {savingId === m.service ? '...' : '✓'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-amber-50 border-4 border-dashed border-amber-200 p-6 sm:p-8 md:p-10 lg:p-12 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[3.5rem] text-center">
                <h4 className="text-base sm:text-lg md:text-xl font-black text-amber-900 mb-3 sm:mb-4 italic">Important Profit Warning</h4>
                <p className="text-amber-800 font-bold leading-relaxed max-w-2xl mx-auto text-xs sm:text-sm md:text-base">These markups are applied on top of the system net fare. Higher markups may reduce your conversion rate on public-facing sub-portals. Use with strategic care.</p>
            </div>
        </div>
    );
};

export default MarkupSetup;
