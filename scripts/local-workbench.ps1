param(
  [int]$WorkbenchPort = 3001,
  [int]$BackendPort = 4096,
  [string]$EnvFile = $env:ZINGPOP_ENV_FILE
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot
$LogDir = Join-Path $RootDir ".cloud-logs"
$OpencodeConfigDir = Join-Path $RootDir "deploy\opencode"
$VerifyScript = Join-Path $RootDir "scripts\verify-zingpop-opencode-config.mjs"
$DefaultEnvFile = Join-Path $RootDir "deploy\env\zingpop.env.local"

function Resolve-LocalPath {
  param([string]$Path)

  if ([string]::IsNullOrWhiteSpace($Path)) {
    return ""
  }

  if ([System.IO.Path]::IsPathRooted($Path)) {
    return $Path
  }

  return Join-Path $RootDir $Path
}

function Import-EnvFile {
  param([string]$Path)

  if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path -LiteralPath $Path)) {
    return
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $Line = $_.Trim()
    if ([string]::IsNullOrWhiteSpace($Line) -or $Line.StartsWith("#")) {
      return
    }

    $Index = $Line.IndexOf("=")
    if ($Index -lt 1) {
      return
    }

    [Environment]::SetEnvironmentVariable(
      $Line.Substring(0, $Index).Trim(),
      $Line.Substring($Index + 1).Trim().Trim('"').Trim("'"),
      "Process"
    )
  }
}

function Assert-GlmRuntimeEnv {
  if (-not [string]::IsNullOrWhiteSpace($env:ZAI_API_KEY) -and $env:ZAI_API_KEY -ne "replace-with-official-glm-key") {
    return
  }

  throw "ZAI_API_KEY is required for local GLM requests. Set it in the shell, pass -EnvFile, or create deploy\env\zingpop.env.local."
}

function Stop-PortProcess {
  param([int]$Port)

  Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    Where-Object { $_ -and $_ -ne $PID } |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}

function Wait-Http {
  param(
    [string]$Url,
    [int]$Seconds = 45
  )

  $Deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $Deadline) {
    try {
      Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2 | Out-Null
      return
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  throw "Timed out waiting for $Url"
}

$BunCommand = Get-Command bun.exe -ErrorAction SilentlyContinue
if ($null -eq $BunCommand) {
  $BunCommand = Get-Command bun -ErrorAction Stop
}

& $BunCommand.Source $VerifyScript
Import-EnvFile -Path (Resolve-LocalPath $EnvFile)
if ([string]::IsNullOrWhiteSpace($EnvFile)) {
  Import-EnvFile -Path $DefaultEnvFile
}
Assert-GlmRuntimeEnv

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
Stop-PortProcess -Port $BackendPort
Stop-PortProcess -Port $WorkbenchPort

$env:OPENCODE_CONFIG_DIR = $OpencodeConfigDir
$env:OPENCODE_DISABLE_PROJECT_CONFIG = "1"
$env:VITE_OPENCODE_SERVER_HOST = "localhost"
$env:VITE_OPENCODE_SERVER_PORT = "$BackendPort"

$Backend = Start-Process -FilePath $BunCommand.Source `
  -ArgumentList @(
    "run",
    "--cwd",
    "packages/opencode",
    "--conditions=browser",
    "src/index.ts",
    "serve",
    "--hostname",
    "127.0.0.1",
    "--port",
    "$BackendPort",
    "--cors",
    "http://localhost:$WorkbenchPort",
    "--cors",
    "http://127.0.0.1:$WorkbenchPort"
  ) `
  -WorkingDirectory $RootDir `
  -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $LogDir "local-opencode-server.out.log") `
  -RedirectStandardError (Join-Path $LogDir "local-opencode-server.err.log") `
  -PassThru

$Workbench = Start-Process -FilePath $BunCommand.Source `
  -ArgumentList @(
    "run",
    "--cwd",
    "packages/app",
    "dev",
    "--",
    "--host",
    "127.0.0.1",
    "--port",
    "$WorkbenchPort"
  ) `
  -WorkingDirectory $RootDir `
  -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $LogDir "local-workbench.out.log") `
  -RedirectStandardError (Join-Path $LogDir "local-workbench.err.log") `
  -PassThru

Wait-Http -Url "http://127.0.0.1:$BackendPort/config/providers?directory=$([System.Uri]::EscapeDataString($RootDir))"
Wait-Http -Url "http://127.0.0.1:$WorkbenchPort/"

Write-Output "Workbench: http://127.0.0.1:$WorkbenchPort/"
Write-Output "Backend:   http://127.0.0.1:$BackendPort/"
Write-Output "Config:    $OpencodeConfigDir"
Write-Output "PIDs:      backend=$($Backend.Id) workbench=$($Workbench.Id)"
