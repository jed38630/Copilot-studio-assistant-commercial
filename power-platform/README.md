# Artefacts Power Platform importables

Ce dossier contient les artefacts générés depuis les workflows Markdown.

## Ce qui est importable maintenant

- `custom-connectors/assistant-commercial-graph.yaml` : OpenAPI importable comme connecteur personnalisé.
- `dataverse-workflows/*.create-workflow.json` : payloads Dataverse Web API pour créer les cloud flows.
- `solution-workflows/Workflows/*.json` : fichiers `clientdata` utilisables dans une solution source Power Platform.
- `import/create-cloud-flows.http` : requêtes prêtes à adapter pour poster les payloads dans Dataverse.

## Ce qui reste tenant-spécifique

- Connection references Outlook/Teams.
- URL Dataverse réelle.
- Endpoints Copilot Studio publiés.
- Connexion Teams cible ou webhook.
- Consentement admin et politiques DLP.

## Flows générés

- AC - 24/7 - Nouvel email entrant : `433dfb86-0bc6-472a-932a-bc9ef329e50f`
- AC - Rattrapage emails récents : `bda7800f-820d-43f2-b80b-3917a56e5fbe`
- AC - Nettoyage historique : `550702f3-a959-4123-8be6-82fe6ba32921`
- AC - Résumé hebdomadaire commercial : `386ce0b4-4c36-423b-af2b-caf2996be562`
- AC - Quarantaine expiration : `e49d6efe-13a1-4277-8deb-8bdbe506272a`

## Commandes utiles

```powershell
npm run generate:power-platform
npm test
```

Avec PAC CLI, la voie recommandée est de créer une solution vide dans l'environnement cible, d'y ajouter ces flows après import Dataverse ou reconstruction assistée, puis de l'exporter comme solution gérée/non gérée.
