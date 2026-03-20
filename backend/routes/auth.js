/* global process */
import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import { sendOtpEmail } from "../utils/mailer.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      employeeId: user.employeeId?.toString() ?? null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({
    token,
    user: {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      employeeId: user.employeeId?.toString() ?? null,
    },
  });
});

router.post("/request-password-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const employee = await Employee.findOne({ email: email.trim() });
  if (!employee) {
    return res.status(404).json({ error: "Employee email not found" });
  }

  const user = await User.findOne({ employeeId: employee._id, role: "employee" });
  if (!user) {
    return res.status(404).json({ error: "Employee account not found" });
  }

  const now = new Date();
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  user.passwordResetOtpHash = otpHash;
  user.passwordResetOtpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);
  user.passwordResetOtpRequestedAt = now;
  await user.save();

  const mailResult = await sendOtpEmail({
    to: employee.email,
    otp,
    employeeName: employee.name,
  });

  res.json({
    message: mailResult.previewMode ? "OTP generated in preview mode" : "OTP sent successfully",
    previewMode: mailResult.previewMode,
    previewOtp: mailResult.previewOtp,
  });
});

router.post("/verify-password-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const employee = await Employee.findOne({ email: email.trim() });
  if (!employee) {
    return res.status(404).json({ error: "Employee email not found" });
  }

  const user = await User.findOne({ employeeId: employee._id, role: "employee" });
  if (!user) {
    return res.status(404).json({ error: "Employee account not found" });
  }

  if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
    return res.status(400).json({ error: "OTP has not been requested" });
  }

  if (new Date(user.passwordResetOtpExpiresAt).getTime() < Date.now()) {
    return res.status(400).json({ error: "OTP has expired" });
  }

  const otpHash = crypto.createHash("sha256").update(String(otp).trim()).digest("hex");
  if (otpHash !== user.passwordResetOtpHash) {
    return res.status(400).json({ error: "OTP is invalid" });
  }

  const resetToken = jwt.sign(
    {
      userId: user._id.toString(),
      email: employee.email,
      purpose: "password-reset",
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  res.json({
    message: "OTP verified successfully",
    resetToken,
  });
});

router.post("/reset-password-with-otp", async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return res.status(400).json({ error: "Reset token and new password are required" });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  let payload;
  try {
    payload = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch {
    return res.status(400).json({ error: "Reset token is invalid or expired" });
  }

  if (payload.purpose !== "password-reset" || !payload.userId) {
    return res.status(400).json({ error: "Reset token is invalid" });
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    return res.status(404).json({ error: "Account not found" });
  }

  if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
    return res.status(400).json({ error: "OTP verification session is not available" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordResetOtpHash = "";
  user.passwordResetOtpExpiresAt = null;
  user.passwordResetOtpRequestedAt = null;
  await user.save();

  res.json({ message: "Password updated successfully" });
});

export default router;
