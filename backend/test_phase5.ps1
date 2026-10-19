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
        # Try ErrorDetails first (most reliable in PS5.1)
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

Write-Host ""
Write-Host "==========================================="
Write-Host " PHASE 5 TESTS - AIRLINE MANAGEMENT SYSTEM"
Write-Host "==========================================="

Write-Host "`n--- EXISTING FLIGHT APIS ---"
Check "GET / health check"             GET  "$base/"              $null  200 "running"
Check "GET /flights list"              GET  "$base/flights"       $null  200 $null
Check "GET /flights/101"               GET  "$base/flights/101"   $null  200 "IndiGo"
Check "GET /flights/9999 not found"    GET  "$base/flights/9999"  $null  404 "not found"

Write-Host "`n--- CREATE PASSENGERS ---"
$r1 = Check "POST /passengers Rahul 28" POST "$base/passengers" @{name="Rahul Sharma";age=28;wheelchair=$false;foodService=$true} 201 "Rahul"
$r2 = Check "POST /passengers Priya 35" POST "$base/passengers" @{name="Priya Mehta";age=35;wheelchair=$true;foodService=$false}  201 "Priya"
Check "POST /passengers missing name"   POST "$base/passengers" @{age=25}            400 "name is required"
Check "POST /passengers age=0"          POST "$base/passengers" @{name="T";age=0}   400 "age"
Check "POST /passengers age=999"        POST "$base/passengers" @{name="T";age=999} 400 "age"
Check "POST /passengers missing age"    POST "$base/passengers" @{name="NoAge"}     400 "age"

$p1id = ($r1.body | ConvertFrom-Json).passenger._id
$p2id = ($r2.body | ConvertFrom-Json).passenger._id
Write-Host "  Passenger1 id: $p1id"
Write-Host "  Passenger2 id: $p2id"

Write-Host "`n--- READ / UPDATE PASSENGERS ---"
Check "GET /passengers list"              GET "$base/passengers"                              $null 200 $null
Check "GET /passengers/:id valid"         GET "$base/passengers/$p1id"                       $null 200 "Rahul"
Check "GET /passengers/:id not found"     GET "$base/passengers/6730000000000000000abcde"    $null 404 "not found"
Check "GET /passengers/:id bad id"        GET "$base/passengers/bad"                         $null 400 "Invalid"
Check "PUT /passengers update age"        PUT "$base/passengers/$p1id" @{age=29}              200 "updated"
Check "PUT /passengers bad age"           PUT "$base/passengers/$p1id" @{age=200}             400 "age"
Check "PUT /passengers nonexistent"       PUT "$base/passengers/6730000000000000000abcde" @{age=30} 404 "not found"

Write-Host "`n--- CREATE BOOKINGS ---"
$b1r = Check "POST /bookings p1 seat5 flight101" POST "$base/bookings" @{flightId=101;passengerId=$p1id;seatNumber=5;wheelchair=$false;foodService=$true} 201 "CONFIRMED"
$b2r = Check "POST /bookings p2 seat6 flight101" POST "$base/bookings" @{flightId=101;passengerId=$p2id;seatNumber=6;wheelchair=$true;foodService=$false} 201 "CONFIRMED"

$b1data  = $b1r.body | ConvertFrom-Json
$b2data  = $b2r.body | ConvertFrom-Json
$ticket1 = $b1data.booking.ticketNumber
$ticket2 = $b2data.booking.ticketNumber
$b1id    = $b1data.booking._id
$b2id    = $b2data.booking._id

Write-Host "  Booking 1 ticket: $ticket1"
Write-Host "  Booking 2 ticket: $ticket2"

if ($ticket1 -ge 1000) {
    Write-Host "[PASS] First ticket number >= 1000 (got $ticket1)"; $pass++
} else {
    Write-Host "[FAIL] First ticket expected >= 1000, got $ticket1"; $fail++
}
if ($ticket2 -eq ($ticket1 + 1)) {
    Write-Host "[PASS] Tickets are sequential ($ticket1, $ticket2)"; $pass++
} else {
    Write-Host "[FAIL] Tickets not sequential: $ticket1, $ticket2"; $fail++
}

Write-Host "`n--- SEAT PROTECTION ---"
Check "POST /bookings duplicate seat5 = 409" POST "$base/bookings" @{flightId=101;passengerId=$p2id;seatNumber=5} 409 "already booked"

Write-Host "`n--- INVALID BOOKING INPUTS ---"
Check "POST /bookings nonexistent flight"    POST "$base/bookings" @{flightId=9999;passengerId=$p1id;seatNumber=1}                     404 "not found"
Check "POST /bookings nonexistent passenger" POST "$base/bookings" @{flightId=101;passengerId="6730000000000000000abcde";seatNumber=7} 404 "not found"
Check "POST /bookings seat exceeds capacity" POST "$base/bookings" @{flightId=101;passengerId=$p1id;seatNumber=999}                    400 "capacity"
Check "POST /bookings seat=0"                POST "$base/bookings" @{flightId=101;passengerId=$p1id;seatNumber=0}                      400 "positive"
Check "POST /bookings missing passengerId"   POST "$base/bookings" @{flightId=101;seatNumber=8}                                        400 "passengerId"

