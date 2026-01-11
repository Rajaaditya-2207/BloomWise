# 1. Reset Git
if (Test-Path .git) {
    Remove-Item -Path .git -Recurse -Force
}
git init
git remote add origin https://github.com/Rajaaditya-2207/BloomWise.git

# 2. Define Commit Messages Map
$commits = @{
    "README.md" = "Docs: Add comprehensive project documentation and setup guide";
    ".gitignore" = "Config: Add standard gitignore for React/Vite/Supabase";
    "PROJECT_DOCS.md" = "Docs: Add detailed codebase structure and architecture overview";
    "package.json" = "Config: Define project dependencies and scripts";
    "package-lock.json" = "Config: Lock dependency versions";
    "vite.config.js" = "Config: Setup Vite bundler configuration";
    ".env.example" = "Config: Add template for environment variables";
    ".env" = "Config: Add local environment variables";
    "index.html" = "Core: Add HTML entry point";
    
    # Src Root
    "src\main.jsx" = "Core: Add React application entry point";
    "src\App.jsx" = "Core: Add main application shell, routing, and global state";
    "src\index.css" = "UI: Add global styles, Glassmorphism system, and variables";

    # Components
    "src\components\LandingPage.jsx" = "Feat(UI): Add Welcome Screen with bilingual onboarding";
    "src\components\Dashboard.jsx" = "Feat(UI): Add Dashboard for crop and irrigation status";
    "src\components\Navigation.jsx" = "Feat(UI): Add Bottom Navigation bar with active states";
    "src\components\WhatsAppChat.jsx" = "Feat(AI): Add conversational chat interface with reasoning display";
    "src\components\FarmerRegistration.jsx" = "Feat(Auth): Add multilingual farmer registration form";
    "src\components\FarmSetup.jsx" = "Feat(Farm): Add farm configuration for crops and soil";
    "src\components\IrrigationSchedule.jsx" = "Feat(Planner): Add 7-day visual irrigation planner";
    "src\components\WeeklyReport.jsx" = "Feat(Analytics): Add water usage and savings report";
    "src\components\SignalHistory.jsx" = "Feat(Sim): Add simulation control for demo scenarios";
    "src\components\Settings.jsx" = "Feat(User): Add settings for language, theme, and data management";
    "src\components\Icons.jsx" = "UI: Add custom SVG icon library";
    "src\components\OfflineIndicator.jsx" = "UI: Add offline status indicator banner";
    "src\components\WeatherCard.jsx" = "UI: Add reusable weather metrics card";

    # Services
    "src\services\agentLoop.js" = "Logic(AI): Add main ReAct agent reasoning loop";
    "src\services\agentTools.js" = "Logic(AI): Add executable tools for agricultural calculations";
    "src\services\agentMemory.js" = "Logic(AI): Add memory management for agent context";
    "src\services\geminiService.js" = "Infra(AI): Add Google Gemini API integration";
    "src\services\weatherService.js" = "Infra(Data): Add OpenMeteo weather API integration";
    "src\services\supabase.js" = "Infra(Backend): Add Supabase client configuration";
    "src\services\offlineManager.js" = "Logic(Data): Add offline caching and sync manager";
    "src\services\signalService.js" = "Logic(Sim): Add simulation signal utilities";
    "src\services\backgroundAgent.js" = "Logic(Bg): Add background task handler";

    # Data
    "src\data\indianCrops.js" = "Data: Add database of Indian crops and Kc coefficients";
    "src\data\indianSoils.js" = "Data: Add database of Indian soil types and moisture properties";
    "src\data\powerSchedules.js" = "Data: Add rural power availability logic";
    "src\data\weatherData.js" = "Data: Add fallback weather data for offline/demo modes";

    # Utils
    "src\utils\translations.js" = "I18n: Add translation strings for 12 Indian languages";
    "src\utils\formatters.js" = "Utils: Add date and number formatting helpers";
}

# 3. Commit Files
$files = Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch "node_modules|dist|\.git|recommit_all.ps1" }

foreach ($file in $files) {
    # Get relative path for git add
    $relPath = $file.FullName.Substring($PWD.Path.Length + 1)
    
    # Normalize path separators for map lookup
    $lookupPath = $relPath # Powershell uses backslashes on windows usually
    
    if ($commits.ContainsKey($lookupPath)) {
        $msg = $commits[$lookupPath]
    } else {
         # Fallback for images or other files
        $msg = "Asset: Add " + $file.Name
    }

    Write-Host "Committing: $relPath -> $msg"
    git add $relPath
    git commit -m "$msg"
}

# 4. Push
git branch -M main
git push -f origin main
