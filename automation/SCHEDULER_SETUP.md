# Daily Blog Post Scheduler Setup

This guide explains how to set up automated daily blog post generation using Windows Task Scheduler.

## Prerequisites

Before setting up the scheduler, ensure:

1. **Node.js 18+** is installed and in your PATH
2. **Dependencies installed**: Run `npm install` in the automation folder
3. **Environment configured**: `.env` file exists in project root with:
   ```env
   STRAPI_URL=http://localhost:1337
   STRAPI_API_TOKEN=your-api-token
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...  # For hero images
   ```
4. **Strapi CMS running** (or accessible) when the scheduler runs

## Quick Test

Before scheduling, test the system manually:

```bash
cd automation

# Preview topic selection (no API calls)
npm run daily:dry-run

# Generate a real article
npm run daily
```

## Windows Task Scheduler Setup

### Step 1: Open Task Scheduler

1. Press `Win + R`, type `taskschd.msc`, press Enter
2. Or search "Task Scheduler" in Start menu

### Step 2: Create New Task

1. Click **Create Task** in the right panel (not "Create Basic Task")

### Step 3: General Tab

- **Name**: `AUTOBLOG Daily Blog Generator`
- **Description**: `Generates one SEO-optimized blog post daily`
- **Security options**:
  - Select "Run whether user is logged on or not"
  - Check "Run with highest privileges"
  - Configure for: Windows 10/11

### Step 4: Triggers Tab

1. Click **New**
2. **Begin the task**: On a schedule
3. **Settings**: Daily
4. **Start**: Choose your preferred time (e.g., 6:00 AM)
5. **Recur every**: 1 day
6. Check "Enabled"
7. Click OK

### Step 5: Actions Tab

1. Click **New**
2. **Action**: Start a program
3. **Program/script**: `powershell.exe`
4. **Add arguments**:
   ```
   -ExecutionPolicy Bypass -File "C:\Users\jgewi\OneDrive\Attachments\Desktop\AUTOBLOG\automation\run-daily-blog.ps1"
   ```
5. **Start in**: `C:\Users\jgewi\OneDrive\Attachments\Desktop\AUTOBLOG\automation`
6. Click OK

### Step 6: Conditions Tab

- **Power**: Uncheck "Start only if on AC power" (for laptops)
- **Network**: Check "Start only if network connection is available"

### Step 7: Settings Tab

- Check "Allow task to be run on demand"
- Check "Run task as soon as possible after a scheduled start is missed"
- Check "If the task fails, restart every": 5 minutes, up to 3 times
- "Stop the task if it runs longer than": 30 minutes

### Step 8: Save

1. Click OK
2. Enter your Windows password when prompted

## Verifying the Setup

### Test Run

1. In Task Scheduler, find your task
2. Right-click → **Run**
3. Check `automation/logs/scheduler.log` for output

### Check Status

```bash
# View recent log entries
Get-Content automation\logs\scheduler.log -Tail 50

# View generation history
Get-Content automation\logs\generation-history.json | ConvertFrom-Json | Format-Table
```

## Troubleshooting

### Task doesn't run

1. Check Task Scheduler History (View → Show All Task History)
2. Verify Node.js is in system PATH (not just user PATH)
3. Check Windows Event Viewer for errors

### "Node not found" error

Add Node.js to system PATH:
1. Right-click This PC → Properties → Advanced system settings
2. Environment Variables → System variables → Path → Edit
3. Add Node.js path (e.g., `C:\Program Files\nodejs`)

### Strapi not available

If Strapi isn't running 24/7, you have options:

1. **Run Strapi as a service** (recommended for production)
2. **Start Strapi before generation**:
   Add to PowerShell script:
   ```powershell
   # Start Strapi, wait for it, generate, stop
   Start-Process -NoNewWindow npm -ArgumentList "run", "cms:dev" -WorkingDirectory ".."
   Start-Sleep -Seconds 30
   # ... run generation ...
   ```

### API rate limits

The scheduler includes a check to prevent multiple generations per day. If you need to regenerate:
```bash
# Delete today's entry from history
# Edit automation/logs/generation-history.json
```

## Customization

### Change posting time

Edit the trigger in Task Scheduler to your preferred time.

### Change content pillars

Edit `automation/src/config/seo-topics.ts`:
- Add/remove topics
- Adjust pillar rotation
- Modify priority weights

### Publish immediately (not as draft)

```bash
npm run daily -- --status published
```

Or edit `run-daily-blog.ps1` to add the `--status published` flag.

### Skip image generation

```bash
npm run daily -- --no-image
```

## Content Pillar Rotation

The scheduler rotates through pillars weekly:

| Day       | Pillar        |
|-----------|---------------|
| Monday    | ai-automation |
| Tuesday   | consulting    |
| Wednesday | ai-automation |
| Thursday  | industry-news |
| Friday    | consulting    |
| Saturday  | ai-automation |
| Sunday    | digital-assets|

This ensures balanced content while emphasizing AI/Automation topics (your core business).

## Logs

- **scheduler.log**: Raw output from each run
- **generation-history.json**: Structured log of all generated articles

View history:
```powershell
Get-Content automation\logs\generation-history.json | ConvertFrom-Json |
  Select-Object date, topic, pillar, success |
  Format-Table -AutoSize
```
