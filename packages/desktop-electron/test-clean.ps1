Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试新版本 - 清理并检查目录创建" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "第一步：删除所有现有目录" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

Remove-Item -Path "C:\Users\shihao1.liu\.config\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\Users\shihao1.liu\.cimi\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\Users\shihao1.liu\.cache\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\Users\shihao1.liu\.cache\opencode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\Users\shihao1.liu\.local\share\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\Users\shihao1.liu\.local\share\opencode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\Users\shihao1.liu\.local\state\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\Users\shihao1.liu\.local\state\opencode" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "目录已清理完成" -ForegroundColor Green
Write-Host ""

Write-Host "第二步：启动打包后的应用" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
$appPath = "d:\code\cimicode\opencode_origin\opencode\packages\desktop-electron\dist\win-unpacked\Cimi.exe"
Write-Host "正在启动: $appPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "请等待应用完全启动（大约10-20秒）" -ForegroundColor Yellow
Write-Host ""

Start-Process -FilePath $appPath

Write-Host "等待15秒后检查目录创建..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "第三步：检查创建了哪些目录" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
Write-Host ""

# Check .config\cimicode
if (Test-Path "C:\Users\shihao1.liu\.config\cimicode") {
    Write-Host "[问题] .config\cimicode 目录被创建了" -ForegroundColor Red
    Get-ChildItem "C:\Users\shihao1.liu\.config\cimicode" | Format-Table -AutoSize
} else {
    Write-Host "[正确] .config\cimicode 目录没有被创建" -ForegroundColor Green
}

Write-Host ""

# Check .cimi\cimicode
if (Test-Path "C:\Users\shihao1.liu\.cimi\cimicode") {
    Write-Host "[正确] .cimi\cimicode 目录被创建了" -ForegroundColor Green
    Get-ChildItem "C:\Users\shihao1.liu\.cimi\cimicode" | Format-Table -AutoSize
} else {
    Write-Host "[问题] .cimi\cimicode 目录没有被创建" -ForegroundColor Red
}

Write-Host ""

# Check .cache\cimicode
if (Test-Path "C:\Users\shihao1.liu\.cache\cimicode") {
    Write-Host "[正确] .cache\cimicode 目录被创建了" -ForegroundColor Green
} else {
    Write-Host "[问题] .cache\cimicode 目录没有被创建" -ForegroundColor Red
}

Write-Host ""

# Check .local\share\cimicode
if (Test-Path "C:\Users\shihao1.liu\.local\share\cimicode") {
    Write-Host "[正确] .local\share\cimicode 目录被创建了" -ForegroundColor Green
} else {
    Write-Host "[问题] .local\share\cimicode 目录没有被创建" -ForegroundColor Red
}

Write-Host ""

# Check .local\state\cimicode
if (Test-Path "C:\Users\shihao1.liu\.local\state\cimicode") {
    Write-Host "[正确] .local\state\cimicode 目录被创建了" -ForegroundColor Green
} else {
    Write-Host "[问题] .local\state\cimicode 目录没有被创建" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
