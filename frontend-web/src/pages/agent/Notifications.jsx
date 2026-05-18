import React, { useState, useEffect } from 'react';
import { agentService } from '../../services/api';

const Notifications = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await agentService.getNotifications();
            if (res.success) {
                setAlerts(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await agentService.markNotificationRead(id);
            setAlerts(alerts.map(a => a._id === id ? {...a, isRead: true} : a));
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await agentService.deleteNotification(id);
            setAlerts(alerts.filter(a => a._id !== id));
        } catch (err) {
            console.error('Failed to delete notification', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            // Ideally a bulk API, but for now UI update
            setAlerts(alerts.map(a => ({...a, isRead: true})));
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 md:space-y-10 animate-fade-in px-3 sm:px-4 md:px-6">
            <div className="flex flex-col xs:flex-row justify-between items-start xs:items-end gap-3 xs:gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-1 sm:mb-2">Notification Center</h2>
                    <p className="text-gray-400 font-bold uppercase text-[8px] sm:text-[9px] md:text-[10px] tracking-widest">System alerts & announcements</p>
                </div>
                <button 
                    onClick={handleMarkAllAsRead}
                    className="text-primary-500 font-black text-xs sm:text-sm md:text-base uppercase tracking-widest hover:underline whitespace-nowrap"
                >
                    Mark all as read
                </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
                {loading ? (
                    <div className="p-20 text-center font-black text-gray-300 italic">Checking for new alerts...</div>
                ) : alerts.length === 0 ? (
                    <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">No notifications found</div>
                ) : (
                    alerts.map(a => (
                        <div 
                            key={a._id} 
                            onClick={() => !a.isRead && handleMarkAsRead(a._id)}
                            className={`bg-white p-5 sm:p-6 md:p-8 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[2.5rem] shadow-xl border-l-4 sm:border-l-6 md:border-l-8 transition-all cursor-pointer card-hover flex flex-col xs:flex-row gap-4 sm:gap-6 md:gap-8 xs:items-center ${
                                !a.isRead ? 'shadow-primary-500/5 ring-1 ring-primary-500/10' : 'opacity-60 grayscale-[0.5]'
                            } ${
                                a.type?.toLowerCase() === 'success' ? 'border-green-500' : 
                                a.type?.toLowerCase() === 'warning' ? 'border-orange-500' : 
                                a.type?.toLowerCase() === 'alert' ? 'border-secondary-500' : 'border-primary-500'
                            }`}
                        >
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-lg md:rounded-2xl flex items-center justify-center text-lg sm:text-xl md:text-2xl shadow-inner flex-shrink-0 ${
                                 a.type?.toLowerCase() === 'success' ? 'bg-green-50 text-green-500' : 
                                 a.type?.toLowerCase() === 'warning' ? 'bg-orange-50 text-orange-500' : 
                                 a.type?.toLowerCase() === 'alert' ? 'bg-secondary-50 text-secondary-500' : 'bg-primary-50 text-primary-500'
                            }`}>
                                {a.type?.toLowerCase() === 'success' ? '✓' : a.type?.toLowerCase() === 'warning' ? '!' : a.type?.toLowerCase() === 'alert' ? '🔔' : 'ℹ'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col xs:flex-row justify-between xs:items-center gap-1 xs:gap-2 mb-1 sm:mb-2">
                                    <h3 className="text-base sm:text-lg md:text-xl font-black text-gray-900">{a.title}</h3>
                                    <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{new Date(a.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-500 font-medium leading-relaxed text-xs sm:text-sm md:text-base">{a.message}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {!a.isRead ? (
                                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-primary-500 rounded-full animate-pulse shadow-lg shadow-primary-500/50"></div>
                                ) : (
                                    <button 
                                        onClick={(e) => handleDelete(e, a._id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="Delete notification"
                                    >
                                        <span className="text-2xl font-bold leading-none">&times;</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="text-center py-12 sm:py-16 md:py-20">
                <button className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-gray-900 text-white font-black rounded-lg sm:rounded-lg md:rounded-2xl shadow-2xl hover:bg-primary-500 transition-all text-xs sm:text-sm md:text-base tracking-widest">LOAD OLDER ALERTS</button>
            </div>
        </div>
    );
};

export default Notifications;
