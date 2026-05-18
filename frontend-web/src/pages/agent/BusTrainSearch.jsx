import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';

const BusTrainSearch = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('bus');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [date, setDate] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResults([]);
        try {
            const res = await bookingService.searchGeneric(mode, { from, to, date });
            if (res.success) setResults(res.data);
        } catch (err) {
            setError(`No ${mode}s found for this route.`);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = (item) => {
        navigate('/agent/checkout', { 
            state: { 
                bookingData: { 
                    service: mode === 'bus' ? 'Bus' : 'Train', 
                    from: from, 
                    to: to, 
                    baseFare: item.price,
                    details: item
                } 
            } 
        });
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 animate-fade-in">
            <div className="flex items-center gap-4">
                <span className="text-4xl p-4 bg-green-50 rounded-3xl">🚌</span>
                <div>
                    <h2 className="text-3xl font-black text-gray-900">Surface Transport</h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Buses & Trains across India</p>
                </div>
            </div>
            
            <div className="flex bg-gray-100 p-1.5 rounded-3xl mb-4 max-w-[400px] shadow-inner">
                <button 
                    onClick={() => setMode('bus')}
                    className={`flex-1 py-4 font-black rounded-2xl transition-all text-xs tracking-widest ${mode === 'bus' ? 'bg-white text-primary-500 shadow-lg' : 'text-gray-400'}`}
                >
                    BUSES
                </button>
                <button 
                    onClick={() => setMode('train')}
                    className={`flex-1 py-4 font-black rounded-2xl transition-all text-xs tracking-widest ${mode === 'train' ? 'bg-white text-secondary-500 shadow-lg' : 'text-gray-400'}`}
                >
                    TRAINS
                </button>
            </div>

            <form onSubmit={handleSearch} className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 animate-slide-up overflow-hidden relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gray-50 rounded-full -mr-20 -mt-20"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end relative z-10">
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest mx-2">Origin</label>
                        <input type="text" value={from} onChange={e=>setFrom(e.target.value.toUpperCase())} placeholder="Source City" className="w-full p-5 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold" required />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest mx-2">Destination</label>
                        <input type="text" value={to} onChange={e=>setTo(e.target.value.toUpperCase())} placeholder="Target City" className="w-full p-5 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold" required />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest mx-2">Date</label>
                        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full p-5 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold" required />
                    </div>
                    <div className="md:col-span-1">
                        <button type="submit" disabled={loading} className={`w-full py-5 text-white font-black rounded-2xl shadow-xl transition-all transform hover:scale-105 active:scale-95 leading-none disabled:opacity-50 ${mode === 'bus' ? 'bg-primary-500 shadow-primary-500/20' : 'bg-secondary-500 shadow-secondary-500/20'}`}>
                            {loading ? '...' : `SEARCH ${mode.toUpperCase()}`}
                        </button>
                    </div>
                </div>
            </form>

            {error && <div className="bg-red-50 text-red-600 p-6 rounded-3xl font-bold">{error}</div>}

            {results.length > 0 ? (
                <div className="flex flex-col gap-6 animate-slide-up">
                    <h3 className="text-xl font-black text-gray-900 border-l-8 border-primary-500 pl-4 py-1">Available {mode}s</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {results.map((item, index) => (
                            <div key={index} className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 card-hover transition-all w-full">
                                <div className="w-full sm:w-auto border-b sm:border-b-0 pb-4 sm:pb-0 border-gray-100">
                                    <h4 className="font-black text-xl text-gray-900">{item.operator || item.trainName || 'Transport'}</h4>
                                    <p className="text-sm font-bold text-gray-400 uppercase">{from} ➔ {to}</p>
                                </div>
                                <div className="w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-end items-center sm:items-end pt-2 sm:pt-0">
                                    <p className="text-2xl sm:text-3xl font-black text-primary-600 mb-0 sm:mb-2">₹{item.price}</p>
                                    <button 
                                        onClick={() => handleBook(item)}
                                        className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-black rounded-xl text-xs transition-all touch-target shadow-md shadow-primary-500/20 active:scale-95"
                                    >
                                        BOOK
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white/50 p-20 rounded-[2.5rem] border-4 border-dashed border-gray-200 text-center animate-pulse">
                    <span className="text-6xl block mb-6 opacity-30">🔍</span>
                    <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-sm">Results area is ready</p>
                    <p className="text-xs text-gray-400 mt-2 font-bold">Search will query our real-time transport API</p>
                </div>
            )}
        </div>
    );
};

export default BusTrainSearch;
