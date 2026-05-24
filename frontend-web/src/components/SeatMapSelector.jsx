import React from 'react';

const SeatMapSelector = ({ isOpen, onClose, seatMapData, passengers, selectedSeats, onSeatSelect }) => {
    if (!isOpen) return null;

    // Example: [{ code: '1A', amount: 500, status: 'available' }, ...] or ['1A', '1B']
    const normalizeSeats = (data) => {
        if (!data) return [];
        let seatsArray = [];
        if (Array.isArray(data)) seatsArray = data;
        else if (data.FlightSeat?.Onward?.[0]?.SeatMap) seatsArray = data.FlightSeat.Onward[0].SeatMap;
        else if (data.FlightSeat?.Onward?.[0]?.seatMap) seatsArray = data.FlightSeat.Onward[0].seatMap;
        else if (data.seats && Array.isArray(data.seats)) seatsArray = data.seats;
        else if (data.Seats && Array.isArray(data.Seats)) seatsArray = data.Seats;
        else if (data.data && Array.isArray(data.data)) seatsArray = data.data;
        else if (data.results && Array.isArray(data.results)) seatsArray = data.results;
        
        return seatsArray.map(s => {
            if (typeof s === 'string') return { code: s, amount: 0, status: 'available' };
            return {
                ...s,
                code: s.code || s.seatID || s.seatName,
                amount: parseFloat(s.amount || s.seatAmt || 0),
                status: (s.status === 'unavailable' || s.isBooked === true || s.isBooked === 'true' || s.isBooked === '1') ? 'unavailable' : 'available'
            };
        });
    };

    const seatsList = normalizeSeats(seatMapData);

    // Group seats by row for airplane layout (assuming standard 6-abreast: A, B, C | D, E, F)
    // This is a naive grouping. In a real scenario, the API provides row data or we derive it from the seat code.
    const rows = {};
    seatsList.forEach(seat => {
        const rowNum = seat.code.match(/\d+/)?.[0] || '1';
        if (!rows[rowNum]) rows[rowNum] = [];
        rows[rowNum].push(seat);
    });

    // Helper to get which passenger selected this seat
    const getSelectedPaxIndex = (seatCode) => {
        for (const [paxIdx, code] of Object.entries(selectedSeats)) {
            if (code === seatCode) return parseInt(paxIdx);
        }
        return -1;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[2rem]">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Select Seats</h3>
                        <p className="text-slate-500 text-[11px] font-black mt-1 uppercase tracking-widest">Assign seats for your passengers</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                        <span className="text-2xl font-black">&times;</span>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    
                    {/* Left: Passenger List */}
                    <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 p-6 sm:p-8 overflow-y-auto bg-slate-50/50">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Passengers</h4>
                        <div className="space-y-4">
                            {passengers.map((p, idx) => {
                                const isSelected = selectedSeats[idx];
                                return (
                                    <div key={idx} className={`p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-black text-slate-800 uppercase tracking-widest">{p.firstName} {p.lastName}</span>
                                            <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase">PAX {idx + 1}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-bold text-slate-500 uppercase">Seat Assigned:</span>
                                            <span className={`text-[12px] font-black uppercase ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {isSelected ? isSelected : 'None'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-200">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Legend</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-md bg-white border-2 border-slate-200"></div><span className="text-[11px] font-bold text-slate-600 uppercase">Available</span></div>
                                <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-md bg-emerald-500 border-2 border-emerald-600"></div><span className="text-[11px] font-bold text-slate-600 uppercase">Selected</span></div>
                                <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-md bg-slate-200 border-2 border-slate-300 opacity-50"></div><span className="text-[11px] font-bold text-slate-600 uppercase">Unavailable</span></div>
                                <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-md bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-[8px] font-black text-blue-600">₹</div><span className="text-[11px] font-bold text-slate-600 uppercase">Paid Seat</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Seat Map Layout */}
                    <div className="w-full md:w-2/3 p-6 sm:p-8 overflow-y-auto bg-[#f8fafc] flex flex-col items-center">
                        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 max-w-md w-full relative">
                            {/* Plane Nose */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-white border border-slate-200 border-b-0 rounded-t-[50%] z-0"></div>
                            
                            <div className="relative z-10 flex flex-col gap-4">
                                {Object.keys(rows).sort((a,b) => parseInt(a)-parseInt(b)).map(rowNum => (
                                    <div key={rowNum} className="flex justify-between items-center">
                                        <div className="flex gap-2 w-[45%] justify-end">
                                            {rows[rowNum].filter(s => ['A','B','C'].some(ltr => s.code.includes(ltr))).map(seat => {
                                                const paxIdx = getSelectedPaxIndex(seat.code);
                                                const isSelected = paxIdx !== -1;
                                                const isUnavailable = seat.status === 'unavailable';
                                                const hasPrice = seat.amount > 0;
                                                
                                                return (
                                                    <button
                                                        key={seat.code}
                                                        disabled={isUnavailable}
                                                        onClick={() => onSeatSelect(seat)}
                                                        title={hasPrice ? `₹${seat.amount}` : 'Free'}
                                                        className={`relative w-10 h-10 rounded-lg text-[10px] font-black transition-all flex items-center justify-center border-2
                                                            ${isUnavailable ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-50' : 
                                                              isSelected ? 'bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-500/20' : 
                                                              hasPrice ? 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
                                                    >
                                                        {isSelected ? (paxIdx + 1) : seat.code.replace(/\d+/,'')}
                                                        {!isSelected && hasPrice && !isUnavailable && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 text-white rounded-full text-[6px] flex items-center justify-center">₹</span>}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        <div className="w-[10%] flex justify-center">
                                            <span className="text-[10px] font-black text-slate-300">{rowNum}</span>
                                        </div>
                                        <div className="flex gap-2 w-[45%] justify-start">
                                            {rows[rowNum].filter(s => ['D','E','F'].some(ltr => s.code.includes(ltr))).map(seat => {
                                                const paxIdx = getSelectedPaxIndex(seat.code);
                                                const isSelected = paxIdx !== -1;
                                                const isUnavailable = seat.status === 'unavailable';
                                                const hasPrice = seat.amount > 0;
                                                
                                                return (
                                                    <button
                                                        key={seat.code}
                                                        disabled={isUnavailable}
                                                        onClick={() => onSeatSelect(seat)}
                                                        title={hasPrice ? `₹${seat.amount}` : 'Free'}
                                                        className={`relative w-10 h-10 rounded-lg text-[10px] font-black transition-all flex items-center justify-center border-2
                                                            ${isUnavailable ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-50' : 
                                                              isSelected ? 'bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-500/20' : 
                                                              hasPrice ? 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
                                                    >
                                                        {isSelected ? (paxIdx + 1) : seat.code.replace(/\d+/,'')}
                                                        {!isSelected && hasPrice && !isUnavailable && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 text-white rounded-full text-[6px] flex items-center justify-center">₹</span>}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                                {seatsList.length === 0 && (
                                    <div className="text-center py-10">
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No seat map available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-4 bg-white rounded-b-[2rem]">
                    <button onClick={onClose} className="px-8 py-3 bg-[#1D4171] hover:bg-[#15305B] text-white text-[12px] font-black rounded-xl uppercase tracking-widest transition-all shadow-md">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SeatMapSelector;
