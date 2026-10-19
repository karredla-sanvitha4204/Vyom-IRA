const User = require("../models/User");
const Flight = require("../models/Flight");
const Booking = require("../models/Booking");
const Passenger = require("../models/Passenger");
const Notification = require("../models/Notification");
const { getNotifications, markAsRead, markAllAsRead } = require("../services/notification.service");

/**
 * Return system-wide operations metrics & revenue calculated from confirmed class fares.
 */
exports.getStats = async (req, res) => {
    try {
        const [totalFlights, totalPassengers, totalBookings, totalUsers] = await Promise.all([
            Flight.countDocuments(),
            Passenger.countDocuments(),
            Booking.countDocuments(),
            User.countDocuments()
        ]);

        const confirmedBookings = await Booking.find({ status: "CONFIRMED" });
        const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.fare || 3500), 0);

        const statusCounts = await Booking.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        return res.json({
            metrics: {
                totalFlights,
                totalPassengers,
                totalBookings,
                totalUsers,
                totalRevenue
            },
            totalFlights,
            totalPassengers,
            totalBookings,
            totalUsers,
            totalRevenue,
            statusBreakdown: statusCounts.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {})
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch operations statistics." });
    }
};

/**
 * List all registered user accounts (admin only).
 */
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .populate("passengerId")
            .sort({ createdAt: -1 });

        return res.json(users);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch user accounts." });
    }
};

/**
 * Create a new administrative account.
 */
exports.createUser = async (req, res) => {
    try {
        const { username, email, password, role, name } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Username, email, and password are required." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existing = await User.findOne({
            $or: [{ email: normalizedEmail }, { username: username.trim() }]
        });
        if (existing) {
            return res.status(409).json({ error: "Username or email is already registered." });
        }

        const user = await User.create({
            username: username.trim(),
            email: normalizedEmail,
            password,
            role: role || "admin",
            name: name ? name.trim() : username.trim()
        });

        return res.status(201).json({
            message: "User account created successfully",
            user: {
                id: user._id,
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                name: user.name
            }
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to create user account: " + error.message });
    }
};

/**
 * Delete a user account.
 */
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({ error: "User account not found." });
        }
        if (targetUser.username === "admin") {
            return res.status(403).json({ error: "The default primary administrator cannot be deleted." });
        }

        await User.findByIdAndDelete(id);
        return res.json({ message: "User account deleted successfully." });
    } catch (error) {
        return res.status(500).json({ error: "Failed to delete user account." });
    }
};

/**
 * Get real-time booking alerts stream.
 */
exports.getNotifications = async (req, res) => {
    try {
        const notifs = await getNotifications(50);
        return res.json(notifs);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch notifications." });
    }
};

/**
 * Mark a single notification as read.
 */
exports.markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await markAsRead(id);
        if (!updated) {
            return res.status(404).json({ error: "Notification not found." });
        }
        return res.json({ message: "Notification marked as read.", notification: updated });
    } catch (error) {
        return res.status(500).json({ error: "Failed to update notification." });
    }
};

/**
 * Mark all notifications as read.
 */
exports.markAllNotificationsRead = async (req, res) => {
    try {
        const result = await markAllAsRead();
        return res.json({ message: "All notifications marked as read.", modifiedCount: result.modifiedCount });
    } catch (error) {
        return res.status(500).json({ error: "Failed to update notifications." });
    }
};
