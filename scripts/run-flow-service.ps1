param([Parameter(Mandatory=$true)][ValidateSet('api', 'ui')][string]$Service)
$ErrorActionPreference = 'Stop'
$FlowRoot = Split-Path -Parent $PSScriptRoot
if ($Service -eq 'api') {
    Set-Location (Join-Path $FlowRoot 'backend')
    & (Join-Path $FlowRoot 'backend\.venv\Scripts\python.exe') -m uvicorn flow.main:app --host 127.0.0.1 --port 8000
} else {
    Set-Location (Join-Path $FlowRoot 'frontend')
    $env:HOST = '127.0.0.1'
    $env:PORT = '3000'
    $env:PUBLIC_URL = '/'
    $env:BROWSER = 'none'
    & npm.cmd run start
}
if ($LASTEXITCODE -ne 0) { Write-Host 'Service stopped with an error. Read the output above.' }
