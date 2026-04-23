$base = 'C:\Users\sinha\OneDrive\Desktop\Club Manager\frontend\app'

# Remove old flat route directories (they are now inside route groups)
Remove-Item -LiteralPath (Join-Path $base 'dashboard') -Recurse -Force
Write-Host 'Removed old /dashboard'

Remove-Item -LiteralPath (Join-Path $base 'workspace') -Recurse -Force
Write-Host 'Removed old /workspace'

Remove-Item -LiteralPath (Join-Path $base 'analytics') -Recurse -Force
Write-Host 'Removed old /analytics'

Remove-Item -LiteralPath (Join-Path $base 'users') -Recurse -Force
Write-Host 'Removed old /users'

Remove-Item -LiteralPath (Join-Path $base 'board') -Recurse -Force
Write-Host 'Removed old /board'

Write-Host 'Cleanup complete!'
