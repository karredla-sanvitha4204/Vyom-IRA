$base = "http://localhost:5000"
$pass = 0
$fail = 0

function Invoke-Api {
    param($method, $url, $bodyObj)
    try {
        $splat = @{ Uri = $url; Method = $method; UseBasicParsing = $true; ErrorAction = "Stop" }
        if ($bodyObj) {
            $splat.Body = ($bodyObj | ConvertTo-Json -Depth 5)
            $splat.ContentType = "application/json"
        }
        $resp = Invoke-WebRequest @splat
        return @{ code = [int]$resp.StatusCode; body = $resp.Content }
    } catch {
        $code = 0
        $body = ""
        try { $code = [int]$_.Exception.Response.StatusCode } catch {}
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
            $body = $_.ErrorDetails.Message
        } else {
            try {
                $s = $_.Exception.Response.GetResponseStream()
                $rdr = New-Object System.IO.StreamReader($s)
                $body = $rdr.ReadToEnd()
            } catch {}
        }
        return @{ code = $code; body = $body }
    }
}

function Wait-ForServer {
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Milliseconds 500
        $h = Invoke-Api GET "$base/" $null
        if ($h.code -eq 200) { return $true }
    }
    return $false
}

Write-Host ""
Write-Host "=========================================================="
Write-Host " TEST 9: PERSISTENCE ACROSS BACKEND SERVER RESTART"
Write-Host "=========================================================="

# Ensure server is running and ready
$chk = Invoke-Api GET "$base/" $null
if ($chk.code -ne 200) {
    Write-Host "Starting server..."
    Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "D:\Airline-Project\backend" -WindowStyle Hidden
    $ready = Wait-ForServer
    if (-not $ready) {
        Write-Host "[FAIL] Server could not start!"; exit 1
    }
    Write-Host "Server is ready."
}

# 1. Create test records before restart
Write-Host "`n--- Step 1: Create Records Before Restart ---"
$pRes = Invoke-Api POST "$base/passengers" @{
    name = "Persistence Test Passenger"
    age = 42
    email = "persist@airline.test"
    wheelchair = $true
    foodService = $true
}
if ($pRes.code -eq 201) {
    Write-Host "[PASS] Pre-restart passenger created (HTTP 201)"; $pass++
} else {
    Write-Host "[FAIL] Could not create pre-restart passenger (HTTP $($pRes.code))"; $fail++
}

$passMongoId = ($pRes.body | ConvertFrom-Json).passenger._id

$bRes = Invoke-Api POST "$base/bookings" @{
    flightId = 101
    passengerId = $passMongoId
    seatNumber = 55
}
if ($bRes.code -eq 201) {
    Write-Host "[PASS] Pre-restart booking created (HTTP 201)"; $pass++
} else {
    Write-Host "[FAIL] Could not create pre-restart booking (HTTP $($bRes.code))"; $fail++
}

$bData = ($bRes.body | ConvertFrom-Json).booking
$bId = $bData._id
$ticketNum = $bData.ticketNumber
Write-Host "  Pre-restart Booking ID: $bId, Ticket: $ticketNum, Seat: 55"

# 2. Stop node server process
Write-Host "`n--- Step 2: Stopping Node Backend Server ---"
$nodeProcesses = Get-CimInstance Win32_Process -Filter "name = 'node.exe'" | Where-Object { $_.CommandLine -like "*server.js*" }
foreach ($np in $nodeProcesses) {
    Stop-Process -Id $np.ProcessId -Force
    Write-Host "  Terminated server process PID $($np.ProcessId)"
}
Start-Sleep -Seconds 2

# Verify server is down
$downCheck = Invoke-Api GET "$base/" $null
if ($downCheck.code -eq 0) {
    Write-Host "[PASS] Verified server is stopped (connection refused)"; $pass++
} else {
    Write-Host "[INFO] Server response code: $($downCheck.code)"
}

# 3. Restart node server process
Write-Host "`n--- Step 3: Restarting Node Backend Server ---"
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "D:\Airline-Project\backend" -WindowStyle Hidden

# Wait for server to be responsive
$restarted = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    $health = Invoke-Api GET "$base/" $null
    if ($health.code -eq 200) {
        $restarted = $true
        break
    }
}

if ($restarted) {
    Write-Host "[PASS] Server restarted and responding to health check"; $pass++
} else {
    Write-Host "[FAIL] Server did not become responsive after restart"; $fail++
}

# 4. Verify data persistence after restart
Write-Host "`n--- Step 4: Verify Data Persisted Intact ---"
$pCheck = Invoke-Api GET "$base/passengers/$passMongoId" $null
if ($pCheck.code -eq 200 -and $pCheck.body -like "*Persistence Test Passenger*") {
    Write-Host "[PASS] Passenger data intact after restart (HTTP 200, name matched)"; $pass++
} else {
    Write-Host "[FAIL] Passenger not found after restart (HTTP $($pCheck.code))"; $fail++
}

$bCheck = Invoke-Api GET "$base/bookings/$bId" $null
if ($bCheck.code -eq 200 -and $bCheck.body -like "*$ticketNum*") {
    Write-Host "[PASS] Booking data intact after restart (HTTP 200, ticket $ticketNum matched)"; $pass++
} else {
    Write-Host "[FAIL] Booking not found after restart (HTTP $($bCheck.code))"; $fail++
}

# Verify seat protection still held from DB index after restart
$seatConflict = Invoke-Api POST "$base/bookings" @{
    flightId = 101
    passengerId = $passMongoId
    seatNumber = 55
}
if ($seatConflict.code -eq 409) {
    Write-Host "[PASS] Seat 55 conflict protection active after restart (HTTP 409)"; $pass++
} else {
    Write-Host "[FAIL] Seat conflict expected 409, got HTTP $($seatConflict.code)"; $fail++
}

# 5. Clean up persistence test records
Write-Host "`n--- Step 5: Clean Up Persistence Test Records ---"
Invoke-Api DELETE "$base/bookings/$bId" $null | Out-Null
Invoke-Api DELETE "$base/passengers/$passMongoId" $null | Out-Null
Write-Host "  Persistence test records deleted safely."

Write-Host ""
Write-Host "=========================================================="
Write-Host " PERSISTENCE TEST RESULTS"
Write-Host "=========================================================="
Write-Host " PASSED : $pass"
Write-Host " FAILED : $fail"
if ($fail -eq 0) {
    Write-Host " STATUS : ALL PERSISTENCE TESTS PASSED SUCCESSFULLY!"
} else {
    Write-Host " STATUS : PERSISTENCE VERIFICATION FAILED"
}
Write-Host "=========================================================="
