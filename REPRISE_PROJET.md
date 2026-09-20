# Reprise du projet Assistant Commercial

Dernière mise à jour : 20 septembre 2026

## Objectif et garde-fous

Assistant Commercial pour traiter la boîte Outlook de Jérémy Druelle avec Copilot Studio, Power Automate, SharePoint, Teams et Microsoft Graph.

- Aucun envoi automatique d’e-mail.
- Ne jamais demander ni utiliser `Mail.Send`.
- Ne jamais supprimer directement un message.
- Les messages candidats à la suppression vont uniquement en quarantaine.
- Les brouillons restent à valider et envoyer manuellement dans Outlook.
- Toute décision est journalisée.
- Le traitement est idempotent par `MessageId`.

## État du dépôt local

Le projet contient la documentation, les prompts Copilot Studio, les artefacts Power Platform, les schémas Dataverse/SharePoint, les cartes Teams, les scripts TypeScript et les tests.

Les tests locaux avaient été validés : 15 tests passent.

Le dépôt Git local est initialisé, mais il n’a encore aucun commit ni remote GitHub.

## État du tenant Microsoft 365

Agents publiés et utiles :

- AC - Triage
- AC - Produits
- AC - Support
- AC - Facturation
- AC - Interne
- AC - Rédaction
- Assistant Commercial - Historique

Le premier agent temps réel et les anciens agents d’essai ont été supprimés pour éviter les doublons.

Le workflow principal est publié avec les blocs suivants : analyse e-mail/conversation, triage, routage du domaine, préqualification produit, recherche de connaissances, rédaction, parsing de décision, création éventuelle de brouillon, journalisation EmailLog2/DraftLog et notification Teams.

La branche `Sinon` du routage a été raccordée au chemin commun et l’appel de rédaction utilise l’identifiant unique de l’agent, pas son nom affiché.

## Dernier test à reprendre

Le dernier e-mail de test a déclenché le workflow. L’analyse et le triage ont réussi, puis l’étape `06 - Rédiger brouillon contextualisé` a échoué.

À reprendre en premier : ouvrir la dernière exécution en erreur et relever le message détaillé de ce bloc. Ne pas modifier le flux avant d’avoir relevé l’erreur exacte. Aucun brouillon ni journal ne doit être considéré comme validé tant que les étapes de création du brouillon et de journalisation n’ont pas réussi.

## Sauvegarde GitHub

Après vérification des fichiers et des secrets :

```powershell
git add .
git commit -m "Sauvegarde du projet Assistant Commercial"
git branch -M main
git remote add origin https://github.com/<organisation-ou-utilisateur>/<nom-du-repo>.git
git push -u origin main
```

Sur l’autre ordinateur :

```powershell
git clone https://github.com/<organisation-ou-utilisateur>/<nom-du-repo>.git
cd "Copilot Studio"
npm ci
npm test
```

Ne jamais versionner un `.env` réel, un secret, un jeton, une exportation contenant des données personnelles ou un e-mail réel. Seul `.env.example` doit être partagé. Le dépôt doit rester privé si les fichiers ne sont pas entièrement anonymisés.

## Reprise sans GitHub

Copier tout le dossier du projet avec ce fichier sur un emplacement sécurisé. Le chat Codex n’est pas contenu dans le dépôt ; conserver aussi son lien de partage ou exporter son contenu séparément.

## Connexions à refaire

Sur l’autre ordinateur, les connexions Copilot Studio, Power Automate, Outlook, SharePoint et Teams peuvent demander une reconnexion et une validation administrateur.

Vérifier les permissions Graph : `Mail.ReadWrite`, `User.Read` et éventuellement `offline_access`, sans `Mail.Send`. Vérifier les listes SharePoint EmailLog2 et DraftLog ainsi que les paramètres de routage dans `AssistantCommercial_Settings`.

## Ordre de reprise conseillé

1. Relever l’erreur exacte de rédaction.
2. Corriger uniquement l’agent ou l’étape concernée.
3. Publier l’agent puis le workflow.
4. Envoyer un nouvel e-mail test manuel.
5. Vérifier le brouillon dans le fil de conversation reçu.
6. Vérifier signature, formatage, EmailLog2 et DraftLog.
7. Vérifier qu’un même `MessageId` ne crée pas de doublon.
8. Tester commercial, support, facturation, interne, hiérarchie, newsletter et litige.
9. Tester le nettoyage historique en simulation.

## Limites connues

La validation Teams ne doit pas envoyer le message tant que la politique sans `Mail.Send` est conservée. Elle peut journaliser la validation et ouvrir le brouillon Outlook ; l’envoi final reste manuel. Le nettoyage historique doit rester en simulation par défaut. Les destinataires support, facturation et produits doivent rester configurables dans SharePoint, jamais codés en dur.
