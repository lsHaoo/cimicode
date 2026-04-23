Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Windows 图标缓存清理工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "步骤 1/3: 清理 Windows 图标数据库" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

# 停止 Windows Explorer
Write-Host "停止 Windows Explorer..." -ForegroundColor Cyan
Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 删除图标缓存
$iconCachePaths = @(
    "$env:LOCALAPPDATA\IconCache.db",
    "$env:LOCALAPPDATA\IconCache_*.db",
    "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\IconCache*"
)

foreach ($path in $iconCachePaths) {
    $files = Get-ChildItem -Path $path -ErrorAction SilentlyContinue
    if ($files) {
        $files | ForEach-Object {
            Write-Host "删除: $($_.FullName)" -ForegroundColor Green
            Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "✓ 图标缓存已清理" -ForegroundColor Green
Write-Host ""

Write-Host "步骤 2/3: 检查应用图标文件" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

$appPath = "$env:LOCALAPPDATA\Programs\cimicode"
if (Test-Path $appPath) {
    Write-Host "找到安装的应用: $appPath" -ForegroundColor Cyan

    # 检查应用中的图标
    $exePath = "$appPath\Cimi.exe"
    if (Test-Path $exePath) {
        Write-Host "应用可执行文件: $exePath" -ForegroundColor Green

        # 获取文件信息
        $fileInfo = Get-Item $exePath
        Write-Host "修改时间: $($fileInfo.LastWriteTime)" -ForegroundColor Cyan
        Write-Host "文件大小: $([math]::Round($fileInfo.Length / 1MB, 2)) MB" -ForegroundColor Cyan
    }
} else {
    Write-Host "未找到安装的应用" -ForegroundColor Red
    Write-Host "路径: $appPath" -ForegroundColor Red
}

Write-Host ""

Write-Host "步骤 3/3: 检查未打包版本的图标" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

$unpackedPath = "d:\code\cimicode\opencode_origin\opencode\packages\desktop-electron\dist\win-unpacked"
if (Test-Path $unpackedPath) {
    Write-Host "未打包版本: $unpackedPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "应用图标信息:" -ForegroundColor Cyan

    # 检查可执行文件
    $unpackedExe = "$unpackedPath\Cimi.exe"
    if (Test-Path $unpackedExe) {
        $unpackedInfo = Get-Item $unpackedExe
        Write-Host "  修改时间: $($unpackedInfo.LastWriteTime)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "重启 Windows Explorer..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "正在重启 Windows Explorer..." -ForegroundColor Yellow
Start-Process explorer.exe

Write-Host ""
Write-Host "✓ 清理完成！" -ForegroundColor Green
Write-Host ""
Write-Host "如果图标还是没变，请尝试：" -ForegroundColor Cyan
Write-Host "1. 重启电脑" -ForegroundColor Yellow
Write-Host "2. 卸载并重新安装应用" -ForegroundColor Yellow
Write-Host "3. 手动更改桌面图标（右键 -> 属性 -> 更改图标）" -ForegroundColor Yellow
Write-Host ""

# 询问是否要重启电脑
$restart = Read-Host "是否要立即重启电脑？(y/n)"
if ($restart -eq "y" -or $restart -eq "Y") {
    Write-Host "正在重启电脑..." -ForegroundColor Red
    Restart-Computer -Force
} else {
    Write-Host "跳过重启" -ForegroundColor Yellow
}
