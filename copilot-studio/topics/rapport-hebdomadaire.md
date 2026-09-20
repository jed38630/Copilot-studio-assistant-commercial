# Topic Copilot Studio - Rapport Hebdomadaire

Objectif : produire chaque lundi à 08h00 Europe/Paris une synthèse commerciale claire pour Jérémy.

Sources :
- `AssistantCommercial_EmailLog`
- `AssistantCommercial_HistoricalCleanup`

Période :
- Sept derniers jours calendaires.

Synthèse attendue :
- Emails analysés.
- Emails importants.
- Brouillons créés.
- Questions Teams posées.
- Emails non importants.
- Emails en quarantaine.
- Opportunités détectées.
- Risques ou urgences.
- Emails en attente de validation.

Format :
- Message Teams court.
- Liste priorisée des éléments à traiter.
- Liens Outlook quand disponibles.

Output :

```json
{
  "periode": "",
  "emailsAnalyses": 0,
  "emailsImportants": 0,
  "brouillonsCrees": 0,
  "questionsTeamsPosees": 0,
  "emailsNonImportants": 0,
  "emailsQuarantaine": 0,
  "opportunitesDetectees": [],
  "risquesUrgences": [],
  "emailsEnAttente": []
}
```
