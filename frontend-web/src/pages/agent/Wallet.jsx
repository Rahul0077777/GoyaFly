import React, { useState, useEffect } from 'react';
import { walletService } from '../../services/api';
import WalletRecharge from '../../components/WalletRecharge';
import { toast } from 'react-toastify';
import { FaListUl, FaWallet, FaHistory, FaRegCreditCard, FaHeadset, FaShieldAlt } from 'react-icons/fa';

const Wallet = () => {
    const [balance, setBalance] = useState(0);
    const [fdBalance, setFdBalance] = useState(0);
    const [stats, setStats] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rechargeOpen, setRechargeOpen] = useState(false);
    const [rechargeType, setRechargeType] = useState('MAIN');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchTransactions = async (page = 1) => {
        setLoading(true);
        try {
            const historyRes = await walletService.getHistory(page, 10);
            if (historyRes.success) {
                setTransactions(historyRes.data);
                if (historyRes.pagination) {
                    setTotalPages(historyRes.pagination.pages || 1);
                    setCurrentPage(historyRes.pagination.page || page);
                }
            }
        } catch (err) {
            console.error('Failed to fetch transactions', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWalletData = async () => {
        setLoading(true);
        try {
            const res = await walletService.getBalance();
            if (res.success) {
                setBalance(res.balance);
                setFdBalance(res.fdBalance || 0);
            }

            const statsRes = await walletService.getStats();
            if (statsRes.success) setStats(statsRes.data);

            await fetchTransactions(1);
        } catch (err) {
            console.error('Wallet fetch failed', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, []);

    const handleDownloadStatement = async () => {
        try {
            toast.info('Generating complete statement...', { autoClose: 2000 });
            const res = await walletService.getHistory(1, 10000);
            if (res.success && res.data) {
                const txs = res.data;
                let csvContent = "data:text/csv;charset=utf-8,Status,Type,Purpose,Reference ID,Amount,Balance After,Date\n";
                txs.forEach(tx => {
                    const status = tx.status || 'SUCCESS';
                    const type = tx.transactionType || '';
                    const purpose = (tx.purpose || '').replace(/_/g, ' ');
                    const ref = tx.referenceId || '';
                    const amount = tx.amount || 0;
                    const bal = tx.balanceAfterTransaction || 0;
                    const date = new Date(tx.createdAt).toLocaleDateString();
                    csvContent += `"${status}","${type}","${purpose}","${ref}","${amount}","${bal}","${date}"\n`;
                });
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `Goyafly_Wallet_Statement_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Statement downloaded successfully!');
            }
        } catch (err) {
            console.error('Download failed', err);
            toast.error('Failed to download statement');
        }
    };

    return (
        <div className="w-full max-w-md md:max-w-4xl mx-auto py-6 px-4 md:px-6 space-y-6 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center bg-[#f7f9fc] rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-lg sm:text-xl md:text-2xl shadow-lg shadow-orange-500/30 text-white shrink-0">
                        <FaWallet />
                    </div>
                    <div>
                        <h2 className="text-lg md:text-2xl font-black text-[#1D4171]">Goyafly.com Wallet</h2>
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 mt-0.5">Your money, your control</p>
                    </div>
                </div>
                <div className="hidden md:block">
                    <img src="/wallet_shield_3d.png" alt="Wallet 3D" className="w-24 h-24 object-contain" />
                </div>
            </div>

            {/* Wallets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Main Balance Card */}
                <div className="bg-[#1D4171] rounded-3xl p-6 md:p-8 text-white relative shadow-xl overflow-hidden flex flex-col justify-between h-full">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2">Main Wallet</p>
                            <p className="text-4xl md:text-5xl font-black tracking-tighter mb-4">₹{balance.toLocaleString('en-IN')}</p>
                            <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-2 w-max">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                                Active
                            </span>
                        </div>
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10 shrink-0 shadow-inner">
                            💼
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => { setRechargeType('MAIN'); setRechargeOpen(true); }}
                        className="w-full bg-white text-[#1D4171] font-black py-3 sm:py-4 rounded-xl text-xs sm:text-sm uppercase tracking-[0.2em] hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 relative z-10 shadow-lg shadow-black/10 active:scale-95 mt-auto"
                    >
                        ADD TO MAIN <span className="text-lg leading-none border border-[#1D4171] rounded-full w-5 h-5 flex items-center justify-center pb-0.5 ml-1">+</span>
                    </button>
                </div>

                {/* FD Balance Card */}
                <div className="bg-[#059669] rounded-3xl p-6 md:p-8 text-white relative shadow-xl overflow-hidden flex flex-col justify-between h-full">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#10b981]/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-200 mb-2">Fixed Departure Wallet</p>
                            <p className="text-4xl md:text-5xl font-black tracking-tighter mb-4">₹{fdBalance.toLocaleString('en-IN')}</p>
                            <span className="bg-[#10b981]/20 text-emerald-100 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald-400/30 flex items-center gap-2 w-max">
                                <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                                Dedicated
                            </span>
                        </div>
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10 shrink-0 shadow-inner">
                            ✈️
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => { setRechargeType('FIXED_DEPARTURE'); setRechargeOpen(true); }}
                        className="w-full bg-white text-[#059669] font-black py-3 sm:py-4 rounded-xl text-xs sm:text-sm uppercase tracking-[0.2em] hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 relative z-10 shadow-lg shadow-black/10 active:scale-95 mt-auto"
                    >
                        ADD TO FD <span className="text-lg leading-none border border-[#059669] rounded-full w-5 h-5 flex items-center justify-center pb-0.5 ml-1">+</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Total Spent */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 relative overflow-hidden flex items-center gap-4 sm:gap-5">
                    <div className="absolute bottom-0 left-0 w-full h-12 text-red-50 pointer-events-none">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 100 C 30 50, 70 80, 100 30 L 100 100 L 0 100 Z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shrink-0 z-10">📉</div>
                    <div className="z-10">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Spent</p>
                        <p className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">₹{stats ? (stats.totalSpent || 0).toLocaleString('en-IN') : '...'}</p>
                        <div className="bg-red-50 text-red-500 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded mt-1.5 w-max">
                            ↑ {Math.abs(stats?.spentGrowth || 0)}% this month
                        </div>
                    </div>
                </div>

                {/* Total Credits */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 relative overflow-hidden flex items-center gap-4 sm:gap-5">
                    <div className="absolute bottom-0 left-0 w-full h-12 text-emerald-50 pointer-events-none">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 100 C 40 40, 60 90, 100 20 L 100 100 L 0 100 Z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shrink-0 z-10">📈</div>
                    <div className="z-10">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Credits</p>
                        <p className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">₹{stats ? (stats.totalCredits || 0).toLocaleString('en-IN') : '...'}</p>
                        <div className="bg-emerald-50 text-emerald-500 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded mt-1.5 w-max">
                            ↑ {Math.abs(stats?.creditGrowth || 0)}% this month
                        </div>
                    </div>
                </div>

                {/* Avg Booking */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 relative overflow-hidden flex items-center gap-4 sm:gap-5">
                    <div className="absolute bottom-0 left-0 w-full h-12 text-blue-50 pointer-events-none">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 100 C 20 60, 50 20, 100 80 L 100 100 L 0 100 Z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shrink-0 z-10">📅</div>
                    <div className="z-10">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Avg Booking Value</p>
                        <p className="text-xl sm:text-2xl font-black text-[#1D4171] tracking-tight">₹{stats ? (stats.avgBooking || 0).toLocaleString('en-IN') : '...'}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1.5">Based on global history</p>
                    </div>
                </div>

                {/* Max Recharge */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 relative overflow-hidden flex items-center gap-4 sm:gap-5">
                    <div className="absolute bottom-0 left-0 w-full h-12 text-orange-50 pointer-events-none">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 100 C 30 70, 70 30, 100 60 L 100 100 L 0 100 Z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shrink-0 z-10">⚡</div>
                    <div className="z-10">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Max Recharge</p>
                        <p className="text-xl sm:text-2xl font-black text-orange-500 tracking-tight">₹{stats ? (stats.maxRecharge || 0).toLocaleString('en-IN') : '...'}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1.5">Lifetime maximum recharge</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 sm:mb-6">Quick Actions</p>
                <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
                    <div onClick={() => { setRechargeType('MAIN'); setRechargeOpen(true); }} className="flex flex-col items-center gap-2 sm:gap-3 cursor-pointer group">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-blue-50 text-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-base sm:text-lg md:text-xl group-hover:bg-blue-500 group-hover:text-white transition-all"><FaWallet /></div>
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-600 leading-tight">Add<br/>Money</span>
                    </div>
                    <div onClick={() => document.getElementById('transaction-history')?.scrollIntoView({behavior: 'smooth'})} className="flex flex-col items-center gap-2 sm:gap-3 cursor-pointer group">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-purple-50 text-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-base sm:text-lg md:text-xl group-hover:bg-purple-500 group-hover:text-white transition-all"><FaHistory /></div>
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-600 leading-tight">Transaction<br/>History</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 sm:gap-3 cursor-pointer group" onClick={() => toast.info('My Cards coming soon!')}>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-emerald-50 text-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-base sm:text-lg md:text-xl group-hover:bg-emerald-500 group-hover:text-white transition-all"><FaRegCreditCard /></div>
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-600 leading-tight">My<br/>Cards</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 sm:gap-3 cursor-pointer group" onClick={() => toast.info('Connecting to support...')}>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-orange-50 text-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-base sm:text-lg md:text-xl group-hover:bg-orange-500 group-hover:text-white transition-all"><FaHeadset /></div>
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-600 leading-tight">Help &<br/>Support</span>
                    </div>
                </div>
            </div>

            {/* Secure Transactions */}
            <div className="bg-[#f0f5fa] rounded-3xl p-6 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg shrink-0 shadow-lg shadow-blue-500/30">
                    <FaShieldAlt />
                </div>
                <div>
                    <h4 className="text-[11px] md:text-xs font-black text-slate-800 uppercase tracking-wide">100% Secure Transactions</h4>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">Your payments and data are always safe with us.</p>
                </div>
            </div>

            {/* Transactions Table */}
            <div id="transaction-history" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 overflow-hidden relative mt-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Transaction History</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">Recent wallet activities</p>
                    </div>
                    <button 
                        onClick={handleDownloadStatement}
                        className="px-4 py-2 border border-slate-200 text-slate-600 font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors text-[10px] flex items-center gap-2 shadow-sm shrink-0"
                    >
                        📥 Download Statement
                    </button>
                </div>

                <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0 no-scrollbar">
                    <table className="w-full text-left min-w-[500px]">
                        <thead>
                            <tr className="border-b border-slate-100 text-[9px] uppercase font-black tracking-widest text-slate-400">
                                <th className="pb-4">Status</th>
                                <th className="pb-4">Transaction Details</th>
                                <th className="pb-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="3" className="py-8 text-center font-bold text-slate-400 text-xs">Loading ledger...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan="3" className="py-8 text-center font-bold text-slate-400 text-xs">No transactions recorded yet.</td></tr>
                            ) : transactions.map(tx => (
                                <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-5 pr-4">
                                        <span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                            tx.transactionType === 'CREDIT' 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                            : 'bg-rose-50 text-rose-600 border-rose-100'
                                        }`}>
                                            {tx.transactionType}
                                        </span>
                                    </td>
                                    <td className="py-5 pr-4">
                                        <p className="font-black text-slate-800 text-[13px] md:text-sm mb-1">{tx.purpose.replace(/_/g, ' ')}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            {tx.walletType === 'FIXED_DEPARTURE' ? 'FD WALLET' : 'MAIN WALLET'} • REF: {tx.referenceId || tx._id.substring(0,8)} • {new Date(tx.createdAt).toLocaleDateString()}
                                        </p>
                                    </td>
                                    <td className={`py-5 text-right font-black text-sm md:text-base whitespace-nowrap ${
                                        tx.transactionType === 'CREDIT' ? 'text-emerald-500' : 'text-slate-800'
                                    }`}>
                                        {tx.transactionType === 'CREDIT' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t border-slate-100 pt-6 mt-4 flex justify-between items-center">
                        <button onClick={() => fetchTransactions(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-40 hover:bg-slate-50 active:scale-95 transition-all">Prev</button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => fetchTransactions(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-40 hover:bg-slate-50 active:scale-95 transition-all">Next</button>
                    </div>
                )}
            </div>

            <WalletRecharge 
                isOpen={rechargeOpen} 
                initialWalletType={rechargeType}
                onClose={() => setRechargeOpen(false)}
                onSuccess={() => {
                    fetchWalletData();
                }}
            />
        </div>
    );
};

export default Wallet;
