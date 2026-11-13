param(
    [Parameter(Mandatory)][ValidateSet('Publish', 'Rollback')][string]$Action,
    [Parameter(Mandatory)][ValidatePattern('^[a-z0-9][a-z0-9.-]+$')][string]$Bucket,
    [Parameter(Mandatory)][ValidatePattern('^[A-Z0-9]+$')][string]$Distribution,
    [Parameter(Mandatory)][string]$Profile,
    [Parameter(Mandatory)][string]$Receipt,
    [string]$Build = 'dist'
)

$ErrorActionPreference = 'Stop'

function Invoke-ReleaseAws {
    $output = & aws @args --profile $Profile --no-cli-pager
    if ($LASTEXITCODE -ne 0) { throw "AWS command failed: $($args -join ' ')" }
    $output
}

function Get-ReleaseHash($Path) {
    (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
}

$site = "s3://$Bucket"
$backup = Join-Path $Receipt 'previous-index.html'
$manifestPath = Join-Path $Receipt 'release.json'
$probe = Join-Path $Receipt 'verification.tmp'

if ($Action -eq 'Publish') {
    $buildRoot = (Resolve-Path -LiteralPath $Build).Path
    $entry = Join-Path $buildRoot 'index.html'
    $candidateHash = Get-ReleaseHash $entry
    if (Test-Path -LiteralPath $Receipt) { throw 'Choose a new receipt directory for each release.' }
    New-Item -ItemType Directory -Path $Receipt | Out-Null
    Invoke-ReleaseAws s3 cp "$site/index.html" $backup --only-show-errors
    @{
        bucket = $Bucket
        distribution = $Distribution
        candidateHash = $candidateHash
        previousHash = Get-ReleaseHash $backup
    } | ConvertTo-Json | Set-Content -LiteralPath $manifestPath -Encoding utf8

    $assets = foreach ($file in Get-ChildItem -LiteralPath $buildRoot -File -Recurse) {
        $key = $file.FullName.Substring($buildRoot.Length + 1).Replace('\', '/')
        if ($key -eq 'index.html') { continue }
        if ($key -cmatch '^assets/.+-[A-Za-z0-9_-]{8}\.(js|css|png|svg|webp|woff2?)$') {
            [pscustomobject]@{ Key = $key; Path = $file.FullName }
            continue
        }
        Invoke-ReleaseAws s3 cp "$site/$key" $probe --only-show-errors
        if ((Get-ReleaseHash $file.FullName) -ne (Get-ReleaseHash $probe)) {
            throw "Fixed-path asset differs: $key. Review its release separately."
        }
    }

    foreach ($asset in $assets) {
        $existing = Invoke-ReleaseAws s3api list-objects-v2 --bucket $Bucket --prefix $asset.Key --query "Contents[?Key=='$($asset.Key)'].Key" --output json
        if (($existing | ConvertFrom-Json) -contains $asset.Key) {
            Invoke-ReleaseAws s3 cp "$site/$($asset.Key)" $probe --only-show-errors
            if ((Get-ReleaseHash $asset.Path) -ne (Get-ReleaseHash $probe)) {
                throw "Fingerprint collision: $($asset.Key)"
            }
        } else {
            Invoke-ReleaseAws s3 cp $asset.Path "$site/$($asset.Key)" --cache-control 'public,max-age=31536000,immutable' --only-show-errors
        }
    }
    Invoke-ReleaseAws s3 cp "$site/index.html" $probe --only-show-errors
    if ((Get-ReleaseHash $probe) -ne (Get-ReleaseHash $backup)) { throw 'Live entrypoint changed during publish.' }
} else {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    if ($manifest.bucket -ne $Bucket -or $manifest.distribution -ne $Distribution) { throw 'Release target does not match the receipt.' }
    if ((Get-ReleaseHash $backup) -ne $manifest.previousHash) { throw 'Saved entrypoint does not match the receipt.' }
    Invoke-ReleaseAws s3 cp "$site/index.html" $probe --only-show-errors
    if ((Get-ReleaseHash $probe) -notin @($manifest.candidateHash, $manifest.previousHash)) {
        throw 'Live entrypoint has changed since this release.'
    }
    $entry = $backup
}

Invoke-ReleaseAws s3 cp $entry "$site/index.html" --content-type 'text/html; charset=utf-8' --cache-control 'no-cache' --only-show-errors
$invalidation = Invoke-ReleaseAws cloudfront create-invalidation --distribution-id $Distribution --paths '/' '/index.html' '/labs' '/labs/' --query 'Invalidation.Id' --output text
Invoke-ReleaseAws cloudfront wait invalidation-completed --distribution-id $Distribution --id $invalidation
Invoke-ReleaseAws s3 cp "$site/index.html" $probe --only-show-errors
if ((Get-ReleaseHash $probe) -ne (Get-ReleaseHash $entry)) { throw 'Live entrypoint verification failed.' }
Remove-Item -LiteralPath $probe
Write-Output "$Action complete. CloudFront invalidation: $invalidation"
