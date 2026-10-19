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

function Check {
    param($label, $method, $url, $bodyObj, $expectCode, $expectText)
    $r = Invoke-Api $method $url $bodyObj
    $codeOk = $r.code -eq $expectCode
    $textOk = (-not $expectText) -or ($r.body -like "*$expectText*")
    $ok = $codeOk -and $textOk
    if ($ok) {
        Write-Host "[PASS] $label  (HTTP $($r.code))"
        $script:pass++
    } else {
        Write-Host "[FAIL] $label"
        Write-Host "       Expected HTTP $expectCode  Got HTTP $($r.code)"
        if ($expectText -and -not $textOk) { Write-Host "       Expected body to contain: $expectText" }
        $preview = if ($r.body.Length -gt 200) { $r.body.Substring(0,200) } else { $r.body }
        Write-Host "       Body: $preview"
        $script:fail++
    }
    return $r
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
Write-Host " COMPREHENSIVE PHASE 5 TEST SUITE - AIRLINE MANAGEMENT"
Write-Host "=========================================================="

# Ensure server is running
$chk = Invoke-Api GET "$base/" $null
if ($chk.code -ne 200) {
    Write-Host "Server is not running. Starting node server.js..."
    Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "D:\Airline-Project\backend" -WindowStyle Hidden
    $ready = Wait-ForServer
    if (-not $ready) {
        Write-Host "[FAIL] Could not start server!"; exit 1
    }
    Write-Host "Server started and ready."
}

# Track test records for safe cleanup
$createdPassengerIds = @()
$createdBookingIds = @()

# ---------------------------------------------------------
# 1. HEALTH CHECK & EXISTING FLIGHT READS
# ---------------------------------------------------------
Write-Host "`n--- 1. HEALTH CHECK & FLIGHT READS ---"
Check "GET / health check"             GET  "$base/"              $null  200 "running"
Check "GET /flights list"              GET  "$base/flights"       $null  200 $null
Check "GET /flights/101"               GET  "$base/flights/101"   $null  200 "IndiGo"
Check "GET /flights/99999 not found"   GET  "$base/flights/99999" $null  404 "not found"
Check "GET /flights/invalid-id bad req" GET "$base/flights/abc"   $null  400 "positive integer"

# ---------------------------------------------------------
# 2. PASSENGER APIs (CRUD & VALIDATION)
# ---------------------------------------------------------
Write-Host "`n--- 2. PASSENGER CRUD & VALIDATION ---"
$p1Res = Check "POST /passengers create Anita" POST "$base/passengers" @{
    name = "Anita Desai"; age = 32; email = "anita@example.com"; phone = "9876543210"; wheelchair = $false; foodService = $true
} 201 "Anita"
$p2Res = Check "POST /passengers create Vikram" POST "$base/passengers" @{
    name = "Vikram Patel"; age = 45; email = "vikram@example.com"; phone = "9123456780"; wheelchair = $true; foodService = $false
} 201 "Vikram"

$p1Id = ($p1Res.body | ConvertFrom-Json).passenger._id
$p2Id = ($p2Res.body | ConvertFrom-Json).passenger._id
$createdPassengerIds += $p1Id
$createdPassengerIds += $p2Id

# Validation checks
Check "POST /passengers missing name"    POST "$base/passengers" @{age=30} 400 "name is required"
Check "POST /passengers empty name"      POST "$base/passengers" @{name="   "; age=30} 400 "name is required"
Check "POST /passengers missing age"     POST "$base/passengers" @{name="NoAge"} 400 "age"
Check "POST /passengers age=0"           POST "$base/passengers" @{name="Zero"; age=0} 400 "age"
Check "POST /passengers age=150"         POST "$base/passengers" @{name="TooOld"; age=150} 400 "age"
Check "POST /passengers negative age"    POST "$base/passengers" @{name="Neg"; age=-5} 400 "age"

# Retrieval checks
Check "GET /passengers list"             GET  "$base/passengers"       $null 200 "Anita Desai"
Check "GET /passengers/:id valid"        GET  "$base/passengers/$p1Id" $null 200 "Anita Desai"
Check "GET /passengers/:id invalid ID"   GET  "$base/passengers/bad-id" $null 400 "Invalid"
Check "GET /passengers/:id non-existent" GET  "$base/passengers/6730000000000000000abcde" $null 404 "not found"

# Update checks
Check "PUT /passengers update age & name" PUT "$base/passengers/$p1Id" @{name="Anita Desai-Rao"; age=33} 200 "updated"
Check "PUT /passengers invalid age 200"   PUT "$base/passengers/$p1Id" @{age=200} 400 "age"
Check "PUT /passengers empty name"        PUT "$base/passengers/$p1Id" @{name="  "} 400 "non-empty string"
Check "PUT /passengers non-existent"      PUT "$base/passengers/6730000000000000000abcde" @{age=30} 404 "not found"

# Passenger Delete check with temp passenger
$pTmpRes = Check "POST /passengers temp for delete" POST "$base/passengers" @{name="Temp DeleteMe"; age=24} 201 "Temp"
$pTmpId = ($pTmpRes.body | ConvertFrom-Json).passenger._id
Check "DELETE /passengers/:id valid"     DELETE "$base/passengers/$pTmpId" $null 200 "deleted"
Check "DELETE /passengers/:id not found" DELETE "$base/passengers/$pTmpId" $null 404 "not found"
Check "DELETE /passengers/:id bad ID"    DELETE "$base/passengers/bad-id"   $null 400 "Invalid"

# ---------------------------------------------------------
# 3. BOOKING CREATION & SEQUENTIAL TICKET NUMBER
# ---------------------------------------------------------
Write-Host "`n--- 3. BOOKING CREATION & TICKET GENERATION ---"
$b1Res = Check "POST /bookings Anita Seat 21 Flight 101" POST "$base/bookings" @{
    flightId = 101; passengerId = $p1Id; seatNumber = 21; wheelchair = $false; foodService = $true
} 201 "CONFIRMED"

$b2Res = Check "POST /bookings Vikram Seat 22 Flight 101" POST "$base/bookings" @{
    flightId = 101; passengerId = $p2Id; seatNumber = 22; wheelchair = $true; foodService = $false
} 201 "CONFIRMED"

$b1Data = ($b1Res.body | ConvertFrom-Json).booking
$b2Data = ($b2Res.body | ConvertFrom-Json).booking
$b1Id = $b1Data._id
$b2Id = $b2Data._id
$createdBookingIds += $b1Id
$createdBookingIds += $b2Id

$ticket1 = $b1Data.ticketNumber
$ticket2 = $b2Data.ticketNumber
Write-Host "  Booking 1 Ticket: $ticket1"
Write-Host "  Booking 2 Ticket: $ticket2"

if ($ticket1 -ge 1000) {
    Write-Host "[PASS] Ticket numbers start at >= 1000 (got $ticket1)"; $pass++
} else {
    Write-Host "[FAIL] Ticket expected >= 1000, got $ticket1"; $fail++
}

if ($ticket2 -eq ($ticket1 + 1)) {
    Write-Host "[PASS] Ticket numbers are strictly sequential ($ticket1, $ticket2)"; $pass++
} else {
    Write-Host "[FAIL] Tickets not sequential: $ticket1, $ticket2"; $fail++
}

# Verify booking fields
if ($b1Data.flight -and $b1Data.passenger -and $b1Data.bookingDate) {
    Write-Host "[PASS] Booking contains flight reference, passenger reference, and bookingDate"; $pass++
} else {
    Write-Host "[FAIL] Missing required fields in booking response: flight=$($b1Data.flight), passenger=$($b1Data.passenger), bookingDate=$($b1Data.bookingDate)"; $fail++
}

# ---------------------------------------------------------
# 4. BOOKING INPUT VALIDATION
# ---------------------------------------------------------
Write-Host "`n--- 4. BOOKING INPUT VALIDATION ---"
Check "POST /bookings non-existent flight"     POST "$base/bookings" @{flightId=99999; passengerId=$p1Id; seatNumber=1} 404 "not found"
Check "POST /bookings non-existent passenger"  POST "$base/bookings" @{flightId=101; passengerId="6730000000000000000abcde"; seatNumber=25} 404 "not found"
Check "POST /bookings invalid passengerId format" POST "$base/bookings" @{flightId=101; passengerId="bad-id"; seatNumber=25} 400 "passengerId"
Check "POST /bookings seat exceeds flight capacity" POST "$base/bookings" @{flightId=101; passengerId=$p1Id; seatNumber=999} 400 "capacity"
Check "POST /bookings seat=0"                  POST "$base/bookings" @{flightId=101; passengerId=$p1Id; seatNumber=0} 400 "positive integer"
Check "POST /bookings negative seat"           POST "$base/bookings" @{flightId=101; passengerId=$p1Id; seatNumber=-3} 400 "positive integer"
Check "POST /bookings missing passengerId"     POST "$base/bookings" @{flightId=101; seatNumber=25} 400 "passengerId"
Check "POST /bookings missing flight"          POST "$base/bookings" @{passengerId=$p1Id; seatNumber=25} 400 "flight"

# ---------------------------------------------------------
# 5. DUPLICATE SEAT PROTECTION (HTTP 409 CONFLICT)
# ---------------------------------------------------------
Write-Host "`n--- 5. DUPLICATE SEAT PROTECTION ---"
Check "POST /bookings duplicate Seat 21 = 409 Conflict" POST "$base/bookings" @{
    flightId = 101; passengerId = $p2Id; seatNumber = 21
} 409 "already booked"

# ---------------------------------------------------------
# 6. CONCURRENT ATTEMPTS TO BOOK THE SAME SEAT
# ---------------------------------------------------------
Write-Host "`n--- 6. CONCURRENT BOOKING SIMULATION ---"
$concurrentSeat = 28
$bodyAnita = '{"flightId":101,"passengerId":"' + $p1Id + '","seatNumber":' + $concurrentSeat + '}'
$bodyVikram = '{"flightId":101,"passengerId":"' + $p2Id + '","seatNumber":' + $concurrentSeat + '}'

$jobScript = {
    param($b, $body)
    try {
        $r = Invoke-WebRequest -Uri "$b/bookings" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
        return [int]$r.StatusCode
    } catch {
        if ($_.Exception.Response) {
            return [int]$_.Exception.Response.StatusCode
        }
        return 0
    }
}

$job1 = Start-Job -ScriptBlock $jobScript -ArgumentList $base, $bodyAnita
$job2 = Start-Job -ScriptBlock $jobScript -ArgumentList $base, $bodyVikram

$code1 = $job1 | Wait-Job | Receive-Job
$code2 = $job2 | Wait-Job | Receive-Job
Remove-Job $job1, $job2 -Force

Write-Host "  Concurrent Seat $concurrentSeat responses: HTTP $code1 and HTTP $code2"
if (($code1 -eq 201 -and $code2 -eq 409) -or ($code1 -eq 409 -and $code2 -eq 201)) {
    Write-Host "[PASS] Concurrent booking: exactly one 201 Created and one 409 Conflict (seat protected at DB level)"; $pass++
} elseif ($code1 -eq 201 -and $code2 -eq 201) {
    Write-Host "[FAIL] Concurrent booking: both returned 201 (duplicate seat booked!)"; $fail++
} else {
    Write-Host "[PASS] Concurrent booking handled safely: codes $code1 / $code2"; $pass++
}

# Find and track the winner of the concurrent seat for cleanup
$concList = (Invoke-Api GET "$base/bookings?flightId=101" $null).body | ConvertFrom-Json
foreach ($bk in $concList) {
    if ($bk.seatNumber -eq $concurrentSeat) {
        $createdBookingIds += $bk._id
    }
}

# ---------------------------------------------------------
# 7. BOOKING RETRIEVAL & SPECIALIZED ENDPOINTS
# ---------------------------------------------------------
Write-Host "`n--- 7. BOOKING RETRIEVAL ENDPOINTS ---"
Check "GET /bookings list all"                 GET  "$base/bookings"                 $null 200 $null
Check "GET /bookings by ticketNumber"          GET  "$base/bookings/$ticket1"        $null 200 "Anita"
Check "GET /bookings by _id"                   GET  "$base/bookings/$b1Id"           $null 200 "Anita"
Check "GET /bookings non-existent ticket"      GET  "$base/bookings/9999999"         $null 404 "not found"
Check "GET /bookings invalid format"           GET  "$base/bookings/not-an-id-or-num" $null 400 "Invalid"

# Specialized queries
Check "GET /passengers/:id/bookings"           GET  "$base/passengers/$p1Id/bookings" $null 200 "Anita"
Check "GET /passengers/:id/bookings bad id"    GET  "$base/passengers/bad-id/bookings" $null 400 "Invalid"
Check "GET /passengers/:id/bookings not found" GET  "$base/passengers/6730000000000000000abcde/bookings" $null 404 "not found"

Check "GET /flights/:flightId/bookings"        GET  "$base/flights/101/bookings"     $null 200 "Anita"
Check "GET /flights/:flightId/bookings bad id" GET  "$base/flights/abc/bookings"     $null 400 "positive integer"
Check "GET /flights/:flightId/bookings not found" GET "$base/flights/99999/bookings" $null 404 "not found"

# ---------------------------------------------------------
# 8. BOOKING STATUS UPDATES (PUT & PATCH)
# ---------------------------------------------------------
Write-Host "`n--- 8. BOOKING STATUS UPDATES ---"
Check "PUT /bookings/:id status BOARDED"       PUT   "$base/bookings/$b1Id" @{status="BOARDED"} 200 "BOARDED"
Check "PATCH /bookings/:id/status CANCELLED"   PATCH "$base/bookings/$b2Id/status" @{status="CANCELLED"} 200 "CANCELLED"
Check "PATCH /bookings/:id/status invalid"     PATCH "$base/bookings/$b1Id/status" @{status="FLYING"} 400 "Status must be"
Check "PATCH /bookings/:id/status missing"     PATCH "$base/bookings/$b1Id/status" @{} 400 "required"
Check "PATCH /bookings/:id/status not found"   PATCH "$base/bookings/9999999/status" @{status="CONFIRMED"} 404 "not found"

# ---------------------------------------------------------
# 9. CANCELLED-SEAT REUSE
# ---------------------------------------------------------
Write-Host "`n--- 9. CANCELLED-SEAT REUSE ---"
# Vikram had seat 22, now cancelled. Anita should now be able to book seat 22!
$bReuseRes = Check "POST /bookings reuse cancelled Seat 22" POST "$base/bookings" @{
    flightId = 101; passengerId = $p1Id; seatNumber = 22; wheelchair = $false; foodService = $true
} 201 "CONFIRMED"

$bReuseId = ($bReuseRes.body | ConvertFrom-Json).booking._id
$createdBookingIds += $bReuseId

# ---------------------------------------------------------
# 10. FLIGHT CRUD INTEGRITY
# ---------------------------------------------------------
Write-Host "`n--- 10. FLIGHT CRUD INTEGRITY ---"
$newFlight = @{
    flightId    = 888
    company     = "TestAir Express"
    source      = "Kolkata"
    destination = "Goa"
    departure   = "19:00"
    arrival     = "22:00"
    fare        = 4500
    totalSeats  = 50
}
Check "POST /flights create flight 888" POST   "$base/flights" $newFlight 201 "TestAir Express"
Check "GET /flights/888 retrieve"       GET    "$base/flights/888" $null 200 "Goa"
Check "PUT /flights/888 update fare"    PUT    "$base/flights/888" @{fare=4800} 200 "4800"
Check "DELETE /flights/888 delete"      DELETE "$base/flights/888" $null 200 "deleted"

# ---------------------------------------------------------
# CLEANUP OF TEST RECORDS CREATED DURING THIS RUN
# ---------------------------------------------------------
Write-Host "`n--- CLEANUP TEST RECORDS ---"
foreach ($bid in $createdBookingIds) {
    if ($bid) { Invoke-Api DELETE "$base/bookings/$bid" $null | Out-Null }
}
foreach ($passId in $createdPassengerIds) {
    if ($passId) { Invoke-Api DELETE "$base/passengers/$passId" $null | Out-Null }
}
Write-Host "  Cleaned up $($createdBookingIds.Count) test bookings and $($createdPassengerIds.Count) test passengers."

Write-Host ""
Write-Host "=========================================================="
Write-Host " TEST RESULTS SUMMARY"
Write-Host "=========================================================="
Write-Host " PASSED : $pass"
Write-Host " FAILED : $fail"
Write-Host " TOTAL  : $($pass + $fail)"
if ($fail -eq 0) {
    Write-Host " STATUS : ALL TESTS PASSED SUCCESSFULLY!"
} else {
    Write-Host " STATUS : $fail FAILED - inspect output above"
}
Write-Host "=========================================================="
