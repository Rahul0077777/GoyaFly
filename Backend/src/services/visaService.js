const mockVisas = [
    { country: 'UAE', type: 'E-Visa', processingTime: '48 Hours', fee: 6500, commissionRate: 0.08 },
    { country: 'Singapore', type: 'E-Visa', processingTime: '3-5 Days', fee: 3500, commissionRate: 0.05 },
    { country: 'Thailand', type: 'Visa on Arrival', processingTime: 'Instant', fee: 0, commissionRate: 0.00 },
    { country: 'Schengen Area', type: 'Standard Visa', processingTime: '15-20 Days', fee: 8000, commissionRate: 0.10 },
];

const getVisaRequirements = async (country) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const visa = mockVisas.find(v => v.country.toLowerCase() === country.toLowerCase());
            resolve(visa || { message: 'Visa processing not currently supported for this region via API.' });
        }, 600);
    });
};

const submitVisaApplication = async (country, applicantDetails) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (!applicantDetails || !applicantDetails.passportNumber) {
                reject(new Error('Application rejected: Missing required passport details.'));
            } else {
                resolve({
                    success: true,
                    applicationId: `VISA-${Date.now()}`,
                    status: 'PROCESSING',
                    estimatedCompletion: '48 to 72 hours'
                });
            }
        }, 1500); // Simulate a heavier API payload processing
    });
};

module.exports = { getVisaRequirements, submitVisaApplication };
