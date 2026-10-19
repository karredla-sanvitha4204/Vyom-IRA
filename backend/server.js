require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const seedInitialUsers = require("./config/seedAdmin");
const seedFlights = require("./config/seedFlights");

// Modular Route Handlers
const authRoutes = require("./routes/auth.routes");
const flightRoutes = require("./routes/flight.routes");
const passengerRoutes = require("./routes/passenger.routes");
const bookingRoutes = require("./routes/booking.routes");
const adminRoutes = require("./routes/admin.routes");
const portalRoutes = require("./routes/portalRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and seed administrative accounts and demonstration flights
connectDB().then(async (conn) => {
    if (conn) {
        await seedInitialUsers();
        await seedFlights();
    }
});

// Middleware: CORS headers for full-stack access
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

// Middleware: JSON request parser
app.use(express.json());

// Optional JWT extraction middleware to attach req.user if Authorization header is provided
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "airline_jwt_super_secret_key_2026";
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (e) {
            // Silently proceed for public routes
        }
    }
    next();
});

// ==========================================
// MOUNT MODULAR API ROUTES
// ==========================================
app.use("/auth", authRoutes);
app.use("/flights", flightRoutes);
app.use("/passengers", passengerRoutes);
app.use("/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", portalRoutes);

// Root health & API discovery endpoint
app.get("/", (req, res) => {
    res.json({
        status: "OK",
        brand: "VYOMIRA",
        tagline: "Connecting Earth and Sky.",
        message: "Airline Backend is running!",
        version: "2.0.0",
        endpoints: {
            flights: "/flights",
            passengers: "/passengers",
            bookings: "/bookings",
            auth: {
                register: "POST /auth/register",
                login: "POST /auth/login",
                me: "GET /auth/me"
            },
            admin: {
                stats: "GET /api/admin/stats",
                notifications: "GET /api/admin/notifications",
                users: "GET /api/admin/users"
            },
            passenger: {
                myBookings: "GET /api/passenger/my-bookings",
                cancelBooking: "PATCH /api/passenger/my-bookings/:id/cancel"
            }
        }
    });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
    console.error("[ServerError]", err.stack || err.message);
    res.status(err.status || 500).json({
        error: err.message || "An unexpected internal server error occurred."
    });
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
});
