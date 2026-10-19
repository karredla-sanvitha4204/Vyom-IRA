const mongoose = require("mongoose");
const Passenger = require("../models/Passenger");
const Booking = require("../models/Booking");

/**
 * List all passengers.
 */
exports.getAllPassengers = async (req, res) => {
    try {
        const passengers = await Passenger.find().sort({ createdAt: -1 });
        return res.json(passengers);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch passengers." });
    }
};

/**
 * Get passenger by ID.
 */
exports.getPassengerById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid passenger ID format." });
        }

        const passenger = await Passenger.findById(id);
        if (!passenger) {
            return res.status(404).json({ error: `Passenger with ID ${id} not found.` });
        }

        return res.json(passenger);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch passenger." });
    }
};

/**
 * Create a new passenger record.
 */
exports.createPassenger = async (req, res) => {
    try {
        const { name, age, email, phone, wheelchair, foodService } = req.body;

        if (!name || typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({ error: "Passenger name is required and must be a non-empty string." });
        }

        const numericAge = Number(age);
        if (age !== undefined && (!Number.isInteger(numericAge) || numericAge < 1 || numericAge > 120)) {
            return res.status(400).json({ error: "Age must be an integer between 1 and 120." });
        }

        const passenger = await Passenger.create({
            name: name.trim(),
            age: numericAge || 30,
            email: email ? String(email).trim().toLowerCase() : undefined,
            phone: phone ? String(phone).trim() : undefined,
            wheelchair: Boolean(wheelchair),
            foodService: Boolean(foodService)
        });

        return res.status(201).json({
            message: "Passenger added successfully",
            passenger
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to add passenger." });
    }
};

/**
 * Update passenger details.
 */
exports.updatePassenger = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid passenger ID format." });
        }

        const updateData = { ...req.body };
        if (updateData.age !== undefined) {
            const numericAge = Number(updateData.age);
            if (!Number.isInteger(numericAge) || numericAge < 1 || numericAge > 120) {
                return res.status(400).json({ error: "Age must be an integer between 1 and 120." });
            }
            updateData.age = numericAge;
        }

        const passenger = await Passenger.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true
        });

        if (!passenger) {
            return res.status(404).json({ error: `Passenger with ID ${id} not found.` });
        }

        return res.json({
            message: "Passenger updated successfully",
            passenger
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to update passenger." });
    }
};

/**
 * Delete passenger record.
 */
exports.deletePassenger = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid passenger ID format." });
        }

        const passenger = await Passenger.findByIdAndDelete(id);
        if (!passenger) {
            return res.status(404).json({ error: `Passenger with ID ${id} not found.` });
        }

        return res.json({
            message: "Passenger deleted successfully",
            passengerId: id
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to delete passenger." });
    }
};

/**
 * Get all bookings for a specific passenger.
 */
exports.getPassengerBookings = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid passenger ID format." });
        }

        const passenger = await Passenger.findById(id);
        if (!passenger) {
            return res.status(404).json({ error: `Passenger with ID ${id} not found.` });
        }

        const bookings = await Booking.find({ passenger: id })
            .populate("passenger")
            .populate("flight")
            .sort({ bookingDate: -1, ticketNumber: 1 });

        return res.json(bookings);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch passenger bookings." });
    }
};
