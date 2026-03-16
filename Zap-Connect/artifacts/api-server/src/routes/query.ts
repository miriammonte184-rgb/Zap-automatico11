import { Router, type IRouter } from "express";
import { db, queryHistoryTable } from "@workspace/db";
import { desc, count, gte, eq, sql } from "drizzle-orm";
import { queryMaterial, queryOp, getSpreadsheetStats } from "../lib/spreadsheet.js";

const router: IRouter = Router();

router.get("/op/:opCode", async (req, res) => {
  const { opCode } = req.params;
  const result = queryOp(opCode);
  res.json({
    opCode,
    found: result.found,
    hasMissingMaterials: result.found && result.missingMaterials.length > 0,
    missingMaterials: result.missingMaterials,
    message: !result.found
      ? `OP ${opCode} não encontrada na planilha.`
      : result.missingMaterials.length === 0
        ? `Todos os materiais da OP ${opCode} estão disponíveis.`
        : `${result.missingMaterials.length} material(is) em falta na OP ${opCode}.`,
  });
});

router.get("/material/:materialCode", async (req, res) => {
  const { materialCode } = req.params;
  const result = queryMaterial(materialCode);
  if (!result) {
    res.json({
      materialCode,
      found: false,
      description: undefined,
      currentStock: undefined,
      purchaseOrderQty: undefined,
      expectedArrival: undefined,
      opsUsing: [],
    });
    return;
  }
  res.json({ ...result, found: true });
});

router.get("/history", async (req, res) => {
  const limit = parseInt(String(req.query.limit ?? "20")) || 20;
  const items = await db
    .select()
    .from(queryHistoryTable)
    .orderBy(desc(queryHistoryTable.createdAt))
    .limit(limit);

  const totalResult = await db.select({ count: count() }).from(queryHistoryTable);
  const total = totalResult[0]?.count ?? 0;

  res.json({ items, total });
});

router.get("/stats", async (_req, res) => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sheetStats = getSpreadsheetStats();

  const [totalResult, last24hResult, opResult, materialResult, uniqueUsersResult] = await Promise.all([
    db.select({ count: count() }).from(queryHistoryTable),
    db.select({ count: count() }).from(queryHistoryTable).where(gte(queryHistoryTable.createdAt, yesterday)),
    db.select({ count: count() }).from(queryHistoryTable).where(eq(queryHistoryTable.queryType, "op")),
    db.select({ count: count() }).from(queryHistoryTable).where(eq(queryHistoryTable.queryType, "material")),
    db.select({ count: count() }).from(queryHistoryTable).where(sql`${queryHistoryTable.phoneNumber} IS NOT NULL`),
  ]);

  res.json({
    totalQueries: totalResult[0]?.count ?? 0,
    queriesLast24h: last24hResult[0]?.count ?? 0,
    opQueries: opResult[0]?.count ?? 0,
    materialQueries: materialResult[0]?.count ?? 0,
    uniqueUsers: uniqueUsersResult[0]?.count ?? 0,
    totalMaterials: sheetStats.totalMaterials,
    totalOps: sheetStats.totalOps,
    sheetLoaded: sheetStats.loaded,
  });
});

export default router;
