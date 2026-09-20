# Garde-fous sécurité

## Pourquoi Mail&#46;Send est interdit

La solution prépare des brouillons pour accélérer le travail commercial, mais Jérémy garde la validation finale. La permission Graph d’envoi direct donnerait à l’automatisation la capacité d’expédier un message depuis la boîte. Ce risque est incompatible avec les règles métier : erreur de ton, engagement commercial non validé, réponse à un litige ou fuite d’information.

## Pourquoi la suppression directe est interdite

Un email peut avoir une valeur commerciale, contractuelle ou probatoire. Une suppression directe rendrait la récupération plus difficile et pourrait masquer une erreur de classification. Le système doit toujours privilégier un déplacement réversible.

## Pourquoi la quarantaine est obligatoire

La quarantaine matérialise une attente de revue humaine. Elle permet de réduire le bruit sans perdre l’information. Les dossiers de quarantaine sont :
- `06 - À supprimer - quarantaine`
- `Historique - Quarantaine suppression`

## Pourquoi le mode simulation est obligatoire pour l’historique

Le nettoyage historique traite beaucoup de messages, parfois anciens, avec contexte incomplet. La simulation permet de mesurer les décisions, ajuster les règles, vérifier les domaines clients connus et éviter les déplacements massifs non voulus.

## Éviter les boucles

- Ne traiter que l’Inbox comme source.
- Déplacer les messages hors Inbox après traitement.
- Ne pas déclencher les flows sur les dossiers `Assistant Commercial`.
- Ne pas déclencher de flow sur la création de brouillons.
- Journaliser `MessageId` avant ou immédiatement après l’action principale.

## Éviter les doublons

- Utiliser `MessageId` comme clé logique.
- En Dataverse, créer une clé alternative sur `ac_messageid`.
- En SharePoint, indexer `MessageId`.
- Vérifier `AssistantCommercial_EmailLog` et `AssistantCommercial_HistoricalCleanup` avant traitement.
- En cas d’erreur après déplacement, ne pas relancer sans vérifier les logs et le dossier courant.

## Gérer les erreurs

Chaque flow doit utiliser une structure `Try / Catch / Finally`.

En cas d’erreur :
- Capturer le `MessageId`.
- Capturer l’action en échec.
- Capturer le code HTTP ou message connecteur.
- Journaliser `Erreur`.
- Alerter Teams seulement si l’email est prioritaire ou si le batch est bloqué.

## Limiter les alertes Teams

- Temps réel : alerte seulement si score élevé, mot sensible, ambiguïté ou validation requise.
- Historique : rapport groupé par lot.
- Paramètre `NombreMaxAlertesTeamsParRapport` pour limiter les éléments affichés.
- Aucun spam Teams pour newsletters, publicités ou notifications évidentes.

## Contrôler les accès Graph

- Utiliser uniquement les permissions nécessaires.
- Restreindre l’application à la boîte cible quand la gouvernance le permet.
- Éviter les secrets dans les fichiers.
- Utiliser variables d’environnement, connexions Power Platform ou coffre.
- Revoir périodiquement les consentements admin.

## Journaliser les décisions

Chaque décision doit inclure :
- MessageId.
- ConversationId.
- Catégorie.
- Score.
- Niveau de confiance.
- Raison.
- Action effectuée.
- Dossier destination.
- Brouillon créé ou non.
- Alerte Teams ou non.
- Date de traitement.
- Erreur éventuelle.
