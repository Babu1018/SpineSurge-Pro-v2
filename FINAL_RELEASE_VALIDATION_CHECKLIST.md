# SpineSurge Pro - Final Release Validation Checklist

This checklist verifies the production readiness of SpineSurge Pro for medical and clinical environments. Each point must be validated on clean, non-development machines for both Windows 11 and macOS (Intel/Silicon).

## 1. Installation & Deployment
- [ ] **Fresh Install (Windows)**: NSIS installer runs, shows custom splash screen, and creates a desktop shortcut.
- [ ] **Fresh Install (macOS)**: DMG shows drag-to-applications layout; app opens without Gatekeeper/Unidentified Developer warnings.
- [ ] **Code Signing**: Verify the binary is signed by "SpineSurge" (Windows) or the registered Apple Team (macOS).
- [ ] **Notarization**: macOS app passes notarization check (`spctl --assess --type execute --verbose SpineSurge\ Pro.app`).

## 2. Security & Production Hardening
- [ ] **DevTools Disabled**: Right-click "Inspect" is unavailable, and `F12 / Cmd+Opt+I` does nothing.
- [ ] **Logging**: Terminal/Console does not output any clinical data or debug-level information. Only critical errors are logged to the file system.
- [ ] **Sandbox**: Browser process is correctly sandboxed with `contextIsolation` enabled.
- [ ] **Internal APIs**: Verify no Node.js APIs (e.g., `process.env`, `require('fs')`) are reachable from the renderer console.

## 3. Clinical Workflow & Rendering
- [ ] **DICOM Loading**: Local folder selection recursively finds and loads multi-series datasets correctly.
- [ ] **2D MPR View**: Axial, Sagittal, and Coronal views render smoothly with window/level adjustments.
- [ ] **3D Rendering**: VTK.js Volume Rendering or STL mesh overlays perform at >30 FPS on recommended hardware.
- [ ] **Measurement Persistence**: Saving a surgical plan to the "Documents/SpineSurge_Plans" directory succeeds with valid JSON content.

## 4. Auto-Update Integrity
- [ ] **Update Notification**: App correctly identifies a higher version release on GitHub.
- [ ] **Safety Interlock**: Update does not force-restart if a surgical plan is actively being modified.
- [ ] **Manual Confirmation**: User can download the update in the background and choose when to restart for installation.

## 5. Performance
- [ ] **Startup Time**: App reaches the login/dashboard screen in less than 3 seconds on standard SSD hardware.
- [ ] **Memory Footprint**: Base memory usage remains below 500MB during idle operation.
- [ ] **Binary Size**: Main process bundle is minimized; renderer uses code-splitting for large libs (VTK/Cornerstone).

---
**Approval Status**: ____________________
**Date**: ____________________
**Validator**: ____________________
