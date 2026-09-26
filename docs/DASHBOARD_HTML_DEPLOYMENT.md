# Déploiement du dashboard HTML

## Choix technique

Le dashboard HTML/CSS/JavaScript est l’interface principale. PHP n’apporte pas de capacité Microsoft 365 particulière : l’authentification, les permissions et les appels SharePoint/Power Automate doivent de toute façon être portés par une couche serveur. La cible recommandée est donc :

```text
Navigateur
  -> dashboard HTML/CSS/JavaScript
  -> API serveur TypeScript (Azure Function ou App Service)
  -> SharePoint / Power Automate / liens Outlook
```

Une API TypeScript est préférée à PHP pour rester dans le même langage que les scripts du dépôt et utiliser facilement Microsoft Graph et les bibliothèques Microsoft. Un hébergement statique seul convient pour la maquette, mais ne doit pas contenir de secret ni de jeton permanent.

## Voie MVP sans licence Premium : hébergement SharePoint

La voie retenue pour rendre le dashboard utilisable sans déclencheur HTTP Premium est de déposer les fichiers HTML, CSS et JavaScript dans `Site Assets` du site `Equipe Commerciale Zone A`. Le mode `auto` de `dashboard/config.js` détecte cet hébergement et utilise l’API REST du même site :

```text
Page SharePoint / Site Assets
  -> API REST SharePoint avec la session Microsoft 365
  -> AssistantCommercial_EmailLog2
  -> AssistantCommercial_DashboardActions
  -> flux SharePoint standard « Lors de la création d’un élément »
  -> Copilot Studio / Outlook / journaux
```

La liste `AssistantCommercial_DashboardActions` et son flux sont décrits dans `sharepoint/schema/AssistantCommercial_DashboardActions.md` et `power-automate/flows/AC-dashboard-actions-queue.md`. Cette option ne nécessite ni secret dans le navigateur ni URL de déclenchement exposée. Elle nécessite en revanche que l’administrateur autorise l’hébergement de fichiers HTML/JavaScript dans le site et que les permissions de la liste d’actions soient limitées.

Si le tenant bloque l’exécution de JavaScript dans `Site Assets`, conserver la même API REST et publier l’interface sous forme de page moderne avec un composant approuvé, ou utiliser l’option Azure/Entra ID ci-dessous. Ne pas contourner les règles de sécurité du tenant.

## Contrat API du dashboard

Configurer `dashboard/config.js` à partir de `dashboard/config.example.js` uniquement avec l’URL publique de l’API. Les paramètres SharePoint récupérés sont documentés dans [`RUNTIME_PARAMETERS.md`](RUNTIME_PARAMETERS.md) :

```js
window.AC_CONFIG = {
  apiBaseUrl: "https://<api-publique>/assistant-commercial",
  mode: "api",
  refreshIntervalMs: 60000
};
```

L’API expose :

`GET /api/dashboard/emails`

- Retourne `{ "items": [...] }`.
- Les éléments utilisent au minimum `MessageId`, `ConversationId`, `Expediteur`, `Objet`, `DateReception`, `Categorie`, `NiveauConfiance`, `Decision`, `ActionEffectuee`, `LienEmail`, `LienBrouillon`, `BrouillonCree` et les champs de contexte disponibles.
- La source est `AssistantCommercial_EmailLog2`, enrichie par `AssistantCommercial_DraftLog` si nécessaire.

`POST /api/dashboard/actions`

```json
{
  "action": "ignore | classify | regenerate",
  "messageId": "<MessageId>",
  "category": "<catégorie optionnelle>",
  "instruction": "<instruction optionnelle>"
}
```

Le serveur valide l’action, vérifie le `MessageId`, appelle le flux Power Automate correspondant et journalise l’opération. `regenerate` prépare un nouveau brouillon ; il ne l’envoie jamais. L’ouverture d’Outlook reste une navigation vers `LienEmail` ou `LienBrouillon`, sans appel serveur d’envoi.

## Authentification et sécurité

- Utiliser Microsoft Entra ID pour protéger l’API.
- Conserver `CLIENT_SECRET`, certificats et URL de déclenchement des flows côté serveur ou dans les secrets de l’hébergement.
- Ne pas mettre de secret dans `config.js`, `app.js` ou le dépôt Git.
- Limiter l’API aux données de Jérémy ou au périmètre commercial autorisé.
- Refuser toute action `send`, `sendDraft`, `delete` ou équivalent au niveau de l’API.
- Ajouter une protection anti-rejeu et journaliser l’utilisateur, l’action, le `MessageId`, le résultat et l’erreur éventuelle.

## Hébergement recommandé

Pour un MVP : Azure Static Web Apps pour les fichiers HTML et une Azure Function TypeScript pour l’API.

Pour une entreprise déjà équipée : App Service ou un hébergement web interne avec une Function/API TypeScript derrière Entra ID.

Éviter d’ouvrir directement SharePoint ou Graph au navigateur : le serveur doit contrôler les permissions et centraliser les garde-fous.

## État actuel

Le front-end contient maintenant l’adaptateur API et fonctionne encore en mode mock par défaut. La bascule live nécessite de créer l’API protégée et ses deux flux d’action dans le tenant. Aucun endpoint réel n’est inventé dans le dépôt et aucun email ne peut être envoyé par le dashboard.

Un squelette Node sans dépendance est fourni dans `dashboard/api/server.mjs`. Il lit les éléments SharePoint via Microsoft Graph et relaie uniquement `ignore`, `classify` et `regenerate` vers des URL de flux placées dans les variables d’environnement. Il ne contient aucune route d’envoi ni de suppression. Avant production, placer cette API derrière Entra ID ou une passerelle équivalente et accorder uniquement les permissions SharePoint nécessaires en lecture et journalisation.

## Flux Power Automate de lecture créé dans le tenant

Un flux nommé `AC - Dashboard - Lire journaux` a été enregistré pour valider le contrat HTTP de lecture : déclencheur HTTP, lecture SharePoint de `AssistantCommercial_EmailLog2`, puis action `Réponse` JSON. Power Automate le signale comme dépendant d’une licence Premium et indique qu’il ne peut pas être utilisé dans l’état actuel. Il reste un artefact de préparation et de validation du contrat, pas un endpoint de production.

Ne pas publier son URL dans `dashboard/config.js` et ne pas la transmettre au navigateur. Une URL de déclenchement Power Automate est un secret opérationnel. La mise en production doit passer par une API derrière Entra ID, ou par l’activation explicite de la licence Premium et une passerelle serveur qui conserve l’URL hors du front-end.

La configuration live ne doit être changée que lorsque les trois conditions sont réunies :

1. l’API répond réellement à `GET /api/dashboard/emails` avec `{ "items": [...] }` ;
2. l’authentification Entra ID et les permissions SharePoint ont été validées par l’administrateur ;
3. les routes d’action `ignore`, `classify` et `regenerate` sont créées, journalisées et vérifiées sans envoi ni suppression.
