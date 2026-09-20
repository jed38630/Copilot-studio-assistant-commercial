import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const forbiddenPermission = ['Mail', 'Send'].join('.');
const forbiddenOperation = ['send', 'Mail'].join('');
const forbiddenDraftOperation = ['send', 'Draft'].join('');

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else files.push(path);
  }
  return files;
}

test('aucun artefact du repo ne contient la permission Graph interdite en clair', async () => {
  const files = await listFiles('.');
  const offenders = [];
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    if (content.includes(forbiddenPermission)) offenders.push(file);
  }
  assert.deepEqual(offenders, []);
});

test('le connecteur Graph ne contient aucune opération d’envoi direct', async () => {
  const content = await readFile('graph/openapi/graph-outlook-assistant-commercial.yaml', 'utf8');
  assert.equal(content.includes(forbiddenOperation), false);
  assert.equal(content.includes(forbiddenDraftOperation), false);
  assert.equal(/operationId:\s*.*send/i.test(content), false);
});

test('les workflows Power Automate ne définissent aucune action d’envoi d’email', async () => {
  const files = (await listFiles('power-automate/flows')).filter((file) => file.endsWith('.md'));
  const forbiddenActionPattern = /(send\s+an\s+email|action\s+d.envoi\s+automatique|envoi\s+automatique\s+d.email)/i;
  const offenders = [];
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    if (forbiddenActionPattern.test(content) || content.includes(forbiddenOperation)) offenders.push(file);
  }
  assert.deepEqual(offenders, []);
});
