import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import whatsappRouter from "./whatsapp.js";
import spreadsheetRouter from "./spreadsheet.js";
import queryRouter from "./query.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/whatsapp", whatsappRouter);
router.use("/spreadsheet", spreadsheetRouter);
router.use("/query", queryRouter);

export default router;
