# Ponnect Development Server with Cloudflare Tunnel
# This script starts both the Next.js dev server and cloudflared tunnel

Write-Host "🚀 Starting Ponnect Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Start the Next.js dev server in a new window
Write-Host "📦 Starting Next.js dev server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"

# Wait a moment for the dev server to start
Write-Host "⏳ Waiting for dev server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start cloudflared tunnel in a new window
Write-Host "🌐 Starting Cloudflare Tunnel..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; cloudflared tunnel run ponnect-dev"

Write-Host ""
Write-Host "✅ Development environment started!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Local:  http://localhost:3000" -ForegroundColor White
Write-Host "📍 Tunnel: Check the cloudflared window for the external URL" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
