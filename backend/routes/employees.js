import express from "express";
import Employee from "../models/Employee.js";
import upload from "../middleware/upload.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// All employee routes require authentication
router.use(auth);

// GET ALL
router.get("/", async (req, res) => {
  console.log("[EMPLOYEES] GET /api/employees called");
  try {
    const data = await Employee.find();
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
router.post("/", upload.single("avatar"), async (req, res) => {
  try {
    const newEmp = new Employee({
      ...req.body,
      avatar: req.file
        ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
        : req.body.avatar || "",
    });

    await newEmp.save();
    res.json(newEmp);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE (supports avatar upload)
router.put("/:id", upload.single("avatar"), async (req, res) => {
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
