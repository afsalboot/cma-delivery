param(
    [ValidateSet("debug", "release")]
    [string]$Mode = "debug"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$androidStudioJdk = "C:\Program Files\Android\Android Studio\jbr"

if (Test-Path -LiteralPath $androidStudioJdk) {
    $env:JAVA_HOME = $androidStudioJdk
    $env:Path = "$env:JAVA_HOME\bin;$env:Path"
}

if (-not $env:ANDROID_HOME) {
    $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA "Android\Sdk"
}
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME

Push-Location $projectRoot
try {
    & npx.cmd cap sync android
    if ($LASTEXITCODE -ne 0) {
        throw "Capacitor sync failed with exit code $LASTEXITCODE."
    }

    Push-Location (Join-Path $projectRoot "android")
    try {
        $task = if ($Mode -eq "release") { "bundleRelease" } else { "assembleDebug" }
        & .\gradlew.bat $task --no-daemon --max-workers=2
        if ($LASTEXITCODE -ne 0) {
            throw "Android build failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}
finally {
    Pop-Location
}
