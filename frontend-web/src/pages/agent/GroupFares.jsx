import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authService, bookingService } from '../../services/api';

const GroupFares = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        agentEmail: '',
        agentId: '',
        mobileNumber: '',
        purpose: 'Adhoc',
        journey: '',
        fromCity: '',
        toCity: '',
        departureDate: '',
        returnDate: '',
        noOfAdult: '',
        noOfChildren: '',
        noOfInfants: '',
        expectedFare: '',
        onwardFlightDetails: '',
        returnFlightDetails: '',
        remark: ''
    });

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await authService.getProfile();
                if (res.success) {
                    setForm(prev => ({
                        ...prev,
                        agentEmail: res.data.email || '',
                        agentId: res.data.agentId || res.data._id || '',
                        mobileNumber: res.data.mobile || '',
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch profile', err);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.journey || !form.fromCity || !form.toCity || !form.departureDate) {
            toast.error('Please fill all mandatory fields (Journey, City, Date).');
            return;
        }

        setSubmitting(true);
        try {
            const res = await bookingService.submitGroupFare(form);
            if (res.success) {
                toast.success('✅ Group Fare Request Submitted Successfully!');
                setTimeout(() => navigate('/agent/dashboard'), 2000);
            } else {
                toast.error(res.message || 'Failed to submit group fare.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Connection error.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
            {/* Title */}
            <div className="flex items-center gap-3">
                <span className="text-3xl p-3 bg-primary-50 rounded-2xl shadow-sm text-primary-600">👥</span>
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Group Fare Request</h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Get the best quote for your group</p>
                </div>
            </div>

            <div className="bg-white border hover:border-gray-300 p-8 rounded-[2rem] shadow-sm transition-all relative overflow-hidden">
                <div className="text-xl font-bold text-gray-800 mb-8 pb-4 border-b">
                    Get the best Group Fare quote!
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Agent Email</label>
                            <input 
                                type="email" name="agentEmail" value={form.agentEmail} readOnly 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-bold text-sm text-gray-400 shadow-inner cursor-not-allowed" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Agent ID</label>
                            <input 
                                type="text" name="agentId" value={form.agentId} readOnly 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-bold text-sm text-gray-400 shadow-inner cursor-not-allowed" 
                            />
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                            <input 
                                type="text" name="mobileNumber" value={form.mobileNumber} onChange={handleChange} required
                                className="w-full bg-white border border-gray-300 rounded-xl p-4 font-bold text-sm text-gray-800 focus:border-primary-500 outline-none transition-colors" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Purpose</label>
                            <select 
                                name="purpose" value={form.purpose} onChange={handleChange}
                                className="w-full bg-white border border-gray-300 rounded-xl p-4 font-bold text-sm text-gray-800 focus:border-primary-500 outline-none transition-colors"
                            >
                                <option value="Adhoc">Adhoc</option>
                                <option value="Series">Series</option>
                                <option value="Corporate">Corporate</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Journey</label>
                            <select 
                                name="journey" value={form.journey} onChange={handleChange} required
                                className="w-full bg-white border border-gray-300 rounded-xl p-4 font-bold text-sm text-gray-800 focus:border-primary-500 outline-none transition-colors"
                            >
                                <option value="">Choose your Journey</option>
                                <option value="One Way">One Way</option>
                                <option value="Round Trip">Round Trip</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">From City</label>
                            <input 
                                type="text" name="fromCity" value={form.fromCity} onChange={handleChange} required placeholder="From City"
                                className="w-full bg-white border border-gray-300 rounded-xl p-4 font-bold text-sm text-gray-800 focus:border-primary-500 outline-none transition-colors" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">To City</label>
                            <input 
                                type="text" name="toCity" value={form.toCity} onChange={handleChange} required placeholder="To City"
                                className="w-full bg-white border border-gray-300 rounded-xl p-4 font-bold text-sm text-gray-800 focus:border-primary-500 outline-none transition-colors" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Departure Date</label>
                            <input 
                                type="date" name="departureDate" value={form.departureDate} onChange={handleChange} required
                                className="w-full bg-white border border-gray-300 rounded-xl p-4 font-bold text-sm text-gray-800 focus:border-primary-500 outline-none transition-colors" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Return Date</label>
                            <input 
                                type="date" name="returnDate" value={form.returnDate} onChange={handleChange}
                                className="w-full bg-white border border-gray-300 rounded-xl p-4 font-bold text-sm text-gray-800 focus:border-primary-500 outline-none transition-colors" 
                            />
                        </div>
                    </div>

                    {/* Row 4 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. of Adult</label>
                            <input 
                                type="number" min="0" name="noOfAdult" value={form.noOfAdult} onChange={handleChange} required placeholder="0"
                                className="w-full bg-white border border-gray-300 rounded-xl p-4 font-bold text-sm text-gray-800 focus:border-primary-500 outline-none transition-colors" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. of Children</label>
                            <input 
                                type="number" min="0" name="noOfChildren" value={form.noOfChildren} onChange={handleChange} placeholder="0"
                                className="w-full bg-white border border-gray-300 rounded-xl p-4 font-bold text-sm text-gray-800 focus:border-primary-500 outline-none transition-colors" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. of Infants</label>
                            <input 
                                type="number" min="0" name="noOfInfants" value={form.noOfInfants} onChange={handleChange} placeholder="0"
                                className="w-full bg-white border border-gray-300 rounded-xl p-4 font-bold text-sm text-gray-800 focus:border-primary-500 outline-none transition-colors" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expected Fare per pax</label>
                            <input 
                                type="text" name="expectedFare" value={form.expectedFare} onChange={handleChange} placeholder="Eg: 12,000/-"
                                className="w-full bg-white border border-gray-300 rounded-xl p-4 font-bold text-sm text-gray-800 focus:border-primary-500 outline-none transition-colors" 
                            />
                        </div>
                    </div>

                    {/* Row 5 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Onward Flight Details</label>
                            <input 
                                type="text" name="onwardFlightDetails" value={form.onwardFlightDetails} onChange={handleChange} placeholder="Airline & flight number"
                                className="w-full bg-white border border-gray-300 rounded-xl p-4 font-bold text-sm text-gray-800 focus:border-primary-500 outline-none transition-colors" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Return Flight Details</label>
                            <input 
                                type="text" name="returnFlightDetails" value={form.returnFlightDetails} onChange={handleChange} placeholder="Airline & flight number"
                                className="w-full bg-white border border-gray-300 rounded-xl p-4 font-bold text-sm text-gray-800 focus:border-primary-500 outline-none transition-colors" 
                            />
                        </div>
                    </div>

                    {/* Row 6 */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Remark</label>
                        <textarea 
                            name="remark" value={form.remark} onChange={handleChange} placeholder="Type here" rows="3"
                            className="w-full bg-white border border-gray-300 rounded-xl p-4 font-bold text-sm text-gray-800 focus:border-primary-500 outline-none transition-colors resize-none" 
                        />
                    </div>

                    {/* Submit Area */}
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 p-6 rounded-xl border border-gray-200 mt-6 gap-6">
                        <div>
                            <h4 className="font-black text-gray-800 mb-2">Next Steps:</h4>
                            <ul className="text-xs font-bold text-gray-500 space-y-1 list-disc pl-4">
                                <li>We are getting the best quotes from Airlines - Kindly sit tight...</li>
                                <li>For more details, contact our support team.</li>
                                <li>Working Hours: Mon - Sat (11AM to 7PM)</li>
                            </ul>
                        </div>
                        <button 
                            type="submit" disabled={submitting}
                            className="w-full sm:w-auto px-12 py-4 bg-[#F07E21] hover:bg-[#d56d18] text-white font-black rounded-xl uppercase tracking-widest shadow-xl transition-all disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-white border rounded-2xl p-6 md:p-8 mt-8">
                <h3 className="font-black text-lg text-gray-800 border-b pb-4 mb-4">Important Terms & Condition</h3>
                <ul className="text-[11px] font-bold text-gray-500 space-y-2 list-disc pl-4 leading-relaxed">
                    <li>Group Fares are provided by Airlines and hence takes few hours to get one</li>
                    <li>Most of the airlines group desk does not work during weekend / national holiday</li>
                    <li>Fares are available on Immediate Closure Basis - subject to confirmation from airline head office and seat availability at the time of confirmation</li>
                    <li>Payment Terms - 100% Advance & Non Commissionable / Non Deposit Incentive / Non Turn Over Incentive etc</li>
                    <li>If GST Invoice is required, GSTIN has to be provided before booking</li>
                    <li>For certain airlines Group PNR is generated after 1 or 2 working days from payment confirmation</li>
                    <li>Passenger name should be given as per Passport / ID Proof & Group Leader Direct Contact Number is compulsory while providing Name List</li>
                    <li>ADM, if raised for any reason by the Airlines, will be charged to the Agency Account</li>
                    <li>We are not liable for Visa/Immigration, Vaccination, any Travel Documents, OK to BOARD etc would be your responsibility, should it be a requirement</li>
                    <li>Please ensure in case of any discrepancy to revert us immediately(within 2 hours), else it will be considered in line with the requirements and any change will be done as per current flight condition with applicable charge. By completing and submitting this form you agree to the terms and conditions.</li>
                </ul>
            </div>
        </div>
    );
};

export default GroupFares;
