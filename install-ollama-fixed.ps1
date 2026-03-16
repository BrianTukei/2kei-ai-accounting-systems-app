# Ollama Installation Script for Windows (Fixed)
# This will install Ollama and download Llama 3

Write-Host "🦙 Installing Ollama for Windows..." -ForegroundColor Green

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script requires administrator privileges. Please run as administrator." -ForegroundColor Yellow
    Write-Host "💡 You can also download Ollama manually from: https://ollama.ai/download/windows" -ForegroundColor Cyan
    Read-Host "Press Enter to exit"
    exit 1
}

# Create temp directory
$tempDir = "C:\temp\ollama"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force
}

# Download Ollama
Write-Host "📥 Downloading Ollama..." -ForegroundColor Blue
$ollamaUrl = "https://ollama.com/download/OllamaSetup.exe"
$ollamaPath = "$tempDir\OllamaSetup.exe"

try {
    Invoke-WebRequest -Uri $ollamaUrl -OutFile $ollamaPath -UseBasicParsing
    Write-Host "✅ Ollama downloaded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to download Ollama: $_" -ForegroundColor Red
    Write-Host "💡 Please download manually from: https://ollama.ai/download/windows" -ForegroundColor Cyan
    Read-Host "Press Enter to exit"
    exit 1
}

# Install Ollama silently
Write-Host "🔧 Installing Ollama..." -ForegroundColor Blue
try {
    Start-Process -FilePath $ollamaPath -ArgumentList "/S" -Wait -NoNewWindow
    Write-Host "✅ Ollama installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install Ollama: $_" -ForegroundColor Red
    Write-Host "💡 Please run the installer manually: $ollamaPath" -ForegroundColor Cyan
    Read-Host "Press Enter to exit"
    exit 1
}

# Start Ollama service
Write-Host "🚀 Starting Ollama service..." -ForegroundColor Blue
try {
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Write-Host "✅ Ollama service started" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not start Ollama service automatically" -ForegroundColor Yellow
    Write-Host "💡 Please start it manually by running: ollama serve" -ForegroundColor Cyan
}

# Wait for Ollama to be ready
Write-Host "⏳ Waiting for Ollama to be ready..." -ForegroundColor Blue
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/version" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $ready) {
    Write-Host "⚠️  Ollama service is not responding" -ForegroundColor Yellow
    Write-Host "💡 Please check if Ollama is running: ollama serve" -ForegroundColor Cyan
} else {
    Write-Host "✅ Ollama is ready!" -ForegroundColor Green
}

# Download Llama 3
Write-Host "🦙 Downloading Llama 3 model..." -ForegroundColor Blue
try {
    $llamaProcess = Start-Process -FilePath "ollama" -ArgumentList "pull", "llama3" -Wait -PassThru -NoNewWindow
    if ($llamaProcess.ExitCode -eq 0) {
        Write-Host "✅ Llama 3 downloaded successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Llama 3 download may have failed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to download Llama 3: $_" -ForegroundColor Red
    Write-Host "💡 Please run manually: ollama pull llama3" -ForegroundColor Cyan
}

# Test the installation
Write-Host "🧪 Testing Llama 3..." -ForegroundColor Blue
try {
    $testBody = '{"model": "llama3", "prompt": "Hello", "stream": false}'
    $testResponse = Invoke-WebRequest -Uri "http://localhost:11434/api/generate" -Method POST -ContentType "application/json" -Body $testBody -UseBasicParsing -TimeoutSec 10
    if ($testResponse.StatusCode -eq 200) {
        Write-Host "✅ Llama 3 is working!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Llama 3 test failed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not test Llama 3: $_" -ForegroundColor Yellow
}

# Cleanup
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "🎉 Installation complete!" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Restart your 2K AI Accounting Systems frontend" -ForegroundColor White
Write-Host "   2. The system will automatically detect and use Llama 3" -ForegroundColor White
Write-Host "   3. Enjoy more intelligent AI responses!" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "🔧 If Ollama doesn't start automatically:" -ForegroundColor Yellow
Write-Host "   Run: ollama serve" -ForegroundColor White
Write-Host "   Then: ollama pull llama3" -ForegroundColor White

Read-Host "Press Enter to exit"
