const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Flight = require("../models/Flight");
const Passenger = require("../models/Passenger");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { getNotifications, markAsRead, markAllAsRead } = require("../services/notification.service");
const { verifyToken, requireRole } = require("../middleware/auth");

// =========================================================================
// PORTAL 1 — PASSENGER PORTAL SPECIFIC ENDPOINTS
// =========================================================================

/**
 * GET /api/passenger/my-bookings
 * Returns bookings belonging to the authenticated passenger.
 */
router.get("/passenger/my-bookings", verifyToken, async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === "admin") {
            // Admins can inspect all bookings
            filter = {};
        } else {
            const orConditions = [];
            if (req.user._id) {
                orConditions.push({ user: req.user._id });
            }
            if (req.user.passengerId) {
                orConditions.push({ passenger: req.user.passengerId });
            }
            if (req.user.email) {
                const matchedPassengers = await Passenger.find({ email: req.user.email }).select("_id");
                matchedPassengers.forEach(p => orConditions.push({ passenger: p._id }));
            }
            if (orConditions.length > 0) {
                filter = { $or: orConditions };
            } else {
                return res.json([]);
            }
        }

        const bookings = await Booking.find(filter)
            .populate("passenger")
            .populate("flight")
            .sort({ bookingDate: -1, ticketNumber: -1 });

        return res.json(bookings);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch passenger bookings." });
    }
});

/**
 * PATCH /api/passenger/my-bookings/:id/cancel
 * Allows a passenger to cancel their own active booking, releasing the seat.
 */
router.patch("/passenger/my-bookings/:id/cancel", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        let query = {};
        if (mongoose.Types.ObjectId.isValid(id)) {
            query._id = id;
        } else if (Number.isInteger(Number(id))) {
            query.ticketNumber = Number(id);
        } else {
            return res.status(400).json({ error: "Invalid booking ID." });
        }

        const booking = await Booking.findOne(query);
        if (!booking) {
            return res.status(404).json({ error: "Booking not found." });
        }

        // Ownership verification (passengers can only cancel their own)
        if (req.user.role !== "admin") {
            const userPassId = req.user.passengerId ? String(req.user.passengerId) : null;
            if (!userPassId || String(booking.passenger) !== userPassId) {
                return res.status(403).json({ error: "You are not authorized to cancel this booking." });
            }
        }

        if (booking.status === "CANCELLED") {
            return res.status(400).json({ error: "Booking is already cancelled." });
        }

        booking.status = "CANCELLED";
        await booking.save();

        const updated = await Booking.findById(booking._id).populate("passenger").populate("flight");
        return res.json({
            message: "Booking cancelled successfully. Seat has been released.",
            booking: updated
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to cancel booking." });
    }
});

// =========================================================================
// PORTAL 2 — ADMIN PORTAL ENDPOINTS
// =========================================================================

/**
 * GET /api/admin/stats
 * Dashboard statistics for administrative overview.
 */
router.get("/admin/stats", verifyToken, requireRole("admin"), async (req, res) => {
    try {
        const totalFlights = await Flight.countDocuments();
        const totalPassengers = await Passenger.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const totalUsers = await User.countDocuments();

        const confirmedBookings = await Booking.countDocuments({ status: "CONFIRMED" });
        const boardedBookings = await Booking.countDocuments({ status: "BOARDED" });
        const cancelledBookings = await Booking.countDocuments({ status: "CANCELLED" });

        // Calculate revenue from active bookings (CONFIRMED + BOARDED)
        const activeBookings = await Booking.find({ status: { $in: ["CONFIRMED", "BOARDED"] } }).populate("flight");
        const totalRevenue = activeBookings.reduce((sum, b) => {
            return sum + (b.fare || (b.flight && b.flight.fare ? b.flight.fare : 0));
        }, 0);

        // Calculate total seat capacity
        const flights = await Flight.find();
        const totalCapacity = flights.reduce((sum, f) => sum + (f.totalSeats || 60), 0);
        const overallOccupancy = totalCapacity > 0
            ? Math.round(((confirmedBookings + boardedBookings) / totalCapacity) * 100)
            : 0;

        return res.json({
            metrics: {
                totalFlights,
                totalPassengers,
                totalBookings,
                totalUsers,
                totalRevenue,
                overallOccupancy: `${overallOccupancy}%`
            },
            statusBreakdown: {
                CONFIRMED: confirmedBookings,
                BOARDED: boardedBookings,
                CANCELLED: cancelledBookings
            }
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch admin stats." });
    }
});

/**
 * GET /api/admin/notifications
 * Returns latest real-time booking notifications for the administrator.
 */
router.get("/admin/notifications", verifyToken, requireRole("admin"), async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 50;
        const notifications = await getNotifications(limit);
        return res.json(notifications);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch notifications." });
    }
});

