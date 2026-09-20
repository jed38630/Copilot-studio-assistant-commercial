# Architecture

## Vue d'ensemble

```mermaid
flowchart LR
  Outlook["Outlook Inbox"] --> PA1["Power Automate temps réel"]
  Outlook --> PA2["Power Automate historique"]
  PA1 --> CS1["Copilot Studio: agent temps réel"]
  PA2 --> CS2["Copilot Studio: agent historique"]
  CS1 --> Guard["Garde-fous Power Automate"]
  CS2 --> Guard
  Guard --> Graph["Microsoft Graph Outlook"]
  Guard --> Store["Dataverse ou SharePoint Logs"]
  Guard --> Teams["Teams Adaptive Cards"]
  Graph --> Folders["Dossiers Assistant Commercial"]
```

## Modules

`Assistant Commercial - Temps réel`
- Déclenché à chaque nouvel email.
- Classe et score l’email.
- Crée un brouillon si nécessaire.
- Déplace l’email vers le dossier cible.
- Alerte Teams quand Jérémy doit intervenir.
- Journalise chaque décision.

`Assistant Commercial - Nettoyage Historique`
- Déclenché manuellement ou planifié.
- Fonctionne par lots et pagination Graph.
- Démarre en simulation.
- Évite les alertes unitaires.
- Produit un rapport Teams groupé.
- Identifie les opportunités oubliées.

## Dossiers Outlook

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

## Stockage

Option MVP : SharePoint Lists.
- Rapide à créer.
- Suffisant pour un pilote.
- Limites sur les clés uniques et gros volumes.

Option production : Dataverse.
- Meilleure gouvernance.
- Clés alternatives sur `MessageId`.
- Sécurité par rôle.
- Audit et vues métier plus robustes.

## Idempotence

Avant tout traitement :
1. Lire `AssistantCommercial_EmailLog`.
2. Lire `AssistantCommercial_HistoricalCleanup` pour l’historique.
3. Si `MessageId` existe, ignorer.
4. Journaliser les erreurs séparément au lieu de relancer sans contrôle.

## Flux de décision temps réel

```mermaid
flowchart TD
  A["Nouvel email"] --> B["Lire message"]
  B --> C{"MessageId déjà loggé ?"}
  C -- oui --> Z["Ignorer"]
  C -- non --> D["Agent temps réel"]
  D --> E["Parser JSON"]
  E --> F["Appliquer garde-fous"]
  F --> G{"Brouillon nécessaire ?"}
  G -- oui --> H["Créer brouillon"]
  G -- non --> I["Pas de brouillon"]
  H --> J["Déplacer email"]
  I --> J
  J --> K{"Teams nécessaire ?"}
  K -- oui --> L["Poster carte Teams"]
  K -- non --> M["Journaliser"]
  L --> M
```

## Flux historique

```mermaid
flowchart TD
  A["Lancement manuel ou planifié"] --> B["Lire paramètres"]
  B --> C["Lister lot Inbox"]
  C --> D["Exclure MessageId loggés"]
  D --> E["Agent historique"]
  E --> F{"Simulation ?"}
  F -- oui --> G["Journaliser sans déplacement"]
  F -- non --> H["Déplacer et créer brouillon si autorisé"]
  G --> I["Rapport Teams groupé"]
  H --> I
  I --> J{"Continuer lot suivant ?"}
```
