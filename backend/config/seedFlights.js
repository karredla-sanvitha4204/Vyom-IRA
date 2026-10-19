const Flight = require("../models/Flight");

/**
 * Seed dataset of realistic sample demonstration flights.
 * Covers Indian metro corridors, holiday destinations, and sample international connections.
 * 
 * Guarantees:
 * - Idempotency: updates existing records without duplication or wiping bookings.
 * - Carrier spelling: 'IndiGo' correctly applied everywhere.
 * - Class-specific fares & capacities configured (all fares >= ₹1,000 in INR).
 * - Complete airport names, IATA codes, departure/arrival schedules, and travel durations.
 */
const SAMPLE_FLIGHTS = [
    {
        flightId: 101,
        flightNumber: "6E-101",
        company: "IndiGo",
        source: "Hyderabad",
        sourceAirport: "Rajiv Gandhi International Airport",
        sourceCode: "HYD",
        destination: "Chennai",
        destinationAirport: "Chennai International Airport",
        destinationCode: "MAA",
        departure: "07:15",
        arrival: "08:30",
        duration: "1h 15m",
        fare: 3500,
        classes: {
            "Economy": { fare: 3500, capacity: 42 },
            "Premium Economy": { fare: 5500, capacity: 10 },
            "Business Class": { fare: 12000, capacity: 6 },
            "First Class": { fare: 25000, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 102,
        flightNumber: "AI-102",
        company: "Air India",
        source: "Mumbai",
        sourceAirport: "Chhatrapati Shivaji Maharaj International Airport",
        sourceCode: "BOM",
        destination: "Delhi",
        destinationAirport: "Indira Gandhi International Airport",
        destinationCode: "DEL",
        departure: "08:00",
        arrival: "10:10",
        duration: "2h 10m",
        fare: 4200,
        classes: {
            "Economy": { fare: 4200, capacity: 42 },
            "Premium Economy": { fare: 6800, capacity: 10 },
            "Business Class": { fare: 14500, capacity: 6 },
            "First Class": { fare: 28000, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 103,
        flightNumber: "6E-103",
        company: "IndiGo",
        source: "Hyderabad",
        sourceAirport: "Rajiv Gandhi International Airport",
        sourceCode: "HYD",
        destination: "Delhi",
        destinationAirport: "Indira Gandhi International Airport",
        destinationCode: "DEL",
        departure: "06:30",
        arrival: "08:45",
        duration: "2h 15m",
        fare: 4500,
        classes: {
            "Economy": { fare: 4500, capacity: 42 },
            "Premium Economy": { fare: 6900, capacity: 10 },
            "Business Class": { fare: 15000, capacity: 6 },
            "First Class": { fare: 29000, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 104,
        flightNumber: "AI-104",
        company: "Air India",
        source: "Hyderabad",
        sourceAirport: "Rajiv Gandhi International Airport",
        sourceCode: "HYD",
        destination: "Mumbai",
        destinationAirport: "Chhatrapati Shivaji Maharaj International Airport",
        destinationCode: "BOM",
        departure: "09:45",
        arrival: "11:15",
        duration: "1h 30m",
        fare: 3800,
        classes: {
            "Economy": { fare: 3800, capacity: 42 },
            "Premium Economy": { fare: 5900, capacity: 10 },
            "Business Class": { fare: 13000, capacity: 6 },
            "First Class": { fare: 26000, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 105,
        flightNumber: "6E-105",
        company: "IndiGo",
        source: "Hyderabad",
        sourceAirport: "Rajiv Gandhi International Airport",
        sourceCode: "HYD",
        destination: "Bengaluru",
        destinationAirport: "Kempegowda International Airport",
        destinationCode: "BLR",
        departure: "11:20",
        arrival: "12:30",
        duration: "1h 10m",
        fare: 3200,
        classes: {
            "Economy": { fare: 3200, capacity: 42 },
            "Premium Economy": { fare: 5100, capacity: 10 },
            "Business Class": { fare: 11500, capacity: 6 },
            "First Class": { fare: 23000, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 106,
        flightNumber: "6E-106",
        company: "IndiGo",
        source: "Hyderabad",
        sourceAirport: "Rajiv Gandhi International Airport",
        sourceCode: "HYD",
        destination: "Kolkata",
        destinationAirport: "Netaji Subhash Chandra Bose International Airport",
        destinationCode: "CCU",
        departure: "14:15",
        arrival: "16:20",
        duration: "2h 05m",
        fare: 4800,
        classes: {
            "Economy": { fare: 4800, capacity: 42 },
            "Premium Economy": { fare: 7200, capacity: 10 },
            "Business Class": { fare: 16000, capacity: 6 },
            "First Class": { fare: 31000, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 107,
        flightNumber: "AI-107",
        company: "Air India",
        source: "Hyderabad",
        sourceAirport: "Rajiv Gandhi International Airport",
        sourceCode: "HYD",
        destination: "Kochi",
        destinationAirport: "Cochin International Airport",
        destinationCode: "COK",
        departure: "15:40",
        arrival: "17:20",
        duration: "1h 40m",
        fare: 3900,
        classes: {
            "Economy": { fare: 3900, capacity: 42 },
            "Premium Economy": { fare: 6000, capacity: 10 },
            "Business Class": { fare: 13500, capacity: 6 },
            "First Class": { fare: 26500, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 108,
        flightNumber: "6E-108",
        company: "IndiGo",
        source: "Hyderabad",
        sourceAirport: "Rajiv Gandhi International Airport",
        sourceCode: "HYD",
        destination: "Goa",
        destinationAirport: "Dabolim Airport",
        destinationCode: "GOI",
        departure: "18:00",
        arrival: "19:20",
        duration: "1h 20m",
        fare: 4100,
        classes: {
            "Economy": { fare: 4100, capacity: 42 },
            "Premium Economy": { fare: 6400, capacity: 10 },
            "Business Class": { fare: 14000, capacity: 6 },
            "First Class": { fare: 27500, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 109,
        flightNumber: "SG-109",
        company: "SpiceJet",
        source: "Hyderabad",
        sourceAirport: "Rajiv Gandhi International Airport",
        sourceCode: "HYD",
        destination: "Ahmedabad",
        destinationAirport: "Sardar Vallabhbhai Patel International Airport",
        destinationCode: "AMD",
        departure: "19:30",
        arrival: "21:15",
        duration: "1h 45m",
        fare: 3600,
        classes: {
            "Economy": { fare: 3600, capacity: 42 },
            "Premium Economy": { fare: 5600, capacity: 10 },
            "Business Class": { fare: 12500, capacity: 6 },
            "First Class": { fare: 24500, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 110,
        flightNumber: "UK-110",
        company: "Vistara",
        source: "Delhi",
        sourceAirport: "Indira Gandhi International Airport",
        sourceCode: "DEL",
        destination: "Mumbai",
        destinationAirport: "Chhatrapati Shivaji Maharaj International Airport",
        destinationCode: "BOM",
        departure: "07:00",
        arrival: "09:15",
        duration: "2h 15m",
        fare: 4400,
        classes: {
            "Economy": { fare: 4400, capacity: 42 },
            "Premium Economy": { fare: 7000, capacity: 10 },
            "Business Class": { fare: 15500, capacity: 6 },
            "First Class": { fare: 30000, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 111,
        flightNumber: "6E-111",
        company: "IndiGo",
        source: "Delhi",
        sourceAirport: "Indira Gandhi International Airport",
        sourceCode: "DEL",
        destination: "Bengaluru",
        destinationAirport: "Kempegowda International Airport",
        destinationCode: "BLR",
        departure: "08:30",
        arrival: "11:15",
        duration: "2h 45m",
        fare: 5100,
        classes: {
            "Economy": { fare: 5100, capacity: 42 },
            "Premium Economy": { fare: 7800, capacity: 10 },
            "Business Class": { fare: 17000, capacity: 6 },
            "First Class": { fare: 33000, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 112,
        flightNumber: "AI-112",
        company: "Air India",
        source: "Delhi",
        sourceAirport: "Indira Gandhi International Airport",
        sourceCode: "DEL",
        destination: "Chennai",
        destinationAirport: "Chennai International Airport",
        destinationCode: "MAA",
        departure: "10:15",
        arrival: "13:05",
        duration: "2h 50m",
        fare: 5300,
        classes: {
            "Economy": { fare: 5300, capacity: 42 },
            "Premium Economy": { fare: 8100, capacity: 10 },
            "Business Class": { fare: 17500, capacity: 6 },
            "First Class": { fare: 34000, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 113,
        flightNumber: "6E-113",
        company: "IndiGo",
        source: "Delhi",
        sourceAirport: "Indira Gandhi International Airport",
        sourceCode: "DEL",
        destination: "Kochi",
        destinationAirport: "Cochin International Airport",
        destinationCode: "COK",
        departure: "13:45",
        arrival: "17:00",
        duration: "3h 15m",
        fare: 5800,
        classes: {
            "Economy": { fare: 5800, capacity: 42 },
            "Premium Economy": { fare: 8900, capacity: 10 },
            "Business Class": { fare: 19000, capacity: 6 },
            "First Class": { fare: 37000, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 114,
        flightNumber: "6E-114",
        company: "IndiGo",
        source: "Mumbai",
        sourceAirport: "Chhatrapati Shivaji Maharaj International Airport",
        sourceCode: "BOM",
        destination: "Chennai",
        destinationAirport: "Chennai International Airport",
        destinationCode: "MAA",
        departure: "11:00",
        arrival: "12:55",
        duration: "1h 55m",
        fare: 3900,
        classes: {
            "Economy": { fare: 3900, capacity: 42 },
            "Premium Economy": { fare: 6100, capacity: 10 },
            "Business Class": { fare: 13500, capacity: 6 },
            "First Class": { fare: 26500, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 115,
        flightNumber: "QP-115",
        company: "Akasa Air",
        source: "Mumbai",
        sourceAirport: "Chhatrapati Shivaji Maharaj International Airport",
        sourceCode: "BOM",
        destination: "Bengaluru",
        destinationAirport: "Kempegowda International Airport",
        destinationCode: "BLR",
        departure: "14:30",
        arrival: "16:10",
        duration: "1h 40m",
        fare: 3700,
        classes: {
            "Economy": { fare: 3700, capacity: 42 },
            "Premium Economy": { fare: 5800, capacity: 10 },
            "Business Class": { fare: 13000, capacity: 6 },
            "First Class": { fare: 25500, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 116,
        flightNumber: "6E-116",
        company: "IndiGo",
        source: "Mumbai",
        sourceAirport: "Chhatrapati Shivaji Maharaj International Airport",
        sourceCode: "BOM",
        destination: "Goa",
        destinationAirport: "Dabolim Airport",
        destinationCode: "GOI",
        departure: "16:45",
        arrival: "17:55",
        duration: "1h 10m",
        fare: 3400,
        classes: {
            "Economy": { fare: 3400, capacity: 42 },
            "Premium Economy": { fare: 5400, capacity: 10 },
            "Business Class": { fare: 12000, capacity: 6 },
            "First Class": { fare: 24000, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 117,
        flightNumber: "6E-117",
        company: "IndiGo",
        source: "Bengaluru",
        sourceAirport: "Kempegowda International Airport",
        sourceCode: "BLR",
        destination: "Kolkata",
        destinationAirport: "Netaji Subhash Chandra Bose International Airport",
        destinationCode: "CCU",
        departure: "09:10",
        arrival: "11:40",
        duration: "2h 30m",
        fare: 4900,
        classes: {
            "Economy": { fare: 4900, capacity: 42 },
            "Premium Economy": { fare: 7500, capacity: 10 },
            "Business Class": { fare: 16500, capacity: 6 },
            "First Class": { fare: 32000, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 118,
        flightNumber: "AI-118",
        company: "Air India",
        source: "Bengaluru",
        sourceAirport: "Kempegowda International Airport",
        sourceCode: "BLR",
        destination: "Kochi",
        destinationAirport: "Cochin International Airport",
        destinationCode: "COK",
        departure: "12:00",
        arrival: "13:05",
        duration: "1h 05m",
        fare: 3100,
        classes: {
            "Economy": { fare: 3100, capacity: 42 },
            "Premium Economy": { fare: 4900, capacity: 10 },
            "Business Class": { fare: 11000, capacity: 6 },
            "First Class": { fare: 22000, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 119,
        flightNumber: "6E-119",
        company: "IndiGo",
        source: "Chennai",
        sourceAirport: "Chennai International Airport",
        sourceCode: "MAA",
        destination: "Kochi",
        destinationAirport: "Cochin International Airport",
        destinationCode: "COK",
        departure: "14:50",
        arrival: "16:05",
        duration: "1h 15m",
        fare: 3300,
        classes: {
            "Economy": { fare: 3300, capacity: 42 },
            "Premium Economy": { fare: 5200, capacity: 10 },
            "Business Class": { fare: 11800, capacity: 6 },
            "First Class": { fare: 23500, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 120,
        flightNumber: "UK-120",
        company: "Vistara",
        source: "Chennai",
        sourceAirport: "Chennai International Airport",
        sourceCode: "MAA",
        destination: "Delhi",
        destinationAirport: "Indira Gandhi International Airport",
        destinationCode: "DEL",
        departure: "17:15",
        arrival: "20:00",
        duration: "2h 45m",
        fare: 5400,
        classes: {
            "Economy": { fare: 5400, capacity: 42 },
            "Premium Economy": { fare: 8200, capacity: 10 },
            "Business Class": { fare: 17800, capacity: 6 },
            "First Class": { fare: 34500, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 121,
        flightNumber: "AI-121",
        company: "Air India",
        source: "Kolkata",
        sourceAirport: "Netaji Subhash Chandra Bose International Airport",
        sourceCode: "CCU",
        destination: "Mumbai",
        destinationAirport: "Chhatrapati Shivaji Maharaj International Airport",
        destinationCode: "BOM",
        departure: "18:40",
        arrival: "21:20",
        duration: "2h 40m",
        fare: 5200,
        classes: {
            "Economy": { fare: 5200, capacity: 42 },
            "Premium Economy": { fare: 8000, capacity: 10 },
            "Business Class": { fare: 17200, capacity: 6 },
            "First Class": { fare: 33500, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 122,
        flightNumber: "EK-122",
        company: "Emirates",
        source: "Mumbai",
        sourceAirport: "Chhatrapati Shivaji Maharaj International Airport",
        sourceCode: "BOM",
        destination: "Dubai",
        destinationAirport: "Dubai International Airport",
        destinationCode: "DXB",
        departure: "04:30",
        arrival: "06:30",
        duration: "3h 30m",
        fare: 18500,
        classes: {
            "Economy": { fare: 18500, capacity: 42 },
            "Premium Economy": { fare: 28500, capacity: 10 },
            "Business Class": { fare: 54000, capacity: 6 },
            "First Class": { fare: 95000, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    },
    {
        flightId: 123,
        flightNumber: "SQ-123",
        company: "Singapore Airlines",
        source: "Delhi",
        sourceAirport: "Indira Gandhi International Airport",
        sourceCode: "DEL",
        destination: "Singapore",
        destinationAirport: "Singapore Changi Airport",
        destinationCode: "SIN",
        departure: "22:00",
        arrival: "06:15",
        duration: "5h 45m",
        fare: 22000,
        classes: {
            "Economy": { fare: 22000, capacity: 42 },
            "Premium Economy": { fare: 34000, capacity: 10 },
            "Business Class": { fare: 65000, capacity: 6 },
            "First Class": { fare: 120000, capacity: 2 }
        },
        totalSeats: 60,
        status: "Scheduled"
    }
];

/**
 * Idempotently seeds or updates demonstration flights.
 * Ensures IndiGo carrier spelling and class-specific fares & capacities.
 */
async function seedFlights() {
    try {
        let createdCount = 0;
        let updatedCount = 0;

        for (const flightData of SAMPLE_FLIGHTS) {
            const existing = await Flight.findOne({ flightId: flightData.flightId });

            if (existing) {
                // Update fields to ensure 'IndiGo', class fares, airport names & codes are up to date
                existing.company = flightData.company; // Sets authoritative carrier name 'IndiGo'
                existing.flightNumber = flightData.flightNumber;
                existing.sourceAirport = flightData.sourceAirport;
                existing.sourceCode = flightData.sourceCode;
                existing.destinationAirport = flightData.destinationAirport;
                existing.destinationCode = flightData.destinationCode;
                existing.duration = flightData.duration;
                existing.classes = flightData.classes;
                existing.fare = flightData.fare;
                existing.totalSeats = flightData.totalSeats;
                existing.status = flightData.status;

                await existing.save();
                updatedCount++;
            } else {
                await Flight.create(flightData);
                createdCount++;
            }
        }

        console.log(`[SeedFlights] Completed: ${createdCount} created, ${updatedCount} updated.`);
    } catch (err) {
        console.error("[SeedFlights] Error:", err.message);
    }
}

module.exports = seedFlights;
