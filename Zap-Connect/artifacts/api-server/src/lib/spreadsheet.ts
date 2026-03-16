import { createRequire } from "module";
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require("xlsx") as typeof import("xlsx");
import fs from "fs";

const FILTERED_STATUSES = ["COMERCIAL", "EXPEDIÇÃO", "FINALIZADA", "QUALIDADE", "LOGISTICA", "#N/D"];

export interface SpreadsheetRow {
  materialCode: string;
  description: string;
  opCode: string;
  empenhQty: number;
  planDate: Date | null;
  planDateStr: string;
  status: string;
  currentStock: number;
  purchaseOrderQty: string;
  expectedArrival: string;
}

interface SpreadsheetState {
  rows: SpreadsheetRow[];
  fileName: string | null;
  rowCount: number;
  lastUpdated: string | null;
  loaded: boolean;
}

const state: SpreadsheetState = {
  rows: [],
  fileName: null,
  rowCount: 0,
  lastUpdated: null,
  loaded: false,
};

export function getState(): SpreadsheetState {
  return { ...state };
}

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "number") {
    return XLSX.SSF.parse_date_code(val) ? new Date((val - 25569) * 86400 * 1000) : null;
  }
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function excelSerialToDateString(val: unknown): string {
  if (!val) return "—";
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return "—";
    const asNum = parseFloat(trimmed);
    if (!isNaN(asNum) && asNum > 40000) {
      const d = new Date((asNum - 25569) * 86400 * 1000);
      if (!isNaN(d.getTime())) {
        const day = String(d.getUTCDate()).padStart(2, "0");
        const month = String(d.getUTCMonth() + 1).padStart(2, "0");
        const year = d.getUTCFullYear();
        return `${day}/${month}/${year}`;
      }
    }
    return trimmed;
  }
  if (typeof val === "number") {
    if (val > 40000) {
      const d = new Date((val - 25569) * 86400 * 1000);
      if (!isNaN(d.getTime())) {
        const day = String(d.getUTCDate()).padStart(2, "0");
        const month = String(d.getUTCMonth() + 1).padStart(2, "0");
        const year = d.getUTCFullYear();
        return `${day}/${month}/${year}`;
      }
    }
    return String(val);
  }
  return "—";
}

export function loadSpreadsheet(filePath: string, originalName: string): { rowCount: number; fileName: string } {
  const workbook = XLSX.readFile(filePath, { cellText: true, cellDates: false });
  const sheet = workbook.Sheets["SD4"];
  if (!sheet) {
    throw new Error("Aba 'SD4' não encontrada na planilha.");
  }

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1, raw: true, defval: "" }) as unknown[][];

  const rows: SpreadsheetRow[] = [];

  for (let i = 1; i < raw.length; i++) {
    const row = raw[i] as unknown[];
    if (!row || row.length < 2) continue;

    // Column B (index 1): read as formatted text to preserve leading zeros
    const cellRef = XLSX.utils.encode_cell({ r: i, c: 1 });
    const cell = sheet[cellRef];
    let materialCode = "";
    if (cell) {
      if (cell.t === "n") {
        materialCode = cell.w ?? String(cell.v);
      } else {
        materialCode = XLSX.utils.format_cell(cell);
      }
    }
    materialCode = materialCode.trim();

    const description = String(row[3] ?? "").trim();
    const opCode = String(row[5] ?? "").trim();
    const empenhQtyRaw = row[6];
    const planDateRaw = row[7];
    const status = String(row[10] ?? "").trim().toUpperCase();
    const currentStockRaw = row[13];
    const purchaseOrderQtyRaw = row[14];
    const expectedArrivalRaw = row[15];

    if (!materialCode || !opCode) continue;

    const upperStatus = status.toUpperCase();
    const filtered = FILTERED_STATUSES.some((f) => upperStatus.includes(f));
    if (filtered) continue;

    const empenhQty = parseFloat(String(empenhQtyRaw ?? "0")) || 0;
    const currentStock = parseFloat(String(currentStockRaw ?? "0")) || 0;
    const planDate = parseDate(planDateRaw);
    const planDateStr = excelSerialToDateString(planDateRaw);
    const purchaseOrderQty = purchaseOrderQtyRaw != null && String(purchaseOrderQtyRaw).trim() !== "" ? String(purchaseOrderQtyRaw).trim() : "—";
    const expectedArrival = excelSerialToDateString(expectedArrivalRaw);

    rows.push({
      materialCode,
      description,
      opCode,
      empenhQty,
      planDate,
      planDateStr,
      status,
      currentStock,
      purchaseOrderQty,
      expectedArrival,
    });
  }

  state.rows = rows;
  state.fileName = originalName;
  state.rowCount = rows.length;
  state.lastUpdated = new Date().toISOString();
  state.loaded = true;

  return { rowCount: rows.length, fileName: originalName };
}

export interface SpreadsheetStats {
  totalRows: number;
  totalMaterials: number;
  totalOps: number;
  loaded: boolean;
  fileName: string | null;
  lastUpdated: string | null;
  previewRows: PreviewRow[];
}

