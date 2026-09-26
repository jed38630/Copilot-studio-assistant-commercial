# Exemple dashboard local avec OneDrive

Cet exemple évite une application Entra côté serveur. Il utilise le dossier OneDrive synchronisé sur le PC de Jérémy comme échange de fichiers avec Power Automate.

## Fonctionnement

```text
Power Automate -> dashboard-data.json -> OneDrive synchronisé -> serveur local -> dashboard HTML
dashboard HTML -> actions/*.json -> OneDrive -> Power Automate -> journalisation / brouillon
```

Le serveur local ne possède aucune route d’envoi ou de suppression. Les actions autorisées sont `ignore`, `classify` et `regenerate`. Chaque demande reçoit un `ActionId` unique et doit être dédupliquée dans Power Automate. Le prototype utilise la page racine avec un paramètre de requête pour éviter les blocages de certaines extensions de navigateur sur les chemins d’API locaux.

## Essai immédiat

Depuis PowerShell, à la racine du dépôt :

```powershell
$sync = Join-Path $HOME "OneDrive - Nextlane\Assistant Commercial Dashboard"
New-Item -ItemType Directory -Force "$sync\actions" | Out-Null
Copy-Item dashboard/local/data/dashboard-data.example.json "$sync\dashboard-data.json" -Force
$env:AC_ONEDRIVE_SYNC_DIR = $sync
npm run dashboard:local
```

Ouvrir ensuite `http://localhost:8090/`. Le fichier `dashboard-data.json` peut
être remplacé automatiquement toutes les cinq minutes par le flux
`AC - Dashboard - Exporter journal JSON OneDrive`. La procédure complète et le
contrat sont dans `power-automate/flows/AC-dashboard-export-json-onedrive.md`
et `power-automate/contracts/dashboard-data.schema.json`.

## Flux Power Automate à prévoir

1. Déclencheur : planifié toutes les 5 minutes.
2. Lire les lignes récentes du journal SharePoint.
3. Construire un objet JSON avec uniquement les champs nécessaires au dashboard.
4. Écrire ou remplacer `dashboard-data.json` dans le dossier OneDrive privé.
5. Second flux : déclencheur OneDrive « Lorsqu’un fichier est créé ou modifié » dans `actions`.
6. Lire l’`ActionId`, vérifier qu’il n’est pas déjà traité, puis journaliser et exécuter uniquement `ignore`, `classify` ou `regenerate`.
7. Mettre à jour le fichier d’action avec `Completed`, `Rejected` ou `Error`.

Le déclencheur OneDrive peut se répéter ; le contrôle `ActionId` est donc obligatoire. Ne pas partager le dossier par lien public et ne jamais y déposer de secret.
