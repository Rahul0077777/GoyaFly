import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { walletService, bookingService } from '../../services/api';
import { getValidationError } from '../../utils/validation';
import { FaCalendarAlt } from 'react-icons/fa';

const CheckoutInternational = ({ bookingData }) => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [paying, setPaying] = useState(false);
    const [balance, setBalance] = useState(0);
    const [loadingBalance, setLoadingBalance] = useState(true);
    
    const passengerCount = (bookingData?.passengers) || 1;
    const netPricePerPax = bookingData?.details?.netfare || bookingData?.baseFare || 6918;
    const totalNetPrice = netPricePerPax * passengerCount;
    const requiredBalance = totalNetPrice;

    const [passengersList, setPassengersList] = useState(
        Array.from({ length: passengerCount }, () => ({
            title: 'Mr', firstName: '', lastName: '', dob: '',
            nationality: 'IN', passportNumber: '', passportExpiry: '', frequentFlyer: ''
        }))
    );
    
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showItineraryMobile, setShowItineraryMobile] = useState(false);

    const validationFlags = bookingData?.details?.validationFlags || {};
    const [gst, setGst] = useState({ number: '', email: '', mobile: '', address: '', company: '' });
    const [firstPaxPan, setFirstPaxPan] = useState('');

    // SSR / Add-on state
    const [seatMap, setSeatMap] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState({});
    const [selectedMeals, setSelectedMeals] = useState({});
    const [loadingSSR, setLoadingSSR] = useState(false);

    const handlePassengerChange = (index, field, value) => {
        const updated = [...passengersList];
        updated[index][field] = value;
        setPassengersList(updated);
    };

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const res = await walletService.getBalance();
                if (res.success) setBalance(res.balance);
            } catch (err) { } finally { setLoadingBalance(false); }
        };
        fetchBalance();
    }, []);

    const validateInputs = () => {
        // Passenger Details
        for (let i = 0; i < passengersList.length; i++) {
            const p = passengersList[i];
            if (!p.firstName || !p.lastName || !p.dob || !p.passportNumber) {
                toast.warn(`Please complete mandatory document details for Traveller ${i + 1}.`); return false;
            }
        }
        // Contact Details
        const emailErr = getValidationError('contactEmail', email);
        const mobileErr = getValidationError('contactMobile', mobile);
        if (emailErr) { toast.warn(emailErr); return false; }
        if (mobileErr) { toast.warn(mobileErr); return false; }

        // GST
        if (gst.number) {
            const gstErr = getValidationError('gstNumber', gst.number);
            if (gstErr) { toast.warn(gstErr); return false; }
        }

        // PAN
        if (firstPaxPan || validationFlags.pan_mandatory === 1) {
            const panErr = getValidationError('pax_pan', firstPaxPan);
            if (panErr) { toast.warn(panErr); return false; }
        }

        return true;
    };

    const handleProceedToAddons = async () => {
        if (!validateInputs()) return;

        setCurrentStep(2);
        setLoadingSSR(true);
        try {
            const pExample = passengersList.map(px => ({
                title: px.title, fName: px.firstName, lName: px.lastName, pType: 'A'
            }));
            const res = await bookingService.ftdGetSeats(
                bookingData.details.flightID || bookingData.details.FlightID || bookingData.details.Fare?.flightID || bookingData.details.Flights?.Onward?.[0]?.flightID,
                bookingData.details.refID,
                pExample
            );
            if (res.success) setSeatMap(res.data);
        } catch (err) { } finally { setLoadingSSR(false); }
    };

    const handleFinalize = async () => {
        if (!validateInputs()) return;
        if (!agreedToTerms) {
            toast.warn('Please agree to terms & confirm document accuracy.'); return;
        }
        if (balance < requiredBalance) {
            toast.error(`Insufficient Wallet Balance.`); return;
        }

        setPaying(true);
        try {
            const formatDate = (dateStr) => {
                if (!dateStr || !dateStr.includes('-')) return dateStr;
                const [y, m, d] = dateStr.split('-');
                return `${d}-${m}-${y}`;
            };

            const passengerData = passengersList.map((p, idx) => {
                const pax = {
                    title: p.title,
                    fName: p.firstName.toUpperCase().trim(),
                    lName: p.lastName.toUpperCase().trim(),
                    pType: 'A',
                    gender: p.title === 'Mr' ? 'M' : 'F',
                    dob: formatDate(p.dob),
                    ppNo: p.passportNumber,
                    ppExp: p.passportExpiry ? formatDate(p.passportExpiry) : '',
                    ppNat: p.nationality || 'IN'
                };

                // Add SSR only if selected
                const onwardSSR = {};
                if (selectedSeats[idx]) onwardSSR.Seat = [selectedSeats[idx]];
                if (selectedMeals[idx]) onwardSSR.Meal = [selectedMeals[idx]];

                if (Object.keys(onwardSSR).length > 0) {
                    pax.ssrInfo = {
                        Onward: onwardSSR
                    };
                }
                return pax;
            });

            const bookingRes = await bookingService.ftdBookFlight({ 
                passenger: passengerData,
                refID: bookingData.details.refID,
                flightID: bookingData.details.flightID || bookingData.details.FlightID || bookingData.details.Fare?.flightID || bookingData.details.Flights?.Onward?.[0]?.flightID || bookingData.details.Flights?.Onward?.["0"]?.flightID,
                mobile: mobile,
                email: email,
                isInternational: true,
                gst: validationFlags.gstInd === 1 ? gst : undefined,
                first_pax_pan_no: firstPaxPan,
                netfare: netPricePerPax,
                validationFlags: validationFlags
            });

            if (bookingRes.success) {
                navigate('/agent/history', { 
                    state: { 
                        success: true, 
                        message: `International Booking Confirmed! PNR: ${bookingRes.pnr || bookingRes.booking?.pnr || 'Requested'}`,
                        txnId: bookingRes.booking?._id
                    } 
                });
            } else {
                toast.error(bookingRes.message || 'Booking failed.');
                setPaying(false);
            }
        } catch (err) {
            toast.error('Booking failed: ' + (err.response?.data?.message || 'Contact Support'));
            setPaying(false);
        }
    };

    const StepIndicator = () => (
        <div className="flex items-center gap-2 sm:gap-4 bg-slate-900/40 p-1.5 sm:p-2 rounded-2xl border border-white/5 backdrop-blur-md overflow-x-auto no-scrollbar">
            {[
                { n: 1, text: 'Documents' },
                { n: 2, text: 'Add-ons' },
                { n: 3, text: 'Payment' }
            ].map((s, idx) => (
                <React.Fragment key={idx}>
                    <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-xl transition-all duration-500 whitespace-nowrap ${currentStep === s.n ? 'bg-[#48A0D4] shadow-lg shadow-[#48A0D4]/30' : 'bg-transparent'}`}>
                        <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${currentStep >= s.n ? 'bg-white text-[#1D4171]' : 'bg-slate-700 text-slate-400'}`}>
                            {currentStep > s.n ? '✓' : s.n}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:inline ${currentStep >= s.n ? 'text-white' : 'text-slate-500'}`}>{s.text}</span>
                    </div>
                    {idx < 2 && <div className={`w-4 sm:w-10 h-[2px] rounded-full transition-all duration-500 shrink-0 ${currentStep > s.n ? 'bg-[#48A0D4]' : 'bg-slate-700'}`}></div>}
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <div className="flex-1 bg-[#f8fafc] min-h-screen">
            {/* Header */}
            <div className="bg-[#1D4171] pt-10 sm:pt-12 pb-32 sm:pb-40 px-4 sm:px-8 relative overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-[#48A0D4]/20 text-[#48A0D4] text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-[#48A0D4]/30">International GDS</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                            <span className="text-slate-200 text-[10px] font-bold uppercase tracking-widest">{bookingData?.from} ➔ {bookingData?.to}</span>
                        </div>
                        <h1 className="text-white text-3xl sm:text-5xl font-black tracking-tighter mb-2 sm:mb-4">Finalize Booking</h1>
                        <p className="text-slate-500 text-xs sm:text-sm font-medium max-w-sm leading-relaxed uppercase tracking-tight">Ensure all passport details exactly match travel documents.</p>
                    </div>
                    <StepIndicator />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-16 sm:-mt-24 relative z-20 pb-20">
                <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
                    {/* Main Content */}
                    <div className="w-full lg:w-[65%] space-y-6 sm:space-y-8">
                        {currentStep === 1 && (
                            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Contact Details */}
                                <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100">
                                    <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest mb-6 sm:mb-8 border-l-4 border-purple-600 pl-4">Booking Communication</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Mobile Number</label>
                                            <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Phone" className="w-full border-2 border-slate-50 rounded-2xl px-4 sm:px-6 h-[48px] sm:h-[56px] text-sm font-bold text-slate-800 focus:border-purple-500 transition-all outline-none bg-slate-50/50" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Email Address</label>
                                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full border-2 border-slate-50 rounded-2xl px-4 sm:px-6 h-[48px] sm:h-[56px] text-sm font-bold text-slate-800 focus:border-purple-500 transition-all outline-none bg-slate-50/50" />
                                        </div>
                                    </div>
                                </div>

                                {/* GST Details Section */}
                                <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100">
                                    <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest mb-6 sm:mb-8 border-l-4 border-emerald-500 pl-4 flex items-center justify-between">
                                        <span>GST Details</span>
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">GST Number</label>
                                            <input value={gst.number} onChange={e => setGst({...gst, number: e.target.value.toUpperCase()})} placeholder="GSTIN" className="w-full border-2 border-slate-50 rounded-2xl px-4 sm:px-6 h-[48px] sm:h-[56px] text-sm font-bold text-slate-800 focus:border-emerald-500 transition-all outline-none bg-slate-50/50" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Company Name</label>
                                            <input value={gst.company} onChange={e => setGst({...gst, company: e.target.value})} placeholder="Company Name" className="w-full border-2 border-slate-50 rounded-2xl px-4 sm:px-6 h-[48px] sm:h-[56px] text-sm font-bold text-slate-800 focus:border-emerald-500 transition-all outline-none bg-slate-50/50" />
                                        </div>
                                    </div>

                                    {gst.number && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">GST Email</label>
                                                <input value={gst.email} onChange={e => setGst({...gst, email: e.target.value})} placeholder="Email" className="w-full border-2 border-slate-50 rounded-xl px-4 h-[48px] text-sm font-bold text-slate-800 bg-slate-50/50 outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">GST Mobile</label>
                                                <input value={gst.mobile} onChange={e => setGst({...gst, mobile: e.target.value})} placeholder="Mobile" className="w-full border-2 border-slate-50 rounded-xl px-4 h-[48px] text-sm font-bold text-slate-800 bg-slate-50/50 outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">GST Address</label>
                                                <input value={gst.address} onChange={e => setGst({...gst, address: e.target.value})} placeholder="Address" className="w-full border-2 border-slate-50 rounded-xl px-4 h-[48px] text-sm font-bold text-slate-800 bg-slate-50/50 outline-none" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {passengersList.map((p, idx) => (
                                    <div key={idx} className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100">
                                        <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest mb-6 sm:mb-8 flex items-center gap-3">
                                            <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#48A0D4] text-white flex items-center justify-center text-[10px] sm:text-xs">{idx + 1}</span>
                                            Traveller {idx === 0 ? '(Adult - Lead)' : ''}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 sm:mb-10">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Title</label>
                                                <select value={p.title} onChange={e => handlePassengerChange(idx, 'title', e.target.value)} className="w-full border-2 border-slate-50 rounded-2xl px-4 h-[48px] sm:h-[56px] text-sm font-bold text-slate-800 bg-slate-50/50 outline-none">
                                                    <option>Mr</option><option>Ms</option><option>Mrs</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">First Name</label>
                                                <input value={p.firstName} onChange={e => handlePassengerChange(idx, 'firstName', e.target.value)} placeholder="Given Name" className="w-full border-2 border-slate-50 rounded-2xl px-4 sm:px-6 h-[48px] sm:h-[56px] text-sm font-bold text-slate-800 outline-none uppercase bg-slate-50/50" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Last Name</label>
                                                <input value={p.lastName} onChange={e => handlePassengerChange(idx, 'lastName', e.target.value)} placeholder="Surname" className="w-full border-2 border-slate-50 rounded-2xl px-4 sm:px-6 h-[48px] sm:h-[56px] text-sm font-bold text-slate-800 outline-none uppercase bg-slate-50/50" />
                                            </div>
                                        </div>

                                        {/* Mandatory PAN for Lead Passenger */}
                                        {idx === 0 && (validationFlags.pan_mandatory === 1 || validationFlags.isPanMandatory === 1) && (
                                            <div className="mb-8 sm:mb-10 animate-in slide-in-from-top-4 duration-500">
                                                <div className="bg-amber-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-amber-100">
                                                    <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3 block">PAN Number (GDS Mandatory) *</label>
                                                    <input value={firstPaxPan} onChange={e => setFirstPaxPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" className="w-full md:w-1/2 border-2 border-amber-200 rounded-2xl px-4 sm:px-6 h-[48px] sm:h-[56px] text-sm font-bold text-slate-800 outline-none uppercase bg-white" />
                                                    <p className="text-[10px] text-amber-600 font-bold mt-3 uppercase tracking-tight">Lead passenger PAN is required by the airline to process this international fare.</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="bg-slate-50/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-100 space-y-6 sm:space-y-8">
                                            <h4 className="text-[10px] font-black text-[#1D4171] uppercase tracking-widest flex items-center gap-2"> Passport & Identity Documents 🛂</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Date of Birth</label>
                                                    <div className="relative">
                                                        <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-[#48A0D4] pointer-events-none" />
                                                        <input type="date" value={p.dob} onChange={e => handlePassengerChange(idx, 'dob', e.target.value)} onClick={(e) => e.target.showPicker && e.target.showPicker()} className="w-full pl-11 pr-3 border-2 border-slate-100 rounded-xl h-[48px] text-xs font-bold text-slate-800 outline-none cursor-pointer bg-white" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Passport Number</label>
                                                    <input value={p.passportNumber} onChange={e => handlePassengerChange(idx, 'passportNumber', e.target.value.toUpperCase())} placeholder="L1234567" className="w-full border-2 border-slate-100 rounded-xl px-4 h-[48px] text-sm font-bold text-slate-800 outline-none uppercase bg-white" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Passport Expiry Date</label>
                                                    <div className="relative">
                                                        <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1D4171] pointer-events-none" />
                                                        <input type="date" value={p.passportExpiry} onChange={e => handlePassengerChange(idx, 'passportExpiry', e.target.value)} onClick={(e) => e.target.showPicker && e.target.showPicker()} className="w-full pl-11 pr-3 border-2 border-slate-100 rounded-xl h-[48px] text-xs font-bold text-slate-800 outline-none cursor-pointer bg-white" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Nationality</label>
                                                    <select value={p.nationality} onChange={e => handlePassengerChange(idx, 'nationality', e.target.value)} className="w-full border-2 border-slate-100 rounded-xl px-4 h-[48px] text-sm font-bold text-slate-800 outline-none bg-white">
                                                        <option value="IN">INDIA (IN)</option><option value="US">USA (US)</option><option value="AE">UAE (AE)</option>
                                                    </select>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button onClick={handleProceedToAddons} className="w-full bg-[#1D4171] hover:bg-[#15305B] text-white font-black py-4 sm:py-5 rounded-2xl uppercase tracking-widest text-[11px] sm:text-[13px] transition-all shadow-xl shadow-[#1D4171]/20 mt-8">
                                    Select Add-ons →
                                </button>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100">
                                    <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest mb-6 sm:mb-8 border-l-4 border-[#48A0D4] pl-4">Preferred Add-ons (SSR)</h3>
                                    {loadingSSR ? (
                                        <div className="py-20 flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-[#48A0D4] border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching Seat Map...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8 sm:space-y-12">
                                            {passengersList.map((p, idx) => (
                                                <div key={idx} className="bg-slate-50/50 rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-slate-100">
                                                    <h4 className="text-xs font-black text-slate-800 uppercase mb-6 sm:mb-8 flex items-center gap-3">
                                                        <span className="text-[#48A0D4]">👤</span> {p.firstName} {p.lastName}
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                                                        <div>
                                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Select Seat</h4>
                                                            <div className="grid grid-cols-4 gap-2">
                                                                {(seatMap?.seats || ['14A', '14B', '14C', '14D', '14E', '14F', '15A', '15B']).map(sc => (
                                                                    <button key={sc} type="button" onClick={() => setSelectedSeats({...selectedSeats, [idx]: sc})} className={`py-3 sm:py-4 rounded-xl text-[10px] font-black transition-all border-2 ${selectedSeats[idx] === sc ? 'bg-[#48A0D4] text-white border-[#48A0D4] shadow-lg shadow-[#48A0D4]/20' : 'bg-white text-slate-500 border-slate-100 hover:border-[#48A0D4]'}`}>{sc}</button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Meal Preference</h4>
                                                            <select value={selectedMeals[idx] || ''} onChange={e => setSelectedMeals({...selectedMeals, [idx]: e.target.value})} className="w-full border-2 border-slate-100 rounded-2xl px-4 sm:px-6 h-[48px] sm:h-[56px] text-sm font-bold text-slate-800 outline-none bg-white">
                                                                <option value="">Default Meal</option>
                                                                <option value="VGML">Vegetarian Meal (VGML)</option>
                                                                <option value="HNML">Hindu Meal (HNML)</option>
                                                                <option value="KSML">Kosher Meal (KSML)</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 sm:gap-4 mt-8">
                                    <button onClick={() => setCurrentStep(1)} className="flex-1 sm:w-[120px] sm:flex-none bg-slate-100 text-slate-500 font-black py-4 sm:py-5 rounded-2xl uppercase tracking-widest text-[11px]">Back</button>
                                    <button onClick={() => setCurrentStep(3)} className="flex-[2] bg-[#1D4171] hover:bg-[#15305B] text-white font-black py-4 sm:py-5 rounded-2xl uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-[#1D4171]/20">Review →</button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 text-center py-20">
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">Review & Confirm</h3>
                                    <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto mb-10 leading-relaxed uppercase tracking-tight">Please double-check passenger documents before payment.</p>
                                    <div className="flex items-center justify-center gap-4">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="w-5 h-5 rounded" />
                                            <span className="text-sm font-bold text-slate-600">I confirm document accuracy</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-3 sm:gap-4 mt-8">
                                    <button onClick={() => setCurrentStep(2)} className="flex-1 sm:w-[120px] sm:flex-none bg-slate-100 text-slate-500 font-black py-4 sm:py-5 rounded-2xl uppercase tracking-widest text-[11px]">Back</button>
                                    {balance < requiredBalance ? (
                                        <button 
                                            onClick={() => navigate('/agent/wallet')}
                                            className="flex-[2] bg-amber-500 text-white font-black py-4 sm:py-5 rounded-2xl uppercase tracking-widest text-[11px] shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            ⚠️ RECHARGE
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleFinalize} 
                                            disabled={paying || !agreedToTerms} 
                                            className={`flex-[2] font-black py-4 sm:py-5 rounded-2xl uppercase tracking-widest text-[11px] transition-all shadow-xl ${paying || !agreedToTerms ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-[#F07E21] text-white hover:bg-[#d66e1b] shadow-[#F07E21]/20'}`}
                                        >
                                            {paying ? 'Issuing...' : 'Issue Ticket ✈️'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SIDEBAR */}
                    <div className="w-full lg:w-[35%] lg:sticky top-8 space-y-6 lg:order-last">
                        
                        {/* Mobile Toggle Header */}
                        <div className="lg:hidden bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-5 flex items-center justify-between cursor-pointer" onClick={() => setShowItineraryMobile(!showItineraryMobile)}>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Flight Summary</span>
                                <h3 className="text-sm font-bold text-slate-800">{bookingData?.from} ➔ {bookingData?.to}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-black text-[#F07E21]">₹{requiredBalance.toLocaleString()}</span>
                                <span className="text-slate-400 text-xs">{showItineraryMobile ? '▲' : '▼'}</span>
                            </div>
                        </div>

                        {/* Full Sidebar Content */}
                        <div className={`bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden ${showItineraryMobile ? 'block' : 'hidden lg:block'}`}>
                            <div className="bg-[#1D4171] p-6 sm:p-8 text-white">
                                <span className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em] mb-2 block">Flight Summary</span>
                                <h3 className="text-2xl font-black tracking-tighter">{bookingData?.from} ➔ {bookingData?.to}</h3>
                                <p className="text-[10px] font-bold text-slate-200 uppercase mt-1">{bookingData?.details?.date}</p>
                            </div>
                            <div className="p-6 sm:p-8 space-y-6">
                                <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
                                    <img src={`https://images.kiwi.com/airlines/64/${bookingData?.details?.airlineIata || 'SQ'}.png`} className="w-10 h-10 object-contain p-1 border border-slate-50 rounded" alt="Airline" />
                                    <div>
                                        <p className="text-sm font-black text-slate-800">{bookingData?.details?.airline}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{bookingData?.details?.flightNumber}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-slate-400">Grand Total</span>
                                        <span className="font-black text-slate-800 text-xl">₹{requiredBalance.toLocaleString()}</span>
                                    </div>
                                    <div className={`p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border-2 transition-all duration-500 ${balance < requiredBalance ? 'bg-red-50 border-red-100 flex flex-col gap-4' : 'bg-slate-50 border-slate-100 flex justify-between items-center'}`}>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Wallet</span>
                                            <span className={`text-xl font-black ${balance < requiredBalance ? 'text-red-500 animate-pulse' : 'text-green-600'}`}>₹{balance.toLocaleString()}</span>
                                        </div>
                                        {balance < requiredBalance && (
                                            <button 
                                                onClick={() => {
                                                    toast.info('Redirecting to wallet...');
                                                    navigate('/agent/wallet');
                                                }}
                                                className="w-full bg-red-600 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                                            >
                                                Add Money Now →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutInternational;
