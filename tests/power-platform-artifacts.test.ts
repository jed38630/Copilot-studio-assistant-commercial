import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function listJsonFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listJsonFiles(path));
    else if (entry.name.endsWith('.json')) files.push(path);
  }
  return files;
}

test('les artefacts Power Platform JSON sont parsables', async () => {
  const files = await listJsonFiles('power-platform');
  assert.ok(files.length >= 15);

  for (const file of files) {
    JSON.parse(await readFile(file, 'utf8'));
  }
});

test('chaque payload Dataverse contient un clientdata de cloud flow exploitable', async () => {
  const files = (await readdir('power-platform/dataverse-workflows')).filter((file) => file.endsWith('.json'));
  assert.equal(files.length, 5);

  for (const file of files) {
    const payload = JSON.parse(await readFile(join('power-platform/dataverse-workflows', file), 'utf8'));
    assert.equal(payload.category, 5);
    assert.equal(payload.type, 1);
    assert.equal(payload.primaryentity, 'none');
    assert.ok(payload.workflowid);

    const clientdata = JSON.parse(payload.clientdata);
    assert.ok(clientdata.properties.definition.triggers);
    assert.ok(clientdata.properties.definition.actions);
  }
});

test('les artefacts Power Platform ne contiennent pas d’opération d’envoi direct', async () => {
  const forbiddenOperation = ['send', 'Mail'].join('');
  const forbiddenDraftOperation = ['send', 'Draft'].join('');
  const forbiddenPermission = ['Mail', 'Send'].join('.');
  const files = await listJsonFiles('power-platform');
  const offenders = [];

  for (const file of files) {
    const content = await readFile(file, 'utf8');
    if (content.includes(forbiddenPermission) || content.includes(forbiddenOperation) || content.includes(forbiddenDraftOperation)) {
      offenders.push(file);
    }
  }

  assert.deepEqual(offenders, []);
});
