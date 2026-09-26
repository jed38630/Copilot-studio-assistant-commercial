# Cahier des charges - Assistant Commercial

Version de référence : 1.0  
Date : 26 septembre 2026  
Propriétaire fonctionnel : Jérémy Druelle, responsable commercial  
Plateforme : Microsoft 365, Copilot Studio, Power Automate, Outlook/Exchange Online, Teams, SharePoint et Microsoft Graph

## 1. Objet

L'Assistant Commercial organise la boîte Outlook de Jérémy, prépare des brouillons contextualisés, route les demandes vers les bons interlocuteurs et fournit des alertes Teams utiles. Il fonctionne en temps réel et en nettoyage historique par lots.

Le système assiste Jérémy. Il ne se substitue jamais à sa validation pour une communication sortante, une décision sensible ou une suppression.

## 2. Périmètre

### 2.1 Dans le périmètre

- Lire les nouveaux emails Outlook et le contexte de leur conversation.
- Éviter le retraitement d'un `MessageId` déjà journalisé.
- Classer chaque demande par domaine, sous-type, produit, priorité et confiance.
- Préparer des brouillons dans le fil Outlook lorsque c'est pertinent.
- Préparer séparément un accusé de réception client et une relance interne pour Support ou Facturation.
- Déplacer les emails vers les dossiers de travail prévus.
- Alerter Jérémy dans Teams seulement lorsque son attention est nécessaire.
- Rechercher les informations produit dans les bibliothèques SharePoint autorisées.
- Consulter, si nécessaire, des messages de canaux Teams explicitement autorisés en lecture seule.
- Traiter l'historique par lots, avec simulation obligatoire lors des premiers essais.
- Produire des rapports groupés et journaliser toutes les décisions et actions.

### 2.2 Hors périmètre

- Envoi automatique d'un email, d'un brouillon ou d'une réponse.
- Suppression directe d'un email.
- Lecture des conversations Teams privées ou de canaux non autorisés.
- Modification des bibliothèques SharePoint de connaissance par l'agent.
- Apprentissage autonome non contrôlé.
- Décision automatique sur un litige, une résiliation, une donnée bancaire, une plainte ou tout autre sujet sensible.

## 3. Principes non négociables

1. Aucun email n'est envoyé automatiquement.
2. Aucun composant ne demande ni n'utilise de permission d'envoi Graph.
3. Un email à supprimer est uniquement déplacé en quarantaine.
4. Une confiance faible ou une ambiguïté entraîne une surveillance ou une question Teams.
5. Un domaine client connu ne va jamais automatiquement en quarantaine.
6. Toute décision, action, erreur et validation est journalisée.
7. Les traitements sont idempotents et contrôlés par `MessageId`.
8. Les conversations sont prises en compte sans dédupliquer abusivement les nouveaux messages d'une même conversation.
9. Les sources SharePoint produit sont consultées en lecture seule.
10. Les secrets sont fournis par des connexions gérées ou des variables d'environnement, jamais dans le code.

## 4. Catégories fonctionnelles

Le triage doit distinguer au minimum :

- Spam, newsletter et publicité.
- Important.
- Commercial : prospect, demande de devis, relance de devis, rendez-vous, information produit ou test.
- Support : ticket, incident, anomalie, blocage, relance de ticket ou absence de réponse.
- Facturation : facture, impayé, avoir, paiement, montant incompris ou demande de clarification.
- Interne équipe : demande d'un collaborateur ou action attendue de Jérémy.
- Hiérarchie : notamment message de Mathieu Sevaer ou d'un responsable identifié.
- À surveiller : ambiguïté, sensibilité ou confiance insuffisante.

Produits reconnus et normalisés : DMS, Cloud, Digital Invoice, Digital Purchase, Digital Signature, CRM 360, MaxSat, MaxLead, Remarketing, Missive, LPN, CFN Business Planner, After Sales Planner, Website, BI 360 et Nextlane Platform.

La détection doit tolérer la casse, les accents, les espaces, les tirets, les points, les abréviations et les fautes fréquentes. Par exemple, `CF`, `C.F.N.` et `Business Planner` peuvent être rapprochés de CFN, avec une confiance réduite si le contexte est insuffisant.

## 5. Architecture cible

