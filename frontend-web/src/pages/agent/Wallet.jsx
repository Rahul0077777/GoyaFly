import React, { useState, useEffect } from 'react';
import { walletService } from '../../services/api';
import WalletRecharge from '../../components/WalletRecharge';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-toastify';

const Wallet = () => {
    const [balance, setBalance] = useState(0);
    const [stats, setStats] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rechargeOpen, setRechargeOpen] = useState(false);
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
            if (res.success) setBalance(res.balance);

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
        <div className="w-full max-w-6xl mx-auto py-4 sm:py-6 md:py-8 lg:py-10 px-3 sm:px-4 md:px-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-6 sm:mb-8 md:mb-10 flex items-center gap-2 sm:gap-3 md:gap-4 text-gray-900 tracking-tight">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-secondary-500 to-[#ff9844] text-white rounded-lg sm:rounded-xl md:rounded-[1.2rem] flex items-center justify-center text-base sm:text-lg md:text-2xl shadow-lg shadow-secondary-500/30 flex-shrink-0">
                    💰
                </div>
                <span>Goyafly.com Wallet</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 md:gap-8 lg:gap-10 mb-8 sm:mb-10 md:mb-12">
                {/* Main Balance Card */}
                <div className="md:col-span-5 bg-gradient-to-br from-primary-600 to-primary-700 p-5 sm:p-6 md:p-7 lg:p-10 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group hover-lift">
                    <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-secondary-500/20 rounded-full blur-3xl -mr-12 sm:-mr-16 md:-mr-20 -mt-12 sm:-mt-16 md:-mr-20 group-hover:bg-secondary-500/30 transition-colors pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-accent-500/20 rounded-full blur-2xl -ml-12 sm:-ml-16 md:-ml-20 -mb-12 sm:-mb-16 md:-mb-20 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex-1">
                        <div className="flex justify-between items-start mb-6 sm:mb-8">
                            <div className="flex-1 min-w-0">
                                <p className="text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-primary-200 mb-1 sm:mb-2">Available Balance</p>
                                <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight drop-shadow-md break-words">
                                    ₹{balance.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm flex-shrink-0 ml-2">
                                <span className="text-sm sm:text-base md:text-lg text-white drop-shadow-sm">💳</span>
                            </div>
                        </div>
                    </div>
                        
                    <div className="relative z-10 flex gap-2 sm:gap-3 md:gap-4 mt-6 sm:mt-8 w-full">
                        <button 
                            onClick={() => setRechargeOpen(true)}
                            className="flex-1 py-2 sm:py-2.5 md:py-3 lg:py-4 bg-white text-primary-600 font-extrabold rounded-lg sm:rounded-xl md:rounded-2xl hover:bg-gray-50 transition-colors shadow-lg shadow-white/10 active:scale-95 text-xs sm:text-sm md:text-base tracking-widest glow-primary touch-target"
                        >
                            ADD
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                    <div className="bg-white p-4 sm:p-5 md:p-6 lg:p-8 rounded-lg sm:rounded-xl md:rounded-[2rem] shadow-xl border border-gray-100 flex flex-col justify-center relative overflow-hidden hover-lift group">
                        <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-red-50 rounded-full blur-2xl -mr-6 sm:-mr-8 md:-mr-10 -mt-6 sm:-mt-8 md:-mt-10 group-hover:bg-red-100 transition-colors"></div>
                        <div className="relative z-10">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-red-50 text-red-500 rounded-lg sm:rounded-lg md:rounded-xl flex items-center justify-center text-sm sm:text-base md:text-lg lg:text-xl mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 transition-transform">
                                📉
                            </div>
                            <p className="text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Spent</p>
                            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-800">
                                ₹{stats ? (stats.totalSpent || 0).toLocaleString('en-IN') : '...'}
                            </p>
                            <p className={`text-[10px] sm:text-xs md:text-sm font-bold mt-1 sm:mt-2 flex items-center gap-1 ${stats?.spentGrowth >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                <span>{stats?.spentGrowth >= 0 ? '↑' : '↓'}</span> {Math.abs(stats?.spentGrowth || 0)}% this month
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-white p-5 sm:p-6 md:p-8 rounded-lg sm:rounded-xl md:rounded-[2rem] shadow-xl border border-gray-100 flex flex-col justify-center relative overflow-hidden hover-lift group">
                        <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-green-50 rounded-full blur-2xl -mr-8 sm:-mr-10 -mt-8 sm:-mt-10 group-hover:bg-green-100 transition-colors"></div>
                        <div className="relative z-10">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-50 text-green-500 rounded-lg sm:rounded-lg md:rounded-xl flex items-center justify-center text-base sm:text-lg md:text-xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                                📈
                            </div>
                            <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Credits</p>
                            <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-800">
                                ₹{stats ? (stats.totalCredits || 0).toLocaleString('en-IN') : '...'}
                            </p>
                            <p className={`text-xs sm:text-sm font-bold mt-1 sm:mt-2 flex items-center gap-1 ${stats?.creditGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                <span>{stats?.creditGrowth >= 0 ? '↑' : '↓'}</span> {Math.abs(stats?.creditGrowth || 0)}% this month
                            </p>
                        </div>
                    </div>

                    {/* New Metric: Avg Booking */}
                    <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-gray-50 group">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg Booking Value</p>
                        <p className="text-xl font-black text-primary-600">₹{stats ? (stats.avgBooking || 0).toLocaleString('en-IN') : '...'}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">Based on global history</p>
                    </div>

                    {/* New Metric: Max Recharge */}
                    <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-gray-50 group">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Max Recharge</p>
                        <p className="text-xl font-black text-secondary-500">₹{stats ? (stats.maxRecharge || 0).toLocaleString('en-IN') : '...'}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">This month's peak</p>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden relative">
                <div className="p-5 sm:p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-start md:items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight">Transaction History</h3>
                        <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1">Recent wallet activities (10 per page)</p>
                    </div>
                    <button 
                        onClick={handleDownloadStatement}
                        className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white border border-gray-200 text-primary-600 font-bold rounded-lg sm:rounded-lg md:rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm text-xs sm:text-sm active:scale-95 flex items-center gap-2"
                    >
                        <span>📥</span>
                        <span>Download Statement</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-full md:min-w-max">
                        <thead>
                            <tr className="bg-white text-[8px] sm:text-[9px] md:text-[10px] uppercase font-black tracking-widest text-gray-400 border-b border-gray-100">
                                <th className="px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-5">Status</th>
                                <th className="px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-5">Transaction Details</th>
                                <th className="px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-5 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="3" className="px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10 text-center font-bold text-gray-500 text-xs sm:text-sm">Loading ledger...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan="3" className="px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10 text-center font-bold text-gray-400 text-xs sm:text-sm">No transactions recorded yet.</td></tr>
                            ) : transactions.map(tx => (
                                <tr key={tx._id} className="hover:bg-gray-50/80 transition-colors group cursor-pointer">
                                    <td className="px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6">
                                        <span className={`px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-lg sm:rounded-lg md:rounded-xl text-[7px] sm:text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${
                                            tx.transactionType === 'CREDIT' 
                                            ? 'bg-green-50 text-green-700 border-green-200/50' 
                                            : 'bg-red-50 text-red-700 border-red-200/50'
                                        }`}>
                                            {tx.transactionType}
                                        </span>
                                    </td>
                                    <td className="px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6">
                                        <p className="font-extrabold text-gray-900 text-xs sm:text-sm md:text-base mb-0.5 sm:mb-1 group-hover:text-primary-600 transition-colors">{tx.purpose.replace('_', ' ')}</p>
                                        <p className="text-[7px] sm:text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">REF: {tx.referenceId || tx._id.substring(0,8)} • {new Date(tx.createdAt).toLocaleDateString()}</p>
                                    </td>
                                    <td className={`px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 text-right font-black text-sm sm:text-base md:text-lg ${
                                        tx.transactionType === 'CREDIT' ? 'text-green-600' : 'text-gray-900'
                                    }`}>
                                        {tx.transactionType === 'CREDIT' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Showing page {currentPage} of {totalPages}
                        </p>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <button
                                onClick={() => fetchTransactions(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Prev
                            </button>
                            
                            {/* Page Numbers */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(currentPage - p) <= 2)
                                    .map((p, idx, arr) => {
                                        if (idx > 0 && p - arr[idx - 1] > 1) {
                                            return <span key={`ellipsis-${p}`} className="px-2 text-gray-400 font-bold">...</span>;
                                        }
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => fetchTransactions(p)}
                                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl font-black text-xs sm:text-sm flex items-center justify-center transition-all shadow-sm ${
                                                    currentPage === p 
                                                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' 
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })
                                }
                            </div>

                            <button
                                onClick={() => fetchTransactions(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Wallet Recharge Modal */}
            <WalletRecharge 
                isOpen={rechargeOpen} 
                onClose={() => setRechargeOpen(false)}
                onSuccess={(newBalance) => {
                    setBalance(newBalance);
                    fetchTransactions(1);
                }}
            />
        </div>
    );
};

export default Wallet;
