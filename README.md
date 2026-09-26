# Assistant Commercial

Projet complet pour créer dans Microsoft Copilot Studio une solution “Assistant Commercial” destinée à Jérémy Druelle, responsable commercial.

La solution organise la boîte Outlook, prépare des brouillons, alerte dans Teams quand une validation humaine est nécessaire et nettoie progressivement l’historique. Elle ne réalise jamais d’action irréversible : aucun email n’est envoyé automatiquement et aucun email n’est supprimé directement.

## Architecture

Composants :
- Microsoft Copilot Studio : deux agents, prompts et topics.
- Power Automate : orchestration temps réel, rattrapage, historique, résumé et quarantaine.
- Microsoft Graph : lecture Outlook, dossiers, déplacements et brouillons.
- Microsoft Teams : alertes et rapports via Adaptive Cards.
- Stockage : Dataverse en production, SharePoint List en MVP.

Agents :
- `Assistant Commercial - Temps réel` : traite chaque nouvel email entrant, classe, prépare un brouillon si nécessaire, déplace l’email, alerte Teams si besoin.
- `Assistant Commercial - Nettoyage Historique` : traite les emails existants par lots, en simulation par défaut, détecte les opportunités oubliées et produit des rapports groupés.

## Garde-fous

- Permission Graph d’envoi direct `Mail&#46;Send` interdite.
- Permission Graph autorisée : `Mail.ReadWrite`, `User.Read`, `offline_access` si nécessaire.
- Aucun bouton Teams ne déclenche d’envoi d’email.
- Les brouillons sont créés, puis validés manuellement par Jérémy.
- Les suppressions directes sont interdites.
- Les emails à supprimer sont déplacés vers un dossier de quarantaine.
- Les emails ambigus, sensibles ou à confiance faible vont en surveillance ou déclenchent une question Teams.
- Tout traitement est journalisé par `MessageId` pour éviter les doublons.

## Procédure MVP

1. Créer les listes SharePoint décrites dans `sharepoint/schema`.
2. Créer les dossiers Outlook listés dans `docs/OPERATING_MANUAL.md` ou lancer `npm run folders:dry-run` pour vérifier le plan.
3. Créer une application Entra ID avec les permissions Graph autorisées.
4. Copier les prompts depuis `copilot-studio/prompts` dans Copilot Studio.
5. Créer les topics depuis `copilot-studio/topics`.
6. Recréer les flows Power Automate depuis `power-automate/flows`.
7. Coller les Adaptive Cards depuis `teams/adaptive-cards`.
8. Démarrer le nettoyage historique en simulation.

## Procédure production

1. Remplacer les listes SharePoint par Dataverse.
2. Déployer les tables depuis `dataverse/schema`.
3. Restreindre l’application Graph à la boîte de Jérémy ou à une politique d’accès applicative adaptée.
4. Utiliser des connexions Power Platform gérées, jamais de secret en dur.
5. Activer la supervision des erreurs Power Automate.
6. Valider le passage du nettoyage historique en production avec un premier lot réduit.

## Déploiement

Documentation détaillée :
- [Cahier des charges](docs/CAHIER_DES_CHARGES.md)
- [Tableau de bord](dashboard/README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Déploiement Copilot Studio](docs/DEPLOYMENT_COPILOT_STUDIO.md)
- [Déploiement Power Automate](docs/DEPLOYMENT_POWER_AUTOMATE.md)
- [Configuration Microsoft Graph](docs/MICROSOFT_GRAPH_SETUP.md)
- [Import Power Platform](docs/POWER_PLATFORM_IMPORT.md)
- [Garde-fous sécurité](docs/SECURITY_GUARDRAILS.md)
- [Plan de test](docs/TEST_PLAN.md)
- [Manuel d’exploitation](docs/OPERATING_MANUAL.md)

Validations admin Microsoft nécessaires :
- Création ou validation de l’application Entra ID.
- Consentement admin pour `Mail.ReadWrite` si l’organisation l’exige.
- Connexions Power Automate Outlook, Teams, SharePoint ou Dataverse.
- Gouvernance DLP Power Platform si les connecteurs Graph/HTTP sont utilisés.

## Tests

```powershell
npm test
```

Scripts utiles :

```powershell
npm run simulate -- tests/fixtures/email-demande-devis.json
npm run historical:sample
npm run report:sample
npm run folders:dry-run
npm run generate:power-platform
```

Artefacts Power Platform générés :
- `power-platform/custom-connectors/assistant-commercial-graph.yaml`
- `power-platform/cloud-flows/*/workflow-definition.json`
- `power-platform/dataverse-workflows/*.create-workflow.json`
- `power-platform/import/create-cloud-flows.http`

## Hypothèses

- Jérémy utilise Outlook Online / Exchange Online.
- Les liens Outlook `webLink` sont disponibles via Graph quand le message est lu.
- Le MVP peut utiliser SharePoint Lists pour accélérer le déploiement.
- La production privilégie Dataverse pour les clés alternatives, la gouvernance et l’audit.
- Les artefacts Copilot Studio et Power Automate sont fournis comme prompts, topics, procédures et pseudo-exports, car un export importable dépend des IDs du tenant, connexions, environnements et solutions Power Platform.

## Limites connues

- Les exports Power Automate ne sont pas des packages importables sans tenant cible.
- La classification par règles sert de référence testable ; en production, Copilot Studio applique les prompts et Power Automate garde les garde-fous.
- Les brouillons doivent être relus par Jérémy avant toute utilisation.
- La suppression future d’éléments en quarantaine n’est pas activée par défaut et doit rester sous validation humaine.

Références Microsoft Learn utilisées :
- [List mailFolders](https://learn.microsoft.com/en-us/graph/api/user-list-mailfolders?view=graph-rest-1.0)
- [Create MailFolder](https://learn.microsoft.com/en-us/graph/api/user-post-mailfolders?view=graph-rest-1.0)
- [Create message draft](https://learn.microsoft.com/en-us/graph/api/user-post-messages?view=graph-rest-1.0)
- [Create reply draft](https://learn.microsoft.com/en-us/graph/api/message-createreply?view=graph-rest-1.0)
- [Move message](https://learn.microsoft.com/en-us/graph/api/message-move?view=graph-rest-1.0)
