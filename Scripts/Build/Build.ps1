[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$scriptsDirectory = Split-Path -Parent $PSScriptRoot
$repositoryRoot = Split-Path -Parent $scriptsDirectory
$outputPath = Join-Path $repositoryRoot 'UserScript.js'

$sourceFiles = @(
    'Core\PageBootstrap.js'
    'Core\Analyzer.js'
    'Core\Core.js'
    'Rules\Generic.js'
    'Rules\bicaaa.js'
    'Rules\Cloudflare.js'
    'Rules\Tzkibb.js'
    'Core\HookLocation.js'
    'Core\HookScript.js'
    'Core\HookTimer.js'
    'Core\HookEval.js'
    'Core\HookIframe.js'
    'Core\HookHistory.js'
    'Core\HookTouch.js'
)

$header = @(
    '// ==UserScript=='
    '// @name         NovelAdBlock'
    '// @namespace    https://github.com/NovelAdBlock'
    '// @version      0.2.2'
    '// @description  Block novel-site ad redirects, popups, injected scripts and frames.'
    '// @match        *://*/*'
    '// @run-at       document-start'
    '// @grant        none'
    '// ==/UserScript=='
) -join "`r`n"

$sections = [System.Collections.Generic.List[string]]::new()
$sections.Add($header)

foreach ($relativePath in $sourceFiles) {
    $sourcePath = Join-Path $scriptsDirectory $relativePath
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
        throw "Missing source file: $sourcePath"
    }

    $source = [System.IO.File]::ReadAllText($sourcePath)
    $source = [System.Text.RegularExpressions.Regex]::Replace($source, "\r\n|\r|\n", "`r`n").TrimEnd()
    $sections.Add($source)
}

$sections.Add(';window.NovelAdBlock.install();')
$bundle = ($sections -join "`r`n`r`n") + "`r`n"
$utf8Bom = [System.Text.UTF8Encoding]::new($true)
[System.IO.File]::WriteAllText($outputPath, $bundle, $utf8Bom)

Write-Host "Built $outputPath"
