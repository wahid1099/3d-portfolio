# Build the social-share OG image: 1200x630, photo on the right, text on the left.
$ErrorActionPreference = 'Stop'
$pub = 'C:\Users\noora\Downloads\md-wahid-3d-portfolio\public'
$photo = Join-Path $pub 'avatar.jpg'
$out   = Join-Path $pub 'og-image.png'
if (-not (Test-Path $photo)) {
  Write-Host 'no avatar.jpg - skipping og-image.png regeneration'
  exit 0
}

Add-Type -AssemblyName System.Drawing

$W = 1200; $H = 630
$bmp = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'AntiAliasGridFit'
$g.PixelOffsetMode = 'HighQuality'
$g.InterpolationMode = 'HighQualityBicubic'
$g.CompositingQuality = 'HighQuality'

# Background gradient
$bgRect = New-Object System.Drawing.Rectangle 0, 0, $W, $H
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $bgRect, ([System.Drawing.Color]::FromArgb(255,10,18,38)), ([System.Drawing.Color]::FromArgb(255,4,6,13)), 90
$g.FillRectangle($bgBrush, $bgRect)
$bgBrush.Dispose()

# Subtle grid
$grid = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(15,111,220,239)), 1
for ($y = 100; $y -lt $H; $y += 100) { $g.DrawLine($grid, 0, $y, $W, $y) }
for ($x = 200; $x -lt $W; $x += 200) { $g.DrawLine($grid, $x, 0, $x, $H) }
$grid.Dispose()

# Photo (right side, circular)
$photoImg = [System.Drawing.Image]::FromFile($photo)
$pw = 480
$cx = $W - $pw - 60
$cy = [int](($H - $pw) / 2) + 30
$circle = New-Object System.Drawing.Rectangle $cx, $cy, $pw, $pw
$gp = New-Object System.Drawing.Drawing2D.GraphicsPath
$gp.AddEllipse($circle)
$g.SetClip($gp)
$g.DrawImage($photoImg, $circle)
$g.ResetClip()
# Border
$border = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255,111,220,239)), 4
$g.DrawEllipse($border, $circle)
$border.Dispose()
$gp.Dispose()
$photoImg.Dispose()

# Text
$nameFont = New-Object System.Drawing.Font 'Inter', 64, ([System.Drawing.FontStyle]::Bold)
$subFont  = New-Object System.Drawing.Font 'Inter', 26, ([System.Drawing.FontStyle]::Regular)
$monoFont = New-Object System.Drawing.Font 'Consolas', 16, ([System.Drawing.FontStyle]::Regular)
$cyanBrush   = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,111,220,239))
$whiteBrush  = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,255,255))
$mutedBrush  = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,184,196,221))
$ghostBrush  = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,138,153,184))

# Eyebrow
$g.DrawString('L00  ·  QUANTUM-SAFE PORTFOLIO', $monoFont, $cyanBrush, 80, 110)

# Name
$g.DrawString('Md. Wahid', $nameFont, $whiteBrush, 80, 200)

# Subtitle (two lines)
$g.DrawString('Software Engineer  ·  Backend  ·  Cloud  ·', $subFont, $mutedBrush, 80, 290)
$g.DrawString('DevOps  ·  Quantum-Safe Security', $subFont, $mutedBrush, 80, 328)

# Accent line
$accent = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255,111,220,239)), 4
$g.DrawLine($accent, 80, 400, 640, 400)
$accent.Dispose()

# Footer
$g.DrawString('github.com/wahid1099', $monoFont, $cyanBrush, 80, 540)
$g.DrawString('linkedin.com/in/md-wahid1', $monoFont, $ghostBrush, 80, 568)
$g.DrawString('brilliant-vacherin-479187.netlify.app', $monoFont, $ghostBrush, ($W - 80), 568, (New-Object System.Drawing.StringFormat))

$outDir = Split-Path $out
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$nameFont.Dispose(); $subFont.Dispose(); $monoFont.Dispose()
$cyanBrush.Dispose(); $whiteBrush.Dispose(); $mutedBrush.Dispose(); $ghostBrush.Dispose()
$bmp.Dispose(); $g.Dispose()

Write-Host ('  -> ' + $out + ' (' + [Math]::Round((Get-Item $out).Length/1KB, 1) + ' KB)')
Write-Host 'done'