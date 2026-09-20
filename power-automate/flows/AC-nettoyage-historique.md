# Flow Power Automate - AC - Nettoyage historique

Objectif : traiter progressivement les emails existants dans l'Inbox par lots, avec simulation par défaut.

Déclencheurs :
- Manuel depuis Teams ou Copilot Studio.
- Planifié, par exemple chaque soir hors heures ouvrées.

Paramètres :
- `periode`
- `tailleLot`
- `modeSimulation`
- `creationBrouillons`
- `alertesTeamsGroupees`

Valeurs par défaut :
- `modeSimulation = true`
- `tailleLot = 50`
- `creationBrouillons = false`
- `alertesTeamsGroupees = true`

Étapes détaillées :
1. Lire `AssistantCommercial_Settings`.
2. Initialiser `BatchId = guid()`.
3. Initialiser `NextLink` avec l'URL Graph Inbox.
4. Lister un lot d'emails avec `$top = tailleLot`.
5. Conserver `@odata.nextLink` si présent.
6. Exclure les `MessageId` déjà présents dans `AssistantCommercial_HistoricalCleanup` ou `AssistantCommercial_EmailLog`.
7. Appeler l'agent `agent-historical-cleanup.md` pour chaque email restant.
8. Parser le JSON de décision.
9. En mode simulation : ne rien déplacer, ne créer aucun brouillon, journaliser `Statut = Simulation`.
10. En mode production : déplacer selon `dossierDestination`.
11. En mode production : créer un brouillon seulement si `creationBrouillons = true` et `brouillonNecessaire = true`.
12. Ajouter les décisions importantes au rapport groupé.
13. Publier la carte Teams `rapport-nettoyage-historique.json`.
14. Si lancement manuel, demander si continuer avec le lot suivant.
15. Arrêter si limite quotidienne atteinte.

Pagination Graph :

```text
Do until:
empty(variables('NextLink')) is true
```

```text
NextLink =
body('HTTP_List_Inbox')?['@odata.nextLink']
```

Idempotence :

```text
or(
  greater(length(body('Get_items_EmailLog')?['value']), 0),
  greater(length(body('Get_items_HistoricalCleanup')?['value']), 0)
)
```

Mode simulation :

```text
equals(variables('modeSimulation'), true)
```

Création brouillon historique :

```text
and(
  equals(variables('modeSimulation'), false),
  equals(variables('creationBrouillons'), true),
  equals(body('Parse_JSON_Agent')?['brouillonNecessaire'], true)
)
```

Pseudo-export :

```json
{
  "name": "AC - Nettoyage historique",
  "trigger": {
    "manual": true,
    "recurrence": "optional"
  },
  "parameters": {
    "periode": "all",
    "tailleLot": 50,
    "modeSimulation": true,
    "creationBrouillons": false,
    "alertesTeamsGroupees": true
  },
  "actions": [
    "Read settings",
    "Initialize BatchId",
    "List inbox messages with pagination",
    "Skip logged MessageId",
    "Call historical cleanup agent",
    "Parse decision JSON",
    "Simulation branch: log only",
    "Production branch: move message",
    "Production branch: create draft only when allowed",
    "Build grouped Teams report",
    "Ask whether to continue next batch when manual"
  ],
  "safetyDefaults": {
    "modeSimulation": true,
    "creationBrouillons": false,
    "directDeletion": false
  }
}
```

Rapport Teams :
- Emails analysés.
- Emails importants.
- Opportunités oubliées.
- À surveiller.
- Non importants.
- Quarantaine.
- Top 10 à vérifier.
- Boutons : continuer, stopper, simulation, production, modifier règles.
