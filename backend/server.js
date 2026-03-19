/* global process */
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import employeeRoutes from "./routes/employees.js";
import projectRoutes from "./routes/projects.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cho phép truy cập ảnh
app.use("/uploads", express.static("uploads"));

// connect DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    // Seed default admin user (if missing)
    const adminUsername = "admin";
    const adminPassword = "123456";

    const existing = await User.findOne({ username: adminUsername });
    if (!existing) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await User.create({ username: adminUsername, passwordHash });
      console.log("Created default admin user (username: admin)");
    }
  })
  .catch((err) => console.log(err));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/projects", projectRoutes);

// test
app.get("/", (req, res) => {
  res.send("API running...");
});

// run server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
