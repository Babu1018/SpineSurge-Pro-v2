# Now Start Program

This guide explains how to run the application in development mode, build it for production, and run it manually.

## 1. Development Mode (Run Dev)
To start the application in development mode with hot-reloading:
```powershell
npm run dev
```
> [!NOTE]
> This command uses `electron-vite` to start both the main and renderer processes.

## 2. Backend Server
The application requires a backend server to be running.
- **Using the batch script:**
  Run `start_server.bat` from the root directory.
- **Manually via terminal:**
  ```powershell
  cd server
  npm install  # (First time only)
  npm run start
  ```

## 3. Building the Application
There are three ways to build the application depending on your goal:

- **Build and Launch (Recommended for Testing):**
  ```powershell
  npm run build:start
  ```
  *Compiles the application and immediately opens it in preview mode.*

- **Build Output Only:**
  ```powershell
  npm run build
  ```
  *Generates compiled files in the `out` directory. **Note: This does not open the application.***

- **Full Release (Packaged Installer):**
  ```powershell
  npm run build-release
  ```
  *Compiles the application and creates a standalone installer using `electron-builder` in the `dist_electron` folder. **Note: This command builds the installer but does NOT open the app.***

- **Build and Launch Release (Unpacked):**
  ```powershell
  npm run build-release:start
  ```
  *Packages the application and then immediately launches the unpacked version from `dist_electron\win-unpacked`.*

## 4. Manual Execution
If you wish to run the application manually from the build output:
- **Preview build manually:**
  ```powershell
  npm run preview
  ```
- **Direct execution:**
  After running `npm run build-release`, you can find the executable installer or portable app in the `dist_electron` folder.
