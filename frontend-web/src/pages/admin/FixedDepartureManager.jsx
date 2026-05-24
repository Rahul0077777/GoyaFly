import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaPlane, FaCalendarAlt, FaClock, FaUsers, FaTag } from 'react-icons/fa';

const AIRLINES_DATA = [
    { category: 'Indian Airlines', list: [
        { name: 'IndiGo', code: '6E' },
        { name: 'Air India', code: 'AI' },
        { name: 'Air India Express', code: 'IX' },
        { name: 'Akasa Air', code: 'QP' },
        { name: 'Vistara', code: 'UK' },
        { name: 'SpiceJet', code: 'SG' },
        { name: 'Alliance Air', code: '9I' },
        { name: 'Star Air', code: 'S5' },
        { name: 'FlyBig', code: 'FL' },
        { name: 'IndiaOne Air', code: 'I7' }
    ]},
    { category: 'International Airlines', list: [
        { name: 'Emirates', code: 'EK' },
        { name: 'Qatar Airways', code: 'QR' },
        { name: 'Etihad Airways', code: 'EY' },
        { name: 'Singapore Airlines', code: 'SQ' },
        { name: 'Malaysia Airlines', code: 'MH' },
        { name: 'Thai Airways', code: 'TG' },
        { name: 'SriLankan Airlines', code: 'UL' },
        { name: 'British Airways', code: 'BA' },
        { name: 'Lufthansa', code: 'LH' },
        { name: 'Air France', code: 'AF' },
        { name: 'KLM Royal Dutch Airlines', code: 'KL' },
        { name: 'Swiss International Air Lines', code: 'LX' },
        { name: 'Virgin Atlantic', code: 'VS' },
        { name: 'United Airlines', code: 'UA' },
        { name: 'American Airlines', code: 'AA' },
        { name: 'Delta Air Lines', code: 'DL' },
        { name: 'Air Canada', code: 'AC' },
        { name: 'Cathay Pacific', code: 'CX' },
        { name: 'Japan Airlines', code: 'JL' },
        { name: 'All Nippon Airways', code: 'NH' },
        { name: 'Korean Air', code: 'KE' },
        { name: 'Vietnam Airlines', code: 'VN' },
        { name: 'VietJet Air', code: 'VJ' },
        { name: 'Saudia', code: 'SV' },
        { name: 'Oman Air', code: 'WY' },
        { name: 'Gulf Air', code: 'GF' },
        { name: 'Kuwait Airways', code: 'KU' },
        { name: 'flydubai', code: 'FZ' },
        { name: 'Air Arabia', code: 'G9' },
        { name: 'Turkish Airlines', code: 'TK' },
        { name: 'Qantas', code: 'QF' },
        { name: 'Air New Zealand', code: 'NZ' },
        { name: 'Fiji Airways', code: 'FJ' },
        { name: 'Ethiopian Airlines', code: 'ET' },
        { name: 'Kenya Airways', code: 'KQ' },
        { name: 'EgyptAir', code: 'MS' },
        { name: 'Royal Jordanian', code: 'RJ' },
        { name: 'Middle East Airlines', code: 'ME' },
        { name: 'Finnair', code: 'AY' },
        { name: 'Iberia', code: 'IB' },
        { name: 'ITA Airways', code: 'AZ' },
        { name: 'LOT Polish Airlines', code: 'LO' },
        { name: 'Scandinavian Airlines', code: 'SK' },
        { name: 'TAP Air Portugal', code: 'TP' },
        { name: 'Aer Lingus', code: 'EI' },
        { name: 'Austrian Airlines', code: 'OS' },
        { name: 'Brussels Airlines', code: 'SN' },
        { name: 'Aegean Airlines', code: 'A3' },
        { name: 'El Al Israel Airlines', code: 'LY' },
        { name: 'Philippine Airlines', code: 'PR' },
        { name: 'Garuda Indonesia', code: 'GA' },
        { name: 'China Southern Airlines', code: 'CZ' },
        { name: 'China Eastern Airlines', code: 'MU' },
        { name: 'Air China', code: 'CA' },
        { name: 'EVA Air', code: 'BR' },
        { name: 'China Airlines', code: 'CI' }
    ]}
];

