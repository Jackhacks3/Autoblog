# ============================================================
# AUTOBLOG Daily Blog Post Generator (PowerShell)
#
# This script runs the daily blog post scheduler.
# Configure Windows Task Scheduler to run this at your preferred time.
#
# Usage: powershell -ExecutionPolicy Bypass -File run-daily-blog.ps1
# ============================================================

$ErrorActionPreference = "Continue"

# Set working directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Ensure logs directory exists
$LogDir = Join-Path $ScriptDir "logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

$LogFile = Join-Path $LogDir "scheduler.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Log function
function Write-Log {
    param([string]$Message)
    $Entry = "[$Timestamp] $Message"
    Add-Content -Path $LogFile -Value $Entry
    Write-Host $Entry
}

Write-Log "============================================================"
Write-Log "Starting daily blog generation..."

# Load environment variables from .env
$EnvFile = Join-Path (Split-Path -Parent $ScriptDir) ".env"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.+)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remove surrounding quotes if present
            $value = $value -replace '^["'']|["'']$', ''
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Log "Environment variables loaded from .env"
}

# Check if Node.js is available
$NodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $NodePath) {
    Write-Log "ERROR: Node.js not found in PATH"
    exit 1
}

# Check if npm packages are installed
$NodeModules = Join-Path $ScriptDir "node_modules"
if (-not (Test-Path $NodeModules)) {
    Write-Log "Installing dependencies..."
    npm install 2>&1 | Out-String | ForEach-Object { Write-Log $_ }
}

# Run the daily scheduler
Write-Log "Running daily-scheduler.ts..."
try {
    $Output = & npx tsx scripts/daily-scheduler.ts 2>&1
    $Output | ForEach-Object {
        Write-Log $_
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Log "SUCCESS: Blog post generated and published"
    } else {
        Write-Log "ERROR: Generation failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Log "EXCEPTION: $_"
    exit 1
}

Write-Log "============================================================"
Write-Log ""

exit $LASTEXITCODE
