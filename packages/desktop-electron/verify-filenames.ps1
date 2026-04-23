Write-Host "========================================" -ForegroundColor Cyan
Write-Host "验证文件命名 - 清除旧文件并测试新版本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "步骤 1/4：清除所有旧的 opencode/cimicode 文件" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
Remove-Item -Path "$env:USERPROFILE\.config\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.cimi\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.cache\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.cache\opencode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.local\share\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.local\share\opencode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.local\state\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.local\state\opencode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:LOCALAPPDATA\Programs\cimicode" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\ai.cimicode.desktop.dev" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\ai.cimicode.desktop" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✓ 清理完成" -ForegroundColor Green
Write-Host ""

Write-Host "步骤 2/4：启动新版本应用" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
$appPath = "d:\code\cimicode\opencode_origin\opencode\packages\desktop-electron\dist\win-unpacked\Cimi.exe"

if (Test-Path $appPath) {
    Write-Host "启动应用: $appPath" -ForegroundColor Cyan
    Start-Process -FilePath $appPath

    Write-Host "等待 20 秒让应用初始化并创建文件..." -ForegroundColor Cyan
    Start-Sleep -Seconds 20
} else {
    Write-Host "错误：找不到应用" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "步骤 3/4：检查创建的文件" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

$dirs = @(
    "$env:USERPROFILE\.cimi\cimicode",
    "$env:USERPROFILE\.cache\cimicode",
    "$env:USERPROFILE\.local\share\cimicode",
    "$env:USERPROFILE\.local\state\cimicode"
)

Write-Host ""
Write-Host "检查各个目录中的文件..." -ForegroundColor Cyan
Write-Host ""

$hasOpencodeFiles = $false
$hasCimicodeFiles = $false

foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "目录: $dir" -ForegroundColor Yellow

        # 查找所有 opencode 文件
        $opencodeFiles = Get-ChildItem -Path $dir -Recurse -Filter "*opencode*" -File -ErrorAction SilentlyContinue
        if ($opencodeFiles) {
            Write-Host "  [问题] 发现 opencode 文件:" -ForegroundColor Red
            $opencodeFiles | ForEach-Object { Write-Host "    - $($_.FullName)" -ForegroundColor Red }
            $hasOpencodeFiles = $true
        }

        # 查找 cimicode 文件
        $cimicodeFiles = Get-ChildItem -Path $dir -Recurse -Filter "*cimicode*" -File -ErrorAction SilentlyContinue
        if ($cimicodeFiles) {
            Write-Host "  [正确] 发现 cimicode 文件:" -ForegroundColor Green
            $cimicodeFiles | ForEach-Object { Write-Host "    - $($_.Name)" -ForegroundColor Green }
            $hasCimicodeFiles = $true
        }

        # 列出所有文件（前10个）
        $allFiles = Get-ChildItem -Path $dir -File -ErrorAction SilentlyContinue | Select-Object -First 10
        if ($allFiles) {
            Write-Host "  [信息] 目录中的文件:" -ForegroundColor Cyan
            $allFiles | ForEach-Object { Write-Host "    - $($_.Name)" -ForegroundColor Cyan }
        }

        Write-Host ""
    }
}

Write-Host "步骤 4/4：总结" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

Write-Host ""
if ($hasOpencodeFiles) {
    Write-Host "[问题] 仍有 opencode 命名的文件被创建" -ForegroundColor Red
    Write-Host "需要检查代码中是否还有使用 opencode 文件名的地方" -ForegroundColor Red
} else {
    Write-Host "[成功] 没有发现 opencode 命名的文件" -ForegroundColor Green
}

if ($hasCimicodeFiles) {
    Write-Host "[成功] 发现 cimicode 命名的文件" -ForegroundColor Green
} else {
    Write-Host "[信息] 没有发现 cimicode 文件（可能需要用户交互才会创建）" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "验证完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
