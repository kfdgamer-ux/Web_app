import * as XLSX from "xlsx";
import { normalizeProject, SECTION_CONFIG } from "./projectTemplate";

const DEFAULT_WIDTHS = {
  narrow: 8,
  medium: 18,
  wide: 28,
  xwide: 40,
};

const sanitizeFileName = (value) =>
  (value || "chi-tiet-du-an")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

const sanitizeSheetName = (value, fallback = "Sheet") =>
  (value || fallback).replace(/[:\\/?*\[\]]/g, "").slice(0, 31) || fallback;

const toDisplayValue = (value) => (value == null ? "" : String(value));

const countWrappedLines = (value, width) => {
  const text = toDisplayValue(value);
  if (!text) return 1;

  return text.split("\n").reduce((total, line) => {
    const lineLength = Math.max(1, line.length);
    return total + Math.max(1, Math.ceil(lineLength / Math.max(1, width)));
  }, 0);
};

const applySheetFormatting = (sheet, rows, minWidths = []) => {
  const columnCount = Math.max(0, ...rows.map((row) => row.length));

  sheet["!cols"] = Array.from({ length: columnCount }, (_, colIndex) => {
    const contentWidth = rows.reduce((maxWidth, row) => {
      const value = toDisplayValue(row[colIndex]);
      const longestLine = value
        .split("\n")
        .reduce((maxLine, line) => Math.max(maxLine, line.length), 0);

      return Math.max(maxWidth, longestLine + 2);
    }, 0);

    return {
      wch: Math.min(45, Math.max(minWidths[colIndex] ?? DEFAULT_WIDTHS.medium, contentWidth)),
    };
  });

  sheet["!rows"] = rows.map((row) => {
    const lineCount = row.reduce((maxLines, cell, colIndex) => {
      const width = sheet["!cols"]?.[colIndex]?.wch ?? DEFAULT_WIDTHS.medium;
      return Math.max(maxLines, countWrappedLines(cell, width));
    }, 1);

    return { hpt: Math.max(20, lineCount * 16) };
  });

  for (const cellAddress of Object.keys(sheet)) {
    if (cellAddress.startsWith("!")) continue;

    sheet[cellAddress].s = {
      alignment: {
        vertical: "top",
        wrapText: true,
      },
    };
  }
};

const buildOverviewRows = (project) => [
  ["Xuất Chi Tiết Dự Án"],
  [],
  ["Tên Dự Án", project.name],
  ["Công Trình", project.siteName],
  ["Mã Số", project.code],
  ["Ngày", project.date],
  ["Biểu Mẫu", project.formNo],
  ["Hiệu Chỉnh", project.revision],
  ["Mô Tả", project.desc],
];

const buildSectionRows = (project, sectionKey) => {
  const fallback = SECTION_CONFIG.find((item) => item.key === sectionKey) ?? {};
  const section = project[sectionKey] ?? fallback;
  const headerRow = ["STT", ...(section.columns ?? []).map((column) => column.name || "Cột")];

  return [
    [section.title || fallback.title || "Bảng dữ liệu"],
    [section.subtitle || fallback.subtitle || ""],
    [],
    ["Tên Dự Án", project.name],
    ["Công Trình", project.siteName],
    ["Mã Số", project.code],
    ["Ngày", project.date],
    ["Biểu Mẫu", project.formNo],
    ["Hiệu Chỉnh", project.revision],
    [],
    headerRow,
    ...(section.rows ?? []).map((row, index) => [
      index + 1,
      ...(section.columns ?? []).map((column) => row.values?.[column.id] ?? ""),
    ]),
  ];
};

const buildMembersRows = (project, members) => [
  ["Phân Công Nhân Sự"],
  [],
  ["Tên Dự Án", project.name],
  [],
  ["STT", "Tên", "Vai Trò", "Email", "Số Điện Thoại", "Phân Công"],
  ...members.map((member, index) => [
    index + 1,
    member.name ?? "",
    member.role ?? "",
    member.email ?? "",
    member.phone ?? "",
    member.assignment ?? "",
  ]),
];

