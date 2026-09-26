import http from "node:http";

const config = {
  port: Number(process.env.DASHBOARD_API_PORT || 8787),
  origin: process.env.DASHBOARD_ORIGIN || "http://localhost:8080",
  tenantId: process.env.TENANT_ID || "",
  clientId: process.env.CLIENT_ID || "",
  clientSecret: process.env.CLIENT_SECRET || "",
  graphBaseUrl: (process.env.GRAPH_BASE_URL || "https://graph.microsoft.com/v1.0").replace(/\/$/, ""),
  siteId: process.env.SHAREPOINT_SITE_ID || "",
  emailLogListId: process.env.SHAREPOINT_LIST_EMAIL_LOG || "",
  draftLogListId: process.env.SHAREPOINT_LIST_DRAFT_LOG || "",
  actionUrls: {
    ignore: process.env.FLOW_DASHBOARD_IGNORE_URL || "",
    classify: process.env.FLOW_DASHBOARD_CLASSIFY_URL || "",
    regenerate: process.env.FLOW_DASHBOARD_REGENERATE_URL || ""
  }
};

let tokenCache = { value: "", expiresAt: 0 };

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": config.origin,
    "Access-Control-Allow-Credentials": "true",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; if (raw.length > 100_000) reject(new Error("Payload trop volumineux")); });
    request.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("JSON invalide")); }
    });
    request.on("error", reject);
  });
}

async function getGraphToken() {
  if (!config.tenantId || !config.clientId || !config.clientSecret) throw new Error("Configuration Entra ID incomplète");
  if (tokenCache.value && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.value;
  const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" })
  });
  if (!response.ok) throw new Error("Authentification Graph refusée");
  const data = await response.json();
  tokenCache = { value: data.access_token, expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000 };
  return tokenCache.value;
}

async function graphGet(path) {
  const token = await getGraphToken();
  const response = await fetch(`${config.graphBaseUrl}${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
  if (!response.ok) throw new Error(`Lecture SharePoint refusée (${response.status})`);
  return response.json();
}

function fieldsToDashboard(fields = {}) {
  return {
    id: fields.MessageId,
    MessageId: fields.MessageId,
    ConversationId: fields.ConversationId,
    Expediteur: fields.Expediteur,
    Objet: fields.Objet || fields.Title,
    DateReception: fields.DateReception,
    Categorie: fields.Categorie,
    NiveauConfiance: fields.NiveauConfiance,
    ScorePriorite: fields.ScorePriorite,
    Decision: fields.Decision,
    ActionEffectuee: fields.ActionEffectuee,
    StatutTraitement: fields.StatutTraitement || fields.StatutValidation,
    ResumeIA: fields.ResumeIA || fields.RaisonDecision,
    ContenuOriginal: fields.ContenuOriginal || fields.Apercu,
    LienEmail: fields.LienEmail,
    LienBrouillon: fields.LienBrouillon,
    BrouillonCree: fields.BrouillonCree,
    ProduitPrincipal: fields.ProduitPrincipal,
    DomainePrincipal: fields.DomainePrincipal
  };
}

async function listEmails() {
  if (!config.siteId || !config.emailLogListId) throw new Error("Configuration SharePoint incomplète");
  const query = "?$expand=fields&$top=100&$orderby=fields/DateReception desc";
  const data = await graphGet(`/sites/${encodeURIComponent(config.siteId)}/lists/${encodeURIComponent(config.emailLogListId)}/items${query}`);
  return { items: (data.value || []).map((item) => fieldsToDashboard(item.fields)) };
}

async function relayAction(action, payload) {
  const allowed = new Set(["ignore", "classify", "regenerate"]);
  if (!allowed.has(action) || !config.actionUrls[action]) throw new Error("Action dashboard non configurée");
  if (typeof payload.messageId !== "string" || !payload.messageId.trim()) throw new Error("MessageId obligatoire");
  const response = await fetch(config.actionUrls[action], { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: payload.messageId, category: payload.category, instruction: payload.instruction }) });
  if (!response.ok) throw new Error("Le workflow d’action a refusé la demande");
  return { accepted: true, action, messageId: payload.messageId };
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, { "Access-Control-Allow-Origin": config.origin, "Access-Control-Allow-Credentials": "true", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" });
    return response.end();
  }
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (request.method === "GET" && url.pathname === "/api/dashboard/emails") return sendJson(response, 200, await listEmails());
    if (request.method === "POST" && url.pathname === "/api/dashboard/actions") {
      const body = await readBody(request);
      return sendJson(response, 200, await relayAction(body.action, body));
    }
    return sendJson(response, 404, { error: "Route inconnue" });
  } catch (error) {
    return sendJson(response, 400, { error: error.message });
  }
});

server.listen(config.port, () => console.log(`Assistant Commercial dashboard API écoute sur le port ${config.port}`));
