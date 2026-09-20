# Etat de reprise - Assistant Commercial

Dernière sauvegarde : 20 septembre 2026

## Où nous nous sommes arrêtés

Le projet local et le dépôt GitHub sont synchronisés sur la branche `main`.

Le workflow Power Automate principal est publié avec le routage modulaire et les agents suivants :

- AC - Triage
- AC - Produits
- AC - Support
- AC - Facturation
- AC - Interne
- AC - Rédaction
- Assistant Commercial - Historique

## Dernier diagnostic

Le dernier e-mail de test réussit l’analyse, le triage et le routage, puis échoue à l’étape `06 - Rédiger brouillon contextualisé` avec `NotFound` lors de la récupération de l’état de conversation.

Le diagnostic est maintenant établi : cette étape utilisait l’action générique M365 Copilot `Chat` avec l’identifiant de l’agent AC - Rédaction. Les autres agents du workflow sont appelés par des nœuds `Assistant`.

Correction en cours dans le tenant : l’ancien nœud a été remplacé par un nœud `Assistant`, renommé `06 - Rediger brouillon contextualise`, et associé à AC - Rédaction. La référence du parseur JSON en aval doit encore être contrôlée et reliée à la sortie du nouveau nœud. Le workflow n’est pas encore publié après cette modification et aucun nouveau test ne doit être lancé avant validation du parseur.

Ne pas considérer le test comme réussi tant que les étapes suivantes n’ont pas abouti :

1. création du brouillon dans le fil Outlook ;
2. journalisation dans EmailLog2 ;
3. journalisation dans DraftLog ;
4. notification Teams éventuelle ;
5. contrôle de l’idempotence par MessageId.

## Règles à conserver

- Aucun envoi automatique.
- Permission `Mail.Send` interdite.
- Aucune suppression directe.
- Quarantaine obligatoire pour les messages à supprimer.
- Validation et envoi final manuels dans Outlook.
- Mode simulation obligatoire pour le nettoyage historique lors des premiers essais.

## Reprise rapide sur un autre PC

```powershell
git clone https://github.com/jed38630/Copilot-studio-assistant-commercial.git
cd Copilot-studio-assistant-commercial
npm ci
npm test
```

Puis ouvrir `REPRISE_PROJET.md` pour le contexte complet et reprendre dans Copilot Studio avec le même environnement Microsoft 365.
