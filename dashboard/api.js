(() => {
  const config = window.AC_CONFIG || { apiBaseUrl: "", mode: "mock", refreshIntervalMs: 60000 };
  const sharePointSiteUrl = String(config.sharePointSiteUrl || "").replace(/\/$/, "");
  const emailLogListTitle = config.emailLogListTitle || "AssistantCommercial_EmailLog2";
  const actionListTitle = config.actionListTitle || "AssistantCommercial_DashboardActions";
  let digestCache = { value: "", expiresAt: 0 };

  function isSharePointHosted() {
    if (!sharePointSiteUrl || window.location.protocol === "file:") return false;
    try {
      const site = new URL(sharePointSiteUrl);
      const current = new URL(window.location.href);
      return current.origin === site.origin && current.pathname.startsWith(`${site.pathname}/`);
    } catch {
      return false;
    }
  }

  function effectiveMode() {
    if (config.mode === "sharepoint") return "sharepoint";
    if (config.mode === "auto" && isSharePointHosted()) return "sharepoint";
    // A standalone deployment uses the same-origin API exposed by the web container.
    // SharePoint's blob/about:srcdoc preview must remain a local demo.
    if (config.mode === "api") return "api";
    if (config.mode === "auto" && config.apiBaseUrl && !["file:", "blob:", "about:"].includes(window.location.protocol)) return "api";
    return config.mode || "mock";
  }

  function isLive() {
    return (effectiveMode() === "api" && Boolean(config.apiBaseUrl)) || effectiveMode() === "sharepoint";
  }

  async function request(path, options = {}) {
    if (effectiveMode() !== "api") return null;
    const response = await fetch(`${config.apiBaseUrl.replace(/\/$/, "")}${path}`, {
      credentials: "include",
      headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}) },
      ...options
    });
    if (!response.ok) throw new Error(`API dashboard indisponible (${response.status})`);
    return response.json();
  }

  function escapeODataString(value) {
    return String(value).replace(/'/g, "''");
  }

  function sharePointUrl(path) {
    if (!sharePointSiteUrl || !isSharePointHosted()) {
      throw new Error("Le dashboard doit être hébergé dans le site SharePoint cible.");
    }
    return `${sharePointSiteUrl}/_api${path}`;
  }

  async function sharePointRequest(path, options = {}) {
    const response = await fetch(sharePointUrl(path), {
      credentials: "same-origin",
      headers: {
        Accept: "application/json;odata=nometadata",
        ...(options.body ? { "Content-Type": "application/json;odata=nometadata" } : {}),
        ...(options.headers || {})
      },
      ...options
    });
    if (!response.ok) throw new Error(`SharePoint indisponible (${response.status})`);
    return response.status === 204 ? null : response.json();
  }

  async function getRequestDigest() {
    if (digestCache.value && digestCache.expiresAt > Date.now() + 30_000) return digestCache.value;
    const data = await sharePointRequest("/contextinfo", { method: "POST", body: "{}" });
    const digest = data?.FormDigestValue || data?.d?.GetContextWebInformation?.FormDigestValue;
    if (!digest) throw new Error("Jeton de formulaire SharePoint introuvable");
    digestCache = { value: digest, expiresAt: Date.now() + 20 * 60 * 1000 };
    return digest;
  }

  function listPath(title) {
    return `/web/lists/getbytitle('${escapeODataString(title)}')/items?$top=100&$orderby=Created desc`;
  }

  function sharePointItems(data) {
    return data?.value || data?.d?.results || [];
  }

  async function listSharePointEmails() {
    const data = await sharePointRequest(listPath(emailLogListTitle));
    return { items: sharePointItems(data) };
  }

  async function queueSharePointAction(action, messageId, payload = {}) {
    const digest = await getRequestDigest();
    const body = {
      Title: `${action}-${messageId}`.slice(0, 255),
      MessageId: messageId,
      Action: action,
      Category: payload.category || "",
      Instruction: payload.instruction || "",
      Status: "Requested",
      RequestedAt: new Date().toISOString()
    };
    const data = await sharePointRequest(listPath(actionListTitle).split("?")[0], {
      method: "POST",
      headers: { "X-RequestDigest": digest },
      body: JSON.stringify(body)
    });
    return { accepted: true, action, messageId, item: data };
  }

  window.ACApi = {
    isLive,
    mode: effectiveMode,
    refreshIntervalMs: config.refreshIntervalMs || 60000,
    async listEmails() {
      return effectiveMode() === "sharepoint" ? listSharePointEmails() : request("/api/dashboard/emails");
    },
    async runAction(action, messageId, payload = {}) {
      if (effectiveMode() === "sharepoint") return queueSharePointAction(action, messageId, payload);
      return request("/api/dashboard/actions", {
        method: "POST",
        body: JSON.stringify({ action, messageId, ...payload })
      });
    }
  };
})();
