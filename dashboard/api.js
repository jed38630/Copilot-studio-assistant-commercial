(() => {
  const config = window.AC_CONFIG || { apiBaseUrl: "", mode: "mock", refreshIntervalMs: 60000 };

  function isLive() {
    return config.mode === "api" && Boolean(config.apiBaseUrl);
  }

  async function request(path, options = {}) {
    if (!isLive()) return null;
    const response = await fetch(`${config.apiBaseUrl.replace(/\/$/, "")}${path}`, {
      credentials: "include",
      headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}) },
      ...options
    });
    if (!response.ok) throw new Error(`API dashboard indisponible (${response.status})`);
    return response.json();
  }

  window.ACApi = {
    isLive,
    refreshIntervalMs: config.refreshIntervalMs || 60000,
    async listEmails() { return request("/api/dashboard/emails"); },
    async runAction(action, messageId, payload = {}) {
      return request("/api/dashboard/actions", {
        method: "POST",
        body: JSON.stringify({ action, messageId, ...payload })
      });
    }
  };
})();
