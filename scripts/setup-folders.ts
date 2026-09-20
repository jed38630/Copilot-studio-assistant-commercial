import { fileURLToPath } from 'node:url';

export const REQUIRED_FOLDER_TREE = {
  'Assistant Commercial': [
    '01 - À traiter',
    '02 - Brouillons créés',
    '03 - Question posée Teams',
    '04 - À surveiller',
    '05 - Non important',
    '06 - À supprimer - quarantaine',
    '99 - Traité',
    'Historique - À traiter',
    'Historique - Opportunités oubliées',
    'Historique - À surveiller',
    'Historique - Non important',
    'Historique - Quarantaine suppression',
    'Historique - Nettoyé'
  ]
};

export function buildFolderPlan(existingFolders = []) {
  const existingByName = new Set(existingFolders.map((folder) => folder.displayName));
  const rootName = Object.keys(REQUIRED_FOLDER_TREE)[0];
  const actions = [];

  if (!existingByName.has(rootName)) {
    actions.push({ type: 'createRootFolder', displayName: rootName });
  }

  for (const child of REQUIRED_FOLDER_TREE[rootName]) {
    actions.push({ type: 'ensureChildFolder', parentDisplayName: rootName, displayName: child });
  }

  return actions;
}

export async function setupFolders({ env = process.env, dryRun = true, token = '' } = {}) {
  const graphBaseUrl = env.GRAPH_BASE_URL ?? 'https://graph.microsoft.com/v1.0';
  const userId = env.USER_ID_OR_UPN ?? '{USER_ID_OR_UPN}';
  const plan = buildFolderPlan();

  if (dryRun) {
    return {
      dryRun: true,
      graphBaseUrl,
      userId,
      actions: plan
    };
  }

  if (!token) throw new Error('Un jeton Graph valide est requis lorsque dryRun=false.');

  return {
    dryRun: false,
    graphBaseUrl,
    userId,
    actions: plan,
    note: 'Implémentation volontairement prudente: valider les IDs de dossiers existants avant création réelle.'
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--execute');
  const result = await setupFolders({ dryRun });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
