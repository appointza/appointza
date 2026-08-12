#Requires -Version 5.1
<#
.SYNOPSIS
  Run separate production folders (after .\build-separate.ps1).

.EXAMPLE
  .\build-separate.ps1
  .\run-all-production.ps1
  .\run-all-production.ps1 -Product stay
#>
param(
    [string[]]$Product = @("appointza", "stay", "campusza", "webzys")
)

$ErrorActionPreference = "Stop"
$root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }

$buildRoot = Join-Path $root "appointzabuild"

$allProducts = @(
    @{ Id = "appointza"; Name = "Appointza"; OutputDir = "appointzaproduction"; Port = 5000 },
    @{ Id = "stay";      Name = "Stay";     OutputDir = "stayproduction";      Port = 5001 },
    @{ Id = "campusza";  Name = "Campusza"; OutputDir = "campuszaproduction"; Port = 5002 },
    @{ Id = "webzys";    Name = "Webzys";   OutputDir = "webzysproduction";   Port = 5003 }
)

function Start-ProductServer([hashtable]$Row) {
    $prodOut = Join-Path $buildRoot $Row.OutputDir
    $exe = Join-Path $prodOut "appointza.exe"
    $index = Join-Path $prodOut "wwwroot\index.html"

    if (-not (Test-Path $exe)) {
        Write-Host "Skip $($Row.Name) - missing $exe (run .\build-separate.ps1)" -ForegroundColor Red
        return
    }
    if (-not (Test-Path $index)) {
        Write-Host "Skip $($Row.Name) - missing wwwroot/index.html" -ForegroundColor Red
        return
    }

    $portInUse = Get-NetTCPConnection -LocalPort $Row.Port -State Listen -ErrorAction SilentlyContinue
    if ($portInUse) {
        Write-Host "$($Row.Name) port $($Row.Port) already in use" -ForegroundColor Yellow
        return
    }

    Write-Host "Starting $($Row.Name) on http://localhost:$($Row.Port) ..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd.exe" -ArgumentList @(
        "/c",
        "set ASPNETCORE_URLS=http://localhost:$($Row.Port)& `"$exe`""
    ) -WorkingDirectory $prodOut -WindowStyle Normal
}

Write-Host ""
Write-Host "Separate production run" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Green

$selectedIds = $Product | ForEach-Object { $_.Trim().ToLower() }
$selected = $allProducts | Where-Object { $selectedIds -contains $_.Id }

if ($selected.Count -eq 0) {
    Write-Host "No products matched." -ForegroundColor Red
    exit 1
}

foreach ($row in $selected) {
    Start-ProductServer -Row $row
}

Write-Host ""
Write-Host "Open:" -ForegroundColor Green
foreach ($row in $selected) {
    Write-Host ("  appointzabuild\{0,-22} http://localhost:{1}" -f $row.OutputDir, $row.Port)
}
