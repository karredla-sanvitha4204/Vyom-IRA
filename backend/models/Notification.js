const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            default: "NEW_BOOKING"
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking"
        },
        bookingReference: {
            type: String,
            required: true
        },
        ticketNumber: {
            type: Number,
            required: true
        },
        passengerName: {
            type: String,
            required: true
        },
        passengerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Passenger"
        },
        flightNumber: {
            type: String,
            required: true
        },
        airline: {
            type: String,
            required: true
        },
        route: {
            type: String,
            required: true
        },
        source: {
            type: String,
            required: true
        },
        destination: {
            type: String,
            required: true
        },
        travelDate: {
            type: Date,
            default: Date.now
        },
        departureTime: {
            type: String,
            required: true
        },
        travelClass: {
            type: String,
            default: "Economy"
        },
        seatNumber: {
            type: Number,
            required: true
        },
        fare: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            default: "CONFIRMED"
        },
        read: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ read: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