export interface PreviewRow {
  materialCode: string;
  description: string;
  opCode: string;
  empenhQty: number;
  planDateStr: string;
  status: string;
  currentStock: number;
  purchaseOrderQty: string;
  expectedArrival: string;
}

export function getSpreadsheetStats(): SpreadsheetStats {
  const totalMaterials = new Set(state.rows.map((r) => r.materialCode)).size;
  const totalOps = new Set(state.rows.map((r) => r.opCode)).size;
  const previewRows: PreviewRow[] = state.rows.slice(0, 20).map((r) => ({
    materialCode: r.materialCode,
    description: r.description,
    opCode: r.opCode,
    empenhQty: r.empenhQty,
    planDateStr: r.planDateStr,
    status: r.status,
    currentStock: r.currentStock,
    purchaseOrderQty: r.purchaseOrderQty,
    expectedArrival: r.expectedArrival,
  }));
  return {
    totalRows: state.rowCount,
    totalMaterials,
    totalOps,
    loaded: state.loaded,
    fileName: state.fileName,
    lastUpdated: state.lastUpdated,
    previewRows,
  };
}

export interface OpUsage {
  opCode: string;
  empenhQty: number;
  planDateStr: string;
}

export interface MaterialInfo {
  materialCode: string;
  description: string;
  currentStock: number;
  purchaseOrderQty: string;
  expectedArrival: string;
  opsUsing: OpUsage[];
}

export function queryMaterial(materialCode: string): MaterialInfo | null {
  const normalized = materialCode.trim();
  const matches = state.rows.filter(
    (r) => r.materialCode.toLowerCase() === normalized.toLowerCase()
  );
  if (matches.length === 0) return null;

  const first = matches[0];

  // Collect all OPs using this material, sorted by plan date, max 10
  const opsSorted = matches
    .sort((a, b) => {
      if (!a.planDate && !b.planDate) return 0;
      if (!a.planDate) return 1;
      if (!b.planDate) return -1;
      return a.planDate.getTime() - b.planDate.getTime();
    })
    .slice(0, 10)
    .map((r) => ({
      opCode: r.opCode,
      empenhQty: r.empenhQty,
      planDateStr: r.planDateStr,
    }));

  return {
    materialCode: first.materialCode,
    description: first.description,
    currentStock: first.currentStock,
    purchaseOrderQty: first.purchaseOrderQty,
    expectedArrival: first.expectedArrival,
    opsUsing: opsSorted,
  };
}

export interface MissingMaterial {
  materialCode: string;
  description: string;
  qtdFalta: number;
  purchaseOrderQty: string;
  expectedArrival: string;
}

export function queryOp(opCode: string): { found: boolean; missingMaterials: MissingMaterial[] } {
  const normalized = opCode.trim().toUpperCase();
  const opRows = state.rows.filter((r) => r.opCode.toUpperCase() === normalized);
  if (opRows.length === 0) return { found: false, missingMaterials: [] };

  const missingMaterials: MissingMaterial[] = [];
  const materialCodes = [...new Set(opRows.map((r) => r.materialCode))];

  for (const matCode of materialCodes) {
    const allOpsForMaterial = state.rows
      .filter((r) => r.materialCode.toLowerCase() === matCode.toLowerCase())
      .sort((a, b) => {
        if (!a.planDate && !b.planDate) return 0;
        if (!a.planDate) return 1;
        if (!b.planDate) return -1;
        return a.planDate.getTime() - b.planDate.getTime();
      });

    const materialFirst = allOpsForMaterial[0];
    const currentStock = materialFirst?.currentStock ?? 0;

    let remaining = currentStock;
    let qtdFalta = 0;
    let isMissing = false;

    for (const row of allOpsForMaterial) {
      const available = Math.max(0, remaining);
      const consumed = Math.min(available, row.empenhQty);
      remaining -= consumed;

      if (row.opCode.toUpperCase() === normalized) {
        const shortfall = row.empenhQty - consumed;
        if (shortfall > 0) {
          isMissing = true;
          qtdFalta = shortfall;
        }
        break;
      }
    }

    if (isMissing) {
      missingMaterials.push({
        materialCode: materialFirst.materialCode,
        description: materialFirst.description,
        qtdFalta,
        purchaseOrderQty: materialFirst.purchaseOrderQty,
        expectedArrival: materialFirst.expectedArrival,
      });
    }
  }

  return { found: true, missingMaterials };
}

export function detectQueryType(text: string): "op" | "material" | "unknown" {
  const clean = text.trim().replace(/^OP[\s-]?/i, "").trim();

  // Check if it's an OP pattern (digits only or OP + digits)
  const isOpPattern = /^\d{4,}$/.test(clean) || /^OP[\s-]?\d+$/i.test(text.trim());

  // Check if it matches an OP in the planilha
  const matchesOp = state.rows.some((r) => r.opCode.toUpperCase() === clean.toUpperCase());

  // Check if it matches a material code
  const matchesMaterial = state.rows.some((r) => r.materialCode.toLowerCase() === clean.toLowerCase());

  if (matchesOp) return "op";
  if (matchesMaterial) return "material";
  if (isOpPattern) return "op";
  return "unknown";
}