/**
 * PATCH /api/admin/notifications/:id/read
 * Marks a specific notification as read.
 */
router.patch("/admin/notifications/:id/read", verifyToken, requireRole("admin"), async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await markAsRead(id);
        if (!updated) {
            return res.status(404).json({ error: "Notification not found." });
        }
        return res.json({ message: "Notification marked as read.", notification: updated });
    } catch (error) {
        return res.status(500).json({ error: "Failed to mark notification as read." });
    }
});

/**
 * PATCH /api/admin/notifications/mark-all-read
 * Marks all unread administrator notifications as read.
 */
router.patch("/admin/notifications/mark-all-read", verifyToken, requireRole("admin"), async (req, res) => {
    try {
        await markAllAsRead();
        return res.json({ message: "All notifications marked as read." });
    } catch (error) {
        return res.status(500).json({ error: "Failed to mark all notifications as read." });
    }
});

/**
 * GET /api/admin/users
 * Lists user accounts for role & access management.
 */
router.get("/admin/users", verifyToken, requireRole("admin"), async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        return res.json(users);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch users." });
    }
});

/**
 * POST /api/admin/users
 * Admin creates a new staff or admin user account.
 */
router.post("/admin/users", verifyToken, requireRole("admin"), async (req, res) => {
    try {
        const { username, email, password, role, name } = req.body;

        if (!username || !email || !password || !name) {
            return res.status(400).json({ error: "Username, email, password, and name are required." });
        }

        const allowedRoles = ["staff", "admin", "passenger"];
        const targetRole = role ? String(role).toLowerCase() : "staff";
        if (!allowedRoles.includes(targetRole)) {
            return res.status(400).json({ error: "Role must be 'staff', 'admin', or 'passenger'." });
        }

        const existing = await User.findOne({
            $or: [{ email: email.trim().toLowerCase() }, { username: username.trim() }]
        });
        if (existing) {
            return res.status(409).json({ error: "A user with this username or email already exists." });
        }

        const newUser = await User.create({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
            role: targetRole,
            name: name.trim()
        });

        return res.status(201).json({
            message: `User ${newUser.username} (${newUser.role}) created successfully.`,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                name: newUser.name,
                createdAt: newUser.createdAt
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: "Username or email already exists." });
        }
        return res.status(500).json({ error: "Failed to create user account." });
    }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user account (prevents admin from deleting themselves).
 */
router.delete("/admin/users/:id", verifyToken, requireRole("admin"), async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid user ID format." });
        }

        if (String(req.user._id) === String(id)) {
            return res.status(400).json({ error: "Cannot delete your own active administrator account." });
        }

        const deleted = await User.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ error: "User not found." });
        }

        return res.json({ message: "User account deleted successfully." });
    } catch (error) {
        return res.status(500).json({ error: "Failed to delete user." });
    }
});

// =========================================================================
// PORTAL 3 — AIRLINE STAFF PORTAL ENDPOINTS
// =========================================================================

/**
 * GET /api/staff/flights
 * Scheduled flights with real-time occupancy and gate information.
 */
router.get("/staff/flights", verifyToken, requireRole("staff", "admin"), async (req, res) => {
    try {
        const flights = await Flight.find().sort({ flightId: 1 });
        const flightSummaries = await Promise.all(
            flights.map(async (flight) => {
                const bookedCount = await Booking.countDocuments({
                    flightId: flight.flightId,
                    status: { $in: ["CONFIRMED", "BOARDED"] }
                });
                const boardedCount = await Booking.countDocuments({
                    flightId: flight.flightId,
                    status: "BOARDED"
                });
                const wheelchairCount = await Booking.countDocuments({
                    flightId: flight.flightId,
                    status: { $in: ["CONFIRMED", "BOARDED"] },
                    wheelchair: true
                });
                const foodServiceCount = await Booking.countDocuments({
                    flightId: flight.flightId,
                    status: { $in: ["CONFIRMED", "BOARDED"] },
                    foodService: true
                });

                const gateNumber = (flight.flightId % 20 === 0 ? 20 : flight.flightId % 20);

                return {
                    ...flight.toObject(),
                    gateNumber,
                    bookedSeats: bookedCount,
                    boardedSeats: boardedCount,
                    availableSeats: Math.max(0, flight.totalSeats - bookedCount),
                    wheelchairRequests: wheelchairCount,
                    foodRequests: foodServiceCount
                };
            })
        );

        return res.json(flightSummaries);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch staff flight schedules." });
    }
});

/**
 * GET /api/staff/flights/:flightId/manifest
 * Full passenger manifest for a specific flight.
 */
