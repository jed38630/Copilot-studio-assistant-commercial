# Topic Copilot Studio - Créer Brouillon

Objectif : préparer un brouillon Outlook lorsque l’agent recommande une réponse.

Règles :
- Ne jamais déclencher d’envoi.
- Ne créer un brouillon que si `brouillonNecessaire = true`.
- Ne pas créer de brouillon en mode simulation historique.
- Ne pas créer de brouillon pour un email sensible sans validation explicite.
- Le brouillon doit être en français professionnel, clair, direct et commercial.
- Le brouillon doit éviter tout engagement juridique, tarifaire ou contractuel ferme sans validation humaine.

Inputs :
- MessageId
- ConversationId
- Expediteur
- Objet
- RésuméEmail
- TexteBrouillon
- ModeTraitement
- ModeSimulationHistorique

Actions Graph possibles :
- `createReplyDraft` pour répondre dans le fil.
- `createMessageDraft` si un brouillon autonome est nécessaire.

Output :

```json
{
  "brouillonCree": false,
  "brouillonId": "",
  "lienBrouillon": "",
  "raison": ""
}
```
