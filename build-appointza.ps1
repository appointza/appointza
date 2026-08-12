# Build Appointza only -> appointzabuild/appointzaproduction/
#Requires -Version 5.1
& "$PSScriptRoot\build-separate.ps1" -Product appointza @args
exit $LASTEXITCODE
