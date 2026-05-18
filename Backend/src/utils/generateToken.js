const jwt = require('jsonwebtoken');

const generateToken = (id, expiresIn = '30d') => {
    // This creates a digital ID card (token) signed with your secret key
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn, 
    });
};

module.exports = generateToken; // This is what the require() statement grabs!
