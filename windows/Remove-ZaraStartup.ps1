$ErrorActionPreference = "Stop"
$startupFolder = [Environment]::GetFolderPath([Environment+SpecialFolder]::Startup)
$shortcutPath = Join-Path $startupFolder "Zara AI Assistant.lnk"

if (Test-Path -LiteralPath $shortcutPath) {
    Remove-Item -LiteralPath $shortcutPath -Force
    Write-Host "Zara automatic startup has been disabled." -ForegroundColor Green
} else {
    Write-Host "No Zara startup shortcut was found."
}
