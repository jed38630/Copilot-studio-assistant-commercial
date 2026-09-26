import crypto from "node:crypto";
import http from "node:http";
import { readFile, mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(localDir, "../..");
const dashboardRoot = path.join(repoRoot, "dashboard");
const syncDir = path.resolve(process.env.AC_ONEDRIVE_SYNC_DIR || path.join(localDir, "data"));
const dataFile = path.resolve(process.env.AC_DASHBOARD_DATA_FILE || path.join(syncDir, "dashboard-data.json"));
const actionsDir = path.resolve(process.env.AC_DASHBOARD_ACTIONS_DIR || path.join(syncDir, "actions"));
const port = Number(process.env.AC_LOCAL_PORT || 8090);
const allowedActions = new Set(["ignore", "classify", "regenerate"]);

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "http://localhost:" + port
  });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 100_000) reject(new Error("Payload trop volumineux"));
    });
    request.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("JSON invalide")); }
    });
    request.on("error", reject);
  });
}

async function readDashboardData() {
  const raw = await readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed) ? parsed : parsed.items;
  if (!Array.isArray(items)) throw new Error("Le JSON doit contenir un tableau items");
  return { items };
}

async function writeAction(payload) {
  const action = String(payload.action || "");
  const messageId = String(payload.messageId || "").trim();
  if (!allowedActions.has(action)) throw new Error("Action locale non autorisée");
  if (!messageId) throw new Error("MessageId obligatoire");

  const actionId = String(payload.actionId || crypto.randomUUID());
  if (!/^[a-zA-Z0-9_-]+$/.test(actionId)) throw new Error("ActionId invalide");
  await mkdir(actionsDir, { recursive: true });
  const target = path.join(actionsDir, `${actionId}.json`);
  const record = {
    ActionId: actionId,
    MessageId: messageId,
    Action: action,
    Category: String(payload.category || ""),
    Instruction: String(payload.instruction || ""),
    Status: "Requested",
    RequestedAt: new Date().toISOString(),
    Source: "assistant-commercial-dashboard-local"
  };

  try {
    await readFile(target, "utf8");
    return { accepted: true, duplicate: true, actionId, action, messageId };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const temp = `${target}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(record, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
  await rename(temp, target);
  return { accepted: true, duplicate: false, actionId, action, messageId };
}

function safeStaticPath(urlPath) {
  const requested = urlPath === "/" ? "/index.html" : urlPath;
  const candidate = path.resolve(dashboardRoot, `.${requested}`);
  return candidate.startsWith(dashboardRoot + path.sep) ? candidate : null;
}

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (request.method === "OPTIONS") {
      response.writeHead(204, { "Access-Control-Allow-Origin": `http://localhost:${port}`, "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" });
      return response.end();
    }
    if (request.method === "GET" && url.pathname === "/health") return sendJson(response, 200, { ok: true, dataFile, actionsDir });
    if (request.method === "GET" && url.pathname === "/api/dashboard/emails") return sendJson(response, 200, await readDashboardData());
    if (request.method === "POST" && url.pathname === "/api/dashboard/actions") return sendJson(response, 202, await writeAction(await readBody(request)));
    if (request.method !== "GET") return sendJson(response, 405, { error: "Méthode non autorisée" });

    const file = safeStaticPath(url.pathname);
    if (!file) return sendJson(response, 400, { error: "Chemin invalide" });
    const body = await readFile(file);
    response.writeHead(200, { "Content-Type": contentTypes[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    response.end(body);
  } catch (error) {
    const status = error.code === "ENOENT" ? 404 : 400;
    sendJson(response, status, { error: error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Dashboard local: http://localhost:${port}/`);
  console.log(`Données OneDrive attendues: ${dataFile}`);
  console.log(`Actions OneDrive écrites dans: ${actionsDir}`);
});
