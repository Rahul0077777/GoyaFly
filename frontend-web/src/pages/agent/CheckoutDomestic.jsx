import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { walletService, bookingService } from '../../services/api';
import { getValidationError } from '../../utils/validation';
import { FaCalendarAlt } from 'react-icons/fa';

const CheckoutDomestic = ({ bookingData }) => {
    const navigate = useNavigate();
    const [paying, setPaying] = useState(false);
    const [balance, setBalance] = useState(0);
    const [currentStep, setCurrentStep] = useState(1); // 1: Travellers, 2: Add-ons, 3: Review
    const [seatMap, setSeatMap] = useState(null);
    const [loadingSSR, setLoadingSSR] = useState(false);
    const [selectedSeats, setSelectedSeats] = useState({}); // { paxIndex: seatCode }
    const [selectedMeals, setSelectedMeals] = useState({}); // { paxIndex: mealCode }
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [showTermsModal, setShowTermsModal] = useState(false);

    const paxBreakdown = (bookingData.passengers && typeof bookingData.passengers === 'object')
        ? bookingData.passengers
        : { adt: Number(bookingData.passengers) || 1, chd: 0, inf: 0 };
    const passengerCount = (paxBreakdown.adt || 1) + (paxBreakdown.chd || 0) + (paxBreakdown.inf || 0);
    const netPriceValue = bookingData?.details?.netfare || bookingData?.baseFare || 0;
    const totalBookingPrice = netPriceValue * passengerCount;
    const requiredBalance = totalBookingPrice;

    const [passengersList, setPassengersList] = useState(() => {
        const list = [];
        for (let i = 0; i < (paxBreakdown.adt || 1); i++)
            list.push({ title: 'Mr', firstName: '', lastName: '', dob: '1990-01-01', type: 'ADT', pType: 'A' });
        for (let i = 0; i < (paxBreakdown.chd || 0); i++)
            list.push({ title: 'Mstr', firstName: '', lastName: '', dob: '2015-01-01', type: 'CHD', pType: 'C' });
        for (let i = 0; i < (paxBreakdown.inf || 0); i++)
            list.push({ title: 'Miss', firstName: '', lastName: '', dob: '2023-01-01', type: 'INF', pType: 'I' });
        return list;
    });

    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    // ... terms logic

    const validationFlags = bookingData.details?.validationFlags || {};
    const [gst, setGst] = useState({ number: '', email: '', mobile: '', address: '', company: '' });
    const [firstPaxPan, setFirstPaxPan] = useState('');

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
        // Passenger Names
        for (let i = 0; i < passengersList.length; i++) {
            if (!passengersList[i].firstName || !passengersList[i].lastName) {
                toast.warn(`Please enter name for Passenger ${i + 1}`);
                return false;
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

        setLoadingSSR(true);
        setCurrentStep(2);
        try {
            const res = await bookingService.ftdGetSeats(bookingData.details.flightID, bookingData.details.refID, {
                title: passengersList[0].title,
                fName: passengersList[0].firstName,
                lName: passengersList[0].lastName,
                pType: 'A'
            });
            if (res.success) setSeatMap(res.data);
        } catch (err) { } finally { setLoadingSSR(false); }
    };

    const handleFinalize = async (e) => {
        if (e) e.preventDefault();
        if (!validateInputs()) return;

        // ... rest of logic

        // 4. Wallet Balance Check
        if (balance < requiredBalance) {
            toast.error(`Insufficient Wallet Balance. You need ₹${requiredBalance.toLocaleString()} but have ₹${balance.toLocaleString()}.`);
            return;
        }

        setPaying(true);

        // FTD Section 8: dob must be DD-MM-YYYY
        const formatDateFTD = (dateStr) => {
            if (!dateStr) return '01-01-1990';
            if (dateStr.includes('-') && dateStr.indexOf('-') === 4) {
                const [y, m, d] = dateStr.split('-');
                return `${d}-${m}-${y}`;
            }
            return dateStr;
        };

        // FTD Section 8/9: build passenger array with correct pType
        const PTYPE_MAP = { ADT: 'A', CHD: 'C', INF: 'I', A: 'A', C: 'C', I: 'I' };
        const passengerData = passengersList.map((p, idx) => {
            const pType = PTYPE_MAP[p.pType] || PTYPE_MAP[p.type] || 'A';
            const gender = (p.title === 'Mr' || p.title === 'Mstr' || p.title === 'Master') ? 'M' : 'F';
            const paxObj = {
                title: p.title,
                fName: p.firstName.toUpperCase().trim(),
                lName: p.lastName.toUpperCase().trim(),
                pType,
                gender,
                dob: formatDateFTD(p.dob || '1990-01-01'),
                ppNo: p.passportNumber || '',
                ppIss: p.passportIssued ? formatDateFTD(p.passportIssued) : '',
                ppExp: p.passportExpiry ? formatDateFTD(p.passportExpiry) : '',
                ppNat: 'IN'
            };

            // FTD Section 9: SSR uses Baggage.Onward (not ssrInfo)
            const hasSSR = selectedSeats[idx] || selectedMeals[idx];
            if (hasSSR) {
                paxObj.Baggage = {
                    Onward: {
                        ...(selectedSeats[idx] ? { seat_no: selectedSeats[idx], seat_amount: '0' } : {}),
                        ...(selectedMeals[idx] ? { meal: selectedMeals[idx], meal_amount: '0' } : {}),
                    }
                };
            }
            return paxObj;
        });

        try {
            // FTD Section 8: mrd = mobile with country code
            const mrd = mobile.startsWith('+') ? mobile : `+91${mobile}`;

            const bookingRes = await bookingService.ftdBookFlight({
                passenger: passengerData,
                refID: bookingData.details.refID,
                flightID: bookingData.details.flightID || bookingData.details.FlightID || bookingData.details.Fare?.flightID || bookingData.details.Flights?.Onward?.[0]?.flightID || bookingData.details.Flights?.Onward?.["0"]?.flightID,
                mobile,
                mrd,          // Section 8: mandatory mobile with country code
                email,
                gst: (validationFlags.gstInd === 1 || gst.number) ? gst : undefined,
                gstind: (validationFlags.gstInd === 1 || gst.number) ? 1 : 0,
                first_pax_pan_no: firstPaxPan,
                netfare: bookingData.details.netfare || bookingData.baseFare
            });

            if (bookingRes.success) {
                navigate('/agent/history', {
                    state: {
                        success: true,
                        message: bookingRes.message || `Booking confirmed! PNR: ${bookingRes.pnr || bookingRes.booking?.pnr || 'Pending'}`,
                        txnId: bookingRes.booking?._id
                    }
                });
            } else {
                toast.error(bookingRes.message || 'Booking failed. Please try again.');
                setPaying(false);
            }
        } catch (err) {
            console.error(err);
            toast.error('Booking failed: ' + (err.response?.data?.message || 'Contact Support'));
            setPaying(false);
        }
    };

    return (
        <div className="flex-1 bg-[#f8fafc] min-h-[calc(100vh-64px)] pb-12 overflow-y-auto">
            {/* Header with Step Indicator */}
            <div className="bg-[#1D4171] w-full pt-10 pb-36 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="bg-[#48A0D4]/20 text-[#48A0D4] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-[#48A0D4]/30">DOMESTIC FLIGHT</span>
                        </div>
                        <h1 className="text-white text-4xl font-bold tracking-tight mb-2">Checkout</h1>
                        <p className="text-slate-200 text-sm max-w-md">Complete your booking with professional GDS-integrated processing.</p>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50">
                        {[
                            { step: 1, label: 'Travellers' },
                            { step: 2, label: 'Add-ons' },
                            { step: 3, label: 'Review' }
                        ].map((s, idx) => (
                            <React.Fragment key={s.step}>
                                <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${currentStep === s.step ? 'bg-[#48A0D4] shadow-lg shadow-[#48A0D4]/20' : ''}`}>
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${currentStep === s.step ? 'bg-white text-[#1D4171]' : 'bg-slate-700 text-slate-400'}`}>
                                        {s.step}
                                    </span>
                                    <span className={`text-xs font-black uppercase tracking-wider ${currentStep === s.step ? 'text-white' : 'text-slate-500'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {idx < 2 && <div className="w-8 h-[2px] bg-slate-700"></div>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-10">
                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* LEFT COLUMN: ITINERARY REVIEW & FARE summary (Always visible) */}
                    <div className="w-full lg:w-[35%] space-y-6 lg:sticky top-6">
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                            <div className="bg-[#2c3e50] p-6">
                                <h2 className="text-white font-bold text-lg mb-1 flex items-center justify-between">
                                    Flight Review
                                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-black uppercase tracking-widest">{bookingData.details.date}</span>
                                </h2>
                                <p className="text-slate-300 text-sm font-semibold">{bookingData.from} ➔ {bookingData.to}</p>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded border border-slate-100 p-1">
                                        <img src={`https://images.kiwi.com/airlines/64/${bookingData.details.airlineIata || bookingData.details.id.split('-')[0]}.png`} className="w-full h-full object-contain" alt="airline" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 leading-tight">{bookingData.details.airline}</h3>
                                        <span className="text-xs text-slate-500 font-bold uppercase">{bookingData.details.flightNumber}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="text-center w-[30%]">
                                            <span className="block text-xl font-black text-slate-800">{bookingData.details.departureTime}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">{bookingData.from}</span>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center">
                                            <span className="text-[9px] text-slate-400 font-black uppercase mb-1">{bookingData?.details?.duration}</span>
                                            <div className="w-full h-[1.5px] bg-slate-200 relative mb-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute -left-0.5 -top-[2px]"></div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute -right-0.5 -top-[2px]"></div>
                                            </div>
                                        </div>
                                        <div className="text-center w-[30%]">
                                            <span className="block text-xl font-black text-slate-800">{bookingData.details.arrivalTime}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">{bookingData.to}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 py-1.5 px-3 rounded-lg flex items-center gap-2 uppercase tracking-tight">💼 7KG Cabin</span>
                                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 py-1.5 px-3 rounded-lg flex items-center gap-2 uppercase tracking-tight">🧳 15KG Check-in</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border-t border-slate-100 p-6">
                                <h3 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">Fare Summary ({passengerCount} Pax)</h3>
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 font-bold uppercase">Base Fare</span>
                                        <span className="text-sm font-black text-slate-800">₹{totalBookingPrice.toLocaleString()}</span>
                                    </div>
                                    {Object.keys(selectedSeats).length > 0 && (
                                        <div className="flex justify-between items-center text-blue-600 px-3 py-2 bg-blue-50/50 rounded-lg border border-blue-100/50">
                                            <span className="text-[11px] font-black uppercase">Selected Seats</span>
                                            <span className="text-[11px] font-black">₹0 (Inc)</span>
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-slate-200 pt-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Grand Total</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-[#F07E21]">₹{totalBookingPrice.toLocaleString()}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Inc. GST</span>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Available Wallet:</span>
                                        <div className="text-right">
                                            <span className={`text-xl font-black block ${balance < requiredBalance ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>
                                                ₹{balance.toLocaleString()}
                                            </span>
                                            {balance < requiredBalance && (
                                                <span className="text-[10px] text-red-400 font-bold uppercase">Short: ₹{(requiredBalance - balance).toLocaleString()}</span>
                                            )}
                                        </div>
                                    </div>

                                    {balance < requiredBalance && (
                                        <div className="bg-red-50 border-2 border-red-100 rounded-[2rem] p-8 text-center animate-in zoom-in-95 duration-300">
                                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl mx-auto mb-4">⚠️</div>
                                            <h4 className="text-xs font-black text-red-900 uppercase tracking-widest mb-2">Insufficient Balance</h4>
                                            <p className="text-[10px] text-red-600 font-bold leading-relaxed mb-6">You do not have enough funds in your wallet to complete this booking.</p>

                                            <button
                                                onClick={() => {
                                                    toast.info('Redirecting to wallet for top-up...');
                                                    navigate('/agent/wallet');
                                                }}
                                                className="w-full py-4 bg-red-600 text-white font-black rounded-2xl text-[10px] tracking-[0.2em] shadow-lg shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all uppercase"
                                            >
                                                Add Money Now →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: STEP CONTENT */}
                    <div className="w-full lg:w-[65%]">
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                {passengersList.map((p, index) => (
                                    <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-8">
                                            <h3 className="text-[16px] font-black text-slate-800 uppercase tracking-widest">Traveller {index + 1} {index === 0 ? '(Adult - Lead)' : '(Adult)'}</h3>
                                            <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-100">Pax Type: Adult</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                            <div className="flex flex-col md:col-span-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Title</label>
                                                <select value={p.title} onChange={(e) => handlePassengerChange(index, 'title', e.target.value)} className="w-full border-2 border-slate-100 rounded-xl px-4 h-[52px] text-sm font-black text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all cursor-pointer">
                                                    <option value="Mr">Mr</option><option value="Ms">Ms</option><option value="Mrs">Mrs</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col md:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">First & Middle Name *</label>
                                                <input value={p.firstName} onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)} placeholder="ENTER GIVEN NAME" className="w-full border-2 border-slate-100 rounded-xl px-4 h-[52px] text-sm font-black text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 uppercase" required />
                                            </div>
                                            <div className="flex flex-col md:col-span-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Last Name *</label>
                                                <input value={p.lastName} onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)} placeholder="SURNAME" className="w-full border-2 border-slate-100 rounded-xl px-4 h-[52px] text-sm font-black text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 uppercase" required />
                                            </div>
                                            <div className="flex flex-col md:col-span-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Date of Birth *</label>
                                                <div className="relative">
                                                    <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-[#48A0D4] pointer-events-none" />
                                                    <input type="date" value={p.dob} onChange={(e) => handlePassengerChange(index, 'dob', e.target.value)} onClick={(e) => e.target.showPicker && e.target.showPicker()} className="w-full pl-11 pr-3 border-2 border-slate-100 rounded-xl h-[52px] text-xs font-black text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all cursor-pointer" required />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mandatory PAN for Lead Passenger */}
                                        {index === 0 && (validationFlags.pan_mandatory === 1 || validationFlags.isPanMandatory === 1) && (
                                            <div className="mt-6 pt-6 border-t border-slate-50 animate-in slide-in-from-top-4 duration-500">
                                                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex flex-col md:flex-row md:items-center gap-4">
                                                    <div className="flex-1">
                                                        <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2 block">PAN Number (Mandatory for this fare) *</label>
                                                        <input value={firstPaxPan} onChange={(e) => setFirstPaxPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" className="w-full border-2 border-amber-200 rounded-lg px-4 h-[52px] text-sm font-black text-slate-800 focus:border-amber-500 outline-none transition-all placeholder:text-amber-200 uppercase" />
                                                    </div>
                                                    <p className="text-[10px] text-amber-600 font-bold max-w-[200px]">GDS requires PAN details for the lead passenger to process this specific fare.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-[#eb5a0c]"></div>
                                    <h3 className="text-[16px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-6 mb-8">Booking Notifications</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mobile Number *</label>
                                            <div className="flex">
                                                <div className="w-[70px] border-2 border-r-0 border-slate-100 rounded-l-xl bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400 h-[52px]">🇮🇳 +91</div>
                                                <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} placeholder="10 DIGITS" className="flex-1 border-2 border-slate-100 rounded-r-xl px-4 h-[52px] text-sm font-black text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300" required />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Email Address *</label>
                                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="TICKET@EXAMPLE.COM" className="w-full border-2 border-slate-100 rounded-xl px-4 h-[52px] text-sm font-black text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300" required />
                                        </div>
                                    </div>
                                </div>

                                {/* GST Details Section */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-8">
                                        <div>
                                            <h3 className="text-[16px] font-black text-slate-800 uppercase tracking-widest">GST Details</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Optional for Tax Invoice</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">GST Number</label>
                                            <input value={gst.number} onChange={(e) => setGst({ ...gst, number: e.target.value.toUpperCase() })} placeholder="GSTIN (e.g. 07AAAAA0000A1Z5)" className="w-full border-2 border-slate-100 rounded-xl px-4 h-[52px] text-sm font-black text-slate-800 focus:border-blue-500 outline-none transition-all placeholder:text-slate-200" />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Company Name</label>
                                            <input value={gst.company} onChange={(e) => setGst({ ...gst, company: e.target.value })} placeholder="REGISTERED AGENCY NAME" className="w-full border-2 border-slate-100 rounded-xl px-4 h-[52px] text-sm font-black text-slate-800 focus:border-blue-500 outline-none transition-all placeholder:text-slate-200" />
                                        </div>
                                    </div>

                                    {gst.number && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">GST Email</label>
                                                <input value={gst.email} onChange={(e) => setGst({ ...gst, email: e.target.value })} placeholder="TAX@AGENCY.COM" className="w-full border-2 border-slate-100 rounded-xl px-4 h-[52px] text-sm font-black text-slate-800 focus:border-blue-500 outline-none transition-all placeholder:text-slate-200" />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">GST Mobile</label>
                                                <input value={gst.mobile} onChange={(e) => setGst({ ...gst, mobile: e.target.value })} placeholder="10 DIGITS" className="w-full border-2 border-slate-100 rounded-xl px-4 h-[52px] text-sm font-black text-slate-800 focus:border-blue-500 outline-none transition-all placeholder:text-slate-200" />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">GST Address</label>
                                                <input value={gst.address} onChange={(e) => setGst({ ...gst, address: e.target.value })} placeholder="BILLING ADDRESS" className="w-full border-2 border-slate-100 rounded-xl px-4 h-[52px] text-sm font-black text-slate-800 focus:border-blue-500 outline-none transition-all placeholder:text-slate-200" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button onClick={handleProceedToAddons} className="w-full bg-[#1D4171] hover:bg-[#15305B] text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[13px] shadow-xl hover:-translate-y-1 transition-all active:scale-95">
                                    Proceed to Add-ons →
                                </button>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {loadingSSR ? (
                                    <div className="bg-white rounded-2xl border border-slate-200 p-20 flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-6"></div>
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Fetching GDS Seat Maps & Meals...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* SSR Selection Section */}
                                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                                            <h3 className="text-xl font-black text-slate-800 mb-2">Customize Flight Experience</h3>
                                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-8">Select preferred seats and meal choices</p>

                                            <div className="space-y-12">
                                                {passengersList.map((p, idx) => (
                                                    <div key={idx} className="border-t border-slate-100 pt-8 first:border-0 first:pt-0">
                                                        <div className="flex items-center gap-3 mb-6">
                                                            <div className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black">{idx + 1}</div>
                                                            <span className="text-sm font-black text-slate-800 uppercase tracking-widest">{p.firstName} {p.lastName}</span>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Preferred Seat</h4>
                                                                <div className="grid grid-cols-4 gap-2">
                                                                    {(seatMap?.seats || ['6A', '6B', '6C', '6D', '6E', '6F', '7A', '7B']).map(seatItem => {
                                                                        const seatCode = typeof seatItem === 'string' ? seatItem : seatItem.code;
                                                                        return (
                                                                            <button
                                                                                key={seatCode}
                                                                                type="button"
                                                                                onClick={() => setSelectedSeats(prev => ({ ...prev, [idx]: seatCode }))}
                                                                                className={`py-3 px-1 rounded-xl text-[10px] font-black transition-all border-2 ${selectedSeats[idx] === seatCode ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'}`}
                                                                            >
                                                                                {seatCode}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                                {seatMap?.seats?.length === 0 && <p className="text-[9px] text-amber-600 font-black uppercase mt-2">No advance seating available for this flight</p>}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Meal Option</h4>
                                                                <select
                                                                    value={selectedMeals[idx] || ''}
                                                                    onChange={(e) => setSelectedMeals(prev => ({ ...prev, [idx]: e.target.value }))}
                                                                    className="w-full border-2 border-slate-100 rounded-xl px-4 h-[52px] text-sm font-black text-slate-800 focus:border-blue-500 outline-none bg-white"
                                                                >
                                                                    <option value="">No Preference</option>
                                                                    {(seatMap?.meals || [
                                                                        { code: 'VEG', name: 'Vegetarian Meal' },
                                                                        { code: 'NON', name: 'Non-Veg Meal' },
                                                                        { code: 'HNML', name: 'Hindu Meal' }
                                                                    ]).map(meal => (
                                                                        <option key={meal.code} value={meal.code}>{meal.name}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button onClick={() => setCurrentStep(1)} className="w-[120px] bg-slate-100 text-slate-500 font-black py-5 rounded-2xl uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all">Back</button>
                                            <button onClick={() => setCurrentStep(3)} className="flex-1 bg-[#1D4171] hover:bg-[#15305B] text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[13px] shadow-xl hover:-translate-y-1 transition-all">Proceed to Payment →</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                                    <h3 className="text-xl font-black text-slate-800 mb-2">Final Review & Payment</h3>
                                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-8">Confirm all details before securing the fare</p>

                                    <div className="space-y-6 mb-10">
                                        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                            <div className="flex items-center gap-3 mb-2 text-emerald-700 font-black text-xs uppercase tracking-widest">
                                                <span>✔️</span> PRICE VERIFIED & SECURED
                                            </div>
                                            <p className="text-emerald-600 text-[11px] font-bold">This price is held for 10 minutes for your agency.</p>
                                        </div>

                                        {/* Policy Check */}
                                        <label className="flex items-start gap-4 cursor-pointer group p-4 border-2 border-slate-50 rounded-2xl hover:bg-slate-50/50 transition-all">
                                            <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                            <div className="flex-1">
                                                <p className="text-[13px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1">Confirm and Finalize</p>
                                                <p className="text-sm text-slate-500 font-medium">I agree to the <span className="text-blue-600 font-bold hover:underline">Fare Rules</span> and GDS ticketing policies.</p>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => setCurrentStep(2)} className="w-[120px] bg-slate-100 text-slate-500 font-black py-5 rounded-2xl uppercase tracking-widest text-[11px]">Back</button>
                                        {balance < requiredBalance ? (
                                            <button
                                                onClick={() => window.location.href = '/agent/wallet'}
                                                className="flex-1 bg-amber-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[15px] shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
                                            >
                                                ⚠️ RECHARGE WALLET TO BOOK
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleFinalize}
                                                disabled={paying || !agreedToTerms}
                                                className={`flex-1 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[15px] shadow-xl transition-all relative overflow-hidden ${paying || !agreedToTerms ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#F07E21] hover:bg-[#d66e1b] active:scale-95'}`}
                                            >
                                                {paying ? 'Processing Booking...' : `CONFIRM & PAY ₹${totalBookingPrice.toLocaleString()}`}
                                            </button>
                                        )}
                                    </div>
                                    {balance < requiredBalance && (
                                        <p className="text-center text-[10px] font-black text-amber-600 uppercase mt-4 tracking-widest animate-pulse">
                                            Insufficient Balance: ₹{balance.toLocaleString()} / Required: ₹{requiredBalance.toLocaleString()}
                                        </p>
                                    )}
                                    {!agreedToTerms && balance >= requiredBalance && <p className="text-center text-[10px] font-black text-slate-400 uppercase mt-4 tracking-widest">Please accept policies to book</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Terms Modal remains same */}
            {showTermsModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[2rem]">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Booking Policy</h3>
                                <p className="text-slate-500 text-[10px] font-black mt-1 uppercase">Goyafly Domestic Guidelines</p>
                            </div>
                            <button onClick={() => setShowTermsModal(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                                <span className="text-2xl font-black">×</span>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto space-y-6 flex-1">
                            <p className="text-sm text-slate-600 leading-relaxed font-bold">Names must exactly match Official IDs. No changes allowed post ticketing.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutDomestic;