### 5.1 Agents Copilot Studio

- **AC - Triage** : décide domaine, sous-type, produit, priorité, confiance, risques et routage. Il ne déplace rien et ne crée pas de brouillon.
- **AC - Produits** : recherche les connaissances produit SharePoint et, si nécessaire, le contexte de canaux Teams autorisés. Lecture seule.
- **AC - Support** : prépare l'accusé de réception client et la relance interne liées à un ticket ou incident.
- **AC - Facturation** : prépare l'accusé de réception client et la relance interne liées à la facturation.
- **AC - Interne** : prépare le traitement des demandes internes et hiérarchiques.
- **AC - Rédaction** : rédige le ou les brouillons à partir du mail, du fil, du triage et des connaissances récupérées.
- **Assistant Commercial - Historique** : traite les lots historiques et retourne un résultat adapté au rapport groupé.

Les responsabilités métier restent dans les agents. Power Automate orchestre, applique les garde-fous, déplace, journalise et crée les brouillons autorisés.

### 5.2 Workflow temps réel

1. Déclenchement à l'arrivée d'un email.
2. Lecture du dernier message et récupération du contexte de conversation.
3. Vérification du journal par `MessageId`.
4. Appel de `AC - Triage` avec la sortie réelle de l'analyse.
5. Routage vers Support, Facturation, Interne ou Produits selon le domaine.
6. Recherche produit uniquement lorsqu'un produit est identifié ou probable.
7. Appel de `AC - Rédaction` uniquement si un brouillon est requis.
8. Application des garde-fous déterministes.
9. Création d'un brouillon dans le fil Outlook, sans envoi.
10. Déplacement vers le dossier cible.
11. Notification Teams si nécessaire.
12. Journalisation de la décision et des actions.

### 5.3 Workflow historique

Le traitement historique est manuel ou planifié, paginé via Graph et exécuté par lots. Il accepte une période, une taille de lot, un mode simulation, l'autorisation de créer des brouillons et l'activation des alertes groupées.

En simulation, aucun déplacement et aucun brouillon ne sont créés. Le workflow exclut les messages déjà journalisés, produit un rapport et demande une validation humaine avant le lot suivant en mode manuel.

### 5.4 Workflows complémentaires

- Rattrapage des emails récents toutes les deux heures.
- Résumé commercial hebdomadaire le lundi à 08:00, Europe/Paris.
- Rapport quotidien des éléments en quarantaine depuis plus de 30 jours.

## 6. Contrat de sortie du triage

Le triage retourne au minimum :

```json
{
  "domaine": "Commercial|Support|Facturation|Interne|Hierarchie|Non important|A surveiller",
  "sousType": "",
  "produit": "",
  "scorePriorite": 0,
  "niveauConfiance": 0,
  "actionRecommandee": "",
  "brouillonNecessaire": false,
  "rechercheProduitNecessaire": false,
  "alerteTeamsNecessaire": false,
  "questionTeamsNecessaire": false,
  "resume": "",
  "risquesDetectes": [],
  "raisons": []
}
```

Le JSON est validé avant utilisation. Toute sortie absente, invalide ou contradictoire est traitée comme une confiance faible et routée vers la surveillance.

## 7. Brouillons et validation humaine

Les brouillons doivent rester dans le fil de conversation du message reçu. Ils doivent être lisibles, espacés, rédigés en français professionnel et ne pas recopier la signature Outlook ni les images embarquées du message reçu. La signature configurée de Jérémy peut être ajoutée par une étape dédiée si elle est validée et maintenue hors de l'analyse factuelle.

Pour Support et Facturation, le système peut préparer :

- un accusé de réception au client ;
- une relance interne vers l'équipe configurée.

Les destinataires internes sont configurables dans SharePoint. Teams peut enregistrer la validation de Jérémy et ouvrir le brouillon Outlook. Le clic Teams ne doit jamais envoyer le message ; l'envoi final reste manuel dans Outlook.

## 8. Dossiers Outlook

Sous `Assistant Commercial` :

- `01 - À traiter`
- `02 - Brouillons créés`
- `03 - Question posée Teams`
- `04 - À surveiller`
- `05 - Non important`
- `06 - À supprimer - quarantaine`
- `99 - Traité`
- `Historique - À traiter`
- `Historique - Opportunités oubliées`
- `Historique - À surveiller`
- `Historique - Non important`
- `Historique - Quarantaine suppression`
- `Historique - Nettoyé`

