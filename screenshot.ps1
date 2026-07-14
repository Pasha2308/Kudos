
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$Screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$Bitmap = New-Object System.Drawing.Bitmap $Screen.Width, $Screen.Height
$Graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
$Graphics.CopyFromScreen($Screen.X, $Screen.Y, 0, 0, $Bitmap.Size)
$Bitmap.Save("C:\Users\coole\.gemini\antigravity-ide\brain\12eb68ac-e968-4d71-b76f-9877fa360c44\screenshot.png", [System.Drawing.Imaging.ImageFormat]::Png)
$Graphics.Dispose()
$Bitmap.Dispose()

