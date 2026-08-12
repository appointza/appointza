# build-all-ports.ps1 - Alias for separate per-product production builds
#Requires -Version 5.1
param(
    [switch]$SkipServer,
    [switch]$SkipUi,
    [string]$ApiBaseUrl = ""
)

$argsList = @()
if ($SkipServer) { $argsList += "-SkipServer" }
if ($SkipUi) { $argsList += "-SkipUi" }

& "$PSScriptRoot\build-separate.ps1" @argsList
exit $LASTEXITCODE
