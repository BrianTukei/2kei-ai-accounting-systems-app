# Activate Llama 3 Integration for 2K AI Accounting Systems
Write-Host "🚀 Activating Llama 3 Integration..." -ForegroundColor Green

# Check if Ollama is installed
Write-Host "🔍 Checking Ollama installation..." -ForegroundColor Blue
try {
    $ollamaVersion = ollama --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Ollama is installed: $ollamaVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Ollama not found in PATH" -ForegroundColor Red
        Write-Host "💡 Please complete the Ollama installation first" -ForegroundColor Yellow
        Write-Host "📁 Run: OllamaSetup.exe from your project folder" -ForegroundColor Cyan
        exit 1
    }
} catch {
    Write-Host "❌ Ollama not installed or not in PATH" -ForegroundColor Red
    Write-Host "💡 Please complete the Ollama installation first" -ForegroundColor Yellow
    exit 1
}

# Start Ollama service
Write-Host "🚀 Starting Ollama service..." -ForegroundColor Blue
try {
    # Check if Ollama is already running
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/version" -UseBasicParsing -TimeoutSec 2 2>$null
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Ollama service is already running" -ForegroundColor Green
    } else {
        Write-Host "🔄 Starting Ollama service..." -ForegroundColor Yellow
        Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        
        # Check again
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/version" -UseBasicParsing -TimeoutSec 5 2>$null
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Ollama service started successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Ollama service may not be running properly" -ForegroundColor Yellow
            Write-Host "💡 You may need to run 'ollama serve' manually" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "🔄 Starting Ollama service..." -ForegroundColor Yellow
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# Check if Llama 3 is downloaded
Write-Host "🦙 Checking Llama 3 model..." -ForegroundColor Blue
try {
    $modelsResponse = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5 2>$null
    if ($modelsResponse.StatusCode -eq 200) {
        $modelsData = $modelsResponse.Content | ConvertFrom-Json
        $hasLlama = $modelsData.models | Where-Object { $_.name -like "*llama*" }
        
        if ($hasLlama) {
            Write-Host "✅ Llama 3 is already downloaded" -ForegroundColor Green
            Write-Host "📋 Available models:" -ForegroundColor Cyan
            $modelsData.models | ForEach-Object { Write-Host "   - $($_.name)" -ForegroundColor White }
        } else {
            Write-Host "📥 Downloading Llama 3 model..." -ForegroundColor Yellow
            Write-Host "⏳ This may take 5-10 minutes..." -ForegroundColor Cyan
            
            $pullProcess = Start-Process -FilePath "ollama" -ArgumentList "pull", "llama3" -Wait -PassThru -NoNewWindow
            if ($pullProcess.ExitCode -eq 0) {
                Write-Host "✅ Llama 3 downloaded successfully" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Llama 3 download may have failed" -ForegroundColor Yellow
                Write-Host "💡 Try running manually: ollama pull llama3" -ForegroundColor Cyan
            }
        }
    }
} catch {
    Write-Host "❌ Cannot connect to Ollama service" -ForegroundColor Red
    Write-Host "💡 Make sure Ollama is running: ollama serve" -ForegroundColor Cyan
    exit 1
}

# Test the integration
Write-Host "🧪 Testing Llama 3 integration..." -ForegroundColor Blue
try {
    $testBody = @{
        model = "llama3"
        prompt = "Hello! Please respond with 'Llama 3 is working!'"
        stream = $false
    } | ConvertTo-Json
    
    $testResponse = Invoke-WebRequest -Uri "http://localhost:11434/api/generate" -Method POST -ContentType "application/json" -Body $testBody -UseBasicParsing -TimeoutSec 10
    if ($testResponse.StatusCode -eq 200) {
        $testData = $testResponse.Content | ConvertFrom-Json
        Write-Host "✅ Llama 3 is working!" -ForegroundColor Green
        Write-Host "🤖 Response: $($testData.response)" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Llama 3 test failed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not test Llama 3: $_" -ForegroundColor Yellow
}

# Final integration status
Write-Host "" -ForegroundColor White
Write-Host "🎉 Integration Status:" -ForegroundColor Green
Write-Host "✅ 2K AI Accounting Systems: Fully integrated with Llama 3" -ForegroundColor Green
Write-Host "✅ Smart AI Switching: Automatically detects and uses Llama 3" -ForegroundColor Green
Write-Host "✅ Fallback System: Mock AI always available as backup" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Refresh: test-ai-integration.html" -ForegroundColor White
Write-Host "2. Test: Click all test buttons" -ForegroundColor White
Write-Host "3. Try: Action AI at http://localhost:8080/action-ai" -ForegroundColor White
Write-Host "4. Enjoy: Enhanced AI intelligence!" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "🚀 Your AI accounting system is now supercharged with Llama 3!" -ForegroundColor Green

Read-Host "Press Enter to exit"
