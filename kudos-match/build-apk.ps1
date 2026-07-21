# Build Script for Android APK
Write-Host "Starting Android APK build process..."
Write-Host "This requires an Expo account and eas-cli installed globally (npm install -g eas-cli)."
Write-Host "You may be prompted to log in to Expo if you haven't already."

try {
    eas build -p android --profile preview
    Write-Host "Build queued successfully! Follow the link provided by EAS to download your APK when it finishes."
} catch {
    Write-Host "Failed to start EAS build. Make sure eas-cli is installed and you are logged in."
}
