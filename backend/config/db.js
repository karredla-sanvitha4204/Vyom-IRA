const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        let uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/airline_db";
        if (uri.includes("<db_password>")) {
            console.warn("[Database] '<db_password>' placeholder detected in MONGODB_URI. Using local MongoDB for local development.");
            uri = "mongodb://127.0.0.1:27017/airline_db";
        }
        const conn = await mongoose.connect(uri, {
            dbName: "airline_db"
        });
        console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        if (error.message.includes("bad auth") || error.message.includes("authentication failed")) {
            console.error("Hint: Check the MongoDB Atlas username and password in MONGODB_URI.");
        } else if (error.message.includes("whitelist") || error.message.includes("querySrv")) {
            console.error("Hint: Verify Network Access in MongoDB Atlas allows 0.0.0.0/0.");
        }
        return null;
    }
};

module.exports = connectDB;
