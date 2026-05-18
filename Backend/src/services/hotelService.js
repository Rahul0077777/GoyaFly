const mockHotels = [
    { id: 'HT001', name: 'Taj Palace', city: 'BOM', rating: 5, pricePerNight: 12000, amenities: ['Pool', 'WiFi', 'Breakfast'], commissionRate: 0.10 },
    { id: 'HT002', name: 'Lemon Tree Premier', city: 'DEL', rating: 4, pricePerNight: 4500, amenities: ['WiFi', 'Gym'], commissionRate: 0.08 },
    { id: 'HT003', name: 'ITC Gardenia', city: 'BLR', rating: 5, pricePerNight: 9500, amenities: ['Pool', 'Spa', 'Breakfast'], commissionRate: 0.12 },
    { id: 'HT004', name: 'Oyo Rooms Townhouse', city: 'DEL', rating: 3, pricePerNight: 1800, amenities: ['WiFi'], commissionRate: 0.05 },
];

const searchHotels = async (city, checkIn, checkOut) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const results = mockHotels.filter(h => h.city === city);
            resolve(results.length > 0 ? results : mockHotels.slice(0, 2));
        }, 1000); 
    });
};

const validateHotelBooking = async (hotelId) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const hotel = mockHotels.find(h => h.id === hotelId);
            if (hotel) {
                resolve({ valid: true, hotel });
            } else {
                reject(new Error('Hotel sold out for selected dates'));
            }
        }, 500);
    });
};

module.exports = { searchHotels, validateHotelBooking };
