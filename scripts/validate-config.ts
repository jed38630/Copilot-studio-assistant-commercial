import { fileURLToPath } from 'node:url';

const REQUIRED_ENV = [
  'TENANT_ID',
  'CLIENT_ID',
  'GRAPH_BASE_URL',
  'USER_ID_OR_UPN',
  'TEAMS_TARGET_USER_ID',
  'DEFAULT_TIMEZONE',
  'MODE_SIMULATION_HISTORIQUE'
];

export function validateConfig(env = process.env) {
  const missing = REQUIRED_ENV.filter((key) => !env[key]);
  const forbiddenPermission = ['Mail', 'Send'].join('.');
  const configuredPermissions = [
    env.GRAPH_SCOPES,
    env.AZURE_APP_PERMISSIONS,
    env.MICROSOFT_GRAPH_PERMISSIONS
  ].filter(Boolean).join(' ');

  const errors = [];
  if (missing.length > 0) errors.push(`Variables manquantes: ${missing.join(', ')}`);
  if (configuredPermissions.includes(forbiddenPermission)) {
    errors.push('Une permission Graph d’envoi direct est configurée alors qu’elle est interdite.');
  }
  if (env.MODE_SIMULATION_HISTORIQUE && !['true', 'false'].includes(env.MODE_SIMULATION_HISTORIQUE)) {
    errors.push('MODE_SIMULATION_HISTORIQUE doit valoir true ou false.');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings: env.CLIENT_SECRET ? ['CLIENT_SECRET doit être stocké dans un coffre ou une connexion sécurisée, jamais commité.'] : []
  };
}

function main() {
  const result = validateConfig();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
