# Déploiement Docker sur Proxmox

## Principe

Docker s'exécute dans une VM Linux ou un conteneur LXC Debian Proxmox. La stack contient :

- `dashboard-web` : Nginx sert le HTML et relaie `/api` vers l'API ;
- `dashboard-api` : API Node existante, lecture Graph des journaux et mise en file des actions autorisées.

Le dashboard utilise l'API same-origin en mode `auto` lorsqu'il est servi par Nginx. Le fichier ouvert depuis SharePoint reste une prévisualisation et ne doit pas être utilisé comme URL de production.

## Prérequis VM ou LXC

- VM Linux ou conteneur LXC Debian 12 existant sur Proxmox ;
- Docker Engine et Docker Compose v2 ;
- accès SSH par clé ;
- port du dashboard accessible uniquement sur le LAN ou via VPN ;
- inscription d'application Entra ID et consentement administrateur pour les permissions SharePoint nécessaires ;
- aucune permission d’envoi d’e-mail.

Le script ne crée pas la VM ou le LXC Proxmox : il déploie la stack dans une machine déjà préparée. La création automatique de l’infrastructure exige les paramètres du cluster qui ne figurent pas dans le dépôt.

## Déploiement

1. Copier `deployment/proxmox/.env.example` vers `deployment/proxmox/.env`.
2. Renseigner les valeurs réelles uniquement dans `.env` ou dans un coffre de secrets.
3. Vérifier que `.env` reste ignoré par Git.
4. Depuis PowerShell :

```powershell
./scripts/deploy-proxmox.ps1 -VmHost 192.168.1.50 -VmUser assistant -SshKeyPath "$HOME/.ssh/id_ed25519"
```

Pour reconstruire sans cache :

```powershell
./scripts/deploy-proxmox.ps1 -VmHost 192.168.1.50 -VmUser assistant -BuildNoCache
```

Le script transfère le dashboard, l'API, les fichiers Docker et la configuration locale, puis exécute `docker compose up -d --build` à distance. Il est relançable sans créer de doublon.

## Sécurité avant ouverture

- Ne pas publier le port directement sur Internet.
- Utiliser un VPN ou un reverse proxy HTTPS avec authentification Entra ID.
- Ne jamais mettre `.env`, un secret client ou une URL privée de workflow dans Git.
- Vérifier que l'API n'expose que `GET /api/dashboard/emails` et `POST /api/dashboard/actions`.
- Les actions restent limitées à `ignore`, `classify` et `regenerate` ; aucun envoi ni suppression directe.
- Tester la journalisation et les doublons avant usage quotidien.

## Vérification

```bash
docker compose -f deployment/proxmox/docker-compose.yml ps
docker compose -f deployment/proxmox/docker-compose.yml logs --tail=100 dashboard-api
curl http://localhost:8080/
```

La page doit afficher le mode connecté dès que l'API répond. Si les variables Graph sont incomplètes, l'interface reste disponible mais l'erreur doit être visible dans les journaux ; aucun email ne doit être envoyé.

## Déploiement réalisé pour Assistant Commercial

Le 26 septembre 2026, la stack a été déployée sur le CT LXC 113 `assistant-commercial` :

- adresse LAN : `192.168.0.87` ;
- URL de test LAN : `http://192.168.0.87:8080/` ;
- login SSH : `deploy` ;
- authentification : clé RSA locale dédiée, non versionnée ;
- répertoire distant : `/home/deploy/assistant-commercial` ;
- statut : conteneurs `dashboard-web` et `dashboard-api` actifs.

Le compte `deploy` ne doit pas recevoir de mot de passe communiqué : l’accès se fait par clé SSH. Le mot de passe `root` reste géré uniquement dans Proxmox. Le dashboard sert actuellement les données de démonstration, car `TENANT_ID`, `CLIENT_ID` et `CLIENT_SECRET` ne sont pas encore renseignés dans le fichier `.env` local à la machine.
