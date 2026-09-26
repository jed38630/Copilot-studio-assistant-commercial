[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)] [string]$VmHost,
  [Parameter(Mandatory = $true)] [string]$VmUser,
  [string]$RemoteDirectory = "/opt/assistant-commercial",
  [string]$SshKeyPath = "$HOME/.ssh/id_ed25519",
  [switch]$BuildNoCache
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) { throw "OpenSSH client introuvable." }
if (-not (Get-Command scp -ErrorAction SilentlyContinue)) { throw "SCP introuvable." }
if (-not (Test-Path $SshKeyPath)) { throw "Clé SSH introuvable: $SshKeyPath" }
if (-not (Test-Path (Join-Path $repoRoot "deployment/proxmox/.env"))) {
  throw "Crée deployment/proxmox/.env avec les valeurs du tenant; ce fichier n'est jamais envoyé vers GitHub."
}

$sshArgs = @("-i", $SshKeyPath, "$VmUser@$VmHost")
& ssh @sshArgs "mkdir -p '$RemoteDirectory'"

& scp -i $SshKeyPath -r dashboard deployment package.json "$VmUser@${VmHost}:$RemoteDirectory/"
& scp -i $SshKeyPath deployment/proxmox/.env "$VmUser@${VmHost}:$RemoteDirectory/deployment/proxmox/.env"

$buildFlag = if ($BuildNoCache) { " --no-cache" } else { "" }
$command = "cd '$RemoteDirectory' && docker compose -f deployment/proxmox/docker-compose.yml up -d --build$buildFlag && docker compose -f deployment/proxmox/docker-compose.yml ps"
& ssh @sshArgs $command

Write-Host "Dashboard déployé sur http://$VmHost (accès LAN/VPN uniquement)."
