import { ElectronAPI } from '@electron-toolkit/preload';

// SpineSurge API exposed from preload script
interface SpinesurgeAPI {
    versions: {
        node: string;
        chrome: string;
        electron: string;
        app: string;
    };

    // File Dialog Operations
    selectDicomFolder: () => Promise<string | null>;
    selectDicomFiles: () => Promise<string[]>;
    selectSaveLocation: (
        defaultName: string,
        filters?: Array<{ name: string; extensions: string[] }>
    ) => Promise<string | null>;

    // File System Operations
    readFileAsArrayBuffer: (filePath: string) => Promise<ArrayBuffer>;
    readDirectory: (
        dirPath: string,
        recursive?: boolean
    ) => Promise<Array<{ path: string; name: string; isDirectory: boolean; size: number }>>;
    writeFile: (filePath: string, data: string | ArrayBuffer) => Promise<void>;
    mkdir: (dirPath: string) => Promise<void>;
    exists: (path: string) => Promise<boolean>;
    getAppDataPath: () => Promise<string>;

    // IPC Event Handlers
    onFileDrop: (callback: (paths: string[]) => void) => () => void;
    onProgress: (
        callback: (progress: { current: number; total: number; message: string }) => void
    ) => () => void;

    // Auto-Update Events
    onUpdateAvailable: (callback: (info: any) => void) => () => void;
    onUpdateReady: (callback: (info: any) => void) => () => void;
    onUpdateProgress: (callback: (progress: any) => void) => () => void;
    onUpdateError: (callback: (error: string) => void) => () => void;
    startUpdateDownload: () => Promise<void>;
    quitAndInstallUpdate: () => Promise<void>;
}

interface SurgicalAPI {
    /**
     * Opens native folder dialog for DICOM directory selection.
     */
    openDICOMFolder: () => Promise<string | null>;

    /**
     * Saves surgical plan JSON to 'Documents/SpineSurge_Plans'.
     */
    saveSurgicalPlan: (data: any) => Promise<{ success: boolean; path?: string; error?: string }>;

    /**
     * Retrieves hardware/system info for WebGL performance checking.
     */
    getSystemInfo: () => Promise<any>;
}

declare global {
    interface Window {
        electron: ElectronAPI;
        spinesurge: SpinesurgeAPI;
        surgicalAPI: SurgicalAPI;
    }
}

export { SpinesurgeAPI, SurgicalAPI };
