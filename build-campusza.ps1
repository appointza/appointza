# Build Campusza only -> appointzabuild/campuszaproduction/
#Requires -Version 5.1
& "$PSScriptRoot\build-separate.ps1" -Product campusza @args
exit $LASTEXITCODE
