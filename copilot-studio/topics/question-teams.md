# Topic Copilot Studio - Question Teams

Objectif : demander une décision à Jérémy dans Teams quand l’agent ne doit pas décider seul.

Cas de déclenchement :
- Mot-clé sensible détecté.
- Ambiguïté commerciale.
- Niveau de confiance faible.
- Réponse nécessitant un arbitrage tarifaire, contractuel, juridique ou relationnel.
- Opportunité historique à vérifier.

Règles :
- La carte Teams ne doit jamais déclencher un envoi automatique.
- Les boutons servent à orienter le traitement, modifier le ton, classer ou demander une relance.
- Toute réponse Teams doit être journalisée.

Output attendu :

```json
{
  "teamsAlerteEnvoyee": true,
  "typeAlerte": "question_commerciale",
  "question": "",
  "options": [
    "Option A",
    "Option B",
    "Option C"
  ],
  "statutValidation": "En attente"
}
```
