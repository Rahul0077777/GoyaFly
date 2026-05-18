import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService, adminService, walletService } from '../services/api';
import goyaflyLogo from '../assets/goyafly_logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAdmin = location.pathname.startsWith('/admin');
  const isAgent = location.pathname.startsWith('/agent');

  const agentLinks = [
    { name: 'Dashboard', path: '/agent/dashboard', icon: '📊' },
    { name: 'Flight Search', path: '/agent/flight-search', icon: '✈️' },
    { name: 'Hotel Search', path: '/agent/hotel-search', icon: '🏨' },
    { name: 'Bus & Train', path: '/agent/surface-transport', icon: '🚌' },
    { name: 'Holidays', path: '/agent/holidays', icon: '🏝️' },
    { name: 'Visa & Insure', path: '/agent/visa-insurance', icon: '🛡️' },
    { name: 'My Wallet', path: '/agent/wallet', icon: '💰' },
    { name: 'Notifications', path: '/agent/notifications', icon: '🔔' },
    { name: 'Support Tickets', path: '/agent/tickets', icon: '🎫' },
    { name: 'My Profile', path: '/agent/profile', icon: '👤' },
  ];

  const adminLinks = [
    { name: 'Overview', path: '/admin/dashboard', icon: '🏠' },
    { name: 'OTB Requests', path: '/admin/otb', icon: '📑' },
    { name: 'Promotions', path: '/admin/promotions', icon: '📢' },
    { name: 'Agent Manager', path: '/admin/agents', icon: '👥' },
    { name: 'Sub-Agents', path: '/admin/sub-agents', icon: '🌳' },
    { name: 'Bookings', path: '/admin/bookings', icon: '🎟️' },
    { name: 'Commissions', path: '/admin/commissions', icon: '📈' },
    { name: 'Tax Config', path: '/admin/tax-config', icon: '⚖️' },
    { name: 'Campaigns', path: '/admin/offers', icon: '🏷️' },
    { name: 'Analytics', path: '/admin/reports', icon: '📊' },
    { name: 'Global Settings', path: '/admin/settings', icon: '⚙️' },
  ];
  const [walletBalance, setWalletBalance] = useState(0);
  const [agentInfo, setAgentInfo] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    if (isAgent) {
      const info = JSON.parse(localStorage.getItem('agentInfo') || '{}');
      setAgentInfo(info);

      const fetchBalance = async () => {
        try {
          const res = await walletService.getBalance();
          if (res.success) setWalletBalance(res.balance);
        } catch (err) {
          console.error('Failed to fetch balance for navbar', err);
        }
      };
      
      fetchBalance();

      const handleWalletUpdate = () => fetchBalance();
      const handleStorageUpdate = () => {
        const updatedInfo = JSON.parse(localStorage.getItem('agentInfo') || '{}');
        setAgentInfo(updatedInfo);
      };

      window.addEventListener('walletUpdated', handleWalletUpdate);
      window.addEventListener('storage', handleStorageUpdate);
      
      return () => {
        window.removeEventListener('walletUpdated', handleWalletUpdate);
        window.removeEventListener('storage', handleStorageUpdate);
      };
    }
  }, [isAgent]);

  return (
    <nav className={`sticky top-0 z-50 w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex justify-between items-center border-b backdrop-blur-2xl smooth-transition touch-target ${
      isHome ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border-primary-500 shadow-lg' : 'bg-white/80 dark:bg-slate-900/80 text-gray-900 dark:text-white border-gray-100 dark:border-slate-800 shadow-sm'
    }`}>
      <Link to="/" className="flex items-center group flex-shrink-0">
        <div className="bg-white rounded-2xl px-3 py-1.5 shadow-md group-hover:shadow-lg group-hover:scale-105 smooth-transition border border-white/60">
          <img
            src={goyaflyLogo}
            alt="Goyafly"
            className="h-11 sm:h-14 w-auto object-contain"
            style={{ maxWidth: '180px' }}
          />
        </div>
      </Link>

      <div className="hidden lg:flex items-center gap-6 lg:gap-8">
        <button onClick={toggleTheme} className={`p-2 rounded-full smooth-transition hover:scale-110 active:scale-95 ${isHome ? 'text-white hover:bg-white/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        {!isAdmin && !isAgent && (
          <>
            <div className="flex items-center gap-3">
              <Link to="/" className="px-5 lg:px-7 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-black smooth-transition transform hover:scale-105 active:scale-95 shadow-lg touch-target bg-gradient-to-r from-[#F07E21] to-[#FF9F43] text-white hover:shadow-xl hover:shadow-orange-500/40 relative overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] smooth-transition duration-500"></span>
                <span className="relative">🏠 HOME</span>
              </Link>
              <Link to="/about" className="px-5 lg:px-7 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-black smooth-transition transform hover:scale-105 active:scale-95 shadow-lg touch-target bg-gradient-to-r from-[#F07E21] to-[#FF9F43] text-white hover:shadow-xl hover:shadow-orange-500/40 relative overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] smooth-transition duration-500"></span>
                <span className="relative">ℹ️ ABOUT</span>
              </Link>
              <Link to="/contact" className="px-5 lg:px-7 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-black smooth-transition transform hover:scale-105 active:scale-95 shadow-lg touch-target bg-gradient-to-r from-[#F07E21] to-[#FF9F43] text-white hover:shadow-xl hover:shadow-orange-500/40 relative overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] smooth-transition duration-500"></span>
                <span className="relative">💬 SUPPORT</span>
              </Link>
              <Link to="/login" className="px-5 lg:px-7 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-black smooth-transition transform hover:scale-105 active:scale-95 shadow-lg touch-target bg-gradient-to-r from-[#F07E21] to-[#FF9F43] text-white hover:shadow-xl hover:shadow-orange-500/40 relative overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] smooth-transition duration-500"></span>
                <span className="relative">🔐 LOGIN</span>
              </Link>
              <Link to="/register" className="px-5 lg:px-7 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-black smooth-transition transform hover:scale-105 active:scale-95 shadow-lg touch-target bg-gradient-to-r from-[#F07E21] to-[#FF9F43] text-white hover:shadow-xl hover:shadow-orange-500/40 relative overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] smooth-transition duration-500"></span>
                <span className="relative">🚀 REGISTER</span>
              </Link>
            </div>
          </>
        )}
        
        {isAgent && (
          <div className="relative">
            <div 
              onClick={() => setShowAgentDropdown(!showAgentDropdown)} 
              className={`flex items-center gap-3 lg:gap-4 px-3 lg:px-5 py-2 rounded-xl lg:rounded-2xl smooth-transition cursor-pointer group border ${
                showAgentDropdown ? 'bg-primary-600 text-white border-primary-500 shadow-lg' : 'bg-gray-100 hover:bg-gray-200 border-transparent'
              }`}
            >
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-black uppercase tracking-widest ${showAgentDropdown ? 'text-primary-100' : 'text-gray-500'}`}>Balance</span>
                <span className={`font-black text-xs lg:text-sm ${showAgentDropdown ? 'text-white' : 'text-gray-800'}`}>₹{walletBalance.toLocaleString('en-IN')}</span>
              </div>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg smooth-transition ${showAgentDropdown ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                👤
              </div>
              <span className={`smooth-transition text-[10px] ${showAgentDropdown ? 'rotate-180' : ''}`}>▼</span>
            </div>

            {/* Agent Account Dropdown */}
            {showAgentDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAgentDropdown(false)}></div>
                <div className="absolute right-0 top-full mt-3 w-72 bg-slate-900 shadow-2xl rounded-3xl overflow-hidden animate-slide-up origin-top-right z-50 border border-white/10 ring-1 ring-black/20">
                  {/* Dropdown Header */}
                  <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-white/5">
                    <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] mb-1">Kind Attention</p>
                    <h3 className="text-white font-black text-lg mb-4 truncate">{agentInfo?.agencyName || agentInfo?.agentName || 'Goyafly.com'}</h3>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Current Balance</p>
                      <p className="text-white text-xl font-black">₹{walletBalance.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Dropdown Links */}
                  <div className="p-4 space-y-1">
                    {[
                      { name: 'My Bookings', path: '/agent/history', icon: '🎟️' },
                      { name: 'Statement', path: '/agent/ledger', icon: '📒' },
                      { name: 'My Refunds', path: '/agent/my-refunds', icon: '🔄' },
                      { name: 'Group Fares', path: '/agent/group-fares', icon: '👥' },
                      { name: 'My Profile', path: '/agent/profile', icon: '👤' },
                      { name: 'Calendar', path: '/agent/calendar', icon: '📅' },
                    ].map(item => (
                      <Link 
                        key={item.path} 
                        to={item.path} 
                        onClick={() => setShowAgentDropdown(false)}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 smooth-transition text-xs font-bold"
                      >
                        <span className="text-lg grayscale group-hover:grayscale-0">{item.icon}</span>
                        {item.name}
                      </Link>
                    ))}
                  </div>

                  {/* Logout Area */}
                  <div className="p-3 bg-white/5">
                    <button 
                      onClick={() => { authService.agentLogout(); navigate('/'); setShowAgentDropdown(false); }} 
                      className="w-full py-4 bg-secondary-500/10 hover:bg-secondary-500/20 text-secondary-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                      Logout Session
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {isAdmin && (
          <>
            <span className="px-2 lg:px-3 py-1 lg:py-1.5 bg-secondary-50 text-secondary-700 text-[9px] lg:text-[10px] font-black rounded-lg uppercase tracking-wider shadow-sm">Admin</span>
            <button onClick={() => { adminService.adminLogout(); navigate('/'); }} className="text-xs lg:text-sm font-bold text-gray-600 hover:text-secondary-500 smooth-transition">Logout</button>
          </>
        )}
      </div>

      {/* Mobile Menu Toggle Content */}
      <div className="flex items-center gap-2 lg:hidden">
        <button onClick={toggleTheme} className={`p-2 rounded-full text-xl focus:outline-none smooth-transition hover:scale-110 active:scale-95 touch-target ${isHome ? 'text-white hover:bg-white/20' : 'text-primary-600 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-slate-800'}`}>
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        <button 
            className={`p-2.5 sm:p-3 rounded-lg text-2xl focus:outline-none smooth-transition hover:scale-110 active:scale-95 touch-target ${isHome ? 'text-white hover:bg-white/20' : 'text-primary-600 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-slate-800'}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
            {isMobileMenuOpen ? '✖' : '☰'}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-[56px] sm:top-[65px] left-0 w-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col items-stretch py-4 px-4 border-t border-gray-100 dark:border-slate-800 lg:hidden animate-slide-down origin-top max-h-[calc(100vh-60px)] overflow-y-auto z-50">
          {!isAdmin && !isAgent && (
            <div className="flex flex-col gap-2">
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/" className="flex items-center gap-3 text-base font-bold text-gray-800 dark:text-gray-200 hover:text-primary-500 smooth-transition px-4 py-3.5 touch-target rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800">
                <span className="text-lg">🏠</span> Home
              </Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/about" className="flex items-center gap-3 text-base font-bold text-gray-800 dark:text-gray-200 hover:text-primary-500 smooth-transition px-4 py-3.5 touch-target rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800">
                <span className="text-lg">ℹ️</span> About
              </Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/contact" className="flex items-center gap-3 text-base font-bold text-gray-800 dark:text-gray-200 hover:text-primary-500 smooth-transition px-4 py-3.5 touch-target rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800">
                <span className="text-lg">💬</span> Support
              </Link>
              <div className="border-t border-gray-100 dark:border-slate-700 my-2"></div>
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/login" className="w-full text-center px-4 py-3.5 rounded-xl text-base font-black bg-gradient-to-r from-[#F07E21] to-[#FF9F43] text-white hover:shadow-lg hover:shadow-orange-500/40 smooth-transition touch-target uppercase tracking-wide shadow-md">
                🔐 Agent Login
              </Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/register" className="w-full text-center px-4 py-3.5 rounded-xl text-base font-black bg-gradient-to-r from-[#F07E21] to-[#FF9F43] text-white hover:shadow-lg hover:shadow-orange-500/40 smooth-transition touch-target uppercase tracking-wide shadow-md">
                🚀 Register Now
              </Link>
            </div>
          )}
          
          {isAgent && (
            <div className="flex flex-col gap-1 w-full pb-4">
              <div onClick={() => { setIsMobileMenuOpen(false); navigate('/agent/wallet'); }} className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg w-full cursor-pointer touch-target hover:bg-gray-100 mb-3">
                <span className="text-xs font-black text-gray-400">WALLET:</span>
                <span className="text-base font-black text-primary-600">₹{walletBalance.toLocaleString('en-IN')}</span>
              </div>
              
              {/* Agent Menu Options Sliding List */}
              <div className="flex flex-col gap-1 border-t border-gray-50 pt-2 mb-3">
                {agentLinks.map(link => (
                  <Link key={link.path} onClick={() => setIsMobileMenuOpen(false)} to={link.path} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg touch-target">
                    <span className="text-lg">{link.icon}</span> {link.name}
                  </Link>
                ))}
              </div>

              <button onClick={() => { authService.agentLogout(); navigate('/'); }} className="w-full text-base font-bold text-secondary-500 mt-2 px-4 py-3 bg-secondary-50 border border-secondary-100 rounded-lg touch-target hover:bg-secondary-100">Logout</button>
            </div>
          )}

          {isAdmin && (
            <div className="flex flex-col gap-1 w-full pb-4">
              <div className="px-4 py-3 bg-secondary-50 text-secondary-700 text-xs font-black rounded-lg uppercase tracking-wider text-center mb-3">Super Admin</div>
              
              {/* Admin Menu Options Sliding List */}
              <div className="flex flex-col gap-1 border-t border-gray-50 pt-2 mb-3">
                {adminLinks.map(link => (
                  <Link key={link.path} onClick={() => setIsMobileMenuOpen(false)} to={link.path} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-secondary-50 hover:text-secondary-700 rounded-lg touch-target">
                    <span className="text-lg">{link.icon}</span> {link.name}
                  </Link>
                ))}
              </div>

              <button onClick={() => { adminService.adminLogout(); navigate('/'); }} className="w-full text-base font-bold text-gray-600 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg touch-target hover:text-secondary-600 hover:bg-secondary-50 mt-2">Logout Admin</button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
