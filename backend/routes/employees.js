import express from "express";
import bcrypt from "bcryptjs";
import Employee from "../models/Employee.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import upload from "../middleware/upload.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

// All employee routes require authentication
router.use(auth);

// GET ALL
router.get("/", async (req, res) => {
  console.log("[EMPLOYEES] GET /api/employees called");
  try {
    let data;

    if (req.user?.role === "admin") {
      data = await Employee.find();
    } else if (req.user?.employeeId) {
      const projects = await Project.find({ "members.employeeId": req.user.employeeId });
      const employeeIds = [...new Set(
        projects.flatMap((project) => (project.members ?? []).map((member) => member.employeeId))
      )];
      data = await Employee.find({ _id: { $in: employeeIds } });
    } else {
      data = [];
    }
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Ensure avatar URLs are absolute so frontend can load them correctly
    const normalized = data.map((doc) => {
      const emp = doc.toObject();
      if (emp.avatar?.startsWith("/uploads")) {
        emp.avatar = baseUrl + emp.avatar;
      }
      return emp;
    });

    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE (supports avatar upload)
router.post("/", requireAdmin, upload.single("avatar"), async (req, res) => {
  let newEmp;

  try {
    const { username, password, ...employeePayload } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    newEmp = new Employee({
      ...employeePayload,
      avatar: req.file
        ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
        : employeePayload.avatar || "",
    });

    await newEmp.save();
    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      username,
      passwordHash,
      role: "employee",
      employeeId: newEmp._id,
    });

    res.json(newEmp);
  } catch (err) {
    if (newEmp?._id) {
      await Employee.findByIdAndDelete(newEmp._id).catch(() => null);
    }
    res.status(400).json({ error: err.message });
  }
});

// DELETE
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    await User.findOneAndDelete({ employeeId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE (supports avatar upload)
router.put("/:id", requireAdmin, upload.single("avatar"), async (req, res) => {
  try {
    const updateData = {
      ...req.body,
    };

    if (req.file) {
      updateData.avatar = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
