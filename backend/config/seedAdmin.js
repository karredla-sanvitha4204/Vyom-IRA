const User = require("../models/User");

/**
 * Ensures initial default administrative and staff accounts exist.
 * This runs safely once on server startup without overwriting existing accounts.
 */
const seedInitialUsers = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || "admin@airline.com";
        const adminUsername = process.env.ADMIN_USERNAME || "admin";
        const adminPassword = process.env.ADMIN_PASSWORD || "AdminPassword@123";

        const existingAdmin = await User.findOne({
            $or: [{ email: adminEmail }, { username: adminUsername }, { role: "admin" }]
        });

        if (!existingAdmin) {
            await User.create({
                username: adminUsername,
                email: adminEmail,
                password: adminPassword,
                role: "admin",
                name: "System Administrator"
            });
            console.log(`Initial Admin account created: ${adminEmail}`);
        }

        // Seed a default operational staff user if none exists
        const staffEmail = "staff@airline.com";
        const existingStaff = await User.findOne({
            $or: [{ email: staffEmail }, { username: "staff" }]
        });

        if (!existingStaff) {
            await User.create({
                username: "staff",
                email: staffEmail,
                password: "StaffPassword@123",
                role: "staff",
                name: "Operations Ground Staff"
            });
            console.log(`Initial Staff account created: ${staffEmail}`);
        }
    } catch (error) {
        console.error("Error seeding initial users:", error.message);
    }
};

module.exports = seedInitialUsers;
