Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CimiCode Reinstall Wizard" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1/4: Cleaning old directories" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
Remove-Item -Path "$env:USERPROFILE\.config\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.cimi\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.cache\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.cache\opencode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:LOCALAPPDATA\Programs\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\ai.cimicode.desktop.dev" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\ai.cimicode.desktop" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "OK - Old directories cleaned" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2/4: Opening Control Panel" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
Write-Host "Please find 'Cimi' in the window and uninstall it" -ForegroundColor Cyan
Write-Host "Press any key after uninstall completes..." -ForegroundColor Cyan
control appwiz.cpl
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Step 3/4: Installing new version" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
$installerPath = "d:\code\cimicode\opencode_origin\opencode\packages\desktop-electron\dist\cimicode-electron-win-x64.exe"

if (Test-Path $installerPath) {
    Write-Host "Running installer..." -ForegroundColor Cyan
    Start-Process -FilePath $installerPath -Wait
    Write-Host "OK - Installation complete" -ForegroundColor Green
} else {
    Write-Host "ERROR: Installer not found" -ForegroundColor Red
    Write-Host "Path: $installerPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4/4: Testing new version" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
$installedApp = "$env:LOCALAPPDATA\Programs\cimicode\Cimi.exe"

if (Test-Path $installedApp) {
    Write-Host "Starting application..." -ForegroundColor Cyan
    Start-Process -FilePath $installedApp

    Write-Host "Waiting 15 seconds for initialization..." -ForegroundColor Cyan
    Start-Sleep -Seconds 15

    Write-Host ""
    Write-Host "Results:" -ForegroundColor Yellow
    Write-Host "----------------------------" -ForegroundColor Yellow

    $configPath = "$env:USERPROFILE\.config\cimicode"
    $cimiPath = "$env:USERPROFILE\.cimi\cimicode"

    if (Test-Path $configPath) {
        Write-Host "[ISSUE] .config\cimicode WAS CREATED!" -ForegroundColor Red
        Write-Host "Old version code might still be running" -ForegroundColor Red
    } else {
        Write-Host "[SUCCESS] .config\cimicode NOT created" -ForegroundColor Green
    }

    Write-Host ""
    if (Test-Path $cimiPath) {
        Write-Host "[OK] .cimi\cimicode was created" -ForegroundColor Green
    } else {
        Write-Host "[INFO] .cimi\cimicode not created yet (may need login)" -ForegroundColor Cyan
    }
} else {
    Write-Host "WARNING: Installed app not found" -ForegroundColor Red
    Write-Host "Path: $installedApp" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Reinstall Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
