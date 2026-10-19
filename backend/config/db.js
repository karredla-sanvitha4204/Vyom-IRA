const mongoose = require("mongoose");

let isConnecting = false;
let retryInterval = null;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }
    if (isConnecting) return null;
    isConnecting = true;

    try {
        let uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/airline_db";
        if (uri.includes("<db_password>")) {
            console.warn("[Database] '<db_password>' placeholder detected in MONGODB_URI. Using local MongoDB for local development.");
            uri = "mongodb://127.0.0.1:27017/airline_db";
        }
        const conn = await mongoose.connect(uri, {
            dbName: "airline_db",
            serverSelectionTimeoutMS: 5000
        });
        console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
        isConnecting = false;

        // Clear background retry interval once successfully connected
        if (retryInterval) {
            clearInterval(retryInterval);
            retryInterval = null;
        }

        return conn;
    } catch (error) {
        isConnecting = false;
        console.error(`MongoDB Connection Error: ${error.message}`);
        if (error.message.includes("bad auth") || error.message.includes("authentication failed")) {
            console.error("Hint: Check the MongoDB Atlas username and password in MONGODB_URI.");
        } else if (error.message.includes("whitelist") || error.message.includes("querySrv") || error.message.includes("ETIMEDOUT")) {
            console.error("Hint: Verify Network Access in MongoDB Atlas allows 0.0.0.0/0.");
        }
        return null;
    }
};

const startAutoReconnect = (onSuccess) => {
    if (retryInterval) return;
    retryInterval = setInterval(async () => {
        if (mongoose.connection.readyState === 1) {
            clearInterval(retryInterval);
            retryInterval = null;
            return;
        }
        console.log("[Database] Retrying MongoDB connection in background...");
        const conn = await connectDB();
        if (conn && typeof onSuccess === "function") {
            try {
                await onSuccess(conn);
            } catch (err) {
                console.error("[Database] Error during post-connection hook:", err.message);
            }
        }
    }, 15000);
    if (retryInterval.unref) retryInterval.unref();
};

connectDB.startAutoReconnect = startAutoReconnect;
module.exports = connectDB;

