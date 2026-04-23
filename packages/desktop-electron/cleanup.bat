@echo off
echo 正在清理所有旧的 cimicode/opencode 目录...
echo.

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

echo 清理完成！
echo.
echo 现在请：
echo 1. 打开控制面板 -^> 程序和功能
echo 2. 找到 Cimi 并卸载
echo 3. 运行新的安装程序：
echo    d:\code\cimicode\opencode_origin\opencode\packages\desktop-electron\dist\cimicode-electron-win-x64.exe
echo.
pause
