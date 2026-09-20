# Manuel d'exploitation

## Démarrage quotidien

Jérémy doit surveiller principalement :
- Teams pour les emails importants et questions commerciales.
- Outlook dossier `01 - À traiter`.
- Outlook dossier `03 - Question posée Teams`.
- Outlook dossier `04 - À surveiller`.
- Brouillons Outlook créés par l’assistant.

## Dossiers Outlook

Créer l’arborescence :

```text
Assistant Commercial
├── 01 - À traiter
├── 02 - Brouillons créés
├── 03 - Question posée Teams
├── 04 - À surveiller
├── 05 - Non important
├── 06 - À supprimer - quarantaine
├── 99 - Traité
├── Historique - À traiter
├── Historique - Opportunités oubliées
├── Historique - À surveiller
├── Historique - Non important
├── Historique - Quarantaine suppression
└── Historique - Nettoyé
```

## Routine temps réel

Quand une carte Teams arrive :
1. Lire le résumé.
2. Ouvrir l’email si nécessaire.
3. Ouvrir le brouillon si disponible.
4. Modifier le brouillon dans Outlook.
5. Envoyer manuellement depuis Outlook uniquement après validation personnelle.
6. Marquer ou déplacer l’email vers `99 - Traité` si terminé.

## Routine historique

Début de projet :
- Garder `ModeSimulationHistorique = true`.
- Traiter des lots de 50.
- Lire les rapports Teams.
- Ajuster `DomainesClientsConnus` et `MotsClesSensibles`.

Passage production :
- Commencer par un lot de 10 ou 20.
- Garder `CreationBrouillonsHistorique = false` au premier passage.
- Vérifier les dossiers après chaque lot.
- Augmenter progressivement la taille de lot.

## Quarantaine

Les dossiers de quarantaine ne sont pas des corbeilles automatiques. Ils servent à isoler les messages à faible valeur probable.

Revue recommandée :
- Hebdomadaire au début.
- Mensuelle une fois les règles stabilisées.
- Ne pas vider sans contrôle humain.

## Réglages

Paramètres principaux :
- `ModeSimulationHistorique`
- `TailleLotHistorique`
- `NombreMaxEmailsHistoriqueParJour`
- `NombreMaxAlertesTeamsParRapport`
- `CreationBrouillonsHistorique`
- `SeuilPrioriteAlerteTempsReel`
- `SeuilConfianceQuarantaine`
- `DelaiSuppressionQuarantaineJours`
- `DomainesClientsConnus`
- `MotsClesSensibles`

## Incidents

Flow en erreur :
1. Lire le run Power Automate.
2. Identifier le `MessageId`.
3. Vérifier si une ligne de log existe.
4. Vérifier où se trouve l’email.
5. Corriger la connexion ou le dossier.
6. Relancer seulement si le `MessageId` n’a pas déjà été traité.

Trop d’alertes Teams :
- Augmenter `SeuilPrioriteAlerteTempsReel`.
- Réduire `NombreMaxAlertesTeamsParRapport`.
- Ajouter les domaines newsletters aux règles de non importance.

Emails clients en quarantaine :
- Ajouter le domaine dans `DomainesClientsConnus`.
- Relancer uniquement en simulation pour vérifier.
- Corriger les décisions futures.
