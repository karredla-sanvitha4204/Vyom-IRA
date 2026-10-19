const Flight = require("../models/Flight");
const Booking = require("../models/Booking");

/**
 * List all flights with optional route filtering.
 */
exports.getAllFlights = async (req, res) => {
    try {
        const filter = {};
        if (req.query.source) {
            filter.source = { $regex: new RegExp(req.query.source, "i") };
        }
        if (req.query.destination) {
            filter.destination = { $regex: new RegExp(req.query.destination, "i") };
        }
        if (req.query.company) {
            filter.company = { $regex: new RegExp(req.query.company, "i") };
        }

        const flights = await Flight.find(filter).sort({ flightId: 1 });
        return res.json(flights);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch flights." });
    }
};

/**
 * Get flight details by flightId.
 */
exports.getFlightById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Flight ID must be a positive integer." });
        }

        const flight = await Flight.findOne({ flightId: id });
        if (!flight) {
            return res.status(404).json({ error: `Flight with ID ${id} not found.` });
        }

        return res.json(flight);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch flight." });
    }
};

/**
 * Create a new flight with class-specific fares.
 */
exports.createFlight = async (req, res) => {
    try {
        const {
            flightId,
            flightNumber,
            company,
            source,
            sourceAirport,
            sourceCode,
            destination,
            destinationAirport,
            destinationCode,
            departure,
            arrival,
            duration,
            fare,
            totalSeats,
            classes,
            status
        } = req.body;

        const numericId = Number(flightId);
        if (!Number.isInteger(numericId) || numericId <= 0) {
            return res.status(400).json({ error: "Flight ID must be a positive integer." });
        }

        const existing = await Flight.findOne({ flightId: numericId });
        if (existing) {
            return res.status(409).json({ error: `Flight with ID ${numericId} already exists.` });
        }

        const baseFare = Math.max(Number(fare) || 3500, 1000);
        const flight = await Flight.create({
            flightId: numericId,
            flightNumber: flightNumber || `VY-${numericId}`,
            company: company || "IndiGo",
            source,
            sourceAirport,
            sourceCode: sourceCode || (source ? source.substring(0, 3).toUpperCase() : "ORG"),
            destination,
            destinationAirport,
            destinationCode: destinationCode || (destination ? destination.substring(0, 3).toUpperCase() : "DST"),
            departure,
            arrival,
            duration: duration || "2h 15m",
            fare: baseFare,
            totalSeats: totalSeats || 60,
            classes: classes || {
                "Economy": { fare: baseFare, totalSeats: 30, availableSeats: 30 },
                "Premium Economy": { fare: Math.round(baseFare * 1.55), totalSeats: 12, availableSeats: 12 },
                "Business Class": { fare: Math.max(baseFare * 3, 12000), totalSeats: 12, availableSeats: 12 },
                "First Class": { fare: Math.max(baseFare * 6, 25000), totalSeats: 6, availableSeats: 6 }
            },
            status: status || "Scheduled"
        });

        return res.status(201).json({
            message: "Flight added successfully",
            flight
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to add flight: " + error.message });
    }
};

/**
 * Update an existing flight.
 */
exports.updateFlight = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Flight ID must be a positive integer." });
        }

        const updateData = { ...req.body };
        delete updateData.flightId; // immutable ID

        if (updateData.fare !== undefined) {
            updateData.fare = Math.max(Number(updateData.fare), 1000);
        }

        const updatedFlight = await Flight.findOneAndUpdate(
            { flightId: id },
            updateData,
            { returnDocument: "after", runValidators: true }
        );

        if (!updatedFlight) {
            return res.status(404).json({ error: `Flight with ID ${id} not found.` });
        }

        return res.json({
            message: "Flight updated successfully",
            flight: updatedFlight
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to update flight." });
    }
};

/**
 * Delete a flight by flightId.
 */
exports.deleteFlight = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Flight ID must be a positive integer." });
        }

        const deletedFlight = await Flight.findOneAndDelete({ flightId: id });
        if (!deletedFlight) {
            return res.status(404).json({ error: `Flight with ID ${id} not found.` });
        }

        return res.json({
            message: "Flight deleted successfully",
            flightId: id
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to delete flight." });
    }
};

/**
 * List all bookings for a specific flight.
 */
exports.getFlightBookings = async (req, res) => {
    try {
        const id = Number(req.params.flightId);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Flight ID must be a positive integer." });
        }

        const flight = await Flight.findOne({ flightId: id });
        if (!flight) {
            return res.status(404).json({ error: `Flight with ID ${id} not found.` });
        }

        const bookings = await Booking.find({ flightId: id })
            .populate("passenger")
            .populate("flight")
            .sort({ seatNumber: 1 });

        return res.json(bookings);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch bookings for flight." });
    }
};
