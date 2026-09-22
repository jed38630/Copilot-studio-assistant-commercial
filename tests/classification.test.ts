import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  classifyRealtimeEmail,
  classifyHistoricalEmail,
  detectProduct,
  DEFAULT_SETTINGS
} from '../scripts/simulate-classification.ts';

async function fixture(name) {
  return JSON.parse(await readFile(`tests/fixtures/${name}.json`, 'utf8'));
}

test('une newsletter est classée non importante ou quarantaine', async () => {
  const email = await fixture('email-newsletter');
  const decision = classifyRealtimeEmail(email);
  assert.ok(['Newsletter / publicité', 'Non important', 'Quarantaine suppression'].includes(decision.categorie));
  assert.notEqual(decision.dossierDestination, '01 - À traiter');
});

test('une demande de devis client crée un brouillon et alerte Teams', async () => {
  const email = await fixture('email-demande-devis');
  const decision = classifyRealtimeEmail(email);
  assert.equal(decision.brouillonNecessaire, true);
  assert.equal(decision.alerteTeamsNecessaire, true);
  assert.equal(decision.dossierDestination, '01 - À traiter');
  assert.ok(decision.scorePriorite >= DEFAULT_SETTINGS.SeuilPrioriteAlerteTempsReel);
});

test('un litige demande validation et ne produit pas de réponse définitive', async () => {
  const email = await fixture('email-litige');
  const decision = classifyRealtimeEmail(email);
  assert.equal(decision.questionTeamsNecessaire, true);
  assert.equal(decision.alerteTeamsNecessaire, true);
  assert.equal(decision.brouillonNecessaire, false);
  assert.equal(decision.dossierDestination, '03 - Question posée Teams');
});

test('un domaine client connu ne part jamais en quarantaine automatiquement', async () => {
  const email = {
    ...(await fixture('email-important-client')),
    subject: 'Message sans action',
    bodyPreview: 'FYI',
    requiresResponse: false,
    commercialImpact: false,
    urgent: false,
    hasAttachments: false
  };
  const realtime = classifyRealtimeEmail(email);
  const historical = classifyHistoricalEmail({ ...email, ageEmailJours: 220 });
  assert.notEqual(realtime.dossierDestination, '06 - À supprimer - quarantaine');
  assert.notEqual(historical.dossierDestination, 'Historique - Quarantaine suppression');
});

test('un email avec confiance inférieure à 80 va en surveillance', async () => {
  const email = {
    id: 'msg-low-confidence',
    from: { emailAddress: { address: 'inconnu@example.com' } },
    subject: 'Question vague',
    bodyPreview: 'Pouvez-vous regarder ?',
    ambiguous: true,
    forceLowConfidence: true
  };
  const decision = classifyRealtimeEmail(email);
  assert.equal(decision.dossierDestination, '04 - À surveiller');
  assert.ok(decision.niveauConfiance < 80);
});

test('les alias CFN et CF sont reconnus comme le produit CFN', () => {
  const cfn = detectProduct({ subject: 'Demande Business Planner', bodyPreview: 'Besoin de CFN' });
  assert.equal(cfn.product, 'CFN');
  assert.ok(cfn.aliases.includes('business planner'));
  assert.ok(cfn.aliases.includes('cfn'));

  const cf = detectProduct({ subject: 'Mise en place du CF', bodyPreview: 'Pouvez-vous présenter le produit ?' });
  assert.equal(cf.product, 'CFN');
  assert.equal(cf.confidence, 75);
});

test('une demande urgente CFN déclenche le chemin brouillon et Teams', () => {
  const decision = classifyRealtimeEmail({
    id: 'msg-cfn-urgent',
    from: { emailAddress: { name: 'Client Test', address: 'contact@client-alpha.fr' } },
    subject: 'Devis urgent CFN / Business Planner',
    bodyPreview: 'Pouvez-vous envoyer avant vendredi un devis pour la mise en place du CF ?',
    body: 'Le budget est ouvert et nous devons valider rapidement le planning, les prérequis et le cadrage CFN Business Planner.',
    quoteRequest: true,
    requiresResponse: true,
    commercialImpact: true,
    urgent: true,
    hasAttachments: true
  });

  assert.equal(decision.produitIdentifie, 'CFN');
  assert.ok(decision.aliasDetectes.includes('cf'));
  assert.ok(decision.aliasDetectes.includes('business planner'));
  assert.equal(decision.brouillonNecessaire, true);
  assert.equal(decision.alerteTeamsNecessaire, true);
  assert.equal(decision.dossierDestination, '01 - À traiter');
  assert.ok(decision.scorePriorite >= DEFAULT_SETTINGS.SeuilPrioriteAlerteTempsReel);
});
