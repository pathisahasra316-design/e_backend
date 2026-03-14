const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');

            // Daily Token Reward Logic
            const today = new Date().setHours(0, 0, 0, 0);
            const lastVisit = new Date(req.user.lastVisit).setHours(0, 0, 0, 0);

            if (today > lastVisit) {
                req.user.tokens += 4;
                req.user.lastVisit = new Date();
                await req.user.save();
                console.log(`Earned 4 tokens for user ${req.user.email}. Total: ${req.user.tokens}`);
            }

            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role ${req.user.role} is not authorized` });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };
