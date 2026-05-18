import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';

const GenericSearch = ({ title, type, searchParams, resultKeys, icon }) => {
    const [params, setParams] = useState(searchParams.reduce((acc, curr) => ({...acc, [curr.key]: curr.default}), {}));
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookingRef, setBookingRef] = useState(null);
    const navigate = useNavigate();

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResults([]);
        try {
            const res = await bookingService.searchGeneric(type, params);
            if (res.success) setResults(res.data);
        } catch (err) {
            setError(`No ${type}s found for this route.`);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = (item) => {
        navigate('/agent/checkout', { 
            state: { 
                bookingData: { 
                    service: title, 
                    from: item.from || params.from || params.city || 'Origin', 
                    to: item.to || params.to || item.city || 'Dest', 
                    baseFare: item.price || item.pricePerNight,
                    details: item
                } 
            } 
        });
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-10 animate-fade-in">
            <div className="flex items-center gap-4">
                <span className="text-4xl p-4 bg-primary-50 rounded-3xl shadow-sm">{icon}</span>
                <div>
                    <h2 className="text-3xl font-black text-gray-900">{title} Services</h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Real-time inventory access</p>
                </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16"></div>
                
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-6 items-end relative z-10">
                    {searchParams.map((p) => (
                        <div key={p.key} className="flex-1 w-full text-left">
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest leading-none mx-2">{p.label}</label>
                            <input 
                                type={p.type || 'text'} 
                                value={params[p.key]} 
                                onChange={e => setParams({...params, [p.key]: e.target.value})} 
                                className="w-full bg-gray-50 border-0 rounded-2xl p-5 font-bold text-gray-700 focus:ring-2 focus:ring-primary-500 transition-all shadow-inner" 
                                required 
                            />
                        </div>
                    ))}
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="px-10 py-5 bg-secondary-500 text-white font-black rounded-2xl shadow-xl shadow-secondary-500/20 hover:bg-secondary-600 transition-all disabled:opacity-50 transform active:scale-95 leading-none"
                    >
                        {loading ? '...' : 'SEARCH'}
                    </button>
                </form>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-6 rounded-3xl border border-red-100 font-bold text-sm animate-slide-up leading-relaxed shadow-sm">{error}</div>}
            
            {bookingRef && (
                <div className="bg-green-50 text-green-700 p-8 rounded-[2rem] font-bold border-2 border-green-200 animate-slide-up flex flex-col items-center shadow-lg shadow-green-500/5">
                    <span className="text-4xl mb-4">🎉</span>
                    <p className="text-xl mb-2">Booking Confirmed!</p>
                    <p className="text-sm font-black uppercase tracking-widest">PNR: {bookingRef}</p>
                </div>
            )}

            {results.length > 0 && (
                <div className="flex flex-col gap-6 animate-slide-up">
                    <h3 className="text-xl font-black text-gray-900 border-l-8 border-primary-500 pl-4 py-1">Available Options</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {results.map(item => (
                            <div key={item.id} className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col md:flex-row justify-between items-center card-hover transition-all">
                                <div className="flex items-center gap-6 mb-4 md:mb-0">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl font-black text-primary-200 uppercase tracking-tighter">
                                        {item.id.substring(0,2)}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-xl text-gray-900">{item[resultKeys.title]}</h4>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{item[resultKeys.subtitle]}</p>
                                    </div>
                                </div>
                                <div className="text-center md:text-right w-full md:w-auto mt-6 md:mt-0 border-t md:border-t-0 pt-6 md:pt-0">
                                    <div className="mb-4">
                                        <p className="text-3xl font-black text-primary-600 leading-none mb-1">₹{item.price || item.pricePerNight}</p>
                                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Earn ₹{((item.price || item.pricePerNight) * item.commissionRate).toFixed(0)}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleBook(item)} 
                                        className="w-full md:w-auto px-10 py-3 bg-primary-500 hover:bg-primary-600 text-white font-black rounded-xl shadow-lg shadow-primary-500/10 transition-all text-xs"
                                    >
                                        BOOK TICKET
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const HotelSearch = () => (
    <GenericSearch 
        title="Hotel" type="hotel" icon="🏨"
        searchParams={[{key:'city', label:'Enter Destination City', default:'Mumbai'}, {key:'checkIn', type:'date', label:'Check In Date', default:''}]}
        resultKeys={{title: 'name', subtitle: 'city'}}
    />
);

export const BusSearch = () => (
    <GenericSearch 
        title="Bus" type="bus" icon="🚌"
        searchParams={[{key:'from', label:'From City', default:'Mumbai'}, {key:'to', label:'To City', default:'Goa'}, {key:'date', type:'date', label:'Journey Date', default:''}]}
        resultKeys={{title: 'operator', subtitle: 'departureTime'}}
    />
);

export const TrainSearch = () => (
    <GenericSearch 
        title="Train" type="train" icon="🚆"
        searchParams={[{key:'from', label:'Origin Station', default:'NDLS'}, {key:'to', label:'Destination', default:'BCT'}, {key:'date', type:'date', label:'Travel Date', default:''}]}
        resultKeys={{title: 'trainName', subtitle: 'departureTime'}}
    />
);
