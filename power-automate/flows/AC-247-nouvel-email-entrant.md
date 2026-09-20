# Flow Power Automate - AC - 24/7 - Nouvel email entrant

Objectif : traiter chaque nouvel email Outlook entrant en temps réel.

Déclencheur :
- Outlook : `When a new email arrives (V3)`
- Dossier : Inbox
- Inclure les pièces jointes : non, sauf besoin métier.

Variables d'environnement :
- `GRAPH_BASE_URL`
- `USER_ID_OR_UPN`
- `TEAMS_TARGET_USER_ID`
- `SHAREPOINT_LIST_EMAIL_LOG` ou table Dataverse équivalente

Étapes détaillées :
1. Initialiser `MessageId`, `ConversationId`, `DateReception`, `Expediteur`, `Objet`.
2. Lire le message complet via Graph si le déclencheur ne fournit pas le corps ou le `webLink`.
3. Vérifier l'idempotence dans `AssistantCommercial_EmailLog`.
4. Si `MessageId` existe déjà, terminer avec statut `Ignoré`.
5. Appeler Copilot Studio avec le prompt `agent-realtime.md`.
6. Parser le JSON retourné.
7. Appliquer les garde-fous Power Automate.
8. Résoudre ou créer le dossier Outlook destination.
9. Créer un brouillon si `brouillonNecessaire = true`.
10. Déplacer l'email vers le dossier destination.
11. Poster une carte Teams si `alerteTeamsNecessaire = true` ou `questionTeamsNecessaire = true`.
12. Journaliser la décision complète.
13. En cas d'erreur, journaliser `Erreur` et poster Teams uniquement si l'erreur bloque un email prioritaire.

Expressions clés :

```text
MessageId = coalesce(triggerOutputs()?['body/id'], triggerOutputs()?['body/internetMessageId'])
```

```text
Idempotence SharePoint =
MessageId eq '@{variables('MessageId')}'
```

```text
Déjà traité =
greater(length(body('Get_items_EmailLog')?['value']), 0)
```

```text
JSON agent =
json(outputs('Appeler_Copilot_Studio')?['body/result'])
```

```text
Garde-fou faible confiance =
less(int(body('Parse_JSON_Agent')?['niveauConfiance']), 80)
```

```text
Garde-fou sensible =
greater(length(body('Parse_JSON_Agent')?['motsClesSensiblesDetectes']), 0)
```

```text
Dossier forcé si faible confiance =
if(less(int(body('Parse_JSON_Agent')?['niveauConfiance']), 80), '04 - À surveiller', body('Parse_JSON_Agent')?['dossierDestination'])
```

Pseudo-export :

```json
{
  "name": "AC - 24/7 - Nouvel email entrant",
  "trigger": {
    "type": "Outlook",
    "operation": "When a new email arrives (V3)",
    "folder": "Inbox"
  },
  "actions": [
    "Get message details",
    "Check AssistantCommercial_EmailLog by MessageId",
    "Call Copilot Studio realtime agent",
    "Parse JSON",
    "Apply guardrails",
    "Ensure destination folder",
    "Create reply draft when allowed",
    "Move message",
    "Post Teams adaptive card when needed",
    "Create log row"
  ],
  "forbiddenActions": [
    "direct email delivery",
    "direct deletion"
  ]
}
```

Journalisation minimale :
- `MessageId`
- `ConversationId`
- `Categorie`
- `ScorePriorite`
- `NiveauConfiance`
- `Decision`
- `RaisonDecision`
- `ActionEffectuee`
- `DossierDestination`
- `BrouillonCree`
- `TeamsAlerteEnvoyee`
- `DateTraitement`
- `Erreur`