const buildMultiProjectSummaryRows = (projects) => [
  ["Báo Cáo Tổng Hợp Dự Án"],
  [],
  [
    "STT",
    "Tên Dự Án",
    "Trạng Thái",
    "Công Trình",
    "Mã Số",
    "Ngày",
    "Số Thành Viên",
    "Số Dòng Tiến Độ",
    "Số Dòng Kiểm Soát",
    "Số Dòng Vật Tư",
  ],
  ...projects.map((project, index) => [
    index + 1,
    project.name,
    project.status === "active" ? "Đang triển khai" : "Hoàn thành",
    project.siteName,
    project.code,
    project.date,
    project.members?.length ?? 0,
    project.progressChecks?.rows?.length ?? 0,
    project.processControls?.rows?.length ?? 0,
    project.materialControls?.rows?.length ?? 0,
  ]),
];

const buildMultiProjectDetailRows = (project) => [
  ["Thông Tin Dự Án"],
  [],
  ["Tên Dự Án", project.name],
  ["Trạng Thái", project.status === "active" ? "Đang triển khai" : "Hoàn thành"],
  ["Công Trình", project.siteName],
  ["Mã Số", project.code],
  ["Ngày", project.date],
  ["Biểu Mẫu", project.formNo],
  ["Hiệu Chỉnh", project.revision],
  ["Mô Tả", project.desc],
  ["Số Thành Viên", project.members?.length ?? 0],
  ["Số Dòng Tiến Độ Thi Công", project.progressChecks?.rows?.length ?? 0],
  ["Số Dòng Kiểm Soát Quá Trình", project.processControls?.rows?.length ?? 0],
  ["Số Dòng Kiểm Tra Vật Tư", project.materialControls?.rows?.length ?? 0],
];

export const exportProjectToExcel = (projectInput, memberEmployees = []) => {
  const project = normalizeProject(projectInput);
  const workbook = XLSX.utils.book_new();

  const overviewRows = buildOverviewRows(project);
  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewRows);
  applySheetFormatting(overviewSheet, overviewRows, [20, DEFAULT_WIDTHS.xwide]);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, "TongQuan");

  for (const section of SECTION_CONFIG) {
    const sectionRows = buildSectionRows(project, section.key);
    const sectionSheet = XLSX.utils.aoa_to_sheet(sectionRows);
    applySheetFormatting(
      sectionSheet,
      sectionRows,
      [DEFAULT_WIDTHS.narrow, ...Array.from({ length: 24 }, () => DEFAULT_WIDTHS.wide)],
    );
    XLSX.utils.book_append_sheet(
      workbook,
      sectionSheet,
      sanitizeSheetName(section.title, section.key),
    );
  }

  const memberRows = buildMembersRows(project, memberEmployees);
  const membersSheet = XLSX.utils.aoa_to_sheet(memberRows);
  applySheetFormatting(membersSheet, memberRows, [
    DEFAULT_WIDTHS.narrow,
    22,
    18,
    28,
    18,
    DEFAULT_WIDTHS.wide,
  ]);
  XLSX.utils.book_append_sheet(workbook, membersSheet, "NhanSu");

  XLSX.writeFileXLSX(workbook, `${sanitizeFileName(project.name)}.xlsx`);
};

export const exportProjectsReportToExcel = (projectsInput = []) => {
  const projects = projectsInput.map(normalizeProject);
  if (!projects.length) return;

  const workbook = XLSX.utils.book_new();

  const summaryRows = buildMultiProjectSummaryRows(projects);
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  applySheetFormatting(summarySheet, summaryRows, [
    DEFAULT_WIDTHS.narrow,
    DEFAULT_WIDTHS.wide,
    18,
    DEFAULT_WIDTHS.wide,
    16,
    16,
    16,
    16,
    16,
    16,
  ]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "TongHop");

  projects.forEach((project, index) => {
    const detailRows = buildMultiProjectDetailRows(project);
    const detailSheet = XLSX.utils.aoa_to_sheet(detailRows);
    applySheetFormatting(detailSheet, detailRows, [24, DEFAULT_WIDTHS.xwide]);
    XLSX.utils.book_append_sheet(
      workbook,
      detailSheet,
      sanitizeSheetName(`${index + 1}-${project.name}`, `DuAn${index + 1}`),
    );
  });

  const dateSuffix = new Date().toISOString().slice(0, 10);
  XLSX.writeFileXLSX(workbook, `bao-cao-du-an-${dateSuffix}.xlsx`);
};
