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

AC - Produits est également publié avec les connaissances SharePoint `Nextlane - Product & Engineering` et `Nextlane - Product Marketing Contents`. Un outil Teams en lecture seule, `Obtenir des messages dans un canal`, est configuré pour rechercher du contexte interne ciblé. Aucun outil de publication, de réponse ou d’envoi Teams n’est configuré.

## Dernier diagnostic

Le test réel du 20 septembre 2026 à 21:03 a terminé avec succès jusqu’à la préqualification CRM360 : analyse réussie, triage réussi et préqualification réussie. Le triage a classé la demande comme importante, avec brouillon nécessaire, et la préqualification a renvoyé `produitConcerne=true` pour CRM360.

Le diagnostic suivant a été établi : la condition `04 - Décider si recherche produit` envoyait pourtant la demande vers `Sinon`, ce qui ignorait la recherche produit, la rédaction contextualisée, le parseur et les étapes de création/journalisation du brouillon. La cause était une lecture trop restrictive de la sortie de préqualification.

Le diagnostic est maintenant établi : cette étape utilisait l’action générique M365 Copilot `Chat` avec l’identifiant de l’agent AC - Rédaction. Les autres agents du workflow sont appelés par des nœuds `Assistant`.

Corrections effectuées dans le tenant : l’ancien nœud générique M365 Copilot a été supprimé et remplacé par un nœud `Assistant`, renommé `06 - Rediger brouillon contextualise`, associé à AC - Rédaction. Le parseur JSON `07 - Parser la decision structuree` pointe maintenant vers la sortie de ce nouveau nœud et conserve le repli vers l’analyse initiale. La condition produit accepte désormais les sorties `adaptiveCardResponse` et `response` de l’agent de préqualification. La correction est enregistrée et publiée.

Un run réel ultérieur a confirmé la chaîne brouillon complète : `08 - Journaliser EmailLog2`, `07 - Parser la decision structuree`, `09 - Decider creation brouillon`, `10 - Creer brouillon Graph`, `11 - Finaliser brouillon Outlook` et `12 - Journaliser DraftLog` ont réussi. Le brouillon a donc bien été créé dans le fil Outlook du message reçu et l’utilisateur l’a retrouvé dans Outlook. Aucun email n’a été envoyé automatiquement.

Le test réel du 20 septembre 2026 à 21:09 concernait le message **« devis CFN »**, dont le contenu demandait la mise en place du CF. Le run a terminé avec le statut Réussite et a créé un brouillon, mais `03 - Routage domaine` a pris la branche Sinon et `04 - Décider si recherche produit` a pris sa branche Sinon. Les agents Produits et Rédaction contextualisée ont donc été ignorés alors que CFN est bien un produit attendu. Il s’agit d’une anomalie de préqualification ou de détection du produit CFN, à corriger avant de considérer le chemin produit comme validé.

L’agent AC - Produits a été renforcé dans Copilot Studio avec un outil Teams en lecture seule pour les messages d’un canal, puis enregistré et publié. Les bases SharePoint produit restent les sources de vérité. Le périmètre Teams doit rester limité aux canaux commerciaux, produits et support autorisés ; ne pas ajouter de lecture des conversations privées ni d’opérations d’écriture.

Le chemin générique de création de brouillon est validé. Il reste à valider séparément le chemin enrichi par connaissances produit et à contrôler l’idempotence sur un même MessageId.

## Prochaine validation ciblée

Corriger ou élargir la préqualification pour reconnaître explicitement `CFN` et `CF` comme le produit `CFN`, puis rejouer un email équivalent. Vérifier que `05 - Rechercher connaissances produit` puis `06 - Rediger brouillon contextualise` sont pris avant la création du brouillon. Le test devra ensuite couvrir les autres produits : `CRM 360`, `DMS`, `Digital Invoice`, `Digital Purchase`, `Digital Signature`, `MaxSat`, `MaxLead`, `Remarketing`, `Missive`, `LPN`, `After Sales Planner`, `Website`, `BI 360` et `Nextlane Platform`.

Pour le contrôle d’idempotence, ne pas renvoyer ni retraiter le même `MessageId` sans vérifier d’abord le journal et le comportement prévu du flux.

Les contrôles finaux restent :

1. création du brouillon dans le fil Outlook ;
2. journalisation dans EmailLog2 ;
3. journalisation dans DraftLog ;
4. notification Teams éventuelle ;
5. contrôle de l’idempotence par MessageId.

## Prochaine action

Réaliser le test produit ciblé ci-dessus, puis vérifier `05 - Rechercher connaissances produit`, `06 - Rediger brouillon contextualise`, `07 - Parser la decision structuree`, EmailLog2, le brouillon Outlook dans le fil, DraftLog et la notification Teams éventuelle. Ne jamais cliquer sur un bouton d’envoi automatique.

Les tests locaux sont actuellement au vert : 15 tests réussis, dont la classification, le nettoyage historique en simulation, l’idempotence, les artefacts Power Platform et les garde-fous de sécurité.

## Règles à conserver

- Aucun envoi automatique.
- Permission Graph d’envoi interdite.
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
