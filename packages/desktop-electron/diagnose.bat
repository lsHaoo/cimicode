@echo off
echo 诊断步骤：
echo.
echo 1. 删除所有现有目录
rmdir /s /q "C:\Users\shihao1.liu\.config\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.cimi\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.cache\cimicode" 2>nul
rmdir /s /q "C:\Users\shihao1.liu\.cache\opencode" 2>nul

echo 2. 检查目录是否已删除
if exist "C:\Users\shihao1.liu\.config\cimicode" echo    .config/cimicode 仍然存在
if exist "C:\Users\shihao1.liu\.cimi\cimicode" echo    .cimi/cimicode 仍然存在

echo.
echo 3. 现在请运行打包后的应用：
echo    "d:\code\cimicode\opencode_origin\opencode\packages\desktop-electron\dist\win-unpacked\Cimi.exe"
echo.
echo 4. 然后检查哪些目录被创建了：
echo.
timeout /t 5
dir "C:\Users\shihao1.liu\.config" 2>nul
dir "C:\Users\shihao1.liu\.cimi" 2>nul
dir "C:\Users\shihao1.liu\.cache" 2>nul
dir "C:\Users\shihao1.liu\.local\share" 2>nul
dir "C:\Users\shihao1.liu\.local\state" 2>nul
echo.
pause
