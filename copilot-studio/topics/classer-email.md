# Topic Copilot Studio - Classer Email

Objectif : appliquer les règles de classification et produire une décision prudente.

Inputs :
- Résultat du topic `analyser-email`
- ScorePriorite calculé
- NiveauConfiance calculé
- ModeTraitement
- AgeEmailJours si historique
- ScoreObsolescence si historique

Règles :
- En temps réel, utiliser les catégories du prompt `agent-realtime.md`.
- En historique, utiliser les catégories du prompt `agent-historical-cleanup.md`.
- Si niveauConfiance < 80, classer en surveillance.
- Si mot-clé sensible détecté, demander une validation Teams.
- Si domaine client connu, exclure toute quarantaine automatique.
- Toute décision doit contenir une raison lisible par Jérémy.

Output :

```json
{
  "categorie": "",
  "scorePriorite": 0,
  "scoreObsolescence": 0,
  "niveauConfiance": 0,
  "decision": "",
  "raisonDecision": "",
  "dossierDestination": "",
  "validationHumaineNecessaire": false
}
```
