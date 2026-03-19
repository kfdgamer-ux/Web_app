import express from "express";
import Project from "../models/Project.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const buildHistorySnapshot = (project) => ({
  name: project.name,
  desc: project.desc,
  formNo: project.formNo,
  revision: project.revision,
  date: project.date,
  code: project.code,
  siteName: project.siteName,
  progressChecks: project.progressChecks,
  processControls: project.processControls,
  materialControls: project.materialControls,
  members: project.members,
  chatMessages: project.chatMessages,
});

// All project routes require authentication
router.use(auth);

// GET ALL
router.get("/", async (req, res) => {
  try {
    const data = await Project.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET BY ID
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE
router.post("/", async (req, res) => {
  try {
    const newProject = new Project(req.body);
    await newProject.save();
    res.json(newProject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const existing = await Project.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: "Project not found" });
    }

    const historyEntry = {
      savedAt: new Date(),
      snapshot: buildHistorySnapshot(existing),
    };

    const nextHistory = [...(existing.updateHistory ?? []), historyEntry];
    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updateHistory: nextHistory,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
