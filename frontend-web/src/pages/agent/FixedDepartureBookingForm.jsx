import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fixedDepartureService } from '../../services/api';
import { toast } from 'react-toastify';
import { FaUser, FaPlus, FaTrash, FaPlaneDeparture, FaWallet, FaCheckCircle, FaArrowLeft, FaShieldAlt, FaIdCard, FaGlobe, FaPlane, FaSuitcase, FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa';

const parseTimeString = (timeStr) => {
    if (!timeStr) return null;
    const cleanStr = timeStr.trim().toLowerCase();
    const isPM = cleanStr.includes('pm');
    const isAM = cleanStr.includes('am');
    
    const match = cleanStr.match(/(\d+):(\d+)/);
    if (!match) return null;
    
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    
    if (isPM && hours < 12) {
        hours += 12;
    } else if (isAM && hours === 12) {
        hours = 0;
    }
    
    return { hours, mins };
};

const calculateDuration = (deptTime, arrTime) => {
    if (!deptTime || !arrTime) return '2h 15m';
    try {
        const dept = parseTimeString(deptTime);
        const arr = parseTimeString(arrTime);
        
        if (!dept || !arr) return '2h 15m';
        
        let deptMinutes = dept.hours * 60 + dept.mins;
        let arrMinutes = arr.hours * 60 + arr.mins;
        
        if (arrMinutes < deptMinutes) {
            arrMinutes += 24 * 60;
        }
        
        const diffMinutes = arrMinutes - deptMinutes;
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        
        return `${hours}h ${mins}m`;
    } catch (e) {
        return '2h 15m';
    }
};

const FixedDepartureBookingForm = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const flight = state?.flight;

    const [step, setStep] = useState(1);
    const [isInternational, setIsInternational] = useState(flight?.isInternational || false);
    const [passengers, setPassengers] = useState([
        { firstName: '', lastName: '', dob: '', age: '', gender: 'Male', mobileNumber: '', email: '', passportNumber: '', passportExpiry: '', nationality: 'IN' }
    ]);
    const [submitting, setSubmitting] = useState(false);

    if (!flight) {
        navigate('/agent/fixed-departure-search');
        return null;
    }

    const handleAddPassenger = () => {
        if (passengers.length >= flight.availableSeats) {
            return toast.warn(`Only ${flight.availableSeats} seats available on this flight.`);
        }
        setPassengers([...passengers, { firstName: '', lastName: '', dob: '', age: '', gender: 'Male', mobileNumber: '', email: '', passportNumber: '', passportExpiry: '', nationality: 'IN' }]);
    };

    const handleRemovePassenger = (index) => {
        const newPassengers = passengers.filter((_, i) => i !== index);
        setPassengers(newPassengers);
    };

    const handleInputChange = (index, field, value) => {
        const newPassengers = [...passengers];
        newPassengers[index][field] = value;
        if (field === 'dob' && value) {
            const birthYear = new Date(value).getFullYear();
            const currentYear = new Date().getFullYear();
            if (birthYear && currentYear >= birthYear) {
                newPassengers[index].age = (currentYear - birthYear).toString();
            }
        }
        setPassengers(newPassengers);
    };

    const validateStep2 = () => {
        for (const p of passengers) {
            if (!p.firstName || !p.lastName || !p.age || !p.mobileNumber || !p.email) {
                toast.error('Please fill in First Name, Last Name, Age, Mobile Number, and Email ID for all travelers.');
                return false;
            }
            if (isInternational) {
                if (!p.passportNumber || !p.passportExpiry || !p.nationality) {
                    toast.error('Please fill in Passport details for all international travelers.');
                    return false;
                }
            }
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep2()) return;

        setSubmitting(true);
        try {
            const res = await fixedDepartureService.bookFlight(flight._id, passengers, isInternational);
            if (res.success) {
                toast.success('Booking request submitted successfully!');
                navigate('/agent/fixed-departure-history');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Booking failed');
        } finally {
            setSubmitting(false);
        }
    };

    const totalFare = flight.fare * passengers.length;

    return (
        <div className="p-3 md:p-5 bg-slate-50 min-h-screen font-sans">
            {/* Top Navigation & Back Button */}
            <div className="max-w-5xl mx-auto mb-3 flex justify-between items-center">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-slate-500 font-black uppercase text-[11px] tracking-widest hover:text-[#1D4171] transition-colors bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-100"
                >
                    <FaArrowLeft /> Exit Checkout
                </button>
                <div className="flex items-center gap-1.5 bg-[#1D4171]/10 text-[#1D4171] px-3.5 py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider">
                    <FaShieldAlt className="text-[#F07E21]" /> Fixed Departure Portal
                </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="max-w-5xl mx-auto mb-4 bg-white p-3 md:p-4 rounded-2xl shadow-md border border-slate-100">
                <div className="grid grid-cols-3 gap-3 relative">
                    {/* Connecting Lines */}
                    <div className="absolute top-1/2 left-[15%] right-[15%] h-1 bg-slate-100 -translate-y-1/2 z-0 hidden md:block" />
                    <div className="absolute top-1/2 left-[15%] right-[15%] h-1 bg-[#1D4171] -translate-y-1/2 z-0 transition-all duration-500 hidden md:block" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }} />

                    {/* Step 1 */}
                    <div className="z-10 flex flex-col md:flex-row items-center gap-2.5 justify-center bg-white py-0.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm transition-all shadow-sm ${step >= 1 ? 'bg-[#1D4171] text-white shadow-[#1D4171]/30' : 'bg-slate-100 text-slate-400'}`}>
                            1
                        </div>
                        <div className="text-center md:text-left">
                            <p className={`text-[11px] font-black uppercase tracking-widest ${step >= 1 ? 'text-[#1D4171]' : 'text-slate-400'}`}>Step 1</p>
                            <p className="text-[11px] font-bold text-slate-600 hidden md:block">Flight Details</p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="z-10 flex flex-col md:flex-row items-center gap-2.5 justify-center bg-white py-0.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm transition-all shadow-sm ${step >= 2 ? 'bg-[#1D4171] text-white shadow-[#1D4171]/30' : 'bg-slate-100 text-slate-400'}`}>
                            2
                        </div>
                        <div className="text-center md:text-left">
                            <p className={`text-[11px] font-black uppercase tracking-widest ${step >= 2 ? 'text-[#1D4171]' : 'text-slate-400'}`}>Step 2</p>
                            <p className="text-[11px] font-bold text-slate-600 hidden md:block">Passenger Details</p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="z-10 flex flex-col md:flex-row items-center gap-2.5 justify-center bg-white py-0.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm transition-all shadow-sm ${step >= 3 ? 'bg-[#1D4171] text-white shadow-[#1D4171]/30' : 'bg-slate-100 text-slate-400'}`}>
                            3
                        </div>
                        <div className="text-center md:text-left">
                            <p className={`text-[11px] font-black uppercase tracking-widest ${step >= 3 ? 'text-[#1D4171]' : 'text-slate-400'}`}>Step 3</p>
                            <p className="text-[11px] font-bold text-slate-600 hidden md:block">Review & Pay</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-5xl mx-auto">
                {/* STEP 1: FLIGHT DETAILS */}
                {step === 1 && (
                    <div className="bg-white rounded-3xl p-5 md:p-6 shadow-xl border border-slate-50 animate-in fade-in duration-300">
                        <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-[#1D4171]">Flight Itinerary & Policy</h2>
                                <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest mt-0.5">Review your selected Fixed Departure schedule and sector rules</p>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-amber-800 font-black text-[11px] uppercase tracking-wider">{flight.availableSeats} Seats Available</span>
                            </div>
                        </div>

                        {/* Sector Type Display (Automatically Detected) */}
                        <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100 flex items-center justify-between gap-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#1D4171] text-white flex items-center justify-center text-lg font-black shadow-sm">
                                    {isInternational ? '🌐' : '🇮🇳'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-sm text-[#1D4171]">
                                            {isInternational ? 'International Flight' : 'Domestic Flight'}
                                        </p>
                                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">Auto-Detected</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                                        {isInternational ? 'Passport & Visa details required for booking manifest' : 'Valid Govt. ID required for check-in verification'}
                                    </p>
                                </div>
                            </div>
                            <div className="hidden sm:block text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Route Designation</p>
                                <p className="font-black text-xs text-[#1D4171]">{flight.fromCity} → {flight.toCity}</p>
                            </div>
                        </div>

                        {/* Itinerary Display */}
                        <div className="bg-[#1D4171] text-white rounded-2xl p-5 md:p-6 shadow-md mb-4 relative overflow-hidden">
                            <div className="absolute -right-8 -bottom-8 opacity-10 text-white font-black text-7xl select-none pointer-events-none">
                                <FaPlane />
                            </div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-3 mb-4 gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center text-lg font-black text-[#F07E21]">
                                        ✈️
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black">{flight.airlineName}</h4>
                                        <p className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-0.5">Flight No: {flight.flightNumber}</p>
                                    </div>
                                </div>
                                <div className="bg-[#F07E21] text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm">
                                    {isInternational ? 'International Sector' : 'Domestic Sector'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <div>
                                    <p className="text-white/60 font-bold text-[10px] uppercase tracking-widest mb-0.5">Departure</p>
                                    <p className="text-xl font-black mb-0.5">{flight.fromCity}</p>
                                    <p className="text-[#F07E21] font-black text-sm">{flight.departureTime}</p>
                                    <p className="text-white/60 text-[10px] font-bold mt-0.5">{new Date(flight.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div className="flex flex-col items-center justify-center px-4 py-3 md:py-0">
                                    <p className="text-white font-bold text-[10px] mb-1.5 tracking-wider">
                                        {calculateDuration(flight.departureTime, flight.arrivalTime)}
                                    </p>
                                    <div className="w-full flex items-center gap-2">
                                        <div className="h-[2px] bg-white/20 flex-1 relative" />
                                        <FaPlaneDeparture className="text-[#F07E21] text-lg animate-bounce" />
                                        <div className="h-[2px] bg-white/20 flex-1 relative" />
                                    </div>
                                    <p className="text-white/60 text-[8px] font-black uppercase tracking-widest mt-2">Direct Fixed Departure</p>
                                </div>
                                <div className="md:text-right">
                                    <p className="text-white/60 font-bold text-[10px] uppercase tracking-widest mb-0.5">Arrival</p>
                                    <p className="text-xl font-black mb-0.5">{flight.toCity}</p>
                                    <p className="text-[#F07E21] font-black text-sm">{flight.arrivalTime}</p>
                                    <p className="text-white/60 text-[10px] font-bold mt-0.5">{new Date(flight.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        {/* Rules & Policy Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 items-start">
                                <div className="w-8 h-8 bg-[#1D4171]/10 text-[#1D4171] rounded-lg flex items-center justify-center text-base shrink-0 font-black">
                                    <FaSuitcase />
                                </div>
                                <div>
                                    <h4 className="font-black text-[#1D4171] text-sm mb-1">Baggage Allowance</h4>
                                    <p className="text-slate-600 text-[11px] leading-relaxed mb-2">
                                        Enjoy complimentary standard baggage limits pre-included with your fixed departure booking.
                                    </p>
                                    <ul className="text-[10px] font-bold text-slate-500 space-y-0.5">
                                        <li>• Cabin Baggage: <strong className="text-slate-700">7 KG per passenger</strong></li>
                                        <li>• Check-in Baggage: <strong className="text-slate-700">{isInternational ? '20 KG (International)' : '15 KG (Domestic)'}</strong></li>
                                    </ul>
                                </div>
                            </div>
                            <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 flex gap-3 items-start">
                                <div className="w-8 h-8 bg-[#F07E21]/10 text-[#F07E21] rounded-lg flex items-center justify-center text-base shrink-0 font-black">
                                    <FaExclamationTriangle />
                                </div>
                                <div>
                                    <h4 className="font-black text-[#F07E21] text-sm mb-1">Cancellation & Fare Rules</h4>
                                    <p className="text-slate-600 text-[11px] leading-relaxed mb-2">
                                        Special group fare rules apply to all fixed departure inventory.
                                    </p>
                                    <ul className="text-[10px] font-bold text-slate-500 space-y-0.5">
                                        <li>• Cancellation: <strong className="text-red-600 font-black">100% Non-Refundable</strong></li>
                                        <li>• Date Change: <strong className="text-slate-700">Not Permitted</strong></li>
                                        <li>• GST Status: <strong className="text-emerald-600 font-black">Excluded / Pre-Settled in Group Fare</strong></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100">
                            <div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Fixed Departure Price Per Seat</p>
                                <p className="text-xl font-black text-[#1D4171]">₹{flight.fare} <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">(No GST Applicable)</span></p>
                            </div>
                            <div className="flex flex-col md:flex-row items-center gap-2.5 w-full md:w-auto">
                                <button 
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="w-full md:w-auto bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-black text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm border border-slate-200"
                                >
                                    <FaArrowLeft /> BACK TO SEARCH RESULTS
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="w-full md:w-auto bg-[#1D4171] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-[#F07E21] transition-all shadow-md shadow-[#1D4171]/20 flex items-center justify-center gap-2"
                                >
                                    CONTINUE TO PASSENGER DETAILS <FaArrowLeft className="rotate-180" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: PASSENGER DETAILS */}
                {step === 2 && (
                    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-2xl border border-slate-50 animate-in fade-in duration-300">
                        <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-[#1D4171]">Passenger Information</h2>
                                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">
                                    {isInternational ? 'International booking: Passport details are mandatory for all travelers' : 'Domestic booking: Enter names as per valid government ID'}
                                </p>
                            </div>
                            <button 
                                type="button"
                                onClick={handleAddPassenger}
                                className="bg-[#48A0D4]/10 text-[#48A0D4] px-5 py-3 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-[#48A0D4] hover:text-white transition-all shadow-sm border border-[#48A0D4]/20"
                            >
                                <FaPlus /> ADD TRAVELER
                            </button>
                        </div>

                        <div className="space-y-6 mb-8">
                            {passengers.map((p, index) => (
                                <div key={index} className="p-6 bg-slate-50/70 rounded-[2rem] border border-slate-100 relative group animate-in slide-in-from-right duration-300 shadow-sm">
                                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#1D4171] text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg shadow-[#1D4171]/30">
                                        {index + 1}
                                    </div>
                                    
                                    {passengers.length > 1 && (
                                        <button 
                                            type="button"
                                            onClick={() => handleRemovePassenger(index)}
                                            className="absolute top-4 right-4 text-red-400 hover:text-red-600 bg-white p-2.5 rounded-lg shadow-sm border border-slate-100 transition-all hover:scale-105"
                                            title="Remove Traveler"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    )}

                                    {/* Core Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pt-1">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name</label>
                                            <div className="relative">
                                                <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                                <input 
                                                    type="text" required
                                                    className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 ring-[#48A0D4] outline-none shadow-sm transition-all"
                                                    placeholder="e.g. John"
                                                    value={p.firstName}
                                                    onChange={e => handleInputChange(index, 'firstName', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name</label>
                                            <div className="relative">
                                                <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                                <input 
                                                    type="text" required
                                                    className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 ring-[#48A0D4] outline-none shadow-sm transition-all"
                                                    placeholder="e.g. Doe"
                                                    value={p.lastName}
                                                    onChange={e => handleInputChange(index, 'lastName', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth (Optional)</label>
                                            <div className="relative">
                                                <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#48A0D4] text-xs pointer-events-none" />
                                                <input 
                                                    type="date"
                                                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                                    className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 ring-[#48A0D4] outline-none shadow-sm transition-all cursor-pointer"
                                                    value={p.dob}
                                                    onChange={e => handleInputChange(index, 'dob', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Age</label>
                                            <input 
                                                type="number" required min="1" max="120"
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 ring-[#48A0D4] outline-none shadow-sm transition-all"
                                                placeholder="e.g. 28"
                                                value={p.age}
                                                onChange={e => handleInputChange(index, 'age', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
                                            <select 
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 ring-[#48A0D4] outline-none shadow-sm transition-all"
                                                value={p.gender}
                                                onChange={e => handleInputChange(index, 'gender', e.target.value)}
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile No (Required)</label>
                                            <input 
                                                type="tel" required
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 ring-[#48A0D4] outline-none shadow-sm transition-all"
                                                placeholder="e.g. 9876543210"
                                                value={p.mobileNumber}
                                                onChange={e => handleInputChange(index, 'mobileNumber', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email ID (Required)</label>
                                            <input 
                                                type="email" required
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 ring-[#48A0D4] outline-none shadow-sm transition-all"
                                                placeholder="e.g. traveler@example.com"
                                                value={p.email}
                                                onChange={e => handleInputChange(index, 'email', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* International Passport Fields */}
                                    {isInternational && (
                                        <div className="pt-4 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300 bg-blue-50/40 p-5 rounded-2xl border border-blue-100">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-[#1D4171] uppercase tracking-widest flex items-center gap-1.5">
                                                    <FaIdCard className="text-[#F07E21]" /> Passport Number
                                                </label>
                                                <input 
                                                    type="text" required={isInternational}
                                                    className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 ring-[#1D4171] outline-none shadow-sm transition-all uppercase"
                                                    placeholder="A1234567"
                                                    value={p.passportNumber}
                                                    onChange={e => handleInputChange(index, 'passportNumber', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-[#1D4171] uppercase tracking-widest flex items-center gap-1.5">
                                                    <FaIdCard className="text-[#F07E21]" /> Passport Expiry Date
                                                </label>
                                                <div className="relative">
                                                    <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1D4171] text-xs pointer-events-none" />
                                                    <input 
                                                        type="date" required={isInternational}
                                                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                                        className="w-full pl-9 pr-4 py-3 bg-white border border-blue-200 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 ring-[#1D4171] outline-none shadow-sm transition-all cursor-pointer"
                                                        value={p.passportExpiry}
                                                        onChange={e => handleInputChange(index, 'passportExpiry', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-[#1D4171] uppercase tracking-widest flex items-center gap-1.5">
                                                    <FaGlobe className="text-[#F07E21]" /> Nationality
                                                </label>
                                                <input 
                                                    type="text" required={isInternational}
                                                    className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 ring-[#1D4171] outline-none shadow-sm transition-all uppercase"
                                                    placeholder="IN"
                                                    value={p.nationality}
                                                    onChange={e => handleInputChange(index, 'nationality', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Bottom Navigation */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100">
                            <button 
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full md:w-auto bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black text-base hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm border border-slate-200"
                            >
                                <FaArrowLeft /> BACK TO FLIGHT DETAILS
                            </button>
                            <button 
                                type="button"
                                onClick={() => {
                                    if (validateStep2()) setStep(3);
                                }}
                                className="w-full md:w-auto bg-[#1D4171] text-white px-8 py-4 rounded-2xl font-black text-base hover:bg-[#F07E21] transition-all shadow-md shadow-[#1D4171]/20 flex items-center justify-center gap-2"
                            >
                                CONTINUE TO REVIEW & PAYMENT <FaArrowLeft className="rotate-180" />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: REVIEW & PAYMENT */}
                {step === 3 && (
                    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-2xl border border-slate-50 animate-in fade-in duration-300">
                        <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-[#1D4171]">Review & Confirm Booking</h2>
                                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">Final verification of flight itinerary, passenger manifest, and wallet deduction</p>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl flex items-center gap-2">
                                <FaCheckCircle className="text-emerald-500 text-base" />
                                <span className="text-emerald-800 font-black text-xs uppercase tracking-wider">Ready for Wallet Settlement</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                            {/* Left Col: Flight & Passenger Summary (2 Cols) */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Flight Summary */}
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200/80 shadow-sm">
                                    <h3 className="text-lg font-black text-[#1D4171] mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
                                        <FaPlaneDeparture className="text-[#F07E21]" /> Flight Summary {isInternational ? '(International)' : '(Domestic)'}
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Airline</p>
                                            <p className="font-black text-base text-slate-800">{flight.airlineName}</p>
                                            <p className="text-[11px] font-bold text-slate-500">{flight.flightNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Departure</p>
                                            <p className="font-black text-base text-slate-800">{flight.fromCity}</p>
                                            <p className="text-[11px] font-bold text-[#F07E21]">{flight.departureTime}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Arrival</p>
                                            <p className="font-black text-base text-slate-800">{flight.toCity}</p>
                                            <p className="text-[11px] font-bold text-[#F07E21]">{flight.arrivalTime}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Travel Date</p>
                                            <p className="font-black text-xs text-slate-800">{new Date(flight.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Passenger Manifest */}
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200/80 shadow-sm">
                                    <h3 className="text-lg font-black text-[#1D4171] mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
                                        <FaUser className="text-[#F07E21]" /> Passenger Manifest ({passengers.length} Travelers)
                                    </h3>
                                    <div className="space-y-3">
                                        {passengers.map((p, index) => (
                                            <div key={index} className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 bg-[#1D4171] text-white rounded-lg flex items-center justify-center font-black text-xs">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 text-sm">{p.firstName} {p.lastName}</p>
                                                        <p className="text-[11px] font-bold text-slate-400">{p.gender} • DOB: {p.dob} ({p.age} yrs)</p>
                                                    </div>
                                                </div>
                                                {isInternational && (
                                                    <div className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                                        <div>
                                                            <p className="text-[8px] font-black text-[#1D4171] uppercase tracking-widest">Passport No</p>
                                                            <p className="font-bold text-[11px] text-slate-800 uppercase">{p.passportNumber}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[8px] font-black text-[#1D4171] uppercase tracking-widest">Expiry</p>
                                                            <p className="font-bold text-[11px] text-slate-800">{p.passportExpiry}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Payment Breakdown & Wallet Settlement */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-[2rem] p-6 border-2 border-[#1D4171] shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-[#1D4171] text-white px-4 py-1.5 rounded-bl-xl font-black text-[9px] uppercase tracking-widest shadow-md">
                                        Instant Issue
                                    </div>
                                    <h3 className="text-xl font-black text-[#1D4171] mb-6 pb-3 border-b border-slate-100">Payment Breakdown</h3>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between items-center text-slate-600 font-bold text-xs">
                                            <span>Base Fare per seat</span>
                                            <span className="font-black text-slate-800 text-sm">₹{flight.fare}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-600 font-bold text-xs">
                                            <span>Number of Travelers</span>
                                            <span className="font-black text-slate-800 text-sm">x{passengers.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-600 font-bold text-xs">
                                            <span>GST & Taxes</span>
                                            <span className="font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider">Not Applicable / Excluded</span>
                                        </div>
                                        <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
                                            <div>
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Net Payable</p>
                                                <p className="text-3xl font-black text-[#1D4171]">₹{totalFare}</p>
                                            </div>
                                            <div className="bg-orange-50 p-3.5 rounded-xl text-[#F07E21] border border-orange-100 shadow-inner">
                                                <FaWallet size={24} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Wallet Warning / Info */}
                                    <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 mb-6 flex items-start gap-2.5">
                                        <FaShieldAlt className="text-[#1D4171] text-lg shrink-0 mt-0.5" />
                                        <p className="text-[11px] font-bold text-[#1D4171] leading-relaxed">
                                            By clicking confirm, ₹{totalFare} will be securely held/deducted from your B2B wallet balance to process this fixed departure booking.
                                        </p>
                                    </div>

                                    <button 
                                        type="button"
                                        disabled={submitting}
                                        onClick={handleSubmit}
                                        className="w-full bg-[#1D4171] text-white py-5 rounded-2xl font-black text-lg hover:bg-[#F07E21] transition-all shadow-xl shadow-[#1D4171]/30 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {submitting ? 'PROCESSING BOOKING...' : <>CONFIRM & PAY FROM WALLET <FaCheckCircle /></>}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Navigation */}
                        <div className="flex justify-start pt-6 border-t border-slate-100">
                            <button 
                                type="button"
                                disabled={submitting}
                                onClick={() => setStep(2)}
                                className="w-full md:w-auto bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black text-base hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm border border-slate-200 disabled:opacity-50"
                            >
                                <FaArrowLeft /> BACK TO PASSENGER DETAILS
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FixedDepartureBookingForm;
