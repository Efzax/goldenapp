param(
  [string]$DashPsiPath = "..\DashPSI",
  [string]$GoldenAppDataPath = ".\app\data\dashboard-data.json",
  [switch]$PushToGitHub,
  [string]$CommitMessage = "Update commercial dashboard data"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-AbsolutePath {
  param(
    [string]$BasePath,
    [string]$RelativePath
  )

  return [System.IO.Path]::GetFullPath((Join-Path $BasePath $RelativePath))
}

$goldenAppRoot = (Get-Location).Path
$dashPsiRoot = Resolve-AbsolutePath -BasePath $goldenAppRoot -RelativePath $DashPsiPath
$exportScriptPath = Join-Path $dashPsiRoot "scripts\export-dashboard-data.ps1"
$syncScriptPath = Join-Path $goldenAppRoot "app\scripts\sync-commercial-data.ps1"
$targetDataPath = Resolve-AbsolutePath -BasePath $goldenAppRoot -RelativePath $GoldenAppDataPath
$workbookPath = Join-Path $dashPsiRoot "2026 - Matrix_Dash.xlsm"
$dashPsiOutputPath = Join-Path $dashPsiRoot "data\dashboard-data.json"

if (-not (Test-Path -LiteralPath $exportScriptPath)) {
  throw "No se encontró el exportador en: $exportScriptPath"
}

if (-not (Test-Path -LiteralPath $syncScriptPath)) {
  throw "No se encontró el script de sincronización en: $syncScriptPath"
}

Write-Host "1/3 Exportando data desde DashPSI..."
& powershell -ExecutionPolicy Bypass -File $exportScriptPath -WorkbookPath $workbookPath -OutputPath $dashPsiOutputPath

Write-Host "2/3 Sincronizando data a GoldenApp..."
& powershell -ExecutionPolicy Bypass -File $syncScriptPath

if (-not (Test-Path -LiteralPath $targetDataPath)) {
  throw "La data sincronizada no existe en: $targetDataPath"
}

$statusOutput = git status --short -- app\data\dashboard-data.json 2>$null

Write-Host "3/3 Listo."
Write-Host "Archivo actualizado: $targetDataPath"

if ($PushToGitHub) {
  Write-Host "Sincronizando con GitHub..."
  git add app\data\dashboard-data.json | Out-Null
  git commit -m $CommitMessage
  git push
  Write-Host "GitHub actualizado correctamente."
}
else {
  if ($statusOutput) {
    Write-Host ""
    Write-Host "Cambios detectados y listos para GitHub."
    Write-Host "Siguiente paso:"
    Write-Host "  git add ."
    Write-Host "  git commit -m `"$CommitMessage`""
    Write-Host "  git push"
  }
  else {
    Write-Host ""
    Write-Host "No se detectaron cambios pendientes para GitHub."
  }
}
