import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const SENSITIVE_KEYWORDS = [
  'résiliation',
  'litige',
  'avocat',
  'contrat',
  'remise exceptionnelle',
  'geste commercial',
  'confidentiel',
  'données bancaires',
  'mot de passe',
  'RIB',
  'plainte',
  'contentieux',
  'facture impayée',
  'pénalité',
  'dénonciation',
  'RGPD'
];

export const DEFAULT_SETTINGS = {
  ModeSimulationHistorique: true,
  TailleLotHistorique: 50,
  NombreMaxEmailsHistoriqueParJour: 500,
  NombreMaxAlertesTeamsParRapport: 10,
  CreationBrouillonsHistorique: false,
  SeuilPrioriteAlerteTempsReel: 70,
  SeuilConfianceQuarantaine: 85,
  DelaiSuppressionQuarantaineJours: 30,
  DomainesClientsConnus: ['client-alpha.fr', 'contoso.com', 'fabrikam.fr'],
  MotsClesSensibles: SENSITIVE_KEYWORDS
};

export function normalizeText(value) {
  return String(value ?? '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

export function senderAddress(email) {
  return email.from?.emailAddress?.address ?? email.expediteur ?? '';
}

export function senderDomain(email) {
  const address = senderAddress(email);
  const domain = address.includes('@') ? address.split('@').pop() : email.domaineExpediteur;
  return String(domain ?? '').toLowerCase();
}

export function isKnownClientDomain(email, settings = DEFAULT_SETTINGS) {
  const domain = senderDomain(email);
  return Boolean(email.isKnownClient) || settings.DomainesClientsConnus.some((known) => domain === known || domain.endsWith(`.${known}`));
}

export function detectSensitiveKeywords(email, settings = DEFAULT_SETTINGS) {
  const haystack = normalizeText([
    email.subject,
    email.bodyPreview,
    email.body,
    email.preview
  ].join(' '));

  return settings.MotsClesSensibles.filter((keyword) => containsSensitiveKeyword(haystack, keyword));
}

function containsSensitiveKeyword(normalizedHaystack, keyword) {
  const normalizedKeyword = normalizeText(keyword).trim();
  if (!normalizedKeyword) return false;
  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
  return pattern.test(normalizedHaystack);
}

export function calculatePriorityScore(email, settings = DEFAULT_SETTINGS) {
  let score = 0;
  const knownClient = isKnownClientDomain(email, settings);
  const subject = normalizeText(email.subject);
  const body = normalizeText(`${email.bodyPreview ?? ''} ${email.body ?? ''}`);
  const combined = `${subject} ${body}`;

  const explicitResponse = Boolean(email.requiresResponse || email.quoteRequest || /repond|retour|avis|validation|devis|proposition|disponibilite/.test(combined));
  const commercialImpact = Boolean(email.commercialImpact || email.quoteRequest || /devis|contrat|commande|budget|renouvellement|proposition/.test(combined));
  const urgent = Boolean(email.urgent || /urgent|avant le|echeance|aujourd'hui|demain|asap|bloquant/.test(combined));
  const complaint = Boolean(email.complaint || /reclamation|blocage|litige|plainte|contentieux|impaye/.test(combined));
  const newsletter = Boolean(email.isNewsletter || /newsletter|unsubscribe|desabonnement|digest/.test(combined));
  const advertisement = Boolean(email.isAdvertisement || /promotion|publicite|offre speciale|soldes|marketing/.test(combined));
  const automatic = Boolean(email.isAutomatic || /no-reply|noreply|notification automatique|do not reply/.test(combined) || senderAddress(email).toLowerCase().includes('no-reply'));

  if (knownClient) score += 25;
  if (explicitResponse) score += 20;
  if (commercialImpact) score += 20;
  if (urgent) score += 15;
  if (complaint) score += 15;
  if (email.hasAttachments || email.hasCommercialAttachment) score += 5;
  if (newsletter || advertisement) score -= 40;
  if (automatic) score -= 30;
  if (!knownClient && !explicitResponse && !commercialImpact) score -= 20;

  return Math.max(-100, Math.min(100, score));
}

export function calculateConfidence(email, settings = DEFAULT_SETTINGS) {
  const sensitive = detectSensitiveKeywords(email, settings);
  const knownClient = isKnownClientDomain(email, settings);
  let confidence = 70;

  if (knownClient || email.requiresResponse || email.quoteRequest || email.isNewsletter || email.isAdvertisement || email.isAutomatic) confidence += 15;
  if (email.bodyPreview || email.body) confidence += 5;
  if (sensitive.length > 0) confidence += 5;
  if (email.ambiguous) confidence -= 25;
  if (!email.subject && !email.bodyPreview) confidence -= 25;
  if (email.forceLowConfidence) confidence = Math.min(confidence, 65);

  return Math.max(0, Math.min(100, confidence));
}

export function createRealtimeDraft(email) {
  const name = email.from?.emailAddress?.name ?? 'Madame, Monsieur';
  return [
    `Bonjour ${name},`,
    '',
    'Merci pour votre message.',
    '',
    'Je reviens vers vous rapidement avec les éléments demandés. Je vérifie les informations nécessaires afin de vous répondre de manière précise.',
    '',
    'Bien cordialement,',
    'Jérémy Druelle'
  ].join('\n');
}

export function classifyRealtimeEmail(email, settings = DEFAULT_SETTINGS) {
  const scorePriorite = calculatePriorityScore(email, settings);
  const niveauConfiance = calculateConfidence(email, settings);
  const motsClesSensiblesDetectes = detectSensitiveKeywords(email, settings);
  const knownClient = isKnownClientDomain(email, settings);
  const newsletterOrAd = Boolean(email.isNewsletter || email.isAdvertisement);
  const automatic = Boolean(email.isAutomatic);
  const risks = [];

  if (motsClesSensiblesDetectes.length > 0) risks.push('Mot-clé sensible détecté');
  if (knownClient && scorePriorite < 20) risks.push('Domaine client connu protégé contre la quarantaine automatique');
  if (niveauConfiance < 80) risks.push('Confiance insuffisante');

  let categorie = 'À surveiller';
  let actionRecommandee = 'Déplacer vers À surveiller et journaliser';
  let dossierDestination = '04 - À surveiller';
  let brouillonNecessaire = false;
  let alerteTeamsNecessaire = false;
  let questionTeamsNecessaire = false;
  let questionTeams = '';

  if (motsClesSensiblesDetectes.length > 0) {
    categorie = 'Important - question à poser';
    actionRecommandee = 'Demander une validation commerciale sur Teams avant toute réponse';
    dossierDestination = '03 - Question posée Teams';
    alerteTeamsNecessaire = true;
    questionTeamsNecessaire = true;
    questionTeams = 'Un élément sensible a été détecté. Quelle posture commerciale souhaites-tu adopter avant validation du brouillon ?';
  } else if (niveauConfiance < 80) {
    categorie = 'À surveiller';
    actionRecommandee = 'Déplacer vers À surveiller, sans brouillon';
    dossierDestination = '04 - À surveiller';
  } else if (scorePriorite >= settings.SeuilPrioriteAlerteTempsReel) {
    categorie = 'Important - réponse nécessaire';
    actionRecommandee = 'Créer un brouillon, déplacer vers À traiter et alerter Teams';
    dossierDestination = '01 - À traiter';
    brouillonNecessaire = true;
    alerteTeamsNecessaire = true;
  } else if (scorePriorite >= 40) {
    categorie = email.ambiguous ? 'Important - question à poser' : 'À surveiller';
    actionRecommandee = email.ambiguous ? 'Demander une précision sur Teams' : 'Déplacer vers À surveiller';
    dossierDestination = email.ambiguous ? '03 - Question posée Teams' : '04 - À surveiller';
    alerteTeamsNecessaire = Boolean(email.ambiguous);
    questionTeamsNecessaire = Boolean(email.ambiguous);
    questionTeams = email.ambiguous ? 'Le message semble commercialement pertinent mais ambigu. Faut-il préparer une réponse ?' : '';
  } else if (scorePriorite >= 20) {
    categorie = 'Non important';
    actionRecommandee = 'Déplacer vers Non important';
    dossierDestination = '05 - Non important';
  } else if (!knownClient && niveauConfiance >= settings.SeuilConfianceQuarantaine && (newsletterOrAd || automatic || scorePriorite < 20)) {
    categorie = newsletterOrAd ? 'Newsletter / publicité' : 'Quarantaine suppression';
    actionRecommandee = 'Déplacer vers la quarantaine de suppression, sans suppression directe';
    dossierDestination = '06 - À supprimer - quarantaine';
  }

  return {
    mode: 'realtime',
    categorie,
    scorePriorite,
    niveauConfiance,
    raisonDecision: buildReason(email, scorePriorite, niveauConfiance, motsClesSensiblesDetectes, knownClient),
    actionRecommandee,
    dossierDestination,
    brouillonNecessaire,
    alerteTeamsNecessaire,
    questionTeamsNecessaire,
    resumeEmail: summarizeEmail(email),
    texteBrouillon: brouillonNecessaire ? createRealtimeDraft(email) : '',
    questionTeams,
    risquesDetectes: risks,
    motsClesSensiblesDetectes
  };
}

export function calculateAgeDays(email, now = new Date()) {
  if (typeof email.ageEmailJours === 'number') return email.ageEmailJours;
  const received = email.receivedDateTime ? new Date(email.receivedDateTime) : now;
  return Math.max(0, Math.floor((now.getTime() - received.getTime()) / 86400000));
}

export function calculateObsolescenceScore(email, settings = DEFAULT_SETTINGS, now = new Date()) {
  const age = calculateAgeDays(email, now);
  let score = 0;
  const sensitive = detectSensitiveKeywords(email, settings);

  if (age <= 7) score += 0;
  else if (age <= 30) score += 10;
  else if (age <= 90) score += 30;
  else if (age <= 180) score += 50;
  else score += 70;

  if (email.isNewsletter || email.isAdvertisement) score += 30;
  if (email.isAutomatic) score += 25;
  if (isKnownClientDomain(email, settings)) score -= 30;
  if (email.requiresResponse || email.quoteRequest || email.unansweredRequest) score -= 40;
  if (email.contractOrQuoteIssue || email.quoteRequest || sensitive.some((keyword) => ['contrat', 'litige', 'contentieux'].includes(normalizeText(keyword)))) score -= 50;

  return Math.max(0, Math.min(100, score));
}

export function createHistoricalDraft(email) {
  return [
    'Bonjour,',
    '',
    'Je reprends le fil de votre message resté en attente.',
    '',
    'Si le sujet est toujours d’actualité, je peux vous proposer un point rapide afin de remettre le dossier en mouvement.',
    '',
    'Bien cordialement,',
    'Jérémy Druelle'
  ].join('\n');
}

export function classifyHistoricalEmail(email, settings = DEFAULT_SETTINGS, now = new Date()) {
  const scorePriorite = calculatePriorityScore(email, settings);
  const scoreObsolescence = calculateObsolescenceScore(email, settings, now);
  const niveauConfiance = calculateConfidence(email, settings);
  const ageEmailJours = calculateAgeDays(email, now);
  const motsClesSensiblesDetectes = detectSensitiveKeywords(email, settings);
  const knownClient = isKnownClientDomain(email, settings);
  const oldNewsletterOrAd = Boolean((email.isNewsletter || email.isAdvertisement) && ageEmailJours > 30);
  const risks = [];

  if (motsClesSensiblesDetectes.length > 0) risks.push('Mot-clé sensible détecté');
  if (knownClient) risks.push('Domaine client connu protégé contre la quarantaine automatique');
  if (niveauConfiance < 80) risks.push('Confiance insuffisante');

  let categorie = 'Historique - À surveiller';
  let dossierDestination = 'Historique - À surveiller';
  let actionRecommandee = 'Inclure dans le rapport et laisser en surveillance';
  let brouillonNecessaire = false;
  let alerteTeamsImmediate = false;
  let questionPourJeremy = '';

  if (motsClesSensiblesDetectes.length > 0 || niveauConfiance < 80) {
    categorie = 'Historique - À surveiller';
    dossierDestination = 'Historique - À surveiller';
    actionRecommandee = 'Inclure dans le rapport groupé pour validation';
    questionPourJeremy = motsClesSensiblesDetectes.length > 0 ? 'Message sensible détecté dans l’historique. Faut-il le traiter commercialement ?' : '';
  } else if (scorePriorite >= 70 && ageEmailJours <= 30) {
    categorie = 'Historique - À traiter';
    dossierDestination = 'Historique - À traiter';
    actionRecommandee = 'Traiter en priorité et créer un brouillon si le paramètre l’autorise';
    brouillonNecessaire = Boolean(settings.CreationBrouillonsHistorique);
    alerteTeamsImmediate = Boolean(email.critical);
  } else if (scorePriorite >= 70 && ageEmailJours > 30) {
    categorie = 'Historique - Opportunité oubliée';
    dossierDestination = 'Historique - Opportunités oubliées';
    actionRecommandee = 'Inclure dans le rapport des opportunités oubliées';
    brouillonNecessaire = Boolean(settings.CreationBrouillonsHistorique && email.stillRelevant !== false);
  } else if (scorePriorite >= 40) {
    categorie = 'Historique - À surveiller';
    dossierDestination = 'Historique - À surveiller';
  } else if (!knownClient && niveauConfiance >= settings.SeuilConfianceQuarantaine && (oldNewsletterOrAd || scoreObsolescence >= 60)) {
    categorie = 'Historique - Quarantaine suppression';
    dossierDestination = 'Historique - Quarantaine suppression';
    actionRecommandee = 'Déplacer vers la quarantaine historique, sans suppression directe';
  } else if (scorePriorite < 20 && scoreObsolescence < 60) {
    categorie = 'Historique - Non important';
    dossierDestination = 'Historique - Non important';
    actionRecommandee = 'Déplacer vers Non important historique';
  } else {
    categorie = 'Historique - Nettoyé';
    dossierDestination = 'Historique - Nettoyé';
    actionRecommandee = 'Marquer comme nettoyé';
  }

  return {
    mode: 'historical_cleanup',
    categorie,
    scorePriorite,
    scoreObsolescence,
    niveauConfiance,
    raisonDecision: buildReason(email, scorePriorite, niveauConfiance, motsClesSensiblesDetectes, knownClient),
    actionRecommandee,
    dossierDestination,
    brouillonNecessaire,
    alerteTeamsImmediate,
    inclureRapportNettoyage: true,
    resumeEmail: summarizeEmail(email),
    texteBrouillon: brouillonNecessaire ? createHistoricalDraft(email) : '',
    questionPourJeremy,
    risquesDetectes: risks,
    motsClesSensiblesDetectes
  };
}

export function filterUnprocessedMessages(messages, existingMessageIds) {
  const existing = new Set(existingMessageIds);
  return messages.filter((message) => !existing.has(message.id ?? message.MessageId));
}

export function applyHistoricalBatch(messages, options = {}) {
  const settings = {
    ...DEFAULT_SETTINGS,
    CreationBrouillonsHistorique: Boolean(options.creationBrouillons),
    ModeSimulationHistorique: options.modeSimulation ?? true
  };
  const existingIds = options.existingMessageIds ?? [];
  const unprocessed = filterUnprocessedMessages(messages, existingIds);

  return unprocessed.map((email) => {
    const decision = classifyHistoricalEmail(email, settings, options.now ?? new Date());
    return {
      messageId: email.id,
      decision,
      operations: settings.ModeSimulationHistorique ? [] : buildHistoricalOperations(decision)
    };
  });
}

export function buildHistoricalOperations(decision) {
  const operations = [{ type: 'move', destination: decision.dossierDestination }];
  if (decision.brouillonNecessaire) operations.push({ type: 'createDraft' });
  return operations;
}

export function summarizeEmail(email) {
  const subject = email.subject || '(sans objet)';
  const preview = email.bodyPreview || email.body || '';
  return `${subject} - ${String(preview).slice(0, 220)}`.trim();
}

function buildReason(email, score, confidence, sensitiveKeywords, knownClient) {
  const parts = [`score ${score}`, `confiance ${confidence}`];
  if (knownClient) parts.push('domaine client/prospect connu');
  if (sensitiveKeywords.length > 0) parts.push(`mots sensibles: ${sensitiveKeywords.join(', ')}`);
  if (email.isNewsletter) parts.push('newsletter détectée');
  if (email.isAdvertisement) parts.push('publicité détectée');
  if (email.isAutomatic) parts.push('notification automatique détectée');
  if (email.quoteRequest) parts.push('demande de devis détectée');
  return parts.join('; ');
}

async function readFixture(path) {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  const fixturePath = process.argv[2];
  if (!fixturePath) {
    console.log('Usage: npm run simulate -- tests/fixtures/email-demande-devis.json');
    return;
  }

  const email = await readFixture(fixturePath);
  const realtime = classifyRealtimeEmail(email);
  const historical = classifyHistoricalEmail(email);
  console.log(JSON.stringify({ realtime, historical }, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
