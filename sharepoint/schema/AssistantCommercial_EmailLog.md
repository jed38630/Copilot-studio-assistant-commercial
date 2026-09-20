# SharePoint List - AssistantCommercial_EmailLog

Liste MVP recommandée pour journaliser le mode temps réel.

| Colonne | Type SharePoint recommandé | Notes |
|---|---|---|
| MessageId | Une ligne de texte | Index unique logique. Vérifier avant traitement. |
| ConversationId | Une ligne de texte | Regroupement Outlook. |
| DateReception | Date et heure | Date du message. |
| Expediteur | Une ligne de texte | Adresse email. |
| DomaineExpediteur | Une ligne de texte | Domaine normalisé. |
| Objet | Une ligne de texte | Objet Outlook. |
| Categorie | Choix | Catégorie temps réel. |
| ScorePriorite | Nombre | Score calculé. |
| NiveauConfiance | Nombre | 0 à 100. |
| Decision | Plusieurs lignes de texte | Décision complète. |
| RaisonDecision | Plusieurs lignes de texte | Raisons lisibles. |
| ActionEffectuee | Une ligne de texte | Déplacement, brouillon, question Teams. |
| DossierDestination | Une ligne de texte | Nom du dossier cible. |
| BrouillonCree | Oui/Non | True si brouillon créé. |
| BrouillonId | Une ligne de texte | ID Graph du brouillon. |
| LienEmail | Lien hypertexte | `webLink` Outlook si disponible. |
| LienBrouillon | Lien hypertexte | Lien Outlook du brouillon si disponible. |
| TeamsAlerteEnvoyee | Oui/Non | True si carte Teams publiée. |
| StatutValidation | Choix | Non requis, En attente, Validé, Refusé, À revoir. |
| DateTraitement | Date et heure | Date de traitement. |
| Erreur | Plusieurs lignes de texte | Message d'erreur ou payload utile. |

Index recommandés :
- `MessageId`
- `DateReception`
- `Categorie`
- `StatutValidation`
