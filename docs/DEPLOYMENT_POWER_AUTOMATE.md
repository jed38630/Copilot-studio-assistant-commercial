# Déploiement Power Automate

## Pré-requis

- Connexion Outlook avec accès à la boîte de Jérémy.
- Connexion Teams pour poster les cartes.
- Connexion SharePoint ou Dataverse.
- Connecteur HTTP avec Azure AD ou connecteur personnalisé Graph si utilisé.
- Validation admin pour les permissions Graph nécessaires.

## Flows à créer

Créer les cinq flows documentés dans `power-automate/flows` :
- `AC-247-nouvel-email-entrant.md`
- `AC-rattrapage-emails-recents.md`
- `AC-nettoyage-historique.md`
- `AC-resume-hebdomadaire.md`
- `AC-quarantaine-expiration.md`

Des artefacts importables ou semi-importables sont également générés dans :

```text
power-platform/
```

Utiliser en priorité :
- `power-platform/custom-connectors/assistant-commercial-graph.yaml` pour importer le connecteur Graph.
- `power-platform/dataverse-workflows/*.create-workflow.json` pour créer les cloud flows via Dataverse Web API.
- `power-platform/import/deployment-settings.template.json` pour centraliser les placeholders tenant.

Voir `docs/POWER_PLATFORM_IMPORT.md`.

## Variables d'environnement Power Platform

Créer :
- `GRAPH_BASE_URL`
- `USER_ID_OR_UPN`
- `TEAMS_TARGET_USER_ID`
- `SHAREPOINT_SITE_ID`
- `SHAREPOINT_LIST_EMAIL_LOG`
- `SHAREPOINT_LIST_HISTORICAL_LOG`
- `DEFAULT_TIMEZONE`
- `MODE_SIMULATION_HISTORIQUE`

## Connexions

MVP :
- Outlook
- Teams
- SharePoint
- Copilot Studio

Production :
- Outlook ou Graph personnalisé
- Teams
- Dataverse
- Copilot Studio
- Azure Key Vault ou connexions gérées selon gouvernance

## Expressions communes

Idempotence :

```text
MessageId eq '@{variables('MessageId')}'
```

Détection de ligne existante :

```text
greater(length(body('Get_items')?['value']), 0)
```

Parsing JSON Copilot :

```text
json(outputs('Call_Copilot_Studio')?['body/result'])
```

Faible confiance :

```text
less(int(body('Parse_JSON')?['niveauConfiance']), 80)
```

Mots sensibles :

```text
greater(length(body('Parse_JSON')?['motsClesSensiblesDetectes']), 0)
```

## Garde-fous à dupliquer dans Power Automate

Même si Copilot Studio produit une décision, Power Automate doit vérifier :
- Si `niveauConfiance < 80`, destination forcée vers surveillance.
- Si `motsClesSensiblesDetectes` non vide, question Teams obligatoire.
- Si `DomaineExpediteur` appartient aux domaines clients connus, aucune quarantaine automatique.
- Si `modeSimulation = true`, aucun déplacement et aucun brouillon.
- Si un dossier n’existe pas, le créer avant déplacement ou arrêter proprement.

## Gestion des erreurs

Chaque branche critique doit utiliser `Scope Try`, `Scope Catch`, `Scope Finally`.

Dans `Catch` :
- Capturer le nom de l’action.
- Capturer le code HTTP si disponible.
- Capturer le message d’erreur.
- Écrire une ligne de log avec `Erreur`.
- Poster Teams uniquement si l’email est prioritaire ou bloqué.

## Déploiement progressif

1. Déployer les listes ou tables.
2. Déployer les dossiers Outlook.
3. Déployer le flow résumé hebdomadaire.
4. Déployer le flow quarantaine expiration en mode rapport seul.
5. Déployer le flow rattrapage récents.
6. Déployer le flow temps réel.
7. Déployer le nettoyage historique en simulation.
8. Activer la production historique seulement après revue des rapports.
