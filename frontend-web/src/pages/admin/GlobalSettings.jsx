import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';

const GlobalSettings = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [markupValue, setMarkupValue] = useState(0);

    const fetchSettings = async () => {
        try {
            const res = await adminService.getGlobalSettings();
            if (res.success) {
                setSettings(res.data);
                setMarkupValue(res.data.defaultRefundMarkup || 0);
            }
        } catch (err) {
            console.error('Failed to fetch settings', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleToggleMaintenance = async () => {
        try {
            setUpdating(true);
            const res = await adminService.updateGlobalSettings({ maintenanceMode: !settings.maintenanceMode });
            if (res.success) setSettings(res.data);
        } catch (err) {
            toast.error('Failed to update maintenance mode');
        } finally {
            setUpdating(false);
        }
    };

    const handleToggleService = async (serviceName) => {
        try {
            setUpdating(true);
            const payload = { [serviceName]: settings[serviceName] === false ? true : false };
            const res = await adminService.updateGlobalSettings(payload);
            if (res.success) setSettings(res.data);
        } catch (err) {
            toast.error(`Failed to update service status`);
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveMarkup = async () => {
        try {
            setUpdating(true);
            const res = await adminService.updateGlobalSettings({ defaultRefundMarkup: markupValue });
            if (res.success) {
                setSettings(res.data);
                toast.success('Default Refund Markup updated successfully!');
            }
        } catch (err) {
            toast.error('Failed to update markup');
        } finally {
            setUpdating(false);
        }
    };

    const handleRegenerateKeys = async () => {
        if (!window.confirm('Are you sure? This will invalidate all current session tokens.')) return;
        try {
            setUpdating(true);
            const newToken = 'SECURE_' + Math.random().toString(36).substring(2).toUpperCase() + '_' + Date.now();
            const res = await adminService.updateGlobalSettings({ 
                apiKeys: { ...settings.apiKeys, 'Master Token': newToken } 
            });
            if (res.success) setSettings(res.data);
        } catch (err) {
            toast.error('Failed to regenerate tokens');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-black text-gray-300 italic text-xl uppercase tracking-widest animate-pulse">Syncing with Governance Layer...</div>;

    const apiStatuses = settings?.apiStatuses || {};
    const apiKeys = settings?.apiKeys || {};

    return (
        <div className="w-full max-w-5xl mx-auto space-y-10 animate-fade-in pb-20 relative">
            {updating && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-gray-900 text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl">
                        Applying Global Changes...
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4">
                <span className="text-4xl p-4 bg-gray-50 text-gray-300 rounded-3xl shadow-sm">⚙️</span>
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">System Core Settings</h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Master Control Console</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 flex flex-col justify-between group card-hover min-h-[400px]">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 mb-2 italic">Platform Mode</h3>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-10">Operational State Control</p>
                        
                        <div className={`flex items-center justify-between p-6 rounded-3xl mb-4 border transition-all duration-500 ${settings?.maintenanceMode ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100 animate-pulse'}`}>
                            <span className={`font-black text-sm tracking-widest ${settings?.maintenanceMode ? 'text-red-700' : 'text-green-700'}`}>
                                {settings?.maintenanceMode ? 'MAINTENANCE / OFFLINE' : 'LIVE / ONLINE'}
                            </span>
                            <div className={`w-12 h-6 rounded-full relative transition-all ${settings?.maintenanceMode ? 'bg-red-500' : 'bg-green-500'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings?.maintenanceMode ? 'right-1' : 'left-1'}`}></div>
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 leading-relaxed italic">
                            {settings?.maintenanceMode 
                                ? 'The platform is currently locked. Agents cannot process new bookings.' 
                                : 'Switching to Maintenance Mode will disable all agent bookings across platforms.'}
                        </p>
                    </div>
                    <button 
                        onClick={handleToggleMaintenance}
                        className={`w-full mt-10 py-5 text-white font-black rounded-2xl text-[10px] tracking-[0.3em] transition-all ${settings?.maintenanceMode ? 'bg-primary-500 hover:bg-primary-600' : 'bg-gray-900 hover:bg-red-600'}`}
                    >
                        {settings?.maintenanceMode ? 'RESTORE LIVE OPERATIONS' : 'ENABLE MAINTENANCE'}
                    </button>
                </div>

                <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 space-y-6 group card-hover min-h-[400px] flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 italic">Default Refund Markup</h3>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-8">Admin Deduction / Cancellation Fee</p>
                        
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Markup Amount (₹)</label>
                            <input 
                                type="number" 
                                value={markupValue}
                                onChange={(e) => setMarkupValue(Number(e.target.value))}
                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-500 font-black text-2xl shadow-inner"
                            />
                            <p className="text-[10px] font-bold text-gray-400 italic">
                                This amount will be automatically deducted from the airline refund before crediting the agent's wallet.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSaveMarkup}
                        className="w-full mt-6 py-5 text-white font-black rounded-2xl text-[10px] tracking-[0.3em] transition-all bg-primary-500 hover:bg-primary-600 shadow-xl shadow-primary-500/20"
                    >
                        SAVE MARKUP
                    </button>
                </div>

                <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 flex flex-col justify-between group card-hover min-h-[400px]">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 mb-2 italic">Service Toggles</h3>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-10">Enable / Disable Specific Services</p>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 bg-slate-50 hover:bg-slate-100">
                                <div>
                                    <span className="font-black text-sm text-slate-800 block">OTB Service</span>
                                    <span className="text-[10px] font-bold text-slate-500">Ok To Board access for agents</span>
                                </div>
                                <button 
                                    onClick={() => handleToggleService('otbServiceActive')}
                                    className={`w-14 h-7 rounded-full relative transition-all ${settings?.otbServiceActive === false ? 'bg-red-500' : 'bg-green-500'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${settings?.otbServiceActive === false ? 'left-1' : 'right-1'}`}></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 bg-slate-50 hover:bg-slate-100">
                                <div>
                                    <span className="font-black text-sm text-slate-800 block">Fixed Departure</span>
                                    <span className="text-[10px] font-bold text-slate-500">Group fare bookings</span>
                                </div>
                                <button 
                                    onClick={() => handleToggleService('fixedDepartureServiceActive')}
                                    className={`w-14 h-7 rounded-full relative transition-all ${settings?.fixedDepartureServiceActive === false ? 'bg-red-500' : 'bg-green-500'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${settings?.fixedDepartureServiceActive === false ? 'left-1' : 'right-1'}`}></div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 space-y-6 group card-hover min-h-[400px]">
                    <h3 className="text-xl font-black text-gray-900 italic">API Connectivity</h3>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-8">Service Integration Health</p>
                    
                    <div className="max-h-60 overflow-y-auto pr-2 no-scrollbar">
                        {Object.entries(apiStatuses).map(([name, status]) => (
                            <div key={name} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-4 rounded-xl transition-all">
                                <span className="font-black text-gray-700">{name}</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${status === 'Online' ? 'text-green-500' : 'text-orange-500'}`}>{status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 md:col-span-2 flex flex-col md:flex-row justify-between items-center gap-10 group card-hover">
                    <div className="flex-1 w-full">
                        <h3 className="text-xl font-black text-gray-900 italic mb-2">Master API Tokens</h3>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-6 leading-relaxed">System-wide authorization keys for external service providers.</p>
                        <div className="bg-gray-50 p-6 rounded-2xl font-mono text-[10px] text-gray-400 border border-gray-100 shadow-inner group-hover:text-primary-500 transition-colors overflow-x-auto whitespace-nowrap">
                            {apiKeys['Master Token'] || 'NO_TOKEN_DEFINED'}
                        </div>
                    </div>
                    <button 
                        onClick={handleRegenerateKeys}
                        className="px-10 py-5 bg-primary-500 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 hover:scale-105 transition-all text-xs tracking-widest shrink-0"
                    >
                        REGENERATE KEYS
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalSettings;
