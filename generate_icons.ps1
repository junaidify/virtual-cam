# Generate simple PNG icons for VirtualCam Chrome extension
# Creates 16x16, 48x48, and 128x128 icons with a camera-style design

Add-Type -AssemblyName System.Drawing

function New-VirtualCamIcon {
    param([int]$Size, [string]$OutputPath)
    
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.InterpolationMode = 'HighQualityBicubic'
    
    # Background - purple gradient
    $rect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(139, 92, 246),  # Purple
        [System.Drawing.Color]::FromArgb(59, 130, 246),   # Blue
        45
    )
    
    # Rounded rect background
    $g.FillRectangle($brush, $rect)
    
    # Camera icon (white circle in center)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $margin = [int]($Size * 0.25)
    $camSize = $Size - ($margin * 2)
    $g.FillEllipse($whiteBrush, $margin, $margin, $camSize, $camSize)
    
    # Inner circle (lens)
    $innerBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(100, 59, 130, 246),
        [System.Drawing.Color]::FromArgb(200, 139, 92, 246),
        135
    )
    $innerMargin = [int]($Size * 0.35)
    $innerSize = $Size - ($innerMargin * 2)
    $g.FillEllipse($innerBrush, $innerMargin, $innerMargin, $innerSize, $innerSize)
    
    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    $brush.Dispose()
    $whiteBrush.Dispose()
    $innerBrush.Dispose()
    
    Write-Host "Created: $OutputPath ($Size x $Size)"
}

$iconsDir = Join-Path $PSScriptRoot "icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

New-VirtualCamIcon -Size 16 -OutputPath (Join-Path $iconsDir "icon16.png")
New-VirtualCamIcon -Size 48 -OutputPath (Join-Path $iconsDir "icon48.png")
New-VirtualCamIcon -Size 128 -OutputPath (Join-Path $iconsDir "icon128.png")

Write-Host "All icons generated successfully!"
