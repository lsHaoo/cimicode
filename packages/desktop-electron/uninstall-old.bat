@echo off
echo ========================================
echo 卸载旧版本并安装新版本
echo ========================================
echo.

echo 第一步：卸载旧版本
echo ----------------------------
echo 请在打开的程序和功能窗口中找到 Cimi 并卸载
echo.

pause

echo 打开控制面板...
control appwiz.cpl

echo.
echo 请完成卸载后按任意键继续...
pause

echo.
echo 第二步：清理所有旧目录
echo ----------------------------
rmdir /s /q "C:\Users\shihao1.liu\.config\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.cimi\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.cache\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.cache\opencode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.local\share\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.local\share\opencode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.local\state\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.local\state\opencode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\AppData\Local\Programs\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\AppData\Roaming\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\AppData\Roaming\ai.cimicode.desktop.dev" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\AppData\Roaming\ai.cimicode.desktop" 2>nul

echo 旧目录已清理
echo.

echo 第三步：安装新版本
echo ----------------------------
set INSTALLER=D:\code\cimicode\opencode_origin\opencode\packages\desktop-electron\dist\cimicode-electron-win-x64.exe

if exist "%INSTALLER%" (
    echo 正在运行新安装程序...
    echo 请按照安装向导完成安装
    echo.
    start "" "%INSTALLER%"

    echo 等待安装完成（请手动完成安装）...
    echo 安装完成后请按任意键继续...
    pause
) else (
    echo 错误：找不到安装程序
    echo 路径：%INSTALLER%
    pause
    exit /b 1
)

echo.
echo 第四步：启动新版本并测试
echo ----------------------------
echo 正在启动新版本应用...
start "" "C:\Users\shihao1.liu\AppData\Local\Programs\cimicode\Cimi.exe" 2>nul

echo 应用已启动，等待15秒让其初始化...
timeout /t 15

echo.
echo 检查结果：
echo ----------------------------

if exist "C:\Users\shihao1.liu\.config\cimicode" (
    echo [问题] .config\cimicode 仍然被创建了！
    echo.
    echo 请检查：
    echo 1. 是否成功安装了新版本？
    echo 2. 是否关闭了所有 Cimi 进程？
    echo 3. 是否完全卸载了旧版本？
) else (
    echo [成功] .config\cimicode 没有被创建！
)

echo.
if exist "C:\Users\shihao1.liu\.cimi\cimicode" (
    echo [正确] .cimi\cimicode 被创建了
) else (
    echo [信息] .cimi\cimicode 未创建（可能需要登录等操作才会创建）
)

echo.
echo ========================================
echo 完成！
echo ========================================
echo.
echo 如果还是有问题，请：
echo 1. 检查任务管理器，确认没有旧版本进程在运行
echo 2. 重启电脑后重新安装
echo 3. 或者直接使用未打包版本测试：
echo    d:\code\cimicode\opencode_origin\opencode\packages\desktop-electron\dist\win-unpacked\Cimi.exe
echo.
pause
