# Generates images.json files for each gallery folder under assets/games/galleries
# Usage (from project root or anywhere):
#   powershell -ExecutionPolicy Bypass -File scripts/generate-gallery-manifests.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Resolve the galleries root relative to this script location, with a fallback to CWD
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$galleriesPath = Join-Path $scriptRoot '..\assets\games\galleries'
try {
    $galleriesRoot = Resolve-Path -Path $galleriesPath -ErrorAction Stop
} catch {
    $galleriesRoot = Resolve-Path -Path (Join-Path (Get-Location) 'assets\games\galleries') -ErrorAction SilentlyContinue
}
if (-not $galleriesRoot) {
    Write-Error "Could not find assets\\games\\galleries. Run this from the project or adjust the script path."
    exit 1
}

# File extensions are matched via regex below

# Iterate each subfolder (slug)
$dirs = Get-ChildItem -Path $galleriesRoot -Directory
if (-not $dirs) {
    Write-Host "No subfolders found under $galleriesRoot" -ForegroundColor Yellow
}

foreach ($dir in $dirs) {
    $files = @(
        Get-ChildItem -Path $dir.FullName -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Extension -match '^(?i)\.(jpg|jpeg|png|webp|gif|mp4|webm|ogg)$' } |
            Sort-Object Name |
            ForEach-Object { $_.Name }
    )
    $outPath = Join-Path $dir.FullName 'images.json'
    if ($files.Count -gt 0) {
        # Ensure JSON is an array even for a single item (manual build to avoid edge-cases)
        $quoted = $files | ForEach-Object { '"' + ($_ -replace '"', '\\"') + '"' }
        $json = '[' + ($quoted -join ',') + ']'
        # Write UTF-8 without BOM for web servers
        [System.IO.File]::WriteAllText($outPath, $json, (New-Object System.Text.UTF8Encoding($false)))
        Write-Host "Wrote $(($files | Measure-Object).Count) entries -> $outPath" -ForegroundColor Green
    } else {
        # Remove stale images.json if exists and no files present
        if (Test-Path $outPath) {
            Remove-Item $outPath -Force
            Write-Host "Removed empty manifest $outPath" -ForegroundColor Yellow
        } else {
            Write-Host "No media files in $($dir.Name); skipped." -ForegroundColor DarkYellow
        }
    }
}

Write-Host "Done." -ForegroundColor Cyan
