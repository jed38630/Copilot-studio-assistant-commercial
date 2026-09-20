# Flow Power Automate - AC - Quarantaine expiration

Objectif : surveiller les emails en quarantaine depuis plus de 30 jours et produire un rapport de revue humaine.

Déclencheur :
- Récurrence quotidienne.

Comportement par défaut :
- Ne pas supprimer automatiquement.
- Produire seulement un rapport Teams.
- Prévoir une option future de suppression validée humainement, désactivée par défaut.

Paramètres :
- `DelaiSuppressionQuarantaineJours = 30`
- `SuppressionAutomatiqueActive = false`

Étapes détaillées :
1. Lire les logs `AssistantCommercial_EmailLog` et `AssistantCommercial_HistoricalCleanup`.
2. Filtrer les lignes dont le dossier destination est une quarantaine.
3. Filtrer les lignes plus anciennes que `DelaiSuppressionQuarantaineJours`.
4. Générer un rapport Teams avec liens Outlook.
5. Demander une revue humaine.
6. Journaliser que le rapport a été produit.
7. Ne déclencher aucune suppression tant que l'option future n'est pas activée et validée par un humain.

Expression de seuil :

```text
formatDateTime(addDays(utcNow(), mul(-1, variables('DelaiSuppressionQuarantaineJours'))), 'yyyy-MM-ddTHH:mm:ssZ')
```

Pseudo-export :

```json
{
  "name": "AC - Quarantaine expiration",
  "trigger": {
    "type": "Recurrence",
    "frequency": "Day",
    "interval": 1
  },
  "actions": [
    "Read quarantine logs",
    "Filter older than configured delay",
    "Build human review report",
    "Post Teams report",
    "Log report generation"
  ],
  "defaults": {
    "directDeletion": false,
    "futureDeletionRequiresHumanApproval": true
  }
}
```

Contrôles :
- Les dossiers de quarantaine restent des dossiers Outlook ordinaires.
- La revue humaine décide quoi faire après analyse.
- Tout changement futur vers une suppression effective doit passer par validation admin et métier.
