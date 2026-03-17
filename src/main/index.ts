import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { join, basename, extname } from 'path';
import { readdir, readFile, stat, writeFile, mkdir } from 'fs/promises';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import log from 'electron-log'; // Using electron-log for production-safe logging

// ============================================================================
// GPU Hardware Acceleration & WebGL Configuration for VTK.js
// ============================================================================

// Enable hardware acceleration for WebGL - critical for VTK.js performance
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// Enable high-performance GPU for VTK.js rendering
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('enable-accelerated-video-encode');

// WebGL2 support for advanced VTK.js features
app.commandLine.appendSwitch('enable-webgl2-compute-context');
app.commandLine.appendSwitch('enable-unsafe-webgpu'); // For future WebGPU support

// Memory and performance optimizations for large DICOM datasets
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=8192');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

// SharedArrayBuffer support (required by some medical imaging libraries)
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer');

// Disable features that may interfere with WebGL
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

function createWindow(): void {
    // Create the browser window with WebGL-optimized settings
    const mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        minWidth: 1200,
        minHeight: 800,
        show: false,
        autoHideMenuBar: true,
        backgroundColor: '#0a0a0a',
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
            // WebGL configuration
            webgl: true,
            // Enable SharedArrayBuffer for Cornerstone.js codecs
            webSecurity: true,
            allowRunningInsecureContent: false,
            // Performance optimizations
            backgroundThrottling: false,
            spellcheck: false,
        },
    });

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    // Development: load from Vite dev server
    // Production: load from built files
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    // Open DevTools ONLY in development mode
    if (is.dev) {
        mainWindow.webContents.openDevTools({ mode: 'right' });
    } else {
        // PRODUCTION HARDENING: Explicitly disable DevTools in production
        mainWindow.webContents.on('devtools-opened', () => {
            mainWindow.webContents.closeDevTools();
        });
    }

    // GPU information logging (Development only)
    if (is.dev) {
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.webContents
                .executeJavaScript(
                    `
            (function() {
              const canvas = document.createElement('canvas');
              const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
              if (gl) {
                const ext = gl.getExtension('WEBGL_debug_renderer_info');
                return {
                  renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'Unknown',
                  vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : 'Unknown',
                  version: gl.getParameter(gl.VERSION),
                  shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
                };
              }
              return null;
            })()
          `
                )
                .then((gpuInfo) => {
                    if (gpuInfo) {
                        console.log('🖥️ GPU Information for VTK.js:');
                        console.log(`   Renderer: ${gpuInfo.renderer}`);
                        console.log(`   Vendor: ${gpuInfo.vendor}`);
                        console.log(`   WebGL Version: ${gpuInfo.version}`);
                        console.log(`   GLSL Version: ${gpuInfo.shadingLanguageVersion}`);
                    }
                })
                .catch((err) => console.error('Failed to get GPU info:', err));
        });
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
    // PRODUCTION HARDENING: Disable default debug logs in production
    if (!is.dev) {
        console.log = () => { };
        console.debug = () => { };
        console.warn = () => { };
        // keep console.error for critical failures
    }

    // Set app user model id for windows
    electronApp.setAppUserModelId('com.spinesurge.pro');

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window);

        // PRODUCTION HARDENING: Prevent menu bar from appearing in production
        if (!is.dev) {
            window.setMenuBarVisibility(false);
        }
    });

    // Enable CORS and Headers for SharedArrayBuffer (DICOM)
    app.on('web-contents-created', (_event, contents) => {
        contents.session.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Cross-Origin-Opener-Policy': ['same-origin'],
                    'Cross-Origin-Embedder-Policy': ['require-corp']
                }
            });
        });
    });

    createWindow();

    // Start auto-update check
    if (!is.dev) {
        // setupAutoUpdater();
    }

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle GPU process crashes gracefully
app.on('child-process-gone', (_event, details) => {
    if (details.type === 'GPU') {
        console.error(`GPU process ${details.reason}. Restarting...`);
        app.relaunch();
        app.exit(0);
    }
});

// Handle renderer process crashes
app.on('render-process-gone', (_event, _webContents, details) => {
    console.error('Renderer process gone:', details.reason);
    if (details.reason === 'crashed') {
        app.relaunch();
        app.exit(0);
    }
});

// ============================================================================
// IPC Handlers for File System Access
// ============================================================================

ipcMain.handle('dialog:openDicomFolder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Folder Containing DICOM Series',
        buttonLabel: 'Select Folder',
    });

    if (result.canceled) {
        return null;
    }

    return result.filePaths[0];
});

