# SharePoint List - AssistantCommercial_HistoricalCleanup

Liste MVP recommandée pour journaliser le nettoyage historique par lots.

| Colonne | Type SharePoint recommandé | Notes |
|---|---|---|
| MessageId | Une ligne de texte | Index unique logique. |
| ConversationId | Une ligne de texte | Fil Outlook. |
| BatchId | Une ligne de texte | Identifiant du lot. |
| DateReception | Date et heure | Date du message. |
| Expediteur | Une ligne de texte | Adresse email. |
| DomaineExpediteur | Une ligne de texte | Domaine normalisé. |
| Objet | Une ligne de texte | Objet Outlook. |
| AgeEmailJours | Nombre | Calculé au moment du traitement. |
| Categorie | Choix | Catégorie historique. |
| ScorePriorite | Nombre | Score commercial. |
| ScoreObsolescence | Nombre | Score d'ancienneté et d'obsolescence. |
| NiveauConfiance | Nombre | 0 à 100. |
| Decision | Plusieurs lignes de texte | Décision complète. |
| RaisonDecision | Plusieurs lignes de texte | Raisons lisibles. |
| ActionEffectuee | Une ligne de texte | Simulation, déplacement, brouillon. |
| DossierDestination | Une ligne de texte | Nom du dossier cible. |
| BrouillonCree | Oui/Non | True si brouillon créé. |
| AlerteTeams | Oui/Non | True si alerte immédiate ou rapport. |
| InclureRapportNettoyage | Oui/Non | True si présent dans le rapport. |
| Statut | Choix | Simulation, Déplacé, Brouillon créé, À valider, Erreur, Ignoré. |
| DateTraitement | Date et heure | Date de traitement. |
| Erreur | Plusieurs lignes de texte | Détail d'erreur. |

Index recommandés :
- `MessageId`
- `BatchId`
- `DateReception`
- `Categorie`
- `Statut`
