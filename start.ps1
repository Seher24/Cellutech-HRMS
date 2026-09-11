# Cellutech HRMS - one-click demo starter
# Usage:
#   .\start.ps1
#   or double-click start.bat

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cellutech HRMS - Demo Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: '$name' is not installed or not on PATH." -ForegroundColor Red
    Write-Host "Install Node.js LTS from https://nodejs.org and try again." -ForegroundColor Yellow
    exit 1
  }
}

Assert-Command "node"
Assert-Command "npm"

$nodeVersion = (node -v)
Write-Host "Node: $nodeVersion" -ForegroundColor Green

# 1) Environment file
if (-not (Test-Path ".env")) {
  Write-Host "[1/5] Creating .env from .env.example ..." -ForegroundColor Yellow
  if (-not (Test-Path ".env.example")) {
    Write-Host "ERROR: .env.example is missing." -ForegroundColor Red
    exit 1
  }
  Copy-Item ".env.example" ".env"
  # Use a stable local demo secret so Auth.js works out of the box
  $content = Get-Content ".env" -Raw
  $content = $content -replace 'AUTH_SECRET="replace-with-a-long-random-secret"', 'AUTH_SECRET="cellutech-hrms-demo-secret-change-me-32"'
  Set-Content -Path ".env" -Value $content -NoNewline
  Write-Host "      .env ready" -ForegroundColor Green
} else {
  Write-Host "[1/5] .env already exists" -ForegroundColor Green
}

# 2) Dependencies
if (-not (Test-Path "node_modules")) {
  Write-Host "[2/5] Installing npm dependencies (first run may take a few minutes) ..." -ForegroundColor Yellow
  npm install
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "      Dependencies installed" -ForegroundColor Green
} else {
  Write-Host "[2/5] node_modules found - skipping install" -ForegroundColor Green
  Write-Host "      Tip: delete node_modules and re-run if packages look broken" -ForegroundColor DarkGray
}

# 3) Prisma client
Write-Host "[3/5] Generating Prisma client ..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "      Prisma client ready" -ForegroundColor Green

# 4) Database migrate + seed (always refresh demo data for a clean demo)
Write-Host "[4/5] Applying migrations and seeding demo data ..." -ForegroundColor Yellow
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
  Write-Host "      migrate deploy failed - trying migrate dev ..." -ForegroundColor Yellow
  npx prisma migrate dev --name init
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
npx tsx prisma/seed.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "      Database ready and seeded" -ForegroundColor Green

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host " Demo logins (password for all):" -ForegroundColor White
Write-Host "   Password123!" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Super Admin : seher.siddique@hrms.pk" -ForegroundColor White
Write-Host "   HR Manager  : hr.karachi@hrms.pk" -ForegroundColor White
Write-Host "   Dept Head   : head.eng@hrms.pk" -ForegroundColor White
Write-Host "   Team Lead   : lead.eng@hrms.pk" -ForegroundColor White
Write-Host "   Employee    : usman.raza@hrms.pk" -ForegroundColor White
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "[5/5] Starting Next.js at http://localhost:3000 ..." -ForegroundColor Yellow
Write-Host "      Press Ctrl+C to stop the server" -ForegroundColor DarkGray
Write-Host ""

npm run dev
