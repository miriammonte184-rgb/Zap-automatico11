import { Router, type IRouter } from "express";
import { getWhatsappStatus, getQrCode, disconnectWhatsapp, initializeWhatsapp, getWhitelist, addToWhitelist, removeFromWhitelist } from "../lib/whatsapp.js";
import QRCode from "qrcode";

const router: IRouter = Router();

router.get("/status", (_req, res) => {
  const status = getWhatsappStatus();
  res.json(status);
});

router.get("/qrcode", async (_req, res) => {
  const data = getQrCode();
  if (data.qrCode) {
    try {
      const qrDataUrl = await QRCode.toDataURL(data.qrCode);
      res.json({ qrCode: qrDataUrl, status: data.status });
    } catch {
      res.json({ qrCode: null, status: data.status });
    }
  } else {
    res.json({ qrCode: null, status: data.status });
  }
});

router.post("/connect", (_req, res) => {
  initializeWhatsapp();
  res.json({ success: true, message: "WhatsApp initialization started" });
});

router.post("/disconnect", async (_req, res) => {
  await disconnectWhatsapp();
  res.json({ success: true, message: "WhatsApp disconnected successfully" });
});

router.get("/whitelist", (_req, res) => {
  const list = getWhitelist();
  res.json({ numbers: list, total: list.length });
});

router.post("/whitelist", (req, res) => {
  const { phone } = req.body as { phone?: string };
  if (!phone) {
    res.status(400).json({ success: false, message: "Campo 'phone' é obrigatório." });
    return;
  }
  const result = addToWhitelist(phone);
  res.json(result);
});

router.delete("/whitelist/:phone", (req, res) => {
  const { phone } = req.params;
  const result = removeFromWhitelist(decodeURIComponent(phone));
  res.json(result);
});

export default router;
