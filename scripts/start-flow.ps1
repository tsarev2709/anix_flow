$ErrorActionPreference = 'Stop'
$FlowRoot = Split-Path -Parent $PSScriptRoot
Set-Location $FlowRoot

function Assert-LastExit([string]$Message) {
    if ($LASTEXITCODE -ne 0) { throw $Message }
}

try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 20 or newer, then run start-flow.cmd again.' }
    $FlowNodeMajor = [int]((& node --version).TrimStart('v').Split('.')[0])
    if ($FlowNodeMajor -lt 20) { throw 'Node.js 20 or newer is required.' }
    if (Get-Command py -ErrorAction SilentlyContinue) { $FlowPython = 'py'; $FlowPythonArgs = @('-3') }
    elseif (Get-Command python -ErrorAction SilentlyContinue) { $FlowPython = 'python'; $FlowPythonArgs = @() }
    else { throw 'Install Python 3.11 or newer with the Python launcher, then run start-flow.cmd again.' }
    & $FlowPython @FlowPythonArgs -c "import sys; assert sys.version_info >= (3, 11), 'Python 3.11+ required'"
    Assert-LastExit 'Python 3.11 or newer is required.'

    $FlowVenv = Join-Path $FlowRoot 'backend\.venv'
    if (-not (Test-Path (Join-Path $FlowVenv 'Scripts\python.exe'))) {
        Write-Host 'Creating the local Python environment...'
        & $FlowPython @FlowPythonArgs -m venv $FlowVenv
        Assert-LastExit 'Could not create the Python environment.'
    }
    $FlowRequirements = Join-Path $FlowRoot 'backend\requirements-flow.txt'
    $FlowPythonHash = (Get-FileHash $FlowRequirements -Algorithm SHA256).Hash
    $FlowPythonMarker = Join-Path $FlowVenv '.flow-requirements-hash'
    if (-not (Test-Path $FlowPythonMarker) -or (Get-Content $FlowPythonMarker -Raw).Trim() -ne $FlowPythonHash) {
        Write-Host 'Installing Python dependencies...'
        & (Join-Path $FlowVenv 'Scripts\python.exe') -m pip install -r $FlowRequirements
        Assert-LastExit 'Python dependency installation failed.'
        Set-Content $FlowPythonMarker $FlowPythonHash
    }
    $FlowLock = Join-Path $FlowRoot 'frontend\package-lock.json'
    $FlowNodeHash = (Get-FileHash $FlowLock -Algorithm SHA256).Hash
    $FlowNodeMarker = Join-Path $FlowRoot 'frontend\node_modules\.flow-lock-hash'
    if (-not (Test-Path $FlowNodeMarker) -or (Get-Content $FlowNodeMarker -Raw).Trim() -ne $FlowNodeHash) {
        Write-Host 'Installing frontend dependencies...'
        Push-Location (Join-Path $FlowRoot 'frontend')
        try { & npm.cmd ci --ignore-scripts --no-audit --no-fund; Assert-LastExit 'Frontend dependency installation failed.' }
        finally { Pop-Location }
        Set-Content $FlowNodeMarker $FlowNodeHash
    }
    $FlowEnv = Join-Path $FlowRoot 'backend\.env'
    if (-not (Test-Path $FlowEnv)) { Copy-Item (Join-Path $FlowRoot 'backend\.env.flow.example') $FlowEnv }
    Write-Host 'Starting API and interface on loopback only...'
    $FlowServiceScript = Join-Path $PSScriptRoot 'run-flow-service.ps1'
    Start-Process powershell.exe -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-NoExit', '-File', ('"' + $FlowServiceScript + '"'), '-Service', 'api')
    Start-Process powershell.exe -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-NoExit', '-File', ('"' + $FlowServiceScript + '"'), '-Service', 'ui')
    Write-Host 'Waiting for http://127.0.0.1:3000 ...'
    $FlowReady = $false
    for ($FlowAttempt = 0; $FlowAttempt -lt 45; $FlowAttempt++) {
        try { $FlowResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:3000' -UseBasicParsing -TimeoutSec 2; if ($FlowResponse.StatusCode -eq 200) { $FlowReady = $true; break } }
        catch { Start-Sleep -Seconds 2 }
    }
    if ($FlowReady) { Start-Process 'http://127.0.0.1:3000' }
    else { Write-Host 'Open http://127.0.0.1:3000 when the UI window reports successful compilation.' }
    Write-Host 'Ollama must be running with the selected model (default: qwen3:8b).'
    Write-Host 'To stop the app, press Ctrl+C in each of the two service windows.'
} catch {
    Write-Error $_
    exit 1
}
