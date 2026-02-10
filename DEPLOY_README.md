# Deployment Guide

## 1. Prerequisites
Ensure the target machine has:
- **Windows 10/11** or **Server 2019+**
- **Python 3.10+** (Add to PATH during installation)
- **Node.js 20+** (LTS version recommended)
- **Google Chrome** (Required for the Twitter Bot)

## 2. Installation
1. Unzip the project folder.
2. Run **`INSTALL_DEPENDENCIES.bat`**.
   - This script installs all Python/Node libraries and builds the web app.
   - Wait for it to complete successfully.

## 3. Configuration
- Open `.env` (in root) and `web/.env.local`.
- Ensure your API keys (Polygon, Twitter/X) are correct.

## 4. Verification
- Run **`VERIFY_DEPLOYMENT.bat`** to perform a self-test of the system.
- If it says **[SUCCESS]**, you are ready.

## 5. Starting the App
- Navigate to `1_STARTUP_HUB`.
- Run **`01_MASTER_START.bat`**.
- The dashboard will open at `http://localhost:3000`.

## Troubleshooting
- **Database Locked?** Run `PREPARE_FOR_DELIVERY.bat` or `CLEAR_DB.bat` to reset handles.
- **Bot crashes?** Ensure Chrome is installed and updated.
