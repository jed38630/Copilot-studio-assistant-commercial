# Topic Copilot Studio - Analyser Email

Objectif : transformer un email Outlook brut en contexte exploitable par l’agent.

Déclenchement recommandé :
- Appel depuis Power Automate après réception ou lecture Graph d’un message.

Inputs :
- MessageId
- ConversationId
- DateReception
- Expediteur
- DomaineExpediteur
- Objet
- BodyPreview
- Body
- HasAttachments
- LienEmail
- ModeTraitement : `realtime` ou `historical_cleanup`

Étapes :
1. Normaliser l’expéditeur et extraire le domaine.
2. Détecter newsletter, publicité, notification automatique, demande de réponse, urgence, devis, contrat, litige ou réclamation.
3. Détecter les mots-clés sensibles configurés.
4. Identifier si le domaine est dans `DomainesClientsConnus`.
5. Produire un résumé court en français.

Output :

```json
{
  "messageId": "",
  "conversationId": "",
  "domaineExpediteur": "",
  "resumeEmail": "",
  "signaux": {
    "clientOuProspectConnu": false,
    "demandeReponse": false,
    "impactCommercial": false,
    "urgence": false,
    "reclamationOuBlocage": false,
    "pieceJointeCommerciale": false,
    "newsletterOuPublicite": false,
    "emailAutomatique": false,
    "ambigu": false
  },
  "motsClesSensiblesDetectes": []
}
```
