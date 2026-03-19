import mongoose from "mongoose";

const sectionItemSchema = new mongoose.Schema(
  {
    objective: { type: String, default: "" },
    usedForms: { type: String, default: "" },
    personInCharge: { type: String, default: "" },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
    accomplishment: { type: String, default: "" },
    correctiveMeasure: { type: String, default: "" },
    remarks: { type: String, default: "" },
  },
  { _id: false },
);

const memberSchema = new mongoose.Schema(
  {
    employeeId: { type: String, default: "" },
    assignment: { type: String, default: "" },
  },
  { _id: false },
);

const chatMessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    author: { type: String, default: "" },
    text: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const projectHistorySchema = new mongoose.Schema(
  {
    savedAt: { type: Date, default: Date.now },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  desc: { type: String, default: "" },
  formNo: { type: String, default: "QA23" },
  revision: { type: String, default: "4" },
  date: { type: String, default: "" },
  code: { type: String, default: "" },
  siteName: { type: String, default: "" },
  progressChecks: {
    type: [sectionItemSchema],
    default: [],
  },
  processControls: {
    type: [sectionItemSchema],
    default: [],
  },
  materialControls: {
    type: [sectionItemSchema],
    default: [],
  },
  members: {
    type: [memberSchema],
    default: [],
  },
  chatMessages: {
    type: [chatMessageSchema],
    default: [],
  },
  updateHistory: {
    type: [projectHistorySchema],
    default: [],
  },
});

export default mongoose.model("Project", projectSchema);
