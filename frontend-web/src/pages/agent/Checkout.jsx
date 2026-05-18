import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CheckoutDomestic from './CheckoutDomestic';
import CheckoutInternational from './CheckoutInternational';

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { bookingData } = location.state || {};

    const [loading, setLoading] = useState(true);
    const [isInternational, setIsInternational] = useState(false);

    useEffect(() => {
        if (!bookingData) {
            navigate('/agent/dashboard');
            return;
        }
        
        // Auto-detect international based on IATA codes
        const internationalKeywords = ['DXB', 'JFK', 'LHR', 'SIN', 'CDG', 'BKK', 'KUL'];
        if (internationalKeywords.includes(bookingData.from.toUpperCase()) || internationalKeywords.includes(bookingData.to.toUpperCase())) {
            setIsInternational(true);
        }

        setTimeout(() => setLoading(false), 400); // simulate quick routing
    }, [bookingData, navigate]);

    if (loading || !bookingData) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#f8fafc] min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#eb5a0c]"></div>
            </div>
        );
    }

    if (isInternational) {
        return <CheckoutInternational bookingData={bookingData} />;
    }

    return <CheckoutDomestic bookingData={bookingData} />;
};

export default Checkout;
