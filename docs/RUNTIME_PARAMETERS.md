# Paramètres récupérés dans l’environnement Microsoft 365

Dernière vérification : 26 septembre 2026, session Chrome NEXTLANE connectée.

## Environnement

```text
ENVIRONMENT_ID=Default-5bc7adc6-fdce-46af-ab42-b2f503dc84c4
ENVIRONMENT_NAME=I'CAR SYSTEMS (default)
TENANT_DOMAIN=nextlane.com
SHAREPOINT_SITE_URL=https://onenextlane.sharepoint.com/sites/EquipeCommercialeZoneA
SHAREPOINT_HOST=onenextlane.sharepoint.com
```

Identifiant composite utilisable pour Microsoft Graph :

```text
SHAREPOINT_SITE_ID=onenextlane.sharepoint.com,6ba47452-dd25-497f-8744-5d24d17672c1,02dda702-f26c-415f-83fa-d459c7780522
```

Les GUID de site et de listes ne sont pas des secrets. Les secrets Entra ID, certificats et URL signées de déclenchement restent exclus de ce fichier et doivent être placés dans le coffre de l’hébergement.

## Listes SharePoint

```text
SHAREPOINT_LIST_EMAIL_LOG=e04252ca-f6f1-4ae2-8ac5-e85bea7362af
SHAREPOINT_LIST_DRAFT_LOG=0e9deab4-1523-49f4-9826-1f238d0346d8
SHAREPOINT_LIST_SETTINGS=d96b0170-da43-491a-8d67-5ce739cd8ac7
```

Noms confirmés : `AssistantCommercial_EmailLog2`, `AssistantCommercial_DraftLog` et `AssistantCommercial_Settings`.

## Flux observés

Le flux actif à conserver pour le traitement entrant est `AC - 24-7 - Nouvel email entrant`. Il est dans l’environnement Copilot Studio et son identifiant est conservé uniquement comme référence de diagnostic dans l’interface Microsoft.

Un ancien flux désactivé `À l'arrivée d'un nouvel e-mail (V3)` est visible dans Power Automate. Il ne doit pas être réactivé en parallèle afin d’éviter les doublons.

Les flux `AC - Générer CR PDF Salesforce` et `AC - Rattacher un CR existant à Salesforce` appartiennent à l’autre projet « Compte rendu commercial » et ne doivent pas être utilisés par le dashboard Assistant Commercial.

## Limite actuelle pour le dashboard

La liste Power Automate ne fournit pas d’URL HTTP publique pour le flux Copilot Studio temps réel. Le dashboard HTML peut donc déjà lire les listes via l’API serveur, mais les actions `ignore`, `classify` et `regenerate` nécessitent encore trois flux d’action dédiés avec un déclencheur HTTP sécurisé, ou une API interne qui appelle des connecteurs autorisés. Ne pas placer les URL signées de ces déclencheurs dans Git.
