$u = 'https://ppoh5tatv4cnr7x7gzgha5k6wu0jrisc.lambda-url.us-east-2.on.aws/query'
$h = @{'Content-Type'='application/json'}

# Test Query 1
$q1_body = @{
    query = 'Under tariff uncertainty, how do I plan my production?'
    course_id = 'decision'
    user_id = 'diagnostic'
} | ConvertTo-Json -Depth 5

# Test Query 2
$q2_body = @{
    query = 'I have two job offers, how to choose?'
    course_id = 'decision'
    user_id = 'diagnostic'
} | ConvertTo-Json -Depth 5

Write-Host "--- Testing Backend Consistency ---"

Write-Host "`n=== Query 1: Under tariff uncertainty, how do I plan my production? ==="
for ($i=1; $i -le 4; $i++) {
    Write-Host "`nAttempt ${i}:"
    try {
        $resp = Invoke-WebRequest -Uri $u -Method POST -Headers $h -Body $q1_body
        $json = $resp.Content | ConvertFrom-Json
        
        if($json.status -eq 'success' -and $json.data -and $json.data.conceptsToolsPractice){
            Write-Host "  Concepts/Tools Array Length: $($json.data.conceptsToolsPractice.Length)"
            Write-Host "  Processing Time: $($json.data.processingTime)"
            Write-Host "  Model: $($json.data.model)"
            
            # Show first few concepts
            Write-Host "  First 2 concepts:"
            for ($j=0; $j -lt [Math]::Min(2, $json.data.conceptsToolsPractice.Length); $j++) {
                $concept = $json.data.conceptsToolsPractice[$j]
                Write-Host "    $($concept.term): $($concept.definition.Substring(0, [Math]::Min(50, $concept.definition.Length)))..."
            }
        } else {
            Write-Host "  Response structure: $($resp.Content.Substring(0, [Math]::Min(200, $resp.Content.Length)))..."
        }
    } catch {
        Write-Host "  Error: $($_.Exception.Message)"
    }
}

Write-Host "`n=== Query 2: I have two job offers, how to choose? ==="
for ($i=1; $i -le 4; $i++) {
    Write-Host "`nAttempt ${i}:"
    try {
        $resp = Invoke-WebRequest -Uri $u -Method POST -Headers $h -Body $q2_body
        $json = $resp.Content | ConvertFrom-Json
        
        if($json.status -eq 'success' -and $json.data -and $json.data.conceptsToolsPractice){
            Write-Host "  Concepts/Tools Array Length: $($json.data.conceptsToolsPractice.Length)"
            Write-Host "  Processing Time: $($json.data.processingTime)"
            Write-Host "  Model: $($json.data.model)"
            
            # Show first few concepts
            Write-Host "  First 2 concepts:"
            for ($j=0; $j -lt [Math]::Min(2, $json.data.conceptsToolsPractice.Length); $j++) {
                $concept = $json.data.conceptsToolsPractice[$j]
                Write-Host "    $($concept.term): $($concept.definition.Substring(0, [Math]::Min(50, $concept.definition.Length)))..."
            }
        } else {
            Write-Host "  Response structure: $($resp.Content.Substring(0, [Math]::Min(200, $resp.Content.Length)))..."
        }
    } catch {
        Write-Host "  Error: $($_.Exception.Message)"
    }
}
