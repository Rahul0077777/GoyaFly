/**
 * Validation Utilities for Goyafly B2B
 * Provides centralized regex and logic for form fields.
 */

export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

export const validateMobile = (mobile) => {
    // Strict Indian mobile: 10 digits starting with 6, 7, 8, or 9
    const re = /^[6789]\d{9}$/;
    return re.test(String(mobile));
};

export const validatePassword = (password) => {
    // Minimum 8 chars, at least one uppercase, one lowercase, one number and one special character
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(String(password));
};

export const validateGST = (gst) => {
    // Standard 15-char Indian GSTIN format
    const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return re.test(String(gst).toUpperCase());
};

export const validatePAN = (pan) => {
    // Standard 10-char Indian PAN format
    const re = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return re.test(String(pan).toUpperCase());
};

export const getValidationError = (field, value) => {
    if (!value && field !== 'gstNumber') return 'This field is required.';
    
    switch (field) {
        case 'email':
        case 'emailAddress':
        case 'contactEmail':
            return !validateEmail(value) ? 'Enter a valid email (e.g., rahul@gmail.com).' : null;
        case 'mobile':
        case 'mobileNumber':
        case 'contactMobile':
            return !validateMobile(value) ? 'Enter a valid 10-digit Indian mobile number.' : null;
        case 'password':
            return !validatePassword(value) ? 'Password must be 8+ chars with Uppercase, Number, and Special Char (@$!%*?&).' : null;
        case 'gstNumber':
            if (!value || value.length === 0) return null;
            if (value.length !== 15) return 'GST number must be exactly 15 characters.';
            return !validateGST(value) ? 'Invalid GST format (e.g. 07AAAAA0000A1Z5).' : null;
        case 'panCard':
        case 'pax_pan':
            return (value && !validatePAN(value)) ? 'Invalid PAN format.' : null;
        default:
            return null;
    }
};
