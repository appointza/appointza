# Build Stay only -> appointzabuild/stayproduction/
#Requires -Version 5.1
& "$PSScriptRoot\build-separate.ps1" -Product stay @args
exit $LASTEXITCODE
