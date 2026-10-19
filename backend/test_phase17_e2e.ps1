# ==============================================================================
# VYOMIRA — Smart Airline Management System
# Phase 17: Comprehensive End-to-End Test Suite
# Tests all scenarios mandated by the project specification
# ==============================================================================

$baseUrl = "http://localhost:5000"
$global:passed = 0
$global:failed = 0

function Report-Test($desc, $success, $detail = "") {
    if ($success) {
        $global:passed++
        Write-Host "  [PASS] $desc" -ForegroundColor Green
    } else {
        $global:failed++
        Write-Host "  [FAIL] $desc $detail" -ForegroundColor Red
    }
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "VYOMIRA Phase 17: Comprehensive End-to-End Test Suite" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# 1. Register or Log in as a Passenger
Write-Host "Scenario 1: Passenger Authentication..." -ForegroundColor Yellow
$passEmail = "passenger_e2e_" + (Get-Random) + "@vyomira.in"
$passUsername = "pass_e2e_" + (Get-Random)
$passPayload = @{
    name = "Test Passenger E2E"
    username = $passUsername
    email = $passEmail
    password = "Pass@123"
    age = 29
    phone = "9876500123"
    wheelchair = $false
    foodService = $true
} | ConvertTo-Json

try {
    $regRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $passPayload -ContentType "application/json"
    $passToken = $regRes.token
    Report-Test "Passenger registration succeeded with JWT" ($passToken -ne $null)
} catch {
    Report-Test "Passenger registration succeeded with JWT" $false $_.Exception.Message
}

# 2 & 3. Search flights & verify dataset expansion
Write-Host "`nScenario 2 & 3: Flight Search & Network Dataset..." -ForegroundColor Yellow
try {
    $flights = Invoke-RestMethod -Uri "$baseUrl/flights" -Method Get
    Report-Test "Retrieved flight list from database" ($flights.Count -ge 20) "(Found $($flights.Count) flights)"
    
    $hydDel = $flights | Where-Object { $_.source -eq "Hyderabad" -and $_.destination -eq "Delhi" }
    Report-Test "Expanded route exists: Hyderabad to Delhi" ($hydDel -ne $null)
    
    $delBom = $flights | Where-Object { $_.source -eq "Delhi" -and $_.destination -eq "Mumbai" }
    Report-Test "Expanded route exists: Delhi to Mumbai" ($delBom -ne $null)
    
    $bomGoa = $flights | Where-Object { $_.source -eq "Mumbai" -and $_.destination -eq "Goa" }
    Report-Test "Expanded route exists: Mumbai to Goa" ($bomGoa -ne $null)
    
    $dxbRoute = $flights | Where-Object { $_.destination -eq "Dubai" }
    Report-Test "Sample International route exists: to Dubai" ($dxbRoute -ne $null)
} catch {
    Report-Test "Flight search endpoint accessible" $false $_.Exception.Message
}

# 4 - 9. Travel Classes & Pricing Verification
Write-Host "`nScenario 4 - 9: Travel Classes & Authoritative Fare Verification..." -ForegroundColor Yellow
$flight101 = $flights | Where-Object { $_.flightId -eq 101 }
Report-Test "Flight 101 retrieved" ($flight101 -ne $null)

$econFare = $flight101.classes."Economy".fare
$premFare = $flight101.classes."Premium Economy".fare
$bizFare = $flight101.classes."Business Class".fare
$firstFare = $flight101.classes."First Class".fare

Report-Test "Economy fare is defined" ($econFare -ne $null) "Fare: ₹$econFare"
Report-Test "Premium Economy fare > Economy" ($premFare -gt $econFare) "₹$premFare > ₹$econFare"
Report-Test "Business Class fare > Premium Economy" ($bizFare -gt $premFare) "₹$bizFare > ₹$premFare"
Report-Test "First Class fare > Business Class" ($firstFare -gt $bizFare) "₹$firstFare > ₹$bizFare"

# Check minimum fare rule: every displayed fare >= 1000
$allFaresMin1000 = $true
foreach ($f in $flights) {
    if ($f.fare -lt 1000) { $allFaresMin1000 = $false; break }
    if ($f.classes) {
        if ($f.classes."Economy" -and $f.classes."Economy".fare -lt 1000) { $allFaresMin1000 = $false; break }
    }
}
Report-Test "Fare Rule: Every displayed flight fare is >= ₹1,000" $allFaresMin1000

# 10 - 14. Seat Selection, Passenger Booking & Persistence
Write-Host "`nScenario 10 - 14: Seat Selection, Booking & Persistence..." -ForegroundColor Yellow

# Find an available Business Class seat on Flight 101
$existingF101Bookings = Invoke-RestMethod -Uri "$baseUrl/flights/101/bookings" -Method Get
$occupiedSeats = $existingF101Bookings | Where-Object { $_.status -in @("CONFIRMED", "BOARDED") } | ForEach-Object { $_.seatNumber }
$availableBizSeats = 7..18 | Where-Object { $_ -notin $occupiedSeats }

if ($availableBizSeats.Count -eq 0) {
    # Pick any unoccupied seat
    $targetSeat = (1..60 | Where-Object { $_ -notin $occupiedSeats })[0]
} else {
    $targetSeat = $availableBizSeats[0]
}
Write-Host "  Selected available test seat: #$targetSeat on Flight 101" -ForegroundColor Gray

$passHeaders = @{ Authorization = "Bearer $passToken" }

# Make sure passenger profile exists
$passProfile = Invoke-RestMethod -Uri "$baseUrl/passengers" -Method Post -Body (@{
    name = "Test Passenger E2E"
    age = 29
    email = $passEmail
    phone = "9876500123"
    wheelchair = $false
    foodService = $true
} | ConvertTo-Json) -ContentType "application/json" -Headers $passHeaders

$bookingPayload = @{
    flightId = 101
    passengerId = $passProfile.passenger._id
    seatNumber = $targetSeat
    travelClass = "Business Class"
    wheelchair = $false
    foodService = $true
} | ConvertTo-Json

try {
    $bookingRes = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Post -Body $bookingPayload -ContentType "application/json" -Headers $passHeaders
    $newBooking = $bookingRes.booking
    Report-Test "Booking created with status CONFIRMED" ($newBooking.status -eq "CONFIRMED")
    Report-Test "Booking has bookingReference formatted (VY-XXXX)" ($newBooking.bookingReference -match "^VY-\d+") "Ref: $($newBooking.bookingReference)"
    Report-Test "Booking has travelClass = Business Class" ($newBooking.travelClass -eq "Business Class")
    Report-Test "Authoritative fare saved in database matches Business Class (₹12,000)" ($newBooking.fare -eq 12000) "Fare: ₹$($newBooking.fare)"
} catch {
    Report-Test "Booking created" $false $_.Exception.Message
}

# 13. Verify booking appears in My Bookings
try {
    $myBookings = Invoke-RestMethod -Uri "$baseUrl/api/passenger/my-bookings" -Method Get -Headers $passHeaders
    $foundMy = $myBookings | Where-Object { $_.seatNumber -eq $targetSeat -and $_.flightId -eq 101 }
    Report-Test "Booking appears in passenger's My Bookings" ($foundMy -ne $null)
    Report-Test "My Bookings has preserved confirmed fare ₹12,000" ($foundMy.fare -eq 12000)
} catch {
    Report-Test "My Bookings retrieval" $false $_.Exception.Message
}

# 15 - 18. Admin Login, Booking Visibility & Real-Time Notification
Write-Host "`nScenario 15 - 18: Admin Login & Notification Verification..." -ForegroundColor Yellow
$adminLoginPayload = @{
    login = "admin@airline.com"
    password = "AdminPassword@123"
} | ConvertTo-Json

try {
    $adminRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLoginPayload -ContentType "application/json"
    $adminToken = $adminRes.token
    $adminHeaders = @{ Authorization = "Bearer $adminToken" }
    Report-Test "Administrator authenticated successfully" ($adminToken -ne $null)
    
    # Check all bookings
    $adminBookings = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Get -Headers $adminHeaders
    $adminFoundBooking = $adminBookings | Where-Object { $_.seatNumber -eq $targetSeat -and $_.flightId -eq 101 }
    Report-Test "Administrator can see the passenger booking" ($adminFoundBooking -ne $null)
    
    # Check notifications
    $notifs = Invoke-RestMethod -Uri "$baseUrl/api/admin/notifications" -Method Get -Headers $adminHeaders
    $matchingNotif = $notifs | Where-Object { $_.seatNumber -eq $targetSeat -and ($_.ticketNumber -eq $newBooking.ticketNumber -or $_.bookingReference -eq $newBooking.bookingReference) }
    Report-Test "Administrator received real-time booking notification" ($matchingNotif -ne $null)
    
    if ($matchingNotif) {
        Report-Test "Notification contains passenger name" ($matchingNotif.passengerName -eq "Test Passenger E2E")
        Report-Test "Notification contains bookingReference" ($matchingNotif.bookingReference -eq $newBooking.bookingReference)
        Report-Test "Notification contains travelClass" ($matchingNotif.travelClass -eq "Business Class")
        Report-Test "Notification contains confirmed fare" ($matchingNotif.fare -eq 12000)
    }
} catch {
    Report-Test "Admin verification" $false $_.Exception.Message
}

# 19 - 20. Isolation & Security
Write-Host "`nScenario 19 - 20: Security & Cross-Passenger Privacy Isolation..." -ForegroundColor Yellow
$otherPassEmail = "other_pass_" + (Get-Random) + "@vyomira.in"
$otherPassRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body (@{
    name = "Other Passenger"
    username = "other_" + (Get-Random)
    email = $otherPassEmail
    password = "Pass@123"
} | ConvertTo-Json) -ContentType "application/json"
$otherHeaders = @{ Authorization = "Bearer $($otherPassRes.token)" }

# Other passenger checks their bookings
$otherBookings = Invoke-RestMethod -Uri "$baseUrl/api/passenger/my-bookings" -Method Get -Headers $otherHeaders
$crossLeak = $otherBookings | Where-Object { $_.seatNumber -eq $targetSeat -and $_.flightId -eq 101 }
Report-Test "Private Bookings: Other passenger cannot see test passenger's booking" ($crossLeak -eq $null)

# Other passenger attempts admin endpoint
$forbiddenAdminAccess = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/api/admin/notifications" -Method Get -Headers $otherHeaders
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        $forbiddenAdminAccess = $true
    }
}
Report-Test "RBAC Security: Ordinary passenger blocked from Admin endpoints (403 Forbidden)" $forbiddenAdminAccess

