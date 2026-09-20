# Configuration Microsoft Graph

## Objectif

Permettre à Power Automate ou au connecteur personnalisé d'accéder à Outlook pour lire les emails, créer les dossiers, déplacer les messages et créer des brouillons.

## App Registration Entra ID

1. Ouvrir Microsoft Entra admin center.
2. Aller dans App registrations.
3. Créer une application nommée `Assistant Commercial Graph`.
4. Configurer le type de compte selon la politique tenant.
5. Créer un secret client uniquement si nécessaire.
6. Stocker le secret dans une connexion sécurisée ou un coffre, jamais dans le repo.

## Permissions Graph autorisées

- `Mail.ReadWrite`
- `User.Read`
- `offline_access` si un flux nécessite un refresh token

Permission interdite :
- `Mail&#46;Send`

Cette permission d’envoi direct ne doit pas être demandée, consentie ni configurée.

## Validation admin

Peut être nécessaire pour :
- Consentement à `Mail.ReadWrite`.
- Politique DLP Power Platform.
- Connecteur personnalisé Graph.
- Accès applicatif restreint à une boîte.

## Endpoints utilisés

Lister les dossiers :

```http
GET /users/{id | userPrincipalName}/mailFolders
```

Créer un dossier racine :

```http
POST /users/{id | userPrincipalName}/mailFolders
```

Lister les messages Inbox :

```http
GET /users/{id | userPrincipalName}/mailFolders/inbox/messages
```

Lire un message :

```http
GET /users/{id | userPrincipalName}/messages/{messageId}
```

Créer un brouillon de réponse :

```http
POST /users/{id | userPrincipalName}/messages/{messageId}/createReply
```

Créer un brouillon autonome :

```http
POST /users/{id | userPrincipalName}/messages
```

Déplacer un message :

```http
POST /users/{id | userPrincipalName}/messages/{messageId}/move
```

Mettre à jour les catégories :

```http
PATCH /users/{id | userPrincipalName}/messages/{messageId}
```

## Connecteur personnalisé

Le fichier OpenAPI est disponible ici :

```text
graph/openapi/graph-outlook-assistant-commercial.yaml
```

Avant import :
1. Remplacer ou valider l’URL serveur Graph.
2. Configurer OAuth 2.0 Azure AD.
3. Vérifier les scopes autorisés.
4. Contrôler qu’aucune action d’envoi direct n’est présente.

## Références Microsoft

- [List mailFolders](https://learn.microsoft.com/en-us/graph/api/user-list-mailfolders?view=graph-rest-1.0)
- [Create MailFolder](https://learn.microsoft.com/en-us/graph/api/user-post-mailfolders?view=graph-rest-1.0)
- [Create message draft](https://learn.microsoft.com/en-us/graph/api/user-post-messages?view=graph-rest-1.0)
- [Create reply draft](https://learn.microsoft.com/en-us/graph/api/message-createreply?view=graph-rest-1.0)
- [Move message](https://learn.microsoft.com/en-us/graph/api/message-move?view=graph-rest-1.0)
