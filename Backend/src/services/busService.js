const mockBuses = [
    { id: 'BS001', operator: 'VRL Travels', type: 'Volvo A/C Sleeper', from: 'BLR', to: 'BOM', departureTime: '09:00 PM', price: 1800, commissionRate: 0.06 },
    { id: 'BS002', operator: 'Zingbus', type: 'Scania A/C Semi-Sleeper', from: 'DEL', to: 'JAIPUR', departureTime: '11:30 PM', price: 850, commissionRate: 0.05 },
    { id: 'BS003', operator: 'Orange Travels', type: 'Non-A/C Sleeper', from: 'HYD', to: 'BLR', departureTime: '08:45 PM', price: 1200, commissionRate: 0.07 },
];

const searchBuses = async (from, to, date) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const results = mockBuses.filter(b => b.from === from && b.to === to);
            resolve(results.length > 0 ? results : mockBuses.slice(0, 2));
        }, 700);
    });
};

const validateBusBooking = async (busId) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const bus = mockBuses.find(b => b.id === busId);
            if (bus) {
                resolve({ valid: true, bus });
            } else {
                reject(new Error('Bus seat no longer available'));
            }
        }, 400);
    });
};

module.exports = { searchBuses, validateBusBooking };
