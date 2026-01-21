# ================================================
# AUTOBLOG Daily Post - Windows Task Scheduler Setup
# Run this script as Administrator to create the scheduled task
# ================================================

param(
    [string]$Time = "09:00",  # Default: 9 AM daily
    [switch]$Remove          # Remove the task instead of creating
)

$TaskName = "AUTOBLOG Daily Post"
$TaskDescription = "Automatically generates and publishes one AI-powered blog post daily"
$ProjectDir = "C:\Users\jgewi\OneDrive\Attachments\Desktop\AUTOBLOG"
$BatFile = "$ProjectDir\scripts\run-daily-post.bat"

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script requires Administrator privileges." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

if ($Remove) {
    # Remove existing task
    Write-Host "Removing scheduled task: $TaskName" -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Task removed successfully!" -ForegroundColor Green
    exit 0
}

# Remove existing task if it exists
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

# Parse time
$timeParts = $Time.Split(":")
$hour = [int]$timeParts[0]
$minute = [int]$timeParts[1]

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  AUTOBLOG Daily Post Scheduler Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Task Name: $TaskName"
Write-Host "Schedule: Daily at $Time"
Write-Host "Script: $BatFile"
Write-Host ""

# Create the action
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$BatFile`"" -WorkingDirectory $ProjectDir

# Create the trigger (daily at specified time)
$trigger = New-ScheduledTaskTrigger -Daily -At "$($hour):$($minute.ToString('00'))"

# Create settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

# Create principal (run whether logged in or not)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Limited

# Register the task
try {
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description $TaskDescription -Force

    Write-Host ""
    Write-Host "SUCCESS! Scheduled task created." -ForegroundColor Green
    Write-Host ""
    Write-Host "The task will run daily at $Time" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To manage the task:" -ForegroundColor Yellow
    Write-Host "  - Open Task Scheduler (taskschd.msc)"
    Write-Host "  - Find '$TaskName' in the Task Scheduler Library"
    Write-Host "  - Right-click to Run, Disable, or Delete"
    Write-Host ""
    Write-Host "To run manually:" -ForegroundColor Yellow
    Write-Host "  schtasks /run /tn `"$TaskName`""
    Write-Host ""
    Write-Host "To remove:" -ForegroundColor Yellow
    Write-Host "  .\setup-scheduler.ps1 -Remove"
    Write-Host ""
    Write-Host "Logs will be saved to:" -ForegroundColor Yellow
    Write-Host "  $ProjectDir\automation\logs\scheduler.log"
    Write-Host "  $ProjectDir\automation\logs\daily-posts.log"
    Write-Host ""
}
catch {
    Write-Host "ERROR: Failed to create scheduled task" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
