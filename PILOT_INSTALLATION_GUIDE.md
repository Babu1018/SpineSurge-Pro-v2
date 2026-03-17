# SpineSurge Pro - Pilot Installation Guide

## 1. Purpose & Scope
This guide outlines the standard procedures for building, installing, updating, and validating **SpineSurge Pro** on macOS systems during the internal pilot phase.

**Scope of this Phase:**
*   **Platform:** macOS (Intel & Apple Silicon) only.
*   **Distribution:** Internal pilot testing (10–15 machines).
*   **Security:** Application is **unsigned**. Gatekeeper validation is manual.
*   **Update Method:** Manual re-installation via DMG.

---

## 2. Prerequisites
Before proceeding, ensure the host machine meets the following requirements:

*   **OS:** macOS 10.15 (Catalina) or later.
*   **Node.js:** Version 18+ (for building).
*   **Permissions:** Administrative access to install software in `/Applications`.

---

## 3. Build the Installer
To generate a new installer from the current source code:

1.  Open a terminal in the project root directory.
2.  Run the release build command:
    ```bash
    npm run build-release
    ```
3.  Wait for the process to complete (approx. 1–3 minutes).
4.  Verify the artifact exists:
    *   **Location:** `dist_electron/`
    *   **Filename:** `SpineSurge Pro-1.0.0.dmg` (or `SpineSurge Pro-1.0.0-arm64.dmg` for M1/M2/M3).

---

## 4. Install on Local macOS Machine

### Step 1: Mount the DMG
1.  Navigate to the `dist_electron/` folder.
2.  Double-click the generated `.dmg` file.
3.  A Finder window will open showing the **SpineSurge Pro** app icon and an arrow pointing to the **Applications** folder.

### Step 2: Install
1.  Drag the **SpineSurge Pro** icon into the **Applications** folder shortcut.
2.  Wait for the copy process to finish.

### Step 3: First Launch & Gatekeeper Bypass
Since the application is unsigned for this pilot, macOS Gatekeeper will block the first launch.

1.  Navigate to your **Applications** folder in Finder.
2.  Locate **SpineSurge Pro**.
3.  **Right-click (or Control-click)** the app icon and select **Open**.
4.  A warning dialog will appear: *"macOS cannot verify the developer of 'SpineSurge Pro'. Are you sure you want to open it?"*
5.  Click **Open**.

*Note: This bypass is only required once per installation/update. Subsequent launches can be done normally via Spotlight or Launchpad.*

---

## 5. Updating an Existing Installation
When a new build is available, follow the standard replacement workflow:

1.  Run `npm run build-release` to generate the new `.dmg`.
2.  Open the new `.dmg` file.
3.  Drag **SpineSurge Pro** to the **Applications** folder.
4.  When prompted *"An item named 'SpineSurge Pro' already exists"*:
    *   Click **Replace**.
5.  Perform the **Gatekeeper Bypass** (Step 3 above) again for the new version.

---

## 6. Post-Install Validation Checklist
Confirm the installation is successful by verifying the following:

- [ ] **Launch:** Application opens without crashing.
- [ ] **Clean UI:** No redundant window frames or developer menu bars are visible.
- [ ] **Version:** The installed version matches the version in `package.json`.
- [ ] **Persistence:** Application settings or local data remain intact after an update (unless explicitly cleared).
- [ ] **Uninstallation:** Dragging the app from Applications to Bin removes it correctly.

---

## 7. Expected Pilot-Phase Behaviors
 Testers should be aware of these standard behaviors during the pilot:

*   **"Unidentified Developer" Warning:** Expected on first launch due to lack of signing.
*   **Manual Updates:** The app will *notify* of updates (if configured) but will not auto-install them. Manual download and replacement is required.
*   **No Windows Support:** The current build chain is optimized for macOS only.

---

## 8. Rebuilding After Changes
The build process is deterministic. If you make changes to the source code:

1.  Save all files.
2.  Run `npm run build-release`.
3.  The previous `.dmg` in `dist_electron/` will be overwritten with the new version.
4.  Repeat sections **4** and **5** to test the changes.

---

## 9. TL;DR
1.  **Build:** `npm run build-release`
2.  **Install:** Drag `.dmg` content to Applications.
3.  **Update:** Drag & Replace.
4.  **Launch:** Right-click -> Open (to bypass Gatekeeper).
