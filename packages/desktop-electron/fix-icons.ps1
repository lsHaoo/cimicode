Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CimiCode Icon Fix Solution" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1/4: Stop all Cimi processes" -ForegroundColor Yellow
Stop-Process -Name "Cimi" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "Cimi Dev" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "OK - Processes stopped" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2/4: Clear Windows icon cache" -ForegroundColor Yellow
Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

$deletedCount = 0
$iconFiles = Get-ChildItem -Path "$env:LOCALAPPDATA" -Filter "IconCache*" -File -ErrorAction SilentlyContinue
foreach ($file in $iconFiles) {
    Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
    $deletedCount++
}

$explorerIconFiles = Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\Windows\Explorer" -Filter "IconCache*" -File -ErrorAction SilentlyContinue
foreach ($file in $explorerIconFiles) {
    Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
    $deletedCount++
}

Write-Host "OK - Deleted $deletedCount icon cache files" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3/4: Remove old shortcuts" -ForegroundColor Yellow
$shortcuts = @(
    "$env:USERPROFILE\Desktop\Cimi.lnk",
    "$env:USERPROFILE\Desktop\Cimi Dev.lnk",
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Cimi.lnk"
)

foreach ($shortcut in $shortcuts) {
    if (Test-Path $shortcut) {
        Remove-Item $shortcut -Force -ErrorAction SilentlyContinue
        Write-Host "OK - Removed: $shortcut" -ForegroundColor Green
    }
}
Write-Host ""

Write-Host "Step 4/4: Restart Windows Explorer" -ForegroundColor Yellow
Start-Process explorer.exe
Start-Sleep -Seconds 3
Write-Host "OK - Windows Explorer restarted" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Launch Cimi from Start Menu" -ForegroundColor Yellow
Write-Host "2. If icon is still wrong, restart your computer" -ForegroundColor Yellow
Write-Host "3. Or create manual shortcut:" -ForegroundColor Yellow
Write-Host "   - Right-click desktop -> New -> Shortcut" -ForegroundColor Cyan
Write-Host "   - Location: $env:LOCALAPPDATA\Programs\cimicode\Cimi.exe" -ForegroundColor Cyan
Write-Host "   - Right-click shortcut -> Properties -> Change Icon" -ForegroundColor Cyan
Write-Host "   - Browse to same .exe file and select it" -ForegroundColor Cyan
Write-Host ""

$restart = Read-Host "Restart computer now? (y/n)"
if ($restart -eq "y" -or $restart -eq "Y") {
    Write-Host "Restarting computer..." -ForegroundColor Red
    Start-Sleep -Seconds 2
    Restart-Computer -Force
} else {
    Write-Host "Skipped. Please manually check the icon." -ForegroundColor Yellow
}
