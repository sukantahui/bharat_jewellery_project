@echo off
setlocal EnableDelayedExpansion
title Bharat Jewellery POS - Git Safe Push

echo.
echo =========================================================================
echo   BHARAT JEWELLERY POS - SAFE REPOSITORY PUSH
echo =========================================================================
echo.

:: ---------------------------------------------------------------------------
:: Precaution 1: Check if Git is installed and available in PATH
:: ---------------------------------------------------------------------------
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git is not installed or not available in the system PATH.
    echo Please install Git or add it to PATH before running this script.
    echo.
    exit /b 1
)

:: ---------------------------------------------------------------------------
:: Precaution 2: Check if current directory is inside a Git repository
:: ---------------------------------------------------------------------------
git rev-parse --is-inside-work-tree >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Current directory is not a valid Git repository.
    echo Current path: %CD%
    echo.
    exit /b 1
)

:: ---------------------------------------------------------------------------
:: Precaution 3: Detect Active Branch and Guard Against Detached HEAD
:: ---------------------------------------------------------------------------
set "BRANCH="
for /f "tokens=*" %%b in ('git branch --show-current 2^>nul') do set "BRANCH=%%b"

if not defined BRANCH (
    for /f "tokens=*" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "BRANCH=%%b"
)

if "%BRANCH%"=="" (
    echo [ERROR] Unable to detect active branch or currently in detached HEAD state.
    echo Please checkout a valid branch before committing.
    echo.
    exit /b 1
)

if "%BRANCH%"=="HEAD" (
    echo [ERROR] You are currently in a detached HEAD state.
    echo Please checkout a valid branch like 'main' before pushing.
    echo.
    exit /b 1
)

:: ---------------------------------------------------------------------------
:: Precaution 4: Detect Configured Remote Repository
:: ---------------------------------------------------------------------------
set "REMOTE=origin"
git remote get-url %REMOTE% >nul 2>&1
if %ERRORLEVEL% equ 0 goto remote_ok

for /f "tokens=*" %%r in ('git remote 2^>nul') do (
    set "REMOTE=%%r"
    goto remote_ok
)

echo [ERROR] No Git remote repository is configured.
echo Add a remote repository using: git remote add origin ^<url^>
echo.
exit /b 1

:remote_ok
for /f "tokens=*" %%u in ('git remote get-url %REMOTE% 2^>nul') do set "REMOTE_URL=%%u"

echo [CONFIG] Active Branch : %BRANCH%
echo [CONFIG] Remote Target : %REMOTE% [%REMOTE_URL%]
echo.

:: ---------------------------------------------------------------------------
:: Step 1: Parse Commit Comment Argument
:: ---------------------------------------------------------------------------
set "SKIP_BUILD=0"
set "ARG1=%~1"

if /i "%ARG1%"=="--skip-build" (
    set "SKIP_BUILD=1"
    shift
)
if /i "%ARG1%"=="--no-verify" (
    set "SKIP_BUILD=1"
    shift
)

set "COMMIT_MSG=%~1"
shift
:collect_args
if not "%~1"=="" (
    set "COMMIT_MSG=!COMMIT_MSG! %~1"
    shift
    goto collect_args
)

if defined COMMIT_MSG goto check_msg_content

echo [INPUT NEEDED] No commit comment was provided as argument.
set /p "COMMIT_MSG=Enter commit comment: "
echo.

:check_msg_content
if not defined COMMIT_MSG (
    echo [ERROR] Commit comment cannot be empty.
    echo Usage: push.bat "Your commit message here"
    echo.
    exit /b 1
)

set "TEST_MSG=!COMMIT_MSG: =!"
if "!TEST_MSG!"=="" (
    echo [ERROR] Commit comment cannot consist solely of whitespace.
    echo Usage: push.bat "Your commit message here"
    echo.
    exit /b 1
)

echo [COMMENT] "!COMMIT_MSG!"
echo.

:: ---------------------------------------------------------------------------
:: Step 2: Check Working Tree and Pending Unpushed Commits
:: ---------------------------------------------------------------------------
set "HAS_WORKING_CHANGES=0"
for /f "tokens=*" %%s in ('git status --porcelain 2^>nul') do (
    set "HAS_WORKING_CHANGES=1"
)

