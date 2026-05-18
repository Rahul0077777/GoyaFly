const mockInsurancePlans = [
    { id: 'INS01', name: 'Basic Domestic', coverage: 100000, price: 150, commissionRate: 0.20 },
    { id: 'INS02', name: 'Comprehensive Domestic', coverage: 500000, price: 350, commissionRate: 0.25 },
    { id: 'INS03', name: 'Basic International', coverage: 50000, currency: 'USD', price: 950, commissionRate: 0.15 },
    { id: 'INS04', name: 'Premium International', coverage: 100000, currency: 'USD', price: 1800, commissionRate: 0.18 },
];

const getInsurancePlans = async (destinationType = 'Domestic') => { 
    return new Promise((resolve) => {
        setTimeout(() => {
            const plans = mockInsurancePlans.filter(p => p.name.includes(destinationType));
            resolve(plans.length > 0 ? plans : mockInsurancePlans);
        }, 400); // Insurance APIs are usually very fast
    });
};

const issueTravelInsurance = async (planId, travelerDetails) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const plan = mockInsurancePlans.find(p => p.id === planId);
            if (plan) {
                resolve({
                    success: true,
                    policyNumber: `POL-${Math.floor(Math.random() * 900000) + 100000}`,
                    planName: plan.name,
                    status: 'ACTIVE'
                });
            } else {
                reject(new Error('Selected insurance plan is invalid or expired.'));
            }
        }, 800);
    });
};

module.exports = { getInsurancePlans, issueTravelInsurance };
