const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: true
        },
        seq: {
            type: Number,
            default: 999
        }
    },
    {
        versionKey: false
    }
);

const Counter = mongoose.model("Counter", counterSchema);

/**
 * Atomically generates the next sequence number for a given counter key.
 * If the counter does not exist, it initializes with seq: 999 so the first
 * increment returns 1000 (matching the Java application's ticketCounter starting at 1000).
 */
const getNextSequence = async (name) => {
    // Ensure counter exists with starting base of 999 if newly inserted
    await Counter.findOneAndUpdate(
        { _id: name },
        { $setOnInsert: { seq: 999 } },
        { upsert: true }
    );

    const counter = await Counter.findOneAndUpdate(
        { _id: name },
        { $inc: { seq: 1 } },
        { returnDocument: "after" }
    );

    return counter.seq;
};

module.exports = { Counter, getNextSequence };
