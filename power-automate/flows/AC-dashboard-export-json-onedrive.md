# AC - Dashboard - Export périodique du journal vers JSON OneDrive

## Objectif

Reconstruire régulièrement `dashboard-data.json` à partir de la liste SharePoint
`AssistantCommercial_EmailLog2`, afin que le dashboard local lise des données
fraîches via le dossier OneDrive synchronisé.

Ce flux est un flux de lecture et d’export uniquement. Il ne lit pas les boîtes
Outlook, ne crée aucun brouillon, n'envoie aucun message et ne supprime aucun
élément.

## Paramètres recommandés

- Nom : `AC - Dashboard - Exporter journal JSON OneDrive`
- Déclencheur : **Récurrence**, toutes les 5 minutes
- Fuseau : `Europe/Paris`
- Concurrence du déclencheur : `1`
- Site SharePoint : `Equipe Commerciale Zone A`
- Liste source : `AssistantCommercial_EmailLog2`
- Fichier cible OneDrive : `Assistant Commercial Dashboard/dashboard-data.json`
- Format racine : `{ "generatedAt": "...", "source": "...", "items": [] }`

Une fréquence d'une minute n'est pas nécessaire pour un tableau de bord humain
et peut augmenter inutilement les appels du connecteur. Cinq minutes donne une
lecture quasi temps réel tout en restant raisonnable pour un flux standard.

## Étapes Power Automate

### 1. Déclencheur

Ajouter **Planification - Récurrence** : intervalle `5`, fréquence `Minute`,
fuseau `Europe/Paris`. Activer le contrôle de simultanéité avec un degré
parallèle de `1`.

### 2. Lire le journal

Ajouter SharePoint **Obtenir les éléments** avec le site et la liste indiqués.
Activer la pagination dans les paramètres de l'action. Conserver au maximum
500 ou 1 000 éléments selon la capacité de la liste, idéalement via une vue
SharePoint triée par `DateTraitement` décroissante.

### 3. Projeter un contrat stable

Ajouter **Sélectionner**. Dans `À partir de`, utiliser la valeur retournée par
**Obtenir les éléments**. Les noms exacts peuvent être choisis dans le contenu
dynamique ; les expressions de référence sont :

```text
MessageId              item()?['MessageId']
ConversationId         item()?['ConversationId']
DateReception          item()?['DateReception']
Expediteur             item()?['Expediteur']
Objet                  item()?['Objet']
ResumeEmail            item()?['ResumeEmail']
DomainePrincipal       item()?['DomainePrincipal']
SousType               item()?['SousType']
ProduitPrincipal       item()?['ProduitPrincipal']
Categorie              item()?['Categorie']
ScorePriorite          item()?['ScorePriorite']
NiveauConfiance        item()?['NiveauConfiance']
StatutValidation       item()?['StatutValidation']
ActionEffectuee        item()?['ActionEffectuee']
RaisonDecision         item()?['RaisonDecision']
LienEmail              item()?['LienEmail']
LienBrouillon          item()?['LienBrouillon']
DateTraitement         item()?['DateTraitement']
Erreur                 item()?['Erreur']
```

Si le connecteur expose les champs sous `fields`, utiliser par exemple
`item()?['fields']?['MessageId']`. Ne pas mélanger les deux formes dans le
contrat final.

### 4. Construire le document

Créer un objet avec **Composer** à partir de `body('Sélectionner')` :

```json
{
  "generatedAt": "@{formatDateTime(utcNow(),'yyyy-MM-ddTHH:mm:ssZ')}",
  "source": "AssistantCommercial_EmailLog2",
  "items": "@{body('Sélectionner')}"
}
```

Dans Power Automate, insérer `items` avec l'expression dynamique (pas comme une
chaîne littérale) afin de conserver un tableau JSON. Le contrat complet est
versionné dans `power-automate/contracts/dashboard-data.schema.json`.

### 5. Écrire dans OneDrive

Utiliser OneDrive Entreprise **Obtenir les métadonnées du fichier à l'aide du
chemin** sur `/Assistant Commercial Dashboard/dashboard-data.json`, puis une
condition :

- fichier trouvé : **Mettre à jour le fichier** avec la sortie du Composer ;
- fichier absent : **Créer un fichier** dans `Assistant Commercial Dashboard`
  avec le nom `dashboard-data.json`.

Si nécessaire, écrire d'abord `dashboard-data.tmp.json`, vérifier le JSON, puis
le renommer/remplacer. Ne jamais supprimer le fichier courant avant d'avoir
produit un JSON valide.

### 6. Gestion des erreurs

Ajouter une portée `Erreur export dashboard` configurée en **a échoué**, **a été
ignorée** ou **a expiré** sur les étapes précédentes. Conserver le dernier JSON
valide afin que le dashboard affiche le dernier état connu plutôt qu'un fichier
vide ou partiellement écrit.

## Vérification fonctionnelle

1. Exécuter le flux manuellement une première fois.
2. Vérifier `generatedAt`, `source` et `items` dans OneDrive.
3. Ouvrir `http://localhost:8090/` et attendre le rafraîchissement automatique.
4. Ajouter ou modifier une ligne de test dans `AssistantCommercial_EmailLog2`.
5. Attendre au plus cinq minutes et vérifier la nouvelle date de génération.
6. Contrôler qu'un échec du flux ne vide pas le JSON précédent.

## Garde-fous

- Aucun connecteur Outlook n'est requis pour cet export.
- Aucune permission d'envoi de courrier n'est utilisée ou demandée.
- Aucune suppression de message ou de fichier métier n'est effectuée.
- Le fichier OneDrive reste privé et n'est pas partagé par lien public.
- Les actions restent dans `actions/*.json` et sont dédupliquées par `ActionId`.
- Les secrets et identifiants ne doivent pas être placés dans le dépôt ni dans
  le JSON exporté.

## Limites connues

OneDrive doit être synchronisé sur le poste qui exécute le serveur local. Pour
un usage 24/7 multi-utilisateur, il faudra ultérieurement une API protégée par
Entra ID ou un autre hébergement authentifié.
