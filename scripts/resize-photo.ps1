# Resize my-pic.png into web-friendly derivatives.
$ErrorActionPreference = 'Stop'
$src  = 'C:\Users\noora\Downloads\md-wahid-3d-portfolio\public\my-pic.png'
$pub  = 'C:\Users\noora\Downloads\md-wahid-3d-portfolio\public'
if (-not (Test-Path $src)) { Write-Host 'no source photo - skip'; exit 0 }

Add-Type -AssemblyName System.Drawing

function Resize($srcPath, $dstPath, $w, $h, [string]$fmt = 'Png', [int]$quality = 85) {
  $img = [System.Drawing.Image]::FromFile($srcPath)
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  $ratio = [Math]::Max($w / $img.Width, $h / $img.Height)
  $sw = [int]($w / $ratio); $sh = [int]($h / $ratio)
  $g.DrawImage($img, 0, 0, $sw, $sh)
  $codec = [System.Drawing.Imaging.ImageFormat]::$fmt
  $params = New-Object System.Drawing.Imaging.EncoderParameters 1
  $param  = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [int64]$quality)
  $params.Param[0] = $param
  $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq ('image/' + $fmt.ToLower()) } | Select-Object -First 1
  if ($encoder) {
    $bmp.Save($dstPath, $encoder, $params)
  } else {
    $bmp.Save($dstPath, $codec)
  }
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  $size = (Get-Item $dstPath).Length
  Write-Host ('  -> ' + $dstPath + ' (' + $w + 'x' + $h + ', ' + $fmt + ', ' + [Math]::Round($size/1KB, 1) + ' KB)')
}

Resize $src (Join-Path $pub 'avatar.jpg')   600 600 'Jpeg' 85
Resize $src (Join-Path $pub 'avatar.png')   600 600 'Png'  100
Resize $src (Join-Path $pub 'apple-touch-icon.png') 180 180 'Png' 100
Resize $src (Join-Path $pub 'favicon-32.png')        32 32  'Png' 100
Write-Host 'done'