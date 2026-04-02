param(
  [string]$SourcePath = "..\DashPSI\data\dashboard-data.json",
  [string]$TargetPath = ".\app\data\dashboard-data.json"
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

$content = Get-Content -LiteralPath $resolvedSource -Raw
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($resolvedTarget, $content, $utf8NoBom)
Write-Host "Data comercial sincronizada en $resolvedTarget"
