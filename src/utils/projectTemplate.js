const LEGACY_SECTION_FIELD_CONFIG = [
  { label: "Hạng mục", dataIndex: "objective" },
  { label: "Biểu mẫu sử dụng", dataIndex: "usedForms" },
  { label: "Người thực hiện", dataIndex: "personInCharge" },
  { label: "Thời gian bắt đầu", dataIndex: "startTime" },
  { label: "Thời gian hoàn thành", dataIndex: "endTime" },
  { label: "Kết quả thực hiện", dataIndex: "accomplishment" },
  { label: "Biện pháp khắc phục", dataIndex: "correctiveMeasure" },
  { label: "Ghi chú", dataIndex: "remarks" },
];

export const SECTION_CONFIG = [
  {
    key: "progressChecks",
    title: "Tiến độ thi công",
    subtitle: "Kế hoạch và báo cáo công tác tiến độ thi công",
  },
  {
    key: "processControls",
    title: "Kiểm soát quá trình",
    subtitle: "Kế hoạch và báo cáo công tác kiểm soát các quá trình",
  },
  {
    key: "materialControls",
    title: "Kiểm tra vật tư",
    subtitle: "Kế hoạch và báo cáo công tác kiểm soát vật tư",
  },
];

export const createSectionColumn = (name = "") => ({
  id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name,
});

export const createSectionRow = (columns = []) => ({
  id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  values: columns.reduce((acc, column) => {
    acc[column.id] = "";
    return acc;
  }, {}),
});

export const createSectionTemplate = ({
  title = "",
  subtitle = "",
  columns,
} = {}) => {
  const normalizedColumns =
    columns?.length
      ? columns.map((column, index) => ({
          id: column.id || `col-${Date.now()}-${index}`,
          name: column.name || `Trường ${index + 1}`,
        }))
      : LEGACY_SECTION_FIELD_CONFIG.map((field, index) => ({
          id: field.dataIndex || `col-${Date.now()}-${index}`,
          name: field.label,
        }));

  return {
    title,
    subtitle,
    columns: normalizedColumns,
    rows: [],
  };
};

const normalizeSectionRowValues = (row, columns) => {
  if (!row) {
    return createSectionRow(columns);
  }

  if (row.values && typeof row.values === "object") {
    return {
      id: row.id || `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      values: columns.reduce((acc, column) => {
        acc[column.id] = row.values[column.id] ?? "";
        return acc;
      }, {}),
    };
  }

  return {
    id: row.id || `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    values: columns.reduce((acc, column) => {
      acc[column.id] = row[column.id] ?? row[column.legacyKey] ?? "";
      return acc;
    }, {}),
  };
};

const normalizeSection = (value, fallbackConfig) => {
  if (Array.isArray(value)) {
    const legacyColumns = LEGACY_SECTION_FIELD_CONFIG.map((field) => ({
      id: field.dataIndex,
      name: field.label,
      legacyKey: field.dataIndex,
    }));

    return {
      title: fallbackConfig.title,
      subtitle: fallbackConfig.subtitle,
      columns: legacyColumns.map(({ legacyKey, ...column }) => column),
      rows: value.map((row) =>
        normalizeSectionRowValues(row, legacyColumns),
      ),
    };
  }

  const baseSection = createSectionTemplate(fallbackConfig);
  const columns =
    value?.columns?.length
      ? value.columns.map((column, index) => ({
          id: column.id || `col-${Date.now()}-${index}`,
          name: column.name || `Trường ${index + 1}`,
        }))
      : baseSection.columns;

  return {
    title: value?.title || fallbackConfig.title,
    subtitle: value?.subtitle || fallbackConfig.subtitle,
    columns,
    rows: (value?.rows ?? []).map((row) => normalizeSectionRowValues(row, columns)),
  };
};

export const createProjectTemplate = () => ({
  name: "",
  status: "active",
  desc: "",
  formNo: "QA23",
  revision: "4",
  date: "",
  code: "",
  siteName: "",
  progressChecks: createSectionTemplate(SECTION_CONFIG[0]),
  processControls: createSectionTemplate(SECTION_CONFIG[1]),
  materialControls: createSectionTemplate(SECTION_CONFIG[2]),
  members: [],
  chatMessages: [],
  updateHistory: [],
  activityLogs: [],
});

export const normalizeProject = (project = {}) => ({
  ...createProjectTemplate(),
  ...project,
  members: project.members ?? [],
  chatMessages: project.chatMessages ?? [],
  updateHistory: project.updateHistory ?? [],
  activityLogs: project.activityLogs ?? [],
  progressChecks: normalizeSection(project.progressChecks, SECTION_CONFIG[0]),
  processControls: normalizeSection(project.processControls, SECTION_CONFIG[1]),
  materialControls: normalizeSection(project.materialControls, SECTION_CONFIG[2]),
});
