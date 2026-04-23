Write-Host "Testing directory creation..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Cleaning directories..." -ForegroundColor Yellow
Remove-Item -Path "$env:USERPROFILE\.config\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.cimi\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.cache\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.cache\opencode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.local\share\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.local\share\opencode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.local\state\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.local\state\opencode" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Directories cleaned" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Starting application..." -ForegroundColor Yellow
$appPath = "d:\code\cimicode\opencode_origin\opencode\packages\desktop-electron\dist\win-unpacked\Cimi.exe"
Write-Host "Starting: $appPath"
Start-Process -FilePath $appPath

Write-Host "Waiting 15 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "Step 3: Checking created directories..." -ForegroundColor Yellow
Write-Host ""

$configPath = "$env:USERPROFILE\.config\cimicode"
$cimiPath = "$env:USERPROFILE\.cimi\cimicode"
$cachePath = "$env:USERPROFILE\.cache\cimicode"
$sharePath = "$env:USERPROFILE\.local\share\cimicode"
$statePath = "$env:USERPROFILE\.local\state\cimicode"

if (Test-Path $configPath) {
    Write-Host "[ISSUE] .config\cimicode was created" -ForegroundColor Red
} else {
    Write-Host "[OK] .config\cimicode was NOT created" -ForegroundColor Green
}

if (Test-Path $cimiPath) {
    Write-Host "[OK] .cimi\cimicode was created" -ForegroundColor Green
} else {
    Write-Host "[ISSUE] .cimi\cimicode was NOT created" -ForegroundColor Red
}

if (Test-Path $cachePath) {
    Write-Host "[OK] .cache\cimicode was created" -ForegroundColor Green
} else {
    Write-Host "[ISSUE] .cache\cimicode was NOT created" -ForegroundColor Red
}

if (Test-Path $sharePath) {
    Write-Host "[OK] .local\share\cimicode was created" -ForegroundColor Green
} else {
    Write-Host "[ISSUE] .local\share\cimicode was NOT created" -ForegroundColor Red
}

if (Test-Path $statePath) {
    Write-Host "[OK] .local\state\cimicode was created" -ForegroundColor Green
} else {
    Write-Host "[ISSUE] .local\state\cimicode was NOT created" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test complete" -ForegroundColor Cyan
