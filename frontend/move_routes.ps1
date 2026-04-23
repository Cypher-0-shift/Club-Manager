$base = 'C:\Users\sinha\OneDrive\Desktop\Club Manager\frontend\app'
$admin = Join-Path $base '(admin)'
$member = Join-Path $base '(member)'

Copy-Item -LiteralPath (Join-Path $base 'dashboard\page.tsx') -Destination (Join-Path $admin 'dashboard\page.tsx') -Force
Write-Host 'Copied dashboard'

Copy-Item -LiteralPath (Join-Path $base 'workspace\page.tsx') -Destination (Join-Path $admin 'workspace\page.tsx') -Force
Write-Host 'Copied workspace'

Copy-Item -LiteralPath (Join-Path $base 'workspace\[domainId]\page.tsx') -Destination (Join-Path $admin 'workspace\[domainId]\page.tsx') -Force
Write-Host 'Copied workspace/[domainId]'

Copy-Item -LiteralPath (Join-Path $base 'analytics\page.tsx') -Destination (Join-Path $admin 'analytics\page.tsx') -Force
Write-Host 'Copied analytics'

Copy-Item -LiteralPath (Join-Path $base 'users\page.tsx') -Destination (Join-Path $admin 'users\page.tsx') -Force
Write-Host 'Copied users'

Copy-Item -LiteralPath (Join-Path $base 'board\page.tsx') -Destination (Join-Path $member 'board\page.tsx') -Force
Write-Host 'Copied board'

Write-Host 'All pages copied successfully!'
