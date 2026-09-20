# Import Power Platform

## Artefacts générés

Le dossier `power-platform` contient les artefacts dérivés des workflows Markdown :

- `power-platform/custom-connectors/assistant-commercial-graph.yaml` : connecteur personnalisé Graph importable.
- `power-platform/cloud-flows/*/workflow-definition.json` : définitions Power Automate au format workflow definition.
- `power-platform/cloud-flows/*/clientdata.json` : clientdata de cloud flow.
- `power-platform/dataverse-workflows/*.create-workflow.json` : payloads Web API Dataverse pour créer les flows.
- `power-platform/solution-workflows/Workflows/*.json` : fichiers utilisables comme base de solution source.
- `power-platform/import/create-cloud-flows.http` : requêtes HTTP à adapter au tenant.
- `power-platform/import/deployment-settings.template.json` : modèle de paramètres d’environnement et de connexions.

## Ce qui est réellement importable sans tenant

Le connecteur Graph OpenAPI est importable comme connecteur personnalisé depuis Power Apps ou Power Automate.

Les payloads `dataverse-workflows/*.create-workflow.json` sont conçus pour être postés sur l’endpoint Dataverse :

```http
POST {DATAVERSE_ORG_URL}/api/data/v9.2/workflows
```

Ils restent volontairement paramétrés avec placeholders :
- `{USER_ID_OR_UPN}`
- `{TENANT_ID}`
- `{CLIENT_ID}`
- `{CLIENT_SECRET}`
- `{COPILOT_REALTIME_ENDPOINT}`
- `{COPILOT_HISTORICAL_ENDPOINT}`
- `{TEAMS_WEBHOOK_URL}`
- `{ENVIRONMENT_NAME}`

## Pourquoi je n’ai pas généré un faux ZIP solution complet

Un ZIP solution Power Platform fiable dépend d’un environnement réel :
- solution publisher,
- solution unique name,
- connection references,
- environnement Dataverse,
- composants déjà créés,
- IDs générés par Power Platform,
- état exact du designer cloud-flow.

Microsoft recommande les solutions pour l’ALM Power Platform, et le CLI `pac solution pack/import` est la voie correcte pour packager une solution. Sans environnement cible ni `pac` disponible localement, générer un ZIP solution “à la main” serait fragile.

## Procédure recommandée

1. Créer les tables Dataverse depuis `dataverse/schema`.
2. Importer le connecteur personnalisé depuis `power-platform/custom-connectors/assistant-commercial-graph.yaml`.
3. Créer les endpoints Copilot Studio ou remplacer les actions HTTP Copilot par les actions natives Power Automate/Copilot Studio.
4. Remplacer les placeholders dans `power-platform/import/deployment-settings.template.json`.
5. Créer les flows via les payloads `power-platform/dataverse-workflows`.
6. Ouvrir chaque flow dans Power Automate.
7. Relier les connexions Outlook, HTTP/Graph, Teams et Dataverse.
8. Vérifier les paramètres.
9. Laisser les flows désactivés tant que les tests de connexion ne sont pas terminés.
10. Activer d’abord `AC - Résumé hebdomadaire commercial`, puis le rattrapage, puis le temps réel, puis l’historique en simulation.

## Commandes locales

```powershell
npm run generate:power-platform
npm test
```

## Notes de sécurité

- Les artefacts ne contiennent aucune action d’envoi direct d’email.
- Les brouillons sont créés via Graph, puis validés manuellement dans Outlook.
- La suppression directe n’est pas modélisée.
- Le nettoyage historique reste en simulation par défaut.

## Références Microsoft

- [Export and import a non-solution flow](https://learn.microsoft.com/en-us/power-automate/export-import-flow-non-solution) : Microsoft indique que les packages `.zip` hors-solution sont une voie legacy et recommande Dataverse + solutions pour l’ALM.
- [Solution concepts](https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm) : les solutions sont le mécanisme ALM pour Power Apps et Power Automate.
- [pac solution](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/solution) : commandes `pack`, `import`, `export`, `unpack` et `create-settings`.
- [Work with cloud flows using code](https://learn.microsoft.com/en-us/power-automate/manage-flows-with-code) : gestion des cloud flows inclus dans des solutions via Dataverse.
- [workflow EntityType](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/workflow) : entité Dataverse utilisée par les payloads `workflows`.