router.get("/staff/flights/:flightId/manifest", verifyToken, requireRole("staff", "admin"), async (req, res) => {
    try {
        const flightId = Number(req.params.flightId);
        const flight = await Flight.findOne({ flightId });
        if (!flight) {
            return res.status(404).json({ error: `Flight ${flightId} not found.` });
        }

        const bookings = await Booking.find({ flightId })
            .populate("passenger")
            .populate("flight")
            .sort({ seatNumber: 1 });

        return res.json({
            flight,
            gateNumber: (flightId % 20 === 0 ? 20 : flightId % 20),
            totalBookings: bookings.length,
            manifest: bookings
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch flight manifest." });
    }
});

/**
 * GET /api/staff/assistance
 * List of all active passengers requiring wheelchair assistance.
 */
router.get("/staff/assistance", verifyToken, requireRole("staff", "admin"), async (req, res) => {
    try {
        const assistanceBookings = await Booking.find({
            wheelchair: true,
            status: { $in: ["CONFIRMED", "BOARDED"] }
        })
            .populate("passenger")
            .populate("flight")
            .sort({ flightId: 1, seatNumber: 1 });

        return res.json(assistanceBookings);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch wheelchair assistance list." });
    }
});

/**
 * GET /api/staff/food-service
 * List of all active bookings with special food service requests.
 */
router.get("/staff/food-service", verifyToken, requireRole("staff", "admin"), async (req, res) => {
    try {
        const foodBookings = await Booking.find({
            foodService: true,
            status: { $in: ["CONFIRMED", "BOARDED"] }
        })
            .populate("passenger")
            .populate("flight")
            .sort({ flightId: 1, seatNumber: 1 });

        return res.json(foodBookings);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch food service requests." });
    }
});

// =========================================================================
// PORTAL 4 — CHECK-IN & BOARDING PORTAL ENDPOINTS
// =========================================================================

/**
 * GET /api/checkin/lookup
 * Verification endpoint for ticket or booking inquiry.
 * Safe for passenger inquiries (sanitizes sensitive data).
 */
router.get("/checkin/lookup", async (req, res) => {
    try {
        const { ticketNumber, flightId, id } = req.query;

        let query = {};
        if (ticketNumber) {
            query.ticketNumber = Number(ticketNumber);
        } else if (id && mongoose.Types.ObjectId.isValid(id)) {
            query._id = id;
        } else {
            return res.status(400).json({ error: "Please provide a valid ticketNumber or booking ID." });
        }

        if (flightId) {
            query.flightId = Number(flightId);
        }

        const booking = await Booking.findOne(query).populate("passenger").populate("flight");
        if (!booking) {
            return res.status(404).json({ error: "No matching booking found for the provided details." });
        }

        return res.json({
            ticketNumber: booking.ticketNumber,
            bookingId: booking._id,
            flightId: booking.flightId,
            flightCompany: booking.flight ? booking.flight.company : "",
            source: booking.flight ? booking.flight.source : "",
            destination: booking.flight ? booking.flight.destination : "",
            departure: booking.flight ? booking.flight.departure : "",
            arrival: booking.flight ? booking.flight.arrival : "",
            seatNumber: booking.seatNumber,
            gateNumber: booking.gateNumber,
            status: booking.status,
            passengerName: booking.passenger ? booking.passenger.name : "Passenger",
            wheelchair: booking.wheelchair,
            foodService: booking.foodService,
            bookingDate: booking.bookingDate
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to lookup booking verification." });
    }
});

/**
 * PATCH /api/checkin/bookings/:id/board
 * Marks passenger as BOARDED. Requires staff or admin role.
 */
router.patch("/checkin/bookings/:id/board", verifyToken, requireRole("staff", "admin"), async (req, res) => {
    try {
        const { id } = req.params;
        let query = {};
        if (mongoose.Types.ObjectId.isValid(id)) {
            query._id = id;
        } else if (Number.isInteger(Number(id))) {
            query.ticketNumber = Number(id);
        } else {
            return res.status(400).json({ error: "Invalid booking ID or ticketNumber." });
        }

        const booking = await Booking.findOne(query);
        if (!booking) {
            return res.status(404).json({ error: "Booking not found." });
        }

        if (booking.status === "CANCELLED") {
            return res.status(400).json({ error: "Cannot board a cancelled booking." });
        }

        booking.status = "BOARDED";
        await booking.save();

        const updated = await Booking.findById(booking._id).populate("passenger").populate("flight");
        return res.json({
            message: `Passenger for Ticket #${booking.ticketNumber} marked as BOARDED at Gate ${booking.gateNumber}.`,
            booking: updated
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to record boarding." });
    }
});

module.exports = router;
