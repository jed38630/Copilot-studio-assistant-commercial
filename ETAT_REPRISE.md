# Etat de reprise - Assistant Commercial

Dernière sauvegarde : 20 septembre 2026

## Dernière modification du workflow

Le bloc `01 - Analyser email et conversation` a été nettoyé puis publié dans `AC - 24-7 - Nouvel email entrant`. Il extrait désormais les faits du dernier message et de la conversation pour alimenter `AC - Triage` : expéditeur, objet, contenu, indices commerciaux, indices d'urgence, éléments sensibles, ambiguïtés et informations manquantes.

Les décisions métier, le score, la catégorie, le routage, la recherche produit, la rédaction du brouillon et la signature ne doivent plus être produits par ce bloc. Ils sont délégués respectivement à `AC - Triage`, `AC - Produits` et `AC - Rédaction`. Aucun changement de source SharePoint, de permission ou d'envoi n'a été effectué.

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

Le chemin générique de création de brouillon est validé. L’agent AC - Produits est maintenant publié avec une détection tolérante des alias, variantes et fautes produit, notamment `CFN`, `CF`, `C.F.N.` et `Business Planner`. Il reste à valider séparément le chemin enrichi par connaissances produit et à contrôler l’idempotence sur un même MessageId.

Un test de prévisualisation Copilot Studio a été lancé avec une demande mentionnant `CF` et `Business Planner`. L’agent a accepté la demande et a déclenché la recherche dans les connaissances SharePoint, ce qui confirme l’activation du chemin de recherche produit. La prévisualisation est ensuite restée bloquée sur l’analyse d’un document PPTX ; aucune réponse client, aucun brouillon et aucune action Outlook ou Teams n’ont été produits. Ce point est à traiter comme une anomalie de temps de réponse ou d’indexation de la base de connaissances, séparément de la détection des alias.

Inspection en lecture seule des sources : la bibliothèque `Product` contient notamment `01. Contacts per Product - 2026.pptx`, `03.Lead Team organisation Chart (31-Mar update).pptx`, `05. Nextlane PLATFORM Presentation Oct25.pptx` et `2025 - Your Contacts in PRODUCT & PRODUCT MARKETING Teams.pptx`. La bibliothèque `PRODUCT MARKETING CONTENTS` affiche un avertissement SharePoint indiquant que certains fichiers ont des métadonnées obligatoires manquantes et contient aussi un fichier `PRODUCT MARKETING CONTENTS agent.agent` signalé comme incomplet. Ces éléments peuvent expliquer le blocage d’analyse ; ils n’ont pas été modifiés.

À la demande de Jérémy, l’anomalie PPTX est mise de côté. Une stratégie d’indexation en lecture seule des bibliothèques a été documentée dans `docs/SHAREPOINT_INDEXATION.md`. Elle prévoit un catalogue des fichiers, métadonnées, liens, ETag, pagination Graph et statut d’indexation, sans recopier ni modifier les sources SharePoint. Le flux d’indexation reste à créer dans le tenant après validation de la liste cible.

Une régression locale a été ajoutée dans `scripts/simulate-classification.ts` et `tests/classification.test.ts` : `CFN`, `C.F.N.`, `Business Planner` et `CF` sont reconnus comme le produit `CFN`, avec une confiance réduite pour l’alias court `CF`. La suite locale compte maintenant 16 tests réussis.

## Prochaine validation ciblée

La correction de détection a été appliquée et publiée dans AC - Produits. L’agent normalise maintenant accents, casse, espaces, tirets, points, abréviations et fautes de frappe ; `CF`, `C.F.N.` et `Business Planner` sont proposés comme `CFN` avec confiance réduite si le contexte est ambigu. Rejouer un email équivalent et vérifier que `05 - Rechercher connaissances produit` puis `06 - Rediger brouillon contextualise` sont pris avant la création du brouillon. Le test devra ensuite couvrir les autres produits : `CRM 360`, `DMS`, `Digital Invoice`, `Digital Purchase`, `Digital Signature`, `MaxSat`, `MaxLead`, `Remarketing`, `Missive`, `LPN`, `After Sales Planner`, `Website`, `BI 360` et `Nextlane Platform`.

Pour le contrôle d’idempotence, ne pas renvoyer ni retraiter le même `MessageId` sans vérifier d’abord le journal et le comportement prévu du flux.

Les contrôles finaux restent :

1. création du brouillon dans le fil Outlook ;
2. journalisation dans EmailLog2 ;
3. journalisation dans DraftLog ;
4. notification Teams éventuelle ;
5. contrôle de l’idempotence par MessageId.

## Prochaine action

Réaliser le test produit ciblé par un email réel, puis vérifier `05 - Rechercher connaissances produit`, `06 - Rediger brouillon contextualise`, `07 - Parser la decision structuree`, EmailLog2, le brouillon Outlook dans le fil, DraftLog et la notification Teams éventuelle. Surveiller également le temps de réponse de la connaissance PPTX ; si le blocage se reproduit, réduire ou réindexer les sources documentaires avant de relancer la chaîne. Ne jamais cliquer sur un bouton d’envoi automatique. Dernière modification du tenant : correction des alias AC - Produits enregistrée et publiée le 20 septembre 2026.

Les tests locaux sont actuellement au vert : 16 tests réussis, dont la classification, la détection des alias CFN/CF, le nettoyage historique en simulation, l’idempotence, les artefacts Power Platform et les garde-fous de sécurité.

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