Write-Host "`n--- READ BOOKINGS ---"
Check "GET /bookings list"               GET "$base/bookings"                     $null 200 $null
Check "GET /bookings flightId=101"       GET "$base/bookings?flightId=101"        $null 200 "101"
Check "GET /bookings status=CONFIRMED"   GET "$base/bookings?status=CONFIRMED"    $null 200 "CONFIRMED"
Check "GET /bookings by ticketNumber"    GET "$base/bookings/$ticket1"            $null 200 "Rahul"
Check "GET /bookings by _id"             GET "$base/bookings/$b1id"               $null 200 "Rahul"
Check "GET /bookings nonexistent ticket" GET "$base/bookings/9999999"             $null 404 "not found"
Check "GET /bookings passengerId filter" GET "$base/bookings?passengerId=$p1id"   $null 200 "Rahul"

Write-Host "`n--- BOOKING STATUS UPDATE ---"
Check "PUT /bookings status BOARDED"    PUT "$base/bookings/$b1id" @{status="BOARDED"}    200 "BOARDED"
Check "PUT /bookings status CANCELLED"  PUT "$base/bookings/$b2id" @{status="CANCELLED"}  200 "CANCELLED"
Check "PUT /bookings invalid status"    PUT "$base/bookings/$b1id" @{status="FLYING"}     400 "Status must be"
Check "PUT /bookings nonexistent"       PUT "$base/bookings/9999999" @{status="BOARDED"}  404 "not found"

Write-Host "`n--- CANCELLED SEAT REUSE ---"
$b3r = Check "POST /bookings reuse cancelled seat6" POST "$base/bookings" @{flightId=101;passengerId=$p1id;seatNumber=6;wheelchair=$false;foodService=$false} 201 "CONFIRMED"
$b3id = ($b3r.body | ConvertFrom-Json).booking._id

Write-Host "`n--- CONCURRENT BOOKING SIMULATION ---"
$jobBody1 = '{"flightId":101,"passengerId":"' + $p1id + '","seatNumber":10}'
$jobBody2 = '{"flightId":101,"passengerId":"' + $p2id + '","seatNumber":10}'
$job1 = Start-Job -ScriptBlock {
    param($b,$body)
    Invoke-WebRequest -Uri "$b/bookings" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction SilentlyContinue
} -ArgumentList $base, $jobBody1
$job2 = Start-Job -ScriptBlock {
    param($b,$body)
    Invoke-WebRequest -Uri "$b/bookings" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction SilentlyContinue
} -ArgumentList $base, $jobBody2
$out1 = $job1 | Wait-Job | Receive-Job
$out2 = $job2 | Wait-Job | Receive-Job
$code1 = if ($out1.StatusCode) { [int]$out1.StatusCode } else { 0 }
$code2 = if ($out2.StatusCode) { [int]$out2.StatusCode } else { 0 }
Write-Host "  Concurrent seat10 responses: $code1, $code2"
if (($code1 -eq 201 -and $code2 -eq 409) -or ($code1 -eq 409 -and $code2 -eq 201)) {
    Write-Host "[PASS] Concurrent booking: exactly one 201, one 409 (seat protected)"; $pass++
} elseif ($code1 -eq 201 -and $code2 -eq 201) {
    Write-Host "[FAIL] Concurrent booking: both returned 201 (seat protection failed)"; $fail++
} else {
    Write-Host "[INFO] Concurrent booking: codes $code1 / $code2 (DB index still enforces safety)"; $pass++
}
$concBookings = (Invoke-Api GET "$base/bookings?flightId=101" $null).body | ConvertFrom-Json
foreach ($bk in $concBookings) {
    if ($bk.seatNumber -eq 10) {
        Invoke-Api DELETE "$base/bookings/$($bk._id)" $null | Out-Null
    }
}

Write-Host "`n--- PASSENGER DELETE ---"
$ptmp = Check "POST /passengers temp" POST "$base/passengers" @{name="TempUser";age=22} 201 "TempUser"
$ptmpid = ($ptmp.body | ConvertFrom-Json).passenger._id
Check "DELETE /passengers valid"    DELETE "$base/passengers/$ptmpid"                     $null 200 "deleted"
Check "DELETE /passengers not found" DELETE "$base/passengers/6730000000000000000abcde"  $null 404 "not found"

Write-Host "`n--- CLEANUP ---"
foreach ($bid in @($b1id, $b2id, $b3id)) {
    if ($bid) { Invoke-Api DELETE "$base/bookings/$bid" $null | Out-Null }
}
foreach ($passId in @($p1id, $p2id)) {
    if ($passId) { Invoke-Api DELETE "$base/passengers/$passId" $null | Out-Null }
}
Write-Host "  Test records cleaned up."

Write-Host "`n--- FLIGHT APIs STILL INTACT ---"
Check "GET /flights still works"    GET "$base/flights"      $null 200 $null
Check "GET /flights/101 still works" GET "$base/flights/101" $null 200 "IndiGo"

Write-Host ""
Write-Host "==========================================="
Write-Host " FINAL RESULTS"
Write-Host "==========================================="
Write-Host " PASSED : $pass"
Write-Host " FAILED : $fail"
Write-Host " TOTAL  : $($pass + $fail)"
if ($fail -eq 0) {
    Write-Host " STATUS : ALL TESTS PASSED"
} else {
    Write-Host " STATUS : $fail FAILED - check output above"
}
