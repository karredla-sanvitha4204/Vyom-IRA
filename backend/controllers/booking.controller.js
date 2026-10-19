const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Flight = require("../models/Flight");
const Passenger = require("../models/Passenger");
const { getNextSequence } = require("../models/Counter");
const { calculateAuthoritativeFare, getSeatTravelClass } = require("../services/pricing.service");
const { dispatchBookingNotification } = require("../services/notification.service");

/**
 * List all bookings with optional query filters.
 */
exports.getAllBookings = async (req, res) => {
    try {
        const filter = {};
        if (req.query.flightId) {
            filter.flightId = Number(req.query.flightId);
        }
        if (req.query.status) {
            filter.status = req.query.status.toUpperCase();
        }
        const pId = req.query.passengerId || req.query.passenger;
        if (pId && mongoose.Types.ObjectId.isValid(pId)) {
            filter.passenger = pId;
        }

        const bookings = await Booking.find(filter)
            .populate("passenger")
            .populate("flight")
            .sort({ ticketNumber: 1 });

        return res.json(bookings);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch bookings." });
    }
};

/**
 * Get booking by ticketNumber or _id.
 */
exports.getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        let query = {};

        if (mongoose.Types.ObjectId.isValid(id)) {
            query._id = id;
        } else if (Number.isInteger(Number(id))) {
            query.ticketNumber = Number(id);
        } else {
            return res.status(400).json({ error: "Invalid booking ID or ticketNumber format." });
        }

        const booking = await Booking.findOne(query)
            .populate("passenger")
            .populate("flight");
        if (!booking) {
            return res.status(404).json({ error: "Booking not found." });
        }

        return res.json(booking);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch booking." });
    }
};

/**
 * Create a new flight booking with authoritative pricing, concurrency safety, and admin notification.
 */
exports.createBooking = async (req, res) => {
    try {
        const {
            flightId,
            flight: flightRef,
            passengerId,
            passenger: passengerRef,
            seatNumber,
            wheelchair,
            foodService,
            gateNumber,
            status,
            bookingDate
        } = req.body;

        // 1. Resolve & validate flight
        let flight = null;
        if (flightId !== undefined && flightId !== null) {
            const numericFlightId = Number(flightId);
            if (!Number.isInteger(numericFlightId) || numericFlightId <= 0) {
                return res.status(400).json({ error: "flightId must be a positive integer." });
            }
            flight = await Flight.findOne({ flightId: numericFlightId });
            if (!flight) {
                return res.status(404).json({ error: `Flight with ID ${numericFlightId} not found.` });
            }
        } else if (flightRef && mongoose.Types.ObjectId.isValid(flightRef)) {
            flight = await Flight.findById(flightRef);
            if (!flight) {
                return res.status(404).json({ error: `Flight with ID ${flightRef} not found.` });
            }
        } else {
            return res.status(400).json({ error: "A valid flightId or flight reference is required." });
        }

        // 2. Validate seatNumber
        const numericSeatNumber = Number(seatNumber);
        if (!Number.isInteger(numericSeatNumber) || numericSeatNumber <= 0) {
            return res.status(400).json({ error: "seatNumber must be a positive integer." });
        }

        if (numericSeatNumber > flight.totalSeats) {
            return res.status(400).json({
                error: `Seat number ${numericSeatNumber} exceeds flight capacity of ${flight.totalSeats}.`
            });
        }

        // 3. Resolve & validate passenger
        const resolvedPassengerId = passengerId || passengerRef;
        if (!resolvedPassengerId || !mongoose.Types.ObjectId.isValid(resolvedPassengerId)) {
            return res.status(400).json({ error: "A valid passengerId (ObjectId) is required." });
        }

        const passenger = await Passenger.findById(resolvedPassengerId);
        if (!passenger) {
            return res.status(404).json({ error: `Passenger with ID ${resolvedPassengerId} not found.` });
        }

        // 4. Validate status
        let bookingStatus = "CONFIRMED";
        if (status !== undefined) {
            const upperStatus = String(status).toUpperCase();
            if (!["CONFIRMED", "BOARDED", "CANCELLED"].includes(upperStatus)) {
                return res.status(400).json({ error: "Status must be CONFIRMED, BOARDED, or CANCELLED." });
            }
            bookingStatus = upperStatus;
        }

        // 5. Pre-check if seat is already occupied by active booking
        if (bookingStatus !== "CANCELLED") {
            const activeBooking = await Booking.findOne({
                flightId: flight.flightId,
                seatNumber: numericSeatNumber,
                status: { $in: ["CONFIRMED", "BOARDED"] }
            });
            if (activeBooking) {
                return res.status(409).json({
                    error: `Seat ${numericSeatNumber} on Flight ${flight.flightId} is already booked.`
                });
            }
        }

        // 6. Generate sequential unique ticketNumber
        const ticketNumber = await getNextSequence("ticketNumber");

        // 7. Gate assignment
        const assignedGate = gateNumber !== undefined
            ? Number(gateNumber)
            : ((flight.flightId % 20) === 0 ? 20 : (flight.flightId % 20));

        // 8. Authoritative class & fare calculation
        const seatClass = req.body.travelClass || getSeatTravelClass(numericSeatNumber);
        const confirmedFare = calculateAuthoritativeFare(flight, seatClass);
        const bookingReference = req.body.bookingReference || `VY-${ticketNumber}`;
        const bookingUser = (req.user && req.user._id) ? req.user._id : (req.body.userId || req.body.user || null);

        // 9. Save booking
        const newBooking = await Booking.create({
            ticketNumber,
            bookingReference,
            flightId: flight.flightId,
            flight: flight._id,
            passenger: passenger._id,
            user: bookingUser,
            travelClass: seatClass,
            fare: confirmedFare,
            seatNumber: numericSeatNumber,
            wheelchair: wheelchair !== undefined ? Boolean(wheelchair) : Boolean(passenger.wheelchair),
            foodService: foodService !== undefined ? Boolean(foodService) : Boolean(passenger.foodService),
            gateNumber: assignedGate,
            status: bookingStatus,
            bookingDate: bookingDate ? new Date(bookingDate) : new Date()
        });

        const populatedBooking = await Booking.findById(newBooking._id)
            .populate("passenger")
            .populate("flight");

        // 10. Dispatch real-time booking alert to Admin
        dispatchBookingNotification(populatedBooking, flight, passenger);

        return res.status(201).json({
            message: "Booking created successfully",
            booking: populatedBooking
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                error: `Seat ${req.body.seatNumber} on Flight ${req.body.flightId} is already booked.`
            });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to create booking: " + error.message });
    }
};

