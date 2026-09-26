# Etat de reprise - Assistant Commercial

Dernière sauvegarde : 26 septembre 2026

## Mise à jour du 26 septembre 2026 : dashboard Power Apps publié

Le dashboard `Assistant Commercial - Dashboard` a été créé et publié dans l'environnement Power Apps `I'CAR SYSTEMS` à partir du site SharePoint `Equipe Commerciale Zone A`. La connexion principale est `AssistantCommercial_EmailLog2` ; les sources `AssistantCommercial_DraftLog` et `AssistantCommercial_Settings` ont également été ajoutées.

Le lien utilisateur publié est : `https://apps.powerapps.com/play/e/Default-5bc7adc6-fdce-46af-ab42-b2f503dc84c4/a/5506743f-784c-4292-b924-eeadfb7cbabf`.

La version actuelle affiche les données réelles du journal et les champs détaillés. Elle ne recrée pas la logique Copilot Studio/Power Automate. Prochaine évolution : ajouter les commandes du dashboard qui appellent les flows existants pour ouvrir un brouillon Outlook, classer, ignorer ou régénérer, puis tester chaque commande et sa journalisation. Aucun envoi automatique ne doit être ajouté.

## Mise à jour du 26 septembre 2026 : tableau de bord

Une première interface statique du tableau de bord Assistant Commercial a été ajoutée dans `dashboard/`. Elle reprend le principe observé dans la vidéo de référence : indicateurs du jour en haut, liste des emails traités, filtres et recherche, puis détail de l'email sélectionné avec contenu original, résumé IA, classification, niveau de confiance et brouillon proposé.

Les actions de la maquette sont volontairement compatibles avec les garde-fous : ouvrir le brouillon dans Outlook, modifier, ignorer, classer ou régénérer. Aucun bouton n'envoie automatiquement un email et aucune suppression directe n'est proposée. Les données sont encore locales de démonstration ; le branchement vers `AssistantCommercial_EmailLog2`, DraftLog/Dataverse, les liens Outlook et les flows Power Automate est documenté dans `dashboard/README.md`.

## Mise à jour du 26 septembre 2026 : cahier des charges de référence

Le cahier des charges complet du projet a été ajouté dans `docs/CAHIER_DES_CHARGES.md` et référencé depuis `README.md`. Il devient le document de référence lors d'un changement de poste ou d'une évolution fonctionnelle.

Il couvre le périmètre, les catégories métier, les produits et alias, les responsabilités des agents, les workflows temps réel et historique, le contrat de sortie du triage, les brouillons, les listes et paramètres SharePoint, la sécurité, les critères d'acceptation, le déploiement et l'exploitation. Toute nouvelle fonctionnalité doit être ajoutée à ce cahier des charges avant d'être considérée comme conforme.

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

Une régression locale a été ajoutée dans `scripts/simulate-classification.ts` et `tests/classification.test.ts` : `CFN`, `C.F.N.`, `Business Planner` et `CF` sont reconnus comme le produit `CFN`, avec une confiance réduite pour l’alias court `CF`.

Reprise du 21 septembre 2026 : le dépôt GitHub a été récupéré sur ce poste et la suite locale a été relancée avec le runtime Node Codex, car `npm` n'est pas disponible dans le PATH Windows. Une régression supplémentaire couvre le scénario de test réel recommandé : demande urgente `CFN / Business Planner`, alias `CF`, demande de devis et échéance. Ce scénario doit créer un brouillon, alerter Teams et viser `01 - À traiter`. La suite locale compte maintenant 17 tests réussis.

