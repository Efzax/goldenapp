param(
  [string]$SourcePath = "..\DashPSI\data\dashboard-data.json",
  [string]$TargetPath = ".\public\dashboard-data.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$resolvedSource = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $SourcePath))
$resolvedTarget = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $TargetPath))
$targetDirectory = [System.IO.Path]::GetDirectoryName($resolvedTarget)

if (-not (Test-Path -LiteralPath $resolvedSource)) {
  throw "No se encontro el archivo origen: $resolvedSource"
}

if (-not (Test-Path -LiteralPath $targetDirectory)) {
  New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
}

Copy-Item -LiteralPath $resolvedSource -Destination $resolvedTarget -Force
Write-Host "Data comercial sincronizada en $resolvedTarget"
