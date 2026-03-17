import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// ============================================================================
// SpineSurge Pro - Preload Script
// ============================================================================
// This preload script exposes a secure API to the renderer process.
// It bridges the Electron main process with the React renderer while
// maintaining context isolation for security.
//
// IMPLEMENTATION PLAN FOR LOCAL FILE ACCESS:
// ============================================================================
//
// Phase 1: Basic DICOM File Operations (CURRENT)
// ------------------------------------------------
// - [x] Expose basic Electron API via contextBridge
// - [ ] Implement file dialog for DICOM folder selection
// - [ ] Implement file dialog for single DICOM file selection
// - [ ] Implement drag-and-drop support for DICOM files
//
// Phase 2: DICOM Directory Reading
// ------------------------------------------------
// - [ ] Create IPC handler in main process for reading directories
// - [ ] Implement recursive directory traversal for DICOM series
// - [ ] Parse DICOMDIR files for study metadata
// - [ ] Create file watchers for live directory updates
//
// Phase 3: File System Operations
// ------------------------------------------------
// - [ ] Read file as ArrayBuffer (for DICOM parsing)
// - [ ] Read file as Buffer (for WADO-RS simulation)
// - [ ] Write files (for exported measurements, reports)
// - [ ] Create/read application data directory
// - [ ] Implement temporary file storage for large datasets
//
// Phase 4: Security & Validation
// ------------------------------------------------
// - [ ] Validate file paths are within allowed directories
// - [ ] Implement file type validation (only DICOM, images, JSON)
// - [ ] Add file size limits for memory safety
// - [ ] Sanitize file paths to prevent directory traversal attacks
//
// Phase 5: Performance Optimizations
// ------------------------------------------------
// - [ ] Implement streaming file reads for large DICOM files
// - [ ] Add worker thread support for parallel file processing
// - [ ] Implement file caching with LRU eviction
// - [ ] Add progress reporting for bulk file operations
//
// ============================================================================

