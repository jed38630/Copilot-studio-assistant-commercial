import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { applyHistoricalBatch } from './simulate-classification.ts';

const FIXTURE_PATHS = [
  'tests/fixtures/email-ancien-opportunite.json',
  'tests/fixtures/email-publicite.json',
  'tests/fixtures/email-notification-auto.json'
];

async function loadFixtures(paths = FIXTURE_PATHS) {
  return Promise.all(paths.map(async (path) => JSON.parse(await readFile(path, 'utf8'))));
}

export async function simulateHistoricalBatch(options = {}) {
  const messages = await loadFixtures(options.paths ?? FIXTURE_PATHS);
  return applyHistoricalBatch(messages, {
    modeSimulation: options.modeSimulation ?? true,
    creationBrouillons: options.creationBrouillons ?? false,
    existingMessageIds: options.existingMessageIds ?? []
  });
}

async function main() {
  const result = await simulateHistoricalBatch({ modeSimulation: true });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
