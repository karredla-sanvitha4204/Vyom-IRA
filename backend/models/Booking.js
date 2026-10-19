const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        ticketNumber: {
            type: Number,
            required: [true, "ticketNumber is required"],
            unique: true
        },
        bookingReference: {
            type: String,
            trim: true
        },
        flightId: {
            type: Number,
            required: [true, "flightId is required"],
            min: [1, "flightId must be a positive integer"]
        },
        flight: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Flight"
        },
        passenger: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Passenger",
            required: [true, "passenger reference is required"]
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        travelClass: {
            type: String,
            enum: ["Economy", "Premium Economy", "Business Class", "First Class"],
            default: "Economy"
        },
        fare: {
            type: Number,
            required: [true, "fare is required"],
            min: [0, "fare must be non-negative"]
        },
        seatNumber: {
            type: Number,
            required: [true, "seatNumber is required"],
            min: [1, "seatNumber must be at least 1"]
        },
        wheelchair: {
            type: Boolean,
            default: false
        },
        foodService: {
            type: Boolean,
            default: false
        },
        gateNumber: {
            type: Number,
            min: [1, "gateNumber must be at least 1"],
            max: [20, "gateNumber cannot exceed 20"]
        },
        status: {
            type: String,
            enum: ["CONFIRMED", "BOARDED", "CANCELLED"],
            default: "CONFIRMED"
        },
        bookingDate: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Pre-save to auto-generate standard VYOMIRA bookingReference if not explicitly provided
bookingSchema.pre("save", function () {
    if (!this.bookingReference && this.ticketNumber) {
        this.bookingReference = `VY-${this.ticketNumber}`;
    }
});

// Compound partial unique index:
// Guarantees that only ONE active ("CONFIRMED" or "BOARDED") booking can hold a given seat on a flight.
// Cancelled bookings release the seat for immediate re-booking.
bookingSchema.index(
    { flightId: 1, seatNumber: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: ["CONFIRMED", "BOARDED"] } }
    }
);

// Index to optimize booking lookups by passenger and user
bookingSchema.index({ passenger: 1 });
bookingSchema.index({ user: 1 });
bookingSchema.index({ bookingReference: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
