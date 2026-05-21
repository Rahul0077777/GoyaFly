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
        <div className="min-h-screen w-full bg-gradient-to-br from-[#f2f7fc] via-[#e5f0f9] to-[#f3f8fc] flex flex-col items-center justify-center py-12 px-4 sm:px-6 font-sans">
            <div className="w-full max-w-md">
                {/* Header Logo */}
                <div className="flex flex-col items-center mb-8">
                    <Link to="/" className="mb-2">
                        <span className="text-[#1D4171] text-3xl font-black tracking-tighter italic uppercase">GOYA<span className="text-[#F07E21]">FLY.COM</span></span>
                    </Link>
                    <p className="text-[10px] font-black text-blue-900/60 uppercase tracking-[0.3em] font-sans">Smart ways to travel</p>
                </div>

                {/* Form Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-[2.5rem] shadow-[0_20px_50px_rgba(10,100,219,0.06)] border border-blue-50/50 p-6 sm:p-10">
                    <div className="mb-8 text-center">
                        <h3 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight mb-2 uppercase italic leading-none">
                            Agent Sign In
                        </h3>
                        <p className="text-slate-400 font-bold text-xs sm:text-sm tracking-wide">
                            Enter your authorized partner credentials to continue.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Authorized Email Address */}
                        <div className="bg-white border border-blue-100 rounded-3xl p-3 flex items-center gap-4 shadow-[0_8px_20px_rgba(10,100,219,0.02)] transition-all focus-within:border-blue-300 focus-within:shadow-[0_8px_25px_rgba(10,100,219,0.06)]">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-lg shrink-0">📧</div>
                            <div className="flex-1 flex flex-col min-w-0">
                                <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest mb-0.5">Authorized Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-800 placeholder-slate-300"
                                    placeholder="agent@goyafly.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Access Password */}
                        <div className="bg-white border border-blue-100 rounded-3xl p-3 flex items-center gap-4 shadow-[0_8px_20px_rgba(10,100,219,0.02)] transition-all focus-within:border-blue-300 focus-within:shadow-[0_8px_25px_rgba(10,100,219,0.06)]">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-lg shrink-0">🔐</div>
                            <div className="flex-1 flex flex-col min-w-0">
                                <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest mb-0.5">Access Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-800 placeholder-slate-300"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-bounce-in">
                                <span className="text-xl">⚠️</span>
                                <p className="text-red-700 text-xs font-black">{error}</p>
                            </div>
                        )}

                        {/* Login Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-16 bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500 hover:shadow-xl hover:shadow-blue-500/10 text-white font-black rounded-3xl transition-all transform active:scale-98 text-sm tracking-[0.2em] uppercase flex items-center justify-between pl-8 pr-3 relative overflow-hidden group shadow-lg"
                            >
                                <span>{loading ? 'VALIDATING...' : 'SECURE LOGIN'}</span>
                                <div className="w-10 h-10 rounded-full bg-orange-600/90 flex items-center justify-center shadow-md group-hover:scale-105 transition-all text-sm">
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                                    ) : (
                                        '✨'
                                    )}
                                </div>
                            </button>
                        </div>
                    </form>

                    {/* Registration Redirect */}
                    <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                        <Link to="/register" className="inline-flex items-center gap-2 group">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New to Goyafly?</span>
                            <span className="text-xs font-black text-blue-900 group-hover:underline">Request Partnership</span>
                            <span className="text-orange-500 group-hover:translate-x-1 smooth-transition">➔</span>
                        </Link>
                    </div>
                </div>

                {/* Footer Security Badge */}
                <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-xs font-bold">
                    <span className="text-green-500 text-sm">🛡️</span>
                    <span>PCI-DSS Secure Endpoint Terminal</span>
                </div>
            </div>
        </div>
    );
};

export default AgentLogin;
