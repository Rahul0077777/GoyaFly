const mockTrains = [
    { id: 'TR001', trainName: 'Rajdhani Express', trainNumber: '12951', from: 'DEL', to: 'BOM', departureTime: '04:30 PM', price: 2800, commissionRate: 0.03 },
    { id: 'TR002', trainName: 'Shatabdi Express', trainNumber: '12004', from: 'DEL', to: 'LKO', departureTime: '06:15 AM', price: 1500, commissionRate: 0.02 },
    { id: 'TR003', trainName: 'Vande Bharat', trainNumber: '22436', from: 'DEL', to: 'BSB', departureTime: '06:00 AM', price: 3200, commissionRate: 0.03 },
    { id: 'TR004', trainName: 'Duronto Express', trainNumber: '12240', from: 'BOM', to: 'JAIPUR', departureTime: '11:15 PM', price: 2100, commissionRate: 0.04 },
];

const searchTrains = async (from, to, date) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const results = mockTrains.filter(t => t.from === from && t.to === to);
            resolve(results.length > 0 ? results : mockTrains.slice(0, 2));
        }, 900); // IRCTC is notoriously a bit slower, so 900ms delay!
    });
};

const validateTrainBooking = async (trainId) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const train = mockTrains.find(t => t.id === trainId);
            if (train) {
                resolve({ valid: true, train });
            } else {
                reject(new Error('Train quota full or no longer available'));
            }
        }, 600);
    });
};

module.exports = { searchTrains, validateTrainBooking };
