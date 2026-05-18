import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/api';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await adminService.adminLogin(email, password);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center py-10 md:py-20 animate-fade-in px-4 bg-gradient-to-br from-blue-50 via-white to-orange-50">
            <div className="w-full max-w-5xl bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100 relative">
                
                {/* Visual Side */}
                <div className="w-full md:w-1/2 bg-[#1D4171] relative overflow-hidden flex flex-col justify-center items-center p-8 md:p-12 text-center text-white min-h-[300px] md:min-h-[500px]">
                    <div className="absolute top-0 left-0 w-80 h-80 bg-[#F07E21]/20 rounded-full blur-3xl -ml-40 -mt-40 animate-float"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#48A0D4]/20 rounded-full blur-3xl -mr-48 -mb-48 animate-float" style={{ animationDelay: '1s' }}></div>
                    <div className="relative z-10 animate-slide-right">
                        <div className="w-28 h-28 bg-white/10 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center text-5xl font-black mb-8 border border-white/20 shadow-2xl group hover:scale-110 hover:rotate-12 smooth-transition">
                            👑
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight leading-tight">Admin Portal</h2>
                        <p className="text-blue-100 text-base md:text-lg mb-8 max-w-sm mx-auto leading-relaxed">
                            Access the comprehensive admin control center to manage your platform and track all operations.
                        </p>
                        <div className="inline-flex items-center gap-3 bg-white/10 px-6 py-3 rounded-full border border-white/30 backdrop-blur-sm hover:bg-white/20 smooth-transition group cursor-pointer">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#48A0D4] animate-pulse group-hover:scale-125 smooth-transition"></span>
                            <span className="text-sm font-bold">Super Admin Access</span>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="w-full md:w-1/2 p-8 lg:p-16 relative bg-white animate-slide-left">
                    <div className="mb-8 md:mb-10">
                        <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">Admin Sign In</h3>
                        <p className="text-gray-500 font-medium">Use your super admin credentials to access the control center.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3 group">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-[#1D4171] smooth-transition">📧 Email Address</label>
                            <input 
                                type="email" 
                                required
                                className="input-lg group-focus-within:input-focused"
                                placeholder="admin@goyafly.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3 group">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-[#1D4171] smooth-transition">🔐 Password</label>
                            <input 
                                type="password" 
                                required
                                className="input-lg group-focus-within:input-focused"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-bounce-in">
                            <span className="text-xl">⚠️</span> 
                            <span>{error}</span>
                        </div>}

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 md:py-5 px-4 rounded-2xl bg-[#F07E21] hover:bg-[#d96c13] text-white font-extrabold shadow-lg hover:shadow-2xl hover:shadow-[#F07E21]/40 disabled:opacity-50 smooth-transition transform hover:scale-105 active:scale-95 text-base md:text-lg tracking-wide mt-6 relative overflow-hidden group"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                                        VERIFYING...
                                    </>
                                ) : (
                                    <>
                                        👑 ADMIN LOGIN
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="mt-10 md:mt-12 pt-8 border-t border-gray-100 text-center">
                        <p className="text-gray-500 font-medium mb-4">Not an admin?</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                            <Link to="/login" className="text-[#1D4171] text-sm font-black uppercase tracking-widest hover:text-[#48A0D4] hover:underline smooth-transition">
                                Agent Login
                            </Link>
                            <span className="hidden sm:inline text-gray-400">•</span>
                            <Link to="/" className="text-[#F07E21] text-sm font-black uppercase tracking-widest hover:text-[#d96c13] hover:underline smooth-transition">
                                Back Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
