export const SECTION_CONFIG = [
  {
    key: "progressChecks",
    title: "Tiến Độ Thi Công",
    subtitle: "Kế Hoạch Và Báo Cáo Công Tác Tiến Độ Thi Công",
  },
  {
    key: "processControls",
    title: "Kiểm Soát Quá Trình",
    subtitle: "Kế Hoạch Và Báo Cáo Công Tác Kiểm Soát Các Quá Trình",
  },
  {
    key: "materialControls",
    title: "Kiểm Tra Vật Tư",
    subtitle: "Kế Hoạch Và Báo Cáo Công Tác Kiểm Soát Vật Tư",
  },
];

export const createSectionRow = () => ({
  objective: "",
  usedForms: "",
  personInCharge: "",
  startTime: "",
  endTime: "",
  accomplishment: "",
  correctiveMeasure: "",
  remarks: "",
});

export const createProjectTemplate = () => ({
  name: "",
  status: "active",
  desc: "",
  formNo: "QA23",
  revision: "4",
  date: "",
  code: "",
  siteName: "",
  progressChecks: [createSectionRow()],
  processControls: [createSectionRow()],
  materialControls: [createSectionRow()],
  members: [],
  chatMessages: [],
  updateHistory: [],
});

export const normalizeProject = (project = {}) => ({
  ...createProjectTemplate(),
  ...project,
  members: project.members ?? [],
  chatMessages: project.chatMessages ?? [],
  updateHistory: project.updateHistory ?? [],
  progressChecks: project.progressChecks?.length
    ? project.progressChecks
    : [createSectionRow()],
  processControls: project.processControls?.length
    ? project.processControls
    : [createSectionRow()],
  materialControls: project.materialControls?.length
    ? project.materialControls
    : [createSectionRow()],
});