## 9. Stockage et configuration

Le MVP utilise les listes SharePoint existantes, notamment `AssistantCommercial_EmailLog2` et la liste de suivi des brouillons si disponible. La production privilégie Dataverse pour l'audit, les clés alternatives et la gouvernance.

Les journaux doivent couvrir au minimum : message, conversation, expéditeur, objet, catégorie, priorité, confiance, décision, raison, action, dossier, brouillon, liens, alerte Teams, statut, date et erreur.

Les paramètres configurables comprennent le mode simulation historique, la taille et le plafond des lots, les seuils de priorité et de confiance, les domaines clients connus, les mots-clés sensibles et les destinations Support, Facturation, Produits et Hiérarchie.

## 10. Sécurité et gouvernance

- Permissions Graph autorisées : `Mail.ReadWrite`, `User.Read` et `offline_access` seulement si nécessaire.
- La permission d'envoi est interdite par conception.
- Les connexions Power Platform doivent être gérées par l'environnement et soumises à la politique DLP.
- Les canaux Teams autorisés doivent être explicitement listés.
- Les données sensibles sont signalées et ne doivent pas provoquer de réponse définitive automatique.
- Les erreurs sont journalisées et la boîte ne doit pas être bloquée par un échec d'agent.
- Les retrys doivent être bornés et idempotents.
- Toute suppression future reste désactivée par défaut et soumise à une validation humaine séparée.

## 11. Critères d'acceptation

Le projet est conforme lorsque :

1. Les agents et les flows sont séparés par responsabilité.
2. Un email entrant est analysé avec son contexte de conversation.
3. Un `MessageId` déjà traité ne crée ni second brouillon ni seconde action.
4. Une demande de devis reconnue crée un brouillon contextualisé et une alerte si nécessaire.
5. Un email Support ou Facturation prépare l'accusé client et la relance interne sans envoi.
6. Un litige ou mot-clé sensible exige une validation humaine.
7. Un produit mal orthographié peut être reconnu ou classé à surveiller.
8. Un domaine client connu n'est jamais mis automatiquement en quarantaine.
9. Le nettoyage historique en simulation ne déplace rien et ne crée aucun brouillon.
10. Les brouillons sont créés dans le bon fil Outlook.
11. Toutes les actions sont journalisées.
12. Les rapports Teams sont groupés pour l'historique.
13. Aucun artefact ne contient une action d'envoi ou de suppression directe.
14. Les tests locaux et les tests réels contrôlés sont documentés dans `docs/TEST_PLAN.md` et `ETAT_REPRISE.md`.

## 12. Déploiement et exploitation

### MVP

1. Utiliser les listes SharePoint existantes et compléter les colonnes manquantes.
2. Vérifier les dossiers Outlook.
3. Configurer les connexions Power Automate et les agents Copilot Studio.
4. Publier les agents spécialisés.
5. Tester en simulation puis sur des emails contrôlés.
6. Activer progressivement le workflow temps réel.

### Production

1. Migrer les journaux vers Dataverse si nécessaire.
2. Restreindre les accès Graph et Teams.
3. Ajouter la supervision, les alertes d'erreur et la rétention.
4. Valider les scénarios métier par domaine.
5. Déployer par pilote avant généralisation.

À chaque changement, mettre à jour ce document si le périmètre ou une règle évolue, puis renseigner `ETAT_REPRISE.md` avec la date, le changement, les tests et le prochain point de reprise.

## 13. Références du dépôt

- Architecture : `docs/ARCHITECTURE.md`
- Déploiement Copilot Studio : `docs/DEPLOYMENT_COPILOT_STUDIO.md`
- Déploiement Power Automate : `docs/DEPLOYMENT_POWER_AUTOMATE.md`
- Sécurité : `docs/SECURITY_GUARDRAILS.md`
- Tests : `docs/TEST_PLAN.md`
- Exploitation : `docs/OPERATING_MANUAL.md`
- Reprise inter-postes : `ETAT_REPRISE.md` et `REPRISE_PROJET.md`
