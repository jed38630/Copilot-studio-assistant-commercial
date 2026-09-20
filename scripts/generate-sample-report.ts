import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { classifyHistoricalEmail } from './simulate-classification.ts';

const SAMPLE_FIXTURES = [
  'tests/fixtures/email-ancien-opportunite.json',
  'tests/fixtures/email-publicite.json',
  'tests/fixtures/email-litige.json',
  'tests/fixtures/email-notification-auto.json'
];

export async function generateSampleReport(paths = SAMPLE_FIXTURES) {
  const emails = await Promise.all(paths.map(async (path) => JSON.parse(await readFile(path, 'utf8'))));
  const decisions = emails.map((email) => ({ email, decision: classifyHistoricalEmail(email) }));

  return {
    titre: 'Rapport nettoyage historique - exemple',
    emailsAnalyses: decisions.length,
    emailsImportants: decisions.filter(({ decision }) => decision.scorePriorite >= 70).length,
    opportunitesOubliees: decisions.filter(({ decision }) => decision.categorie === 'Historique - Opportunité oubliée').length,
    aSurveiller: decisions.filter(({ decision }) => decision.dossierDestination === 'Historique - À surveiller').length,
    nonImportants: decisions.filter(({ decision }) => decision.dossierDestination === 'Historique - Non important').length,
    quarantaine: decisions.filter(({ decision }) => decision.dossierDestination === 'Historique - Quarantaine suppression').length,
    top10AVerifier: decisions
      .filter(({ decision }) => decision.inclureRapportNettoyage)
      .sort((a, b) => b.decision.scorePriorite - a.decision.scorePriorite)
      .slice(0, 10)
      .map(({ email, decision }) => ({
        expediteur: email.from?.emailAddress?.address,
        objet: email.subject,
        categorie: decision.categorie,
        raison: decision.raisonDecision
      }))
  };
}

async function main() {
  console.log(JSON.stringify(await generateSampleReport(), null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
