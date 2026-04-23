Write-Host "Waiting for installation to complete..." -ForegroundColor Yellow
Write-Host "Press any key when installation is complete..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Testing new installation..." -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

$installedApp = "$env:LOCALAPPDATA\Programs\cimicode\Cimi.exe"

if (Test-Path $installedApp) {
    Write-Host "Found installed app: $installedApp" -ForegroundColor Green

    Write-Host ""
    Write-Host "Starting application..." -ForegroundColor Cyan
    Start-Process -FilePath $installedApp

    Write-Host "Waiting 20 seconds for initialization..." -ForegroundColor Cyan
    Start-Sleep -Seconds 20

    Write-Host ""
    Write-Host "Final Results:" -ForegroundColor Yellow
    Write-Host "----------------------------" -ForegroundColor Yellow

    $configPath = "$env:USERPROFILE\.config\cimicode"
    $cimiPath = "$env:USERPROFILE\.cimi\cimicode"
    $cachePath = "$env:USERPROFILE\.cache\cimicode"

    $configExists = Test-Path $configPath
    $cimiExists = Test-Path $cimiPath
    $cacheExists = Test-Path $cachePath

    Write-Host ""
    if ($configExists) {
        Write-Host "[ISSUE] .config\cimicode EXISTS - OLD CODE STILL RUNNING!" -ForegroundColor Red
        Write-Host "Path: $configPath" -ForegroundColor Red
        Write-Host "Created: $((Get-Item $configPath).CreationTime)" -ForegroundColor Red
    } else {
        Write-Host "[SUCCESS] .config\cimicode NOT created - NEW CODE WORKING!" -ForegroundColor Green
    }

    Write-Host ""
    if ($cimiExists) {
        Write-Host "[OK] .cimi\cimicode created - Using new config path" -ForegroundColor Green
        Write-Host "Path: $cimiPath" -ForegroundColor Green
    } else {
        Write-Host "[INFO] .cimi\cimicode not created yet (may need user interaction)" -ForegroundColor Cyan
    }

    Write-Host ""
    if ($cacheExists) {
        Write-Host "[OK] .cache\cimicode created" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    if ($configExists) {
        Write-Host "RESULT: ISSUE - Old code still running" -ForegroundColor Red
    } else {
        Write-Host "RESULT: SUCCESS - New code working!" -ForegroundColor Green
    }
    Write-Host "========================================" -ForegroundColor Cyan

} else {
    Write-Host "ERROR: Installed app not found" -ForegroundColor Red
    Write-Host "Expected: $installedApp" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check if installation completed successfully" -ForegroundColor Yellow
}
