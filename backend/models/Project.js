import mongoose from "mongoose";

const sectionColumnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: "" },
  },
  { _id: false },
);

const sectionRowSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    values: { type: Map, of: String, default: {} },
  },
  { _id: false },
);

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    columns: { type: [sectionColumnSchema], default: [] },
    rows: { type: [sectionRowSchema], default: [] },
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

const activityLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    actorName: { type: String, default: "" },
    sectionKey: { type: String, default: "" },
    sectionLabel: { type: String, default: "" },
    text: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
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
    type: mongoose.Schema.Types.Mixed,
    default: () => ({}),
  },
  processControls: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({}),
  },
  materialControls: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({}),
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
  activityLogs: {
    type: [activityLogSchema],
    default: [],
  },
});

export default mongoose.model("Project", projectSchema);
