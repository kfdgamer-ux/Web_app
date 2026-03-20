import express from "express";
import Employee from "../models/Employee.js";
import Project from "../models/Project.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const EMPLOYEE_EDITABLE_FIELDS = [
  "progressChecks",
  "processControls",
  "materialControls",
  "chatMessages",
];

const FALLBACK_SECTION_LABELS = {
  progressChecks: "Tiến độ thi công",
  processControls: "Kiểm soát quá trình",
  materialControls: "Kiểm tra vật tư",
};

const isAdmin = (req) => req.user?.role === "admin";

const buildProjectQuery = (req) => {
  if (isAdmin(req)) {
    return {};
  }

  if (!req.user?.employeeId) {
    return { _id: null };
  }

  return { "members.employeeId": req.user.employeeId };
};

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

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const data = await Project.find(buildProjectQuery(req));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      ...buildProjectQuery(req),
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const newProject = new Project(req.body);
    await newProject.save();
    res.json(newProject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const existing = await Project.findOne({
      _id: req.params.id,
      ...buildProjectQuery(req),
    });

    if (!existing) {
      return res.status(404).json({ error: "Project not found" });
    }

    const historyEntry = {
      savedAt: new Date(),
      snapshot: buildHistorySnapshot(existing),
    };

    const nextHistory = [...(existing.updateHistory ?? []), historyEntry];
    const nextActivityLogs = [...(existing.activityLogs ?? [])];

    if (!isAdmin(req)) {
      const employee = req.user?.employeeId
        ? await Employee.findById(req.user.employeeId).lean()
        : null;
      const actorName = employee?.name || req.user?.username || "Nhân viên";
      const changedSections = Object.keys(FALLBACK_SECTION_LABELS).filter(
        (field) =>
          field in req.body &&
          JSON.stringify(existing[field] ?? null) !== JSON.stringify(req.body[field] ?? null),
      );

      changedSections.forEach((field) => {
        const sectionLabel =
          req.body[field]?.title ||
          existing[field]?.title ||
          FALLBACK_SECTION_LABELS[field];

        nextActivityLogs.push({
          id: `${Date.now()}-${field}-${Math.random().toString(36).slice(2, 8)}`,
          actorName,
          sectionKey: field,
          sectionLabel,
          text: `${actorName} đã chỉnh sửa ${sectionLabel}`,
          createdAt: new Date(),
        });
      });
    }

    const updatePayload = isAdmin(req)
      ? {
          ...req.body,
          updateHistory: nextHistory,
          activityLogs: nextActivityLogs,
        }
      : {
          ...EMPLOYEE_EDITABLE_FIELDS.reduce((acc, field) => {
            if (field in req.body) {
              acc[field] = req.body[field];
            }
            return acc;
          }, {}),
          updateHistory: nextHistory,
          activityLogs: nextActivityLogs,
        };

    if (!isAdmin(req) && Object.keys(updatePayload).length === 2) {
      return res.status(403).json({ error: "You can only update project progress sections" });
    }

    const updated = await Project.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
