const User = require('../models/User');
const jwt = require('jsonwebtoken');
require("dotenv").config();

const protect = async(req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1] || req.body;
    if(!token){
        return res.status(401).json({ message: "Not authorized, no token" });
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        if(!req.user){
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }
        next();
    } catch (error) {
        console.error(`Error during token verification: ${error.message}`.red);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
}

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Forbidden: User role '${req.user.role}' is not authorized to access this route.`
            });
        }
        next();
    };
}

module.exports = {protect, authorize};