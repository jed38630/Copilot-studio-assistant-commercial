# Flow Power Automate - AC - Rattrapage emails récents

Objectif : récupérer les emails arrivés dans les dernières 24h ou 48h qui auraient échappé au flow temps réel.

Déclencheur :
- Récurrence : toutes les 2 heures.

Paramètres :
- `FenetreHeures` : 24 par défaut, 48 si incidents récents.
- `TailleLot` : 50.

Étapes détaillées :
1. Calculer `DateDepuis = utcNow() - FenetreHeures`.
2. Lister les emails Inbox via Graph avec filtre `receivedDateTime ge DateDepuis`.
3. Pour chaque email, vérifier `MessageId` dans `AssistantCommercial_EmailLog`.
4. Ignorer les emails déjà journalisés.
5. Appeler le même agent que le temps réel.
6. Appliquer les mêmes garde-fous.
7. Créer un brouillon si autorisé.
8. Déplacer l'email.
9. Journaliser.

Expression de date :

```text
formatDateTime(addHours(utcNow(), mul(-1, variables('FenetreHeures'))), 'yyyy-MM-ddTHH:mm:ssZ')
```

Filtre Graph :

```text
receivedDateTime ge @{variables('DateDepuis')}
```

Pseudo-export :

```json
{
  "name": "AC - Rattrapage emails récents",
  "trigger": {
    "type": "Recurrence",
    "frequency": "Hour",
    "interval": 2
  },
  "actions": [
    "Compute DateDepuis",
    "List inbox messages from Graph",
    "Filter already logged MessageId",
    "Call realtime agent",
    "Apply realtime guardrails",
    "Create draft when allowed",
    "Move message",
    "Log decision"
  ],
  "idempotency": "MessageId must not exist in AssistantCommercial_EmailLog"
}
```

Notes :
- Ce flow doit partager les mêmes fonctions de résolution de dossiers que le flow 24/7.
- Les erreurs doivent être journalisées avec le détail Graph ou connecteur.
- Les alertes Teams suivent les mêmes seuils que le mode temps réel.
