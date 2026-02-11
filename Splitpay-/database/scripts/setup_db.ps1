<#
.SYNOPSIS
    Setup script for SplitPay+ Database.
.DESCRIPTION
    This script prompts for MySQL credentials and executes the SQL scripts in the correct order.
#>

$ErrorActionPreference = "Stop"

Write-Host "SplitPay+ Database Setup" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Cyan

# Prompt for Credentials
$dbUser = Read-Host "Enter MySQL Username (default: root)"
if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "root" }

$dbPass = Read-Host "Enter MySQL Password (default: empty)" -AsSecureString

$dbHost = Read-Host "Enter MySQL Host (default: 127.0.0.1)"
if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "127.0.0.1" }

$dbName = Read-Host "Enter Database Name to Create/Use (default: splitpay_db)"
if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "splitpay_db" }

# Convert SecureString to PlainText for mysql.exe (Careful in prod, fine for local setup)
$dbPassPlain = ""
if ($dbPass) {
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass)
    $dbPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    [System.Runtime.InteropServices.Marshal]::FreeBSTR($bstr)
}

# Define Files in Order
$sqlFiles = @(
    "..\sql\01_schema.sql",
    "..\sql\02_user_group_procedures.sql",
    "..\sql\03_expense_procedures.sql",
    "..\sql\04_triggers.sql",
    "..\sql\05_views_functions.sql",
    "..\sql\06_settlement_logic.sql",
    "..\sql\07_seed_data.sql"
)

# Function to run query
function Run-Query {
    param (
        [string]$Query,
        [string]$File
    )
    
    $argsList = @("-h", $dbHost, "-u", $dbUser)
    if (-not [string]::IsNullOrWhiteSpace($dbPassPlain)) {
        $argsList += "-p$dbPassPlain"
    }

    # First, create DB if not exists (only for the setup)
    # We run this without selecting a DB first
    
    if ($Query) {
        $argsList += "-e", "$Query"
    }
    elseif ($File) {
        $argsList += "-D", $dbName, "-e", "source $File"
    }

    # Execute
    & mysql $argsList
}

try {
    Write-Host "`nCreating Database '$dbName' if it doesn't exist..." -ForegroundColor Yellow
    $createDbQuery = "CREATE DATABASE IF NOT EXISTS $dbName; USE $dbName;"
    
    # We need to pass the query specifically.
    # Note: Passing password via command line can be insecure in shared envs, 
    # but standard for simple local scripts.
    
    $setupArgs = @("-h", $dbHost, "-u", $dbUser)
    if (-not [string]::IsNullOrWhiteSpace($dbPassPlain)) {
        $setupArgs += "-p$dbPassPlain"
    }
    $setupArgs += "-e", $createDbQuery
    
    & mysql $setupArgs
    
    Write-Host "Database created/selected." -ForegroundColor Green

    # Loop through files
    foreach ($file in $sqlFiles) {
        $fullPath = Resolve-Path $file
        Write-Host "Executing $file..." -ForegroundColor Yellow
        
        $fileArgs = @("-h", $dbHost, "-u", $dbUser)
        if (-not [string]::IsNullOrWhiteSpace($dbPassPlain)) {
            $fileArgs += "-p$dbPassPlain"
        }
        $fileArgs += "-D", $dbName
        $fileArgs += "-e", "source $fullPath", "--force"

        
        # We use explicit Invoke-Expression or just call operator
        # The 'source' command in mysql client allows path with forward slashes usually.
        # Let's use Get-Content and pipe? No, 'source' is better for multi-statement delimiters.
        # But 'mysql -e "source ..."' works.
        
        # Adjust path for mysql (needs forward slashes or escaped backslashes)
        $mysqlPath = $fullPath.Path -replace "\\", "/"
        
        $finalArgs = @("-h", $dbHost, "-u", $dbUser)
        if (-not [string]::IsNullOrWhiteSpace($dbPassPlain)) {
             $finalArgs += "-p$dbPassPlain"
        }
        $finalArgs += "-D", $dbName
        $finalArgs += "-e", "source $mysqlPath"
        
        & mysql $finalArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Success: $file" -ForegroundColor Green
        } else {
            Write-Host "Error executing $file" -ForegroundColor Red
            # We might want to continue or stop?
            # Let's stop
            throw "MySQL Error"
        }
    }

    Write-Host "`nAll scripts executed successfully!" -ForegroundColor Cyan
    Write-Host "You can now verify the data:" -ForegroundColor Cyan
    Write-Host "  mysql -u $dbUser -p -D $dbName -e 'SELECT * FROM User;'" -ForegroundColor Gray

} catch {
    Write-Host "An error occurred: $_" -ForegroundColor Red
}
