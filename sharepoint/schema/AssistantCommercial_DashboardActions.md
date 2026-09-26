# AssistantCommercial_DashboardActions

Liste SharePoint à créer dans le site `Equipe Commerciale Zone A` pour les commandes émises par le dashboard HTML.

Cette liste ne déclenche aucun envoi d’email et aucune suppression. Elle sert de file de demandes, traitée par un flux Power Automate standard déclenché à la création d’un élément.

| Colonne | Type | Obligatoire | Usage |
|---|---|---:|---|
| Title | Texte | Oui | Identifiant lisible de la demande |
| MessageId | Texte | Oui | Message Outlook concerné |
| Action | Choix | Oui | `ignore`, `classify`, `regenerate` |
| Category | Texte | Non | Catégorie demandée lors du classement |
| Instruction | Plusieurs lignes | Non | Précision de Jérémy |
| Status | Choix | Oui | `Requested`, `Processing`, `Completed`, `Rejected`, `Error` |
| RequestedBy | Personne | Non | Utilisateur ayant créé la demande |
| RequestedAt | Date et heure | Oui | Date de création de la commande |
| ProcessedAt | Date et heure | Non | Date de traitement par le flux |
| Result | Plusieurs lignes | Non | Résultat synthétique et lien Outlook éventuel |
| Error | Plusieurs lignes | Non | Erreur technique ou métier |

Le compte utilisé par le dashboard doit avoir uniquement le droit de lecture sur `AssistantCommercial_EmailLog2` et le droit de création sur cette liste. Le flux doit contrôler les valeurs de `Action`, journaliser le résultat et conserver la validation humaine dans Outlook.
