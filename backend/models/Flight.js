const mongoose = require("mongoose");

const flightClassSchema = new mongoose.Schema(
    {
        fare: { type: Number, required: true, min: [0, "fare must be non-negative"] },
        capacity: { type: Number, required: true, min: [1, "capacity must be at least 1"] },
        availableSeats: { type: Number, default: 0 }
    },
    { _id: false }
);

const flightSchema = new mongoose.Schema(
    {
        flightId: {
            type: Number,
            required: [true, "flightId is required"],
            unique: true,
            min: [1, "flightId must be a positive integer"]
        },
        flightNumber: {
            type: String,
            trim: true
        },
        company: {
            type: String,
            required: [true, "company is required"],
            trim: true
        },
        source: {
            type: String,
            required: [true, "source is required"],
            trim: true
        },
        sourceAirport: {
            type: String,
            trim: true,
            default: ""
        },
        sourceCode: {
            type: String,
            trim: true,
            uppercase: true,
            default: ""
        },
        destination: {
            type: String,
            required: [true, "destination is required"],
            trim: true
        },
        destinationAirport: {
            type: String,
            trim: true,
            default: ""
        },
        destinationCode: {
            type: String,
            trim: true,
            uppercase: true,
            default: ""
        },
        departure: {
            type: String,
            required: [true, "departure is required"],
            trim: true
        },
        arrival: {
            type: String,
            required: [true, "arrival is required"],
            trim: true
        },
        duration: {
            type: String,
            trim: true,
            default: "2h 00m"
        },
        fare: {
            type: Number,
            required: [true, "fare is required"],
            min: [0, "fare must be a non-negative number"]
        },
        classes: {
            Economy: {
                fare: { type: Number, default: 3500 },
                capacity: { type: Number, default: 42 }
            },
            "Premium Economy": {
                fare: { type: Number, default: 5500 },
                capacity: { type: Number, default: 10 }
            },
            "Business Class": {
                fare: { type: Number, default: 12000 },
                capacity: { type: Number, default: 6 }
            },
            "First Class": {
                fare: { type: Number, default: 25000 },
                capacity: { type: Number, default: 2 }
            }
        },
        totalSeats: {
            type: Number,
            default: 60,
            min: [1, "totalSeats must be at least 1"]
        },
        status: {
            type: String,
            default: "Scheduled",
            trim: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Pre-save hook to ensure default flightNumber and synchronize totalSeats with class capacities
flightSchema.pre("save", function () {
    if (!this.flightNumber) {
        const comp = (this.company || "VY").toUpperCase();
        const prefix = comp.includes("INDIGO") ? "6E" :
                       comp.includes("AIR INDIA") ? "AI" :
                       comp.includes("VISTARA") ? "UK" :
                       comp.includes("SPICEJET") ? "SG" :
                       comp.includes("AKASA") ? "QP" :
                       comp.includes("EMIRATES") ? "EK" :
                       comp.includes("SINGAPORE") ? "SQ" : "VY";
        this.flightNumber = `${prefix}-${this.flightId}`;
    }
    if (this.classes) {
        const total = (this.classes.Economy?.capacity || 0) +
                      (this.classes["Premium Economy"]?.capacity || 0) +
                      (this.classes["Business Class"]?.capacity || 0) +
                      (this.classes["First Class"]?.capacity || 0);
        if (total > 0) {
            this.totalSeats = total;
        }
    }
});

module.exports = mongoose.model("Flight", flightSchema);
