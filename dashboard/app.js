const messages = [
  {
    id: "ac-001",
    initials: "JD",
    avatar: "avatar-purple",
    sender: "Jean Dupont",
    address: "jean.dupont@exemple.fr",
    subject: "Migration Cloud",
    summary: "Demande de devis pour trois concessions",
    time: "09:41",
    status: "À valider",
    statusKey: "validation",
    domain: "Commercial",
    product: "Cloud",
    priority: "Priorité haute",
    confidence: 92,
    recipients: "Jérémy Druelle",
    original: "Bonjour Jérémy,\n\nNous souhaitons étudier une migration Cloud pour trois concessions. Pouvez-vous nous transmettre une proposition commerciale et les prochaines étapes ?\n\nBien à vous,\nJean",
    aiSummary: "Le client demande une proposition commerciale pour une migration Cloud sur trois concessions. Une réponse avec cadrage du besoin et proposition de rendez-vous est attendue.",
    draft: "Bonjour Jean,\n\nMerci pour votre message. Nous pouvons vous accompagner dans l’étude de votre migration Cloud pour vos trois concessions.\n\nJe vous propose un échange afin de préciser votre périmètre et vous présenter la proposition la plus adaptée.\n\nBien cordialement,"
  },
  {
    id: "ac-002",
    initials: "CM",
    avatar: "avatar-pink",
    sender: "Camille Martin",
    address: "camille.martin@garage-exemple.fr",
    subject: "Demande d’information sur vos offres",
    summary: "Souhaite comprendre les offres disponibles",
    time: "09:28",
    status: "Traité automatiquement",
    statusKey: "done",
    domain: "Commercial",
    product: "CRM 360",
    priority: "Priorité normale",
    confidence: 88,
    recipients: "Jérémy Druelle",
    original: "Bonjour,\n\nJe souhaite en savoir plus sur vos offres pour notre réseau de distribution. Pouvez-vous m’orienter vers la bonne documentation ?",
    aiSummary: "Demande d’information générale sur les offres. Le produit CRM 360 est probable, mais le besoin doit être précisé avant une réponse complète.",
    draft: "Bonjour Camille,\n\nMerci pour votre intérêt. Je peux vous orienter vers les informations les plus adaptées à votre réseau.\n\nPouvez-vous me préciser vos priorités actuelles et le nombre de sites concernés ?\n\nBien cordialement,"
  },
  {
    id: "ac-003",
    initials: "MS",
    avatar: "avatar-cyan",
    sender: "Mathieu Sevaer",
    address: "mathieu.sevaer@nextlane.com",
    subject: "À quelle heure le point aujourd’hui ?",
    summary: "Confirmation du point commercial de la journée",
    time: "09:06",
    status: "Traité automatiquement",
    statusKey: "done",
    domain: "Hiérarchie",
    product: "Interne",
    priority: "Priorité normale",
    confidence: 97,
    recipients: "Jérémy Druelle",
    original: "Bonjour Jérémy,\n\nÀ quelle heure souhaites-tu faire le point aujourd’hui ?\n\nMerci,\nMathieu",
    aiSummary: "Message interne de coordination provenant de la hiérarchie. Aucun brouillon client ni recherche produit n’est nécessaire.",
    draft: "Message classé automatiquement dans la catégorie Hiérarchie. Aucune réponse préparée."
  },
  {
    id: "ac-004",
    initials: "PR",
    avatar: "avatar-yellow",
    sender: "Pierre Renard",
    address: "pierre.renard@client-exemple.fr",
    subject: "Meeting jeudi prochain ?",
    summary: "Propose un rendez-vous pour avancer sur le dossier",
    time: "08:54",
    status: "À valider",
    statusKey: "validation",
    domain: "Commercial",
    product: "DMS",
    priority: "Priorité haute",
    confidence: 84,
    recipients: "Jérémy Druelle",
    original: "Bonjour Jérémy,\n\nSeriez-vous disponible jeudi prochain pour faire le point sur l’avancement du dossier DMS ?\n\nBien à vous,\nPierre",
    aiSummary: "Le client propose un rendez-vous au sujet du DMS. Le message est commercial et nécessite une validation de disponibilité.",
    draft: "Bonjour Pierre,\n\nMerci pour votre message. Je peux vous proposer un échange jeudi afin de faire le point sur le dossier DMS.\n\nJe reviens vers vous avec mes créneaux disponibles.\n\nBien cordialement,"
  },
  {
    id: "ac-005",
    initials: "SL",
    avatar: "avatar-blue",
    sender: "Sarah Leroy",
    address: "sarah.leroy@partenaire.fr",
    subject: "Proposition de partenariat affiliation",
    summary: "Proposition de partenariat à étudier",
    time: "08:32",
    status: "À valider",
    statusKey: "validation",
    domain: "Commercial",
    product: "Remarketing",
    priority: "Priorité normale",
    confidence: 79,
    recipients: "Jérémy Druelle",
    original: "Bonjour,\n\nNous aimerions vous proposer un partenariat autour de notre programme d’affiliation. Seriez-vous disponible pour en discuter ?",
    aiSummary: "Partenariat commercial entrant. La proposition est intéressante mais le périmètre et le lien avec les offres Nextlane restent à préciser.",
    draft: "Bonjour Sarah,\n\nMerci pour votre prise de contact. Je suis disponible pour comprendre votre proposition et vérifier les synergies possibles avec nos activités.\n\nPouvez-vous me transmettre quelques éléments complémentaires avant notre échange ?\n\nBien cordialement,"
  },
  {
    id: "ac-006",
    initials: "CU",
    avatar: "avatar-red",
    sender: "Client urgent",
    address: "support@client-exemple.fr",
    subject: "Bug sur la facturation",
    summary: "Incident bloquant sur une facture client",
    time: "08:15",
    status: "Urgent",
    statusKey: "urgent",
    domain: "Support",
    product: "Digital Invoice",
    priority: "Critique",
    confidence: 91,
    recipients: "Jérémy Druelle",
    original: "Bonjour,\n\nNous rencontrons un blocage sur la facturation depuis hier. Plusieurs factures ne peuvent pas être générées. Pouvez-vous nous confirmer la prise en compte de l’incident ?\n\nCordialement,",
    aiSummary: "Incident de facturation bloquant. Un accusé de réception client et une relance interne vers le support doivent être préparés avec validation humaine.",
    draft: "Bonjour,\n\nNous vous confirmons la prise en compte de votre signalement concernant le blocage de facturation. Notre équipe support va analyser l’incident et revenir vers vous avec les prochaines étapes.\n\nBien cordialement,"
  }
];

