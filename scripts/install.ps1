# Stop the script immediately if any command fails
$ErrorActionPreference = "Stop"

$RootPath = "$PSScriptRoot\.."

Write-Host "
                                                                                                 
      # ###                                                                                      
    /  /###  /   #                                                                               
   /  /  ###/   ###                                                      #                       
  /  ##   ##     #                                                      ##                       
 /  ###                                                                 ##                       
##   ##        ###       /###    ### /### /###     /###      /###     ######## /##  ###  /###    
##   ##   ###   ###     /  ###  / ##/ ###/ /##  / / ###  /  / #### / ######## / ###  ###/ #### / 
##   ##  /###  / ##    /    ###/   ##  ###/ ###/ /   ###/  ##  ###/     ##   /   ###  ##   ###/  
##   ## /  ###/  ##   ##     ##    ##   ##   ## ##    ##  ####          ##  ##    ### ##         
##   ##/    ##   ##   ##     ##    ##   ##   ## ##    ##    ###         ##  ########  ##         
 ##  ##     #    ##   ##     ##    ##   ##   ## ##    ##      ###       ##  #######   ##         
  ## #      /    ##   ##     ##    ##   ##   ## ##    ##        ###     ##  ##        ##         
   ###     /     ##   ##     ##    ##   ##   ## ##    /#   /###  ##     ##  ####    / ##         
    ######/      ### / ########    ###  ###  ### ####/ ## / #### /      ##   ######/  ###        
      ###         ##/    ### ###    ###  ###  ### ###   ##   ###/        ##   #####    ###       
                              ###                                                                
                        ####   ###                                                               
                      /######  /#                                                                
                     /     ###/                                                                  
"

Write-Host "🎸 Installing Gigmaster ..." -ForegroundColor Cyan

# 1. Setup Directories (Using Absolute Paths)
$LyricsPath = Join-Path $RootPath "lyrics"
$PropsPath = Join-Path $LyricsPath "properties"

if (-not (Test-Path $LyricsPath)) {
    New-Item -ItemType Directory -Force -Path $LyricsPath | Out-Null
    Write-Host "Created lyrics folder." -ForegroundColor Gray
}
if (-not (Test-Path $PropsPath)) {
    New-Item -ItemType Directory -Force -Path $PropsPath | Out-Null
    Write-Host "Created properties folder." -ForegroundColor Gray
}

# Create Demo Song if missing
$DemoSong = Join-Path $LyricsPath "demo-Song.txt"
if (-not (Test-Path $DemoSong)) {
    Write-Host "Creating demo song..." -ForegroundColor DarkGray
    "
[Verse]
I’m typing out my code tonight,
Blue and green lines looking right,
Commit the change, I feel the buzz—
Time to push it to the Hub!

[Chorus]
Oh GitHub, GitHub,
Where all my branches grow,
Merge my dreams together
In a perfect workflow.
Oh GitHub, GitHub,
You keep my bugs at bay—
I push, you pull, we sync,
And ship the code away!
    " | Set-Content $DemoSong
    "title: Demo Song`r`nartist: rock-n-host" | Set-Content (Join-Path $PropsPath "demo-Song.yaml")
}

# 2. Install Backend
Write-Host "`n📦 Setting up Backend..." -ForegroundColor Yellow
Set-Location (Join-Path $RootPath "backend")
try {
    npm install
} catch {
    Write-Error "Backend installation failed. Check if Node.js is installed."
}

# 3. Install & Build Frontend
Write-Host "`n🎨 Setting up Frontend (This may take a moment)..." -ForegroundColor Yellow
Set-Location (Join-Path $RootPath "frontend")
try {
    npm install
    npm run build
} catch {
    Write-Error "Frontend build failed."
}

# 4. Return to Root
Set-Location $RootPath

Write-Host "`n✅ Installation & Build Complete!" -ForegroundColor Green
Write-Host "---------------------------------------------------" -ForegroundColor Gray
Write-Host "🚀 To launch, run this command:" -ForegroundColor Cyan
Write-Host "node backend/src/index.js" -ForegroundColor White
Write-Host "---------------------------------------------------" -ForegroundColor Gray
