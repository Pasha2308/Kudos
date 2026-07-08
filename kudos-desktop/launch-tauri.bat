@echo off
REM ── Kudos Desktop Pet — Tauri Dev Launcher ──────────────────────────
REM This script sets up the MSVC environment properly before running Tauri.
REM It finds the VS Build Tools vcvarsall.bat and initializes the full
REM C++ toolchain environment, then launches Tauri dev.

echo [Kudos] Setting up MSVC build environment...

REM Remove Git's link.exe from PATH conflict
set PATH=%PATH:C:\agent\Git\usr\bin;=%

REM Try to find vcvarsall.bat in common locations
set VCVARS=""

if exist "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" (
    set VCVARS="C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat"
    goto :found
)

if exist "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" (
    set VCVARS="C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat"
    goto :found
)

if exist "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" (
    set VCVARS="C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat"
    goto :found
)

if exist "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" (
    set VCVARS="C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvarsall.bat"
    goto :found
)

echo [ERROR] Could not find vcvarsall.bat!
echo Please install Visual Studio Build Tools with C++ workload.
pause
exit /b 1

:found
echo [Kudos] Found: %VCVARS%
call %VCVARS% x64

echo [Kudos] MSVC environment ready. Starting Tauri dev...
cd /d "%~dp0"
npm run tauri dev
