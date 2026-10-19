const mongoose = require("mongoose");

const passengerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Passenger name is required"],
            trim: true
        },
        age: {
            type: Number,
            required: [true, "Passenger age is required"],
            min: [1, "Age must be at least 1"],
            max: [120, "Age cannot exceed 120"]
        },
        email: {
            type: String,
            trim: true,
            default: ""
        },
        phone: {
            type: String,
            trim: true,
            default: ""
        },
        wheelchair: {
            type: Boolean,
            default: false
        },
        foodService: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

module.exports = mongoose.model("Passenger", passengerSchema);
