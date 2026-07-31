# Script go cai dat Gemielle Extension cho Windows
$ErrorActionPreference = "Stop"

$dest = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Extensions\Gemielle"

Write-Host "Dang go cai dat Gemielle Extension..." -ForegroundColor Cyan

if (Test-Path -Path $dest) {
    Remove-Item -Path $dest -Recurse -Force
    Write-Host "[OK] Da xoa thu muc Extension tai: $dest" -ForegroundColor Green
} else {
    Write-Host "[!] Khong tim thay thu muc Extension tai: $dest" -ForegroundColor Yellow
}

Write-Host "-> Dang mo trang chrome://extensions/..." -ForegroundColor Cyan
Start-Process "chrome.exe" "chrome://extensions/" -ErrorAction SilentlyContinue

Write-Host "`n=== HOAN THANH GO CAI DAT ===" -ForegroundColor Magenta
Write-Host "1. Vui long tim 'Gemielle' tren trang chrome://extensions/." -ForegroundColor White
Write-Host "2. Nhan 'Xoa' (Remove) de go han extension khoi Chrome." -ForegroundColor White