// Custom APIs for SpineSurge renderer process
const spinesurgeAPI = {
    // -------------------------------------------------------------------------
    // Version & App Info
    // -------------------------------------------------------------------------
    versions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron,
        app: '1.0.0',
    },

    // -------------------------------------------------------------------------
    // File Dialog Operations (To be implemented)
    // -------------------------------------------------------------------------

    /**
     * Opens a dialog to select a DICOM folder
     * @returns Promise resolving to selected folder path or null if cancelled
     */
    selectDicomFolder: async (): Promise<string | null> => {
        return ipcRenderer.invoke('dialog:openDicomFolder');
    },

    /**
     * Opens a dialog to select DICOM files
     * @returns Promise resolving to array of selected file paths
     */
    selectDicomFiles: async (): Promise<string[]> => {
        return ipcRenderer.invoke('dialog:openDicomFiles');
    },

    /**
     * Opens a dialog to select a save location
     * @param defaultName - Default filename for the save dialog
     * @param filters - File type filters for the dialog
     * @returns Promise resolving to selected file path or null if cancelled
     */
    selectSaveLocation: async (
        defaultName: string,
        filters?: Array<{ name: string; extensions: string[] }>
    ): Promise<string | null> => {
        return ipcRenderer.invoke('dialog:saveFile', { defaultName, filters });
    },

    // -------------------------------------------------------------------------
    // File System Operations (To be implemented)
    // -------------------------------------------------------------------------

    /**
     * Reads a file as an ArrayBuffer (for DICOM parsing)
     * @param filePath - Absolute path to the file
     * @returns Promise resolving to file contents as ArrayBuffer
     */
    readFileAsArrayBuffer: async (filePath: string): Promise<ArrayBuffer> => {
        return ipcRenderer.invoke('fs:readFileAsArrayBuffer', filePath);
    },

    /**
     * Reads a directory and returns all file entries
     * @param dirPath - Absolute path to the directory
     * @param recursive - Whether to read subdirectories
     * @returns Promise resolving to array of file info objects
     */
    readDirectory: async (
        dirPath: string,
        recursive = false
    ): Promise<Array<{ path: string; name: string; isDirectory: boolean; size: number }>> => {
        return ipcRenderer.invoke('fs:readDirectory', { dirPath, recursive });
    },

    /**
     * Writes data to a file
     * @param filePath - Absolute path for the file
     * @param data - Data to write (string or ArrayBuffer)
     * @returns Promise resolving when write is complete
     */
    writeFile: async (filePath: string, data: string | ArrayBuffer): Promise<void> => {
        return ipcRenderer.invoke('fs:writeFile', { filePath, data });
    },

    /**
     * Creates a directory recursively
     * @param dirPath - Path to create
     * @returns Promise resolving when directory is created
     */
    mkdir: async (dirPath: string): Promise<void> => {
        return ipcRenderer.invoke('fs:mkdir', dirPath);
    },

    /**
     * Checks if a file or directory exists
     * @param path - Path to check
     * @returns Promise resolving to boolean
     */
    exists: async (path: string): Promise<boolean> => {
        return ipcRenderer.invoke('fs:exists', path);
    },

    /**
     * Gets the app's user data directory path
     * @returns Promise resolving to the user data directory path
     */
    getAppDataPath: async (): Promise<string> => {
        return ipcRenderer.invoke('app:getDataPath');
    },

    // -------------------------------------------------------------------------
    // IPC Event Handlers
    // -------------------------------------------------------------------------

    /**
     * Subscribes to file drop events from the main process
     * @param callback - Function to call when files are dropped
     * @returns Unsubscribe function
     */
    onFileDrop: (callback: (paths: string[]) => void): (() => void) => {
        const handler = (_event: Electron.IpcRendererEvent, paths: string[]) => callback(paths);
        ipcRenderer.on('files:dropped', handler);
        return () => ipcRenderer.removeListener('files:dropped', handler);
    },

    /**
     * Subscribes to progress updates for file operations
     * @param callback - Function to call with progress updates
     * @returns Unsubscribe function
     */
    onProgress: (
        callback: (progress: { current: number; total: number; message: string }) => void
    ): (() => void) => {
        const handler = (
            _event: Electron.IpcRendererEvent,
            progress: { current: number; total: number; message: string }
        ) => callback(progress);
        ipcRenderer.on('fs:progress', handler);
        return () => ipcRenderer.removeListener('fs:progress', handler);
    },

    // -------------------------------------------------------------------------
    // Auto-Update Events
    // -------------------------------------------------------------------------
    onUpdateAvailable: (callback: (info: any) => void) => {
        const handler = (_event: any, info: any) => callback(info);
        ipcRenderer.on('update:available', handler);
        return () => ipcRenderer.removeListener('update:available', handler);
    },
    onUpdateReady: (callback: (info: any) => void) => {
        const handler = (_event: any, info: any) => callback(info);
        ipcRenderer.on('update:ready', handler);
        return () => ipcRenderer.removeListener('update:ready', handler);
    },
    onUpdateProgress: (callback: (progress: any) => void) => {
        const handler = (_event: any, progress: any) => callback(progress);
        ipcRenderer.on('update:progress', handler);
        return () => ipcRenderer.removeListener('update:progress', handler);
    },
    onUpdateError: (callback: (error: string) => void) => {
        const handler = (_event: any, error: string) => callback(error);
        ipcRenderer.on('update:error', handler);
        return () => ipcRenderer.removeListener('update:error', handler);
    },
    startUpdateDownload: () => ipcRenderer.invoke('update:startDownload'),
    quitAndInstallUpdate: () => ipcRenderer.invoke('update:quitAndInstall'),
};

/**
 * secure surgicalAPI Bridge
 * Security Rationale:
 * 1. IPC isolation: Uses strict channels names prefixed with 'surgical:'.
 * 2. Data encapsulation: Renderer sends raw plan objects; Main process handles safe persistence.
 * 3. Narrow scoping: Only exposes functionally necessary bridges, preventing general OS access.
 */
const surgicalAPI = {
    /**
     * Triggers native OS folder picker.
     * Narrowly scoped to directory selection only.
     */
    openDICOMFolder: (): Promise<string | null> => {
        return ipcRenderer.invoke('surgical:openDICOMFolder');
    },

    /**
     * Persists plan data to safe 'Documents/SpineSurge_Plans' location.
     * Prevents arbitrary path injection by enforcing a deterministic main-process path logic.
     */
    saveSurgicalPlan: (data: any): Promise<{ success: boolean; path?: string; error?: string }> => {
        return ipcRenderer.invoke('surgical:saveSurgicalPlan', data);
    },

    /**
     * Returns read-only system information for rendering validation.
     * Prevents write-access to system configurations.
     */
    getSystemInfo: (): Promise<any> => {
        return ipcRenderer.invoke('surgical:getSystemInfo');
    }
};

// ============================================================================
// Context Bridge - Expose APIs to Renderer
// ============================================================================

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI);
        contextBridge.exposeInMainWorld('spinesurge', spinesurgeAPI);
        contextBridge.exposeInMainWorld('surgicalAPI', surgicalAPI);
    } catch (error) {
        console.error('Failed to expose APIs via contextBridge:', error);
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI;
    // @ts-ignore (define in dts)
    window.spinesurge = spinesurgeAPI;
    // @ts-ignore (define in dts)
    window.surgicalAPI = surgicalAPI;
}