Correction du 21 septembre 2026 : le bloc `07 - Parser la decision structuree` échouait lorsque la sortie de rédaction contenait un JSON entouré de balises Markdown ```` ```json ````. Le contenu du bloc a été remplacé par une expression `@replace(...)` qui applique `trim()` puis retire les balises avant le parsing. Le workflow a été enregistré et publié ; aucun email n'a été envoyé.

Validation du 22 septembre 2026 : un nouvel email de test a été traité avec succès après la correction du bloc 7. Le workflow a donc été validé à nouveau en conditions réelles ; aucun email n’a été envoyé automatiquement.

Validation Support du 22 septembre 2026 : le run `08584115735259637537162547003CU00` s’est terminé en réussite en 2 min 56 s. Le bloc `07 - Parser la decision structuree` et la journalisation ont réussi ; la branche Support a été prise, tandis que la recherche produit et la rédaction contextualisée ont été correctement ignorées. Aucun envoi automatique n’a été déclenché.

Le parcours Support est désormais validé. Le contrôle restant est l’idempotence en conditions réelles : vérifier dans `EmailLog2` qu’un `MessageId` traité n’a qu’une seule ligne et qu’aucun second brouillon ou déplacement n’est créé. Le test doit être préparé avant toute nouvelle exécution afin d’éviter un retraitement involontaire.

## Mise à jour du 20 septembre 2026 : bloc d’analyse allégé

Le nœud `01 - Analyser email et conversation` a été réduit à son rôle d’extraction factuelle. Il transmet désormais uniquement le contexte de l’email, les indicateurs utiles au triage, un JSON minimal et les quatre champs dynamiques Outlook : expéditeur, objet, aperçu et contenu complet.

Les éléments retirés de ce nœud sont les règles de classement et de scoring, la création de brouillon, la rédaction HTML, la signature Outlook, le logo ou les images embarquées, les références CID, la recherche produit et les consignes de réponse. Ces responsabilités restent dans `AC - Triage`, `AC - Produits` et `AC - Rédaction`.

La version simplifiée a été enregistrée et publiée dans Copilot Studio. Le workflow reste publié avec les deux avertissements non bloquants déjà présents. Aucun email n’a été envoyé et aucune source SharePoint n’a été modifiée.

## Diagnostic Support du 20 septembre 2026

L’exécution de 21:26 concernait bien une relance Support critique : ticket `#1260889`, DMS/Athoris, incident non résolu depuis plus de 15 jours, erreur `Taxe code invalide` et plus de 5 000 euros de facturation bloquée. La sortie d’analyse contenait correctement ces éléments et recommandait une validation humaine.

Le domaine `Interne` observé dans `AC - Triage` ne venait pas d’une mauvaise lecture du mail. Le message du nœud `02 - Triage - AC - Triage` ne contenait pas la sortie du nœud précédent ; il indiquait seulement que le contexte était transmis. L’agent a donc reçu un contexte vide et a appliqué son repli prudent `Interne / Triage manuel`.

Correction effectuée dans le tenant : insertion du jeton dynamique `Response` de `01 - Analyser email et conversation` dans le message de `02 - Triage - AC - Triage`. Le workflow a été enregistré et publié. Les deux avertissements de publication restent non bloquants.

Prochain test : envoyer ou rejouer un email Support réel et vérifier que `AC - Triage` retourne `domaine = Support`, que `03 - Routage domaine` prend la branche Support, puis que `03A - AC Support` prépare l’accusé de réception client et la relance interne sans envoi automatique.

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

Le chemin produit ayant été validé par un nouvel email réel, poursuivre avec un test Support et vérifier que `AC - Triage` retourne `domaine = Support`, que `03 - Routage domaine` prend la branche Support et que `03A - AC Support` prépare les éléments attendus sans envoi automatique. Ensuite, contrôler l’idempotence sur un `MessageId` déjà journalisé, sans retraiter le message avant d’avoir vérifié le journal. Ne jamais cliquer sur un bouton d’envoi automatique. Dernière modification du tenant : correction des alias AC - Produits enregistrée et publiée le 20 septembre 2026.

Les tests locaux sont actuellement au vert : 17 tests réussis, dont la classification, la détection des alias CFN/CF, le scénario urgent `CFN / Business Planner`, le nettoyage historique en simulation, l’idempotence, les artefacts Power Platform et les garde-fous de sécurité.

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

## Mise à jour du 26 septembre 2026 : dashboard HTML et architecture

Le dashboard HTML est désormais l’interface cible. La version Power Apps créée précédemment a uniquement servi à valider que les listes SharePoint sont accessibles et n’est pas retenue comme interface utilisateur principale. Le front-end HTML conserve une démo locale et dispose maintenant d’un adaptateur API configurable pour lire `AssistantCommercial_EmailLog2`, `AssistantCommercial_DraftLog` et `AssistantCommercial_Settings` via une API protégée.

Le schéma d’architecture est disponible dans `docs/assistant-commercial-architecture.svg`. Il formalise la séparation suivante : Outlook déclenche, Copilot Studio comprend et prépare, Power Automate orchestre et journalise, SharePoint ou Dataverse stocke, Teams alerte et le dashboard HTML affiche.

Le front-end HTML expose maintenant un mode live configurable et les contrats `GET /api/dashboard/emails` et `POST /api/dashboard/actions`. Le branchement restant consiste à héberger l’API TypeScript derrière Entra ID et à la relier aux flux d’action existants, sans dupliquer les règles métier.

État fonctionnel : le dashboard HTML fournit les compteurs, filtres, détail enrichi et adaptateur de rafraîchissement. Les actions sensibles doivent rester des commandes de validation, d’ouverture du brouillon ou de journalisation ; aucun bouton ne doit envoyer un email. La procédure de déploiement est dans `docs/DASHBOARD_HTML_DEPLOYMENT.md`.

## Architecture HTML live confirmée

