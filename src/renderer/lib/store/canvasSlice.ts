import { StateCreator } from 'zustand';
import { Measurement } from './types';
import type { AppState } from './index';

export interface CanvasSlice {
    currentImage: string | null;
    canvas: {
        zoom: number;
        rotation: number;
        brightness: number;
        contrast: number;
        sharpness: number;
        flipX: boolean;
        pan: { x: number; y: number };
        pixelToMm: number | null;
    };
    activeTool: string | null;
    selection: {
        type: 'point' | 'label' | 'curvatureHandle' | 'implant' | 'implant-point';
        measurementId: string;
        pointIndex?: number;
    } | null;
    measurements: Measurement[];
    implants: any[];
    undoTrigger: number;
    redoTrigger: number;
    isRightSidebarOpen: boolean;
    isLeftSidebarOpen: boolean;
    isToolbarDocked: boolean;
    isWizardVisible: boolean;
    isWizardIconVisible: boolean;
    activeDialog: string | null;
    managers: Record<string, any>;

    loadImage: (imageUrl: string) => void;
    clearImage: () => void;
    setActiveTool: (toolId: string | null) => void;
    setSelection: (selection: { type: 'point' | 'label' | 'curvatureHandle' | 'implant' | 'implant-point'; measurementId: string; pointIndex?: number } | null) => void;
    setZoom: (zoom: number) => void;
    setRotation: (rotation: number) => void;
    setBrightness: (brightness: number) => void;
    setContrast: (contrast: number) => void;
    setSharpness: (sharpness: number) => void;
    toggleFlipX: () => void;
    setPan: (x: number, y: number) => void;
    resetCanvas: () => void;
    undo: () => void;
    redo: () => void;
    setMeasurements: (measurements: Measurement[]) => void;
    setImplants: (implants: any[]) => void;
    deleteMeasurement: (id: string) => void;
    deleteImplant: (id: string) => void;
    toggleMeasurementSelection: (id: string, selected: boolean) => void;
    toggleRightSidebar: (isOpen?: boolean) => void;
    toggleLeftSidebar: (isOpen?: boolean) => void;
    toggleToolbarDock: () => void;
    setToolbarDocked: (docked: boolean) => void;
    toggleWizard: () => void;
    setWizardVisible: (visible: boolean) => void;
    setWizardIconVisible: (visible: boolean) => void;
    toggleWizardIcon: () => void;
    setActiveDialog: (dialogId: string | null) => void;
    setCalibration: (pixelToMm: number | null) => void;
    registerManager: (side: string, manager: any) => void;
    getManager: (side: string) => any;
}

