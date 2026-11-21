@echo off
chcp 65001 >nul
title ប្រព័ន្ធគ្រប់គ្រងថ្នាក់រៀន អនុវិទ្យាល័យ

echo ========================================================
echo   ប្រព័ន្ធគ្រប់គ្រងថ្នាក់រៀន អនុវិទ្យាល័យ
echo   Hun Sen Junior High School Classroom System
echo ========================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] កំពុងបើកដំណើរការ Local Web Server (http://localhost:3333)...
    node server.js --open
) else (
    echo [INFO] Node.js មិនទាន់ដំឡើង - កំពុងបើកឯកសារ index.html ដោយផ្ទាល់...
    start "" "%~dp0index.html"
)
pause
