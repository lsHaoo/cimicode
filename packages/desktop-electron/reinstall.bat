@echo off
echo ========================================
echo 重新安装 CimiCode 应用
echo ========================================
echo.

echo 第一步：卸载旧版本
echo ----------------------------
echo 检查是否已安装旧版本...

REM 检查是否在控制面板中已安装
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall" /s | findstr /i "Cimi" >nul 2>&1
if %errorlevel% == 0 (
    echo 发现已安装的 Cimi 版本
    echo 请手动从控制面板卸载旧版本
    echo 或者运行以下命令：
    echo   控制面板 -^> 程序和功能 -^> 卸载 Cimi
    pause
) else (
    echo 未发现已安装的版本
)

echo.
echo 第二步：清理旧的目录和快捷方式
echo ----------------------------
rmdir /s /q "C:\Users\shihao1.liu\.config\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.cimi\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.cache\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.local\share\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.local\state\cimicode" 2>nul
del "C:\Users\shihao1.liu\Desktop\Cimi.lnk" 2>nul
echo 已清理旧目录

echo.
echo 第三步：安装新版本
echo ----------------------------
set INSTALLER=D:\code\cimicode\opencode_origin\opencode\packages\desktop-electron\dist\cimicode-electron-win-x64.exe

if exist "%INSTALLER%" (
    echo 正在运行安装程序: %INSTALLER%
    echo 请按照安装向导完成安装
    start "" "%INSTALLER%"
) else (
    echo 错误：找不到安装程序
    echo 路径：%INSTALLER%
)

echo.
echo 第四步：安装完成后测试
echo ----------------------------
echo 安装完成后，请按任意键启动应用并测试...
pause

echo.
echo 启动应用...
start "" "C:\Users\shihao1.liu\AppData\Local\Programs\cimicode\Cimi.exe" 2>nul

echo.
echo 等待15秒后检查目录...
timeout /t 15

echo.
echo 检查结果：
echo ----------------------------
if exist "C:\Users\shihao1.liu\.config\cimicode" (
    echo [问题] .config\cimicode 被创建了
) else (
    echo [成功] .config\cimicode 没有被创建
)

if exist "C:\Users\shihao1.liu\.cimi\cimicode" (
    echo [成功] .cimi\cimicode 被创建了
) else (
    echo [检查] .cimi\cimicode 未创建（可能需要登录等操作）
)

echo.
echo ========================================
echo 重新安装完成
echo ========================================
pause
