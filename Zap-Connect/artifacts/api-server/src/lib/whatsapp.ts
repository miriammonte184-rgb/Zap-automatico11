import wwebjs from "whatsapp-web.js";
import { db, queryHistoryTable } from "@workspace/db";
import { queryMaterial, queryOp, getState, detectQueryType } from "./spreadsheet.js";
import { execSync } from "child_process";
import fs from "fs";

function findChromiumPath(): string {
  try {
    return execSync("which chromium 2>/dev/null || which chromium-browser 2>/dev/null || which google-chrome 2>/dev/null", { encoding: "utf-8" }).trim();
  } catch {
    return "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium";
  }
}

const CHROMIUM_PATH = findChromiumPath();
console.log("Using Chromium:", CHROMIUM_PATH);

const WHITELIST_FILE = "/tmp/zapauto_whitelist.json";

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

function loadWhitelistFromFile(): string[] {
  try {
    if (fs.existsSync(WHITELIST_FILE)) {
      const raw = fs.readFileSync(WHITELIST_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveWhitelistToFile(list: string[]): void {
  try {
    fs.writeFileSync(WHITELIST_FILE, JSON.stringify(list), "utf-8");
  } catch (e) {
    console.error("Failed to save whitelist:", e);
  }
}

const { Client, LocalAuth } = wwebjs;
type WhatsappConnectionStatus = "disconnected" | "connecting" | "connected" | "qr_ready";

interface WhatsappState {
  status: WhatsappConnectionStatus;
  qrCode: string | null;
  phone: string | null;
  name: string | null;
  client: InstanceType<typeof Client> | null;
  whitelist: string[];
}

const state: WhatsappState = {
  status: "disconnected",
  qrCode: null,
  phone: null,
  name: null,
  client: null,
  whitelist: loadWhitelistFromFile(),
};

export function getWhatsappStatus() {
  return {
    connected: state.status === "connected",
    phone: state.phone,
    name: state.name,
    status: state.status,
  };
}

export function getQrCode() {
  return {
    qrCode: state.qrCode,
    status: state.status,
  };
}

export function getWhitelist(): string[] {
  return [...state.whitelist];
}

export function addToWhitelist(phone: string): { success: boolean; message: string } {
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length < 8) {
    return { success: false, message: "Número inválido. Use o formato: +55119XXXXXXXX" };
  }
  if (state.whitelist.includes(normalized)) {
    return { success: false, message: "Número já está na lista." };
  }
  state.whitelist.push(normalized);
  saveWhitelistToFile(state.whitelist);
  return { success: true, message: `Número ${phone} adicionado com sucesso.` };
}

export function removeFromWhitelist(phone: string): { success: boolean; message: string } {
  const normalized = normalizePhone(phone);
  const idx = state.whitelist.indexOf(normalized);
  if (idx === -1) {
    return { success: false, message: "Número não encontrado na lista." };
  }
  state.whitelist.splice(idx, 1);
  saveWhitelistToFile(state.whitelist);
  return { success: true, message: `Número ${phone} removido com sucesso.` };
}

function isAuthorized(phoneNumber: string): boolean {
  if (state.whitelist.length === 0) return false;
  const digits = normalizePhone(phoneNumber);
  // Check both full number and without country code prefix
  return state.whitelist.some((w) => digits.endsWith(w) || w.endsWith(digits));
}

function isGroup(from: string): boolean {
  return from.endsWith("@g.us");
}

function isLid(from: string): boolean {
  return from.endsWith("@lid");
}

const SEPARATOR = "────────────────────";

const NUMBER_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

function buildOpResponse(opCode: string): string {
  const result = queryOp(opCode);
  if (!result.found) {
    return `❌ OP *${opCode}* não encontrada na planilha.`;
  }
  if (result.missingMaterials.length === 0) {
    return [
      SEPARATOR,
      `✅ *OP ${opCode}*`,
      `Todos os materiais estão disponíveis!`,
      `Nenhuma falta identificada para esta OP.`,
      SEPARATOR,
    ].join("\n");
  }

  const lines: string[] = [
    SEPARATOR,
    `⚠️ *OP ${opCode}* — Materiais em falta:`,
    "",
  ];

  result.missingMaterials.forEach((mat, idx) => {
    const num = NUMBER_EMOJIS[idx] ?? `${idx + 1}.`;
    lines.push(`${num} *${mat.materialCode}* — ${mat.description}`);
    lines.push(`   📦 Falta: *${mat.qtdFalta}* unidades`);
    lines.push(`   🛒 Pedido: ${mat.purchaseOrderQty} un.`);
    lines.push(`   📅 Previsão: ${mat.expectedArrival}`);
    lines.push("");
  });

  lines.push(`Total de materiais em falta: *${result.missingMaterials.length}*`);
  lines.push(SEPARATOR);

  return lines.join("\n");
}

function buildMaterialResponse(materialCode: string): string {
  const result = queryMaterial(materialCode);
  if (!result) {
    return `❌ Material *${materialCode}* não encontrado na planilha.`;
  }

  const lines: string[] = [
    SEPARATOR,
    `📦 *Material: ${result.materialCode}*`,
    `📋 ${result.description}`,
    "",
    `📊 Estoque atual: *${result.currentStock}* un.`,
    `🛒 Pedido de compra: ${result.purchaseOrderQty} un.`,
    `📅 Previsão de chegada: ${result.expectedArrival}`,
  ];

  if (result.opsUsing.length > 0) {
    lines.push("");
    lines.push(`🏭 OPs que utilizam este material:`);
    result.opsUsing.forEach((op) => {
      lines.push(`• OP ${op.opCode} — Empenho: ${op.empenhQty} — Data: ${op.planDateStr}`);
    });
  }

  lines.push(SEPARATOR);

  return lines.join("\n");
}

async function handleMessage(msg: {
  body: string;
  from: string;
  reply: (text: string) => Promise<void>;
  getContact: () => Promise<{ number: string; id: { user: string } }>;
}) {
  const body = msg.body?.trim();
  if (!body) return;

  // Block group messages
  if (isGroup(msg.from)) {
    console.log(`⛔ Mensagem de grupo ignorada: ${msg.from}`);
    return;
  }

  // Resolve real phone number — @lid is a WhatsApp internal linked ID, not a phone
  let phoneNumber = msg.from.split("@")[0];
  if (isLid(msg.from)) {
    try {
      const contact = await msg.getContact();
      phoneNumber = contact.number || contact.id.user;
      console.log(`🔍 LID resolvido: ${msg.from} → ${phoneNumber}`);
    } catch (e) {
      console.error("Falha ao resolver LID:", e);
    }
  }

  // Check whitelist
  if (!isAuthorized(phoneNumber)) {
    console.log(`⛔ Número não autorizado: ${phoneNumber} (${msg.from}) — mensagem ignorada`);
    return;
  }

  console.log(`✅ Mensagem autorizada de: ${phoneNumber}`);

  const spreadsheetState = getState();
  if (!spreadsheetState.loaded) {
    await msg.reply("⚠️ Sistema em manutenção. Tente novamente em alguns minutos.");
    return;
  }

  const clean = body.replace(/^OP[\s-]?/i, "").trim();
  const queryType = detectQueryType(body);

  let resultText = "";
  let historyType: "op" | "material" = "op";

  if (queryType === "op") {
    historyType = "op";
    resultText = buildOpResponse(clean.toUpperCase());
  } else if (queryType === "material") {
    historyType = "material";
    resultText = buildMaterialResponse(clean);
  } else {
    resultText = `❓ Não encontrei resultado para: *${body}*.\n\nEnvie um *código de OP* ou *código de material* para consultar.`;
    historyType = "material";
  }

  await msg.reply(resultText);

  try {
    await db.insert(queryHistoryTable).values({
      queryType: historyType,
      queryValue: clean,
      phoneNumber: phoneNumber + "@c.us",
      result: resultText.slice(0, 500),
    });
  } catch (e) {
    console.error("Failed to save query history:", e);
  }
}

export function initializeWhatsapp() {
  if (state.client) return;

  console.log("Initializing WhatsApp client...");
  state.status = "connecting";

  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: "/tmp/wwebjs_auth" }),
    puppeteer: {
      executablePath: CHROMIUM_PATH,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
        "--disable-extensions",
      ],
    },
  });

  client.on("qr", (qr: string) => {
    console.log("QR code generated");
    state.qrCode = qr;
    state.status = "qr_ready";
  });

  client.on("ready", async () => {
    console.log("WhatsApp client is ready!");
    state.status = "connected";
    state.qrCode = null;
    try {
      const info = (client as unknown as { info: { wid: { user: string }; pushname: string } }).info;
      state.phone = info.wid.user;
      state.name = info.pushname;
    } catch {
      state.phone = null;
      state.name = null;
    }
  });

  client.on("authenticated", () => {
    console.log("WhatsApp authenticated");
    state.status = "connecting";
  });

  client.on("auth_failure", (msg: string) => {
    console.error("WhatsApp auth failure:", msg);
    state.status = "disconnected";
    state.client = null;
  });

  client.on("disconnected", (reason: string) => {
    console.log("WhatsApp disconnected:", reason);
    state.status = "disconnected";
    state.qrCode = null;
    state.phone = null;
    state.name = null;
    state.client = null;
  });

  client.on("message", handleMessage);

  client.initialize().catch((err: unknown) => {
    console.error("Failed to initialize WhatsApp:", err);
    state.status = "disconnected";
    state.client = null;
  });

  state.client = client;
}

export async function disconnectWhatsapp() {
  if (state.client) {
    try {
      await (state.client as unknown as { destroy(): Promise<void> }).destroy();
    } catch (e) {
      console.error("Error destroying client:", e);
    }
    state.client = null;
  }
  state.status = "disconnected";
  state.qrCode = null;
  state.phone = null;
  state.name = null;
}
