import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';

const AgentManager = () => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isKycModalOpen, setIsKycModalOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [editFormData, setEditFormData] = useState({
        agentName: '',
        agencyName: '',
        emailAddress: '',
        mobileNumber: '',
        gstNumber: '',
        address: ''
    });

    const [addFormData, setAddFormData] = useState({
        agentName: '',
        agencyName: '',
        emailAddress: '',
        mobileNumber: '',
        password: '',
        gstNumber: '',
        address: ''
    });

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await adminService.getAgents();
            if (res.success) setAgents(res.data);
        } catch (err) {
            console.error('Failed to fetch agents', err);
            setError('Could not connect to server. Please check your internet or try logging in again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKycReviewClick = (agent) => {
        setSelectedAgent(agent);
        setIsKycModalOpen(true);
        setRejectReason('');
    };

    const handleKycDecision = async (status) => {
        if (status === 'REJECTED' && !rejectReason) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        const confirmMsg = status === 'APPROVED' ? 'Approve this agent?' : 'Reject this agent?';
        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await adminService.updateKyc(selectedAgent._id, { status, reason: rejectReason });
            if (res.success) {
                toast.success(res.message);
                setIsKycModalOpen(false);
                fetchAgents();
            }
        } catch (err) {
            toast.error(`Failed to ${status.toLowerCase()} agent`);
        }
    };

    const handleToggleBlock = async (agent) => {
        const action = agent.isBlocked ? 'unblock' : 'block';
        if (!window.confirm(`Are you sure you want to ${action} this agent?`)) return;
        try {
            const res = await adminService.toggleBlockAgent(agent._id);
            if (res.success) {
                toast.success(res.message);
                fetchAgents();
            }
        } catch (err) {
            toast.error(`Failed to ${action} agent`);
        }
    };

    const handleEditClick = (agent) => {
        setSelectedAgent(agent);
        setEditFormData({
            agentName: agent.agentName || '',
            agencyName: agent.agencyName || '',
            emailAddress: agent.emailAddress || '',
            mobileNumber: agent.mobileNumber || '',
            gstNumber: agent.gstNumber || '',
            address: agent.address || ''
        });
        setIsEditModalOpen(true);
        setLogoFile(null); // Reset file selection
    };

    const handleUpdateAgent = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            Object.keys(editFormData).forEach(key => {
                formData.append(key, editFormData[key]);
            });
            if (logoFile) {
                formData.append('logo', logoFile);
            }

            const res = await adminService.updateAgent(selectedAgent._id, formData);
            if (res.success) {
                toast.success(res.message);
                setIsEditModalOpen(false);
                fetchAgents();
            }
        } catch (err) {
            toast.error('Failed to update agent');
        }
    };

    const handleCreateAgent = async (e) => {
        e.preventDefault();
        try {
            const res = await adminService.createAgent(addFormData);
            if (res.success) {
                toast.success(res.message);
                setIsAddModalOpen(false);
                setAddFormData({
                    agentName: '',
                    agencyName: '',
                    emailAddress: '',
                    mobileNumber: '',
                    password: '',
                    gstNumber: '',
                    address: ''
                });
                fetchAgents();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create agent');
        }
    };

    const filteredAgents = agents.filter(a => 
        a.agentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.emailAddress.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full space-y-6 sm:space-y-8 md:space-y-10 animate-fade-in px-3 sm:px-4 md:px-6">
            <div className="flex flex-col xs:flex-row justify-between items-start xs:items-end gap-3 xs:gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-1 sm:mb-2">Agent Management</h2>
                    <p className="text-gray-400 font-bold uppercase text-[8px] sm:text-[9px] md:text-[10px] tracking-widest">Network control center</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gray-900 text-white font-black rounded-lg sm:rounded-lg md:rounded-2xl shadow-xl hover:bg-primary-500 transition-all transform hover:scale-105 active:scale-95 text-xs sm:text-sm md:text-base tracking-widest whitespace-nowrap">
                    + ADD NEW PARTNER
                </button>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                <div className="p-5 sm:p-6 md:p-8 lg:p-10 border-b border-gray-50 flex flex-col md:flex-row gap-4 sm:gap-5 md:gap-6 justify-between items-start md:items-center bg-gray-50/30">
                    <div className="relative flex-1 w-full max-w-xs md:max-w-md">
                        <span className="absolute left-3 sm:left-4 md:left-5 lg:left-6 top-1/2 -translate-y-1/2 text-gray-400 text-lg sm:text-xl">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search by Agency, Email..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 sm:pl-12 md:pl-14 pr-4 sm:pr-5 md:pr-6 py-2.5 sm:py-3 md:py-4 bg-white rounded-lg sm:rounded-lg md:rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-xs sm:text-sm md:text-base shadow-sm" 
                        />
                    </div>
                    <div className="flex gap-2 sm:gap-3 md:gap-4">
                        <select className="px-3 sm:px-4 md:px-5 lg:px-6 py-2.5 sm:py-3 md:py-4 bg-white rounded-lg sm:rounded-lg md:rounded-2xl border-0 font-bold text-xs sm:text-sm md:text-base text-gray-500 shadow-sm focus:ring-2 focus:ring-primary-500">
                            <option>All Status</option>
                            <option>Approved</option>
                            <option>Pending</option>
                        </select>
                    </div>
                </div>
                
                {loading ? (
                    <div className="p-12 sm:p-16 md:p-20 text-center font-black text-gray-300 italic text-sm md:text-base">Synchronizing Data...</div>
                ) : (
                    <div className="overflow-x-auto scroll-thin">
                        <table className="w-full text-left min-w-max md:min-w-full">
                            <thead className="bg-gray-50/50 text-[8px] sm:text-[9px] md:text-[10px] uppercase font-black text-gray-400 tracking-widest">
                                <tr>
                                    <th className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 md:py-6">Agent ID</th>
                                    <th className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 md:py-6">Agency & Location</th>
                                    <th className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 md:py-6">Contact info</th>
                                    <th className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 md:py-6">KYC Status</th>
                                    <th className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 md:py-6 text-right">Wallet</th>
                                    <th className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 md:py-6 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredAgents.map(a => (
                                    <tr key={a._id} className="hover:bg-primary-50/30 transition-colors group">
                                        <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-5 md:py-6">
                                            <span className="px-2.5 py-1.5 bg-gray-900 text-white text-[10px] font-black rounded-lg shadow-sm">{a.agentCode || 'PENDING'}</span>
                                        </td>
                                        <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-5 md:py-6">
                                            <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg sm:rounded-lg md:rounded-xl flex items-center justify-center text-sm sm:text-base md:text-lg md:text-xl font-black text-gray-300 group-hover:bg-primary-100 group-hover:text-primary-500 transition-colors flex-shrink-0 overflow-hidden">
                                                    {a.logo ? (
                                                        <img src={`http://localhost:5000${a.logo}`} alt="Logo" className="w-full h-full object-contain p-1" />
                                                    ) : (
                                                        a.agentName.substring(0,1)
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-gray-900 text-xs sm:text-sm md:text-base truncate">{a.agentName}</p>
                                                    <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{a.agencyName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-5 md:py-6 text-xs sm:text-sm md:text-base font-bold text-gray-600">{a.emailAddress}</td>
                                        <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-5 md:py-6">
                                            {a.kycStatus === 'APPROVED' ? (
                                                <span className="px-2 sm:px-3 md:px-4 md:px-5 py-1 sm:py-1 md:py-2 rounded-lg sm:rounded-lg md:rounded-xl text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-700 shadow-sm whitespace-nowrap">
                                                    ✓ Verified
                                                </span>
                                            ) : a.kycStatus === 'REJECTED' ? (
                                                <button 
                                                    onClick={() => handleKycReviewClick(a)}
                                                    className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white transition-all">
                                                    REJECTED (View)
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleKycReviewClick(a)}
                                                    className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm border border-orange-100 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white hover:shadow-xl hover:shadow-orange-200 transform hover:scale-105 active:scale-95 whitespace-nowrap">
                                                    REVIEW KYC
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-5 md:py-6 text-right font-black text-gray-900 text-xs sm:text-sm md:text-base border-r border-transparent group-hover:border-primary-100 transition-colors">₹{a.walletBalance.toLocaleString()}</td>
                                        <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-5 md:py-6 text-center">
                                            <div className="flex justify-center gap-1 sm:gap-2">
                                                <button 
                                                    onClick={() => handleEditClick(a)}
                                                    className="p-2 sm:p-2 md:p-3 bg-gray-50 hover:bg-primary-50 text-gray-400 hover:text-primary-500 rounded-lg sm:rounded-lg md:rounded-xl transition-all text-base sm:text-lg">⚙️</button>
                                                <button 
                                                    onClick={() => handleToggleBlock(a)}
                                                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm border whitespace-nowrap transform hover:scale-105 active:scale-95 ${a.isBlocked ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white hover:shadow-xl hover:shadow-green-200' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white hover:shadow-xl hover:shadow-red-200'}`}
                                                >
                                                    {a.isBlocked ? 'UNBLOCK' : 'BLOCK'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">Agent Settings</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configure partner account</p>
                            </div>
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm text-gray-400 hover:text-red-500 transition-colors font-bold">✕</button>
                        </div>
                        <form onSubmit={handleUpdateAgent} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Agent Name</label>
                                    <input 
                                        type="text" 
                                        value={editFormData.agentName}
                                        onChange={(e) => setEditFormData({...editFormData, agentName: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm shadow-inner" 
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Agency Name</label>
                                    <input 
                                        type="text" 
                                        value={editFormData.agencyName}
                                        onChange={(e) => setEditFormData({...editFormData, agencyName: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm shadow-inner" 
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input 
                                    type="email" 
                                    value={editFormData.emailAddress}
                                    onChange={(e) => setEditFormData({...editFormData, emailAddress: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm shadow-inner" 
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                    <input 
                                        type="text" 
                                        value={editFormData.mobileNumber}
                                        onChange={(e) => setEditFormData({...editFormData, mobileNumber: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm shadow-inner" 
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GST Number</label>
                                    <input 
                                        type="text" 
                                        value={editFormData.gstNumber}
                                        onChange={(e) => setEditFormData({...editFormData, gstNumber: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm shadow-inner" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Address</label>
                                <textarea 
                                    value={editFormData.address}
                                    onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm shadow-inner h-24 resize-none" 
                                    required
                                ></textarea>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Update Brand Logo (Admin Only)</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => setLogoFile(e.target.files[0])}
                                        className="hidden" 
                                        id="logo-upload"
                                    />
                                    <label htmlFor="logo-upload" className="px-6 py-3 bg-primary-50 text-primary-600 font-black rounded-xl text-[10px] uppercase tracking-widest cursor-pointer hover:bg-primary-500 hover:text-white transition-all border-2 border-dashed border-primary-100 flex-1 text-center">
                                        {logoFile ? logoFile.name : 'Choose New Logo Image'}
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all text-xs tracking-widest">
                                    CANCEL
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-primary-500 transition-all text-xs tracking-widest shadow-lg shadow-gray-200">
                                    SAVE CHANGES
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Agent Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">Add New Partner</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Create a new agent account</p>
                            </div>
                            <button 
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm text-gray-400 hover:text-red-500 transition-colors font-bold">✕</button>
                        </div>
                        <form onSubmit={handleCreateAgent} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto scroll-thin">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Agent Name</label>
                                    <input 
                                        type="text" 
                                        value={addFormData.agentName}
                                        onChange={(e) => setAddFormData({...addFormData, agentName: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm shadow-inner" 
                                        placeholder="Full Name"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Agency Name</label>
                                    <input 
                                        type="text" 
                                        value={addFormData.agencyName}
                                        onChange={(e) => setAddFormData({...addFormData, agencyName: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm shadow-inner" 
                                        placeholder="Agency Name"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <input 
                                        type="email" 
                                        value={addFormData.emailAddress}
                                        onChange={(e) => setAddFormData({...addFormData, emailAddress: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm shadow-inner" 
                                        placeholder="email@example.com"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                    <input 
                                        type="text" 
                                        value={addFormData.mobileNumber}
                                        onChange={(e) => setAddFormData({...addFormData, mobileNumber: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm shadow-inner" 
                                        placeholder="Phone Number"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                                    <input 
                                        type="password" 
                                        value={addFormData.password}
                                        onChange={(e) => setAddFormData({...addFormData, password: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm shadow-inner" 
                                        placeholder="Min 6 characters"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GST Number</label>
                                    <input 
                                        type="text" 
                                        value={addFormData.gstNumber}
                                        onChange={(e) => setAddFormData({...addFormData, gstNumber: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm shadow-inner" 
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Address</label>
                                <textarea 
                                    value={addFormData.address}
                                    onChange={(e) => setAddFormData({...addFormData, address: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 font-bold text-sm shadow-inner h-20 resize-none" 
                                    placeholder="Business Address"
                                    required
                                ></textarea>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all text-xs tracking-widest">
                                    CANCEL
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-primary-500 transition-all text-xs tracking-widest shadow-lg shadow-gray-200">
                                    CREATE ACCOUNT
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* KYC Review Modal */}
            {isKycModalOpen && selectedAgent && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">Document Verification</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                    Reviewing: {selectedAgent.agentName} ({selectedAgent.agencyName}) | 📧 {selectedAgent.emailAddress} | 📱 {selectedAgent.mobileNumber}
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsKycModalOpen(false)}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-xl text-gray-400 hover:text-red-500 transition-all font-bold">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Doc 1: Aadhar Front */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">1. Aadhar Front</h4>
                                    <div className="aspect-video bg-white rounded-3xl overflow-hidden border-4 border-white shadow-xl hover:shadow-2xl transition-all group relative">
                                        <img 
                                            src={`http://localhost:5000${selectedAgent.kycDocuments?.aadharFront}`} 
                                            className="w-full h-full object-contain cursor-zoom-in" 
                                            alt="Aadhar Front"
                                            onClick={() => window.open(`http://localhost:5000${selectedAgent.kycDocuments?.aadharFront}`, '_blank')}
                                        />
                                    </div>
                                </div>

                                {/* Doc 2: Aadhar Back */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">2. Aadhar Back</h4>
                                    <div className="aspect-video bg-white rounded-3xl overflow-hidden border-4 border-white shadow-xl hover:shadow-2xl transition-all group relative">
                                        <img 
                                            src={`http://localhost:5000${selectedAgent.kycDocuments?.aadharBack}`} 
                                            className="w-full h-full object-contain cursor-zoom-in" 
                                            alt="Aadhar Back"
                                            onClick={() => window.open(`http://localhost:5000${selectedAgent.kycDocuments?.aadharBack}`, '_blank')}
                                        />
                                    </div>
                                </div>

                                {/* Doc 3: PAN Card */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">3. PAN Card</h4>
                                    <div className="aspect-video bg-white rounded-3xl overflow-hidden border-4 border-white shadow-xl hover:shadow-2xl transition-all group relative">
                                        <img 
                                            src={`http://localhost:5000${selectedAgent.kycDocuments?.panCard}`} 
                                            className="w-full h-full object-contain cursor-zoom-in" 
                                            alt="PAN Card"
                                            onClick={() => window.open(`http://localhost:5000${selectedAgent.kycDocuments?.panCard}`, '_blank')}
                                        />
                                    </div>
                                </div>

                                {/* Doc 4: Professional Proof */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">4. {selectedAgent.kycDocuments?.shopDoc?.category}</h4>
                                    <div className="aspect-video bg-white rounded-3xl overflow-hidden border-4 border-white shadow-xl hover:shadow-2xl transition-all group relative">
                                        <img 
                                            src={`http://localhost:5000${selectedAgent.kycDocuments?.shopDoc?.url}`} 
                                            className="w-full h-full object-contain cursor-zoom-in" 
                                            alt="Business Proof"
                                            onClick={() => window.open(`http://localhost:5000${selectedAgent.kycDocuments?.shopDoc?.url}`, '_blank')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-100 bg-white">
                            {selectedAgent.kycStatus === 'APPROVED' ? (
                                <p className="text-center font-black text-green-500 uppercase tracking-widest">✓ Documents Verified & Approved</p>
                            ) : (
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rejection Reason (if rejecting)</label>
                                        <textarea 
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="e.g. Aadhar front image is blurry, please re-upload."
                                            className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-red-500 focus:bg-white font-bold text-sm outline-none transition-all h-20 resize-none"
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end w-full sm:w-auto">
                                        <button 
                                            onClick={() => handleKycDecision('REJECTED')}
                                            className="px-8 py-5 bg-red-50 text-red-600 font-black rounded-2xl border-2 border-red-100 hover:bg-red-600 hover:text-white transition-all uppercase text-xs tracking-widest shadow-lg shadow-red-100 touch-target w-full sm:w-auto">
                                            Reject Documents
                                        </button>
                                        <button 
                                            onClick={() => handleKycDecision('APPROVED')}
                                            className="px-8 py-5 bg-green-500 text-white font-black rounded-2xl shadow-xl shadow-green-200 hover:bg-green-600 transition-all uppercase text-xs tracking-widest transform hover:scale-105 active:scale-95 leading-none touch-target w-full sm:w-auto">
                                            Approve & Verify
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentManager;
