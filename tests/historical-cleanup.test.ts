import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  applyHistoricalBatch,
  classifyHistoricalEmail,
  filterUnprocessedMessages
} from '../scripts/simulate-classification.ts';

async function fixture(name) {
  return JSON.parse(await readFile(`tests/fixtures/${name}.json`, 'utf8'));
}

test('une publicité ancienne est classée en quarantaine historique', async () => {
  const email = await fixture('email-publicite');
  const decision = classifyHistoricalEmail(email);
  assert.equal(decision.dossierDestination, 'Historique - Quarantaine suppression');
});

test('le mode simulation historique ne déplace aucun email', async () => {
  const messages = [
    await fixture('email-publicite'),
    await fixture('email-ancien-opportunite')
  ];
  const result = applyHistoricalBatch(messages, { modeSimulation: true, creationBrouillons: true });
  assert.equal(result.length, 2);
  assert.deepEqual(result.flatMap((item) => item.operations), []);
});

test('un MessageId déjà journalisé n’est pas retraité', async () => {
  const messages = [
    await fixture('email-publicite'),
    await fixture('email-ancien-opportunite')
  ];
  const unprocessed = filterUnprocessedMessages(messages, ['msg-publicite-ancienne-001']);
  assert.equal(unprocessed.length, 1);
  assert.equal(unprocessed[0].id, 'msg-ancien-opportunite-001');
});

test('une ancienne opportunité client est remontée comme opportunité oubliée', async () => {
  const email = await fixture('email-ancien-opportunite');
  const decision = classifyHistoricalEmail(email, { CreationBrouillonsHistorique: true, DomainesClientsConnus: ['fabrikam.fr'], MotsClesSensibles: [] });
  assert.equal(decision.dossierDestination, 'Historique - Opportunités oubliées');
  assert.equal(decision.brouillonNecessaire, true);
});
