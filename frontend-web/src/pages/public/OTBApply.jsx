import React, { useState, useEffect } from 'react';
import { otbService } from '../../services/otbService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Removed hardcoded AIRLINE_GROUPS

const DESTINATIONS = {
    'Dubai': { surcharge: 0 },
    'Sharjah': { surcharge: 0 },
    'Abu Dhabi': { surcharge: 0 },
    'Kuwait': { surcharge: 250 },
    'Bahrain': { surcharge: 250 },
    'Oman': { surcharge: 250 },
    'Qatar': { surcharge: 250 },
    'Saudi Arabia': { surcharge: 250 }
};

const OTBApply = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [feeCalculated, setFeeCalculated] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    const [error, setError] = useState('');
    const [airlineGroups, setAirlineGroups] = useState([]);

    const [formData, setFormData] = useState({
        airline: '',
        noOfAdults: 1,
        noOfChildren: 0,
        noOfInfants: 0,
        travelDetails: {
            destination: 'Dubai (UAE)',
            dateOfTravel: '',
            pnr: '',
            contactNo: '',
            email: ''
        },
        passengers: [{ paxType: 'Adult', title: 'Mr', gender: 'Male', firstName: '', lastName: '' }],
        documents: {
            visaCopy: null,
            onwardTicket: null,
            returnTicket: null
        },
        fees: {
            airlineFee: 0,
            surcharge: 0,
            urgentSurcharge: 0,
            otbFee: 0,
            handlingFee: 0,
            igst: 0,
            totalFare: 0
        },
        paymentMode: ''
    });

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const res = await otbService.getPricing();
                if (res.success) {
                    setAirlineGroups(res.data);
                }
            } catch (err) {
                console.error("Failed to load airline pricing", err);
            }
        };
        fetchPricing();
    }, []);

    useEffect(() => {
        const totalPax = parseInt(formData.noOfAdults || 0) + parseInt(formData.noOfChildren || 0) + parseInt(formData.noOfInfants || 0);
        const newPassengers = [...formData.passengers];
        
        if (newPassengers.length < totalPax) {
            for (let i = newPassengers.length; i < totalPax; i++) {
                let type = 'Adult';
                if (i >= formData.noOfAdults && i < (parseInt(formData.noOfAdults) + parseInt(formData.noOfChildren))) {
                    type = 'Child';
                } else if (i >= (parseInt(formData.noOfAdults) + parseInt(formData.noOfChildren))) {
                    type = 'Infant';
                }
                newPassengers.push({ paxType: type, title: 'Mr', gender: 'Male', firstName: '', lastName: '' });
            }
        } else if (newPassengers.length > totalPax) {
            newPassengers.splice(totalPax);
        }
        
        setFormData(prev => ({ ...prev, passengers: newPassengers }));
    }, [formData.noOfAdults, formData.noOfChildren, formData.noOfInfants]);
    useEffect(() => {
        const adults = parseInt(formData.noOfAdults || 0);
        const children = parseInt(formData.noOfChildren || 0);
        const infants = parseInt(formData.noOfInfants || 0);
        const totalPax = adults + children + infants;

        if (!formData.airline) {
            setFormData(prev => ({
                ...prev,
                fees: { airlineFee: 0, surcharge: 0, urgentSurcharge: 0, otbFee: 0, handlingFee: 0, igst: 0, totalFare: 0 }
            }));
            setFeeCalculated(false);
            return;
        }

        const airlineData = airlineGroups.find(a => a.airline === formData.airline);
        const destData = DESTINATIONS[formData.travelDetails.destination] || { surcharge: 0 };

        if (!airlineData) return;

        const baseRate = airlineData.rate;
        const surchargePerPax = destData.surcharge;
        const urgentRate = isUrgent ? 300 : 0;

        const totalAirlineFee = baseRate * totalPax;
        const totalSurcharge = surchargePerPax * totalPax;
        const totalUrgentSurcharge = urgentRate * totalPax;
        const handlingFee = 0;
        
        const subtotal = totalAirlineFee + totalSurcharge + totalUrgentSurcharge + handlingFee;
        const igst = subtotal * 0.18;
        const totalFare = subtotal + igst;

        setFormData(prev => ({
            ...prev,
            fees: {
                airlineFee: totalAirlineFee,
                surcharge: totalSurcharge,
                urgentSurcharge: totalUrgentSurcharge,
                otbFee: subtotal,
                handlingFee,
                igst: parseFloat(igst.toFixed(2)),
                totalFare: parseFloat(totalFare.toFixed(2))
            }
        }));
        setFeeCalculated(true);
        setError('');
    }, [formData.airline, formData.travelDetails.destination, formData.noOfAdults, formData.noOfChildren, formData.noOfInfants, isUrgent, airlineGroups]);

    const handleClear = (e) => {
        e.preventDefault();
        setFormData(prev => ({
            ...prev,
            airline: '',
            noOfAdults: 1,
            noOfChildren: 0,
            noOfInfants: 0,
            fees: {
                airlineFee: 0,
                surcharge: 0,
                otbFee: 0,
                handlingFee: 0,
                igst: 0,
                totalFare: 0
            }
        }));
        setFeeCalculated(false);
    };

    const handleFileChange = (e, field) => {
        setFormData(prev => ({
            ...prev,
            documents: {
                ...prev.documents,
                [field]: e.target.files[0]
            }
        }));
    };

    const handlePassengerChange = (index, field, value) => {
        const updatedPassengers = [...formData.passengers];
        updatedPassengers[index][field] = value;
        setFormData(prev => ({ ...prev, passengers: updatedPassengers }));
    };

    const handleTravelDetailChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            travelDetails: {
                ...prev.travelDetails,
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feeCalculated) {
            setError('Please calculate fee first by clicking "Get Fee"');
            return;
        }

        setLoading(true);
        setError('');

        for (let i = 0; i < formData.passengers.length; i++) {
            const pax = formData.passengers[i];
            if (!pax.firstName || !pax.lastName) {
                setError(`Please fill in first and last name for Passenger ${index + 1}`);
                setLoading(false);
                return;
            }
        }

        if(!formData.documents.visaCopy || !formData.documents.onwardTicket) {
             setError("Please upload Visa Copy and Onward Ticket Copy.");
             setLoading(false);
             return;
        }

        try {
            const data = new FormData();
            data.append('airline', formData.airline);
            data.append('noOfAdults', formData.noOfAdults);
            data.append('noOfChildren', formData.noOfChildren);
            data.append('noOfInfants', formData.noOfInfants);
            data.append('travelDetails', JSON.stringify(formData.travelDetails));
            data.append('passengers', JSON.stringify(formData.passengers));
            data.append('fees', JSON.stringify(formData.fees));
            data.append('isUrgent', isUrgent);

            if (formData.documents.visaCopy) data.append('visaCopy', formData.documents.visaCopy);
            if (formData.documents.onwardTicket) data.append('onwardTicket', formData.documents.onwardTicket);
            if (formData.documents.returnTicket) data.append('returnTicket', formData.documents.returnTicket);

            const response = await otbService.apply(data);
            
            if (response.success) {
                toast.success(response.message || 'Application submitted successfully! Paid via wallet.');
                navigate('/agent/otb');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Application failed. Insufficient wallet balance or server error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#f8f9fa] min-h-screen py-8 px-4 font-sans text-gray-700">
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                
                {/* OTB Request Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-[#1D4171] text-white px-6 py-4 flex justify-between items-center">
                        <span className="text-xl font-medium">OTB Request</span>
                        <div className="flex gap-4 items-center">
                             <div className="bg-white/20 px-3 py-1 rounded text-xs backdrop-blur-sm border border-white/20">
                                🕒 Mon-Sat: 10AM-10PM
                             </div>
                             <div className="text-[10px] font-bold text-blue-100 uppercase tracking-widest bg-blue-900/30 px-2 py-1 rounded">
                                Emergency Sunday Support
                             </div>
                        </div>
                    </div>
                    <div className="p-6">
                        {/* Working Hours Banner */}
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 flex items-start gap-3">
                             <span className="text-xl">⚡</span>
                             <div>
                                <p className="text-sm font-bold text-blue-800 uppercase tracking-wide">Dynamic Regional Pricing Enabled</p>
                                <p className="text-xs text-blue-600 font-medium">Prices are automatically updated based on selected Airline and Destination (Muscat/Bahrain surcharge ₹250/pax applies).</p>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            <div className="space-y-1">
                                <label className="text-sm text-gray-700 font-medium">Destination<span className="text-red-500">*</span></label>
                                <select 
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-[#1D4171] outline-none"
                                    value={formData.travelDetails.destination}
                                    onChange={e => handleTravelDetailChange('destination', e.target.value)}
                                >
                                    <option value="">--Select Destination--</option>
                                    {Object.keys(DESTINATIONS).map(dest => (
                                        <option key={dest} value={dest}>{dest} {DESTINATIONS[dest].surcharge > 0 ? `(+₹${DESTINATIONS[dest].surcharge})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm text-gray-700 font-medium">OTB Airline<span className="text-red-500">*</span></label>
                                <select 
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-[#1D4171] outline-none"
                                    value={formData.airline}
                                    onChange={e => setFormData({...formData, airline: e.target.value})}
                                >
                                    <option value="">--Select Airline--</option>
                                    {airlineGroups.map(air => (
                                        <option key={air._id} value={air.airline}>{air.airline} (₹{air.rate})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm text-gray-700 font-medium">No of Adult<span className="text-red-500">*</span></label>
                                <select 
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-[#1D4171] outline-none"
                                    value={formData.noOfAdults}
                                    onChange={e => setFormData({...formData, noOfAdults: e.target.value})}
                                >
                                    {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm text-gray-700 font-medium">No of Child</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-[#1D4171] outline-none"
                                    value={formData.noOfChildren}
                                    onChange={e => setFormData({...formData, noOfChildren: e.target.value})}
                                >
                                    {[0,1,2,3,4,5,6].map(n => <option key={`c${n}`} value={n}>{n === 0 ? 'Select Child' : n}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm text-gray-700 font-medium">No of Infant</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-[#1D4171] outline-none"
                                    value={formData.noOfInfants}
                                    onChange={e => setFormData({...formData, noOfInfants: e.target.value})}
                                >
                                    {[0,1,2,3,4,5,6].map(n => <option key={`i${n}`} value={n}>{n === 0 ? 'Select Infant' : n}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Urgent Processing Toggle */}
                        <div className="mt-8 bg-orange-50 border border-orange-100 p-4 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">⚡</div>
                                <div>
                                    <p className="text-sm font-bold text-orange-800 uppercase tracking-wide">Urgent Processing (15-Minute Clearance)</p>
                                    <p className="text-[11px] text-orange-600 font-medium">Get your OK TO BOARD in 15 mins instead of 4 hours. Extra ₹300 per passenger applies.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={isUrgent}
                                    onChange={() => setIsUrgent(!isUrgent)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                <span className="ml-3 text-xs font-bold text-gray-700">{isUrgent ? 'ENABLED' : 'DISABLED'}</span>
                            </label>
                        </div>

                        <div className="mt-8 flex justify-center gap-3">
                            <button 
                                onClick={handleClear} 
                                className="bg-[#0B3A5A] text-white px-8 py-2 rounded-md font-medium text-sm hover:bg-[#072439] transition-colors"
                            >
                                Reset Form
                            </button>
                        </div>
                    </div>
                </div>

                {/* OTB Fee Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 text-[#4f677d] text-lg font-medium border-b border-gray-100">
                        OTB Fee
                    </div>
                    <div className="p-6 overflow-x-auto">
                        <table className="w-full text-center border-collapse border border-gray-200 min-w-[600px]">
                            <thead>
                                <tr className="bg-[#F5F8FA] text-[#2c3e50] text-sm">
                                    <th className="border border-gray-200 py-3 px-4 font-semibold text-xs text-left">Airline Base Fee</th>
                                    <th className="border border-gray-200 py-3 px-4 font-semibold text-xs text-left">Regional Surcharge(+)</th>
                                    <th className="border border-gray-200 py-3 px-4 font-semibold text-xs text-left">Urgent Surcharge(+)</th>
                                    <th className="border border-gray-200 py-3 px-4 font-semibold text-xs text-left">IGST (18%) (+)</th>
                                    <th className="border border-gray-200 py-3 px-4 font-semibold text-xs text-left">Total Fare</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="text-sm text-gray-600">
                                    <td className="border border-gray-200 py-3 px-4">INR {formData.fees.airlineFee.toFixed(2)}</td>
                                    <td className="border border-gray-200 py-3 px-4">INR {formData.fees.surcharge.toFixed(2)}</td>
                                    <td className="border border-gray-200 py-3 px-4 text-orange-600 font-bold">INR {formData.fees.urgentSurcharge.toFixed(2)}</td>
                                    <td className="border border-gray-200 py-3 px-4">INR {formData.fees.igst.toFixed(2)}</td>
                                    <td className="border border-gray-200 py-3 px-4 font-black text-blue-800">INR {formData.fees.totalFare.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Travel Details Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 text-[#4f677d] text-lg font-medium border-b border-gray-100 flex items-center">
                        Travel Details<span className="text-red-500">*</span>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-1 flex flex-col relative">
                                <label className="text-xs text-gray-500 font-medium">Date of Travel<span className="text-red-500">*</span></label>
                                <input 
                                    type="date" 
                                    className="border border-gray-300 rounded-md p-2 text-sm text-gray-600 focus:ring-1 focus:ring-[#1D82B2] outline-none"
                                    value={formData.travelDetails.dateOfTravel}
                                    onChange={e=>handleTravelDetailChange('dateOfTravel', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1 flex flex-col">
                                <label className="text-xs text-gray-500 font-medium">Airline PNR<span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    className="border border-gray-300 rounded-md p-2 text-sm text-gray-600 focus:ring-1 focus:ring-[#1D4171] outline-none"
                                    value={formData.travelDetails.pnr}
                                    onChange={e=>handleTravelDetailChange('pnr', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1 flex flex-col">
                                <label className="text-xs text-gray-500 font-medium">Contact No</label>
                                <input 
                                    type="text" 
                                    className="border border-gray-300 rounded-md p-2 text-sm text-gray-600 focus:ring-1 focus:ring-[#1D4171] outline-none"
                                    value={formData.travelDetails.contactNo}
                                    onChange={e=>handleTravelDetailChange('contactNo', e.target.value)}
                                    placeholder="Contact Number"
                                />
                            </div>
                            <div className="space-y-1 flex flex-col">
                                <label className="text-xs text-gray-500 font-medium">Email ID</label>
                                <input 
                                    type="email" 
                                    className="border border-gray-300 rounded-md p-2 text-sm text-gray-600 focus:ring-1 focus:ring-[#1D4171] outline-none"
                                    value={formData.travelDetails.email}
                                    onChange={e=>handleTravelDetailChange('email', e.target.value)}
                                    placeholder="Email Address"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Passenger Details Headers */}
                <h3 className="text-[#4f677d] text-lg font-medium pl-2">Passenger Details</h3>

                {/* Passengers */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {formData.passengers.map((pax, index) => (
                        <div key={index} className="border-b border-gray-100 last:border-b-0 pb-6">
                            <div className="px-6 py-4 flex items-center gap-2 text-[#1D4171] font-medium text-lg">
                                <span className="text-xl">👤</span> Pax {index + 1}
                            </div>
                            <div className="px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="space-y-1 flex flex-col">
                                    <label className="text-xs text-gray-500 font-medium">Pax Type<span className="text-red-500">*</span></label>
                                    <select 
                                        className="border border-gray-300 rounded-md p-2 text-sm text-gray-600 focus:ring-1 focus:ring-[#1D4171] outline-none bg-gray-50"
                                        value={pax.paxType}
                                        disabled
                                    >
                                        <option value="Adult">Adult</option>
                                        <option value="Child">Child</option>
                                        <option value="Infant">Infant</option>
                                        <option value="">Select</option>
                                    </select>
                                </div>
                                <div className="space-y-1 flex flex-col">
                                    <label className="text-xs text-gray-500 font-medium">Title</label>
                                    <select 
                                        className="border border-gray-300 rounded-md p-2 text-sm text-gray-600 focus:ring-1 focus:ring-[#1D4171] outline-none"
                                        value={pax.title}
                                        onChange={e=>handlePassengerChange(index, 'title', e.target.value)}
                                    >
                                        <option value="Mr">Mr</option>
                                        <option value="Ms">Ms</option>
                                        <option value="Mrs">Mrs</option>
                                        <option value="Mstr">Mstr</option>
                                    </select>
                                </div>
                                <div className="space-y-1 flex flex-col">
                                    <label className="text-xs text-gray-500 font-medium">Gender<span className="text-red-500">*</span></label>
                                    <select 
                                        className="border border-gray-300 rounded-md p-2 text-sm text-gray-600 focus:ring-1 focus:ring-[#1D4171] outline-none"
                                        value={pax.gender}
                                        onChange={e=>handlePassengerChange(index, 'gender', e.target.value)}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div className="space-y-1 flex flex-col">
                                    <label className="text-xs text-gray-500 font-medium">First Name<span className="text-red-500">*</span></label>
                                    <input 
                                        type="text"
                                        className="border border-gray-300 rounded-md p-2 text-sm text-gray-600 focus:ring-1 focus:ring-[#1D4171] outline-none"
                                        value={pax.firstName}
                                        onChange={e=>handlePassengerChange(index, 'firstName', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1 flex flex-col">
                                    <label className="text-xs text-gray-500 font-medium">Last Name<span className="text-red-500">*</span></label>
                                    <input 
                                        type="text"
                                        className="border border-gray-300 rounded-md p-2 text-sm text-gray-600 focus:ring-1 focus:ring-[#1D4171] outline-none"
                                        value={pax.lastName}
                                        onChange={e=>handlePassengerChange(index, 'lastName', e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            {/* Document Upload shown under Pax 1 as per design */}
                            {index === 0 && (
                                <div className="mt-6 px-6">
                                    <div className="flex items-center gap-2 text-[#1D4171] font-medium text-lg mb-4">
                                        <span className="text-xl">📄</span> Document Upload
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 font-medium">Visa Copy<span className="text-red-500">*</span></label>
                                            <div className="flex bg-gray-50 border border-gray-300 rounded-md overflow-hidden text-sm">
                                                <div className="bg-gray-100 px-3 py-2 border-r border-gray-300 whitespace-nowrap text-gray-600 relative overflow-hidden cursor-pointer hover:bg-gray-200 text-xs">
                                                    Choose file
                                                    <input type="file" onChange={e=>handleFileChange(e, 'visaCopy')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                </div>
                                                <div className="px-3 py-2 text-gray-500 truncate text-xs flex-1">
                                                    {formData.documents.visaCopy ? formData.documents.visaCopy.name : 'No file chosen'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 font-medium">Onward Ticket Copy<span className="text-red-500">*</span></label>
                                            <div className="flex bg-gray-50 border border-gray-300 rounded-md overflow-hidden text-sm">
                                                <div className="bg-gray-100 px-3 py-2 border-r border-gray-300 whitespace-nowrap text-gray-600 relative overflow-hidden cursor-pointer hover:bg-gray-200 text-xs">
                                                    Choose file
                                                    <input type="file" onChange={e=>handleFileChange(e, 'onwardTicket')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                </div>
                                                <div className="px-3 py-2 text-gray-500 truncate text-xs flex-1">
                                                    {formData.documents.onwardTicket ? formData.documents.onwardTicket.name : 'No file chosen'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 font-medium">Return Ticket Copy</label>
                                            <div className="flex bg-gray-50 border border-gray-300 rounded-md overflow-hidden text-sm">
                                                <div className="bg-gray-100 px-3 py-2 border-r border-gray-300 whitespace-nowrap text-gray-600 relative overflow-hidden cursor-pointer hover:bg-gray-200 text-xs">
                                                    Choose file
                                                    <input type="file" onChange={e=>handleFileChange(e, 'returnTicket')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                </div>
                                                <div className="px-3 py-2 text-gray-500 truncate text-xs flex-1">
                                                    {formData.documents.returnTicket ? formData.documents.returnTicket.name : 'No file chosen'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Bottom Section - Fare Details & Payment */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row w-full max-w-lg mb-8">
                    {/* Left: Fare Details */}
                    <div className="w-full sm:w-1/2 p-6 flex flex-col justify-between">
                        <div>
                            <h3 className="text-[#3c5269] text-lg font-medium border-b border-gray-100 pb-2 mb-4">Fare Details</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between font-semibold text-gray-700">
                                    <span>Airline Fee</span>
                                    <span>INR {formData.fees.airlineFee.toFixed(2)}</span>
                                </div>
                                <div className="text-gray-500 text-xs space-y-1">
                                    <div>{formData.airline || 'Selected Airline'} (Group Rate)</div>
                                </div>
                                {formData.fees.surcharge > 0 && (
                                    <div className="flex justify-between font-semibold text-orange-600 pt-2 border-t border-gray-50">
                                        <span>Regional Surcharge</span>
                                        <span>INR {formData.fees.surcharge.toFixed(2)}</span>
                                    </div>
                                )}
                                {formData.fees.urgentSurcharge > 0 && (
                                    <div className="flex justify-between font-semibold text-orange-600 pt-2 border-t border-gray-50">
                                        <span>Urgent Surcharge (+₹300)</span>
                                        <span>INR {formData.fees.urgentSurcharge.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-semibold text-gray-700 mt-2">
                                    <span>IGST (18%)</span>
                                    <span>INR {formData.fees.igst.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 bg-[#1D4171] text-white p-4 -mx-6 -mb-6 rounded-bl-xl font-bold flex justify-between items-center text-lg">
                            <span>Total</span>
                            <span>INR {formData.fees.totalFare.toFixed(2)}</span>
                        </div>
                    </div>
                    {/* Right: Payment Method */}
                    <div className="w-full sm:w-1/2 p-6 bg-[#FaFbFc] sm:border-l border-t sm:border-t-0 border-gray-100 rounded-r-xl">
                        <h3 className="text-[#1D4171] text-base font-semibold mb-6 uppercase tracking-widest text-[11px]">Payment Authorization</h3>
                        
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-xl">💳</span>
                                <span className="text-xs font-black text-gray-700 uppercase tracking-widest">Agency Wallet</span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase leading-tight">Funds will be deducted from your wallet upon successful submission.</p>
                        </div>
                        
                        {error && (
                            <div className="bg-red-50 border border-red-100 p-3 rounded-lg mb-6">
                                <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{error}</p>
                            </div>
                        )}

                        <button 
                            onClick={handleSubmit} 
                            disabled={loading || !feeCalculated}
                            className="w-full bg-[#0B3A5A] text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#15345a] transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-900/10 disabled:opacity-50 disabled:transform-none"
                        >
                            {loading ? 'PROCESSING...' : 'PAY & SUBMIT VIA WALLET'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OTBApply;
