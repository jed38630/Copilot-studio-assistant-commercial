# Indexation des connaissances SharePoint

## Objectif

Accélérer la recherche de contexte produit sans modifier les bibliothèques SharePoint existantes. Les bibliothèques `Product` et `PRODUCT MARKETING CONTENTS` restent les sources de vérité ; l’index est un catalogue technique en lecture contrôlée.

## Architecture recommandée

1. Un flux planifié parcourt les deux bibliothèques en lecture seule.
2. Le flux utilise Microsoft Graph `drive/root/delta` ou le connecteur SharePoint avec pagination.
3. Chaque fichier est enregistré dans une liste `AssistantCommercial_KnowledgeIndex` ou dans Dataverse en production.
4. Le contenu n’est pas copié dans l’index par défaut. On conserve le lien SharePoint, le nom, les métadonnées, le type, la langue, les produits et la date de modification.
5. Une modification est détectée avec `itemId`, `eTag` ou `lastModifiedDateTime`. Les fichiers supprimés de la source sont marqués `AbsentDeLaSource`, jamais supprimés automatiquement de l’index.
6. AC - Produits utilise l’index pour réduire la recherche : produit identifié, bibliothèque cible, dossier probable, type de document et lien direct.

## Schéma minimal

| Colonne | Usage |
|---|---|
| SourceKey | Identifiant stable du site et de la bibliothèque |
| DriveItemId | Identifiant Graph du fichier |
| NomFichier | Nom visible du document |
| UrlWeb | Lien SharePoint en lecture |
| Extension | pdf, pptx, docx, xlsx, etc. |
| Bibliotheque | Product ou Product Marketing Contents |
| Dossier | Chemin relatif |
| Produits | Valeur de métadonnée ou produits candidats |
| Domaine | Product, Marketing, Support ou autre |
| Langue | Langue déclarée |
| DateModification | Dernière modification source |
| ETag | Version source |
| StatutIndex | AIndexer, Indexe, Erreur, AbsentDeLaSource |
| DerniereIndexation | Date du dernier traitement |
| ErreurIndexation | Message court et non sensible |

## Règles de sécurité

- Accès aux bibliothèques en lecture seule.
- Aucun téléchargement ou recopie de contenu si le lien et les métadonnées suffisent.
- Ne jamais indexer les secrets, mots de passe ou données personnelles non nécessaires.
- Ne jamais utiliser l’index pour déclencher un envoi, une suppression ou une modification SharePoint.
- Toute source ambiguë ou sans métadonnées obligatoires reste consultable mais reçoit le statut `AValider`.

## Flux Power Automate à prévoir

### `AC - Indexation - Catalogue connaissances SharePoint`

- Déclencheur : récurrence quotidienne ou toutes les 4 heures.
- Charger les paramètres `SHAREPOINT_SITE_ID_PRODUCT`, `SHAREPOINT_DRIVE_ID_PRODUCT`, `SHAREPOINT_SITE_ID_MARKETING` et `SHAREPOINT_DRIVE_ID_MARKETING` depuis les variables d’environnement.
- Lire le delta depuis le jeton conservé dans `AssistantCommercial_Settings`.
- Pour chaque fichier, faire un upsert sur `SourceKey + DriveItemId`.
- Dédupliquer par `ETag` ou `lastModifiedDateTime`.
- Marquer les éléments retournés comme supprimés par Graph en `AbsentDeLaSource`.
- Produire un rapport Teams groupé : ajoutés, actualisés, erreurs et métadonnées manquantes.
- Ne jamais envoyer d’email et ne jamais modifier la bibliothèque source.

## Exploitation par AC - Produits

Le workflow fournit d’abord à AC - Produits les entrées candidates de l’index pour le produit détecté. L’agent consulte ensuite les documents SharePoint originaux nécessaires et cite leurs liens. Si aucun produit ou aucune source fiable n’est trouvé, il retourne une confiance basse et demande une précision à Jérémy.

## Déploiement progressif

1. Créer la liste d’index sans données sensibles.
2. Lancer le flux en mode rapport uniquement.
3. Contrôler les doublons, les liens et les métadonnées manquantes.
4. Brancher l’index à AC - Produits en lecture seule.
5. Tester `CF`, `CFN`, `CRM360`, `DMS`, `Digital Invoice` et `After Sales Planner`.
6. Activer la récurrence après validation des rapports.

