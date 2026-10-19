const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Passenger = require("../models/Passenger");
const { generateToken, verifyToken } = require("../middleware/auth");

/**
 * POST /auth/register
 * Public registration for passengers.
 * Automatically enforces role: 'passenger' to prevent privilege escalation.
 * Creates an associated Passenger record for seamless booking integration.
 */
router.post("/register", async (req, res) => {
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
            role: "passenger",
            name: name.trim(),
            passengerId: passenger._id
        });

        const token = generateToken(user);

        return res.status(201).json({
            message: "Passenger registration successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                name: user.name,
                passengerId: user.passengerId
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: "Username or email already exists." });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Registration failed." });
    }
});

/**
 * POST /auth/login
 * Public authentication endpoint for passengers, staff, and administrators.
 * Supports login via either username or email.
 */
router.post("/login", async (req, res) => {
    try {
        const { login, password } = req.body;
        if (!login || !password) {
            return res.status(400).json({ error: "Username/email and password are required." });
        }

        const normalizedLogin = String(login).trim();
        const user = await User.findOne({
            $or: [
                { email: normalizedLogin.toLowerCase() },
                { username: normalizedLogin }
            ]
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid username/email or password." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid username/email or password." });
        }

        const token = generateToken(user);

        return res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                name: user.name,
                passengerId: user.passengerId
            }
        });
    } catch (error) {
        return res.status(500).json({ error: "Login failed." });
    }
});

/**
 * GET /auth/me
 * Protected endpoint returning current session user.
 */
router.get("/me", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password").populate("passengerId");
        return res.json({ user });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch user profile." });
    }
});

module.exports = router;
