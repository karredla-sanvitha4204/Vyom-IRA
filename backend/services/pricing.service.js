/**
 * Pricing Service for VYOMIRA Airline Management System
 * Handles class-specific fare calculations, rule enforcement, and backend verification.
 * 
 * Rules:
 * - Every displayed and booked ticket fare must be at least ₹1,000.
 * - Higher travel classes cost more than lower travel classes:
 *   First Class > Business Class > Premium Economy > Economy >= 1000.
 * - Never trust client-submitted fares; the backend validates or computes the official fare.
 */

const CLASS_MULTIPLIERS = {
    "Economy": 1.0,
    "Premium Economy": 1.57, // ~5500 if base is 3500
    "Business Class": 3.43,  // ~12000 if base is 3500
    "First Class": 7.14      // ~25000 if base is 3500
};

const CLASS_SEAT_RANGES = {
    "First Class": { start: 1, end: 2 },          // 2 seats
    "Business Class": { start: 3, end: 8 },       // 6 seats
    "Premium Economy": { start: 9, end: 18 },     // 10 seats
    "Economy": { start: 19, end: 60 }             // 42 seats
};

const MINIMUM_FARE = 1000;

/**
 * Calculates the authoritative fare for a given flight and travel class.
 * @param {Object} flight - Mongoose flight document or plain object
 * @param {string} travelClass - 'Economy' | 'Premium Economy' | 'Business Class' | 'First Class'
 * @returns {number} Confirmed fare in INR (minimum ₹1,000)
 */
function calculateAuthoritativeFare(flight, travelClass = "Economy") {
    const validClass = ["Economy", "Premium Economy", "Business Class", "First Class"].includes(travelClass)
        ? travelClass
        : "Economy";

    // 1. Check if the flight has an explicit class fare configured
    if (flight && flight.classes && flight.classes[validClass] && typeof flight.classes[validClass].fare === "number") {
        return Math.max(MINIMUM_FARE, Math.round(flight.classes[validClass].fare));
    }

    // 2. Fall back to base fare multiplied by class multiplier
    const baseFare = Math.max(MINIMUM_FARE, (flight && typeof flight.fare === "number") ? flight.fare : 3500);
    const multiplier = CLASS_MULTIPLIERS[validClass] || 1.0;
    return Math.max(MINIMUM_FARE, Math.round(baseFare * multiplier));
}

/**
 * Determines which travel class a specific seat belongs to based on cabin layout.
 * @param {number} seatNumber - Seat number (1-60)
 * @returns {string} Travel class name
 */
function getSeatTravelClass(seatNumber) {
    const seat = Number(seatNumber);
    if (seat >= 1 && seat <= 2) return "First Class";
    if (seat >= 3 && seat <= 8) return "Business Class";
    if (seat >= 9 && seat <= 18) return "Premium Economy";
    return "Economy";
}

/**
 * Validates that class fares satisfy hierarchy rules (higher classes cost more).
 * @param {Object} classes - Object with Economy, Premium Economy, Business Class, First Class
 * @returns {boolean} True if hierarchy is valid
 */
function validateFareHierarchy(classes) {
    if (!classes) return true;
    const eco = classes["Economy"]?.fare || 0;
    const prem = classes["Premium Economy"]?.fare || 0;
    const bus = classes["Business Class"]?.fare || 0;
    const first = classes["First Class"]?.fare || 0;

    if (eco < MINIMUM_FARE) return false;
    if (prem && prem < eco) return false;
    if (bus && bus < prem) return false;
    if (first && first < bus) return false;
    return true;
}

module.exports = {
    CLASS_MULTIPLIERS,
    CLASS_SEAT_RANGES,
    MINIMUM_FARE,
    calculateAuthoritativeFare,
    getSeatTravelClass,
    validateFareHierarchy
};