Le dashboard HTML est confirmé comme interface principale ; Power Apps n’est pas retenu pour l’usage quotidien. `dashboard/api.js` permet le mode live avec `GET /api/dashboard/emails` et `POST /api/dashboard/actions`. `dashboard/api/server.mjs` fournit un squelette Node sans dépendance pour lire les lignes SharePoint via Graph et relayer uniquement les actions `ignore`, `classify` et `regenerate` vers des flows configurés par variables d’environnement.

Le navigateur ne porte aucun secret. Avant utilisation réelle, l’API doit être hébergée derrière Microsoft Entra ID ou une passerelle équivalente, puis les URLs des flows d’action doivent être renseignées dans l’environnement du serveur. Aucun endpoint d’envoi ou de suppression n’est prévu. La configuration de déploiement est dans `docs/DASHBOARD_HTML_DEPLOYMENT.md`.

Les paramètres non sensibles ont été récupérés directement dans la session Microsoft 365 et consignés dans `docs/RUNTIME_PARAMETERS.md` : environnement, domaine tenant, site SharePoint, identifiants des listes et identifiant composite Graph. Le flux `AC - 24-7 - Nouvel email entrant` est actif. L’ancien flux Outlook V3 est désactivé et ne doit pas être réactivé en parallèle. Aucun endpoint HTTP d’action n’est actuellement exposé par les flux existants.

## Mise à jour du 26 septembre 2026 : premier flux de lecture du dashboard

Le flux Power Automate `AC - Dashboard - Lire journaux` a été créé et enregistré dans l’environnement `I'CAR SYSTEMS`. Il contient uniquement :

1. le déclencheur HTTP `Demander - Lors de la réception d’une requête HTTP` ;
2. l’action SharePoint `Obtenir les éléments` sur `AssistantCommercial_EmailLog2` du site `Equipe Commerciale Zone A` ;
3. l’action `Répondre - Journaux EmailLog2` avec une réponse JSON et l’en-tête `Content-Type: application/json`.

Le flux a été enregistré mais Power Automate indique qu’il ne peut pas être utilisé avec la licence actuelle : le déclencheur HTTP et l’action Réponse sont signalés comme Premium. Le flux n’est donc pas considéré comme un endpoint live disponible, et son URL ne doit pas être copiée dans le navigateur ni dans GitHub.

Le dashboard reste volontairement en `mode: "mock"`. Pour passer en live, il faut d’abord choisir une voie d’hébergement approuvée : licence Premium Power Automate pour ce flux, ou API Azure protégée par Entra ID avec les autorisations SharePoint/Graph validées par l’administrateur. La seconde voie est recommandée pour éviter d’exposer une URL de déclenchement Power Automate au navigateur.

Le flux enregistré doit être contrôlé avant toute activation : tester uniquement la lecture et la réponse JSON, puis vérifier qu’aucune action Outlook, envoi, suppression ou déplacement n’a été ajoutée. Les trois avertissements actuels concernent la licence Premium et l’absence de filtre OData sur la lecture SharePoint ; ils ne constituent pas une validation fonctionnelle.

## Mise à jour du 26 septembre 2026 : voie SharePoint sans Premium pour le dashboard HTML

Pour sortir du mode démonstration sans exposer l’URL du flux HTTP Premium, le front-end a été adapté avec un mode `auto/sharepoint` dans `dashboard/api.js` et `dashboard/config.js`.

Lorsque `dashboard/index.html` est hébergé dans le site `EquipeCommercialeZoneA`, le dashboard lit `AssistantCommercial_EmailLog2` via l’API REST SharePoint avec la session Microsoft 365 de l’utilisateur. Lorsqu’il est ouvert depuis le disque local, il reste en mode démonstration ; cette séparation évite une fausse impression de mode live pendant les tests locaux.

Les actions `ignore`, `classify` et `regenerate` ne sont pas exécutées directement par le navigateur. Elles sont écrites dans la nouvelle liste cible `AssistantCommercial_DashboardActions`, puis traitées par un flux SharePoint standard décrit dans `power-automate/flows/AC-dashboard-actions-queue.md`. Ce flux doit conserver les garde-fous : aucun envoi, aucune suppression directe, création de brouillon uniquement pour `regenerate`, et journalisation de chaque demande.

Le schéma de la liste est dans `sharepoint/schema/AssistantCommercial_DashboardActions.md`. Le code et la documentation sont prêts dans le dépôt ; il reste à créer la liste et le flux dans le site d’équipe, déposer les fichiers du dashboard dans `Site Assets`, puis effectuer un test réel de lecture et de demande de brouillon. Si le tenant bloque les scripts HTML dans SharePoint, la solution de repli est une API Azure protégée par Entra ID.