const FixedDepartureManager = () => {
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFlight, setEditingFlight] = useState(null);
    const [formData, setFormData] = useState({
        airlineName: '',
        flightNumber: '',
        fromCity: '',
        toCity: '',
        departureDate: '',
        departureTime: '',
        arrivalTime: '',
        fare: '',
        childFare: '',
        infantFare: '',
        totalSeats: '',
        availableSeats: '',
        status: 'Available',
        isActive: true,
        airlineLogo: null
    });

    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        fetchFlights();
        fetchBookings();
    }, []);

    const fetchFlights = async () => {
        try {
            const res = await adminService.getFixedDepartureFlights();
            if (res.success) {
                setFlights(res.data);
            }
        } catch (error) {
            toast.error('Failed to fetch flights');
        } finally {
            setLoading(false);
        }
    };

    const fetchBookings = async () => {
        try {
            const res = await adminService.getFixedDepartureBookings();
            if (res.success) {
                setBookings(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch bookings', error);
        }
    };

    const handleAirlineChange = (e) => {
        const selectedName = e.target.value;
        let foundCode = '';
        for (const cat of AIRLINES_DATA) {
            const match = cat.list.find(a => a.name === selectedName);
            if (match) {
                foundCode = match.code;
                break;
            }
        }
        setFormData(prev => ({
            ...prev,
            airlineName: selectedName,
            flightNumber: prev.flightNumber ? prev.flightNumber : (foundCode ? `${foundCode}-` : '')
        }));
    };

    const handleOpenModal = (flight = null) => {
        if (flight) {
            setEditingFlight(flight);
            setFormData({
                ...flight,
                departureDate: flight.departureDate ? new Date(flight.departureDate).toISOString().split('T')[0] : '',
                airlineLogo: null
            });
        } else {
            setEditingFlight(null);
            setFormData({
                airlineName: '',
                flightNumber: '',
                fromCity: '',
                toCity: '',
                departureDate: '',
                departureTime: '',
                arrivalTime: '',
                fare: '',
                childFare: '',
                infantFare: '',
                totalSeats: '',
                availableSeats: '',
                status: 'Available',
                isActive: true,
                airlineLogo: null
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== undefined) {
                    submitData.append(key, formData[key]);
                }
            });

            if (editingFlight) {
                await adminService.updateFixedDepartureFlight(editingFlight._id, submitData);
                toast.success('Flight updated successfully');
            } else {
                await adminService.createFixedDepartureFlight(submitData);
                toast.success('Flight created successfully');
            }
            setIsModalOpen(false);
            fetchFlights();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this flight?')) {
            try {
                await adminService.deleteFixedDepartureFlight(id);
                toast.success('Flight deleted');
                fetchFlights();
            } catch (error) {
                toast.error('Delete failed');
            }
        }
    };

    const summary = {
        total: flights.length,
        bookings: bookings.length,
        confirmed: bookings.filter(b => b.status === 'Confirmed').length,
        pending: bookings.filter(b => b.status === 'Pending').length
    };

    if (loading) return <div className="p-8 text-center text-[#1D4171] font-black animate-pulse">Loading...</div>;

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#1D4171] dark:text-white">Admin Panel</h1>
                    <p className="text-[#000000] dark:text-slate-300 font-medium text-xs sm:text-sm">Manually manage flights, fares, and bookings</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="w-full sm:w-auto justify-center bg-[#F07E21] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-[#d96d1a] transition-all touch-target"
                >
                    <FaPlus /> Add New Flight
                </button>
            </div>

            {/* Summary Dashboard Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-[#F07E21]">
                    <h3 className="text-[#000000] text-sm font-bold uppercase tracking-widest mb-2">Total Flights</h3>
                    <p className="text-4xl font-black text-[#1D4171]">{summary.total}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-[#48A0D4]">
                    <h3 className="text-[#000000] text-sm font-bold uppercase tracking-widest mb-2">Total Bookings</h3>
                    <p className="text-4xl font-black text-[#1D4171]">{summary.bookings}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-emerald-500">
                    <h3 className="text-[#000000] text-sm font-bold uppercase tracking-widest mb-2">Confirmed</h3>
                    <p className="text-4xl font-black text-[#1D4171]">{summary.confirmed}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-purple-500">
                    <h3 className="text-[#000000] text-sm font-bold uppercase tracking-widest mb-2">Pending</h3>
                    <p className="text-4xl font-black text-[#1D4171]">{summary.pending}</p>
                </div>
            </div>

            <h2 className="text-xl font-black text-[#1D4171] dark:text-white mb-6 uppercase tracking-widest border-b border-slate-200 pb-4">Flight Inventory</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {flights.map(flight => (
                    <div key={flight._id} className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 hover:shadow-2xl transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl overflow-hidden shadow-inner">
                                    {flight.airlineLogo ? (
                                        <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${flight.airlineLogo}`} alt={flight.airlineName} className="w-full h-full object-contain p-1" />
                                    ) : (
                                        <FaPlane className="text-[#1D4171]" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-[#1D4171]">{flight.flightNumber}</h3>
                                    <p className="text-[#F07E21] font-bold text-xs uppercase">{flight.airlineName}</p>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                flight.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                            }`}>
                                {flight.status}
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-6 bg-slate-50 p-4 rounded-2xl">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From</p>
                                <p className="font-black text-[#1D4171] text-lg">{flight.fromCity}</p>
                                <p className="text-xs font-bold text-slate-500">{flight.departureTime}</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center">
                                <div className="h-[2px] w-full bg-slate-200 relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1">
                                        <FaPlane className="text-slate-300 text-xs" />
                                    </div>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To</p>
                                <p className="font-black text-[#1D4171] text-lg">{flight.toCity}</p>
                                <p className="text-xs font-bold text-slate-500">{flight.arrivalTime}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <FaCalendarAlt className="text-[#48A0D4]" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Date</p>
                                    <p className="font-bold text-sm">{new Date(flight.departureDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FaUsers className="text-[#48A0D4]" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Seats</p>
                                    <p className="font-bold text-sm">{flight.availableSeats} / {flight.totalSeats}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                            <div className="flex gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Adult</p>
                                    <p className="text-xl font-black text-[#1D4171]">₹{flight.fare}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Child</p>
                                    <p className="text-xl font-black text-[#1D4171]">₹{flight.childFare || 0}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Infant</p>
                                    <p className="text-xl font-black text-[#1D4171]">₹{flight.infantFare || 0}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleOpenModal(flight)}
                                    className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                                >
                                    <FaEdit />
                                </button>
                                <button 
                                    onClick={() => handleDelete(flight._id)}
                                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="bg-[#1D4171] p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-black">{editingFlight ? 'Edit Flight' : 'Add New Flight'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[80vh] overflow-y-auto">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Airline Name</label>
                                <select 
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-[#1D4171]"
                                    value={formData.airlineName}
                                    onChange={handleAirlineChange}
                                >
                                    <option value="">Select Airline</option>
                                    {AIRLINES_DATA.map(cat => (
                                        <optgroup key={cat.category} label={cat.category}>
                                            {cat.list.map(a => (
                                                <option key={a.name} value={a.name}>{a.name} ({a.code})</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flight Number</label>
                                <input 
                                    type="text" required
                                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold"
                                    value={formData.flightNumber}
                                    onChange={e => setFormData({...formData, flightNumber: e.target.value})}
                                    placeholder="6E-123"
                                />
                            </div>
                            <div className="col-span-full space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Airline / Flight Logo (Optional)</label>
                                <div className="flex items-center gap-4">
                                    {editingFlight && editingFlight.airlineLogo && !formData.airlineLogo && (
                                        <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${editingFlight.airlineLogo}`} alt="Current Logo" className="w-12 h-12 object-contain bg-white p-1 rounded-xl border border-slate-200 shadow-sm" />
                                    )}
                                    {formData.airlineLogo && (
                                        <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
                                            📁
                                        </div>
                                    )}
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        className="w-full bg-white border border-slate-200 p-2 rounded-xl font-bold text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#1D4171] file:text-white hover:file:bg-[#1D4171]/90 file:cursor-pointer"
                                        onChange={e => setFormData({...formData, airlineLogo: e.target.files[0]})}
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 mt-1">Upload PNG or JPG logo. If left empty, default airline branding will be used.</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From City</label>
                                <input 
                                    type="text" required
                                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold"
                                    value={formData.fromCity}
                                    onChange={e => setFormData({...formData, fromCity: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To City</label>
                                <input 
                                    type="text" required
                                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold"
                                    value={formData.toCity}
                                    onChange={e => setFormData({...formData, toCity: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Departure Date</label>
                                <input 
                                    type="date" required
                                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold"
                                    value={formData.departureDate}
                                    onChange={e => setFormData({...formData, departureDate: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1 flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dep Time</label>
                                    <input 
                                        type="text" required
                                        className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold"
                                        value={formData.departureTime}
                                        onChange={e => setFormData({...formData, departureTime: e.target.value})}
                                        placeholder="10:00 AM"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arr Time</label>
                                    <input 
                                        type="text" required
                                        className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold"
                                        value={formData.arrivalTime}
                                        onChange={e => setFormData({...formData, arrivalTime: e.target.value})}
                                        placeholder="12:00 PM"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1 flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adult Fare</label>
                                    <input 
                                        type="number" required
                                        className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-[#F07E21]"
                                        value={formData.fare}
                                        onChange={e => setFormData({...formData, fare: e.target.value})}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Child Fare</label>
                                    <input 
                                        type="number" required
                                        className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-[#1D4171]"
                                        value={formData.childFare}
                                        onChange={e => setFormData({...formData, childFare: e.target.value})}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Infant Fare</label>
                                    <input 
                                        type="number" required
                                        className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-[#1D4171]"
                                        value={formData.infantFare}
                                        onChange={e => setFormData({...formData, infantFare: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1 flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Seats</label>
                                    <input 
                                        type="number" required
                                        className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold"
                                        value={formData.totalSeats}
                                        onChange={e => setFormData({...formData, totalSeats: e.target.value, availableSeats: e.target.value})}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avail Seats</label>
                                    <input 
                                        type="number" required
                                        className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold"
                                        value={formData.availableSeats}
                                        onChange={e => setFormData({...formData, availableSeats: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="col-span-full pt-4">
                                <button 
                                    type="submit"
                                    className="w-full bg-[#F07E21] text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-[#d96d1a] transition-all flex items-center justify-center gap-2"
                                >
                                    <FaPlus /> {editingFlight ? 'Update Flight Inventory' : 'Save Flight Inventory'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FixedDepartureManager;