const state = { selectedId: messages[0].id, filter: "all", query: "" };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function statusClass(statusKey) {
  return statusKey === "done" ? "status-done" : statusKey === "urgent" ? "status-urgent" : statusKey === "ignored" ? "status-ignored" : "status-validation";
}

function visibleMessages() {
  const query = state.query.trim().toLowerCase();
  return messages.filter((message) => {
    const matchesFilter = state.filter === "all" || (state.filter === "important" ? ["validation", "urgent"].includes(message.statusKey) : message.statusKey === state.filter);
    const haystack = `${message.sender} ${message.subject} ${message.summary} ${message.domain} ${message.product}`.toLowerCase();
    return matchesFilter && (!query || haystack.includes(query));
  });
}

function renderList() {
  const list = $("#mail-list");
  const visible = visibleMessages();
  list.innerHTML = visible.map((message) => `
    <button class="mail-row ${message.id === state.selectedId ? "is-selected" : ""}" type="button" data-id="${message.id}">
      <span class="avatar ${message.avatar}">${escapeHtml(message.initials)}</span>
      <span class="mail-copy"><strong>${escapeHtml(message.sender)}</strong><span>${escapeHtml(message.subject)}</span><small>${escapeHtml(message.summary)}</small></span>
      <span class="mail-meta-right"><time class="mail-time">${escapeHtml(message.time)}</time><span class="status-pill ${statusClass(message.statusKey)}">${escapeHtml(message.status)}</span></span>
    </button>`).join("");
  $("#list-count").textContent = `${visible.length} email${visible.length > 1 ? "s" : ""} affiché${visible.length > 1 ? "s" : ""}`;
  $$(".mail-row").forEach((row) => row.addEventListener("click", () => { state.selectedId = row.dataset.id; renderList(); renderDetail(); }));
}

