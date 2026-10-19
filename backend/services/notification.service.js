/**
 * Admin Notification Service for VYOMIRA Airline Management System
 * Dispatches and persists real-time notifications whenever a booking is created.
 */

const Notification = require("../models/Notification");

/**
 * Creates and stores a booking notification for administrators.
 * @param {Object} booking - Populated Booking object
 * @param {Object} flight - Flight object
 * @param {Object} passenger - Passenger object
 */
async function dispatchBookingNotification(booking, flight, passenger) {
    try {
        const flightNum = flight.flightNumber || `VY-${flight.flightId}`;
        const ref = booking.bookingReference || `VY-${booking.ticketNumber}`;
        const fareFormatted = (booking.fare || flight.fare || 3500).toLocaleString("en-IN");
        const travelClass = booking.travelClass || "Economy";

        const notification = await Notification.create({
            type: "NEW_BOOKING",
            title: `New Booking: #${booking.ticketNumber} (${ref})`,
            message: `${passenger.name} reserved Seat ${booking.seatNumber} (${travelClass}) on ${flight.company} ${flightNum} (${flight.source} ➔ ${flight.destination}) for ₹${fareFormatted}`,
            bookingId: booking._id,
            bookingReference: ref,
            ticketNumber: booking.ticketNumber,
            passengerName: passenger.name,
            passengerId: passenger._id,
            flightNumber: flightNum,
            airline: flight.company,
            route: `${flight.source} (${flight.sourceCode || "ORG"}) ➔ ${flight.destination} (${flight.destinationCode || "DST"})`,
            source: flight.source,
            destination: flight.destination,
            travelDate: booking.bookingDate || new Date(),
            departureTime: flight.departure || "10:00",
            travelClass: travelClass,
            seatNumber: booking.seatNumber,
            fare: booking.fare || flight.fare || 3500,
            status: booking.status || "CONFIRMED"
        });

        return notification;
    } catch (err) {
        console.error("Error creating booking notification:", err.message);
        return null;
    }
}

/**
 * Retrieves latest notifications for the administrator dashboard.
 * @param {number} limit - Maximum number of records to return
 */
async function getNotifications(limit = 50) {
    return Notification.find().sort({ createdAt: -1 }).limit(limit);
}

/**
 * Marks a notification as read.
 * @param {string} id - Notification document ID
 */
async function markAsRead(id) {
    return Notification.findByIdAndUpdate(id, { read: true }, { new: true });
}

/**
 * Marks all unread notifications as read.
 */
async function markAllAsRead() {
    return Notification.updateMany({ read: false }, { read: true });
}

module.exports = {
    dispatchBookingNotification,
    getNotifications,
    markAsRead,
    markAllAsRead
};
