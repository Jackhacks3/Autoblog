@echo off
REM ============================================================
REM AUTOBLOG Daily Blog Post Generator
REM
REM This script runs the daily blog post scheduler.
REM Configure Windows Task Scheduler to run this at your preferred time.
REM ============================================================

REM Set the working directory to the automation folder
cd /d "%~dp0"

REM Log start time
echo ============================================================ >> logs\scheduler.log
echo [%date% %time%] Starting daily blog generation... >> logs\scheduler.log

REM Load environment variables from root .env file
if exist "..\.env" (
    for /f "usebackq tokens=1,2 delims==" %%a in ("..\.env") do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" set "%%a=%%b"
    )
)

REM Run the daily scheduler
call npx tsx scripts/daily-scheduler.ts >> logs\scheduler.log 2>&1

REM Check result
if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] SUCCESS: Blog post generated >> logs\scheduler.log
) else (
    echo [%date% %time%] ERROR: Generation failed with code %ERRORLEVEL% >> logs\scheduler.log
)

echo ============================================================ >> logs\scheduler.log
echo. >> logs\scheduler.log
