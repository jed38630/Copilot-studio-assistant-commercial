# Topic Copilot Studio - Nettoyage Historique

Objectif : piloter le traitement par lots des emails déjà présents dans l’Inbox.

Paramètres :
- `periode`
- `tailleLot`
- `modeSimulation`
- `creationBrouillons`
- `alertesTeamsGroupees`
- `batchId`

Règles :
- Démarrer en simulation par défaut.
- Exclure tout MessageId déjà présent dans les logs.
- Utiliser la pagination Graph via `@odata.nextLink`.
- En simulation, produire seulement un rapport.
- En production, déplacer et créer des brouillons uniquement si les paramètres l’autorisent.
- Ne jamais supprimer directement.
- Demander si continuer avec le lot suivant quand le lancement est manuel.

Output :

```json
{
  "batchId": "",
  "modeSimulation": true,
  "emailsAnalyses": 0,
  "emailsIgnorésCarDéjàTraités": 0,
  "emailsDéplacés": 0,
  "brouillonsCréés": 0,
  "rapportTeams": {},
  "nextLink": "",
  "continuerProchainLot": false
}
```
