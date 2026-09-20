# Déploiement Copilot Studio

## Pré-requis

- Accès à Microsoft Copilot Studio dans l’environnement Power Platform cible.
- Droit de créer ou modifier une solution.
- Connexions Power Automate disponibles pour Outlook, Teams et le stockage choisi.

## Créer la solution

1. Ouvrir Copilot Studio.
2. Créer une solution nommée `Assistant Commercial`.
3. Ajouter deux agents ou deux modules selon l’interface disponible :
   - `Assistant Commercial - Temps réel`
   - `Assistant Commercial - Nettoyage Historique`
4. Configurer la langue principale en français.

## Prompt global

Copier le contenu de :

```text
copilot-studio/prompts/system-assistant-commercial-global.md
```

Ce prompt doit être placé dans les instructions globales ou dans le bloc système commun.

## Agent temps réel

Copier le contenu de :

```text
copilot-studio/prompts/agent-realtime.md
```

Entrées à exposer au flow :
- `MessageId`
- `ConversationId`
- `DateReception`
- `Expediteur`
- `DomaineExpediteur`
- `Objet`
- `BodyPreview`
- `Body`
- `HasAttachments`
- `LienEmail`
- `DomainesClientsConnus`
- `MotsClesSensibles`

Sortie attendue :
- JSON strict conforme au prompt.

## Agent nettoyage historique

Copier le contenu de :

```text
copilot-studio/prompts/agent-historical-cleanup.md
```

Entrées à exposer au flow :
- `MessageId`
- `ConversationId`
- `BatchId`
- `DateReception`
- `Expediteur`
- `DomaineExpediteur`
- `Objet`
- `BodyPreview`
- `Body`
- `HasAttachments`
- `AgeEmailJours`
- `ModeSimulationHistorique`
- `CreationBrouillonsHistorique`
- `DomainesClientsConnus`
- `MotsClesSensibles`

Sortie attendue :
- JSON strict conforme au prompt.

## Topics à créer

Créer les topics suivants à partir des fichiers :
- `copilot-studio/topics/analyser-email.md`
- `copilot-studio/topics/classer-email.md`
- `copilot-studio/topics/creer-brouillon.md`
- `copilot-studio/topics/question-teams.md`
- `copilot-studio/topics/rapport-hebdomadaire.md`
- `copilot-studio/topics/nettoyage-historique.md`

## Actions à connecter

Les agents ne doivent pas manipuler directement Outlook sans passer par Power Automate ou un connecteur Graph contrôlé.

Actions autorisées :
- Lire un message.
- Lister les messages Inbox.
- Lister ou créer les dossiers Outlook.
- Déplacer un message.
- Créer un brouillon de réponse.
- Créer un brouillon autonome.
- Poster une carte Teams via Power Automate.
- Journaliser dans Dataverse ou SharePoint.

Actions interdites :
- Envoi direct d’email.
- Suppression directe d’email.
- Bouton Teams déclenchant une réponse envoyée.

## Validation

1. Tester avec les fixtures du dossier `tests/fixtures`.
2. Vérifier que les sorties sont du JSON valide.
3. Tester un email sensible : l’agent doit demander une validation Teams.
4. Tester une newsletter : l’agent doit proposer non important ou quarantaine.
5. Tester une demande de devis : l’agent doit proposer un brouillon et une alerte Teams.
