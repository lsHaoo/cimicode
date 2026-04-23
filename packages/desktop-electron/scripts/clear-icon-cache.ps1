# Clear Windows Icon Cache Script
Write-Host "Clearing Windows Icon Cache..." -ForegroundColor Green

# Kill explorer.exe to release icon cache
Write-Host "Stopping Windows Explorer..." -ForegroundColor Yellow
Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue

# Wait for explorer to stop
Start-Sleep -Seconds 2

# Clear icon cache for all users
Write-Host "Deleting icon cache files..." -ForegroundColor Yellow

$iconCachePaths = @(
    "$env:LOCALAPPDATA\IconCache.db",
    "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache*",
    "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache*"
)

foreach ($path in $iconCachePaths) {
    if (Test-Path $path) {
        Remove-Item $path -Force -ErrorAction SilentlyContinue
        Write-Host "Deleted: $path" -ForegroundColor Gray
    }
}

# Clear all user icon caches
$userProfiles = Get-ChildItem "C:\Users" -Directory
foreach ($user in $userProfiles) {
    $userIconCache = Join-Path $user.FullName "AppData\Local\Microsoft\Windows\Explorer\iconcache*"
    $userThumbCache = Join-Path $user.FullName "AppData\Local\Microsoft\Windows\Explorer\thumbcache*"

    if (Test-Path $userIconCache) {
        Remove-Item $userIconCache -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path $userThumbCache) {
        Remove-Item $userThumbCache -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Icon cache cleared successfully!" -ForegroundColor Green
Write-Host "Starting Windows Explorer..." -ForegroundColor Yellow

# Restart explorer
Start-Process explorer.exe

Write-Host "Done! Please check your application icon now." -ForegroundColor Green
