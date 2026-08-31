# MUSTANER - assemble index.html from HTML components
# Usage:  powershell -File scripts/build.ps1
# Edit files under components/, then run this to regenerate index.html.

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$utf8 = New-Object System.Text.UTF8Encoding $false

$parts = @(
  'components/layout/head.html'
  'components/layout/skip-link.html'
  'components/layout/masthead.html'
  'components/sections/hero.html'
  'components/sections/quickbar.html'
  'components/layout/main-open.html'
  'components/sections/video.html'
  'components/sections/overview.html'
  'components/sections/audience.html'
  'components/sections/curriculum.html'
  'components/sections/media.html'
  'components/sections/proof.html'
  'components/sections/schedule.html'
  'components/sections/fees.html'
  'components/sections/clients.html'
  'components/sections/faq.html'
  'components/layout/main-close.html'
  'components/sections/finalcta.html'
  'components/layout/footer.html'
  'components/layout/fab.html'
  'components/layout/modal.html'
  'components/layout/lightbox.html'
  'components/layout/scripts.html'
  'components/layout/body-close.html'
)

$out = New-Object System.Collections.Generic.List[string]
$out.Add('<!-- Built from components/ - edit those files, then: powershell -File scripts/build.ps1 -->')

foreach ($rel in $parts) {
  $path = Join-Path $root ($rel -replace '/', [IO.Path]::DirectorySeparatorChar)
  if (-not (Test-Path $path)) {
    throw "Missing component: $rel"
  }
  $chunk = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8).TrimEnd()
  if ($chunk.Length -eq 0) { continue }
  $out.Add('')
  $out.Add("<!-- @@include $rel -->")
  $out.Add($chunk)
}

$html = ($out -join "`n") + "`n"
[System.IO.File]::WriteAllText((Join-Path $root 'index.html'), $html, $utf8)
Write-Host "Built index.html from $($parts.Count) components."
