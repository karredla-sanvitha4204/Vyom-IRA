const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "airline_management_system_secure_jwt_secret_key_2026";

/**
 * Generate a JWT for an authenticated user.
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            name: user.name,
            passengerId: user.passengerId || null
        },
        JWT_SECRET,
        { expiresIn: "24h" }
    );
};

/**
 * Authenticate incoming request via Authorization header.
 * Header format: Bearer <token>
 */
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Access denied. Authentication token required." });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Access denied. Malformed token." });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ error: "User account no longer exists." });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Session expired. Please log in again." });
        }
        return res.status(401).json({ error: "Invalid authentication token." });
    }
};

/**
 * Authorize users based on one or more allowed roles.
 * Example: requireRole("admin", "staff")
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required." });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied. Requires one of the following roles: ${allowedRoles.join(", ")}.`
            });
        }
        next();
    };
};

/**
 * Optional authentication: attaches user if valid token present, allows unauthenticated otherwise.
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.id).select("-password");
            if (user) {
                req.user = user;
            }
        }
    } catch (e) {
        // Silently continue without authenticated user
    }
    next();
};

module.exports = {
    generateToken,
    verifyToken,
    requireRole,
    optionalAuth,
    JWT_SECRET
};
