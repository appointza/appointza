# Build Webzys only -> appointzabuild/webzysproduction/
#Requires -Version 5.1
& "$PSScriptRoot\build-separate.ps1" -Product webzys @args
exit $LASTEXITCODE
