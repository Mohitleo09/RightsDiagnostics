# PowerShell script to implement 6-color Blue palette
# Replaces teal and sage colors with appropriate Blue shades
# Colors:
# 1st: #0700C4 (Medium Blue) - Darkest (900, 800)
# 2nd: #0000FF (Blue) - (700)
# 3rd: #0052FF (RYB Blue) - (600 - Hover)
# 4th: #007AFF (Azure) - Primary (500, 400)
# 5th: #00A3FF (Vivid Cerulean) - (300, 200)
# 6th: #00CCFF (Vivid Sky Blue) - Lightest (100, 50)

$replacements = @{
    # Fix for artifacts from previous partial run
    '#00CCFF0' = '#007AFF' 
    '[#00CCFF]0' = '[#007AFF]'

    # Sage Hexes -> Blue Hexes
    '#E7F5DC' = '#00CCFF'
    '#CFE1B9' = '#00CCFF'
    '#B6C99B' = '#00A3FF'
    '#98A77C' = '#00A3FF'
    '#88976C' = '#007AFF'
    '#728156' = '#0052FF'

    # 50 - Lightest
    'bg-teal-50' = 'bg-[#00CCFF]'
    'text-teal-50' = 'text-[#00CCFF]'
    'border-teal-50' = 'border-[#00CCFF]'
    'ring-teal-50' = 'ring-[#00CCFF]'
    'from-teal-50' = 'from-[#00CCFF]'
    'to-teal-50' = 'to-[#00CCFF]'
    'divide-teal-50' = 'divide-[#00CCFF]'
    'placeholder-teal-50' = 'placeholder-[#00CCFF]'
    'decoration-teal-50' = 'decoration-[#00CCFF]'

    # 100
    'bg-teal-100' = 'bg-[#00CCFF]'
    'text-teal-100' = 'text-[#00CCFF]'
    'border-teal-100' = 'border-[#00CCFF]'
    'ring-teal-100' = 'ring-[#00CCFF]'
    'from-teal-100' = 'from-[#00CCFF]'
    'to-teal-100' = 'to-[#00CCFF]'
    'divide-teal-100' = 'divide-[#00CCFF]'
    'placeholder-teal-100' = 'placeholder-[#00CCFF]'
    'decoration-teal-100' = 'decoration-[#00CCFF]'

    # 200 - 5th
    'bg-teal-200' = 'bg-[#00A3FF]'
    'text-teal-200' = 'text-[#00A3FF]'
    'border-teal-200' = 'border-[#00A3FF]'
    'ring-teal-200' = 'ring-[#00A3FF]'
    'from-teal-200' = 'from-[#00A3FF]'
    'to-teal-200' = 'to-[#00A3FF]'
    'divide-teal-200' = 'divide-[#00A3FF]'
    'placeholder-teal-200' = 'placeholder-[#00A3FF]'
    'decoration-teal-200' = 'decoration-[#00A3FF]'

    # 300 - 5th
    'bg-teal-300' = 'bg-[#00A3FF]'
    'text-teal-300' = 'text-[#00A3FF]'
    'border-teal-300' = 'border-[#00A3FF]'
    'ring-teal-300' = 'ring-[#00A3FF]'
    'from-teal-300' = 'from-[#00A3FF]'
    'to-teal-300' = 'to-[#00A3FF]'
    'divide-teal-300' = 'divide-[#00A3FF]'
    'placeholder-teal-300' = 'placeholder-[#00A3FF]'
    'decoration-teal-300' = 'decoration-[#00A3FF]'

    # 400 - 4th (Primary)
    'bg-teal-400' = 'bg-[#007AFF]'
    'text-teal-400' = 'text-[#007AFF]'
    'border-teal-400' = 'border-[#007AFF]'
    'ring-teal-400' = 'ring-[#007AFF]'
    'from-teal-400' = 'from-[#007AFF]'
    'to-teal-400' = 'to-[#007AFF]'
    'divide-teal-400' = 'divide-[#007AFF]'
    'placeholder-teal-400' = 'placeholder-[#007AFF]'
    'decoration-teal-400' = 'decoration-[#007AFF]'

    # 500 - 4th (Primary)
    'bg-teal-500' = 'bg-[#007AFF]'
    'text-teal-500' = 'text-[#007AFF]'
    'border-teal-500' = 'border-[#007AFF]'
    'ring-teal-500' = 'ring-[#007AFF]'
    'from-teal-500' = 'from-[#007AFF]'
    'to-teal-500' = 'to-[#007AFF]'
    'divide-teal-500' = 'divide-[#007AFF]'
    'placeholder-teal-500' = 'placeholder-[#007AFF]'
    'decoration-teal-500' = 'decoration-[#007AFF]'

    # 600 - 3rd (Darker/Hover)
    'bg-teal-600' = 'bg-[#0052FF]'
    'text-teal-600' = 'text-[#0052FF]'
    'border-teal-600' = 'border-[#0052FF]'
    'ring-teal-600' = 'ring-[#0052FF]'
    'from-teal-600' = 'from-[#0052FF]'
    'to-teal-600' = 'to-[#0052FF]'
    'divide-teal-600' = 'divide-[#0052FF]'
    'placeholder-teal-600' = 'placeholder-[#0052FF]'
    'decoration-teal-600' = 'decoration-[#0052FF]'

    # 700 - 2nd
    'bg-teal-700' = 'bg-[#0000FF]'
    'text-teal-700' = 'text-[#0000FF]'
    'border-teal-700' = 'border-[#0000FF]'
    'ring-teal-700' = 'ring-[#0000FF]'
    'from-teal-700' = 'from-[#0000FF]'
    'to-teal-700' = 'to-[#0000FF]'
    'divide-teal-700' = 'divide-[#0000FF]'
    'placeholder-teal-700' = 'placeholder-[#0000FF]'
    'decoration-teal-700' = 'decoration-[#0000FF]'

    # 800 - 1st
    'bg-teal-800' = 'bg-[#0700C4]'
    'text-teal-800' = 'text-[#0700C4]'
    'border-teal-800' = 'border-[#0700C4]'
    'ring-teal-800' = 'ring-[#0700C4]'
    'from-teal-800' = 'from-[#0700C4]'
    'to-teal-800' = 'to-[#0700C4]'
    'divide-teal-800' = 'divide-[#0700C4]'
    'placeholder-teal-800' = 'placeholder-[#0700C4]'
    'decoration-teal-800' = 'decoration-[#0700C4]'
    
    # 900 - 1st
    'bg-teal-900' = 'bg-[#0700C4]'
    'text-teal-900' = 'text-[#0700C4]'
    'border-teal-900' = 'border-[#0700C4]'
    'ring-teal-900' = 'ring-[#0700C4]'
    'from-teal-900' = 'from-[#0700C4]'
    'to-teal-900' = 'to-[#0700C4]'
    'divide-teal-900' = 'divide-[#0700C4]'
    'placeholder-teal-900' = 'placeholder-[#0700C4]'
    'decoration-teal-900' = 'decoration-[#0700C4]'

    # Hover Overrides
    'hover:bg-teal-400' = 'hover:bg-[#0052FF]'
    'hover:bg-teal-500' = 'hover:bg-[#0052FF]' 
    'hover:text-teal-500' = 'hover:text-[#0052FF]'
    'hover:border-teal-500' = 'hover:border-[#0052FF]'
    'hover:to-teal-700' = 'hover:to-[#0000FF]'

    # Active/Focus Overrides
    'active:bg-teal-600' = 'active:bg-[#0052FF]'
    'focus:border-teal-500' = 'focus:border-[#007AFF]'
    'focus:ring-teal-500' = 'focus:ring-[#007AFF]'
}

$files = Get-ChildItem -Path "a:\rightslab\src\app" -Include *.jsx, *.js, *.css -Recurse
$totalReplacements = 0

# IMPORTANT: Sort keys by length descending to prevent substring issues (e.g. replacing 'teal-50' inside 'teal-500')
$sortedKeys = $replacements.Keys | Sort-Object { $_.Length } -Descending

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    foreach ($key in $sortedKeys) {
        $content = $content -replace [regex]::Escape($key), $replacements[$key]
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $totalReplacements++
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Total files updated: $totalReplacements"
Write-Host "Fixed bugs from previous run and applied full Blue palette."
