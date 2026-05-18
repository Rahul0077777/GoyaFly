import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';

const SubAgentManager = () => {
    const [subAgents, setSubAgents] = useState([]);
    const [stats, setStats] = useState({ totalSubAgents: 0, revenueTier2: 0 });
    const [loading, setLoading] = useState(true);
    const [filterParent, setFilterParent] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [saRes, statsRes] = await Promise.all([
                adminService.getSubAgents(),
                adminService.getSubAgentStats()
            ]);
            if (saRes.success) setSubAgents(saRes.data);
            if (statsRes.success) setStats(statsRes.data);
        } catch (err) {
            console.error('Failed to fetch sub-agent data', err);
        } finally {
            setLoading(false);
        }
    };

    const uniqueParents = [...new Set(subAgents.map(sa => sa.parentAgent?.agencyName).filter(Boolean))];

    const filteredSubAgents = filterParent 
        ? subAgents.filter(sa => sa.parentAgent?.agencyName === filterParent)
        : subAgents;

    return (
        <div className="w-full space-y-10 animate-fade-in px-4 sm:px-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2">Sub-Agent Network</h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Multi-tier distribution console</p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                      <select 
                        value={filterParent}
                        onChange={(e) => setFilterParent(e.target.value)}
                        className="w-full sm:w-64 px-6 py-3 bg-white border border-gray-100 rounded-xl font-bold text-xs shadow-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                        <option value="">Filter by Parent Agent</option>
                        {uniqueParents.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 text-center font-black text-gray-300 italic">Accessing network records...</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                                <tr>
                                    <th className="px-10 py-6">SUB-AGENT ENTITY</th>
                                    <th className="px-10 py-6">PARENT ORGANIZATION</th>
                                    <th className="px-10 py-6 text-center">MONTHLY VOLUME</th>
                                    <th className="px-10 py-6 text-center">STATUS</th>
                                    <th className="px-10 py-6 text-center">ACCESS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredSubAgents.map(s => (
                                    <tr key={s._id} className="hover:bg-primary-50/30 transition-colors group">
                                        <td className="px-10 py-8">
                                            <p className="font-black text-gray-900">{s.agentName}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {s._id.slice(-6).toUpperCase()}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="font-black text-primary-500 text-sm italic">{s.parentAgent?.agencyName || 'Direct'}</p>
                                        </td>
                                        <td className="px-10 py-8 text-center text-xl font-black text-gray-900 group-hover:text-primary-600 transition-colors">{s.monthlyVolume || 0}</td>
                                        <td className="px-10 py-8 text-center">
                                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                                s.isKycVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {s.isKycVerified ? 'Active' : 'Pending Review'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <button className="px-6 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black hover:bg-primary-500 transition-all shadow-lg hover:shadow-primary-200">VIEW DASHBOARD</button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredSubAgents.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-10 py-20 text-center font-bold text-gray-400">No sub-agents found matching the criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <div className="bg-primary-600 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] text-white flex flex-col sm:flex-row justify-between items-center gap-8 shadow-3xl shadow-primary-900/40">
                <div className="flex flex-col sm:flex-row gap-8 sm:gap-10 text-center sm:text-left">
                    <div>
                        <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">TOTAL SUB-AGENTS</p>
                        <p className="text-4xl font-black">{stats.totalSubAgents}</p>
                    </div>
                    <div className="sm:border-l border-white/20 sm:pl-10">
                        <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">REVENUE FROM TIER-2</p>
                        <p className="text-4xl font-black">₹{(stats.revenueTier2 / 100000).toFixed(1)}L</p>
                    </div>
                </div>
                <button className="w-full sm:w-auto px-10 py-5 bg-white text-primary-600 font-black rounded-2xl shadow-xl hover:scale-105 transition-all text-xs tracking-widest active:scale-95">DOWNLOAD NETWORK REPORT</button>
            </div>
        </div>
    );
};

export default SubAgentManager;
