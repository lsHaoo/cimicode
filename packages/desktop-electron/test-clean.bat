@echo off
echo ========================================
echo 测试新版本 - 清理并检查目录创建
echo ========================================
echo.

echo 第一步：删除所有现有目录
echo ----------------------------
rmdir /s /q "C:\Users\shihao1.liu\.config\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.cimi\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.cache\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.cache\opencode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.local\share\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.local\share\opencode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.local\state\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.local\state\opencode" 2>nul

echo 目录已清理完成
echo.

echo 第二步：启动打包后的应用
echo ----------------------------
echo 正在启动: d:\code\cimicode\opencode_origin\opencode\packages\desktop-electron\dist\win-unpacked\Cimi.exe
echo.
echo 请等待应用完全启动（大约10-20秒）
echo.

start "" "d:\code\cimicode\opencode_origin\opencode\packages\desktop-electron\dist\win-unpacked\Cimi.exe"

echo 等待15秒后检查目录创建...
timeout /t 15

echo.
echo 第三步：检查创建了哪些目录
echo ----------------------------
echo.

if exist "C:\Users\shihao1.liu\.config\cimicode" (
    echo [问题] .config\cimicode 目录被创建了
    dir "C:\Users\shihao1.liu\.config\cimicode"
) else (
    echo [正确] .config\cimicode 目录没有被创建
)

echo.

if exist "C:\Users\shihao1.liu\.cimi\cimicode" (
    echo [正确] .cimi\cimicode 目录被创建了
    dir "C:\Users\shihao1.liu\.cimi\cimicode"
) else (
    echo [问题] .cimi\cimicode 目录没有被创建
)

echo.
if exist "C:\Users\shihao1.liu\.cache\cimicode" (
    echo [正确] .cache\cimicode 目录被创建了
) else (
    echo [问题] .cache\cimicode 目录没有被创建
)

echo.
if exist "C:\Users\shihao1.liu\.local\share\cimicode" (
    echo [正确] .local\share\cimicode 目录被创建了
) else (
    echo [问题] .local\share\cimicode 目录没有被创建
)

echo.
if exist "C:\Users\shihao1.liu\.local\state\cimicode" (
    echo [正确] .local\state\cimicode 目录被创建了
) else (
    echo [问题] .local\state\cimicode 目录没有被创建
)

echo.
echo ========================================
echo 测试完成
echo ========================================
pause
