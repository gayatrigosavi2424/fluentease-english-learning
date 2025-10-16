# PowerShell script to fix Windows setup
Write-Host "🔧 Fixing Windows Setup..." -ForegroundColor Green

# Remove old virtual environment
if (Test-Path "venv") {
    Write-Host "Removing old virtual environment..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force venv
}

# Create new virtual environment
Write-Host "Creating new virtual environment..." -ForegroundColor Yellow
python -m venv venv

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install requirements
Write-Host "Installing requirements..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "Now run: python start.py" -ForegroundColor Cyan