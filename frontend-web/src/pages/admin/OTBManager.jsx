import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { otbService } from '../../services/otbService';
import { toast } from 'react-toastify';

const OTBManager = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [activeTab, setActiveTab] = useState('passengers'); // 'passengers', 'agents', 'pricing'
    const [agentRequests, setAgentRequests] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState(null);

    // --- Pricing State ---
    const [pricingList, setPricingList] = useState([]);
    const [pricingLoading, setPricingLoading] = useState(false);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [editingPricing, setEditingPricing] = useState(null);
    const [pricingFormData, setPricingFormData] = useState({
        airline: '',
        rate: '',
        group: 'A',
        isActive: true
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        if (activeTab === 'pricing' && pricingList.length === 0) {
            fetchPricing();
        }
    }, [activeTab]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await otbService.getAllRequests();
            if (res.success) setRequests(res.data);
            
            const agentRes = await otbService.getAgentAccessRequests();
            if (agentRes.success) setAgentRequests(agentRes.data);
        } catch (err) {
            console.error('Failed to fetch OTB requests', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPricing = async () => {
        try {
            setPricingLoading(true);
            const res = await otbService.getPricing(true);
            if (res.success) setPricingList(res.data);
        } catch (err) {
            console.error('Failed to fetch pricing', err);
        } finally {
            setPricingLoading(false);
        }
    };

    const openModal = (request) => {
        setSelectedRequest(request);
        setNewStatus(request.status);
        setAdminNotes(request.adminNotes || '');
    };

    const handleUpdateStatus = async () => {
        if (!selectedRequest) return;
        setUpdating(true);
        try {
            const res = await otbService.updateStatus(selectedRequest._id, { 
                status: newStatus, 
                adminNotes 
            });
            if (res.success) {
                toast.success('Status updated and notification sent!');
                setSelectedRequest(null);
                fetchRequests();
            }
        } catch (err) {
            toast.error('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateAgentAccess = async (agentId, status) => {
        const notes = prompt(`Enter notes for the agent (status will be ${status}):`);
        if (notes === null) return;
        
        setUpdating(true);
        try {
            const res = await otbService.approveAgentAccess(agentId, { 
                status, 
                adminNotes: notes 
            });
            if (res.success) {
                toast.success(`Agent access ${status.toLowerCase()} successfully!`);
                fetchRequests();
            }
        } catch (err) {
            toast.error('Failed to update agent access');
        } finally {
            setUpdating(false);
        }
    };

    const handleDownload = async (fileUrl, fileName) => {
        try {
            toast.info('Downloading document...');
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || 'document';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed', error);
            toast.error('Failed to download document');
        }
    };

    // --- Pricing Handlers ---
    const handleOpenPricingModal = (item = null) => {
        if (item) {
            setEditingPricing(item);
            setPricingFormData({
                airline: item.airline,
                rate: item.rate,
                group: item.group || 'A',
                isActive: item.isActive
            });
        } else {
            setEditingPricing(null);
            setPricingFormData({
                airline: '',
                rate: '',
                group: 'A',
                isActive: true
            });
        }
        setShowPricingModal(true);
    };

    const handleSavePricing = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            if (editingPricing) {
                await otbService.updatePricing(editingPricing._id, pricingFormData);
                toast.success('Pricing updated');
            } else {
                await otbService.createPricing(pricingFormData);
                toast.success('Pricing added');
            }
            setShowPricingModal(false);
            fetchPricing();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save pricing');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeletePricing = async (id) => {
        if (!window.confirm('Are you sure you want to delete this airline pricing?')) return;
        try {
            await otbService.deletePricing(id);
            toast.success('Pricing deleted');
            fetchPricing();
        } catch (err) {
            toast.error('Failed to delete pricing');
        }
    };

    const filteredRequests = requests.filter(r => {
        const matchesSearch = 
            r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.travelDetails.pnr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.travelDetails.contactNo.includes(searchTerm);
        
        const matchesStatus = statusFilter === '' || r.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
            case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
            case 'PROCESSING': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-orange-100 text-orange-700 border-orange-200';
        }
    };

    return (
        <div className="w-full space-y-10 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-1">OTB Control <span className="gradient-text from-[#48A0D4] to-[#F07E21]">Center</span></h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Global OK TO BOARD request management</p>
                </div>
                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('passengers')}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap ${activeTab === 'passengers' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        PASSENGER REQUESTS
                    </button>
                    <button 
                        onClick={() => setActiveTab('agents')}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap ${activeTab === 'agents' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        AGENT ACCESS ({agentRequests.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('pricing')}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap ${activeTab === 'pricing' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        AIRLINE PRICING
                    </button>
                </div>
            </div>

            {activeTab === 'passengers' ? (
                <>
                <div className="bg-white rounded-xl sm:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">

                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row gap-6 justify-between items-center bg-gray-50/30">
                    <div className="relative flex-1 w-full max-w-md">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search by Receipt, PNR or Mobile..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm shadow-sm" 
                        />
                    </div>
                    <div className="flex gap-4">
                        {['', 'PENDING', 'PROCESSING', 'APPROVED', 'REJECTED'].map((s) => (
                            <button 
                                key={s} 
                                onClick={() => setStatusFilter(s)}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${statusFilter === s ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}
                            >
                                {s || 'ALL'}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                         <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                         <p className="font-black text-gray-300 italic uppercase text-xs tracking-widest">Accessing Central Registry...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">
                                <tr>
                                    <th className="px-10 py-5">RECEIPT & AIRLINE</th>
                                    <th className="px-10 py-5">PASSENGER DETAILS</th>
                                    <th className="px-10 py-5">PNR / DATE</th>
                                    <th className="px-10 py-5">PAYMENT</th>
                                    <th className="px-10 py-5 text-center">STATUS</th>
                                    <th className="px-10 py-5 text-center">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredRequests.map(r => (
                                    <tr key={r._id} className="hover:bg-primary-50/20 transition-colors group">
                                        <td className="px-10 py-8">
                                            <p className="font-black text-gray-900 text-base flex items-center gap-2">
                                                {r.receiptNumber}
                                                {r.isUrgent && (
                                                    <span className="bg-orange-500 text-white text-[8px] px-2 py-0.5 rounded-full animate-pulse">⚡ URGENT</span>
                                                )}
                                            </p>
                                            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span> {r.airline}
                                            </p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="font-black text-gray-700">{r.passengers[0]?.firstName} {r.passengers[0]?.lastName}</p>
                                            <p className="text-[10px] font-bold text-gray-400 tracking-wider">M: {r.travelDetails.contactNo}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="font-black text-gray-900 text-base">{r.travelDetails.pnr}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(r.travelDetails.dateOfTravel).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${r.paymentStatus === 'PAID' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {r.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(r.status)}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <button 
                                                onClick={() => openModal(r)}
                                                className="px-6 py-3 bg-white border-2 border-primary-600 text-primary-600 text-[10px] font-black rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                            >
                                                REVIEW & UPDATE
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredRequests.length === 0 && (
                            <div className="p-20 text-center">
                                <span className="text-4xl filter grayscale mb-4 block">🏝️</span>
                                <p className="text-gray-400 font-black italic uppercase text-xs tracking-widest">No OTB requests found for this filter.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Detailed Review Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col md:flex-row">
                        {/* Modal Sidebar - Summary */}
                        <div className="bg-[#1D4171] p-10 md:w-80 text-white flex flex-col justify-between">
                            <div>
                                <h3 className="text-2xl font-black mb-2">{selectedRequest.receiptNumber}</h3>
                                {selectedRequest.isUrgent && (
                                    <div className="bg-orange-500 text-white p-2 rounded-xl mb-6 flex items-center justify-center gap-2 border border-orange-400">
                                        <span className="text-sm font-black">⚡ URGENT (15 MIN)</span>
                                    </div>
                                )}
                                <p className="text-white/60 font-black uppercase text-[10px] tracking-[0.2em] mb-10">Application Summary</p>
                                
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-white/40 uppercase text-[9px] font-black tracking-widest mb-1">Airline & Destination</p>
                                        <p className="font-bold">{selectedRequest.airline} → {selectedRequest.travelDetails.destination}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 uppercase text-[9px] font-black tracking-widest mb-1">PNR</p>
                                        <p className="font-bold">{selectedRequest.travelDetails.pnr}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <p className="text-white/40 uppercase text-[9px] font-black tracking-widest mb-2">Fee Breakdown</p>
                                        <div className="space-y-1 text-xs font-bold text-white/80">
                                            <div className="flex justify-between"><span>Base Fee:</span><span>₹{selectedRequest.fees.airlineFee.toFixed(2)}</span></div>
                                            <div className="flex justify-between"><span>Regional:</span><span>₹{selectedRequest.fees.surcharge.toFixed(2)}</span></div>
                                            {selectedRequest.isUrgent && (
                                                <div className="flex justify-between text-orange-400"><span>Urgent:</span><span>₹{selectedRequest.fees.urgentSurcharge.toFixed(2)}</span></div>
                                            )}
                                            <div className="flex justify-between"><span>IGST (18%):</span><span>₹{selectedRequest.fees.igst.toFixed(2)}</span></div>
                                            <div className="flex justify-between pt-2 border-t border-white/10 text-primary-400 text-lg">
                                                <span>Total:</span>
                                                <span>₹{selectedRequest.fees.totalFare.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="mt-10 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Close Viewer</button>
                        </div>

                        {/* Modal Main - Details & Action */}
                        <div className="p-10 flex-1 overflow-y-auto max-h-[90vh]">
                            <h4 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-3">
                                <span className="w-2 h-8 bg-primary-600 rounded-full"></span> 
                                Passenger Documents
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                                {Object.entries(selectedRequest.documents).map(([key, value]) => {
                                    const fileUrl = `${api.defaults.baseURL.replace('/api', '')}${value}`;
                                    const fileName = value.split('/').pop() || `${key}.pdf`;
                                    return (
                                        <div 
                                            key={key} 
                                            className="p-4 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col gap-3 hover:border-primary-300 hover:bg-primary-50 transition-all group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                                                    <p className="text-xs font-bold text-gray-600 truncate max-w-[150px]">{fileName}</p>
                                                </div>
                                                <span className="text-xl group-hover:scale-110 transition-all">📄</span>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <a 
                                                    href={fileUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex-1 text-center py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                                                >
                                                    View
                                                </a>
                                                <button 
                                                    onClick={() => handleDownload(fileUrl, fileName)}
                                                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-primary-50 border border-primary-100 rounded-lg text-[10px] font-black uppercase text-primary-600 hover:bg-primary-100 transition-all shadow-sm"
                                                >
                                                    <span>↓</span> Download
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {Object.keys(selectedRequest.documents).length === 0 && (
                                    <p className="col-span-2 text-center py-6 bg-red-50 text-red-500 font-bold rounded-2xl border border-red-100">No documents uploaded with this request.</p>
                                )}
                            </div>

                            <h4 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-secondary-500 rounded-full"></span> 
                                Update Processing
                            </h4>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Action Status</label>
                                    <select 
                                        className="w-full bg-gray-50 border-0 rounded-2xl p-4 font-bold text-gray-700 focus:ring-2 focus:ring-primary-500 shadow-inner"
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                    >
                                        <option value="PENDING">Set PENDING</option>
                                        <option value="PROCESSING">Start PROCESSING</option>
                                        <option value="APPROVED">APPROVE REQUEST</option>
                                        <option value="REJECTED">REJECT REQUEST</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Admin Remarks / Internal Notes</label>
                                    <textarea 
                                        className="w-full bg-gray-50 border-0 rounded-2xl p-4 font-bold text-gray-700 h-32 focus:ring-2 focus:ring-primary-500 shadow-inner"
                                        placeholder="Add notes for the customer (will be sent in notification)"
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={handleUpdateStatus}
                                    disabled={updating}
                                    className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-500/30 transition-all transform active:scale-95 disabled:opacity-50"
                                >
                                    {updating ? 'SYNCING DATA...' : 'UPDATE & NOTIFY CUSTOMER'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </>
        ) : activeTab === 'agents' ? (
            <div className="bg-white rounded-xl sm:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="p-8 bg-gray-50/30 border-b border-gray-100">
                        <h3 className="text-xl font-black text-gray-800">Agent Access Requests</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agents awaiting lifetime OTB access approval</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">
                                <tr>
                                    <th className="px-10 py-5">AGENT & AGENCY</th>
                                    <th className="px-10 py-5">CONTACT DETAILS</th>
                                    <th className="px-10 py-5">WALLET BALANCE</th>
                                    <th className="px-10 py-5 text-center">CURRENT STATUS</th>
                                    <th className="px-10 py-5 text-center">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {agentRequests.map(agent => (
                                    <tr key={agent._id} className="hover:bg-primary-50/20 transition-colors">
                                        <td className="px-10 py-8">
                                            <p className="font-black text-gray-900 text-base">{agent.agentName}</p>
                                            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{agent.agencyName}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="font-black text-gray-700">{agent.emailAddress}</p>
                                            <p className="text-[10px] font-bold text-gray-400 tracking-wider">M: {agent.mobileNumber}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="font-black text-gray-900">₹{agent.walletBalance.toFixed(2)}</p>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider border ${agent.otbAccessStatus === 'PENDING_APPROVAL' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                {agent.otbAccessStatus}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <div className="flex gap-3 justify-center">
                                                <button 
                                                    onClick={() => handleUpdateAgentAccess(agent._id, 'APPROVED')}
                                                    className="px-5 py-2.5 bg-green-600 text-white text-[9px] font-black rounded-xl hover:bg-green-700 transition-all shadow-md active:scale-95"
                                                >
                                                    APPROVE
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateAgentAccess(agent._id, 'REJECTED')}
                                                    className="px-5 py-2.5 bg-red-600 text-white text-[9px] font-black rounded-xl hover:bg-red-700 transition-all shadow-md active:scale-95"
                                                >
                                                    REJECT
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {agentRequests.length === 0 && (
                            <div className="p-20 text-center">
                                <span className="text-4xl filter grayscale mb-4 block">💤</span>
                                <p className="text-gray-400 font-black italic uppercase text-xs tracking-widest">No pending agent access requests.</p>
                            </div>
                        )}
                    </div>
                </div>
        ) : (
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                <div className="p-8 bg-gray-50/30 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-gray-800">Airline Pricing Configuration</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Manage dynamic OTB fees per airline</p>
                    </div>
                    <button 
                        onClick={() => handleOpenPricingModal()}
                        className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl"
                    >
                        + Add Airline
                    </button>
                </div>
                {pricingLoading ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                        <p className="font-black text-gray-300 italic uppercase text-xs tracking-widest">Loading Pricing Data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">
                                <tr>
                                    <th className="px-10 py-5">AIRLINE</th>
                                    <th className="px-10 py-5">BASE RATE (₹)</th>
                                    <th className="px-10 py-5 text-center">STATUS</th>
                                    <th className="px-10 py-5 text-center">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {pricingList.map(item => (
                                    <tr key={item._id} className="hover:bg-primary-50/20 transition-colors">
                                        <td className="px-10 py-6">
                                            <p className="font-black text-gray-900 text-base">{item.airline}</p>
                                        </td>
                                        <td className="px-10 py-6">
                                            <p className="font-black text-primary-600 text-lg">₹{item.rate}</p>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${item.isActive ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                {item.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <div className="flex gap-3 justify-center">
                                                <button 
                                                    onClick={() => handleOpenPricingModal(item)}
                                                    className="px-5 py-2.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-xl hover:bg-blue-100 transition-all"
                                                >
                                                    EDIT
                                                </button>
                                                <button 
                                                    onClick={() => handleDeletePricing(item._id)}
                                                    className="px-5 py-2.5 bg-red-50 text-red-600 text-[10px] font-black rounded-xl hover:bg-red-100 transition-all"
                                                >
                                                    DELETE
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {pricingList.length === 0 && (
                            <div className="p-20 text-center">
                                <span className="text-4xl filter grayscale mb-4 block">✈️</span>
                                <p className="text-gray-400 font-black italic uppercase text-xs tracking-widest">No airline pricing configured. Add one to get started.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* Pricing Modal */}
        {showPricingModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">{editingPricing ? 'Edit Pricing' : 'Add Airline'}</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">OTB fee configuration</p>
                        </div>
                        <button onClick={() => setShowPricingModal(false)} className="w-8 h-8 bg-white hover:bg-gray-100 shadow-sm rounded-full flex items-center justify-center font-bold text-gray-600">✕</button>
                    </div>
                    <form onSubmit={handleSavePricing} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Airline Name</label>
                            <input 
                                type="text"
                                required
                                value={pricingFormData.airline}
                                onChange={(e) => setPricingFormData({...pricingFormData, airline: e.target.value})}
                                className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold text-gray-900 placeholder:text-gray-300"
                                placeholder="e.g., SpiceJet"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Base Rate (₹)</label>
                            <input 
                                type="number"
                                required
                                min="0"
                                value={pricingFormData.rate}
                                onChange={(e) => setPricingFormData({...pricingFormData, rate: e.target.value})}
                                className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold text-gray-900 placeholder:text-gray-300"
                                placeholder="e.g., 650"
                            />
                        </div>
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                            <input 
                                type="checkbox" 
                                id="priceActive"
                                checked={pricingFormData.isActive}
                                onChange={(e) => setPricingFormData({...pricingFormData, isActive: e.target.checked})}
                                className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="priceActive" className="text-sm font-black text-gray-900">Active (Visible to Agents)</label>
                        </div>
                        <button 
                            type="submit"
                            disabled={updating}
                            className="w-full py-5 bg-gray-900 hover:bg-black text-white font-black rounded-2xl shadow-xl transition-all transform active:scale-95 disabled:opacity-50 text-[11px] tracking-widest uppercase mt-4"
                        >
                            {updating ? 'Saving...' : 'Save Pricing'}
                        </button>
                    </form>
                </div>
            </div>
        )}
        </div>
    );
};

export default OTBManager;
