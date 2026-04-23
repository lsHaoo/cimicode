Write-Host "Starting real-time directory monitoring..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Clean all directories" -ForegroundColor Yellow
Remove-Item -Path "$env:USERPROFILE\.config\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.cimi\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.cache\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.local\share\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.local\state\cimicode" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Cleaned. Starting app in 3 seconds..." -ForegroundColor Green
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Step 2: Starting application" -ForegroundColor Yellow
$appPath = "d:\code\cimicode\opencode_origin\opencode\packages\desktop-electron\dist\win-unpacked\Cimi.exe"
Write-Host "Starting: $appPath"
$process = Start-Process -FilePath $appPath -PassThru

Write-Host "Process ID: $($process.Id)" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 3: Monitoring directories for 30 seconds..." -ForegroundColor Yellow
Write-Host "Checking every 2 seconds..." -ForegroundColor Cyan
Write-Host ""

for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 2

    $configExists = Test-Path "$env:USERPROFILE\.config\cimicode"
    $cimiExists = Test-Path "$env:USERPROFILE\.cimi\cimicode"
    $cacheExists = Test-Path "$env:USERPROFILE\.cache\cimicode"
    $shareExists = Test-Path "$env:USERPROFILE\.local\share\cimicode"
    $stateExists = Test-Path "$env:USERPROFILE\.local\state\cimicode"

    $time = Get-Date -Format "HH:mm:ss"
    Write-Host "[$time] Config:$configExists Cimi:$cimiExists Cache:$cacheExists Share:$shareExists State:$stateExists"

    if ($configExists -or $cimiExists -or $cacheExists -or $shareExists -or $stateExists) {
        Write-Host "  -> Directories created!" -ForegroundColor Green
        break
    }
}

Write-Host ""
Write-Host "Final check after 30 seconds..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "$env:USERPROFILE\.config\cimicode") {
    Write-Host "[ISSUE] .config\cimicode EXISTS" -ForegroundColor Red
} else {
    Write-Host "[OK] .config\cimicode does NOT exist" -ForegroundColor Green
}

if (Test-Path "$env:USERPROFILE\.cimi\cimicode") {
    Write-Host "[OK] .cimi\cimicode EXISTS" -ForegroundColor Green
} else {
    Write-Host "[ISSUE] .cimi\cimicode does NOT exist" -ForegroundColor Red
}

Write-Host ""
Write-Host "Monitor complete. App process still running: $($process.HasExited)" -ForegroundColor Cyan
