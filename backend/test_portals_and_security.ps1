$base = "http://localhost:5000"
$pass = 0
$fail = 0

function Invoke-Api {
    param($method, $url, $bodyObj, $token)
    try {
        $headers = @{}
        if ($token) { $headers["Authorization"] = "Bearer $token" }
        $splat = @{ 
            Uri = $url
            Method = $method
            UseBasicParsing = $true
            ErrorAction = "Stop"
            Headers = $headers
        }
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
    param($label, $method, $url, $bodyObj, $token, $expectCode, $expectText)
    $r = Invoke-Api $method $url $bodyObj $token
    $codeOk = $r.code -eq $expectCode
    $textOk = (-not $expectText) -or ($r.body -like "*$expectText*")
    $ok = $codeOk -and $textOk
    if ($ok) {
        Write-Host "[PASS] $label  (HTTP $($r.code))" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "[FAIL] $label" -ForegroundColor Red
        Write-Host "       Expected HTTP $expectCode  Got HTTP $($r.code)"
        if ($expectText -and -not $textOk) { Write-Host "       Expected body to contain: $expectText" }
        $preview = if ($r.body.Length -gt 250) { $r.body.Substring(0,250) } else { $r.body }
        Write-Host "       Body: $preview"
        $script:fail++
    }
    return $r
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " COMPREHENSIVE PORTALS & SECURITY TEST SUITE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# -----------------------------------------------------------------
# 1. AUTHENTICATION & ROLE ESCALATION CHECKS
# -----------------------------------------------------------------
Write-Host "`n--- 1. AUTHENTICATION & SECURITY CONTROLS ---" -ForegroundColor Yellow

# Login as seeded Admin
$adminLogin = Check "Admin Login" POST "$base/auth/login" @{
    login = "admin@airline.com"; password = "AdminPassword@123"
} $null 200 "Login successful"
$adminToken = ($adminLogin.body | ConvertFrom-Json).token

# Login as seeded Staff
$staffLogin = Check "Staff Login" POST "$base/auth/login" @{
    login = "staff@airline.com"; password = "StaffPassword@123"
} $null 200 "Login successful"
$staffToken = ($staffLogin.body | ConvertFrom-Json).token

# Register Passenger 1
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$p1User = "passenger_$timestamp"
$p1Email = "$p1User@test.com"
$pass1Reg = Check "Register Passenger 1" POST "$base/auth/register" @{
    username = $p1User
    email = $p1Email
    password = "PassengerPass@123"
    name = "Test Passenger 1"
    age = 30
    phone = "9876543210"
    wheelchair = $true
    foodService = $true
} $null 201 "Passenger registration successful"
$p1Data = ($pass1Reg.body | ConvertFrom-Json)
$p1Token = $p1Data.token
$p1Id = $p1Data.user.id
$p1PassengerId = $p1Data.user.passengerId

# Register Passenger 2
$p2User = "passenger2_$timestamp"
$p2Email = "$p2User@test.com"
$pass2Reg = Check "Register Passenger 2" POST "$base/auth/register" @{
    username = $p2User
    email = $p2Email
    password = "PassengerPass@123"
    name = "Test Passenger 2"
    age = 25
} $null 201 "Passenger registration successful"
$p2Token = ($pass2Reg.body | ConvertFrom-Json).token

# Verify role enforcement: Public register MUST force role: 'passenger' even if body tries role: 'admin'
$pHackUser = "hacker_$timestamp"
$pHackEmail = "$pHackUser@test.com"
$hackReg = Check "Privilege escalation attempt (role='admin' in register)" POST "$base/auth/register" @{
    username = $pHackUser
    email = $pHackEmail
    password = "HackerPassword@123"
    name = "Hacker User"
    role = "admin"
} $null 201 "Passenger registration successful"
$hackRole = ($hackReg.body | ConvertFrom-Json).user.role
if ($hackRole -eq "passenger") {
    Write-Host "[PASS] Privilege escalation prevented: assigned role is 'passenger' (not admin)" -ForegroundColor Green
    $pass++
} else {
    Write-Host "[FAIL] Privilege escalation allowed: user received role '$hackRole'" -ForegroundColor Red
    $fail++
}

# -----------------------------------------------------------------
# 2. PORTAL 1: PASSENGER BOOKING, ISOLATION & CANCELLATION
# -----------------------------------------------------------------
Write-Host "`n--- 2. PORTAL 1: PASSENGER PORTAL TESTS ---" -ForegroundColor Yellow

# Create a booking for Passenger 1 on Flight 101, Seat 35
$bk1Res = Check "Passenger 1 books Flight 101 Seat 35" POST "$base/bookings" @{
    flightId = 101
    passengerId = $p1PassengerId
    seatNumber = 35
    wheelchair = $true
    foodService = $true
} $p1Token 201 "CONFIRMED"

$bk1 = ($bk1Res.body | ConvertFrom-Json).booking
$ticket1 = $bk1.ticketNumber
$booking1Id = $bk1._id
Write-Host "  Passenger 1 Ticket #$ticket1 created, seat 35"

# Passenger 1 checks their bookings
$myBookingsRes = Check "Passenger 1 gets their bookings" GET "$base/api/passenger/my-bookings" $null $p1Token 200 "$ticket1"

# Passenger 2 checks their bookings -> MUST NOT see Passenger 1's ticket!
$p2BookingsRes = Check "Passenger 2 gets their bookings (isolation check)" GET "$base/api/passenger/my-bookings" $null $p2Token 200 $null
$p2List = ($p2BookingsRes.body | ConvertFrom-Json)
$hasLeaked = $p2List | Where-Object { $_.ticketNumber -eq $ticket1 }
if (-not $hasLeaked) {
    Write-Host "[PASS] Passenger privacy maintained: Passenger 2 cannot see Passenger 1's booking" -ForegroundColor Green
    $pass++
} else {
    Write-Host "[FAIL] Privacy violation: Passenger 2 can see Passenger 1's booking!" -ForegroundColor Red
    $fail++
}

# Passenger 2 tries to cancel Passenger 1's booking -> MUST be 403 Forbidden!
Check "Passenger 2 cannot cancel Passenger 1's booking (403 Forbidden)" PATCH "$base/api/passenger/my-bookings/$booking1Id/cancel" $null $p2Token 403 "not authorized"

# Passenger 1 cancels their own booking -> 200 OK
Check "Passenger 1 cancels own booking (seat release)" PATCH "$base/api/passenger/my-bookings/$booking1Id/cancel" $null $p1Token 200 "released"

# Verify seat 35 is now released and can be booked by Passenger 2
$reuseRes = Check "Passenger 2 re-books released Seat 35 on Flight 101" POST "$base/bookings" @{
    flightId = 101
    passengerId = ($pass2Reg.body | ConvertFrom-Json).user.passengerId
    seatNumber = 35
} $p2Token 201 "CONFIRMED"
$bk2 = ($reuseRes.body | ConvertFrom-Json).booking
$ticket2 = $bk2.ticketNumber
$booking2Id = $bk2._id

# -----------------------------------------------------------------
# 3. PORTAL 2: ADMIN CONTROL CENTER & RBAC
# -----------------------------------------------------------------
Write-Host "`n--- 3. PORTAL 2: ADMIN PORTAL TESTS ---" -ForegroundColor Yellow

# Admin stats
Check "Admin accesses stats overview" GET "$base/api/admin/stats" $null $adminToken 200 "totalFlights"

# Non-admin access to admin stats MUST fail with 403 Forbidden
Check "Passenger denied access to admin stats (403)" GET "$base/api/admin/stats" $null $p1Token 403 "Requires one of the following roles: admin"
Check "Staff denied access to admin stats (403)" GET "$base/api/admin/stats" $null $staffToken 403 "Requires one of the following roles: admin"

# Admin lists users
Check "Admin lists all user accounts" GET "$base/api/admin/users" $null $adminToken 200 "admin@airline.com"

# Staff cannot list user accounts
Check "Staff denied user account management (403)" GET "$base/api/admin/users" $null $staffToken 403 "Requires one of the following roles: admin"

# Admin creates a new staff user
$newStaffUser = "teststaff_$timestamp"
$createStaffRes = Check "Admin creates operational staff account" POST "$base/api/admin/users" @{
    username = $newStaffUser
    email = "$newStaffUser@airline.com"
    password = "StaffPassword@123"
    name = "Temporary Operational Staff"
    role = "staff"
} $adminToken 201 "created successfully"
$createdStaffId = ($createStaffRes.body | ConvertFrom-Json).user.id

# Admin deletes the created test staff account
Check "Admin deletes test staff account" DELETE "$base/api/admin/users/$createdStaffId" $null $adminToken 200 "deleted successfully"

# -----------------------------------------------------------------
# 4. PORTAL 3: AIRLINE STAFF OPERATIONS CONSOLE
# -----------------------------------------------------------------
Write-Host "`n--- 4. PORTAL 3: AIRLINE STAFF PORTAL TESTS ---" -ForegroundColor Yellow

# Staff views scheduled flights
Check "Staff views scheduled flights" GET "$base/api/staff/flights" $null $staffToken 200 "IndiGo"

# Passenger denied access to staff flights
Check "Passenger denied access to staff flights (403)" GET "$base/api/staff/flights" $null $p1Token 403 "Requires one of the following roles: staff, admin"

# Staff views flight manifest
Check "Staff views Flight 101 manifest" GET "$base/api/staff/flights/101/manifest" $null $staffToken 200 "manifest"

# Staff views wheelchair assistance list
Check "Staff views wheelchair assistance list" GET "$base/api/staff/assistance" $null $staffToken 200 $null

# Staff views food service requests
Check "Staff views catering requests" GET "$base/api/staff/food-service" $null $staffToken 200 $null

# -----------------------------------------------------------------
# 5. PORTAL 4: CHECK-IN & BOARDING GATE OPERATIONS
# -----------------------------------------------------------------
Write-Host "`n--- 5. PORTAL 4: CHECK-IN & BOARDING GATE TESTS ---" -ForegroundColor Yellow

# Ticket lookup (public/passenger verification)
Check "Ticket lookup for Ticket #$ticket2" GET "$base/api/checkin/lookup?ticketNumber=$ticket2" $null $null 200 "GATE"

# Boarding operation requires staff or admin role
Check "Unauthenticated user denied boarding action (401)" PATCH "$base/api/checkin/bookings/$booking2Id/board" $null $null 401 "Authentication token required"
Check "Passenger denied boarding action (403)" PATCH "$base/api/checkin/bookings/$booking2Id/board" $null $p1Token 403 "Requires one of the following roles: staff, admin"

# Authorized Staff performs boarding
Check "Staff authorizes and boards Ticket #$ticket2" PATCH "$base/api/checkin/bookings/$booking2Id/board" $null $staffToken 200 "BOARDED"

# Verify ticket lookup now reflects BOARDED status
Check "Verify lookup shows BOARDED status" GET "$base/api/checkin/lookup?ticketNumber=$ticket2" $null $null 200 "BOARDED"

# Boarding a cancelled booking must be rejected
Check "Boarding cancelled booking rejected (400)" PATCH "$base/api/checkin/bookings/$booking1Id/board" $null $staffToken 400 "Cannot board a cancelled booking"

# -----------------------------------------------------------------
# CLEANUP TEST RECORDS
# -----------------------------------------------------------------
Write-Host "`n--- CLEANING UP TEST DATA ---" -ForegroundColor Yellow
Invoke-Api DELETE "$base/bookings/$booking1Id" $null $adminToken | Out-Null
Invoke-Api DELETE "$base/bookings/$booking2Id" $null $adminToken | Out-Null
if ($p1PassengerId) { Invoke-Api DELETE "$base/passengers/$p1PassengerId" $null $adminToken | Out-Null }
$p2PassId = ($pass2Reg.body | ConvertFrom-Json).user.passengerId
if ($p2PassId) { Invoke-Api DELETE "$base/passengers/$p2PassId" $null $adminToken | Out-Null }
Invoke-Api DELETE "$base/api/admin/users/$p1Id" $null $adminToken | Out-Null
$p2UserId = ($pass2Reg.body | ConvertFrom-Json).user.id
Invoke-Api DELETE "$base/api/admin/users/$p2UserId" $null $adminToken | Out-Null
$hackId = ($hackReg.body | ConvertFrom-Json).user.id
Invoke-Api DELETE "$base/api/admin/users/$hackId" $null $adminToken | Out-Null
Write-Host "Test records cleaned up safely."

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " PORTALS & SECURITY TEST SUMMARY" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " PASSED : $pass" -ForegroundColor Green
Write-Host " FAILED : $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
Write-Host " TOTAL  : $($pass + $fail)"
if ($fail -eq 0) {
    Write-Host " STATUS : ALL PORTAL & SECURITY TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host " STATUS : $fail TESTS FAILED" -ForegroundColor Red
}
Write-Host "==========================================================" -ForegroundColor Cyan