# 21 - 22. Concurrency: Duplicate Seat Reservation Prevention
Write-Host "`nScenario 21 - 22: Seat Concurrency & Double-Booking Prevention..." -ForegroundColor Yellow
$duplicateBlocked = $false
try {
    $dupPayload = @{
        flightId = 101
        seatNumber = $targetSeat
        travelClass = "Business Class"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Post -Body $dupPayload -ContentType "application/json" -Headers $otherHeaders
} catch {
    if ($_.Exception.Response.StatusCode.value__ -in @(400, 409)) {
        $duplicateBlocked = $true
    }
}
Report-Test "Concurrency Safety: Attempt to book already-reserved seat $targetSeat was rejected (409 Conflict)" $duplicateBlocked

# 24. Repeat Seeding Idempotency
Write-Host "`nScenario 24: Seeding Idempotency..." -ForegroundColor Yellow
$seedOutput = node config/seedFlights.js 2>&1
$flightsAfterSeed = Invoke-RestMethod -Uri "$baseUrl/flights" -Method Get
Report-Test "Re-running seed process does NOT create duplicate flights" ($flightsAfterSeed.Count -eq $flights.Count) "Flights count remained: $($flightsAfterSeed.Count)"

# 25. IndiGo Typo Check across complete codebase
Write-Host "`nScenario 25: IndiGo Typo Verification..." -ForegroundColor Yellow
$badWord = "Indi" + "fo"
$sourceFiles = Get-ChildItem -Path "d:\Airline-Project\backend", "d:\Airline-Project\frontend\src" -Recurse -File | 
    Where-Object { $_.FullName -notmatch "node_modules|\.git|transcript|\.log|test_phase17" }
$foundIndifo = $false
foreach ($f in $sourceFiles) {
    $content = Get-Content -Path $f.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -and $content.IndexOf($badWord, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
        $foundIndifo = $true
        Write-Host "Found in $($f.FullName)" -ForegroundColor Red
        break
    }
}
Report-Test "Zero unintended occurrences of 'Indifo' in backend and frontend code" (-not $foundIndifo)

# 26. Existing Bookings Intact
$bookingAfterSeed = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Get -Headers $adminHeaders
$intact = $bookingAfterSeed | Where-Object { $_.seatNumber -eq $targetSeat -and $_.flightId -eq 101 }
Report-Test "Existing bookings and confirmed fares remain intact after seed re-run" ($intact -ne $null -and $intact.fare -eq 12000)

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "PHASE 17 TEST RESULTS: $global:passed PASSED / $($global:passed + $global:failed) TOTAL" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

if ($global:failed -gt 0) {
    exit 1
} else {
    exit 0
}
