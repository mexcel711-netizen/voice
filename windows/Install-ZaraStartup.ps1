param(
    [switch]$LaunchNow
)

$ErrorActionPreference = "Stop"
$appUrl = "https://voice-8ts.pages.dev"
$shortcutName = "Zara AI Assistant.lnk"

function Find-Chrome {
    $registryPaths = @(
        "HKCU:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe",
        "HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe",
        "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe"
    )

    foreach ($registryPath in $registryPaths) {
        if (Test-Path $registryPath) {
            $candidate = (Get-Item $registryPath).GetValue("")
            if ($candidate -and (Test-Path -LiteralPath $candidate)) {
                return $candidate
            }
        }
    }

    $programFilesX86 = [Environment]::GetEnvironmentVariable("ProgramFiles(x86)")
    $candidates = @(
        (Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe"),
        (Join-Path $programFilesX86 "Google\Chrome\Application\chrome.exe"),
        (Join-Path $env:LOCALAPPDATA "Google\Chrome\Application\chrome.exe")
    )

    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path -LiteralPath $candidate)) {
            return $candidate
        }
    }

    $command = Get-Command "chrome.exe" -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    throw "Google Chrome nahi mila. Pehle Chrome install karein, phir is installer ko dobara chalayein."
}

$chromePath = Find-Chrome
$startupFolder = [Environment]::GetFolderPath([Environment+SpecialFolder]::Startup)
if (-not (Test-Path $startupFolder)) {
    New-Item -ItemType Directory -Path $startupFolder -Force | Out-Null
}

$shortcutPath = Join-Path $startupFolder $shortcutName
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $chromePath
$shortcut.Arguments = "--app=$appUrl --start-maximized"
$shortcut.WorkingDirectory = Split-Path -Parent $chromePath
$shortcut.Description = "Open Zara AI Assistant when you sign in to Windows"
$shortcut.IconLocation = "$chromePath,0"
$shortcut.Save()

Write-Host ""
Write-Host "Zara startup shortcut installed successfully." -ForegroundColor Green
Write-Host "Chrome: $chromePath"
Write-Host "Startup shortcut: $shortcutPath"
Write-Host "Zara will open automatically after you sign in to Windows."

if ($LaunchNow) {
    Start-Process -FilePath $chromePath -ArgumentList @("--app=$appUrl", "--start-maximized")
    Write-Host "Zara has been opened in Chrome app window."
}

Write-Host ""
Write-Host "Note: Windows must be signed in and connected to the internet."
