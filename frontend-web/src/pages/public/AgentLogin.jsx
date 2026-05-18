import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { getValidationError } from '../../utils/validation';

const AgentLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const emailErr = getValidationError('email', email);
        if (emailErr) {
            setError(emailErr);
            return;
        }

        setLoading(true);
        try {
            await authService.agentLogin(email, password);
            navigate('/agent/dashboard');
        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.message;

            if (status === 403) {
                setError(message || 'Your account is blocked. Please contact support.');
            } else if (status === 401) {
                setError(message || 'Account pending KYC verification.');
            } else {
                setError(message || 'Invalid credentials. Please check your email and password.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center py-10 px-4 bg-white animate-fade-in">
            <div className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col md:flex-row border border-gray-100 min-h-[700px]">

                {/* Visual Side - Deep Blue #1D4171 */}
                <div className="w-full md:w-5/12 bg-[#1D4171] relative overflow-hidden flex flex-col justify-center items-center p-12 text-center text-white border-r border-white/5">
                    {/* Brand Accents */}
                    <div className="absolute top-0 left-0 w-80 h-80 bg-[#48A0D4]/20 rounded-full blur-[100px] -ml-40 -mt-40 animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#F07E21]/10 rounded-full blur-[120px] -mr-48 -mb-48 animate-float"></div>

                    <div className="relative z-10 animate-slide-right">
                        <Link to="/" className="inline-block mb-12">
                            <div className="bg-white rounded-2xl px-6 py-3 shadow-2xl border border-white/20 transform hover:scale-105 transition-all">
                                <span className="text-[#1D4171] text-2xl font-black tracking-tighter italic uppercase">GOYA<span className="text-[#F07E21]">FLY.COM</span></span>
                            </div>
                        </Link>

                        <h2 className="text-4xl lg:text-5xl font-black mb-6 tracking-tighter leading-tight uppercase italic">
                            Welcome <br />
                            <span className="text-[#F07E21]">Back Agent</span>
                        </h2>

                        <p className="text-blue-100 text-lg mb-10 max-w-xs mx-auto font-bold opacity-80 italic border-l-4 border-[#48A0D4] pl-6">
                            "Access your GDS terminal and manage your high-margin bookings with technical precision."
                        </p>

                        <div className="inline-flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10 backdrop-blur-sm">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
                            <span className="text-xs font-black uppercase tracking-widest">Secure Terminal Online</span>
                        </div>
                    </div>

                    {/* Side Panel Bottom Marquee */}
                    <div className="absolute bottom-0 left-0 w-full overflow-hidden py-6 border-t border-white/5">
                        <div className="flex animate-marquee whitespace-nowrap gap-12 text-[10px] font-black tracking-[0.4em] uppercase text-white/20">
                            <span>🚀 INSTANT GDS TICKETING</span>
                            <span>💎 ZERO CONVENIENCE FEES</span>
                            <span>🌍 1M+ HOTEL INVENTORY</span>
                            <span>🚀 INSTANT GDS TICKETING</span>
                        </div>
                    </div>
                </div>

                {/* Form Side - Clear Visibility #000000 */}
                <div className="w-full md:w-7/12 p-10 md:p-20 relative bg-white flex flex-col justify-center">
                    <div className="mb-12">
                        <h3 className="text-4xl font-black text-black mb-3 uppercase italic tracking-tighter leading-none">Security Access</h3>
                        <p className="text-gray-400 font-bold text-sm tracking-wide">Enter your authorized partner credentials to continue.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3 group">
                            <label className="block text-[10px] font-black text-black uppercase tracking-widest ml-1 italic group-focus-within:text-[#1D4171] smooth-transition">📧 Authorized Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-[#1D4171] focus:bg-white smooth-transition font-bold text-sm text-black outline-none placeholder:text-gray-300 shadow-sm"
                                placeholder="agent@goyafly.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3 group">
                            <label className="block text-[10px] font-black text-black uppercase tracking-widest ml-1 italic group-focus-within:text-[#1D4171] smooth-transition">🔐 Access Password</label>
                            <input
                                type="password"
                                required
                                className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-[#1D4171] focus:bg-white smooth-transition font-bold text-sm text-black outline-none placeholder:text-gray-300 shadow-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && <div className="bg-red-50 border-2 border-red-100 text-red-700 p-5 rounded-2xl text-xs font-black flex items-center gap-4 animate-bounce-in">
                            <span className="text-2xl">⚠️</span>
                            <span>{error}</span>
                        </div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 sm:h-20 bg-[#F07E21] hover:bg-[#d96c13] text-white font-black rounded-2xl shadow-2xl hover:shadow-[#F07E21]/40 transition-all transform hover:scale-[1.05] active:scale-95 text-xs tracking-[0.3em] uppercase disabled:opacity-50 mt-8"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-3 border-white border-t-transparent animate-spin rounded-full"></div>
                                    VALIDATING...
                                </span>
                            ) : (
                                '🔐 SECURE TERMINAL LOGIN'
                            )}
                        </button>
                    </form>

                    <div className="mt-16 pt-10 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="text-center sm:text-left">
                            <p className="text-gray-400 font-bold text-xs mb-1">New to Goyafly.com?</p>
                            <Link to="/register" className="text-[#1D4171] font-black text-sm uppercase tracking-widest hover:underline hover:text-[#48A0D4] transition-all">
                                Request Partnership ➔
                            </Link>
                        </div>
                        <p className="text-gray-300 text-[10px] font-black uppercase tracking-[0.4em]">
                            PCI-DSS SECURE
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentLogin;
