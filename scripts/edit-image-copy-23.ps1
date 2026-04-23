Add-Type -AssemblyName System.Drawing

$imagePath = "C:\Users\revanth.apuri\Downloads\yl-marketing login\image copy 23.png"
$bitmap = [System.Drawing.Bitmap]::FromFile($imagePath)

try {
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $backgroundBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(246, 241, 238))
    $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(31, 36, 92))
    $font = New-Object System.Drawing.Font("Segoe UI", 19, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

    $graphics.FillRectangle($backgroundBrush, 292, 23, 270, 32)
    $graphics.DrawString("YL-MARKETING", $font, $textBrush, 299, 20)

    $bitmap.Save($imagePath, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
    if ($font) { $font.Dispose() }
    if ($textBrush) { $textBrush.Dispose() }
    if ($backgroundBrush) { $backgroundBrush.Dispose() }
    if ($graphics) { $graphics.Dispose() }
    $bitmap.Dispose()
}
