# Download Face-API.js v0.22.2 Models
# This script downloads all required face detection models to frontend/public/models/

$modelsDir = "frontend\public\models"
$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

Write-Host "📥 Downloading Face-API.js Models..." -ForegroundColor Green
Write-Host "Location: $modelsDir`n" -ForegroundColor Gray

# Create directory if it doesn't exist
if (!(Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Path $modelsDir | Out-Null
    Write-Host "✅ Created models directory`n"
}

# List of files to download
$files = @(
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json", 
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2",
    "face_expression_model-weights_manifest.json",
    "face_expression_model-shard1"
)

$failedFiles = @()
$downloadedCount = 0

foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $filepath = "$modelsDir\$file"
    
    if (Test-Path $filepath) {
        Write-Host "SKIP: $file (already exists)" -ForegroundColor Yellow
        $downloadedCount++
        continue
    }
    
    try {
        Write-Host "DOWNLOADING: $file..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $url -OutFile $filepath -UseBasicParsing -ErrorAction Stop
        Write-Host "SUCCESS: Downloaded $file" -ForegroundColor Green
        $downloadedCount++
    } catch {
        Write-Host "FAILED: $file" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $failedFiles += $file
    }
}

Write-Host "`n" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Gray
Write-Host "Summary: $downloadedCount/$($files.Count) files" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Gray

if ($failedFiles.Count -gt 0) {
    Write-Host "WARNING: Failed downloads: $($failedFiles.Count)" -ForegroundColor Yellow
    $failedFiles | ForEach-Object { Write-Host "   • $_" }
    Write-Host "`nTIP: Try these alternatives:" -ForegroundColor Yellow
    Write-Host "   1. Check internet connection"
    Write-Host "   2. Try different browser/network"
    Write-Host "   3. Use manual download from GitHub" -ForegroundColor Gray
} else {
    Write-Host "SUCCESS: All models downloaded successfully!" -ForegroundColor Green
    Write-Host "Ready to use offline face detection!" -ForegroundColor Green
}
Write-Host "`nLOCATION: Files are located in: $modelsDir" -ForegroundColor Gray
