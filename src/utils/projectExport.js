import * as XLSX from "xlsx";
import { normalizeProject, SECTION_CONFIG } from "./projectTemplate";

const SECTION_HEADERS = [
  "STT",
  "Hang Muc",
  "Bieu Mau Su Dung",
  "Nguoi Thuc Hien",
  "Thoi Gian Bat Dau",
  "Thoi Gian Hoan Thanh",
  "Ket Qua Thuc Hien",
  "Bien Phap Khac Phuc",
  "Ghi Chu",
];

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
      wch: Math.min(
        45,
        Math.max(minWidths[colIndex] ?? DEFAULT_WIDTHS.medium, contentWidth),
      ),
    };
  });

  sheet["!rows"] = rows.map((row) => {
    const lineCount = row.reduce((maxLines, cell, colIndex) => {
      const width = sheet["!cols"]?.[colIndex]?.wch ?? DEFAULT_WIDTHS.medium;
      return Math.max(maxLines, countWrappedLines(cell, width));
    }, 1);

    return {
      hpt: Math.max(20, lineCount * 16),
    };
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
  ["Xuat Chi Tiet Du An"],
  [],
  ["Ten Du An", project.name],
  ["Cong Trinh", project.siteName],
  ["Ma So", project.code],
  ["Ngay", project.date],
  ["Bieu Mau", project.formNo],
  ["Hieu Chinh", project.revision],
  ["Mo Ta", project.desc],
];

const buildSectionRows = (project, section) => [
  [section.title],
  [section.subtitle],
  [],
  ["Ten Du An", project.name],
  ["Cong Trinh", project.siteName],
  ["Ma So", project.code],
  ["Ngay", project.date],
  ["Bieu Mau", project.formNo],
  ["Hieu Chinh", project.revision],
  [],
  SECTION_HEADERS,
  ...(project[section.key] ?? []).map((row, index) => [
    index + 1,
    row.objective,
    row.usedForms,
    row.personInCharge,
    row.startTime,
    row.endTime,
    row.accomplishment,
    row.correctiveMeasure,
    row.remarks,
  ]),
];

const buildMembersRows = (project, members) => [
  ["Phan Cong Nhan Su"],
  [],
  ["Ten Du An", project.name],
  [],
  ["STT", "Ten", "Vai Tro", "Email", "So Dien Thoai", "Phan Cong"],
  ...members.map((member, index) => [
    index + 1,
    member.name ?? "",
    member.role ?? "",
    member.email ?? "",
    member.phone ?? "",
    member.assignment ?? "",
  ]),
];

export const exportProjectToExcel = (projectInput, memberEmployees = []) => {
  const project = normalizeProject(projectInput);
  const workbook = XLSX.utils.book_new();

  const overviewRows = buildOverviewRows(project);
  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewRows);
  applySheetFormatting(overviewSheet, overviewRows, [20, DEFAULT_WIDTHS.xwide]);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, "TongQuan");

  for (const section of SECTION_CONFIG) {
    const sectionRows = buildSectionRows(project, section);
    const sectionSheet = XLSX.utils.aoa_to_sheet(sectionRows);
    applySheetFormatting(sectionSheet, sectionRows, [
      DEFAULT_WIDTHS.narrow,
      DEFAULT_WIDTHS.wide,
      DEFAULT_WIDTHS.medium,
      DEFAULT_WIDTHS.medium,
      DEFAULT_WIDTHS.medium,
      DEFAULT_WIDTHS.medium,
      DEFAULT_WIDTHS.wide,
      DEFAULT_WIDTHS.wide,
      DEFAULT_WIDTHS.medium,
    ]);
    XLSX.utils.book_append_sheet(workbook, sectionSheet, section.key);
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
