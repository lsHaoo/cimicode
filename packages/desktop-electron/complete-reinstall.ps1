Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CimiCode 重装向导" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "步骤 1/4：清理旧目录" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
Remove-Item -Path "$env:USERPROFILE\.config\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.cimi\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.cache\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.cache\opencode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:LOCALAPPDATA\Programs\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\ai.cimicode.desktop.dev" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\ai.cimicode.desktop" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✓ 旧目录已清理" -ForegroundColor Green
Write-Host ""

Write-Host "步骤 2/4：打开控制面板" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
Write-Host "请在打开的窗口中找到 'Cimi' 并卸载" -ForegroundColor Cyan
Write-Host "卸载完成后，按任意键继续..." -ForegroundColor Cyan
control appwiz.cpl
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "步骤 3/4：安装新版本" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
$installerPath = "d:\code\cimicode\opencode_origin\opencode\packages\desktop-electron\dist\cimicode-electron-win-x64.exe"

if (Test-Path $installerPath) {
    Write-Host "正在运行安装程序..." -ForegroundColor Cyan
    Start-Process -FilePath $installerPath -Wait
    Write-Host "✓ 安装完成" -ForegroundColor Green
} else {
    Write-Host "错误：找不到安装程序" -ForegroundColor Red
    Write-Host "路径：$installerPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "步骤 4/4：测试新版本" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
$installedApp = "$env:LOCALAPPDATA\Programs\cimicode\Cimi.exe"

if (Test-Path $installedApp) {
    Write-Host "正在启动应用..." -ForegroundColor Cyan
    Start-Process -FilePath $installedApp

    Write-Host "等待 15 秒让应用初始化..." -ForegroundColor Cyan
    Start-Sleep -Seconds 15

    Write-Host ""
    Write-Host "检查结果：" -ForegroundColor Yellow
    Write-Host "----------------------------" -ForegroundColor Yellow

    $configPath = "$env:USERPROFILE\.config\cimicode"
    $cimiPath = "$env:USERPROFILE\.cimi\cimicode"

    if (Test-Path $configPath) {
        Write-Host "[问题] .config\cimicode 被创建了！" -ForegroundColor Red
        Write-Host "这意味着可能还在运行旧版本代码" -ForegroundColor Red
    } else {
        Write-Host "[成功] .config\cimicode 没有被创建 ✓" -ForegroundColor Green
    }

    Write-Host ""
    if (Test-Path $cimiPath) {
        Write-Host "[正确] .cimi\cimicode 被创建了 ✓" -ForegroundColor Green
    } else {
        Write-Host "[信息] .cimi\cimicode 未创建（可能需要登录）" -ForegroundColor Cyan
    }
} else {
    Write-Host "警告：找不到安装的应用" -ForegroundColor Red
    Write-Host "路径：$installedApp" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "重装完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
