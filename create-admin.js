import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI || "mongodb://localhost:27017/patient-social-media"
        );
        console.log("Connected to DB");

        const adminData = {
            username: "testadmin",
            email: "admin@test.com",
            password: "password123",
            firstName: "Test",
            lastName: "Admin",
            role: "admin",
            isActive: true,
            isVerified: true
        };

        // Check if exists
        const existing = await User.findOne({ email: adminData.email });
        if (existing) {
            console.log("Admin already exists");
            // Update password just in case
            existing.password = adminData.password;
            await existing.save();
            console.log("Admin password updated");
        } else {
            const user = new User(adminData);
            await user.save();
            console.log("Admin created");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

createAdmin();