export const createCanvasSlice: StateCreator<AppState, [], [], CanvasSlice> = (set) => ({
    currentImage: null,
    canvas: {
        zoom: 1,
        rotation: 0,
        brightness: 100,
        contrast: 100,
        sharpness: 0,
        flipX: false,
        pan: { x: 0, y: 0 },
        pixelToMm: null
    },
    activeTool: null,
    selection: null,
    measurements: [],
    implants: [],
    undoTrigger: 0,
    redoTrigger: 0,
    isRightSidebarOpen: true,
    isLeftSidebarOpen: true,
    isToolbarDocked: false,
    isWizardVisible: true,
    isWizardIconVisible: true,
    activeDialog: null,
    managers: {},

    loadImage: (imageUrl: string) => set((state) => {
        console.log('[CanvasSlice] loadImage called', imageUrl);
        console.log('[CanvasSlice] Current measurements count:', state.measurements.length);
        console.log('[CanvasSlice] Resetting canvas state...');
        return {
            currentImage: imageUrl,
            isDicomMode: false,
            dicomSeries: [],
            canvas: { ...state.canvas, zoom: 1, pan: { x: 0, y: 0 }, rotation: 0, brightness: 100, contrast: 100, sharpness: 0, flipX: false }
        };
    }),
    clearImage: () => set({ currentImage: null, isDicomMode: false, dicomSeries: [] }),
    setActiveTool: (toolId) => set({ activeTool: toolId }),
    setSelection: (selection) => set({ selection }),
    setZoom: (zoom) => set((state) => {
        if (state.isComparisonMode) {
            const side = state.activeCanvasSide;
            return {
                comparison: {
                    ...state.comparison,
                    [side]: { ...state.comparison[side], canvas: { ...state.comparison[side].canvas, zoom } }
                }
            };
        }
        return { canvas: { ...state.canvas, zoom } };
    }),
    setRotation: (rotation) => set((state) => {
        if (state.isComparisonMode) {
            const side = state.activeCanvasSide;
            return {
                comparison: {
                    ...state.comparison,
                    [side]: { ...state.comparison[side], canvas: { ...state.comparison[side].canvas, rotation } }
                }
            };
        }
        return { canvas: { ...state.canvas, rotation } };
    }),
    setBrightness: (brightness) => set((state) => {
        if (state.isComparisonMode) {
            const side = state.activeCanvasSide;
            return {
                comparison: {
                    ...state.comparison,
                    [side]: { ...state.comparison[side], canvas: { ...state.comparison[side].canvas, brightness } }
                }
            };
        }
        return { canvas: { ...state.canvas, brightness } };
    }),
    setContrast: (contrast) => set((state) => {
        if (state.isComparisonMode) {
            const side = state.activeCanvasSide;
            return {
                comparison: {
                    ...state.comparison,
                    [side]: { ...state.comparison[side], canvas: { ...state.comparison[side].canvas, contrast } }
                }
            };
        }
        return { canvas: { ...state.canvas, contrast } };
    }),
    setSharpness: (sharpness) => set((state) => {
        if (state.isComparisonMode) {
            const side = state.activeCanvasSide;
            return {
                comparison: {
                    ...state.comparison,
                    [side]: { ...state.comparison[side], canvas: { ...state.comparison[side].canvas, sharpness } }
                }
            };
        }
        return { canvas: { ...state.canvas, sharpness } };
    }),
    toggleFlipX: () => set((state) => {
        if (state.isComparisonMode) {
            const side = state.activeCanvasSide;
            return {
                comparison: {
                    ...state.comparison,
                    [side]: { ...state.comparison[side], canvas: { ...state.comparison[side].canvas, flipX: !state.comparison[side].canvas.flipX } }
                }
            };
        }
        return { canvas: { ...state.canvas, flipX: !state.canvas.flipX } };
    }),
    setPan: (x, y) => set((state) => {
        if (state.isComparisonMode) {
            const side = state.activeCanvasSide;
            return {
                comparison: {
                    ...state.comparison,
                    [side]: { ...state.comparison[side], canvas: { ...state.comparison[side].canvas, pan: { x, y } } }
                }
            };
        }
        return { canvas: { ...state.canvas, pan: { x, y } } };
    }),
    resetCanvas: () => set((state) => {
        const defaultCanvas = {
            zoom: 1,
            rotation: 0,
            brightness: 100,
            contrast: 100,
            sharpness: 0,
            flipX: false,
            pan: { x: 0, y: 0 },
            pixelToMm: state.isComparisonMode ? state.comparison[state.activeCanvasSide].canvas.pixelToMm : state.canvas.pixelToMm
        };
        if (state.isComparisonMode) {
            const side = state.activeCanvasSide;
            return {
                comparison: {
                    ...state.comparison,
                    [side]: { ...state.comparison[side], canvas: defaultCanvas }
                }
            };
        }
        return { canvas: defaultCanvas };
    }),
    undo: () => set((state) => ({ undoTrigger: state.undoTrigger + 1 })),
    redo: () => set((state) => ({ redoTrigger: state.redoTrigger + 1 })),
    setMeasurements: (measurements) => set((state) => {
        if (state.isComparisonMode) {
            const side = state.activeCanvasSide;
            return {
                comparison: {
                    ...state.comparison,
                    [side]: { ...state.comparison[side], measurements: measurements.map(m => m.selected === undefined ? { ...m, selected: true } : m) }
                }
            };
        }
        return {
            measurements: measurements.map(m => m.selected === undefined ? { ...m, selected: true } : m)
        };
    }),
    setImplants: (implants) => set((state) => {
        if (state.isComparisonMode) {
            const side = state.activeCanvasSide;
            return {
                comparison: {
                    ...state.comparison,
                    [side]: { ...state.comparison[side], implants }
                }
            };
        }
        return { implants };
    }),
    deleteMeasurement: (id) => set((state) => {
        if (state.isComparisonMode) {
            const side = state.activeCanvasSide;
            return {
                comparison: {
                    ...state.comparison,
                    [side]: { ...state.comparison[side], measurements: state.comparison[side].measurements.filter(m => m.id !== id) }
                }
            };
        }
        return { measurements: state.measurements.filter(m => m.id !== id) };
    }),
    deleteImplant: (id) => set((state) => {
        if (state.isComparisonMode) {
            const side = state.activeCanvasSide;
            return {
                comparison: {
                    ...state.comparison,
                    [side]: { ...state.comparison[side], implants: state.comparison[side].implants.filter(i => i.id !== id) }
                }
            };
        }
        return { implants: state.implants.filter(i => i.id !== id) };
    }),
    toggleMeasurementSelection: (id, selected) => set((state) => {
        if (state.isComparisonMode) {
            const side = state.activeCanvasSide;
            return {
                comparison: {
                    ...state.comparison,
                    [side]: { ...state.comparison[side], measurements: state.comparison[side].measurements.map(m => m.id === id ? { ...m, selected } : m) }
                }
            };
        }
        return { measurements: state.measurements.map(m => m.id === id ? { ...m, selected } : m) };
    }),
    toggleRightSidebar: (isOpen) => set((state) => ({
        isRightSidebarOpen: isOpen !== undefined ? isOpen : !state.isRightSidebarOpen
    })),
    toggleLeftSidebar: (isOpen) => set((state) => ({
        isLeftSidebarOpen: isOpen !== undefined ? isOpen : !state.isLeftSidebarOpen
    })),
    toggleToolbarDock: () => set((state) => ({
        isToolbarDocked: !state.isToolbarDocked
    })),
    setToolbarDocked: (docked: boolean) => set({ isToolbarDocked: docked }),
    toggleWizard: () => set((state) => ({ isWizardVisible: !state.isWizardVisible })),
    setWizardVisible: (visible) => set({ isWizardVisible: visible }),
    setWizardIconVisible: (visible: boolean) => set({ isWizardIconVisible: visible }),
    toggleWizardIcon: () => set((state) => ({ isWizardIconVisible: !state.isWizardIconVisible })),
    setActiveDialog: (dialogId) => set({ activeDialog: dialogId }),
    registerManager: (side, manager) => set((state) => ({
        managers: { ...state.managers, [side]: manager }
    })),
    getManager: (side) => {
        // Since we can't easily access state inside the function without 'get', we use a trick or just let the component call useAppStore
        return undefined; // Handled in component
    },
    setCalibration: (ratio) => set((state) => {
        const side = state.isComparisonMode ? state.activeCanvasSide : null;
        const currentMeasurements = side ? state.comparison[side].measurements : state.measurements;
        const updatedMeasurements = currentMeasurements.map(m => {
            if (m.toolKey === 'line' && m.points.length === 2) {
                const distPx = Math.sqrt(Math.pow(m.points[1].x - m.points[0].x, 2) + Math.pow(m.points[1].y - m.points[0].y, 2));
                return { ...m, result: ratio ? `DIST: ${(distPx * ratio).toFixed(1)} mm` : `DIST: ${distPx.toFixed(1)} px` };
            }
            if (m.toolKey === 'sva' && m.points.length === 2) {
                const distPx = Math.abs(m.points[0].x - m.points[1].x);
                return { ...m, result: ratio ? `SVA: ${(distPx * ratio).toFixed(1)} mm` : `SVA: ${distPx.toFixed(1)} px` };
            }
            return m;
        });

        if (state.isComparisonMode && side) {
            return {
                comparison: {
                    ...state.comparison,
                    [side]: {
                        ...state.comparison[side],
                        canvas: { ...state.comparison[side].canvas, pixelToMm: ratio },
                        measurements: updatedMeasurements
                    }
                }
            };
        }
        return {
            canvas: { ...state.canvas, pixelToMm: ratio },
            measurements: updatedMeasurements
        };
    }),
});
