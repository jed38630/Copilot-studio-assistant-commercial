# SharePoint List - AssistantCommercial_Settings

Liste MVP des paramètres configurables.

| Colonne | Type SharePoint recommandé | Notes |
|---|---|---|
| Key | Une ligne de texte | Clé unique logique. |
| Value | Plusieurs lignes de texte | Valeur brute, JSON autorisé. |
| Description | Plusieurs lignes de texte | Explication fonctionnelle. |

Paramètres à créer :

| Key | Valeur par défaut | Description |
|---|---:|---|
| ModeSimulationHistorique | true | Le nettoyage historique démarre sans déplacement. |
| TailleLotHistorique | 50 | Taille de lot MVP. |
| NombreMaxEmailsHistoriqueParJour | 500 | Limite de sécurité quotidienne. |
| NombreMaxAlertesTeamsParRapport | 10 | Limite des éléments prioritaires dans une carte. |
| CreationBrouillonsHistorique | false | Prudence par défaut pour les anciens emails. |
| SeuilPrioriteAlerteTempsReel | 70 | Score minimal d'alerte immédiate. |
| SeuilConfianceQuarantaine | 85 | Confiance minimale avant quarantaine. |
| DelaiSuppressionQuarantaineJours | 30 | Délai avant rapport de revue humaine. |
| DomainesClientsConnus | [] | Liste JSON configurable. |
| MotsClesSensibles | ["résiliation","litige","avocat","contrat","remise exceptionnelle","geste commercial","confidentiel","données bancaires","mot de passe","RIB","plainte","contentieux","facture impayée","pénalité","dénonciation","RGPD"] | Liste JSON configurable. |
