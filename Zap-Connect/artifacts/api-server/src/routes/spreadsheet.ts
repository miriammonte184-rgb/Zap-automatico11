import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { loadSpreadsheet, getState, getSpreadsheetStats } from "../lib/spreadsheet.js";

const upload = multer({
  dest: "/tmp/uploads/",
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".xlsx", ".xls", ".xlsm"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed (.xlsx, .xls, .xlsm)"));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router: IRouter = Router();

router.get("/status", (_req, res) => {
  const state = getState();
  res.json({
    loaded: state.loaded,
    fileName: state.fileName,
    rowCount: state.rowCount,
    lastUpdated: state.lastUpdated,
  });
});

router.get("/stats", (_req, res) => {
  const stats = getSpreadsheetStats();
  res.json(stats);
});

router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: "No file uploaded" });
    return;
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;

  setImmediate(() => {
    try {
      const result = loadSpreadsheet(filePath, originalName);
      try { fs.unlinkSync(filePath); } catch { /* ignore */ }
      console.log(`Spreadsheet loaded: ${result.rowCount} rows from ${originalName}`);
    } catch (err: unknown) {
      try { fs.unlinkSync(filePath); } catch { /* ignore */ }
      console.error("Failed to load spreadsheet:", err);
    }
  });

  res.json({
    success: true,
    message: `Arquivo recebido! Processando planilha "${originalName}"...`,
    rowCount: 0,
    fileName: originalName,
  });
});

export default router;
