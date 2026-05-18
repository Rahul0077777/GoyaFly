import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import RefundManager from './RefundManager';
import RescheduleManager from './RescheduleManager';
import SupportTicketManager from './SupportTicketManager';

const PostBookingManager = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('REFUNDS');

    useEffect(() => {
        if (location.pathname.includes('reschedules')) {
            setActiveTab('RESCHEDULES');
        } else if (location.pathname.includes('tickets') || location.pathname.includes('requests')) {
            // Keep default or check query params if needed
            setActiveTab('REFUNDS');
        }
    }, [location.pathname]);

    const tabs = [
        { id: 'REFUNDS', label: 'Refund Requests', icon: '💸' },
        { id: 'RESCHEDULES', label: 'Reschedule Requests', icon: '🔄' },
        { id: 'TICKETS', label: 'Support Tickets', icon: '🎫' }
    ];

    return (
        <div className="w-full min-h-screen bg-[#f4f7fe] dark:bg-slate-900 p-4 md:p-10 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl sm:text-4xl font-black text-[#1D4171] dark:text-white mb-1 tracking-tight">Service Requests & Tickets</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] pl-1">Manage Refunds, Reissues & Support Tickets in one place</p>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex flex-col sm:flex-row gap-2 p-1.5 bg-white rounded-2xl shadow-sm w-full sm:w-fit border border-slate-100 overflow-x-auto scroll-thin">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-6 sm:px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-[#1D4171] text-white shadow-lg shadow-blue-900/20' 
                            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'REFUNDS' ? (
                    <RefundManager isEmbedded={true} />
                ) : activeTab === 'RESCHEDULES' ? (
                    <RescheduleManager isEmbedded={true} />
                ) : (
                    <SupportTicketManager />
                )}
            </div>
        </div>
    );
};

export default PostBookingManager;
