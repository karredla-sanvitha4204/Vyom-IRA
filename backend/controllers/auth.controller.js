const User = require("../models/User");
const Passenger = require("../models/Passenger");
const { generateToken } = require("../middleware/auth");

/**
 * Register a new passenger account.
 * Automatically enforces role: 'passenger' and links a Passenger record.
 */
exports.register = async (req, res) => {
    try {
        const { username, email, password, name, age, phone, wheelchair, foodService } = req.body;

        if (!username || typeof username !== "string" || username.trim().length < 3) {
            return res.status(400).json({ error: "Username must be at least 3 characters long." });
        }
        if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
            return res.status(400).json({ error: "A valid email address is required." });
        }
        if (!password || typeof password !== "string" || password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long." });
        }
        if (!name || typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({ error: "Full name is required." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = username.trim();

        // Check for duplicate username or email
        const existing = await User.findOne({
            $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
        });
        if (existing) {
            if (existing.email === normalizedEmail) {
                return res.status(409).json({ error: "An account with this email already exists." });
            }
            return res.status(409).json({ error: "This username is already taken." });
        }

        // Create linked Passenger record
        const passengerAge = Number(age);
        const validAge = Number.isInteger(passengerAge) && passengerAge >= 1 && passengerAge <= 120 ? passengerAge : 30;

        const passenger = await Passenger.create({
            name: name.trim(),
            age: validAge,
            email: normalizedEmail,
            phone: typeof phone === "string" ? phone.trim() : "",
            wheelchair: Boolean(wheelchair),
            foodService: Boolean(foodService)
        });

        // Create User (strictly passenger role)
        const user = await User.create({
            username: normalizedUsername,
            email: normalizedEmail,
            password,
            name: name.trim(),
            role: "passenger",
            passengerId: passenger._id
        });

        const token = generateToken(user);

        return res.status(201).json({
            message: "Passenger registration successful",
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                passengerId: user.passengerId
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: "Username or email is already registered." });
        }
        return res.status(500).json({ error: "Registration failed: " + error.message });
    }
};

/**
 * Log in with username/email and password.
 */
exports.login = async (req, res) => {
    try {
        const { username, email, login, password } = req.body;
        const identifier = (login || username || email || "").trim();

        if (!identifier) {
            return res.status(400).json({ error: "Username or email is required." });
        }
        if (!password) {
            return res.status(400).json({ error: "Password is required." });
        }

        const normalizedIdentifier = identifier.toLowerCase();
        const user = await User.findOne({
            $or: [{ email: normalizedIdentifier }, { username: identifier }]
        }).populate("passengerId");

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials. User not found." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials. Incorrect password." });
        }

        const token = generateToken(user);

        return res.json({
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                passengerId: user.passengerId
            }
        });
    } catch (error) {
        return res.status(500).json({ error: "Login failed: " + error.message });
    }
};

/**
 * Return current authenticated user profile.
 */
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("-password")
            .populate("passengerId");

        if (!user) {
            return res.status(404).json({ error: "User account not found." });
        }

        return res.json({ user });
    } catch (error) {
        return res.status(500).json({ error: "Failed to retrieve user session." });
    }
};
