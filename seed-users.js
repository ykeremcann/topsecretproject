import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const users = [
    {
        firstName: "Mehmet",
        lastName: "Yılmaz",
        role: "doctor",
        doctorInfo: {
            specialization: "Kardiyoloji",
            hospital: "Şehir Hastanesi",
            experience: 15,
            approvalStatus: "approved",
            location: "İstanbul"
        }
    },
    {
        firstName: "Serkan",
        lastName: "Kaya",
        role: "doctor",
        doctorInfo: {
            specialization: "Dahiliye",
            hospital: "Devlet Hastanesi",
            experience: 8,
            approvalStatus: "approved",
            location: "Ankara"
        }
    },
    {
        firstName: "Kerem",
        lastName: "Demir",
        role: "doctor",
        doctorInfo: {
            specialization: "Nöroloji",
            hospital: "Özel Klinik",
            experience: 12,
            approvalStatus: "approved",
            location: "İzmir"
        }
    },
    { firstName: "Ayşe", lastName: "Çelik", role: "patient" },
    { firstName: "Fatma", lastName: "Öztürk", role: "patient" },
    { firstName: "Mustafa", lastName: "Aydın", role: "patient" },
    { firstName: "Zeynep", lastName: "Yıldız", role: "patient" },
    { firstName: "Emre", lastName: "Arslan", role: "patient" },
    { firstName: "Burak", lastName: "Doğan", role: "patient" },
    { firstName: "Elif", lastName: "Kılıç", role: "patient" },
    { firstName: "Hakan", lastName: "Çetin", role: "patient" },
    { firstName: "Selin", lastName: "Koç", role: "patient" },
    { firstName: "Can", lastName: "Kurt", role: "patient" }
];

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/patient-social-media");
        console.log("Connected to DB");

        const createdUsers = [];

        for (const userData of users) {
            const username = `${userData.firstName.toLowerCase()}${userData.lastName.toLowerCase()}`;
            const email = `${username}@gmail.com`;
            const password = "Sagligim1.";

            // Check if user exists
            const existing = await User.findOne({ email });
            if (existing) {
                console.log(`User ${email} already exists`);
                createdUsers.push({
                    role: userData.role,
                    username: existing.username,
                    email: existing.email,
                    password: password
                });
                continue;
            }

            const newUser = new User({
                ...userData,
                username,
                email,
                password,
                isVerified: true,
                isActive: true
            });

            await newUser.save();
            console.log(`Created ${userData.role}: ${username}`);
            createdUsers.push({
                role: userData.role,
                username: username,
                email: email,
                password: password
            });
        }

        console.log("\n--- LOGIN CREDENTIALS ---");
        createdUsers.forEach(user => {
            console.log(`[${user.role.toUpperCase()}] Name: ${user.username} | Email: ${user.email} | Password: ${user.password}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Error seeding users:", error);
        process.exit(1);
    }
};

seedUsers();