ipcMain.handle('dialog:openDicomFiles', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        title: 'Select DICOM Files',
        buttonLabel: 'Open Files',
        filters: [
            { name: 'DICOM Files', extensions: ['dcm'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (result.canceled) {
        return [];
    }

    return result.filePaths;
});

ipcMain.handle('app:getDataPath', () => {
    return app.getPath('userData');
});

ipcMain.handle('fs:readDirectory', async (_event, { dirPath, recursive = false }) => {
    try {
        const entries: Array<{ path: string; name: string; isDirectory: boolean; size: number }> = [];

        async function scan(currentPath: string) {
            const files = await readdir(currentPath, { withFileTypes: true });

            for (const file of files) {
                const fullPath = join(currentPath, file.name);
                const stats = await stat(fullPath);

                if (file.isDirectory()) {
                    entries.push({
                        path: fullPath,
                        name: file.name,
                        isDirectory: true,
                        size: 0
                    });
                    if (recursive) {
                        await scan(fullPath);
                    }
                } else {
                    entries.push({
                        path: fullPath,
                        name: file.name,
                        isDirectory: false,
                        size: stats.size
                    });
                }
            }
        }

        await scan(dirPath);
        return entries;
    } catch (error) {
        console.error('Failed to read directory:', error);
        throw error;
    }
});

ipcMain.handle('fs:readFileAsArrayBuffer', async (_event, filePath) => {
    try {
        const buffer = await readFile(filePath);
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    } catch (error) {
        console.error('Failed to read file:', error);
        throw error;
    }
});

ipcMain.handle('fs:exists', async (_event, filePath) => {
    try {
        await stat(filePath);
        return true;
    } catch {
        return false;
    }
});
ipcMain.handle('dialog:saveFile', async (_event, { defaultName, filters }) => {
    const result = await dialog.showSaveDialog({
        defaultPath: defaultName,
        filters: filters || [
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['showOverwriteConfirmation', 'createDirectory']
    });

    if (result.canceled) {
        return null;
    }

    return result.filePath;
});

ipcMain.handle('fs:writeFile', async (_event, { filePath, data }) => {
    try {
        // Ensure parent directory exists
        const parentDir = join(filePath, '..');
        await mkdir(parentDir, { recursive: true });

        // Convert ArrayBuffer to Buffer if necessary
        const buffer = data instanceof ArrayBuffer
            ? Buffer.from(data)
            : typeof data === 'string'
                ? data
                : Buffer.from(data);

        await writeFile(filePath, buffer);
    } catch (error) {
        console.error('Failed to write file:', error);
        throw error;
    }
});

ipcMain.handle('fs:mkdir', async (_event, dirPath) => {
    try {
        await mkdir(dirPath, { recursive: true });
    } catch (error) {
        console.error('Failed to create directory:', error);
        throw error;
    }
});

// ============================================================================
// surgicalAPI - Strict IPC Handlers
// ============================================================================

/**
 * Native folder selection for DICOM datasets.
 * Strict naming: 'surgical:openDICOMFolder'
 */
ipcMain.handle('surgical:openDICOMFolder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select DICOM Dataset Folder',
        buttonLabel: 'Select Folder'
    });
    return result.canceled ? null : result.filePaths[0];
});

/**
 * Saves surgical planning data to the user's Documents directory.
 * Strict naming: 'surgical:saveSurgicalPlan'
 * Security: Enforces path sanitization and fixed directory location.
 */
ipcMain.handle('surgical:saveSurgicalPlan', async (_event, data) => {
    try {
        const documentsPath = app.getPath('documents');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        // Deterministic and safe filename
        const safeFileName = `surgical_plan_${timestamp}.json`;
        const fullPath = join(documentsPath, 'SpineSurge_Plans', safeFileName);

        // Ensure sub-directory exists
        await mkdir(join(documentsPath, 'SpineSurge_Plans'), { recursive: true });

        const jsonContent = JSON.stringify(data, null, 2);
        await writeFile(fullPath, jsonContent, 'utf8');

        return { success: true, path: fullPath };
    } catch (error) {
        console.error('Failed to save surgical plan:', error);
        return { success: false, error: (error as Error).message };
    }
});

/**
 * Returns GPU and system rendering capabilities.
 * Strict naming: 'surgical:getSystemInfo'
 */
ipcMain.handle('surgical:getSystemInfo', async () => {
    return {
        platform: process.platform,
        arch: process.arch,
        version: app.getVersion(),
        gpu: await app.getGPUInfo('basic'),
        memory: process.getProcessMemoryInfo()
    };
});

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
// Auto-Update System (electron-updater)
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

function setupAutoUpdater() {
    autoUpdater.logger = log;
    log.info('App starting...');

    autoUpdater.autoDownload = false; // Require user confirmation before download if needed, or download then ask

    autoUpdater.on('checking-for-update', () => {
        log.info('Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
        log.info('Update available.');
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
            mainWindow.webContents.send('update:available', info);
        }
    });

    autoUpdater.on('update-not-available', (info) => {
        log.info('Update not available.');
    });

    autoUpdater.on('error', (err) => {
        log.error('Error in auto-updater: ' + err);
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
            mainWindow.webContents.send('update:error', err.message);
        }
    });

    autoUpdater.on('download-progress', (progressObj) => {
        log.info(`Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`);
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
            mainWindow.webContents.send('update:progress', progressObj);
        }
    });

    autoUpdater.on('update-downloaded', (info) => {
        log.info('Update downloaded');
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
            mainWindow.webContents.send('update:ready', info);
        }
    });

    // Check for updates every 4 hours
    setInterval(() => {
        autoUpdater.checkForUpdates();
    }, 4 * 60 * 60 * 1000);

    // Initial check
    autoUpdater.checkForUpdates();
}

// IPC Handlers for Auto-Update lifecycle
ipcMain.handle('update:startDownload', () => {
    return autoUpdater.downloadUpdate();
});

ipcMain.handle('update:quitAndInstall', () => {
    autoUpdater.quitAndInstall();
});
