Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CimiCode 图标问题完整解决方案" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "问题分析：" -ForegroundColor Yellow
Write-Host "安装过程中图标正确 = 安装包图标已更新 ✓" -ForegroundColor Green
Write-Host "运行后图标变旧 = Windows 缓存问题 ✗" -ForegroundColor Red
Write-Host ""

Write-Host "步骤 1/5: 停止所有 Cimi 进程" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
Stop-Process -Name "Cimi" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "Cimi Dev" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✓ 进程已停止" -ForegroundColor Green
Write-Host ""

Write-Host "步骤 2/5: 清理 Windows 图标缓存" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

# 停止 Windows Explorer
Write-Host "停止 Windows Explorer..." -ForegroundColor Cyan
Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# 删除所有图标缓存
$iconCacheDirs = @(
    "$env:LOCALAPPDATA",
    "$env:LOCALAPPDATA\Microsoft\Windows\Explorer"
)

$deletedCount = 0
foreach ($dir in $iconCacheDirs) {
    $cacheFiles = Get-ChildItem -Path $dir -Filter "IconCache*" -File -ErrorAction SilentlyContinue
    foreach ($file in $cacheFiles) {
        Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
        $deletedCount++
        Write-Host "  删除: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "✓ 已删除 $deletedCount 个图标缓存文件" -ForegroundColor Green
Write-Host ""

Write-Host "步骤 3/5: 清理桌面快捷方式缓存" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

$desktopPath = "$env:USERPROFILE\Desktop"
$shortcutPaths = @(
    "$desktopPath\Cimi.lnk",
    "$desktopPath\Cimi Dev.lnk",
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Cimi.lnk",
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Cimi Dev.lnk"
)

foreach ($shortcut in $shortcutPaths) {
    if (Test-Path $shortcut) {
        Write-Host "找到快捷方式: $shortcut" -ForegroundColor Cyan

        # 删除快捷方式（稍后会自动重新创建）
        Remove-Item $shortcut -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ 已删除旧快捷方式" -ForegroundColor Green
    }
}

Write-Host ""

Write-Host "步骤 4/5: 清理应用注册的图标缓存" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

# 清理特定应用的图标缓存
$appIconCache = "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\IconCacheToDelete"
if (Test-Path $appIconCache) {
    Remove-Item $appIconCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ 清理应用图标缓存" -ForegroundColor Green
}

Write-Host ""

Write-Host "步骤 5/5: 重启 Windows Explorer" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
Write-Host "正在重启 Windows Explorer..." -ForegroundColor Cyan
Start-Process explorer.exe
Start-Sleep -Seconds 3

Write-Host "✓ Windows Explorer 已重启" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "下一步操作建议" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. 启动 Cimi 应用" -ForegroundColor Yellow
Write-Host "   - 从开始菜单启动" -ForegroundColor Cyan
Write-Host "   - 或从安装目录启动" -ForegroundColor Cyan
Write-Host ""

Write-Host "2. 如果图标还是不对，手动创建快捷方式：" -ForegroundColor Yellow
Write-Host "   a) 右键桌面 -> 新建 -> 快捷方式" -ForegroundColor Cyan
Write-Host "   b) 位置: $env:LOCALAPPDATA\Programs\cimicode\Cimi.exe" -ForegroundColor Cyan
Write-Host "   c) 右键新快捷方式 -> 属性 -> 更改图标" -ForegroundColor Cyan
Write-Host "   d) 选择: $env:LOCALAPPDATA\Programs\cimicode\Cimi.exe" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. 如果还是不行，重启电脑" -ForegroundColor Yellow
Write-Host "   - Windows + R -> shutdown /r /t 0" -ForegroundColor Cyan
Write-Host ""

Write-Host "✓ 图标缓存清理完成！" -ForegroundColor Green
Write-Host ""

# 询问是否立即重启
$restart = Read-Host "图标还是不对？是否要重启电脑？(y/n)"
if ($restart -eq "y" -or $restart -eq "Y") {
    Write-Host ""
    Write-Host "正在重启电脑..." -ForegroundColor Red
    Write-Host "请保存所有工作！" -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    Restart-Computer -Force
} else {
    Write-Host ""
    Write-Host "跳过重启。请手动启动应用检查图标。" -ForegroundColor Yellow
}