function renderDetail() {
  const message = messages.find((item) => item.id === state.selectedId);
  if (!message) return;
  $("#detail-empty").hidden = true;
  $("#detail-content").hidden = false;
  $("#detail-title").textContent = message.subject;
  $("#detail-status").textContent = message.status;
  $("#detail-status").className = `status-pill ${statusClass(message.statusKey)}`;
  $("#detail-time").textContent = `${message.time} · aujourd’hui`;
  $("#detail-avatar").textContent = message.initials;
  $("#detail-avatar").className = `avatar ${message.avatar}`;
  $("#detail-sender").textContent = message.sender;
  $("#detail-address").textContent = message.address;
  $("#detail-recipients").textContent = message.recipients;
  $("#detail-subject").textContent = message.subject;
  $("#detail-original").textContent = message.original;
  $("#detail-summary").textContent = message.aiSummary;
  $("#detail-domain").textContent = message.domain;
  $("#detail-product").textContent = message.product;
  $("#detail-priority").textContent = message.priority;
  $("#detail-confidence").textContent = `${message.confidence} % de confiance`;
  $("#confidence-bar").style.width = `${message.confidence}%`;
  $("#detail-draft").textContent = message.draft;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function updateMetricLabels() {
  $("[data-metric=total]").textContent = messages.length + 8;
  $("[data-metric=spam]").textContent = "8";
  $("[data-metric=auto]").textContent = messages.filter((item) => item.statusKey === "done").length;
  $("[data-metric=validation]").textContent = messages.filter((item) => ["validation", "urgent"].includes(item.statusKey)).length;
}

function runAction(action) {
  const message = messages.find((item) => item.id === state.selectedId);
  if (["profile", "help", "notifications", "date-filter", "load-more"].includes(action)) {
    const notices = { profile: "Le profil et les paramètres seront connectés à Microsoft 365.", help: "Le tableau de bord respecte la validation humaine et la quarantaine.", notifications: "Aucune nouvelle alerte critique.", "date-filter": "Le filtre de date sera relié aux journaux de traitement.", "load-more": "Le chargement de l’historique sera relié à EmailLog2." };
    showToast(notices[action]);
    return;
  }
  if (!message) return;
  if (action === "close-detail") { $("#detail-empty").hidden = false; $("#detail-content").hidden = true; return; }
  if (action === "open-outlook") { showToast("Ouverture du brouillon Outlook demandée. L’envoi reste manuel dans Outlook."); return; }
  if (action === "edit") { showToast("Le brouillon est prêt à être modifié dans Outlook."); return; }
  if (action === "regenerate") { message.draft = `${message.draft}\n\n[Version régénérée avec le contexte de la conversation]`; renderDetail(); showToast("Une nouvelle proposition a été préparée, sans envoi."); return; }
  if (action === "ignore") { message.status = "Ignoré"; message.statusKey = "ignored"; renderList(); renderDetail(); updateMetricLabels(); showToast("Email marqué comme ignoré et journalisé."); return; }
  if (action === "classify") { showToast("Le classement sera appliqué par le workflow et journalisé."); return; }
}

$$('[data-action]').forEach((button) => button.addEventListener("click", () => runAction(button.dataset.action)));
$$('[data-filter]').forEach((button) => button.addEventListener("click", () => {
  state.filter = button.dataset.filter;
  $$('[data-filter]').forEach((tab) => { tab.classList.toggle("is-active", tab === button); tab.setAttribute("aria-selected", tab === button ? "true" : "false"); });
  renderList();
}));
$("#mail-search").addEventListener("input", (event) => { state.query = event.target.value; renderList(); });

renderList();
renderDetail();
updateMetricLabels();
