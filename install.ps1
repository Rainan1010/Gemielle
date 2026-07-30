# Script cai dat Gemielle Extension tu xa hoac local cho Windows
$ErrorActionPreference = "Stop"

$dest = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Extensions\Gemielle"
$repoZipUrl = "https://github.com/Rainan1010/Gemielle/archive/refs/heads/main.zip"

Write-Host "🌸 Dang cai dat Gemielle Extension..." -ForegroundColor Cyan

# Dam bao thu muc dich ton tai
if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
}

# Kiem tra neu dang chay local (co manifest.json o thu muc hien tai hoac $PSScriptRoot)
$localSrc = $PSScriptRoot
if (-not $localSrc) { $localSrc = (Get-Location).Path }

if (Test-Path (Join-Path $localSrc "manifest.json")) {
    Write-Host "-> Phat hien file local, dang sao chep..." -ForegroundColor Yellow
    $items = @("manifest.json", "content.js", "style.css", "assets")
    foreach ($item in $items) {
        $itemPath = Join-Path $localSrc $item
        if (Test-Path $itemPath) {
            Copy-Item -Path $itemPath -Destination $dest -Recurse -Force
        }
    }
} else {
    Write-Host "-> Dang tai extension tu GitHub (Rainan1010/Gemielle)..." -ForegroundColor Yellow
    $tempZip = Join-Path $env:TEMP "Gemielle_main.zip"
    $tempExtract = Join-Path $env:TEMP "Gemielle_temp"

    if (Test-Path $tempZip) { Remove-Item $tempZip -Force }
    if (Test-Path $tempExtract) { Remove-Item $tempExtract -Recurse -Force }

    # Tai archive
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $repoZipUrl -OutFile $tempZip -UseBasicParsing
    
    # Giai nen
    Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force

    # Tim thu muc giai nen (thuong la Gemielle-main)
    $extractedFolder = Get-ChildItem -Path $tempExtract -Directory | Select-Object -First 1
    if ($extractedFolder) {
        $items = @("manifest.json", "content.js", "style.css", "assets")
        foreach ($item in $items) {
            $itemPath = Join-Path $extractedFolder.FullName $item
            if (Test-Path $itemPath) {
                Copy-Item -Path $itemPath -Destination $dest -Recurse -Force
            }
        }
    }

    # Don dep temp
    Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
    Remove-Item $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
}

# Copy duong dan vao Clipboard
Set-Clipboard -Value $dest

Write-Host "`n[OK] Da cai dat thanh cong extension vao: $dest" -ForegroundColor Green
Write-Host "[OK] Duong dan thu muc da duoc luu vao Clipboard!" -ForegroundColor Yellow
Write-Host "-> Dang mo trang chrome://extensions/..." -ForegroundColor Cyan

# Mo Chrome
Start-Process "chrome.exe" "chrome://extensions/" -ErrorAction SilentlyContinue

Write-Host "`n=== CAC BUOC TIEP THEO TREN CHROME ===" -ForegroundColor Magenta
Write-Host "1. Bat 'Che do danh cho nha phat trien' (Developer mode) o goc tren ben phai." -ForegroundColor White
Write-Host "2. Bam 'Tai tien ich da giai nen' (Load unpacked)." -ForegroundColor White
Write-Host "3. Nhan Ctrl + V de dan duong dan da copy va chon Select Folder." -ForegroundColor White
