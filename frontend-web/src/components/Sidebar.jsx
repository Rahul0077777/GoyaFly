import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { agentService } from '../services/api';
import { agentLinks, adminLinks } from '../config/navigation';

const Sidebar = ({ type }) => {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (type !== 'admin') {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000); // Poll every minute
      return () => clearInterval(interval);
    }
  }, [type, location.pathname]);

  const fetchUnreadCount = async () => {
    try {
      const res = await agentService.getUnreadNotificationsCount();
      if (res.success) setUnreadCount(res.count);
    } catch (err) { }
  };

  const links = type === 'admin' ? adminLinks : agentLinks;

  return (
      <aside className="hidden lg:flex relative w-60 xl:w-64 bg-gradient-to-b from-primary-700 via-primary-650 to-primary-600 h-[calc(100vh-80px)] sticky top-20 flex-col p-4 shadow-2xl z-40 text-white overflow-hidden">
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto scroll-thin pr-2">
          {links.map((link, idx) => (
            <Link
              key={link.path}
              to={link.path}
              style={{ animationDelay: `${idx * 0.05}s` }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl smooth-transition font-bold text-xs group relative overflow-hidden animate-slide-right touch-target ${
                location.pathname === link.path
                  ? 'bg-gradient-to-r from-secondary-500 to-secondary-400 text-white shadow-lg glow-secondary'
                  : 'text-primary-100 hover:bg-white/10 hover:text-white hover:shadow-md'
              }`}
            >
              {location.pathname !== link.path && (
                <div className="absolute inset-0 bg-gradient-to-r from-secondary-500/0 via-secondary-500/20 to-secondary-500/0 translate-x-[-100%] group-hover:translate-x-full smooth-transition duration-500"></div>
              )}
              <span className="text-lg relative z-10 filter drop-shadow-sm group-hover:scale-125 group-hover:rotate-12 smooth-transition flex-shrink-0">
                {link.icon}
                {link.badge && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary-500 rounded-full border-2 border-primary-700 animate-pulse shadow-lg shadow-secondary-500/50"></span>
                )}
              </span>
              <span className="relative z-10 tracking-wide truncate">{link.name}</span>
              {location.pathname === link.path && (
                <span className="ml-auto text-lg group-hover:scale-125 smooth-transition flex-shrink-0">→</span>
              )}
            </Link>
          ))}
        </div>
        
        <div className="p-4 bg-black/20 backdrop-blur-md rounded-2xl mt-auto border border-white/10 shadow-inner">
          <p className="text-[10px] font-black text-accent-300 uppercase mb-2 tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse flex-shrink-0"></span>
              Support
          </p>
          <p className="text-sm font-extrabold text-white tracking-widest">1800-GOYA-FLY</p>
        </div>
      </aside>
  );
};

export default Sidebar;
