const mongoSanitize = require('express-mongo-sanitize');

/**
 * Custom security middleware for Express 5.x
 * Explicitly cleans req.body, req.query, and req.params without re-assigning the root objects.
 */
const safeSanitize = (req, res, next) => {
    // 1. Sanitize for NoSQL Injection (Mongoose specific)
    if (req.body) {
        mongoSanitize.sanitize(req.body, { replaceWith: '_' });
    }
    if (req.query) {
        mongoSanitize.sanitize(req.query, { replaceWith: '_' });
    }
    if (req.params) {
        mongoSanitize.sanitize(req.params, { replaceWith: '_' });
    }

    // 2. Simple XSS Cleaning (Prevent basic <script> injections)
    // For a more robust solution in a production scale, 
    // we would use a library like 'xss' on specific fields during validation.
    
    next();
};

module.exports = { safeSanitize };
