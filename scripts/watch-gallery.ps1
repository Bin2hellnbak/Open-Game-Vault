# Watches assets/images/galleries and regenerates images.json when files change
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/watch-gallery.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Resolve galleries root
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$galleriesPath = Join-Path $scriptRoot '..\assets\images\galleries'
$galleriesRoot = Resolve-Path -Path $galleriesPath -ErrorAction Stop

# Debounce timer
$debounceMs = 600
$timer = New-Object System.Timers.Timer
$timer.Interval = $debounceMs
$timer.AutoReset = $false

$regen = {
    try {
        Write-Host "[watch] Changes detected. Regenerating manifests..." -ForegroundColor Cyan
        powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $scriptRoot 'generate-gallery-manifests.ps1') | Write-Host
        Write-Host "[watch] Regeneration complete." -ForegroundColor Green
    } catch {
        Write-Warning $_
    }
}

$timer.add_Elapsed({ & $regen }) | Out-Null

$fsw = New-Object System.IO.FileSystemWatcher
$fsw.Path = $galleriesRoot
$fsw.Filter = '*.*'
$fsw.IncludeSubdirectories = $true
$fsw.EnableRaisingEvents = $true

$action = {
    # Restart debounce timer on any relevant event
    $timer.Stop()
    $timer.Start()
}

$createdReg = Register-ObjectEvent $fsw Created -Action $action
$changedReg = Register-ObjectEvent $fsw Changed -Action $action
$deletedReg = Register-ObjectEvent $fsw Deleted -Action $action
$renamedReg = Register-ObjectEvent $fsw Renamed -Action $action

Write-Host "Watching: $galleriesRoot" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop." -ForegroundColor DarkYellow

# Initial generation
& $regen

try {
    while ($true) { Start-Sleep -Seconds 1 }
} finally {
    Unregister-Event -SourceIdentifier $createdReg.Name -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier $changedReg.Name -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier $deletedReg.Name -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier $renamedReg.Name -ErrorAction SilentlyContinue
    $timer.Dispose()
    $fsw.Dispose()
}
