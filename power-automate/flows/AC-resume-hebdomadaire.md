# Flow Power Automate - AC - Résumé hebdomadaire commercial

Objectif : publier chaque lundi matin une synthèse commerciale des sept derniers jours.

Déclencheur :
- Récurrence hebdomadaire.
- Jour : lundi.
- Heure : 08h00.
- Fuseau : Europe/Paris.

Étapes détaillées :
1. Calculer la période des sept derniers jours.
2. Lire `AssistantCommercial_EmailLog`.
3. Lire `AssistantCommercial_HistoricalCleanup`.
4. Agréger les compteurs.
5. Extraire les opportunités et risques prioritaires.
6. Générer une synthèse en français avec Copilot Studio ou directement par expressions.
7. Publier la carte Teams `resume-hebdomadaire.json`.

Expressions utiles :

```text
DateDebut = formatDateTime(addDays(utcNow(), -7), 'yyyy-MM-ddTHH:mm:ssZ')
```

```text
EmailsImportants =
length(filter(body('Rows_EmailLog'), item()?['ScorePriorite'] >= 70))
```

```text
BrouillonsCrees =
length(filter(body('Rows_EmailLog'), equals(item()?['BrouillonCree'], true)))
```

Pseudo-export :

```json
{
  "name": "AC - Résumé hebdomadaire commercial",
  "trigger": {
    "type": "Recurrence",
    "frequency": "Week",
    "day": "Monday",
    "time": "08:00",
    "timeZone": "Europe/Paris"
  },
  "actions": [
    "Read last 7 days EmailLog",
    "Read last 7 days HistoricalCleanup",
    "Aggregate metrics",
    "Build weekly summary",
    "Post Teams adaptive card"
  ]
}
```

Synthèse à afficher :
- Emails analysés.
- Emails importants.
- Brouillons créés.
- Questions Teams posées.
- Emails non importants.
- Emails en quarantaine.
- Opportunités détectées.
- Risques ou urgences.
- Emails en attente.