/**
 * Update booking options or status.
 */
exports.updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, wheelchair, foodService } = req.body;

        let query = {};
        if (mongoose.Types.ObjectId.isValid(id)) {
            query._id = id;
        } else if (Number.isInteger(Number(id))) {
            query.ticketNumber = Number(id);
        } else {
            return res.status(400).json({ error: "Invalid booking ID or ticketNumber format." });
        }

        const updateData = {};
        if (status !== undefined) {
            const upperStatus = String(status).toUpperCase();
            if (!["CONFIRMED", "BOARDED", "CANCELLED"].includes(upperStatus)) {
                return res.status(400).json({ error: "Status must be CONFIRMED, BOARDED, or CANCELLED." });
            }
            updateData.status = upperStatus;
        }
        if (wheelchair !== undefined) updateData.wheelchair = Boolean(wheelchair);
        if (foodService !== undefined) updateData.foodService = Boolean(foodService);

        const updatedBooking = await Booking.findOneAndUpdate(query, updateData, {
            returnDocument: "after",
            runValidators: true
        }).populate("passenger").populate("flight");

        if (!updatedBooking) {
            return res.status(404).json({ error: "Booking not found." });
        }

        return res.json({
            message: "Booking updated successfully",
            booking: updatedBooking
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to update booking." });
    }
};

/**
 * Fast status patch.
 */
exports.patchBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: "Status is required." });
        }

        const upperStatus = String(status).toUpperCase();
        if (!["CONFIRMED", "BOARDED", "CANCELLED"].includes(upperStatus)) {
            return res.status(400).json({ error: "Status must be CONFIRMED, BOARDED, or CANCELLED." });
        }

        let query = {};
        if (mongoose.Types.ObjectId.isValid(id)) {
            query._id = id;
        } else if (Number.isInteger(Number(id))) {
            query.ticketNumber = Number(id);
        } else {
            return res.status(400).json({ error: "Invalid booking ID or ticketNumber format." });
        }

        const updatedBooking = await Booking.findOneAndUpdate(
            query,
            { status: upperStatus },
            { returnDocument: "after", runValidators: true }
        ).populate("passenger").populate("flight");

        if (!updatedBooking) {
            return res.status(404).json({ error: "Booking not found." });
        }

        return res.json({
            message: "Booking status updated successfully",
            booking: updatedBooking
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to update booking status." });
    }
};

/**
 * Delete a booking.
 */
exports.deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        let query = {};
        if (mongoose.Types.ObjectId.isValid(id)) {
            query._id = id;
        } else if (Number.isInteger(Number(id))) {
            query.ticketNumber = Number(id);
        } else {
            return res.status(400).json({ error: "Invalid booking ID or ticketNumber format." });
        }

        const deletedBooking = await Booking.findOneAndDelete(query);
        if (!deletedBooking) {
            return res.status(404).json({ error: "Booking not found." });
        }

        return res.json({
            message: "Booking deleted successfully",
            ticketNumber: deletedBooking.ticketNumber
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to delete booking." });
    }
};
