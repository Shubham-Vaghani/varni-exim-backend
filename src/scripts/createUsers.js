import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import connectDB from "../db/index.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

// Sample users data
const users = [
  {
    userId: "user001",
    email: "john@example.com",
    password: "password123",
    pin: "1234",
  },
  {
    userId: "user002",
    email: "jane@example.com",
    password: "password456",
    pin: "5678",
  },
  {
    userId: "admin",
    email: "admin@example.com",
    password: "admin123",
    pin: "0000",
  },
];

const createUsers = async () => {
  try {
    await connectDB();

    // Clear existing users
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Create new users
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.userId} (${userData.email})`);
    }

    console.log("\n✅ All users created successfully!");
    console.log("\nYou can now login with:");
    users.forEach((user) => {
      console.log(
        `- User ID: ${user.userId}, Password: ${user.password}, PIN: ${user.pin}`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("Error creating users:", error);
    process.exit(1);
  }
};

createUsers();