set "UNPUSHED_COUNT=0"
for /f %%c in ('git rev-list --count %REMOTE%/%BRANCH%..HEAD 2^>nul') do (
    set "UNPUSHED_COUNT=%%c"
)

if "!HAS_WORKING_CHANGES!"=="1" goto do_build_check

if "!UNPUSHED_COUNT!"=="0" (
    echo [INFO] Working directory is clean and up to date with %REMOTE%/%BRANCH%.
    echo Nothing to commit or push.
    echo.
    exit /b 0
)

echo [INFO] No uncommitted working files, but !UNPUSHED_COUNT! unpushed commit^(s^) found.
echo Proceeding directly to remote synchronization and push...
echo.
goto pre_push_sync

:: ---------------------------------------------------------------------------
:: Precaution 5: Build and Type-Check Verification Gate
:: ---------------------------------------------------------------------------
:do_build_check
if "!SKIP_BUILD!"=="1" (
    echo [SKIP] Build validation skipped via flag.
    echo.
    goto do_stage
)

if not exist "package.json" goto do_stage

echo [1/5] Running TypeScript build validation: npm run build...
call npm run build
if !ERRORLEVEL! neq 0 (
    echo.
    echo [ERROR] Build validation failed. TypeScript or syntax errors detected.
    echo [PRECAUTION] Commit and push aborted to protect %REMOTE%/%BRANCH% from broken code.
    echo Please resolve the errors shown above before pushing.
    echo.
    exit /b 1
)
echo [OK] Build verification passed successfully.
echo.

:: ---------------------------------------------------------------------------
:: Step 3: Stage Modified and New Files
:: ---------------------------------------------------------------------------
:do_stage
echo [2/5] Staging changes: git add -A...
git add -A
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to stage files. Check file locks or permissions.
    echo.
    exit /b 1
)
echo [OK] All changes staged.
echo.

:: ---------------------------------------------------------------------------
:: Step 4: Commit with Provided Comment
:: ---------------------------------------------------------------------------
echo [3/5] Recording commit...
git commit -m "!COMMIT_MSG!"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git commit failed.
    echo.
    exit /b 1
)
echo [OK] Commit recorded successfully.
echo.

:: ---------------------------------------------------------------------------
:: Precaution 6: Safe Remote Sync (Pull with Rebase)
:: ---------------------------------------------------------------------------
:pre_push_sync
echo [4/5] Checking and synchronizing with remote %REMOTE%/%BRANCH%...
git fetch %REMOTE% %BRANCH% >nul 2>&1
if %ERRORLEVEL% neq 0 goto do_push

git pull --rebase %REMOTE% %BRANCH%
if !ERRORLEVEL! equ 0 (
    echo [OK] Local repository is in sync with remote.
    echo.
    goto do_push
)

echo.
echo [ERROR] Conflict detected between local commits and remote %REMOTE%/%BRANCH%!
echo [PRECAUTION] Aborting rebase to preserve your working tree safely.
git rebase --abort >nul 2>&1
echo Please pull and resolve merge conflicts manually: git pull %REMOTE% %BRANCH%
echo.
exit /b 1

:: ---------------------------------------------------------------------------
:: Step 5: Push to Remote Repository
:: ---------------------------------------------------------------------------
:do_push
echo [5/5] Pushing commits to %REMOTE% %BRANCH%...
git push %REMOTE% %BRANCH%
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Git push failed!
    echo Possible causes:
    echo   1. Network disconnection or timeout.
    echo   2. GitHub authentication or credentials expired.
    echo   3. Remote rejected push due to permissions or branch protections.
    echo.
    exit /b 1
)

:: ---------------------------------------------------------------------------
:: Success Summary
:: ---------------------------------------------------------------------------
for /f "tokens=*" %%h in ('git rev-parse --short HEAD 2^>nul') do set "COMMIT_HASH=%%h"

echo.
echo =========================================================================
echo   [SUCCESS] REPOSITORY PUSHED SUCCESSFULLY!
echo =========================================================================
echo   Commit Hash : !COMMIT_HASH!
echo   Branch      : %BRANCH%
echo   Remote      : %REMOTE% [%REMOTE_URL%]
echo   Comment     : "!COMMIT_MSG!"
echo =========================================================================
echo.

exit /b 0
