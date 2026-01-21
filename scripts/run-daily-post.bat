@echo off
REM ================================================
REM AUTOBLOG Daily Post Scheduler
REM Run this via Windows Task Scheduler at your preferred time
REM ================================================

REM Set the project directory
set PROJECT_DIR=C:\Users\jgewi\OneDrive\Attachments\Desktop\AUTOBLOG

REM Navigate to project
cd /d "%PROJECT_DIR%"

REM Log start time
echo [%date% %time%] Starting daily post generation >> "%PROJECT_DIR%\automation\logs\scheduler.log"

REM Run the daily post script
cd automation
call npx tsx scripts/daily-post.ts >> "%PROJECT_DIR%\automation\logs\scheduler.log" 2>&1

REM Log completion
echo [%date% %time%] Daily post script completed >> "%PROJECT_DIR%\automation\logs\scheduler.log"
echo. >> "%PROJECT_DIR%\automation\logs\scheduler.log"

exit /b %ERRORLEVEL%
